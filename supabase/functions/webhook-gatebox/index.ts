import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const rawBody = await req.text();
    console.log("Webhook Gatebox RAW body:", rawBody);

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      console.error("Webhook Gatebox: body não é JSON válido:", rawBody.substring(0, 500));
      return jsonResponse({ error: "Invalid JSON" }, 400);
    }

    // --- Extrair campos padronizados ---
    const transactionId =
      body.transactionId ||
      (body.transaction as Record<string, unknown>)?.transactionId ||
      body.id ||
      body.idTransaction;
    const externalId =
      body.externalId ||
      body.external_id ||
      (body.invoice as Record<string, unknown>)?.externalId ||
      (body.transaction as Record<string, unknown>)?.externalId;
    const endToEnd = body.endToEnd || body.end_to_end || (body.bankData as Record<string, unknown>)?.endtoendId;
    const status = ((body.status || (body.transaction as Record<string, unknown>)?.status || body.statusTransaction || "") as string).toLowerCase();
    const amount = body.amount ?? (body.transaction as Record<string, unknown>)?.amount ?? body.value ?? 0;
    const eventType = ((body.type || body.eventType || "") as string).toUpperCase();

    console.log("Webhook Gatebox parsed:", {
      transactionId,
      externalId,
      status,
      eventType,
      amount,
      endToEnd,
      bodyKeys: Object.keys(body),
    });

    if (!transactionId && !externalId && !endToEnd) {
      return jsonResponse({ message: "Payload sem identificador" });
    }

    const refs = [transactionId, externalId, endToEnd].filter(Boolean) as string[];

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- Determinar se é PIX IN (depósito) ou PIX OUT (saque) ---
    const isPayOut =
      eventType === "PIX_PAY_OUT" ||
      eventType === "TRANSFER" ||
      eventType === "PAYOUT" ||
      eventType === "WITHDRAW" ||
      (typeof externalId === "string" && externalId.startsWith("saque_"));

    const isFailed =
      status === "expired" ||
      status === "cancelled" ||
      status === "failed" ||
      status === "rejected" ||
      status === "error";

    const isPaid =
      eventType === "PIX_PAY_IN" ||
      status === "paid" ||
      status === "completed" ||
      status === "pago" ||
      status === "approved" ||
      body.paid === true ||
      body.completed === true;

    // ============================================================
    // PIX OUT (Saque) - Atualizar status em user_withdrawals
    // ============================================================
    if (isPayOut) {
      console.log("Webhook PIX OUT detectado:", { refs, status, isFailed });

      // Buscar saque pendente/approved pelo externalId pattern "saque_{userId}_{timestamp}"
      // Ou pelo transaction_id se armazenado
      let withdrawal: { id: string; user_id: string; amount: number; status: string } | null = null;

      // Tentar buscar por externalId na description ou pelo pattern
      if (externalId && externalId.startsWith("saque_")) {
        // Extrair userId do externalId: saque_{userId}_{timestamp}
        const parts = externalId.split("_");
        if (parts.length >= 3) {
          const userId = parts[1];
          const { data } = await supabaseAdmin
            .from("user_withdrawals")
            .select("id, user_id, amount, status")
            .eq("user_id", userId)
            .in("status", ["pending", "approved"])
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          if (data) withdrawal = data;
        }
      }

      if (!withdrawal) {
        console.warn("Saque não encontrado para webhook PIX OUT:", refs);
        return jsonResponse({ message: "Saque não encontrado" });
      }

      if (isFailed) {
        // Saque falhou na Gatebox: reverter saldo e marcar como rejeitado
        console.log("PIX OUT falhou, revertendo saldo:", {
          withdrawalId: withdrawal.id,
          amount: withdrawal.amount,
        });

        const { data: wallet } = await supabaseAdmin
          .from("wallets")
          .select("id, balance")
          .eq("user_id", withdrawal.user_id)
          .single();

        if (wallet) {
          const newBalance = Number(wallet.balance) + Number(withdrawal.amount);
          await supabaseAdmin
            .from("wallets")
            .update({ balance: newBalance })
            .eq("id", wallet.id);

          await supabaseAdmin.from("wallet_transactions").insert({
            wallet_id: wallet.id,
            amount: Number(withdrawal.amount),
            type: "refund" as any,
            description: `Estorno de saque falho - ${externalId || transactionId}`,
            reference_id: withdrawal.id,
            source_type: "withdrawal_reversal",
          });
        }

        await supabaseAdmin
          .from("user_withdrawals")
          .update({
            status: "rejected",
            rejection_reason: `Gatebox: ${status} (${eventType})`,
            processed_at: new Date().toISOString(),
          })
          .eq("id", withdrawal.id);

        console.log("Saque revertido e marcado como rejeitado:", withdrawal.id);
        return jsonResponse({ message: "Saque marcado como falho e saldo revertido" });
      }

      // Saque confirmado pela Gatebox
      if (isPaid || status === "completed" || status === "paid" || status === "approved") {
        await supabaseAdmin
          .from("user_withdrawals")
          .update({
            status: "paid" as any,
            processed_at: new Date().toISOString(),
          })
          .eq("id", withdrawal.id);

        console.log("Saque confirmado como pago:", withdrawal.id);
        return jsonResponse({ message: "Saque confirmado como pago" });
      }

      console.log("Status de saque não tratado:", status);
      return jsonResponse({ message: "Status de saque registrado" });
    }

    // ============================================================
    // PIX IN (Depósito) - Fluxo original
    // ============================================================

    // Eventos de falha
    if (isFailed) {
      let failedDeposit: { id: string } | null = null;
      for (const ref of refs) {
        const { data } = await supabaseAdmin
          .from("pix_deposits")
          .select("id")
          .eq("external_id", ref)
          .eq("status", "pending")
          .single();
        if (data) {
          failedDeposit = data;
          break;
        }
      }
      if (failedDeposit) {
        await supabaseAdmin
          .from("pix_deposits")
          .update({ status: "failed" })
          .eq("id", failedDeposit.id);
      }
      return jsonResponse({ message: "Depósito marcado como falho" });
    }

    // Depósito pago
    if (!isPaid) {
      return jsonResponse({ message: "Transação não paga, ignorando" });
    }

    // Buscar depósito pendente
    let deposit: { id: string; user_id: string; amount: number; external_id?: string; status?: string } | null = null;
    for (const ref of refs) {
      const { data } = await supabaseAdmin
        .from("pix_deposits")
        .select("id, user_id, amount, external_id, status")
        .eq("external_id", ref)
        .eq("status", "pending")
        .single();
      if (data) {
        deposit = data;
        break;
      }
    }

    if (!deposit && (transactionId || externalId)) {
      const { data: byTransactionId } = await supabaseAdmin
        .from("pix_deposits")
        .select("id, user_id, amount, external_id, status")
        .eq("transaction_id", transactionId || externalId)
        .eq("status", "pending")
        .single();
      if (byTransactionId) deposit = byTransactionId;
    }

    if (!deposit) {
      console.warn("Depósito não encontrado:", refs);
      return jsonResponse({ message: "Depósito não encontrado" });
    }

    if (deposit.status !== "pending") {
      return jsonResponse({ message: "Depósito já processado" });
    }

    const amountNum = Number(amount) || Number(deposit.amount);
    if (amountNum <= 0) {
      return jsonResponse({ error: "Valor inválido" }, 400);
    }

    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("id, balance")
      .eq("user_id", deposit.user_id)
      .single();

    if (!wallet) {
      console.error("Carteira não encontrada para user:", deposit.user_id);
      return jsonResponse({ error: "Carteira não encontrada" }, 500);
    }

    const newBalance = Number(wallet.balance) + amountNum;

    await supabaseAdmin.from("pix_deposits").update({
      status: "paid",
      paid_at: new Date().toISOString(),
    }).eq("id", deposit.id);

    await supabaseAdmin.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      amount: amountNum,
      type: "deposit",
      description: `Depósito via PIX Gatebox - ${deposit.external_id || transactionId}`,
      reference_id: null,
    });

    await supabaseAdmin
      .from("wallets")
      .update({ balance: newBalance })
      .eq("id", wallet.id);

    console.log(`PIX IN confirmado: user=${deposit.user_id} amount=${amountNum} newBalance=${newBalance}`);

    return jsonResponse({ message: "Depósito processado", newBalance });
  } catch (error) {
    console.error("Erro webhook Gatebox:", error);
    return jsonResponse({ error: "Erro interno" }, 500);
  }
});
