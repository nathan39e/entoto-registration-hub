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
      applications: {
        Row: {
          documents: Json
          first_choice: string
          grade_12_results: Json
          id: string
          result_doc_path: string | null
          second_choice: string
          status: string | null
          submitted_at: string
          third_choice: string
          user_id: string
        }
        Insert: {
          documents?: Json
          first_choice: string
          grade_12_results: Json
          id?: string
          result_doc_path?: string | null
          second_choice: string
          status?: string | null
          submitted_at?: string
          third_choice: string
          user_id: string
        }
        Update: {
          documents?: Json
          first_choice?: string
          grade_12_results?: Json
          id?: string
          result_doc_path?: string | null
          second_choice?: string
          status?: string | null
          submitted_at?: string
          third_choice?: string
          user_id?: string
        }
        Relationships: []
      }
      exam_forms: {
        Row: {
          created_at: string
          form_url: string
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          created_at?: string
          form_url: string
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          created_at?: string
          form_url?: string
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          paid_at: string | null
          payment_method: string | null
          receipt_path: string | null
          status: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          receipt_path?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          receipt_path?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          bio: string | null
          certifications: Json | null
          created_at: string
          id: string
          is_public: boolean | null
          projects: Json | null
          skills: Json | null
          social_links: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          certifications?: Json | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          projects?: Json | null
          skills?: Json | null
          social_links?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          certifications?: Json | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          projects?: Json | null
          skills?: Json | null
          social_links?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          exam_required: boolean
          full_name: string
          id: string
          phone: string | null
          profile_picture_url: string | null
          registered_by: string | null
          student_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          exam_required?: boolean
          full_name: string
          id: string
          phone?: string | null
          profile_picture_url?: string | null
          registered_by?: string | null
          student_code: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          exam_required?: boolean
          full_name?: string
          id?: string
          phone?: string | null
          profile_picture_url?: string | null
          registered_by?: string | null
          student_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      psychometric_results: {
        Row: {
          answers: Json
          completed_at: string
          id: string
          recommended_departments: Json
          scores: Json
          user_id: string
        }
        Insert: {
          answers: Json
          completed_at?: string
          id?: string
          recommended_departments: Json
          scores: Json
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          id?: string
          recommended_departments?: Json
          scores?: Json
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_student_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student" | "sub_admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "student", "sub_admin"],
    },
  },
} as const
