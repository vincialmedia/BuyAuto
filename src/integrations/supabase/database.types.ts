 
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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      debug_logs: {
        Row: {
          created_at: string | null
          id: number
          log_message: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          log_message?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: number
          log_message?: Json | null
        }
        Relationships: []
      }
      garages: {
        Row: {
          city: string | null
          contact_email: string | null
          created_at: string | null
          garage_name: string
          id: string
          listing_limit: number | null
          owner_user_id: string
          plan: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          contact_email?: string | null
          created_at?: string | null
          garage_name: string
          id?: string
          listing_limit?: number | null
          owner_user_id: string
          plan?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          contact_email?: string | null
          created_at?: string | null
          garage_name?: string
          id?: string
          listing_limit?: number | null
          owner_user_id?: string
          plan?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "garages_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          listing_id: string
          message: string
          name: string
          phone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          listing_id: string
          message: string
          name: string
          phone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          listing_id?: string
          message?: string
          name?: string
          phone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          body: string
          brand: string
          canton_code: string | null
          cover_image_index: number | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          deposit_chf: number | null
          description: string | null
          duration_days: number | null
          expires_at: string | null
          fuel: string
          garage_id: string | null
          gearbox: string
          id: string
          images: Json | null
          is_premium: boolean | null
          location: string | null
          mileage_km: number
          model: string
          moderation_note: string | null
          payment_status: string | null
          premium: boolean
          premium_until: string | null
          price_paid_chf: number | null
          price_per_month_chf: number | null
          price_plan: string | null
          pricing_plan: string | null
          refunded_at: string | null
          remaining_km: number | null
          remaining_months: number | null
          seller_type: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
          stripe_payment_intent_id: string | null
          stripe_refund_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          year: number
        }
        Insert: {
          body: string
          brand: string
          canton_code?: string | null
          cover_image_index?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          deposit_chf?: number | null
          description?: string | null
          duration_days?: number | null
          expires_at?: string | null
          fuel: string
          garage_id?: string | null
          gearbox: string
          id?: string
          images?: Json | null
          is_premium?: boolean | null
          location?: string | null
          mileage_km: number
          model: string
          moderation_note?: string | null
          payment_status?: string | null
          premium?: boolean
          premium_until?: string | null
          price_paid_chf?: number | null
          price_per_month_chf?: number | null
          price_plan?: string | null
          pricing_plan?: string | null
          refunded_at?: string | null
          remaining_km?: number | null
          remaining_months?: number | null
          seller_type?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          year: number
        }
        Update: {
          body?: string
          brand?: string
          canton_code?: string | null
          cover_image_index?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          deposit_chf?: number | null
          description?: string | null
          duration_days?: number | null
          expires_at?: string | null
          fuel?: string
          garage_id?: string | null
          gearbox?: string
          id?: string
          images?: Json | null
          is_premium?: boolean | null
          location?: string | null
          mileage_km?: number
          model?: string
          moderation_note?: string | null
          payment_status?: string | null
          premium?: boolean
          premium_until?: string | null
          price_paid_chf?: number | null
          price_per_month_chf?: number | null
          price_plan?: string | null
          pricing_plan?: string | null
          refunded_at?: string | null
          remaining_km?: number | null
          remaining_months?: number | null
          seller_type?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      service_inquiries: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          id: string
          inquiry_type: Database["public"]["Enums"]["service_inquiry_type"]
          leasinggesellschaft: string | null
          nachricht: string
          name: string
          phone: string | null
          status: string
          vorname: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          id?: string
          inquiry_type: Database["public"]["Enums"]["service_inquiry_type"]
          leasinggesellschaft?: string | null
          nachricht: string
          name: string
          phone?: string | null
          status?: string
          vorname: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          id?: string
          inquiry_type?: Database["public"]["Enums"]["service_inquiry_type"]
          leasinggesellschaft?: string | null
          nachricht?: string
          name?: string
          phone?: string | null
          status?: string
          vorname?: string
        }
        Relationships: []
      }
      vehicle_catalog: {
        Row: {
          created_at: string
          id: number
          make: string
          model: string
        }
        Insert: {
          created_at?: string
          id?: number
          make: string
          model: string
        }
        Update: {
          created_at?: string
          id?: number
          make?: string
          model?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_listings: {
        Row: {
          body: string | null
          brand: string | null
          canton_code: string | null
          cover_image_index: number | null
          cover_image_url: string | null
          created_at: string | null
          deposit_chf: number | null
          description: string | null
          fuel: string | null
          gearbox: string | null
          id: string | null
          images: Json | null
          location: string | null
          mileage_km: number | null
          model: string | null
          premium: boolean | null
          price_per_month_chf: number | null
          remaining_km: number | null
          remaining_months: number | null
          title: string | null
          year: number | null
        }
        Insert: {
          body?: string | null
          brand?: string | null
          canton_code?: string | null
          cover_image_index?: number | null
          cover_image_url?: never
          created_at?: string | null
          deposit_chf?: number | null
          description?: string | null
          fuel?: string | null
          gearbox?: string | null
          id?: string | null
          images?: Json | null
          location?: string | null
          mileage_km?: number | null
          model?: string | null
          premium?: boolean | null
          price_per_month_chf?: number | null
          remaining_km?: number | null
          remaining_months?: number | null
          title?: string | null
          year?: number | null
        }
        Update: {
          body?: string | null
          brand?: string | null
          canton_code?: string | null
          cover_image_index?: number | null
          cover_image_url?: never
          created_at?: string | null
          deposit_chf?: number | null
          description?: string | null
          fuel?: string | null
          gearbox?: string | null
          id?: string | null
          images?: Json | null
          location?: string | null
          mileage_km?: number | null
          model?: string | null
          premium?: boolean | null
          price_per_month_chf?: number | null
          remaining_km?: number | null
          remaining_months?: number | null
          title?: string | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_all_users_with_profiles: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          last_sign_in_at: string
          role: string
          user_id: string
        }[]
      }
      get_distinct_brands: { Args: never; Returns: string[] }
      get_models_for_brand: {
        Args: { p_brand: string }
        Returns: {
          model: string
        }[]
      }
      get_my_role: { Args: never; Returns: string }
      get_service_role_key: { Args: never; Returns: string }
      get_user_role: { Args: { user_id: string }; Returns: string }
      publish_garage_listing: { Args: { listing_id: string }; Returns: Json }
      search_published_listings: {
        Args: {
          limit_count?: number
          max_mileage?: number
          max_price?: number
          max_year?: number
          min_price?: number
          min_year?: number
          offset_count?: number
          premium_only?: boolean
          search_body?: string
          search_brand?: string
          search_canton?: string
          search_fuel?: string
          search_gearbox?: string
          search_model?: string
        }
        Returns: {
          body: string
          brand: string
          canton_code: string
          cover_image_index: number
          cover_image_url: string
          created_at: string
          deposit_chf: number
          fuel: string
          gearbox: string
          id: string
          images: Json
          location: string
          mileage_km: number
          model: string
          premium: boolean
          price_per_month_chf: number
          remaining_months: number
          title: string
          year: number
        }[]
      }
      supabase_url: { Args: never; Returns: string }
      upgrade_to_garage: {
        Args: { p_city: string; p_contact_email: string; p_garage_name: string }
        Returns: Json
      }
    }
    Enums: {
      listing_status:
        | "pending"
        | "active"
        | "inactive"
        | "sold"
        | "published"
        | "rejected"
        | "expired"
        | "archived"
      service_inquiry_type: "uebernahme_begleiten" | "leasing_exit_full_service"
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
      listing_status: [
        "pending",
        "active",
        "inactive",
        "sold",
        "published",
        "rejected",
        "expired",
        "archived",
      ],
      service_inquiry_type: [
        "uebernahme_begleiten",
        "leasing_exit_full_service",
      ],
    },
  },
} as const
