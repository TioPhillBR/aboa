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

    // Create client with user's token to verify they're an admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
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

    // Parse request body
    const { tables, confirmPhrase } = await req.json();

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

    // Create admin client with service role (bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get all admin user IDs
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
    const results: { table: string; success: boolean; message: string; deleted?: number }[] = [];

    // Define table cleanup order (respect foreign keys)
    const tableOrder = [
      // First delete child records
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
      // Then parent records
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
      // Finally profiles (last due to many FKs)
      "profiles",
    ];

    // Sort tables by order
    const sortedTables = tables.sort((a: string, b: string) => {
      const indexA = tableOrder.indexOf(a);
      const indexB = tableOrder.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    for (const table of sortedTables) {
      try {
        let query;
        
        // Tables that reference user_id and should preserve admin data
        const userIdTables = [
          "profiles", "user_locations", "user_sessions", "wallets", 
          "user_withdrawals", "payment_transactions", "support_tickets",
          "affiliates", "referral_codes"
        ];

        const sharerIdTables = ["share_tracking"];
        
        if (table === "profiles" && adminUserIds.length > 0) {
          // Delete non-admin profiles
          query = adminClient
            .from(table)
            .delete()
            .not("id", "in", `(${adminUserIds.join(",")})`);
        } else if (userIdTables.includes(table) && adminUserIds.length > 0) {
          query = adminClient
            .from(table)
            .delete()
            .not("user_id", "in", `(${adminUserIds.join(",")})`);
        } else if (sharerIdTables.includes(table) && adminUserIds.length > 0) {
          query = adminClient
            .from(table)
            .delete()
            .not("sharer_id", "in", `(${adminUserIds.join(",")})`);
        } else if (table === "wallet_transactions") {
          // Get admin wallet IDs first
          const { data: adminWallets } = await adminClient
            .from("wallets")
            .select("id")
            .in("user_id", adminUserIds);
          
          const adminWalletIds = adminWallets?.map((w) => w.id) || [];
          
          if (adminWalletIds.length > 0) {
            query = adminClient
              .from(table)
              .delete()
              .not("wallet_id", "in", `(${adminWalletIds.join(",")})`);
          } else {
            query = adminClient.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
          }
        } else if (table === "support_messages") {
          // Get admin ticket IDs first
          const { data: adminTickets } = await adminClient
            .from("support_tickets")
            .select("id")
            .in("user_id", adminUserIds);
          
          const adminTicketIds = adminTickets?.map((t) => t.id) || [];
          
          if (adminTicketIds.length > 0) {
            query = adminClient
              .from(table)
              .delete()
              .not("ticket_id", "in", `(${adminTicketIds.join(",")})`);
          } else {
            query = adminClient.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
          }
        } else if (table === "share_events") {
          // Get admin share tracking IDs
          const { data: adminShares } = await adminClient
            .from("share_tracking")
            .select("id")
            .in("sharer_id", adminUserIds);
          
          const adminShareIds = adminShares?.map((s) => s.id) || [];
          
          if (adminShareIds.length > 0) {
            query = adminClient
              .from(table)
              .delete()
              .not("share_tracking_id", "in", `(${adminShareIds.join(",")})`);
          } else {
            query = adminClient.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
          }
        } else if (table === "referrals") {
          // Get admin referral code IDs
          const { data: adminRefCodes } = await adminClient
            .from("referral_codes")
            .select("id")
            .in("user_id", adminUserIds);
          
          const adminRefCodeIds = adminRefCodes?.map((r) => r.id) || [];
          
          if (adminRefCodeIds.length > 0) {
            query = adminClient
              .from(table)
              .delete()
              .not("referral_code_id", "in", `(${adminRefCodeIds.join(",")})`);
          } else {
            query = adminClient.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
          }
        } else if (["affiliate_sales", "affiliate_withdrawals"].includes(table)) {
          // Get admin affiliate IDs
          const { data: adminAffiliates } = await adminClient
            .from("affiliates")
            .select("id")
            .in("user_id", adminUserIds);
          
          const adminAffiliateIds = adminAffiliates?.map((a) => a.id) || [];
          
          if (adminAffiliateIds.length > 0) {
            query = adminClient
              .from(table)
              .delete()
              .not("affiliate_id", "in", `(${adminAffiliateIds.join(",")})`);
          } else {
            query = adminClient.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
          }
        } else {
          // For other tables, delete all records
          query = adminClient.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
        }

        // Execute deletion
        const { error: deleteError } = await query;

        if (deleteError) {
          results.push({
            table,
            success: false,
            message: deleteError.message,
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
