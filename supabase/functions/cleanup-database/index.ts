import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: adminRole, error: roleError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !adminRole) {
      return new Response(JSON.stringify({ error: "Forbidden - Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tables, confirmPhrase, preserveAdminData = false } = await req.json();

    if (confirmPhrase !== "LIMPAR DADOS") {
      return new Response(JSON.stringify({ error: "Invalid confirmation phrase" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return new Response(JSON.stringify({ error: "No tables specified" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get all admin user IDs (only used for profiles if preserveAdminData is true)
    const { data: adminRoles, error: adminError } = await adminClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminError) {
      return new Response(JSON.stringify({ error: "Failed to fetch admin users" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminUserIds = adminRoles?.map((r) => r.user_id) || [];
    const results: { table: string; success: boolean; message: string }[] = [];

    // Define table cleanup order (respect foreign keys)
    const tableOrder = [
      "support_messages",
      "wallet_transactions",
      "raffle_tickets",
      "raffle_prizes",
      "scratch_chances",
      "scratch_symbols",
      "scratch_card_batches",
      "affiliate_sales",
      "affiliate_withdrawals",
      "share_events",
      "referrals",
      "support_tickets",
      "user_withdrawals",
      "payment_transactions",
      "wallets",
      "user_locations",
      "user_sessions",
      "raffles",
      "scratch_cards",
      "affiliates",
      "referral_codes",
      "share_tracking",
      "profiles",
    ];

    const sortedTables = tables.sort((a: string, b: string) => {
      const indexA = tableOrder.indexOf(a);
      const indexB = tableOrder.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    for (const table of sortedTables) {
      try {
        let deleteResult;

        // Tables that ALWAYS preserve admin data (auth and permissions related)
        const alwaysPreserveAdminTables = ["profiles"];
        
        // Check if we should preserve admin data for this table
        const shouldPreserveAdmin = preserveAdminData || alwaysPreserveAdminTables.includes(table);

        if (table === "profiles" && adminUserIds.length > 0) {
          // Always preserve admin profiles
          deleteResult = await adminClient
            .from("profiles")
            .delete()
            .not("id", "in", `(${adminUserIds.join(",")})`);
        } else if (shouldPreserveAdmin && ["user_locations", "user_sessions"].includes(table) && adminUserIds.length > 0) {
          deleteResult = await adminClient
            .from(table as "user_locations" | "user_sessions")
            .delete()
            .not("user_id", "in", `(${adminUserIds.join(",")})`);
        } else if (table === "user_locations") {
          deleteResult = await adminClient.from("user_locations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else if (table === "user_sessions") {
          deleteResult = await adminClient.from("user_sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else if (table === "support_messages") {
          deleteResult = await adminClient.from("support_messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else if (table === "support_tickets") {
          deleteResult = await adminClient.from("support_tickets").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else if (table === "wallet_transactions") {
          deleteResult = await adminClient.from("wallet_transactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else if (table === "wallets") {
          deleteResult = await adminClient.from("wallets").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else if (table === "user_withdrawals") {
          deleteResult = await adminClient.from("user_withdrawals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else if (table === "payment_transactions") {
          deleteResult = await adminClient.from("payment_transactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else if (table === "raffle_tickets") {
          deleteResult = await adminClient.from("raffle_tickets").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else if (table === "raffle_prizes") {
          deleteResult = await adminClient.from("raffle_prizes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else if (table === "raffles") {
          deleteResult = await adminClient.from("raffles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else if (table === "scratch_chances") {
          deleteResult = await adminClient.from("scratch_chances").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else if (table === "scratch_symbols") {
          deleteResult = await adminClient.from("scratch_symbols").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else if (table === "scratch_card_batches") {
          deleteResult = await adminClient.from("scratch_card_batches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else if (table === "scratch_cards") {
          deleteResult = await adminClient.from("scratch_cards").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else if (table === "affiliate_sales") {
          deleteResult = await adminClient.from("affiliate_sales").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else if (table === "affiliate_withdrawals") {
          deleteResult = await adminClient.from("affiliate_withdrawals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else if (table === "affiliates") {
          deleteResult = await adminClient.from("affiliates").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else if (table === "referrals") {
          deleteResult = await adminClient.from("referrals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else if (table === "referral_codes") {
          deleteResult = await adminClient.from("referral_codes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else if (table === "share_events") {
          deleteResult = await adminClient.from("share_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else if (table === "share_tracking") {
          deleteResult = await adminClient.from("share_tracking").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } else {
          results.push({
            table,
            success: false,
            message: `Tabela não suportada: ${table}`,
          });
          continue;
        }

        if (deleteResult.error) {
          results.push({
            table,
            success: false,
            message: deleteResult.error.message,
          });
        } else {
          results.push({
            table,
            success: true,
            message: "Limpo com sucesso",
          });
        }
      } catch (err) {
        results.push({
          table,
          success: false,
          message: err instanceof Error ? err.message : "Erro desconhecido",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        success: failCount === 0,
        message: failCount === 0 
          ? `Limpeza concluída! ${successCount} tabelas limpas.`
          : `Limpeza parcial: ${successCount} sucesso, ${failCount} erros.`,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
