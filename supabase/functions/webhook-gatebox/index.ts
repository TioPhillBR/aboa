import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    const transactionId =
      body.transactionId ||
      body.transaction?.transactionId ||
      body.id ||
      body.idTransaction;
    const externalId =
      body.externalId ||
      body.external_id ||
      body.invoice?.externalId ||
      body.transaction?.externalId;
    const endToEnd = body.endToEnd || body.end_to_end || body.bankData?.endtoendId;
    const status = (body.status || body.transaction?.status || body.statusTransaction || "").toLowerCase();
    const amount = body.amount ?? body.transaction?.amount ?? body.value ?? 0;
    const eventType = (body.type || body.eventType || "").toUpperCase();

    console.log("Webhook Gatebox:", { transactionId, externalId, status, eventType, amount });

    if (!transactionId && !externalId && !endToEnd) {
      return new Response(JSON.stringify({ message: "Payload sem identificador" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const refs = [transactionId, externalId, endToEnd].filter(Boolean) as string[];

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Eventos de falha/expirado
    const isFailed =
      status === "expired" ||
      status === "cancelled" ||
      status === "failed" ||
      status === "rejected";

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
      return new Response(JSON.stringify({ message: "Transação marcada como falha" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Depósito pago: PIX_PAY_IN ou status paid/completed
    const isPaid =
      eventType === "PIX_PAY_IN" ||
      status === "paid" ||
      status === "completed" ||
      status === "pago" ||
      body.paid === true ||
      body.completed === true;

    if (!isPaid) {
      return new Response(JSON.stringify({ message: "Transação não paga, ignorando" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar depósito pendente
    let deposit: { id: string; user_id: string; amount: number; external_id?: string } | null = null;
    for (const ref of refs) {
      const { data } = await supabaseAdmin
        .from("pix_deposits")
        .select("id, user_id, amount, external_id")
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
        .select("id, user_id, amount, external_id")
        .eq("transaction_id", transactionId || externalId)
        .eq("status", "pending")
        .single();
      if (byTransactionId) deposit = byTransactionId;
    }

    if (!deposit) {
      console.warn("Depósito não encontrado:", refs);
      return new Response(JSON.stringify({ message: "Depósito não encontrado" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (deposit.status !== "pending") {
      return new Response(JSON.stringify({ message: "Depósito já processado" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amountNum = Number(amount) || Number(deposit.amount);
    if (amountNum <= 0) {
      return new Response(JSON.stringify({ error: "Valor inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("id, balance")
      .eq("user_id", deposit.user_id)
      .single();

    if (!wallet) {
      console.error("Carteira não encontrada para user:", deposit.user_id);
      return new Response(JSON.stringify({ error: "Carteira não encontrada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      description: `Depósito via PIX Gatebox - ${(deposit as { external_id?: string }).external_id || transactionId}`,
      reference_id: null,
    });

    await supabaseAdmin
      .from("wallets")
      .update({ balance: newBalance })
      .eq("id", wallet.id);

    console.log(`PIX confirmado: user=${deposit.user_id} amount=${amountNum}`);

    return new Response(
      JSON.stringify({ message: "Depósito processado", newBalance }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro webhook Gatebox:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
