import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;
    const { externalId, transactionId } = (await req.json()) as {
      externalId?: string;
      transactionId?: string;
    };

    const ref = externalId || transactionId;
    if (!ref) {
      return new Response(
        JSON.stringify({ error: "externalId ou transactionId obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let deposit: { id: string; status: string; amount: number; paid_at: string | null } | null = null;
    const { data: byExternal } = await supabase
      .from("pix_deposits")
      .select("id, status, amount, paid_at")
      .eq("external_id", ref)
      .eq("user_id", userId)
      .single();
    if (byExternal) deposit = byExternal;
    if (!deposit) {
      const { data: byTx } = await supabase
        .from("pix_deposits")
        .select("id, status, amount, paid_at")
        .eq("transaction_id", ref)
        .eq("user_id", userId)
        .single();
      if (byTx) deposit = byTx;
    }

    if (!deposit) {
      return new Response(
        JSON.stringify({ status: "not_found", paid: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paid = deposit.status === "paid";

    return new Response(
      JSON.stringify({
        status: deposit.status,
        paid,
        amount: deposit.amount,
        paidAt: deposit.paid_at,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error check-deposit-status:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
