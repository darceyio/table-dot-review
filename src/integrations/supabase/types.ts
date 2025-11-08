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
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
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
          created_at: string | null
          id: string
          name: string
          org_id: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          name: string
          org_id: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          name?: string
          org_id?: string
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
        }
        Insert: {
          code: string
          created_at?: string | null
          deep_link_url?: string | null
          id?: string
          is_active?: boolean | null
          server_assignment_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          deep_link_url?: string | null
          id?: string
          is_active?: boolean | null
          server_assignment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_code_server_assignment_id_fkey"
            columns: ["server_assignment_id"]
            isOneToOne: false
            referencedRelation: "server_assignment"
            referencedColumns: ["id"]
          },
        ]
      }
      review: {
        Row: {
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
          sentiment: Database["public"]["Enums"]["review_sentiment"]
          server_assignment_id: string
          server_id: string
          text: string | null
        }
        Insert: {
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
          sentiment: Database["public"]["Enums"]["review_sentiment"]
          server_assignment_id: string
          server_id: string
          text?: string | null
        }
        Update: {
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
          sentiment?: Database["public"]["Enums"]["review_sentiment"]
          server_assignment_id?: string
          server_id?: string
          text?: string | null
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
          global_wallet_address: string | null
          server_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          global_wallet_address?: string | null
          server_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          global_wallet_address?: string | null
          server_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
