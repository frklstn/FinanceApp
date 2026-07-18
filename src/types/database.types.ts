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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          app_logo_url: string | null
          app_name: string
          document_title: string
          id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          app_logo_url?: string | null
          app_name?: string
          document_title?: string
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          app_logo_url?: string | null
          app_name?: string
          document_title?: string
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          currency: string | null
          end_date: string
          id: string
          period: string
          start_date: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          currency?: string | null
          end_date: string
          id?: string
          period?: string
          start_date: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          currency?: string | null
          end_date?: string
          id?: string
          period?: string
          start_date?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          parent_id: string | null
          type: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name: string
          parent_id?: string | null
          type?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          parent_id?: string | null
          type?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_payments: {
        Row: {
          amount: number
          created_at: string
          debt_id: string
          id: string
          note: string | null
          payment_date: string
          wallet_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          debt_id: string
          id?: string
          note?: string | null
          payment_date?: string
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          debt_id?: string
          id?: string
          note?: string | null
          payment_date?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_payments_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_planner_settings: {
        Row: {
          created_at: string
          salary_day: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          salary_day?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          salary_day?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_planner_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          amount: number
          contact_info: string | null
          created_at: string
          currency: string | null
          description: string | null
          due_date: string | null
          id: string
          interest_rate: number
          name: string
          remaining_amount: number
          status: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount: number
          contact_info?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          interest_rate?: number
          name: string
          remaining_amount?: number
          status?: string
          type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount?: number
          contact_info?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          interest_rate?: number
          name?: string
          remaining_amount?: number
          status?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          from_currency: string
          id: string
          rate: number
          to_currency: string
          updated_at: string | null
        }
        Insert: {
          from_currency: string
          id?: string
          rate: number
          to_currency: string
          updated_at?: string | null
        }
        Update: {
          from_currency?: string
          id?: string
          rate?: number
          to_currency?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_insights: {
        Row: {
          created_at: string
          description: string
          id: string
          metadata: Json
          title: string
          type: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          metadata?: Json
          title: string
          type?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          metadata?: Json
          title?: string
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_insights_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      income_timeline: {
        Row: {
          created_at: string
          effective_date: string
          id: string
          monthly_income: number
          workspace_id: string
          currency: string | null
        }
        Insert: {
          created_at?: string
          effective_date: string
          id?: string
          monthly_income: number
          workspace_id: string
          currency?: string | null
        }
        Update: {
          created_at?: string
          effective_date?: string
          id?: string
          monthly_income?: number
          workspace_id?: string
          currency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_timeline_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_trackers: {
        Row: {
          amount_applied: number | null
          amount_received: number
          app_name: string
          can_early_payoff: boolean | null
          category: string
          created_at: string
          due_day: number
          end_date: string | null
          id: string
          monthly_payment: number
          notes: string | null
          payment_frequency: string | null
          penalty_fee: number | null
          salary_date: number | null
          start_date: string
          status: string
          tenure_months: number
          total_remaining_balance: number | null
          total_repayment: number
          updated_at: string
          workspace_id: string
          currency: string | null
        }
        Insert: {
          amount_applied?: number | null
          amount_received: number
          app_name: string
          can_early_payoff?: boolean | null
          category?: string
          created_at?: string
          due_day: number
          end_date?: string | null
          id?: string
          monthly_payment: number
          notes?: string | null
          payment_frequency?: string | null
          penalty_fee?: number | null
          salary_date?: number | null
          start_date: string
          status?: string
          tenure_months: number
          total_remaining_balance?: number | null
          total_repayment: number
          updated_at?: string
          workspace_id: string
          currency?: string | null
        }
        Update: {
          amount_applied?: number | null
          amount_received?: number
          app_name?: string
          can_early_payoff?: boolean | null
          category?: string
          created_at?: string
          due_day?: number
          end_date?: string | null
          id?: string
          monthly_payment?: number
          notes?: string | null
          payment_frequency?: string | null
          penalty_fee?: number | null
          salary_date?: number | null
          start_date?: string
          status?: string
          tenure_months?: number
          total_remaining_balance?: number | null
          total_repayment?: number
          updated_at?: string
          workspace_id?: string
          currency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_trackers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          app_document_title: string | null
          app_icon_url: string | null
          app_logo_url: string | null
          app_name: string | null
          app_title: string | null
          avatar_url: string | null
          created_at: string
          currency: string | null
          email: string
          full_name: string | null
          id: string
          is_suspended: boolean | null
          language: string | null
          plan: string
          plan_expires_at: string | null
          timezone: string | null
          tax_rate: number | null
          updated_at: string
          whatsapp_contact: string | null
          workspace_id: string | null
        }
        Insert: {
          app_document_title?: string | null
          app_icon_url?: string | null
          app_logo_url?: string | null
          app_name?: string | null
          app_title?: string | null
          avatar_url?: string | null
          created_at?: string
          currency?: string | null
          email: string
          full_name?: string | null
          id: string
          is_suspended?: boolean | null
          language?: string | null
          plan?: string
          plan_expires_at?: string | null
          timezone?: string | null
          tax_rate?: number | null
          updated_at?: string
          whatsapp_contact?: string | null
          workspace_id?: string | null
        }
        Update: {
          app_document_title?: string | null
          app_icon_url?: string | null
          app_logo_url?: string | null
          app_name?: string | null
          app_title?: string | null
          avatar_url?: string | null
          created_at?: string
          currency?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_suspended?: boolean | null
          language?: string | null
          plan?: string
          plan_expires_at?: string | null
          timezone?: string | null
          tax_rate?: number | null
          updated_at?: string
          whatsapp_contact?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          end_date: string | null
          frequency: string
          id: string
          interval_value: number
          is_active: boolean
          next_occurrence: string
          note: string | null
          start_date: string
          type: string
          updated_at: string
          wallet_id: string
          workspace_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          end_date?: string | null
          frequency: string
          id?: string
          interval_value?: number
          is_active?: boolean
          next_occurrence: string
          note?: string | null
          start_date: string
          type: string
          updated_at?: string
          wallet_id: string
          workspace_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          end_date?: string | null
          frequency?: string
          id?: string
          interval_value?: number
          is_active?: boolean
          next_occurrence?: string
          note?: string | null
          start_date?: string
          type?: string
          updated_at?: string
          wallet_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          created_at: string
          current_amount: number
          deadline: string | null
          id: string
          is_completed: boolean
          name: string
          target_amount: number
          updated_at: string
          wallet_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          is_completed?: boolean
          name: string
          target_amount: number
          updated_at?: string
          wallet_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          is_completed?: boolean
          name?: string
          target_amount?: number
          updated_at?: string
          wallet_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_goals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_reports: {
        Row: {
          created_at: string
          deductible_expenses: number
          expense_summary: number
          id: string
          income_summary: number
          metadata: Json
          workspace_id: string
          year: number
        }
        Insert: {
          created_at?: string
          deductible_expenses?: number
          expense_summary?: number
          id?: string
          income_summary?: number
          metadata?: Json
          workspace_id: string
          year: number
        }
        Update: {
          created_at?: string
          deductible_expenses?: number
          expense_summary?: number
          id?: string
          income_summary?: number
          metadata?: Json
          workspace_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "tax_reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          attachment_url: string | null
          category_id: string | null
          created_at: string
          currency: string | null
          date: string
          destination_wallet_id: string | null
          exchange_rate: number | null
          id: string
          is_recurring: boolean
          note: string | null
          recurring_id: string | null
          tags: string[]
          type: string
          updated_at: string
          wallet_id: string
          workspace_id: string
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string | null
          date?: string
          destination_wallet_id?: string | null
          exchange_rate?: number | null
          id?: string
          is_recurring?: boolean
          note?: string | null
          recurring_id?: string | null
          tags?: string[]
          type: string
          updated_at?: string
          wallet_id: string
          workspace_id: string
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string | null
          date?: string
          destination_wallet_id?: string | null
          exchange_rate?: number | null
          id?: string
          is_recurring?: boolean
          note?: string | null
          recurring_id?: string | null
          tags?: string[]
          type?: string
          updated_at?: string
          wallet_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_destination_wallet_id_fkey"
            columns: ["destination_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          color: string
          created_at: string
          currency: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          balance?: number
          color?: string
          created_at?: string
          currency?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          type?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          balance?: number
          color?: string
          created_at?: string
          currency?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          role: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          role?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          role?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
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
      delete_my_account: { Args: never; Returns: undefined }
      is_superadmin: { Args: never; Returns: boolean }
      is_workspace_member: {
        Args: { user_id: string; workspace_id: string }
        Returns: boolean
      }
      reset_my_data: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
