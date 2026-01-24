import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

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

    const userId = claimsData.claims.sub;

    // Parse request body
    const { amount } = (await req.json()) as PixRequest;

    if (!amount || amount < 5) {
      return new Response(
        JSON.stringify({ error: "Valor mínimo é R$ 5,00" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a unique transaction ID
    const transactionId = crypto.randomUUID();
    
    // Generate expiration time (15 minutes from now)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    
    // Simulated PIX copy-paste code (EMV format simulation)
    const pixKey = "sorteiomania@pix.com";
    const merchantName = "SORTEIO MANIA";
    const city = "SAO PAULO";
    const txId = transactionId.replace(/-/g, "").substring(0, 25);
    
    // Simplified EMV-like code for simulation
    const copyPasteCode = `00020126580014br.gov.bcb.pix0136${pixKey}5204000053039865802BR5913${merchantName}6009${city}62070503***6304`;
    
    // Generate a simple QR code representation (in production, use a real QR library)
    // For simulation, we'll return a data URL that the frontend can display
    const qrData = encodeURIComponent(JSON.stringify({
      txId,
      amount,
      recipient: pixKey,
      merchantName,
    }));
    
    // Create a simple SVG QR code placeholder (in production, generate real QR)
    const qrCodeSvg = generateSimpleQR(copyPasteCode);
    const qrCodeBase64 = btoa(qrCodeSvg);

    const response: PixResponse = {
      transactionId,
      qrCode: copyPasteCode,
      qrCodeBase64: `data:image/svg+xml;base64,${qrCodeBase64}`,
      copyPasteCode,
      amount,
      expiresAt,
    };

    console.log(`PIX generated for user ${userId}: ${transactionId} - R$ ${amount}`);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating PIX:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateSimpleQR(data: string): string {
  // Generate a stylized placeholder QR code SVG
  // In production, use a proper QR code library
  const size = 200;
  const moduleSize = 4;
  const modules = 41; // QR code v4 has 33x33 modules
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;
  
  // Generate pseudo-random pattern based on data
  const hash = simpleHash(data);
  
  // Draw finder patterns (corners)
  svg += drawFinderPattern(0, 0, moduleSize);
  svg += drawFinderPattern(size - 7 * moduleSize, 0, moduleSize);
  svg += drawFinderPattern(0, size - 7 * moduleSize, moduleSize);
  
  // Draw random-looking modules
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      // Skip finder pattern areas
      if ((row < 8 && col < 8) || (row < 8 && col > modules - 9) || (row > modules - 9 && col < 8)) {
        continue;
      }
      
      // Use hash to determine if module should be filled
      const idx = row * modules + col;
      const shouldFill = ((hash >> (idx % 30)) ^ (idx * 7)) % 3 === 0;
      
      if (shouldFill) {
        const x = col * moduleSize + 8;
        const y = row * moduleSize + 8;
        svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
      }
    }
  }
  
  // Add PIX logo in center
  const centerX = size / 2;
  const centerY = size / 2;
  svg += `<circle cx="${centerX}" cy="${centerY}" r="15" fill="white"/>`;
  svg += `<text x="${centerX}" y="${centerY + 4}" text-anchor="middle" font-size="12" font-weight="bold" fill="#32BCAD">PIX</text>`;
  
  svg += `</svg>`;
  return svg;
}

function drawFinderPattern(x: number, y: number, moduleSize: number): string {
  let svg = '';
  // Outer black square
  svg += `<rect x="${x + 8}" y="${y + 8}" width="${7 * moduleSize}" height="${7 * moduleSize}" fill="black"/>`;
  // White square
  svg += `<rect x="${x + moduleSize + 8}" y="${y + moduleSize + 8}" width="${5 * moduleSize}" height="${5 * moduleSize}" fill="white"/>`;
  // Inner black square
  svg += `<rect x="${x + 2 * moduleSize + 8}" y="${y + 2 * moduleSize + 8}" width="${3 * moduleSize}" height="${3 * moduleSize}" fill="black"/>`;
  return svg;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
