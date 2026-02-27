import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { gateboxCreatePix } from "../_shared/gatebox.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PixRequest {
  amount: number;
}

interface PixResponse {
  transactionId: string;
  qrCode: string;
  qrCodeBase64: string;
  copyPasteCode: string;
  amount: number;
  expiresAt: string;
  externalId?: string;
  useGatebox?: boolean;
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

function generateSimpleQR(data: string): string {
  const size = 200;
  const moduleSize = 4;
  const modules = 41;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;
  const hash = simpleHash(data);
  svg += drawFinderPattern(0, 0, moduleSize);
  svg += drawFinderPattern(size - 7 * moduleSize, 0, moduleSize);
  svg += drawFinderPattern(0, size - 7 * moduleSize, moduleSize);
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      if ((row < 8 && col < 8) || (row < 8 && col > modules - 9) || (row > modules - 9 && col < 8)) continue;
      const idx = row * modules + col;
      const shouldFill = ((hash >> (idx % 30)) ^ (idx * 7)) % 3 === 0;
      if (shouldFill) {
        const x = col * moduleSize + 8;
        const y = row * moduleSize + 8;
        svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
      }
    }
  }
  const centerX = size / 2;
  const centerY = size / 2;
  svg += `<circle cx="${centerX}" cy="${centerY}" r="15" fill="white"/>`;
  svg += `<text x="${centerX}" y="${centerY + 4}" text-anchor="middle" font-size="12" font-weight="bold" fill="#32BCAD">PIX</text>`;
  svg += `</svg>`;
  return svg;
}

function drawFinderPattern(x: number, y: number, moduleSize: number): string {
  let s = "";
  s += `<rect x="${x + 8}" y="${y + 8}" width="${7 * moduleSize}" height="${7 * moduleSize}" fill="black"/>`;
  s += `<rect x="${x + moduleSize + 8}" y="${y + moduleSize + 8}" width="${5 * moduleSize}" height="${5 * moduleSize}" fill="white"/>`;
  s += `<rect x="${x + 2 * moduleSize + 8}" y="${y + 2 * moduleSize + 8}" width="${3 * moduleSize}" height="${3 * moduleSize}" fill="black"/>`;
  return s;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

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

    const { amount } = (await req.json()) as PixRequest;
    if (!amount || amount < 5) {
      return new Response(
        JSON.stringify({ error: "Valor mínimo é R$ 5,00" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gateboxConfig = getGateboxConfig();

    if (gateboxConfig) {
      // Usar Gatebox real
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, cpf, phone")
        .eq("id", userId)
        .single();

      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      const email = authUser?.user?.email || "";

      const externalId = `deposito_${userId}_${Date.now()}`;
      const cpfLimpo = (profile?.cpf || "").replace(/\D/g, "");

      // Validar CPF: deve ter exatamente 11 dígitos numéricos
      const cpfValido = cpfLimpo.length === 11 && /^\d{11}$/.test(cpfLimpo) && !/^(\d)\1{10}$/.test(cpfLimpo);

      let pixPayload: Record<string, unknown>;

      if (cpfValido) {
        // CPF válido: enviar dados completos do beneficiário
        pixPayload = {
          externalId,
          amount: parseFloat(amount.toFixed(2)),
          document: cpfLimpo,
          name: profile?.full_name || "Cliente",
          email: email || undefined,
          phone: phoneFormatted || undefined,
          identification: `Depósito - ${profile?.full_name || "Cliente"}`,
          expire: 3600,
          description: `Depósito A BOA - R$ ${amount.toFixed(2)}`,
        };
      } else {
        // CPF ausente ou inválido: fluxo "pagador diferente" sem documento
        console.log("CPF ausente ou inválido, usando fluxo sem documento");
        pixPayload = {
          externalId,
          amount: parseFloat(amount.toFixed(2)),
          identification: `Depósito - ${profile?.full_name || "Cliente"}`,
          expire: 3600,
          description: `Depósito A BOA - R$ ${amount.toFixed(2)}`,
        };
      }

      try {
        const pixResponse = await gateboxCreatePix(gateboxConfig, pixPayload as any);

        const qrCodeText = pixResponse.qrCodeText || pixResponse.qrCode;
        const transactionId = pixResponse.transactionId || externalId;

        if (!qrCodeText) {
          throw new Error("QR Code não retornado pela Gatebox");
        }

        // Gerar imagem QR a partir do texto (Gatebox pode retornar base64)
        let qrCodeBase64: string;
        if (pixResponse.qrCode && pixResponse.qrCode.startsWith("data:image")) {
          qrCodeBase64 = pixResponse.qrCode;
        } else {
          const qrCodeSvg = generateSimpleQR(qrCodeText);
          qrCodeBase64 = `data:image/svg+xml;base64,${btoa(qrCodeSvg)}`;
        }

        const expiresAt = pixResponse.expiresAt || new Date(Date.now() + 3600 * 1000).toISOString();

        await supabaseAdmin.from("pix_deposits").insert({
          user_id: userId,
          amount: parseFloat(amount.toFixed(2)),
          external_id: externalId,
          transaction_id: transactionId,
          status: "pending",
        });

        const response: PixResponse = {
          transactionId,
          qrCode: qrCodeText,
          qrCodeBase64,
          copyPasteCode: qrCodeText,
          amount: parseFloat(amount.toFixed(2)),
          expiresAt,
          externalId,
          useGatebox: true,
        };

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (gateboxError: unknown) {
        console.error("Gatebox error:", gateboxError);
        return new Response(
          JSON.stringify({
            error: gateboxError instanceof Error ? gateboxError.message : "Erro ao gerar PIX na Gatebox",
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Modo simulação (sem Gatebox configurado)
    const transactionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const pixKey = "aboa@pix.com";
    const merchantName = "A BOA";
    const city = "SAO PAULO";
    const txId = transactionId.replace(/-/g, "").substring(0, 25);
    const copyPasteCode = `00020126580014br.gov.bcb.pix0136${pixKey}5204000053039865802BR5913${merchantName}6009${city}62070503***6304`;
    const qrCodeSvg = generateSimpleQR(copyPasteCode);
    const qrCodeBase64 = `data:image/svg+xml;base64,${btoa(qrCodeSvg)}`;

    const response: PixResponse = {
      transactionId,
      qrCode: copyPasteCode,
      qrCodeBase64,
      copyPasteCode,
      amount,
      expiresAt,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating PIX:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
