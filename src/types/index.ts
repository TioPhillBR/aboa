// Tipos base do sistema
export type AppRole = 'admin' | 'user';
export type RaffleStatus = 'open' | 'drawing' | 'completed' | 'cancelled';
export type TransactionType = 'deposit' | 'purchase' | 'prize' | 'refund';

// Perfil do usuário
export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

// Role do usuário
export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  created_by: string | null;
}

// Carteira
export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

// Transação da carteira
export interface WalletTransaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

// Sorteio
export interface Raffle {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price: number;
  total_numbers: number;
  draw_date: string;
  status: RaffleStatus;
  winner_id: string | null;
  winner_ticket_number: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Ticket de sorteio
export interface RaffleTicket {
  id: string;
  raffle_id: string;
  user_id: string;
  ticket_number: number;
  purchased_at: string;
}

// Raspadinha
export interface ScratchCard {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  price: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Símbolo da raspadinha
export interface ScratchSymbol {
  id: string;
  scratch_card_id: string;
  name: string;
  image_url: string;
  prize_value: number;
  probability: number;
  total_quantity: number | null;
  remaining_quantity: number | null;
  created_at: string;
}

// Chance de raspadinha (comprada pelo usuário)
export interface ScratchChance {
  id: string;
  scratch_card_id: string;
  user_id: string;
  symbols: ScratchSymbolResult[];
  is_revealed: boolean;
  prize_won: number | null;
  winning_symbol_id: string | null;
  created_at: string;
  revealed_at: string | null;
}

// Resultado de símbolo na raspadinha (9 posições)
export interface ScratchSymbolResult {
  position: number;
  symbol_id: string;
  image_url: string;
  name: string;
}

// Tipos expandidos com relações
export interface RaffleWithDetails extends Raffle {
  tickets_sold?: number;
  winner?: Profile;
  participants?: Profile[];
}

export interface ScratchCardWithSymbols extends ScratchCard {
  symbols?: ScratchSymbol[];
}

export interface WalletTransactionWithDetails extends WalletTransaction {
  raffle?: Raffle;
  scratch_card?: ScratchCard;
}
