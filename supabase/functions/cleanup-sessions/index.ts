import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INACTIVITY_MINUTES = 20;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the cutoff time (20 minutes ago)
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - INACTIVITY_MINUTES);

    console.log(`Cleaning up sessions inactive since: ${cutoffTime.toISOString()}`);

    // Find and update inactive sessions
    const { data: inactiveSessions, error: selectError } = await supabase
      .from("user_sessions")
      .select("id, user_id")
      .eq("is_active", true)
      .lt("last_activity_at", cutoffTime.toISOString());

    if (selectError) {
      console.error("Error fetching inactive sessions:", selectError);
      throw selectError;
    }

    console.log(`Found ${inactiveSessions?.length || 0} inactive sessions to clean up`);

    if (inactiveSessions && inactiveSessions.length > 0) {
      const sessionIds = inactiveSessions.map((s) => s.id);

      // Update all inactive sessions
      const { error: updateError } = await supabase
        .from("user_sessions")
        .update({
          is_active: false,
          session_ended_at: new Date().toISOString(),
        })
        .in("id", sessionIds);

      if (updateError) {
        console.error("Error updating sessions:", updateError);
        throw updateError;
      }

      console.log(`Successfully cleaned up ${sessionIds.length} inactive sessions`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        cleaned_sessions: inactiveSessions?.length || 0,
        cutoff_time: cutoffTime.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Session cleanup error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});