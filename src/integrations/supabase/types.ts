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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_user: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          first_name: string | null
          id: string
          last_name: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
        }
        Relationships: []
      }
      customer_session: {
        Row: {
          fingerprint_hash: string | null
          id: string
          last_seen_at: string | null
          wallet_address: string | null
        }
        Insert: {
          fingerprint_hash?: string | null
          id?: string
          last_seen_at?: string | null
          wallet_address?: string | null
        }
        Update: {
          fingerprint_hash?: string | null
          id?: string
          last_seen_at?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          display_name: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          org_id: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          display_name: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          org_id: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          display_name?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          org_id?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
        ]
      }
      kv_store_32872c85: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      location: {
        Row: {
          address: string | null
          category: string | null
          cover_image_url: string | null
          created_at: string | null
          google_place_id: string | null
          id: string
          is_featured: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          org_id: string
          slug: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          google_place_id?: string | null
          id?: string
          is_featured?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          org_id: string
          slug?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          google_place_id?: string | null
          id?: string
          is_featured?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          org_id?: string
          slug?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
        ]
      }
      org: {
        Row: {
          country: string | null
          created_at: string | null
          currency: string | null
          id: string
          name: string
          owner_user_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          name: string
          owner_user_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          name?: string
          owner_user_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          profile_id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          profile_id: string
          role: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          profile_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_profile: {
        Row: {
          address: string | null
          business_logo_url: string | null
          business_name: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          business_logo_url?: string | null
          business_name: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          business_logo_url?: string | null
          business_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      owner_setting: {
        Row: {
          digest_time: string | null
          email_alerts: boolean | null
          id: string
          neg_review_threshold: number | null
          org_id: string
        }
        Insert: {
          digest_time?: string | null
          email_alerts?: boolean | null
          id?: string
          neg_review_threshold?: number | null
          org_id: string
        }
        Update: {
          digest_time?: string | null
          email_alerts?: boolean | null
          id?: string
          neg_review_threshold?: number | null
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_setting_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_code: {
        Row: {
          code: string
          created_at: string | null
          deep_link_url: string | null
          id: string
          is_active: boolean | null
          server_assignment_id: string
          short_code: string | null
          table_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          deep_link_url?: string | null
          id?: string
          is_active?: boolean | null
          server_assignment_id: string
          short_code?: string | null
          table_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          deep_link_url?: string | null
          id?: string
          is_active?: boolean | null
          server_assignment_id?: string
          short_code?: string | null
          table_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_code_server_assignment_id_fkey"
            columns: ["server_assignment_id"]
            isOneToOne: false
            referencedRelation: "server_assignment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_code_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      review: {
        Row: {
          comment: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          customer_session_id: string | null
          id: string
          is_anonymous: boolean | null
          linked_tip_id: string | null
          location_id: string | null
          org_id: string
          photo_urls: Json | null
          rating_emoji: string | null
          sentiment: Database["public"]["Enums"]["review_sentiment"]
          server_assignment_id: string
          server_id: string
          tags: Json | null
          text: string | null
          visit_id: string | null
        }
        Insert: {
          comment?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          customer_session_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          linked_tip_id?: string | null
          location_id?: string | null
          org_id: string
          photo_urls?: Json | null
          rating_emoji?: string | null
          sentiment: Database["public"]["Enums"]["review_sentiment"]
          server_assignment_id: string
          server_id: string
          tags?: Json | null
          text?: string | null
          visit_id?: string | null
        }
        Update: {
          comment?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          customer_session_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          linked_tip_id?: string | null
          location_id?: string | null
          org_id?: string
          photo_urls?: Json | null
          rating_emoji?: string | null
          sentiment?: Database["public"]["Enums"]["review_sentiment"]
          server_assignment_id?: string
          server_id?: string
          tags?: Json | null
          text?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_customer_session_id_fkey"
            columns: ["customer_session_id"]
            isOneToOne: false
            referencedRelation: "customer_session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_linked_tip_id_fkey"
            columns: ["linked_tip_id"]
            isOneToOne: false
            referencedRelation: "tip"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_server_assignment_id_fkey"
            columns: ["server_assignment_id"]
            isOneToOne: false
            referencedRelation: "server_assignment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "server_profile"
            referencedColumns: ["server_id"]
          },
          {
            foreignKeyName: "review_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      server_assignment: {
        Row: {
          display_name_override: string | null
          ended_at: string | null
          id: string
          is_active: boolean | null
          location_id: string | null
          org_id: string
          payout_wallet_address: string | null
          server_id: string
          started_at: string | null
          stripe_connect_id: string | null
        }
        Insert: {
          display_name_override?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          org_id: string
          payout_wallet_address?: string | null
          server_id: string
          started_at?: string | null
          stripe_connect_id?: string | null
        }
        Update: {
          display_name_override?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          org_id?: string
          payout_wallet_address?: string | null
          server_id?: string
          started_at?: string | null
          stripe_connect_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "server_assignment_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "server_assignment_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "server_assignment_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "server_profile"
            referencedColumns: ["server_id"]
          },
        ]
      }
      server_profile: {
        Row: {
          bio: string | null
          created_at: string | null
          first_name: string | null
          global_wallet_address: string | null
          last_name: string | null
          photo_url: string | null
          server_id: string
          wallet_addresses: Json | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          first_name?: string | null
          global_wallet_address?: string | null
          last_name?: string | null
          photo_url?: string | null
          server_id: string
          wallet_addresses?: Json | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          first_name?: string | null
          global_wallet_address?: string | null
          last_name?: string | null
          photo_url?: string | null
          server_id?: string
          wallet_addresses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "server_profile_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: true
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          created_at: string | null
          id: string
          label: string
          qr_code_id: string | null
          venue_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          label: string
          qr_code_id?: string | null
          venue_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: string
          qr_code_id?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qr_code"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "location"
            referencedColumns: ["id"]
          },
        ]
      }
      tip: {
        Row: {
          amount_cents: number
          block_number: number | null
          blockchain_network: string | null
          created_at: string | null
          currency: string
          customer_session_id: string | null
          from_wallet_address: string | null
          gas_paid_cents: number | null
          id: string
          location_id: string | null
          org_id: string
          platform_fee_cents: number | null
          received_at: string | null
          server_assignment_id: string
          server_id: string
          source: Database["public"]["Enums"]["tip_source"]
          status: Database["public"]["Enums"]["tip_status"]
          stripe_payment_intent_id: string | null
          to_wallet_address: string | null
          token_contract_address: string | null
          token_symbol: string | null
          tx_hash: string | null
        }
        Insert: {
          amount_cents: number
          block_number?: number | null
          blockchain_network?: string | null
          created_at?: string | null
          currency?: string
          customer_session_id?: string | null
          from_wallet_address?: string | null
          gas_paid_cents?: number | null
          id?: string
          location_id?: string | null
          org_id: string
          platform_fee_cents?: number | null
          received_at?: string | null
          server_assignment_id: string
          server_id: string
          source: Database["public"]["Enums"]["tip_source"]
          status?: Database["public"]["Enums"]["tip_status"]
          stripe_payment_intent_id?: string | null
          to_wallet_address?: string | null
          token_contract_address?: string | null
          token_symbol?: string | null
          tx_hash?: string | null
        }
        Update: {
          amount_cents?: number
          block_number?: number | null
          blockchain_network?: string | null
          created_at?: string | null
          currency?: string
          customer_session_id?: string | null
          from_wallet_address?: string | null
          gas_paid_cents?: number | null
          id?: string
          location_id?: string | null
          org_id?: string
          platform_fee_cents?: number | null
          received_at?: string | null
          server_assignment_id?: string
          server_id?: string
          source?: Database["public"]["Enums"]["tip_source"]
          status?: Database["public"]["Enums"]["tip_status"]
          stripe_payment_intent_id?: string | null
          to_wallet_address?: string | null
          token_contract_address?: string | null
          token_symbol?: string | null
          tx_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tip_customer_session_id_fkey"
            columns: ["customer_session_id"]
            isOneToOne: false
            referencedRelation: "customer_session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tip_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tip_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tip_server_assignment_id_fkey"
            columns: ["server_assignment_id"]
            isOneToOne: false
            referencedRelation: "server_assignment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tip_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "server_profile"
            referencedColumns: ["server_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      venue_metrics_cache: {
        Row: {
          avg_rating_emoji: string | null
          avg_tip_percent: number | null
          intl_ratio: number | null
          last_calculated_at: string | null
          local_ratio: number | null
          return_rate_guess: number | null
          total_reviews: number | null
          total_tips: number | null
          venue_id: string
        }
        Insert: {
          avg_rating_emoji?: string | null
          avg_tip_percent?: number | null
          intl_ratio?: number | null
          last_calculated_at?: string | null
          local_ratio?: number | null
          return_rate_guess?: number | null
          total_reviews?: number | null
          total_tips?: number | null
          venue_id: string
        }
        Update: {
          avg_rating_emoji?: string | null
          avg_tip_percent?: number | null
          intl_ratio?: number | null
          last_calculated_at?: string | null
          local_ratio?: number | null
          return_rate_guess?: number | null
          total_reviews?: number | null
          total_tips?: number | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_metrics_cache_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: true
            referencedRelation: "location"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          created_at: string | null
          id: string
          is_international: boolean | null
          is_local: boolean | null
          qr_code_id: string
          server_id: string | null
          session_fingerprint: string | null
          table_id: string | null
          venue_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_international?: boolean | null
          is_local?: boolean | null
          qr_code_id: string
          server_id?: string | null
          session_fingerprint?: string | null
          table_id?: string | null
          venue_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_international?: boolean | null
          is_local?: boolean | null
          qr_code_id?: string
          server_id?: string | null
          session_fingerprint?: string | null
          table_id?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qr_code"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "location"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_short_code: { Args: never; Returns: string }
      get_user_email: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_owns_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      review_sentiment: "positive" | "neutral" | "negative"
      tip_source: "stripe" | "cash" | "crypto"
      tip_status: "pending" | "succeeded" | "failed" | "refunded"
      user_role: "admin" | "owner" | "manager" | "server" | "customer"
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
      review_sentiment: ["positive", "neutral", "negative"],
      tip_source: ["stripe", "cash", "crypto"],
      tip_status: ["pending", "succeeded", "failed", "refunded"],
      user_role: ["admin", "owner", "manager", "server", "customer"],
    },
  },
} as const
