import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ScratchSymbolRow = {
  id: string;
  scratch_card_id: string;
  name: string;
  image_url: string;
  prize_value: number;
  probability: number;
  total_quantity: number | null;
  remaining_quantity: number | null;
};

type ScratchSymbolResult = {
  position: number;
  symbol_id: string;
  image_url: string;
  name: string;
};

interface BuyScratchChanceRequest {
  scratch_card_id: string;
}

function normalizeProbability(value: number): number {
  // Defensive: some rows may have been stored as 10 (meaning 10%) instead of 0.10
  const v = value > 1 ? value / 100 : value;
  if (!Number.isFinite(v) || v < 0) return 0;
  return v;
}

function pickWeighted<T>(items: Array<{ item: T; weight: number }>): T {
  const total = items.reduce((sum, x) => sum + x.weight, 0);
  const roll = Math.random() * total;
  let cum = 0;
  for (const { item, weight } of items) {
    cum += weight;
    if (roll <= cum) return item;
  }
  return items[items.length - 1].item;
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateWinningGrid(allSymbols: ScratchSymbolRow[], winning: ScratchSymbolRow): ScratchSymbolResult[] {
  const result: ScratchSymbolResult[] = [];

  // Exactly 3 winning symbols
  for (let i = 0; i < 3; i++) {
    result.push({
      position: i,
      symbol_id: winning.id,
      image_url: winning.image_url,
      name: winning.name,
    });
  }

  // Get other symbols (excluding the winning one) for filling remaining positions
  const otherSymbols = allSymbols.filter(s => s.id !== winning.id);
  
  // If we don't have other symbols, we need to be careful
  // Each non-winning symbol can appear at most 2 times to avoid creating another "win"
  const symbolCounts: Record<string, number> = {};
  const maxPerSymbol = 2; // Max 2 of any other symbol to avoid 3+ matches
  
  // Fill remaining 6 positions ensuring no symbol appears 3+ times
  for (let i = 3; i < 9; i++) {
    let selectedSymbol: ScratchSymbolRow;
    
    if (otherSymbols.length > 0) {
      // Filter to symbols that haven't reached max count
      const availableSymbols = otherSymbols.filter(
        s => (symbolCounts[s.id] || 0) < maxPerSymbol
      );
      
      if (availableSymbols.length > 0) {
        selectedSymbol = availableSymbols[Math.floor(Math.random() * availableSymbols.length)];
      } else {
        // Fallback: pick any other symbol (shouldn't happen with enough symbols)
        selectedSymbol = otherSymbols[Math.floor(Math.random() * otherSymbols.length)];
      }
    } else {
      // Edge case: only one symbol type exists - this is a config issue
      // We have to use the winning symbol but limit to exactly 3
      console.warn("Only one symbol configured - cannot guarantee clean grid");
      selectedSymbol = winning;
    }
    
    symbolCounts[selectedSymbol.id] = (symbolCounts[selectedSymbol.id] || 0) + 1;
    
    result.push({
      position: i,
      symbol_id: selectedSymbol.id,
      image_url: selectedSymbol.image_url,
      name: selectedSymbol.name,
    });
  }

  // Shuffle and reassign positions
  shuffle(result);
  for (let i = 0; i < result.length; i++) result[i].position = i;
  
  return result;
}

function generateLosingGrid(allSymbols: ScratchSymbolRow[]): ScratchSymbolResult[] {
  const result: ScratchSymbolResult[] = [];
  if (allSymbols.length === 0) return result;

  // Best effort: avoid 3+ occurrences by limiting repeats to 2.
  const symbolCounts: Record<string, number> = {};
  const maxPerSymbol = 2;

  // Create a pool with each symbol repeated twice
  const pool: ScratchSymbolRow[] = [];
  for (const s of allSymbols) pool.push(s, s);

  // If pool too small for 9 picks, we'll still try to keep counts <= 2,
  // but with too few symbols it can become impossible.
  shuffle(pool);

  for (let i = 0; i < 9; i++) {
    let selected = pool[i % pool.length];
    let attempts = 0;
    while ((symbolCounts[selected.id] || 0) >= maxPerSymbol && attempts < 50) {
      selected = allSymbols[Math.floor(Math.random() * allSymbols.length)];
      attempts++;
    }
    symbolCounts[selected.id] = (symbolCounts[selected.id] || 0) + 1;
    result.push({
      position: i,
      symbol_id: selected.id,
      image_url: selected.image_url,
      name: selected.name,
    });
  }

  // Validate (best effort)
  const finalCounts: Record<string, number> = {};
  for (const r of result) finalCounts[r.symbol_id] = (finalCounts[r.symbol_id] || 0) + 1;
  const hasThreeOrMore = Object.values(finalCounts).some((c) => c >= 3);
  if (hasThreeOrMore) {
    console.warn(
      `Could not guarantee a clean losing grid. Consider adding more symbols (recommended >= 5). Unique symbols: ${allSymbols.length}`,
    );
  }

  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    const body = (await req.json()) as BuyScratchChanceRequest;
    if (!body?.scratch_card_id) {
      return new Response(JSON.stringify({ error: "Missing scratch_card_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Validate scratch card exists
    const { data: card, error: cardError } = await supabaseAdmin
      .from("scratch_cards")
      .select("id, is_active, title")
      .eq("id", body.scratch_card_id)
      .single();
    if (cardError || !card) {
      return new Response(JSON.stringify({ error: "Scratch card not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!card.is_active) {
      return new Response(JSON.stringify({ error: "Scratch card is not active" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch active batch (enforce total_cards)
    const { data: batch, error: batchError } = await supabaseAdmin
      .from("scratch_card_batches")
      .select("id, total_cards, cards_sold, prizes_distributed")
      .eq("scratch_card_id", body.scratch_card_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (batchError || !batch) {
      return new Response(JSON.stringify({ error: "No active batch for this scratch card" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if ((batch.cards_sold ?? 0) >= batch.total_cards) {
      return new Response(JSON.stringify({ error: "Batch sold out" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch symbols
    const { data: symbols, error: symbolsError } = await supabaseAdmin
      .from("scratch_symbols")
      .select("*")
      .eq("scratch_card_id", body.scratch_card_id);

    if (symbolsError) throw symbolsError;
    const allSymbols = (symbols ?? []) as ScratchSymbolRow[];
    if (allSymbols.length === 0) {
      return new Response(JSON.stringify({ error: "No symbols configured for this scratch card" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine if winner (and which prize) respecting probability + remaining_quantity
    const winCandidates = allSymbols
      .map((s) => ({
        symbol: s,
        prob: normalizeProbability(s.probability),
      }))
      .filter(({ symbol, prob }) => {
        if (prob <= 0) return false;
        if (!Number.isFinite(symbol.prize_value) || symbol.prize_value <= 0) return false;
        if (symbol.remaining_quantity === null) return true; // unlimited
        return symbol.remaining_quantity > 0;
      });

    const totalWinProbability = Math.min(
      1,
      winCandidates.reduce((sum, x) => sum + x.prob, 0),
    );

    let isWinner = Math.random() < totalWinProbability && winCandidates.length > 0;
    let winningSymbol: ScratchSymbolRow | null = null;

    if (isWinner) {
      winningSymbol = pickWeighted(winCandidates.map((x) => ({ item: x.symbol, weight: x.prob })));

      // If limited, try to decrement atomically-ish (optimistic concurrency)
      if (winningSymbol.remaining_quantity !== null) {
        const current = winningSymbol.remaining_quantity;
        const { data: updated, error: decError } = await supabaseAdmin
          .from("scratch_symbols")
          .update({ remaining_quantity: current - 1 })
          .eq("id", winningSymbol.id)
          .eq("remaining_quantity", current)
          .select("id")
          .maybeSingle();

        if (decError || !updated) {
          // Someone else consumed the last one; fallback to losing
          console.warn("Prize quantity race detected; falling back to losing grid", decError);
          isWinner = false;
          winningSymbol = null;
        }
      }
    }

    const gridSymbols = isWinner && winningSymbol
      ? generateWinningGrid(allSymbols, winningSymbol)
      : generateLosingGrid(allSymbols);

    const prizeWon = isWinner && winningSymbol ? winningSymbol.prize_value : null;
    const winningSymbolId = isWinner && winningSymbol ? winningSymbol.id : null;

    // Insert chance
    const { data: chance, error: chanceError } = await supabaseAdmin
      .from("scratch_chances")
      .insert({
        scratch_card_id: body.scratch_card_id,
        user_id: userId,
        symbols: gridSymbols as unknown as any,
        is_revealed: false,
        prize_won: prizeWon,
        winning_symbol_id: winningSymbolId,
      })
      .select()
      .single();

    if (chanceError) throw chanceError;

    // Update batch counters
    const nextCardsSold = (batch.cards_sold ?? 0) + 1;
    const nextPrizesDistributed = (batch.prizes_distributed ?? 0) + (isWinner ? 1 : 0);
    const { error: batchUpdateError } = await supabaseAdmin
      .from("scratch_card_batches")
      .update({ cards_sold: nextCardsSold, prizes_distributed: nextPrizesDistributed })
      .eq("id", batch.id);

    if (batchUpdateError) {
      // Don't fail the request after the chance is created.
      console.error("Failed to update batch counters:", batchUpdateError);
    }

    return new Response(JSON.stringify({ chance }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error buying scratch chance:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
