
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      listings: {
        Row: {
          id: string
          created_at: string
          brand: string
          model: string
          title: string | null
          year: number
          price_per_month_chf: number
          remaining_months: number
          location: string
          mileage_km: number
          fuel: "Benzin" | "Diesel" | "Hybrid" | "Elektro"
          gearbox: "Automatik" | "Manuell"
          body: "Limousine" | "Kombi" | "SUV" | "Cabrio"
          premium: boolean
          cover_image_url: string | null
          deposit_chf: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          brand: string
          model: string
          title?: string | null
          year: number
          price_per_month_chf: number
          remaining_months: number
          location: string
          mileage_km: number
          fuel: "Benzin" | "Diesel" | "Hybrid" | "Elektro"
          gearbox: "Automatik" | "Manuell"
          body: "Limousine" | "Kombi" | "SUV" | "Cabrio"
          premium?: boolean
          cover_image_url?: string | null
          deposit_chf?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          brand?: string
          model?: string
          title?: string | null
          year?: number
          price_per_month_chf?: number
          remaining_months?: number
          location?: string
          mileage_km?: number
          fuel?: "Benzin" | "Diesel" | "Hybrid" | "Elektro"
          gearbox?: "Automatik" | "Manuell"
          body?: "Limousine" | "Kombi" | "SUV" | "Cabrio"
          premium?: boolean
          cover_image_url?: string | null
          deposit_chf?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}