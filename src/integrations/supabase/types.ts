export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      affiliate_sales: {
        Row: {
          affiliate_id: string
          buyer_id: string
          commission_amount: number
          commission_status: Database["public"]["Enums"]["commission_status"]
          created_at: string | null
          id: string
          paid_at: string | null
          product_id: string
          product_type: string
          sale_amount: number
        }
        Insert: {
          affiliate_id: string
          buyer_id: string
          commission_amount: number
          commission_status?: Database["public"]["Enums"]["commission_status"]
          created_at?: string | null
          id?: string
          paid_at?: string | null
          product_id: string
          product_type: string
          sale_amount: number
        }
        Update: {
          affiliate_id?: string
          buyer_id?: string
          commission_amount?: number
          commission_status?: Database["public"]["Enums"]["commission_status"]
          created_at?: string | null
          id?: string
          paid_at?: string | null
          product_id?: string
          product_type?: string
          sale_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_sales_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_sales_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_withdrawals: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          pix_key: string | null
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string | null
          id?: string
          notes?: string | null
          pix_key?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          pix_key?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_withdrawals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_withdrawals_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          address_city: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          affiliate_code: string
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          commission_percentage: number
          cpf: string
          created_at: string | null
          email: string | null
          facebook: string | null
          full_name: string
          id: string
          instagram: string | null
          paid_commission: number | null
          pending_commission: number | null
          phone: string | null
          status: Database["public"]["Enums"]["affiliate_status"]
          tiktok: string | null
          total_commission: number | null
          total_sales: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          affiliate_code: string
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          commission_percentage?: number
          cpf: string
          created_at?: string | null
          email?: string | null
          facebook?: string | null
          full_name: string
          id?: string
          instagram?: string | null
          paid_commission?: number | null
          pending_commission?: number | null
          phone?: string | null
          status?: Database["public"]["Enums"]["affiliate_status"]
          tiktok?: string | null
          total_commission?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          affiliate_code?: string
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          commission_percentage?: number
          cpf?: string
          created_at?: string | null
          email?: string | null
          facebook?: string | null
          full_name?: string
          id?: string
          instagram?: string | null
          paid_commission?: number | null
          pending_commission?: number | null
          phone?: string | null
          status?: Database["public"]["Enums"]["affiliate_status"]
          tiktok?: string | null
          total_commission?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          gateway_fee: number | null
          gateway_transaction_id: string | null
          id: string
          metadata: Json | null
          net_amount: number
          payment_method: string
          product_id: string | null
          product_type: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transaction_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          gateway_fee?: number | null
          gateway_transaction_id?: string | null
          id?: string
          metadata?: Json | null
          net_amount: number
          payment_method: string
          product_id?: string | null
          product_type?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          gateway_fee?: number | null
          gateway_transaction_id?: string | null
          id?: string
          metadata?: Json | null
          net_amount?: number
          payment_method?: string
          product_id?: string | null
          product_type?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          category: string
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          last_login_at: string | null
          phone: string | null
          registration_source: string | null
          source_code: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          last_login_at?: string | null
          phone?: string | null
          registration_source?: string | null
          source_code?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          last_login_at?: string | null
          phone?: string | null
          registration_source?: string | null
          source_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      raffle_prizes: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          delivery_notes: string | null
          description: string | null
          estimated_value: number | null
          id: string
          image_url: string | null
          name: string
          raffle_id: string
          status: Database["public"]["Enums"]["prize_status"]
          updated_at: string | null
          winner_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_notes?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          image_url?: string | null
          name: string
          raffle_id: string
          status?: Database["public"]["Enums"]["prize_status"]
          updated_at?: string | null
          winner_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_notes?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          image_url?: string | null
          name?: string
          raffle_id?: string
          status?: Database["public"]["Enums"]["prize_status"]
          updated_at?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raffle_prizes_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffle_prizes_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      raffle_tickets: {
        Row: {
          id: string
          purchased_at: string
          raffle_id: string
          ticket_number: number
          user_id: string
        }
        Insert: {
          id?: string
          purchased_at?: string
          raffle_id: string
          ticket_number: number
          user_id: string
        }
        Update: {
          id?: string
          purchased_at?: string
          raffle_id?: string
          ticket_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "raffle_tickets_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffle_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      raffles: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          draw_date: string
          id: string
          image_url: string | null
          price: number
          status: Database["public"]["Enums"]["raffle_status"]
          title: string
          total_numbers: number
          updated_at: string
          winner_id: string | null
          winner_ticket_number: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          draw_date: string
          id?: string
          image_url?: string | null
          price: number
          status?: Database["public"]["Enums"]["raffle_status"]
          title: string
          total_numbers: number
          updated_at?: string
          winner_id?: string | null
          winner_ticket_number?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          draw_date?: string
          id?: string
          image_url?: string | null
          price?: number
          status?: Database["public"]["Enums"]["raffle_status"]
          title?: string
          total_numbers?: number
          updated_at?: string
          winner_id?: string | null
          winner_ticket_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "raffles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffles_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          bonus_per_referral: number
          code: string
          created_at: string
          id: string
          is_active: boolean
          user_id: string
          uses_count: number
        }
        Insert: {
          bonus_per_referral?: number
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id: string
          uses_count?: number
        }
        Update: {
          bonus_per_referral?: number
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          bonus_awarded: number
          bonus_awarded_at: string | null
          created_at: string
          id: string
          referral_code_id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          bonus_awarded?: number
          bonus_awarded_at?: string | null
          created_at?: string
          id?: string
          referral_code_id: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          bonus_awarded?: number
          bonus_awarded_at?: string | null
          created_at?: string
          id?: string
          referral_code_id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scratch_card_batches: {
        Row: {
          batch_name: string
          cards_sold: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          prize_config: Json
          prizes_distributed: number | null
          scratch_card_id: string
          total_cards: number
          total_prizes: number
          updated_at: string | null
        }
        Insert: {
          batch_name: string
          cards_sold?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          prize_config: Json
          prizes_distributed?: number | null
          scratch_card_id: string
          total_cards: number
          total_prizes: number
          updated_at?: string | null
        }
        Update: {
          batch_name?: string
          cards_sold?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          prize_config?: Json
          prizes_distributed?: number | null
          scratch_card_id?: string
          total_cards?: number
          total_prizes?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scratch_card_batches_scratch_card_id_fkey"
            columns: ["scratch_card_id"]
            isOneToOne: false
            referencedRelation: "scratch_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      scratch_cards: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          price: number
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          price: number
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          price?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scratch_cards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scratch_chances: {
        Row: {
          created_at: string
          id: string
          is_revealed: boolean
          prize_won: number | null
          revealed_at: string | null
          scratch_card_id: string
          symbols: Json
          user_id: string
          winning_symbol_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_revealed?: boolean
          prize_won?: number | null
          revealed_at?: string | null
          scratch_card_id: string
          symbols: Json
          user_id: string
          winning_symbol_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_revealed?: boolean
          prize_won?: number | null
          revealed_at?: string | null
          scratch_card_id?: string
          symbols?: Json
          user_id?: string
          winning_symbol_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scratch_chances_scratch_card_id_fkey"
            columns: ["scratch_card_id"]
            isOneToOne: false
            referencedRelation: "scratch_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scratch_chances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scratch_chances_winning_symbol_id_fkey"
            columns: ["winning_symbol_id"]
            isOneToOne: false
            referencedRelation: "scratch_symbols"
            referencedColumns: ["id"]
          },
        ]
      }
      scratch_symbols: {
        Row: {
          created_at: string
          id: string
          image_url: string
          name: string
          prize_value: number
          probability: number
          remaining_quantity: number | null
          scratch_card_id: string
          total_quantity: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          name: string
          prize_value?: number
          probability?: number
          remaining_quantity?: number | null
          scratch_card_id: string
          total_quantity?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          name?: string
          prize_value?: number
          probability?: number
          remaining_quantity?: number | null
          scratch_card_id?: string
          total_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scratch_symbols_scratch_card_id_fkey"
            columns: ["scratch_card_id"]
            isOneToOne: false
            referencedRelation: "scratch_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      share_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          purchase_amount: number | null
          referred_user_id: string | null
          share_tracking_id: string
          user_agent: string | null
          visitor_ip: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          purchase_amount?: number | null
          referred_user_id?: string | null
          share_tracking_id: string
          user_agent?: string | null
          visitor_ip?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          purchase_amount?: number | null
          referred_user_id?: string | null
          share_tracking_id?: string
          user_agent?: string | null
          visitor_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_events_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_events_share_tracking_id_fkey"
            columns: ["share_tracking_id"]
            isOneToOne: false
            referencedRelation: "share_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      share_tracking: {
        Row: {
          clicks: number | null
          created_at: string | null
          credits_earned: number | null
          id: string
          is_active: boolean | null
          purchases: number | null
          share_code: string
          sharer_id: string
          signups: number | null
          updated_at: string | null
        }
        Insert: {
          clicks?: number | null
          created_at?: string | null
          credits_earned?: number | null
          id?: string
          is_active?: boolean | null
          purchases?: number | null
          share_code: string
          sharer_id: string
          signups?: number | null
          updated_at?: string | null
        }
        Update: {
          clicks?: number | null
          created_at?: string | null
          credits_earned?: number | null
          id?: string
          is_active?: boolean | null
          purchases?: number | null
          share_code?: string
          sharer_id?: string
          signups?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_tracking_sharer_id_fkey"
            columns: ["sharer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_locations: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          id: string
          last_login_at: string | null
          latitude: number | null
          longitude: number | null
          state: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          last_login_at?: string | null
          latitude?: number | null
          longitude?: number | null
          state?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          last_login_at?: string | null
          latitude?: number | null
          longitude?: number | null
          state?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          source_id: string | null
          source_type: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          source_id?: string | null
          source_type?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          source_id?: string | null
          source_type?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_affiliate_code: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      generate_share_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      affiliate_status: "pending" | "approved" | "rejected" | "suspended"
      app_role: "admin" | "user"
      commission_status: "pending" | "approved" | "paid"
      payment_status: "pending" | "approved" | "cancelled" | "refunded"
      prize_status: "pending" | "processing" | "delivered"
      raffle_status: "open" | "drawing" | "completed" | "cancelled"
      transaction_type: "deposit" | "purchase" | "prize" | "refund"
      withdrawal_status: "pending" | "approved" | "paid" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      affiliate_status: ["pending", "approved", "rejected", "suspended"],
      app_role: ["admin", "user"],
      commission_status: ["pending", "approved", "paid"],
      payment_status: ["pending", "approved", "cancelled", "refunded"],
      prize_status: ["pending", "processing", "delivered"],
      raffle_status: ["open", "drawing", "completed", "cancelled"],
      transaction_type: ["deposit", "purchase", "prize", "refund"],
      withdrawal_status: ["pending", "approved", "paid", "rejected"],
    },
  },
} as const
