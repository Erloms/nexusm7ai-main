export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agent_customization_projects: {
        Row: {
          category: string
          contact_info: string | null
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          is_active: boolean
          price_info: string | null
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          contact_info?: string | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean
          price_info?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          contact_info?: string | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean
          price_info?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      agents: {
        Row: {
          avatar_url: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          creator_name: string | null
          credits_per_message: number | null
          description: string | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          model: string | null
          name: string
          rating: number | null
          system_prompt: string | null
          tags: string[] | null
          updated_at: string | null
          users_count: number | null
        }
        Insert: {
          avatar_url?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          creator_name?: string | null
          credits_per_message?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          model?: string | null
          name: string
          rating?: number | null
          system_prompt?: string | null
          tags?: string[] | null
          updated_at?: string | null
          users_count?: number | null
        }
        Update: {
          avatar_url?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          creator_name?: string | null
          credits_per_message?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          model?: string | null
          name?: string
          rating?: number | null
          system_prompt?: string | null
          tags?: string[] | null
          updated_at?: string | null
          users_count?: number | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          conversation_type: string
          created_at: string | null
          id: string
          messages: Json | null
          project_id: string | null
          user_id: string
        }
        Insert: {
          conversation_type: string
          created_at?: string | null
          id?: string
          messages?: Json | null
          project_id?: string | null
          user_id: string
        }
        Update: {
          conversation_type?: string
          created_at?: string | null
          id?: string
          messages?: Json | null
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_website_projects: {
        Row: {
          created_at: string
          demo_url: string | null
          description: string | null
          icon_name: string
          id: string
          is_active: boolean
          long_description: string | null
          screenshot_url: string | null
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          demo_url?: string | null
          description?: string | null
          icon_name: string
          id?: string
          is_active?: boolean
          long_description?: string | null
          screenshot_url?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          demo_url?: string | null
          description?: string | null
          icon_name?: string
          id?: string
          is_active?: boolean
          long_description?: string | null
          screenshot_url?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_templates: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_public: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          is_public?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_public?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          credits_earned: number
          id: string
          user_id: string
        }
        Insert: {
          checkin_date: string
          created_at?: string
          credits_earned?: number
          id?: string
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string
          credits_earned?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      membership_plans: {
        Row: {
          created_at: string | null
          description: string | null
          duration_months: number
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_months: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_months?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          alipay_trade_no: string | null
          amount: number
          created_at: string | null
          expires_at: string | null
          id: string
          order_number: string
          paid_at: string | null
          payment_method: string | null
          plan_id: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          user_id: string | null
        }
        Insert: {
          alipay_trade_no?: string | null
          amount: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          order_number: string
          paid_at?: string | null
          payment_method?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          user_id?: string | null
        }
        Update: {
          alipay_trade_no?: string | null
          amount?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          order_number?: string
          paid_at?: string | null
          payment_method?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_orders: {
        Row: {
          amount: number
          body: string | null
          created_at: string | null
          id: string
          order_id: string
          order_type: string
          status: string
          subject: string
          trade_no: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          body?: string | null
          created_at?: string | null
          id?: string
          order_id: string
          order_type: string
          status?: string
          subject: string
          trade_no?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          body?: string | null
          created_at?: string | null
          id?: string
          order_id?: string
          order_type?: string
          status?: string
          subject?: string
          trade_no?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ppt_generations: {
        Row: {
          created_at: string | null
          id: string
          outline_markdown: string | null
          ppt_url: string | null
          project_id: string
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          outline_markdown?: string | null
          ppt_url?: string | null
          project_id: string
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          outline_markdown?: string | null
          ppt_url?: string | null
          project_id?: string
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppt_generations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          membership_expires_at: string | null
          membership_type: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          membership_expires_at?: string | null
          membership_type?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          membership_expires_at?: string | null
          membership_type?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          data: Json | null
          description: string | null
          id: string
          phase: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          phase?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          phase?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scheduled_tasks: {
        Row: {
          created_at: string
          cron_expression: string
          id: string
          is_active: boolean
          model: string
          name: string
          system_prompt: string | null
          task_prompt: string
          tools: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cron_expression: string
          id?: string
          is_active?: boolean
          model: string
          name: string
          system_prompt?: string | null
          task_prompt: string
          tools?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cron_expression?: string
          id?: string
          is_active?: boolean
          model?: string
          name?: string
          system_prompt?: string | null
          task_prompt?: string
          tools?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          setting_key: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          setting_key: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      task_executions: {
        Row: {
          duration_ms: number | null
          error_message: string | null
          executed_at: string
          id: string
          result: Json | null
          status: string
          task_id: string
          user_id: string
        }
        Insert: {
          duration_ms?: number | null
          error_message?: string | null
          executed_at?: string
          id?: string
          result?: Json | null
          status: string
          task_id: string
          user_id: string
        }
        Update: {
          duration_ms?: number | null
          error_message?: string | null
          executed_at?: string
          id?: string
          result?: Json | null
          status?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_executions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "scheduled_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_content_templates: {
        Row: {
          created_at: string
          description: string | null
          elements: string[] | null
          hooks: string[] | null
          id: string
          name: string
          sample_text: string | null
          style: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          elements?: string[] | null
          hooks?: string[] | null
          id?: string
          name: string
          sample_text?: string | null
          style: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          elements?: string[] | null
          hooks?: string[] | null
          id?: string
          name?: string
          sample_text?: string | null
          style?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string | null
          credits: number
          id: string
          membership_expires_at: string | null
          membership_type: string | null
          total_earned: number
          total_spent: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          credits?: number
          id?: string
          membership_expires_at?: string | null
          membership_type?: string | null
          total_earned?: number
          total_spent?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number
          id?: string
          membership_expires_at?: string | null
          membership_type?: string | null
          total_earned?: number
          total_spent?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_custom_tools: {
        Row: {
          api_url: string
          body_template: string | null
          created_at: string
          enabled: boolean
          headers: Json | null
          id: string
          method: string
          name: string
          result_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_url: string
          body_template?: string | null
          created_at?: string
          enabled?: boolean
          headers?: Json | null
          id?: string
          method?: string
          name: string
          result_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_url?: string
          body_template?: string | null
          created_at?: string
          enabled?: boolean
          headers?: Json | null
          id?: string
          method?: string
          name?: string
          result_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_workspaces: {
        Row: {
          created_at: string
          generated_content: Json | null
          id: string
          topics: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_content?: Json | null
          id?: string
          topics?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          generated_content?: Json | null
          id?: string
          topics?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_membership: {
        Args: { p_user_id: string; p_plan_id: string; p_order_id?: string }
        Returns: undefined
      }
      add_user_credits: {
        Args: { p_user_id: string; p_credits: number; p_description: string }
        Returns: undefined
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      order_status: "pending" | "paid" | "failed" | "cancelled"
      user_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      order_status: ["pending", "paid", "failed", "cancelled"],
      user_role: ["admin", "user"],
    },
  },
} as const