// Tipos base do sistema
export type AppRole = 'admin' | 'user';
export type RaffleStatus = 'open' | 'drawing' | 'completed' | 'cancelled';
export type TransactionType = 'deposit' | 'purchase' | 'prize' | 'refund';
export type AffiliateStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type CommissionStatus = 'pending' | 'approved' | 'paid';
export type WithdrawalStatus = 'pending' | 'approved' | 'paid' | 'rejected';
export type PaymentStatus = 'pending' | 'approved' | 'cancelled' | 'refunded';
export type PrizeStatus = 'pending' | 'processing' | 'delivered';

// Perfil do usuário
export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  last_login_at: string | null;
  registration_source: string | null;
  source_code: string | null;
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
  source_type: string | null;
  source_id: string | null;
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

// Afiliado
export interface Affiliate {
  id: string;
  user_id: string;
  full_name: string;
  cpf: string;
  phone: string | null;
  email: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  avatar_url: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  commission_percentage: number;
  affiliate_code: string;
  status: AffiliateStatus;
  total_sales: number;
  total_commission: number;
  pending_commission: number;
  paid_commission: number;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

// Venda via afiliado
export interface AffiliateSale {
  id: string;
  affiliate_id: string;
  buyer_id: string;
  product_type: string;
  product_id: string;
  sale_amount: number;
  commission_amount: number;
  commission_status: CommissionStatus;
  paid_at: string | null;
  created_at: string;
}

// Saque de afiliado
export interface AffiliateWithdrawal {
  id: string;
  affiliate_id: string;
  amount: number;
  status: WithdrawalStatus;
  pix_key: string | null;
  processed_by: string | null;
  processed_at: string | null;
  notes: string | null;
  created_at: string;
}

// Transação de pagamento
export interface PaymentTransaction {
  id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  gateway_fee: number;
  net_amount: number;
  payment_method: string;
  gateway_transaction_id: string | null;
  status: PaymentStatus;
  product_type: string | null;
  product_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Rastreamento de compartilhamento
export interface ShareTracking {
  id: string;
  sharer_id: string;
  share_code: string;
  clicks: number;
  signups: number;
  purchases: number;
  credits_earned: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Evento de compartilhamento
export interface ShareEvent {
  id: string;
  share_tracking_id: string;
  event_type: string;
  visitor_ip: string | null;
  user_agent: string | null;
  referred_user_id: string | null;
  purchase_amount: number | null;
  created_at: string;
}

// Localização do usuário
export interface UserLocation {
  id: string;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  country: string;
  last_login_at: string;
  created_at: string;
}

// Prêmio de rifa
export interface RafflePrize {
  id: string;
  raffle_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  estimated_value: number | null;
  status: PrizeStatus;
  winner_id: string | null;
  delivery_notes: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

// Lote de raspadinha
export interface ScratchCardBatch {
  id: string;
  scratch_card_id: string;
  batch_name: string;
  total_cards: number;
  cards_sold: number;
  total_prizes: number;
  prizes_distributed: number;
  prize_config: PrizeConfigItem[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Configuração de prêmio (usado em lotes e formulários)
export interface PrizeConfigItem {
  name: string;
  value: number;
  quantity: number;
  probability: number;
  image_url?: string;
  description?: string;
}
