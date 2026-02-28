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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  try { return JSON.stringify(error); } catch { return String(error); }
}

function getGateboxConfig(): { username: string; password: string; baseUrl?: string } | null {
  const username = Deno.env.get("GATEBOX_USERNAME");
  const password = Deno.env.get("GATEBOX_PASSWORD");
  if (!username || !password) return null;
  return { username, password, baseUrl: Deno.env.get("GATEBOX_BASE_URL") || "https://api.gatebox.com.br" };
}

function sanitizeName(name: string): string {
  return name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim() || "Usuario";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Auth — rápida, sem chamadas externas
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

    // 2. Parse payload
    const payload = await req.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return jsonResponse({ error: "Payload inválido" }, 400);
    }

    const body = payload as Record<string, unknown>;
    const amount = Number(body.amount);
    const pixKey = typeof body.pixKey === "string" ? body.pixKey.trim() : "";
    const pixKeyType = typeof body.pixKeyType === "string" ? body.pixKeyType.trim().toLowerCase() : "";

    if (!Number.isFinite(amount) || amount < 1) {
      return jsonResponse({ error: "Valor mínimo para saque é R$ 1,00" }, 400);
    }
    if (!pixKey || !pixKeyType) {
      return jsonResponse({ error: "Chave PIX não informada" }, 400);
    }

    const userId = claimsData.claims.sub as string;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 3. Buscar wallet, profile e transações EM PARALELO (single round-trip)
    const [walletResult, profileResult] = await Promise.all([
      supabaseAdmin.from("wallets").select("id, balance").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    ]);

    const wallet = walletResult.data;
    if (walletResult.error || !wallet) {
      return jsonResponse({ error: "Carteira não encontrada" }, 404);
    }

    const total = Number(wallet.balance);
    const recipientName = profileResult.data?.full_name || "Usuario";

    // 4. Calcular saldo principal vs bônus
    // Buscar transações SOMENTE se necessário (amount <= total)
    if (amount > total) {
      return jsonResponse({ error: "Saldo insuficiente", availableBalance: total }, 400);
    }

    const { data: txs } = await supabaseAdmin
      .from("wallet_transactions")
      .select("amount, source_type")
      .eq("wallet_id", wallet.id)
      .order("created_at", { ascending: true })
      .limit(10000);

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

    const normalizedBonus = Math.max(0, Math.min(bonus, total));
    const normalizedPrincipal = Math.max(0, total - normalizedBonus);

    if (amount > normalizedPrincipal) {
      return jsonResponse({ error: "Saldo principal insuficiente", availableBalance: normalizedPrincipal }, 400);
    }

    // 5. FLUXO OTIMIZADO: Chamar Gatebox PRIMEIRO (antes de debitar)
    const gateboxConfig = getGateboxConfig();
    const externalId = `saque_${userId}_${Date.now()}`;
    let payoutResult: { automatic: boolean; transactionId?: string; status?: string; endToEnd?: string } = {
      automatic: false,
    };

    if (gateboxConfig) {
      try {
        const sanitizedName = sanitizeName(recipientName);

        console.log("PIX OUT via Gatebox:", {
          externalId,
          amount,
          pixKeyType,
          name: sanitizedName,
        });

        const payoutResponse = await gateboxCreatePayout(gateboxConfig, {
          externalId,
          amount,
          key: pixKey,
          pixKeyType,
          name: sanitizedName,
          description: `Saque A BOA - R$ ${amount.toFixed(2)}`,
        });

        console.log("Gatebox PIX out OK:", payoutResponse);

        payoutResult = {
          automatic: true,
          transactionId: typeof payoutResponse.transactionId === "string" ? payoutResponse.transactionId : undefined,
          status: typeof payoutResponse.status === "string" ? payoutResponse.status : undefined,
          endToEnd: typeof payoutResponse.endToEnd === "string" ? payoutResponse.endToEnd : undefined,
        };
      } catch (payoutError: unknown) {
        console.error("Gatebox PIX out falhou:", getErrorMessage(payoutError));
        // Continua para processamento manual
        payoutResult = { automatic: false };
      }
    }

    // 6. APÓS Gatebox responder: debitar wallet + registrar saque + transação EM PARALELO
    const newBalance = total - amount;
    const withdrawalStatus = payoutResult.automatic ? "approved" : "pending";

    const [withdrawalResult, updateWalletResult, insertTxResult] = await Promise.all([
      supabaseAdmin
        .from("user_withdrawals")
        .insert({
          user_id: userId,
          amount,
          pix_key: pixKey,
          pix_key_type: pixKeyType,
          status: withdrawalStatus,
          processed_at: payoutResult.automatic ? new Date().toISOString() : null,
        })
        .select("id")
        .single(),
      supabaseAdmin
        .from("wallets")
        .update({ balance: newBalance })
        .eq("id", wallet.id),
      supabaseAdmin.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        amount: -amount,
        type: "withdrawal" as any,
        description: `Saque via PIX - ${pixKey}`,
        source_type: "withdrawal",
      }),
    ]);

    if (withdrawalResult.error) {
      console.error("Erro ao criar registro de saque:", withdrawalResult.error);
    }
    if (updateWalletResult.error) {
      console.error("Erro ao atualizar wallet:", updateWalletResult.error);
    }
    if (insertTxResult.error) {
      console.error("Erro ao inserir transação:", insertTxResult.error);
    }

    const message = payoutResult.automatic
      ? "Saque processado! O PIX será enviado em instantes."
      : "Saque registrado! Será processado em até 24 horas.";

    console.log("Saque finalizado:", {
      withdrawalId: withdrawalResult.data?.id,
      amount,
      newBalance,
      automatic: payoutResult.automatic,
    });

    // 7. Resposta imediata — sem operações extras
    return jsonResponse({
      success: true,
      message,
      withdrawalId: withdrawalResult.data?.id,
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
    return jsonResponse({ error: "Erro interno ao processar saque. Tente novamente em instantes." }, 500);
  }
});
