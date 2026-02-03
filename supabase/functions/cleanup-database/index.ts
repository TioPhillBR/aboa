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

        // Only preserve admin data if explicitly requested
        const shouldPreserveAdmin = preserveAdminData;

        // Helper to get delete query based on table and preserve settings
        const getDeleteQuery = (tableName: string) => {
          const query = adminClient.from(tableName as any);
          
          // Tables with user_id reference
          const userIdTables = [
            "user_locations", "user_sessions", "wallets", "wallet_transactions",
            "support_tickets", "user_withdrawals", "payment_transactions",
            "raffle_tickets", "scratch_chances", "referral_codes", "share_tracking"
          ];
          
          if (shouldPreserveAdmin && adminUserIds.length > 0) {
            if (tableName === "profiles") {
              return query.delete().not("id", "in", `(${adminUserIds.join(",")})`);
            }
            if (userIdTables.includes(tableName)) {
              return query.delete().not("user_id", "in", `(${adminUserIds.join(",")})`);
            }
          }
          
          // Delete all records (use dummy condition)
          return query.delete().neq("id", "00000000-0000-0000-0000-000000000000");
        };

        // List of supported tables
        const supportedTables = [
          "support_messages", "support_tickets", "wallet_transactions", "wallets",
          "user_withdrawals", "payment_transactions", "raffle_tickets", "raffle_prizes",
          "raffles", "scratch_chances", "scratch_symbols", "scratch_card_batches",
          "scratch_cards", "affiliate_sales", "affiliate_withdrawals", "affiliates",
          "referrals", "referral_codes", "share_events", "share_tracking",
          "user_locations", "user_sessions", "profiles"
        ];

        if (!supportedTables.includes(table)) {
          results.push({
            table,
            success: false,
            message: `Tabela não suportada: ${table}`,
          });
          continue;
        }

        deleteResult = await getDeleteQuery(table);

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
