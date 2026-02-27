import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { gateboxCreatePayout } from "../_shared/gatebox.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Autenticar usuário
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

    if (!amount || amount < 100) {
      return new Response(JSON.stringify({ error: "Valor mínimo para saque é R$ 100,00" }), {
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

    // Buscar carteira e verificar saldo principal
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

    // Calcular saldo principal (reproduz lógica do frontend)
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
        JSON.stringify({
          error: "Saldo principal insuficiente",
          availableBalance: normalizedPrincipal,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar registro de saque
    const externalId = `WD-${userId.substring(0, 8)}-${Date.now()}`;

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

    // Chamar Gatebox para fazer o payout
    const gateboxConfig = {
      username: Deno.env.get("GATEBOX_USERNAME")!,
      password: Deno.env.get("GATEBOX_PASSWORD")!,
      baseUrl: Deno.env.get("GATEBOX_BASE_URL") || "https://api.gatebox.com.br",
    };

    try {
      const payoutResult = await gateboxCreatePayout(gateboxConfig, {
        externalId,
        amount,
        pixKey,
        pixKeyType,
        description: `Saque A Boa - ${externalId}`,
      });

      console.log("Payout Gatebox:", payoutResult);

      // Deduzir do saldo
      const newBalance = total - amount;
      await supabaseAdmin
        .from("wallets")
        .update({ balance: newBalance })
        .eq("id", wallet.id);

      // Registrar transação na carteira
      await supabaseAdmin.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        amount: -amount,
        type: "refund",
        description: `Saque via PIX - ${pixKey}`,
        reference_id: withdrawal.id,
        source_type: "withdrawal",
      });

      // Atualizar status do saque
      await supabaseAdmin
        .from("user_withdrawals")
        .update({ status: "paid", processed_at: new Date().toISOString() })
        .eq("id", withdrawal.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Saque processado com sucesso",
          transactionId: payoutResult.transactionId,
          newBalance,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (payoutError) {
      console.error("Erro Gatebox payout:", payoutError);

      // Marcar saque como rejeitado
      await supabaseAdmin
        .from("user_withdrawals")
        .update({
          status: "rejected",
          rejection_reason: `Erro no gateway: ${(payoutError as Error).message}`,
        })
        .eq("id", withdrawal.id);

      return new Response(
        JSON.stringify({
          error: "Erro ao processar pagamento PIX",
          details: (payoutError as Error).message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erro process-withdrawal:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
