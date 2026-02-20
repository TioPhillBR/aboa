import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =============================================================================
// TYPES
// =============================================================================

interface ScratchSymbol {
  id: string;
  scratch_card_id: string;
  name: string;
  image_url: string;
  prize_value: number;
  probability: number;
  total_quantity: number | null;
  remaining_quantity: number | null;
}

interface GridCell {
  position: number;
  symbol_id: string;
  image_url: string;
  name: string;
}

interface BuyScratchChanceRequest {
  scratch_card_id: string;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function normalizeProbability(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value > 1 ? value / 100 : value;
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickWeighted<T>(items: Array<{ item: T; weight: number }>): T | null {
  if (items.length === 0) return null;
  const total = items.reduce((sum, x) => sum + x.weight, 0);
  if (total <= 0) return items[0].item;
  const roll = Math.random() * total;
  let cumulative = 0;
  for (const { item, weight } of items) {
    cumulative += weight;
    if (roll <= cumulative) return item;
  }
  return items[items.length - 1].item;
}

// =============================================================================
// GRID GENERATION
// =============================================================================

function generateWinningGrid(allSymbols: ScratchSymbol[], winningSymbol: ScratchSymbol): GridCell[] {
  const grid: GridCell[] = [];
  for (let i = 0; i < 3; i++) {
    grid.push({
      position: i,
      symbol_id: winningSymbol.id,
      image_url: winningSymbol.image_url,
      name: winningSymbol.name,
    });
  }
  const otherSymbols = allSymbols.filter(s => s.id !== winningSymbol.id);
  const counts: Record<string, number> = {};
  const MAX_PER_SYMBOL = 2;
  for (let i = 3; i < 9; i++) {
    const available = otherSymbols.filter(s => (counts[s.id] || 0) < MAX_PER_SYMBOL);
    let selected: ScratchSymbol;
    if (available.length > 0) {
      selected = available[Math.floor(Math.random() * available.length)];
    } else if (otherSymbols.length > 0) {
      selected = otherSymbols[Math.floor(Math.random() * otherSymbols.length)];
    } else {
      selected = winningSymbol;
    }
    counts[selected.id] = (counts[selected.id] || 0) + 1;
    grid.push({ position: i, symbol_id: selected.id, image_url: selected.image_url, name: selected.name });
  }
  const shuffled = shuffle(grid);
  return shuffled.map((cell, idx) => ({ ...cell, position: idx }));
}

function generateLosingGrid(allSymbols: ScratchSymbol[]): GridCell[] {
  if (allSymbols.length === 0) return [];
  const GRID_SIZE = 9;
  const MAX_ATTEMPTS = 100;
  const MAX_PER_SYMBOL = 2;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const grid: GridCell[] = [];
    const counts: Record<string, number> = {};
    const shuffledSymbols = shuffle([...allSymbols]);
    for (let i = 0; i < GRID_SIZE; i++) {
      const available = shuffledSymbols.filter(s => (counts[s.id] || 0) < MAX_PER_SYMBOL);
      if (available.length === 0) break;
      const selected = available[Math.floor(Math.random() * available.length)];
      counts[selected.id] = (counts[selected.id] || 0) + 1;
      grid.push({ position: i, symbol_id: selected.id, image_url: selected.image_url, name: selected.name });
    }
    if (grid.length === GRID_SIZE && !Object.values(counts).some(c => c >= 3)) {
      const shuffled = shuffle(grid);
      return shuffled.map((cell, idx) => ({ ...cell, position: idx }));
    }
  }
  // Best-effort fallback
  const numSymbols = allSymbols.length;
  const grid: GridCell[] = [];
  const shuffledSymbols = shuffle([...allSymbols]);
  const baseCount = Math.floor(GRID_SIZE / numSymbols);
  const remainder = GRID_SIZE % numSymbols;
  for (let i = 0; i < numSymbols; i++) {
    const symbol = shuffledSymbols[i];
    const count = baseCount + (i < remainder ? 1 : 0);
    for (let j = 0; j < count; j++) {
      grid.push({ position: grid.length, symbol_id: symbol.id, image_url: symbol.image_url, name: symbol.name });
    }
  }
  const shuffled = shuffle(grid);
  return shuffled.map((cell, idx) => ({ ...cell, position: idx }));
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json() as BuyScratchChanceRequest;
    if (!body?.scratch_card_id) {
      return new Response(JSON.stringify({ error: "ID da raspadinha não informado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ==========================================================================
    // STEP 1: Validate scratch card
    // ==========================================================================
    const { data: card, error: cardError } = await supabaseAdmin
      .from("scratch_cards")
      .select("id, is_active, title, price")
      .eq("id", body.scratch_card_id)
      .single();

    if (cardError || !card) {
      return new Response(JSON.stringify({ error: "Raspadinha não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!card.is_active) {
      return new Response(JSON.stringify({ error: "Raspadinha não está ativa" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ==========================================================================
    // STEP 2: Validate active batch
    // ==========================================================================
    const { data: batch, error: batchError } = await supabaseAdmin
      .from("scratch_card_batches")
      .select("id, total_cards, cards_sold, prizes_distributed, total_prizes")
      .eq("scratch_card_id", body.scratch_card_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (batchError || !batch) {
      return new Response(JSON.stringify({ error: "Nenhum lote ativo para esta raspadinha" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if ((batch.cards_sold ?? 0) >= batch.total_cards) {
      return new Response(JSON.stringify({ error: "Lote esgotado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ==========================================================================
    // STEP 3: Debit wallet atomically (inside edge function to avoid race conditions)
    // ==========================================================================
    const { data: walletData, error: walletFetchError } = await supabaseAdmin
      .from("wallets")
      .select("id, balance")
      .eq("user_id", userId)
      .single();

    if (walletFetchError || !walletData) {
      return new Response(JSON.stringify({ error: "Carteira não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (walletData.balance < card.price) {
      return new Response(JSON.stringify({ error: "Saldo insuficiente" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Debit with optimistic locking to prevent double-spend
    const newBalance = walletData.balance - card.price;
    const { error: walletUpdateError } = await supabaseAdmin
      .from("wallets")
      .update({ balance: newBalance })
      .eq("id", walletData.id)
      .eq("balance", walletData.balance); // optimistic lock

    if (walletUpdateError) {
      return new Response(JSON.stringify({ error: "Erro ao debitar saldo. Tente novamente." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert purchase transaction record
    await supabaseAdmin
      .from("wallet_transactions")
      .insert({
        wallet_id: walletData.id,
        amount: -card.price,
        type: "purchase",
        description: `Raspadinha - ${card.title}`,
        reference_id: body.scratch_card_id,
      });

    // ==========================================================================
    // STEP 4: Fetch symbols
    // ==========================================================================
    const { data: symbols, error: symbolsError } = await supabaseAdmin
      .from("scratch_symbols")
      .select("*")
      .eq("scratch_card_id", body.scratch_card_id);

    if (symbolsError) throw symbolsError;
    const allSymbols = (symbols ?? []) as ScratchSymbol[];
    if (allSymbols.length === 0) {
      // Refund if no symbols
      await supabaseAdmin.from("wallets").update({ balance: walletData.balance }).eq("id", walletData.id);
      return new Response(JSON.stringify({ error: "Nenhum símbolo configurado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ==========================================================================
    // STEP 5: Determine winner
    // ==========================================================================
    const winCandidates = allSymbols
      .map(symbol => ({ symbol, probability: normalizeProbability(symbol.probability) }))
      .filter(({ symbol, probability }) => {
        if (probability <= 0) return false;
        if (!Number.isFinite(symbol.prize_value) || symbol.prize_value <= 0) return false;
        if (symbol.remaining_quantity !== null && symbol.remaining_quantity <= 0) return false;
        return true;
      });

    const totalWinProbability = Math.min(1, winCandidates.reduce((sum, x) => sum + x.probability, 0));
    let isWinner = winCandidates.length > 0 && Math.random() < totalWinProbability;
    let winningSymbol: ScratchSymbol | null = null;

    if (isWinner) {
      winningSymbol = pickWeighted(winCandidates.map(x => ({ item: x.symbol, weight: x.probability })));
      if (winningSymbol && winningSymbol.remaining_quantity !== null) {
        const currentQty = winningSymbol.remaining_quantity;
        const { data: updated, error: updateError } = await supabaseAdmin
          .from("scratch_symbols")
          .update({ remaining_quantity: currentQty - 1 })
          .eq("id", winningSymbol.id)
          .eq("remaining_quantity", currentQty)
          .select("id")
          .maybeSingle();
        if (updateError || !updated) {
          isWinner = false;
          winningSymbol = null;
        }
      }
    }

    // ==========================================================================
    // STEP 6: Generate grid
    // ==========================================================================
    let grid: GridCell[];
    let prizeWon: number | null = null;
    let winningSymbolId: string | null = null;

    if (isWinner && winningSymbol) {
      grid = generateWinningGrid(allSymbols, winningSymbol);
      prizeWon = winningSymbol.prize_value;
      winningSymbolId = winningSymbol.id;
    } else {
      grid = generateLosingGrid(allSymbols);
    }

    // ==========================================================================
    // STEP 7: Save chance to database
    // ==========================================================================
    const { data: chance, error: chanceError } = await supabaseAdmin
      .from("scratch_chances")
      .insert({
        scratch_card_id: body.scratch_card_id,
        user_id: userId,
        symbols: grid,
        is_revealed: false,
        prize_won: prizeWon,
        winning_symbol_id: winningSymbolId,
      })
      .select()
      .single();

    if (chanceError) throw chanceError;

    // ==========================================================================
    // STEP 8: Update batch counters
    // ==========================================================================
    await supabaseAdmin
      .from("scratch_card_batches")
      .update({
        cards_sold: (batch.cards_sold ?? 0) + 1,
        prizes_distributed: (batch.prizes_distributed ?? 0) + (isWinner ? 1 : 0),
      })
      .eq("id", batch.id);

    return new Response(JSON.stringify({
      chance,
      is_winner: isWinner,
      prize_won: prizeWon,
      new_balance: newBalance,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
