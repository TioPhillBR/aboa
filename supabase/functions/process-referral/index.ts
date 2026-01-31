import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessReferralRequest {
  referralCode: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const referredUserId = userData.user.id;

    // Parse request body
    const { referralCode } = (await req.json()) as ProcessReferralRequest;

    if (!referralCode) {
      return new Response(
        JSON.stringify({ error: "Código de indicação não fornecido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the referral code
    const { data: codeData, error: codeError } = await supabaseAdmin
      .from('referral_codes')
      .select('*')
      .eq('code', referralCode.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (codeError || !codeData) {
      return new Response(
        JSON.stringify({ error: "Código de indicação inválido ou inativo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const referrerId = codeData.user_id;
    const bonusAmount = codeData.bonus_per_referral || 5;

    // Check if user is trying to use their own code
    if (referrerId === referredUserId) {
      return new Response(
        JSON.stringify({ error: "Você não pode usar seu próprio código" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already used a referral code
    const { data: existingReferral } = await supabaseAdmin
      .from('referrals')
      .select('id')
      .eq('referred_id', referredUserId)
      .maybeSingle();

    if (existingReferral) {
      return new Response(
        JSON.stringify({ error: "Você já usou um código de indicação" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the referral record
    const { error: referralError } = await supabaseAdmin
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_id: referredUserId,
        referral_code_id: codeData.id,
        bonus_awarded: bonusAmount,
        bonus_awarded_at: new Date().toISOString(),
      });

    if (referralError) {
      console.error('Error creating referral:', referralError);
      return new Response(
        JSON.stringify({ error: "Erro ao registrar indicação" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update referral code uses count
    await supabaseAdmin
      .from('referral_codes')
      .update({ uses_count: (codeData.uses_count || 0) + 1 })
      .eq('id', codeData.id);

    // Get referrer's wallet
    const { data: referrerWallet } = await supabaseAdmin
      .from('wallets')
      .select('id, balance')
      .eq('user_id', referrerId)
      .single();

    // Get referred user's wallet
    const { data: referredWallet } = await supabaseAdmin
      .from('wallets')
      .select('id, balance')
      .eq('user_id', referredUserId)
      .single();

    // Credit bonus to referrer
    if (referrerWallet) {
      await supabaseAdmin
        .from('wallet_transactions')
        .insert({
          wallet_id: referrerWallet.id,
          amount: bonusAmount,
          type: 'deposit',
          description: 'Bônus de indicação - novo usuário cadastrado',
          source_type: 'referral',
          source_id: referredUserId,
        });

      await supabaseAdmin
        .from('wallets')
        .update({ balance: referrerWallet.balance + bonusAmount })
        .eq('id', referrerWallet.id);
    }

    // Credit bonus to referred user
    if (referredWallet) {
      await supabaseAdmin
        .from('wallet_transactions')
        .insert({
          wallet_id: referredWallet.id,
          amount: bonusAmount,
          type: 'deposit',
          description: 'Bônus de boas-vindas - código de indicação',
          source_type: 'referral',
          source_id: referrerId,
        });

      await supabaseAdmin
        .from('wallets')
        .update({ balance: referredWallet.balance + bonusAmount })
        .eq('id', referredWallet.id);
    }

    // Update profile with registration source
    await supabaseAdmin
      .from('profiles')
      .update({
        registration_source: 'referral',
        source_code: referralCode.toUpperCase(),
      })
      .eq('id', referredUserId);

    console.log(`Referral processed: ${referredUserId} referred by ${referrerId}, bonus: R$ ${bonusAmount} each`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Você ganhou R$ ${bonusAmount.toFixed(2)} de bônus!`,
        bonusAmount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing referral:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
