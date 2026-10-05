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
      admission_settings: {
        Row: {
          female_grade_12_cutoff: number
          grade_12_cutoff: number
          id: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          female_grade_12_cutoff?: number
          grade_12_cutoff?: number
          id?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          female_grade_12_cutoff?: number
          grade_12_cutoff?: number
          id?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          documents: Json
          first_choice: string
          first_department: string | null
          grade_12_results: Json
          id: string
          program: string | null
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
          first_department?: string | null
          grade_12_results: Json
          id?: string
          program?: string | null
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
          first_department?: string | null
          grade_12_results?: Json
          id?: string
          program?: string | null
          result_doc_path?: string | null
          second_choice?: string
          status?: string | null
          submitted_at?: string
          third_choice?: string
          user_id?: string
        }
        Relationships: []
      }
      department_exams: {
        Row: {
          created_at: string
          created_by: string | null
          department: string
          form_url: string
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department: string
          form_url: string
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string
          form_url?: string
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: []
      }
      department_heads: {
        Row: {
          created_at: string
          department: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string
          user_id?: string
        }
        Relationships: []
      }
      department_placements: {
        Row: {
          application_id: string
          choice_index: number
          current_department: string
          decision: string
          evaluated_at: string | null
          evaluated_by: string | null
          exam_score: number | null
          notes: string | null
          placed_department: string | null
          placed_field: string | null
          user_id: string
        }
        Insert: {
          application_id: string
          choice_index?: number
          current_department: string
          decision?: string
          evaluated_at?: string | null
          evaluated_by?: string | null
          exam_score?: number | null
          notes?: string | null
          placed_department?: string | null
          placed_field?: string | null
          user_id: string
        }
        Update: {
          application_id?: string
          choice_index?: number
          current_department?: string
          decision?: string
          evaluated_at?: string | null
          evaluated_by?: string | null
          exam_score?: number | null
          notes?: string | null
          placed_department?: string | null
          placed_field?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_placements_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
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
      news_articles: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          image_path: string | null
          published: boolean
          published_at: string | null
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          image_path?: string | null
          published?: boolean
          published_at?: string | null
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          image_path?: string | null
          published?: boolean
          published_at?: string | null
          summary?: string
          title?: string
          updated_at?: string
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
          program: string | null
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
          program?: string | null
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
          program?: string | null
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
      evaluate_application: {
        Args: {
          _app_id: string
          _decision: string
          _notes: string
          _score: number
        }
        Returns: string
      }
      generate_student_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      head_department: { Args: { _user_id: string }; Returns: string }
      is_referred_to_head: {
        Args: { _app_user: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student" | "sub_admin" | "department_head"
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
      app_role: ["admin", "student", "sub_admin", "department_head"],
    },
  },
} as const
