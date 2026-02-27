import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { gateboxCreatePayout } from "../_shared/gatebox.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders });
}

function internalErrorResponse(message: string): Response {
  return jsonResponse({ error: message }, 500);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

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
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Não autorizado" }, 401);
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return jsonResponse({ error: "Token inválido" }, 401);
    }

    const payload = await req.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return jsonResponse({ error: "Payload inválido" }, 400);
    }

    const body = payload as Record<string, unknown>;
    const amount = Number(body.amount);
    const pixKey = typeof body.pixKey === "string" ? body.pixKey.trim() : "";
    const pixKeyType = typeof body.pixKeyType === "string" ? body.pixKeyType.trim().toLowerCase() : "";

    if (!Number.isFinite(amount) || amount < 10) {
      return jsonResponse({ error: "Valor mínimo para saque é R$ 10,00" }, 400);
    }

    if (!pixKey || !pixKeyType) {
      return jsonResponse({ error: "Chave PIX não informada" }, 400);
    }

    const userId = claimsData.claims.sub as string;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: wallet, error: walletError } = await supabaseAdmin
      .from("wallets")
      .select("id, balance")
      .eq("user_id", userId)
      .single();

    if (walletError || !wallet) {
      return jsonResponse({ error: "Carteira não encontrada" }, 404);
    }

    const { data: txs, error: txsError } = await supabaseAdmin
      .from("wallet_transactions")
      .select("amount, source_type, created_at")
      .eq("wallet_id", wallet.id)
      .order("created_at", { ascending: true });

    if (txsError) {
      console.error("Erro ao calcular saldo principal (wallet_transactions):", txsError);
      return internalErrorResponse("Erro ao verificar saldo disponível para saque");
    }

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
      return jsonResponse({ error: "Saldo principal insuficiente", availableBalance: normalizedPrincipal }, 400);
    }

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

    if (wdError || !withdrawal?.id) {
      console.error("Erro ao criar saque:", wdError ?? "Registro de saque sem id retornado");
      return internalErrorResponse("Erro ao registrar saque");
    }

    const newBalance = total - amount;

    const { error: updateWalletError } = await supabaseAdmin
      .from("wallets")
      .update({ balance: newBalance })
      .eq("id", wallet.id);

    if (updateWalletError) {
      console.error("Erro ao atualizar saldo da carteira:", updateWalletError);
      return internalErrorResponse("Erro ao atualizar saldo da carteira");
    }

    const { error: insertTxError } = await supabaseAdmin.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      amount: -amount,
      type: "withdrawal" as any,
      description: `Saque via PIX - ${pixKey}`,
      reference_id: withdrawal.id,
      source_type: "withdrawal",
    });

    if (insertTxError) {
      console.error("Erro ao registrar transação de saque:", insertTxError);
      return internalErrorResponse("Erro ao registrar transação do saque");
    }

    const gateboxConfig = getGateboxConfig();
    let payoutResult: { automatic: boolean; transactionId?: string; status?: string; endToEnd?: string } = {
      automatic: false,
    };

    if (gateboxConfig) {
      try {
        console.log("Tentando PIX out automático via Gatebox...", {
          externalId,
          amount,
          pixKeyType,
          pixKeyMasked: `${pixKey.slice(0, 4)}***`,
        });

        const payoutResponse = await gateboxCreatePayout(gateboxConfig, {
          externalId,
          amount,
          pixKey,
          pixKeyType,
          description: `Saque A BOA - R$ ${amount.toFixed(2)}`,
        });

        const transactionId = typeof payoutResponse.transactionId === "string" ? payoutResponse.transactionId : undefined;
        const status = typeof payoutResponse.status === "string" ? payoutResponse.status : undefined;
        const endToEnd = typeof payoutResponse.endToEnd === "string" ? payoutResponse.endToEnd : undefined;

        if (!transactionId && !status && !endToEnd) {
          throw new Error("Resposta da Gatebox em formato inesperado (sem transactionId/status/endToEnd)");
        }

        console.log("Gatebox PIX out sucesso:", payoutResponse);

        const { error: approveError } = await supabaseAdmin
          .from("user_withdrawals")
          .update({
            status: "approved",
            processed_at: new Date().toISOString(),
          })
          .eq("id", withdrawal.id);

        if (approveError) {
          console.error("Erro ao atualizar saque para approved após PIX out:", approveError);
        }

        payoutResult = {
          automatic: true,
          transactionId,
          status,
          endToEnd,
        };
      } catch (payoutError: unknown) {
        console.error("Gatebox PIX out falhou, saque ficará pendente para processamento manual:", {
          error: getErrorMessage(payoutError),
          externalId,
          withdrawalId: withdrawal.id,
        });

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

    return jsonResponse({
      success: true,
      message,
      withdrawalId: withdrawal.id,
      newBalance,
      automatic: payoutResult.automatic,
      gatebox: payoutResult.automatic
        ? {
            transactionId: payoutResult.transactionId,
            status: payoutResult.status,
            endToEnd: payoutResult.endToEnd,
          }
        : undefined,
    });
  } catch (error: unknown) {
    console.error("Erro não tratado em process-withdrawal:", error);
    return internalErrorResponse("Erro interno ao processar saque. Tente novamente em instantes.");
  }
});
