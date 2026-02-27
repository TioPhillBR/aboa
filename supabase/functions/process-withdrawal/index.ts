import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { gateboxWithdraw } from "../_shared/gatebox.ts";

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

    // Buscar dados do perfil para a Gatebox
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, cpf")
      .eq("id", userId)
      .single();

    const fullName = profile?.full_name || "Cliente";
    const cpfLimpo = (profile?.cpf || "").replace(/\D/g, "");

    if (!cpfLimpo || cpfLimpo.length !== 11) {
      return new Response(
        JSON.stringify({ error: "CPF não cadastrado ou inválido. Atualize seu perfil antes de sacar." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gateboxConfig = getGateboxConfig();

    if (!gateboxConfig) {
      return new Response(
        JSON.stringify({ error: "Gateway de pagamento não configurado. Contate o suporte." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Chamar Gatebox PRIMEIRO (antes de debitar)
    const externalId = `saque_${userId}_${Date.now()}`;

    console.log("Iniciando PIX withdraw via Gatebox...", {
      externalId,
      amount,
      pixKeyType,
      pixKeyMasked: pixKey.substring(0, 4) + "***",
      cpfMasked: cpfLimpo.substring(0, 3) + "***",
    });

    let withdrawResponse;
    try {
      withdrawResponse = await gateboxWithdraw(gateboxConfig, {
        externalId,
        key: pixKey,
        name: fullName,
        description: `Saque A BOA - R$ ${amount.toFixed(2)}`,
        amount: parseFloat(amount.toFixed(2)),
        documentNumber: cpfLimpo,
      });

      console.log("Gatebox withdraw sucesso:", withdrawResponse);
    } catch (gateboxError: unknown) {
      const errorMsg = gateboxError instanceof Error ? gateboxError.message : String(gateboxError);
      console.error("Gatebox withdraw falhou:", errorMsg);
      // NÃO debitar - retornar erro ao usuário
      return new Response(
        JSON.stringify({ error: `Falha ao processar PIX: ${errorMsg}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Gatebox retornou sucesso - agora debitar carteira
    const newBalance = total - amount;
    await supabaseAdmin
      .from("wallets")
      .update({ balance: newBalance })
      .eq("id", wallet.id);

    // 3. Criar registro de saque como aprovado
    const { data: withdrawal, error: wdError } = await supabaseAdmin
      .from("user_withdrawals")
      .insert({
        user_id: userId,
        amount,
        pix_key: pixKey,
        pix_key_type: pixKeyType,
        status: "approved",
        processed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (wdError) {
      console.error("Erro ao registrar saque (PIX já enviado!):", wdError);
    }

    // 4. Registrar transação na carteira como withdrawal
    await supabaseAdmin.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      amount: -amount,
      type: "withdrawal" as any,
      description: `Saque via PIX - ${pixKey}`,
      reference_id: withdrawal?.id,
      source_type: "withdrawal",
      source_id: withdrawal?.id,
    });

    console.log("Saque finalizado com sucesso:", {
      withdrawalId: withdrawal?.id,
      amount,
      newBalance,
      gateboxTransactionId: withdrawResponse.transactionId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Saque processado! O PIX será enviado em instantes.",
        withdrawalId: withdrawal?.id,
        newBalance,
        gatebox: {
          transactionId: withdrawResponse.transactionId,
          status: withdrawResponse.status,
          endToEnd: withdrawResponse.endToEnd,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro process-withdrawal:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar saque" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
