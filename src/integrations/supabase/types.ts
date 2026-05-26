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
      profiles: {
        Row: {
          id: string
          company_name: string | null
          company_address: string | null
          company_city: string | null
          email: string | null
          phone_whatsapp: string | null
          regime_fiscal: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          company_name?: string | null
          company_address?: string | null
          company_city?: string | null
          email?: string | null
          phone_whatsapp?: string | null
          regime_fiscal?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          company_name?: string | null
          company_address?: string | null
          company_city?: string | null
          email?: string | null
          phone_whatsapp?: string | null
          regime_fiscal?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          user_id: string | null
          nom: string
          adresse: string | null
          telephone: string | null
          ifu: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          nom: string
          adresse?: string | null
          telephone?: string | null
          ifu?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          nom?: string
          adresse?: string | null
          telephone?: string | null
          ifu?: string | null
        }
        Relationships: []
      }
      produits: {
        Row: {
          id: string
          user_id: string | null
          designation: string
          unite: string | null
          prix_unitaire: number
          categorie: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          designation: string
          unite?: string | null
          prix_unitaire?: number
          categorie?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          designation?: string
          unite?: string | null
          prix_unitaire?: number
          categorie?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          company_id: string
          user_id: string | null
          client_id: string | null
          number: string
          date: string
          status: string
          total_ht: number
          total_ttc: number
          created_by: string | null
        }
        Insert: {
          id?: string
          company_id: string
          user_id?: string | null
          client_id?: string | null
          number: string
          date: string
          status?: string
          total_ht?: number
          total_ttc?: number
          created_by?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string | null
          client_id?: string | null
          number?: string
          date?: string
          status?: string
          total_ht?: number
          total_ttc?: number
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          product_id: string | null
          designation: string
          quantity: number
          unit_price: number
          total: number
        }
        Insert: {
          id?: string
          invoice_id: string
          product_id?: string | null
          designation: string
          quantity?: number
          unit_price?: number
          total?: number
        }
        Update: {
          id?: string
          invoice_id?: string
          product_id?: string | null
          designation?: string
          quantity?: number
          unit_price?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
        ]
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

type DefaultSchema = Database["public"]

export type Tables<
  TableName extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[TableName] extends {
  Row: infer R
}
  ? R
  : never

export type TablesInsert<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName] extends {
    Insert: infer I
  }
    ? I
    : never

export type TablesUpdate<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName] extends {
    Update: infer U
  }
    ? U
    : never

export type Enums<EnumName extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][EnumName]
