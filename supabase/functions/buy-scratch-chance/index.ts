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

/**
 * Normalize probability value (handles both 0.10 and 10 formats)
 */
function normalizeProbability(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value > 1 ? value / 100 : value;
}

/**
 * Fisher-Yates shuffle
 */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Pick a random item based on weights
 */
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
// GRID GENERATION - CORE LOGIC
// =============================================================================

/**
 * Generate a WINNING grid:
 * - Exactly 3 of the winning symbol
 * - Remaining 6 positions filled with OTHER symbols (max 2 each)
 * - Total: 9 cells
 */
function generateWinningGrid(allSymbols: ScratchSymbol[], winningSymbol: ScratchSymbol): GridCell[] {
  const grid: GridCell[] = [];
  
  // Add exactly 3 winning symbols
  for (let i = 0; i < 3; i++) {
    grid.push({
      position: i,
      symbol_id: winningSymbol.id,
      image_url: winningSymbol.image_url,
      name: winningSymbol.name,
    });
  }
  
  // Get other symbols (excluding the winner)
  const otherSymbols = allSymbols.filter(s => s.id !== winningSymbol.id);
  
  // Fill remaining 6 positions with other symbols (max 2 each)
  const counts: Record<string, number> = {};
  const MAX_PER_SYMBOL = 2;
  
  for (let i = 3; i < 9; i++) {
    // Find symbols that haven't reached the limit
    const available = otherSymbols.filter(s => (counts[s.id] || 0) < MAX_PER_SYMBOL);
    
    let selected: ScratchSymbol;
    if (available.length > 0) {
      selected = available[Math.floor(Math.random() * available.length)];
    } else if (otherSymbols.length > 0) {
      // Fallback: use any other symbol (shouldn't happen with >= 4 other symbols)
      selected = otherSymbols[Math.floor(Math.random() * otherSymbols.length)];
    } else {
      // Edge case: only 1 symbol exists (bad config)
      console.error("CRITICAL: Only 1 symbol configured. Cannot generate valid winning grid.");
      selected = winningSymbol;
    }
    
    counts[selected.id] = (counts[selected.id] || 0) + 1;
    
    grid.push({
      position: i,
      symbol_id: selected.id,
      image_url: selected.image_url,
      name: selected.name,
    });
  }
  
  // Shuffle and reassign positions
  const shuffled = shuffle(grid);
  return shuffled.map((cell, idx) => ({ ...cell, position: idx }));
}

/**
 * Generate a LOSING grid:
 * - NO symbol appears more than 2 times
 * - Requires at least 5 unique symbols for guaranteed valid distribution (9 cells / 2 = 4.5)
 * - If fewer symbols, we force-fix any violations
 */
function generateLosingGrid(allSymbols: ScratchSymbol[]): GridCell[] {
  if (allSymbols.length === 0) {
    console.error("No symbols available for grid generation");
    return [];
  }
  
  const MAX_PER_SYMBOL = 2;
  const GRID_SIZE = 9;
  
  // Minimum symbols needed: ceil(9 / 2) = 5
  if (allSymbols.length < 5) {
    console.warn(`Only ${allSymbols.length} symbols. Minimum 5 required for guaranteed clean losing grid.`);
  }
  
  const grid: GridCell[] = [];
  const counts: Record<string, number> = {};
  
  // Create a pool with balanced distribution
  // Each symbol appears exactly MAX_PER_SYMBOL times in the pool
  let pool: ScratchSymbol[] = [];
  for (const symbol of allSymbols) {
    for (let i = 0; i < MAX_PER_SYMBOL; i++) {
      pool.push(symbol);
    }
  }
  
  // Shuffle the pool
  pool = shuffle(pool);
  
  // Pick 9 items from pool, respecting the limit
  let poolIndex = 0;
  
  for (let i = 0; i < GRID_SIZE; i++) {
    let selected: ScratchSymbol | null = null;
    
    // Try to find a valid symbol from the pool
    for (let attempt = 0; attempt < pool.length; attempt++) {
      const candidate = pool[(poolIndex + attempt) % pool.length];
      if ((counts[candidate.id] || 0) < MAX_PER_SYMBOL) {
        selected = candidate;
        poolIndex = (poolIndex + attempt + 1) % pool.length;
        break;
      }
    }
    
    // If pool exhausted, find any symbol under limit
    if (!selected) {
      for (const symbol of allSymbols) {
        if ((counts[symbol.id] || 0) < MAX_PER_SYMBOL) {
          selected = symbol;
          break;
        }
      }
    }
    
    // Last resort: pick symbol with lowest count (bad config scenario)
    if (!selected) {
      let minCount = Infinity;
      for (const symbol of allSymbols) {
        const count = counts[symbol.id] || 0;
        if (count < minCount) {
          minCount = count;
          selected = symbol;
        }
      }
    }
    
    if (selected) {
      counts[selected.id] = (counts[selected.id] || 0) + 1;
      grid.push({
        position: i,
        symbol_id: selected.id,
        image_url: selected.image_url,
        name: selected.name,
      });
    }
  }
  
  // VALIDATION: Ensure no 3+ matches
  const finalCounts: Record<string, number> = {};
  for (const cell of grid) {
    finalCounts[cell.symbol_id] = (finalCounts[cell.symbol_id] || 0) + 1;
  }
  
  // Fix any violations
  const violations = Object.entries(finalCounts).filter(([_, count]) => count >= 3);
  
  for (const [violatingId, count] of violations) {
    const excess = count - MAX_PER_SYMBOL;
    let fixed = 0;
    
    for (let i = 0; i < grid.length && fixed < excess; i++) {
      if (grid[i].symbol_id === violatingId) {
        // Find a replacement symbol
        const replacement = allSymbols.find(s => 
          s.id !== violatingId && (finalCounts[s.id] || 0) < MAX_PER_SYMBOL
        );
        
        if (replacement) {
          grid[i] = {
            position: i,
            symbol_id: replacement.id,
            image_url: replacement.image_url,
            name: replacement.name,
          };
          finalCounts[violatingId]--;
          finalCounts[replacement.id] = (finalCounts[replacement.id] || 0) + 1;
          fixed++;
        }
      }
    }
    
    if (fixed < excess) {
      console.error(`CRITICAL: Could not fix all violations for symbol ${violatingId}. Need more unique symbols.`);
    }
  }
  
  // Final shuffle
  const shuffled = shuffle(grid);
  return shuffled.map((cell, idx) => ({ ...cell, position: idx }));
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with user auth
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user ID from token
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Parse request body
    const body = await req.json() as BuyScratchChanceRequest;
    if (!body?.scratch_card_id) {
      return new Response(JSON.stringify({ error: "ID da raspadinha não informado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client for database operations
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
    // STEP 3: Fetch symbols
    // ==========================================================================
    const { data: symbols, error: symbolsError } = await supabaseAdmin
      .from("scratch_symbols")
      .select("*")
      .eq("scratch_card_id", body.scratch_card_id);

    if (symbolsError) throw symbolsError;
    
    const allSymbols = (symbols ?? []) as ScratchSymbol[];
    
    if (allSymbols.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum símbolo configurado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (allSymbols.length < 5) {
      console.warn(`Raspadinha ${card.title} tem apenas ${allSymbols.length} símbolos. Mínimo recomendado: 5`);
    }

    // ==========================================================================
    // STEP 4: Determine if winner based on probabilities
    // ==========================================================================
    
    // Build list of eligible winning symbols
    const winCandidates = allSymbols
      .map(symbol => ({
        symbol,
        probability: normalizeProbability(symbol.probability),
      }))
      .filter(({ symbol, probability }) => {
        // Must have valid probability
        if (probability <= 0) return false;
        // Must have positive prize value
        if (!Number.isFinite(symbol.prize_value) || symbol.prize_value <= 0) return false;
        // Must have remaining quantity (or unlimited)
        if (symbol.remaining_quantity !== null && symbol.remaining_quantity <= 0) return false;
        return true;
      });

    // Calculate total win probability
    const totalWinProbability = Math.min(1, winCandidates.reduce((sum, x) => sum + x.probability, 0));

    // Roll the dice
    let isWinner = winCandidates.length > 0 && Math.random() < totalWinProbability;
    let winningSymbol: ScratchSymbol | null = null;

    if (isWinner) {
      // Pick which prize was won (weighted by probability)
      winningSymbol = pickWeighted(
        winCandidates.map(x => ({ item: x.symbol, weight: x.probability }))
      );

      // If symbol has limited quantity, try to claim it
      if (winningSymbol && winningSymbol.remaining_quantity !== null) {
        const currentQty = winningSymbol.remaining_quantity;
        
        const { data: updated, error: updateError } = await supabaseAdmin
          .from("scratch_symbols")
          .update({ remaining_quantity: currentQty - 1 })
          .eq("id", winningSymbol.id)
          .eq("remaining_quantity", currentQty) // Optimistic locking
          .select("id")
          .maybeSingle();

        if (updateError || !updated) {
          // Race condition: someone else got the last prize
          console.warn(`Concorrência: prêmio ${winningSymbol.name} esgotado. Convertendo para derrota.`);
          isWinner = false;
          winningSymbol = null;
        }
      }
    }

    // ==========================================================================
    // STEP 5: Generate grid
    // ==========================================================================
    let grid: GridCell[];
    let prizeWon: number | null = null;
    let winningSymbolId: string | null = null;

    if (isWinner && winningSymbol) {
      grid = generateWinningGrid(allSymbols, winningSymbol);
      prizeWon = winningSymbol.prize_value;
      winningSymbolId = winningSymbol.id;
      console.log(`🎉 Vitória! Prêmio: R$ ${prizeWon} (${winningSymbol.name})`);
    } else {
      grid = generateLosingGrid(allSymbols);
      console.log(`❌ Derrota. Grid gerado com ${allSymbols.length} símbolos.`);
    }

    // ==========================================================================
    // STEP 6: Save chance to database
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
    // STEP 7: Update batch counters
    // ==========================================================================
    const newCardsSold = (batch.cards_sold ?? 0) + 1;
    const newPrizesDistributed = (batch.prizes_distributed ?? 0) + (isWinner ? 1 : 0);

    await supabaseAdmin
      .from("scratch_card_batches")
      .update({
        cards_sold: newCardsSold,
        prizes_distributed: newPrizesDistributed,
      })
      .eq("id", batch.id);

    // ==========================================================================
    // RESPONSE
    // ==========================================================================
    return new Response(JSON.stringify({ 
      chance,
      is_winner: isWinner,
      prize_won: prizeWon,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erro ao comprar raspadinha:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
