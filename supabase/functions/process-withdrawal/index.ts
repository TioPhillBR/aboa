import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { gateboxCreatePayout } from "../_shared/gatebox.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getGateboxConfig(): { username: string; password: string; baseUrl?: string } | null {
  const username = Deno.env.get("GATEBOX_USERNAME");
  const password = Deno.env.get("GATEBOX_PASSWORD");
  if (!username || !password) return null;
  return {
    username,
    password,
    baseUrl: Deno.env.get("GATEBOX_BASE_URL") || "https://api.gatebox.com.br",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const { amount, pixKey, pixKeyType } = await req.json();

    if (!amount || amount < 10) {
      return new Response(JSON.stringify({ error: "Valor mínimo para saque é R$ 10,00" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pixKey || !pixKeyType) {
      return new Response(JSON.stringify({ error: "Chave PIX não informada" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Buscar carteira
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from("wallets")
      .select("id, balance")
      .eq("user_id", userId)
      .single();

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ error: "Carteira não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calcular saldo principal (excluindo bônus)
    const { data: txs } = await supabaseAdmin
      .from("wallet_transactions")
      .select("amount, source_type, created_at")
      .eq("wallet_id", wallet.id)
      .order("created_at", { ascending: true });

    let principal = 0;
    let bonus = 0;

    for (const tx of txs || []) {
      const txAmount = Number(tx.amount ?? 0);
      if (txAmount > 0) {
        if (tx.source_type === "referral" || tx.source_type === "admin_bonus") {
          bonus += txAmount;
        } else {
          principal += txAmount;
        }
      } else if (txAmount < 0) {
        const debit = Math.abs(txAmount);
        if (tx.source_type === "bonus_used") {
          bonus = Math.max(0, bonus - debit);
        } else {
          const fromBonus = Math.min(bonus, debit);
          bonus -= fromBonus;
          principal = Math.max(0, principal - (debit - fromBonus));
        }
      }
    }

    const total = Number(wallet.balance);
    const normalizedBonus = Math.max(0, Math.min(bonus, total));
    const normalizedPrincipal = Math.max(0, total - normalizedBonus);

    if (amount > normalizedPrincipal) {
      return new Response(
        JSON.stringify({ error: "Saldo principal insuficiente", availableBalance: normalizedPrincipal }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar registro de saque
    const externalId = `saque_${userId}_${Date.now()}`;
    const { data: withdrawal, error: wdError } = await supabaseAdmin
      .from("user_withdrawals")
      .insert({
        user_id: userId,
        amount,
        pix_key: pixKey,
        pix_key_type: pixKeyType,
        status: "pending",
      })
      .select("id")
      .single();

    if (wdError) {
      console.error("Erro ao criar saque:", wdError);
      return new Response(JSON.stringify({ error: "Erro ao registrar saque" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduzir saldo imediatamente
    const newBalance = total - amount;
    await supabaseAdmin
      .from("wallets")
      .update({ balance: newBalance })
      .eq("id", wallet.id);

    // Registrar transação na carteira
    await supabaseAdmin.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      amount: -amount,
      type: "withdrawal" as any,
      description: `Saque via PIX - ${pixKey}`,
      reference_id: withdrawal.id,
      source_type: "withdrawal",
    });

    // Tentar PIX out automático via Gatebox
    const gateboxConfig = getGateboxConfig();
    let payoutResult: { automatic: boolean; transactionId?: string; status?: string } = {
      automatic: false,
    };

    if (gateboxConfig) {
      try {
        console.log("Tentando PIX out automático via Gatebox...", {
          externalId,
          amount,
          pixKeyType,
          pixKeyMasked: pixKey.substring(0, 4) + "***",
        });

        const payoutResponse = await gateboxCreatePayout(gateboxConfig, {
          externalId,
          amount,
          pixKey,
          pixKeyType,
          description: `Saque A BOA - R$ ${amount.toFixed(2)}`,
        });

        console.log("Gatebox PIX out sucesso:", payoutResponse);

        // Atualizar status do saque para aprovado/processando
        await supabaseAdmin
          .from("user_withdrawals")
          .update({
            status: "approved",
            processed_at: new Date().toISOString(),
          })
          .eq("id", withdrawal.id);

        payoutResult = {
          automatic: true,
          transactionId: payoutResponse.transactionId,
          status: payoutResponse.status,
        };
      } catch (payoutError: unknown) {
        const errorMsg = payoutError instanceof Error ? payoutError.message : String(payoutError);
        console.error("Gatebox PIX out falhou, saque ficará pendente para processamento manual:", errorMsg);
        
        // Saque permanece como pending para processamento manual
        payoutResult = { automatic: false };
      }
    } else {
      console.log("Gatebox não configurado, saque registrado para processamento manual");
    }

    const message = payoutResult.automatic
      ? "Saque processado! O PIX será enviado em instantes."
      : "Saque registrado! Será processado em até 24 horas.";

    console.log("Saque finalizado:", {
      withdrawalId: withdrawal.id,
      amount,
      newBalance,
      automatic: payoutResult.automatic,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message,
        withdrawalId: withdrawal.id,
        newBalance,
        automatic: payoutResult.automatic,
        gatebox: payoutResult.automatic ? { transactionId: payoutResult.transactionId, status: payoutResult.status } : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro process-withdrawal:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
