 
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
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          last_read_at: string | null
          role: string
          unread_count: number
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          last_read_at?: string | null
          role?: string
          unread_count?: number
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          last_read_at?: string | null
          role?: string
          unread_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          archive_expires_at: string | null
          archived_at: string | null
          created_at: string
          id: string
          last_message_at: string | null
          listing_id: string
          status: string
        }
        Insert: {
          archive_expires_at?: string | null
          archived_at?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          listing_id: string
          status?: string
        }
        Update: {
          archive_expires_at?: string | null
          archived_at?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          listing_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_admin_overrides: {
        Row: {
          created_at: string
          created_by: string | null
          dealer_id: string
          ends_at: string
          id: string
          notes: string | null
          plan_id: string
          starts_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dealer_id: string
          ends_at: string
          id?: string
          notes?: string | null
          plan_id: string
          starts_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dealer_id?: string
          ends_at?: string
          id?: string
          notes?: string | null
          plan_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dealer_admin_overrides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_admin_overrides_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_admin_overrides_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "dealer_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_plan_changes: {
        Row: {
          created_at: string
          dealer_id: string
          effective_date: string
          from_plan_id: string | null
          id: string
          notes: string | null
          requested_at: string
          status: Database["public"]["Enums"]["dealer_plan_change_status"]
          to_plan_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dealer_id: string
          effective_date?: string
          from_plan_id?: string | null
          id?: string
          notes?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["dealer_plan_change_status"]
          to_plan_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dealer_id?: string
          effective_date?: string
          from_plan_id?: string | null
          id?: string
          notes?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["dealer_plan_change_status"]
          to_plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dealer_plan_changes_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_plan_changes_from_plan_id_fkey"
            columns: ["from_plan_id"]
            isOneToOne: false
            referencedRelation: "dealer_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_plan_changes_to_plan_id_fkey"
            columns: ["to_plan_id"]
            isOneToOne: false
            referencedRelation: "dealer_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_plans: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          listing_limit: number | null
          monthly_price_chf: number | null
          name: string
          onboarding_included: boolean
          onboarding_note: string | null
          premium_included_per_month: number | null
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          listing_limit?: number | null
          monthly_price_chf?: number | null
          name: string
          onboarding_included?: boolean
          onboarding_note?: string | null
          premium_included_per_month?: number | null
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          listing_limit?: number | null
          monthly_price_chf?: number | null
          name?: string
          onboarding_included?: boolean
          onboarding_note?: string | null
          premium_included_per_month?: number | null
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dealer_premium_credits: {
        Row: {
          created_at: string
          credits_included: number
          credits_used: number
          dealer_id: string
          id: string
          period_yyyymm: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits_included?: number
          credits_used?: number
          dealer_id: string
          id?: string
          period_yyyymm: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits_included?: number
          credits_used?: number
          dealer_id?: string
          id?: string
          period_yyyymm?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dealer_premium_credits_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          dealer_id: string
          end_date: string | null
          ended_at: string | null
          grace_ends_at: string | null
          id: string
          plan_id: string
          start_date: string
          status: Database["public"]["Enums"]["dealer_subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          dealer_id: string
          end_date?: string | null
          ended_at?: string | null
          grace_ends_at?: string | null
          id?: string
          plan_id: string
          start_date?: string
          status?: Database["public"]["Enums"]["dealer_subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          dealer_id?: string
          end_date?: string | null
          ended_at?: string | null
          grace_ends_at?: string | null
          id?: string
          plan_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["dealer_subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dealer_subscriptions_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: true
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "dealer_plans"
            referencedColumns: ["id"]
          },
        ]
      }
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
      email_notification_log: {
        Row: {
          created_at: string
          days_before: number | null
          entity_id: string | null
          id: string
          kind: string
          message_id: string | null
          recipient_email: string | null
          recipient_user_id: string | null
        }
        Insert: {
          created_at?: string
          days_before?: number | null
          entity_id?: string | null
          id?: string
          kind: string
          message_id?: string | null
          recipient_email?: string | null
          recipient_user_id?: string | null
        }
        Update: {
          created_at?: string
          days_before?: number | null
          entity_id?: string | null
          id?: string
          kind?: string
          message_id?: string | null
          recipient_email?: string | null
          recipient_user_id?: string | null
        }
        Relationships: []
      }
      garages: {
        Row: {
          city: string | null
          contact_email: string | null
          created_at: string | null
          description: string | null
          garage_name: string
          google_reviews_snippet: Json | null
          header_image_url: string | null
          id: string
          listing_limit: number | null
          logo_url: string | null
          opening_hours: Json | null
          owner_user_id: string
          phone_number: string | null
          plan: string | null
          services: string[] | null
          slug: string | null
          team_members: Json
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          city?: string | null
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          garage_name: string
          google_reviews_snippet?: Json | null
          header_image_url?: string | null
          id?: string
          listing_limit?: number | null
          logo_url?: string | null
          opening_hours?: Json | null
          owner_user_id: string
          phone_number?: string | null
          plan?: string | null
          services?: string[] | null
          slug?: string | null
          team_members?: Json
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          city?: string | null
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          garage_name?: string
          google_reviews_snippet?: Json | null
          header_image_url?: string | null
          id?: string
          listing_limit?: number | null
          logo_url?: string | null
          opening_hours?: Json | null
          owner_user_id?: string
          phone_number?: string | null
          plan?: string | null
          services?: string[] | null
          slug?: string | null
          team_members?: Json
          updated_at?: string | null
          website_url?: string | null
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
      listing_drafts: {
        Row: {
          catalog_confidence: string | null
          catalog_needs_review: boolean
          created_at: string
          data: Json
          id: string
          make_id: string | null
          model_id: string | null
          updated_at: string
          user_id: string
          variant_id: string | null
          variant_text: string | null
        }
        Insert: {
          catalog_confidence?: string | null
          catalog_needs_review?: boolean
          created_at?: string
          data?: Json
          id?: string
          make_id?: string | null
          model_id?: string | null
          updated_at?: string
          user_id: string
          variant_id?: string | null
          variant_text?: string | null
        }
        Update: {
          catalog_confidence?: string | null
          catalog_needs_review?: boolean
          created_at?: string
          data?: Json
          id?: string
          make_id?: string | null
          model_id?: string | null
          updated_at?: string
          user_id?: string
          variant_id?: string | null
          variant_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_drafts_make_id_fkey"
            columns: ["make_id"]
            isOneToOne: false
            referencedRelation: "makes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_drafts_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_drafts_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
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
            referencedRelation: "listings_public"
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
      listing_media_backups: {
        Row: {
          cover_image_index: number | null
          cover_image_url: string | null
          created_at: string
          images: Json
          listing_id: string
        }
        Insert: {
          cover_image_index?: number | null
          cover_image_url?: string | null
          created_at?: string
          images?: Json
          listing_id: string
        }
        Update: {
          cover_image_index?: number | null
          cover_image_url?: string | null
          created_at?: string
          images?: Json
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_media_backups_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_media_backups_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_media_backups_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "public_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_premium_purchases: {
        Row: {
          amount_chf: number
          currency: string
          id: string
          listing_id: string
          purchased_at: string
          stripe_checkout_session_id: string
          user_id: string | null
        }
        Insert: {
          amount_chf: number
          currency?: string
          id?: string
          listing_id: string
          purchased_at?: string
          stripe_checkout_session_id: string
          user_id?: string | null
        }
        Update: {
          amount_chf?: number
          currency?: string
          id?: string
          listing_id?: string
          purchased_at?: string
          stripe_checkout_session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_premium_purchases_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_premium_purchases_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_premium_purchases_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_tombstones: {
        Row: {
          brand: string | null
          cover_image_url: string | null
          deal_type: Database["public"]["Enums"]["deal_type"] | null
          deleted_at: string
          financing_type: Database["public"]["Enums"]["financing_type"] | null
          garage_id: string | null
          id: string
          location: string | null
          model: string | null
          original_listing_id: string
          price_per_month_chf: number | null
          purchase_price_chf: number | null
          seller_user_id: string | null
          sold_at: string | null
          year: number | null
        }
        Insert: {
          brand?: string | null
          cover_image_url?: string | null
          deal_type?: Database["public"]["Enums"]["deal_type"] | null
          deleted_at?: string
          financing_type?: Database["public"]["Enums"]["financing_type"] | null
          garage_id?: string | null
          id?: string
          location?: string | null
          model?: string | null
          original_listing_id: string
          price_per_month_chf?: number | null
          purchase_price_chf?: number | null
          seller_user_id?: string | null
          sold_at?: string | null
          year?: number | null
        }
        Update: {
          brand?: string | null
          cover_image_url?: string | null
          deal_type?: Database["public"]["Enums"]["deal_type"] | null
          deleted_at?: string
          financing_type?: Database["public"]["Enums"]["financing_type"] | null
          garage_id?: string | null
          id?: string
          location?: string | null
          model?: string | null
          original_listing_id?: string
          price_per_month_chf?: number | null
          purchase_price_chf?: number | null
          seller_user_id?: string | null
          sold_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_tombstones_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_tombstones_seller_user_id_fkey"
            columns: ["seller_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          archived_at: string | null
          body: string
          brand: string
          canton_code: string | null
          contract_end_date: string | null
          cover_image_index: number | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          deal_type: Database["public"]["Enums"]["deal_type"]
          deposit_chf: number | null
          description: string | null
          drivetrain: string | null
          duration_days: number | null
          expires_at: string | null
          financing_type: Database["public"]["Enums"]["financing_type"] | null
          first_registration: string | null
          fuel: string
          garage_id: string | null
          gearbox: string
          id: string
          images: Json | null
          is_premium: boolean | null
          leasing_offer: Json | null
          location: string | null
          make_id: string | null
          make_model: string | null
          mileage_km: number
          model: string
          model_id: string | null
          moderation_note: string | null
          pause_until: string | null
          paused_at: string | null
          payment_status: string | null
          power_hp: number | null
          premium: boolean
          premium_until: string | null
          price_paid_chf: number | null
          price_per_month_chf: number | null
          price_plan: string | null
          pricing_plan: string | null
          purchase_price_chf: number | null
          refunded_at: string | null
          remaining_km: number | null
          remaining_months: number | null
          seller_type: string | null
          sold_at: string | null
          sold_delete_at: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
          status_before_sold:
            | Database["public"]["Enums"]["listing_status"]
            | null
          stripe_payment_intent_id: string | null
          stripe_refund_id: string | null
          title: string | null
          ui_version: string | null
          updated_at: string | null
          user_id: string | null
          variant_id: string | null
          view_count: number | null
          vin: string | null
          year: number
        }
        Insert: {
          archived_at?: string | null
          body: string
          brand: string
          canton_code?: string | null
          contract_end_date?: string | null
          cover_image_index?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_type?: Database["public"]["Enums"]["deal_type"]
          deposit_chf?: number | null
          description?: string | null
          drivetrain?: string | null
          duration_days?: number | null
          expires_at?: string | null
          financing_type?: Database["public"]["Enums"]["financing_type"] | null
          first_registration?: string | null
          fuel: string
          garage_id?: string | null
          gearbox: string
          id?: string
          images?: Json | null
          is_premium?: boolean | null
          leasing_offer?: Json | null
          location?: string | null
          make_id?: string | null
          make_model?: string | null
          mileage_km: number
          model: string
          model_id?: string | null
          moderation_note?: string | null
          pause_until?: string | null
          paused_at?: string | null
          payment_status?: string | null
          power_hp?: number | null
          premium?: boolean
          premium_until?: string | null
          price_paid_chf?: number | null
          price_per_month_chf?: number | null
          price_plan?: string | null
          pricing_plan?: string | null
          purchase_price_chf?: number | null
          refunded_at?: string | null
          remaining_km?: number | null
          remaining_months?: number | null
          seller_type?: string | null
          sold_at?: string | null
          sold_delete_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          status_before_sold?:
            | Database["public"]["Enums"]["listing_status"]
            | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          title?: string | null
          ui_version?: string | null
          updated_at?: string | null
          user_id?: string | null
          variant_id?: string | null
          view_count?: number | null
          vin?: string | null
          year: number
        }
        Update: {
          archived_at?: string | null
          body?: string
          brand?: string
          canton_code?: string | null
          contract_end_date?: string | null
          cover_image_index?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_type?: Database["public"]["Enums"]["deal_type"]
          deposit_chf?: number | null
          description?: string | null
          drivetrain?: string | null
          duration_days?: number | null
          expires_at?: string | null
          financing_type?: Database["public"]["Enums"]["financing_type"] | null
          first_registration?: string | null
          fuel?: string
          garage_id?: string | null
          gearbox?: string
          id?: string
          images?: Json | null
          is_premium?: boolean | null
          leasing_offer?: Json | null
          location?: string | null
          make_id?: string | null
          make_model?: string | null
          mileage_km?: number
          model?: string
          model_id?: string | null
          moderation_note?: string | null
          pause_until?: string | null
          paused_at?: string | null
          payment_status?: string | null
          power_hp?: number | null
          premium?: boolean
          premium_until?: string | null
          price_paid_chf?: number | null
          price_per_month_chf?: number | null
          price_plan?: string | null
          pricing_plan?: string | null
          purchase_price_chf?: number | null
          refunded_at?: string | null
          remaining_km?: number | null
          remaining_months?: number | null
          seller_type?: string | null
          sold_at?: string | null
          sold_delete_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          status_before_sold?:
            | Database["public"]["Enums"]["listing_status"]
            | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          title?: string | null
          ui_version?: string | null
          updated_at?: string | null
          user_id?: string | null
          variant_id?: string | null
          view_count?: number | null
          vin?: string | null
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
          {
            foreignKeyName: "listings_make_id_fkey"
            columns: ["make_id"]
            isOneToOne: false
            referencedRelation: "makes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      makes: {
        Row: {
          created_at: string
          id: string
          name: string
          normalized_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          normalized_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          normalized_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_attachments: {
        Row: {
          created_at: string
          file_name: string
          id: string
          message_id: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          message_id: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          message_id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_user_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_user_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          created_at: string
          id: string
          make_id: string
          name: string
          normalized_name: string
          source: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          make_id: string
          name: string
          normalized_name: string
          source?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          make_id?: string
          name?: string
          normalized_name?: string
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "models_make_id_fkey"
            columns: ["make_id"]
            isOneToOne: false
            referencedRelation: "makes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string
          show_name_publicly: boolean
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string
          show_name_publicly?: boolean
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          show_name_publicly?: boolean
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
      variants: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          model_id: string
          name: string
          normalized_name: string
          source: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          model_id: string
          name: string
          normalized_name: string
          source?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          model_id?: string
          name?: string
          normalized_name?: string
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "variants_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_aliases: {
        Row: {
          alias: string
          created_at: string
          entity_type: string
          id: string
          make_id: string | null
          model_id: string | null
          normalized_alias: string
          source: string
          variant_id: string | null
        }
        Insert: {
          alias: string
          created_at?: string
          entity_type: string
          id?: string
          make_id?: string | null
          model_id?: string | null
          normalized_alias: string
          source?: string
          variant_id?: string | null
        }
        Update: {
          alias?: string
          created_at?: string
          entity_type?: string
          id?: string
          make_id?: string | null
          model_id?: string | null
          normalized_alias?: string
          source?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_aliases_make_id_fkey"
            columns: ["make_id"]
            isOneToOne: false
            referencedRelation: "makes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_aliases_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_aliases_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
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
      vin_cache: {
        Row: {
          created_at: string
          decoded_payload: Json | null
          error_message: string | null
          make_id: string | null
          model_id: string | null
          normalized_payload: Json | null
          provider: string
          status: string
          updated_at: string
          variant_id: string | null
          vin: string
        }
        Insert: {
          created_at?: string
          decoded_payload?: Json | null
          error_message?: string | null
          make_id?: string | null
          model_id?: string | null
          normalized_payload?: Json | null
          provider?: string
          status?: string
          updated_at?: string
          variant_id?: string | null
          vin: string
        }
        Update: {
          created_at?: string
          decoded_payload?: Json | null
          error_message?: string | null
          make_id?: string | null
          model_id?: string | null
          normalized_payload?: Json | null
          provider?: string
          status?: string
          updated_at?: string
          variant_id?: string | null
          vin?: string
        }
        Relationships: [
          {
            foreignKeyName: "vin_cache_make_id_fkey"
            columns: ["make_id"]
            isOneToOne: false
            referencedRelation: "makes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vin_cache_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vin_cache_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      listings_public: {
        Row: {
          archived_at: string | null
          body: string | null
          brand: string | null
          canton_code: string | null
          cover_image_index: number | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          deal_type: Database["public"]["Enums"]["deal_type"] | null
          deposit_chf: number | null
          description: string | null
          drivetrain: string | null
          duration_days: number | null
          expires_at: string | null
          financing_type: Database["public"]["Enums"]["financing_type"] | null
          first_registration: string | null
          fuel: string | null
          garage_id: string | null
          gearbox: string | null
          id: string | null
          images: Json | null
          is_premium: boolean | null
          leasing_offer: Json | null
          location: string | null
          make_id: string | null
          mileage_km: number | null
          model: string | null
          model_id: string | null
          moderation_note: string | null
          payment_status: string | null
          power_hp: number | null
          premium: boolean | null
          premium_until: string | null
          price_paid_chf: number | null
          price_per_month_chf: number | null
          price_plan: string | null
          pricing_plan: string | null
          purchase_price_chf: number | null
          refunded_at: string | null
          remaining_km: number | null
          remaining_months: number | null
          seller_type: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
          stripe_payment_intent_id: string | null
          stripe_refund_id: string | null
          title: string | null
          ui_version: string | null
          updated_at: string | null
          user_id: string | null
          variant_id: string | null
          view_count: number | null
          vin: string | null
          year: number | null
        }
        Insert: {
          archived_at?: string | null
          body?: string | null
          brand?: string | null
          canton_code?: string | null
          cover_image_index?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_type?: Database["public"]["Enums"]["deal_type"] | null
          deposit_chf?: number | null
          description?: string | null
          drivetrain?: string | null
          duration_days?: number | null
          expires_at?: string | null
          financing_type?: Database["public"]["Enums"]["financing_type"] | null
          first_registration?: string | null
          fuel?: string | null
          garage_id?: string | null
          gearbox?: string | null
          id?: string | null
          images?: Json | null
          is_premium?: boolean | null
          leasing_offer?: Json | null
          location?: string | null
          make_id?: string | null
          mileage_km?: number | null
          model?: string | null
          model_id?: string | null
          moderation_note?: string | null
          payment_status?: string | null
          power_hp?: number | null
          premium?: boolean | null
          premium_until?: string | null
          price_paid_chf?: number | null
          price_per_month_chf?: number | null
          price_plan?: string | null
          pricing_plan?: string | null
          purchase_price_chf?: number | null
          refunded_at?: string | null
          remaining_km?: number | null
          remaining_months?: number | null
          seller_type?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          title?: string | null
          ui_version?: string | null
          updated_at?: string | null
          user_id?: string | null
          variant_id?: string | null
          view_count?: number | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          archived_at?: string | null
          body?: string | null
          brand?: string | null
          canton_code?: string | null
          cover_image_index?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_type?: Database["public"]["Enums"]["deal_type"] | null
          deposit_chf?: number | null
          description?: string | null
          drivetrain?: string | null
          duration_days?: number | null
          expires_at?: string | null
          financing_type?: Database["public"]["Enums"]["financing_type"] | null
          first_registration?: string | null
          fuel?: string | null
          garage_id?: string | null
          gearbox?: string | null
          id?: string | null
          images?: Json | null
          is_premium?: boolean | null
          leasing_offer?: Json | null
          location?: string | null
          make_id?: string | null
          mileage_km?: number | null
          model?: string | null
          model_id?: string | null
          moderation_note?: string | null
          payment_status?: string | null
          power_hp?: number | null
          premium?: boolean | null
          premium_until?: string | null
          price_paid_chf?: number | null
          price_per_month_chf?: number | null
          price_plan?: string | null
          pricing_plan?: string | null
          purchase_price_chf?: number | null
          refunded_at?: string | null
          remaining_km?: number | null
          remaining_months?: number | null
          seller_type?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          title?: string | null
          ui_version?: string | null
          updated_at?: string | null
          user_id?: string | null
          variant_id?: string | null
          view_count?: number | null
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_make_id_fkey"
            columns: ["make_id"]
            isOneToOne: false
            referencedRelation: "makes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      public_listings: {
        Row: {
          body: string | null
          brand: string | null
          canton_code: string | null
          cover_image_index: number | null
          cover_image_url: string | null
          created_at: string | null
          deal_type: Database["public"]["Enums"]["deal_type"] | null
          deposit_chf: number | null
          description: string | null
          financing_type: Database["public"]["Enums"]["financing_type"] | null
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
          deal_type?: Database["public"]["Enums"]["deal_type"] | null
          deposit_chf?: number | null
          description?: string | null
          financing_type?: Database["public"]["Enums"]["financing_type"] | null
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
          deal_type?: Database["public"]["Enums"]["deal_type"] | null
          deposit_chf?: number | null
          description?: string | null
          financing_type?: Database["public"]["Enums"]["financing_type"] | null
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
      _get_listing_seller_user_id: {
        Args: { p_listing_id: string }
        Returns: string
      }
      admin_downgrade_garage_to_private: {
        Args: { p_target_user_id: string }
        Returns: Json
      }
      admin_is_admin: { Args: { p_user_id: string }; Returns: boolean }
      apply_listing_premium_purchase: {
        Args: {
          amount_chf: number
          listing_id: string
          stripe_checkout_session_id: string
          user_id: string
        }
        Returns: undefined
      }
      archive_conversation: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      archive_expired_listings: { Args: never; Returns: Json }
      archive_listing: { Args: { p_listing_id: string }; Returns: undefined }
      create_or_get_conversation_for_listing: {
        Args: { p_listing_id: string }
        Returns: string
      }
      dealer_has_entitlement: {
        Args: { p_dealer_id: string }
        Returns: boolean
      }
      ensure_dealer_premium_credits:
        | {
            Args: { p_dealer_id: string }
            Returns: {
              created_at: string
              credits_included: number
              credits_used: number
              dealer_id: string
              id: string
              period_yyyymm: string
              updated_at: string
            }
            SetofOptions: {
              from: "*"
              to: "dealer_premium_credits"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { p_dealer_id: string; p_period_yyyymm: string }
            Returns: {
              created_at: string
              credits_included: number
              credits_used: number
              dealer_id: string
              id: string
              period_yyyymm: string
              updated_at: string
            }
            SetofOptions: {
              from: "*"
              to: "dealer_premium_credits"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      ensure_dealer_premium_credits_v1: {
        Args: { dealer_id: string }
        Returns: undefined
      }
      ensure_dealer_subscription_exists: {
        Args: { p_dealer_id: string }
        Returns: undefined
      }
      garage_set_listing_premium_with_credit: {
        Args: { listing_id: string }
        Returns: Json
      }
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
      get_conversation_context: {
        Args: { p_conversation_id: string }
        Returns: Json
      }
      get_distinct_brands: { Args: never; Returns: string[] }
      get_garage_public: {
        Args: { p_garage_id: string }
        Returns: {
          city: string
          description: string
          garage_name: string
          id: string
          slug: string
        }[]
      }
      get_garage_public_v2: {
        Args: { p_garage_id: string }
        Returns: {
          city: string
          description: string
          garage_name: string
          header_image_url: string
          id: string
          slug: string
        }[]
      }
      get_listing_cover_image: {
        Args: { p_cover_index: number; p_cover_url: string; p_images: Json }
        Returns: string
      }
      get_listing_inquiry_counts: {
        Args: { p_listing_ids: string[] }
        Returns: {
          last30d: number
          last7d: number
          listing_id: string
          total: number
        }[]
      }
      get_models_for_brand: {
        Args: { p_brand: string }
        Returns: {
          model: string
        }[]
      }
      get_my_message_threads: {
        Args: { p_limit?: number }
        Returns: {
          conversation_id: string
          conversation_status: string
          counterparty_display_name: string
          last_message_at: string
          last_message_body: string
          listing_cover_image_url: string
          listing_id: string
          listing_make_model: string
          listing_status: Database["public"]["Enums"]["listing_status"]
          seller_display_name: string
          unread_count: number
        }[]
      }
      get_my_role: { Args: never; Returns: string }
      get_my_unread_message_count: { Args: never; Returns: number }
      get_public_garage_by_slug: {
        Args: { p_slug: string }
        Returns: {
          city: string
          contact_email: string
          created_at: string
          description: string
          garage_name: string
          header_image_url: string
          id: string
          listing_limit: number
          logo_url: string
          opening_hours: Json
          owner_user_id: string
          phone_number: string
          plan: string
          services: Json
          slug: string
          team_members: Json
          updated_at: string
          website_url: string
        }[]
      }
      get_public_garage_slugs: {
        Args: never
        Returns: {
          slug: string
        }[]
      }
      get_public_garages: {
        Args: { p_garage_ids: string[] }
        Returns: {
          city: string
          description: string
          garage_name: string
          header_image_url: string
          id: string
          logo_url: string
          slug: string
        }[]
      }
      get_public_listing_owner_profiles: {
        Args: { p_listing_ids: string[] }
        Returns: {
          avatar_url: string
          full_name: string
          listing_id: string
        }[]
      }
      get_public_profiles: {
        Args: { p_user_ids: string[] }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
        }[]
      }
      get_service_role_key: { Args: never; Returns: string }
      get_user_role: { Args: { user_id: string }; Returns: string }
      increment_listing_view: {
        Args: { p_listing_id: string }
        Returns: undefined
      }
      mark_conversation_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      mark_listing_available: {
        Args: { p_listing_id: string }
        Returns: undefined
      }
      mark_listing_sold: { Args: { p_listing_id: string }; Returns: undefined }
      normalize_vehicle_name: { Args: { input: string }; Returns: string }
      pause_listing: {
        Args: { p_listing_id: string; p_pause_days: number }
        Returns: undefined
      }
      publish_garage_listing: { Args: { listing_id: string }; Returns: Json }
      request_dealer_plan_change: {
        Args: { dealer_id: string; to_plan_code: string }
        Returns: Json
      }
      resolve_make_id: { Args: { p_make_text: string }; Returns: string }
      resolve_model_id: {
        Args: { p_make_id: string; p_model_text: string }
        Returns: string
      }
      resolve_variant_id: {
        Args: { p_model_id: string; p_variant_text: string }
        Returns: string
      }
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
      select_buyer_and_mark_listing_sold: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      supabase_url: { Args: never; Returns: string }
      sync_garage_plan_snapshot_from_subscription: {
        Args: { p_dealer_id: string }
        Returns: undefined
      }
      unpause_listing: { Args: { p_listing_id: string }; Returns: undefined }
      upgrade_to_garage: {
        Args: { p_city: string; p_contact_email: string; p_garage_name: string }
        Returns: Json
      }
    }
    Enums: {
      deal_type: "lease_takeover" | "direct_purchase"
      dealer_plan_change_status:
        | "requested"
        | "approved"
        | "rejected"
        | "applied"
      dealer_subscription_status:
        | "active"
        | "pending_change"
        | "canceled"
        | "past_due"
      financing_type: "cash" | "leasing"
      listing_status:
        | "pending"
        | "active"
        | "inactive"
        | "sold"
        | "published"
        | "rejected"
        | "expired"
        | "archived"
        | "draft"
        | "paused"
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
      deal_type: ["lease_takeover", "direct_purchase"],
      dealer_plan_change_status: [
        "requested",
        "approved",
        "rejected",
        "applied",
      ],
      dealer_subscription_status: [
        "active",
        "pending_change",
        "canceled",
        "past_due",
      ],
      financing_type: ["cash", "leasing"],
      listing_status: [
        "pending",
        "active",
        "inactive",
        "sold",
        "published",
        "rejected",
        "expired",
        "archived",
        "draft",
        "paused",
      ],
      service_inquiry_type: [
        "uebernahme_begleiten",
        "leasing_exit_full_service",
      ],
    },
  },
} as const
