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
      admin_creation_authority: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admission_settings: {
        Row: {
          exam_end: string | null
          exam_start: string | null
          female_grade_12_cutoff: number
          grade_12_cutoff: number
          id: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          exam_end?: string | null
          exam_start?: string | null
          female_grade_12_cutoff?: number
          grade_12_cutoff?: number
          id?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          exam_end?: string | null
          exam_start?: string | null
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
      exam_exit_events: {
        Row: {
          created_at: string
          department: string | null
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          id?: string
          reason?: string
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
      portal_exam_attempts: {
        Row: {
          answers: Json
          deadline: string
          department: string
          exam_id: string
          id: string
          questions: Json
          started_at: string
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          answers?: Json
          deadline: string
          department: string
          exam_id: string
          id?: string
          questions: Json
          started_at?: string
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          answers?: Json
          deadline?: string
          department?: string
          exam_id?: string
          id?: string
          questions?: Json
          started_at?: string
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "portal_exams"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_exam_grades: {
        Row: {
          attempt_id: string
          department: string
          feedback: string
          graded_at: string
          graded_by: string
          maximum: number
          points: Json
          published: boolean
          total: number
        }
        Insert: {
          attempt_id: string
          department: string
          feedback?: string
          graded_at?: string
          graded_by: string
          maximum?: number
          points?: Json
          published?: boolean
          total?: number
        }
        Update: {
          attempt_id?: string
          department?: string
          feedback?: string
          graded_at?: string
          graded_by?: string
          maximum?: number
          points?: Json
          published?: boolean
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "portal_exam_grades_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: true
            referencedRelation: "portal_exam_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_exams: {
        Row: {
          closes_at: string | null
          created_at: string
          created_by: string
          department: string
          description: string
          duration_minutes: number
          id: string
          opens_at: string | null
          published: boolean
          questions: Json
          title: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          created_by: string
          department: string
          description?: string
          duration_minutes?: number
          id?: string
          opens_at?: string | null
          published?: boolean
          questions?: Json
          title: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          created_by?: string
          department?: string
          description?: string
          duration_minutes?: number
          id?: string
          opens_at?: string | null
          published?: boolean
          questions?: Json
          title?: string
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
      site_visits: {
        Row: {
          created_at: string
          device: string
          id: string
          path: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          device?: string
          id?: string
          path: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          device?: string
          id?: string
          path?: string
          visitor_id?: string
        }
        Relationships: []
      }
      staff_permissions: {
        Row: {
          can_edit_departments: boolean
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          can_edit_departments?: boolean
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          can_edit_departments?: boolean
          updated_at?: string
          updated_by?: string | null
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
      can_create_admin: { Args: { _user: string }; Returns: boolean }
      edit_student_choices: {
        Args: {
          _actor: string
          _choices: string[]
          _fields: string[]
          _student: string
        }
        Returns: undefined
      }
      eligible_for_portal_exam: {
        Args: { _dept: string; _user: string }
        Returns: boolean
      }
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
      get_exam_window: {
        Args: never
        Returns: {
          exam_end: string
          exam_start: string
        }[]
      }
      grade_portal_exam: {
        Args: {
          _attempt: string
          _feedback: string
          _points: Json
          _publish: boolean
        }
        Returns: undefined
      }
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
      save_portal_exam: {
        Args: { _definition: Json; _id: string }
        Returns: string
      }
      save_portal_exam_answers: {
        Args: { _answers: Json; _attempt: string; _submit: boolean }
        Returns: {
          answers: Json
          deadline: string
          department: string
          exam_id: string
          id: string
          questions: Json
          started_at: string
          submitted_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "portal_exam_attempts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_portal_exam_published: {
        Args: { _id: string; _published: boolean }
        Returns: undefined
      }
      start_portal_exam: {
        Args: { _exam: string }
        Returns: {
          answers: Json
          deadline: string
          department: string
          exam_id: string
          id: string
          questions: Json
          started_at: string
          submitted_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "portal_exam_attempts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_student_application: {
        Args: {
          _actor: string
          _choices: string[]
          _documents: Json
          _fields: string[]
          _personal: Json
          _score: number
          _student: string
        }
        Returns: undefined
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
