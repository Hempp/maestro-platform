Initialising login role...
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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_tier_permissions: {
        Row: {
          permission_id: string
          tier: Database["public"]["Enums"]["admin_tier"]
        }
        Insert: {
          permission_id: string
          tier: Database["public"]["Enums"]["admin_tier"]
        }
        Update: {
          permission_id?: string
          tier?: Database["public"]["Enums"]["admin_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "admin_tier_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      aku_progress: {
        Row: {
          aku_id: string
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          hints_used: number | null
          id: string
          status: Database["public"]["Enums"]["aku_status"] | null
          struggle_score: number | null
          time_spent: number | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
          workflow_snapshot: Json | null
        }
        Insert: {
          aku_id: string
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          hints_used?: number | null
          id?: string
          status?: Database["public"]["Enums"]["aku_status"] | null
          struggle_score?: number | null
          time_spent?: number | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
          workflow_snapshot?: Json | null
        }
        Update: {
          aku_id?: string
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          hints_used?: number | null
          id?: string
          status?: Database["public"]["Enums"]["aku_status"] | null
          struggle_score?: number | null
          time_spent?: number | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
          workflow_snapshot?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "aku_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aku_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      answers: {
        Row: {
          answer_text: string
          created_at: string | null
          display_order: number | null
          id: string
          is_correct: boolean | null
          question_id: string
        }
        Insert: {
          answer_text: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_correct?: boolean | null
          question_id: string
        }
        Update: {
          answer_text?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_correct?: boolean | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          attempt_number: number | null
          created_at: string | null
          enrollment_id: string
          feedback: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          previous_submission_id: string | null
          rubric_scores: Json | null
          score: number | null
          status:
            | Database["public"]["Enums"]["assignment_submission_status"]
            | null
          submission_type: Database["public"]["Enums"]["submission_type"]
          submitted_at: string | null
          text_content: string | null
          updated_at: string | null
          url_link: string | null
          user_id: string
        }
        Insert: {
          assignment_id: string
          attempt_number?: number | null
          created_at?: string | null
          enrollment_id: string
          feedback?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          previous_submission_id?: string | null
          rubric_scores?: Json | null
          score?: number | null
          status?:
            | Database["public"]["Enums"]["assignment_submission_status"]
            | null
          submission_type: Database["public"]["Enums"]["submission_type"]
          submitted_at?: string | null
          text_content?: string | null
          updated_at?: string | null
          url_link?: string | null
          user_id: string
        }
        Update: {
          assignment_id?: string
          attempt_number?: number | null
          created_at?: string | null
          enrollment_id?: string
          feedback?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          previous_submission_id?: string | null
          rubric_scores?: Json | null
          score?: number | null
          status?:
            | Database["public"]["Enums"]["assignment_submission_status"]
            | null
          submission_type?: Database["public"]["Enums"]["submission_type"]
          submitted_at?: string | null
          text_content?: string | null
          updated_at?: string | null
          url_link?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_previous_submission_id_fkey"
            columns: ["previous_submission_id"]
            isOneToOne: false
            referencedRelation: "assignment_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          allowed_file_types: string[] | null
          course_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          due_days_after_enrollment: number | null
          id: string
          instructions: string
          is_required: boolean | null
          lesson_id: string | null
          max_file_size_mb: number | null
          max_score: number | null
          resources: Json | null
          rubric: Json | null
          submission_types:
            | Database["public"]["Enums"]["submission_type"][]
            | null
          title: string
          updated_at: string | null
        }
        Insert: {
          allowed_file_types?: string[] | null
          course_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          due_days_after_enrollment?: number | null
          id?: string
          instructions: string
          is_required?: boolean | null
          lesson_id?: string | null
          max_file_size_mb?: number | null
          max_score?: number | null
          resources?: Json | null
          rubric?: Json | null
          submission_types?:
            | Database["public"]["Enums"]["submission_type"][]
            | null
          title: string
          updated_at?: string | null
        }
        Update: {
          allowed_file_types?: string[] | null
          course_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          due_days_after_enrollment?: number | null
          id?: string
          instructions?: string
          is_required?: boolean | null
          lesson_id?: string | null
          max_file_size_mb?: number | null
          max_score?: number | null
          resources?: Json | null
          rubric?: Json | null
          submission_types?:
            | Database["public"]["Enums"]["submission_type"][]
            | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          course_count: number | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          course_count?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          course_count?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_number: string
          contract_address: string | null
          course_id: string
          expires_at: string | null
          grade: string | null
          id: string
          ipfs_hash: string | null
          issued_at: string | null
          metadata: Json | null
          pdf_url: string | null
          sbt_minted_at: string | null
          sbt_token_id: string | null
          sbt_transaction_hash: string | null
          token_id: string | null
          transaction_hash: string | null
          user_id: string
          verification_url: string | null
          verified_at: string | null
        }
        Insert: {
          certificate_number: string
          contract_address?: string | null
          course_id: string
          expires_at?: string | null
          grade?: string | null
          id?: string
          ipfs_hash?: string | null
          issued_at?: string | null
          metadata?: Json | null
          pdf_url?: string | null
          sbt_minted_at?: string | null
          sbt_token_id?: string | null
          sbt_transaction_hash?: string | null
          token_id?: string | null
          transaction_hash?: string | null
          user_id: string
          verification_url?: string | null
          verified_at?: string | null
        }
        Update: {
          certificate_number?: string
          contract_address?: string | null
          course_id?: string
          expires_at?: string | null
          grade?: string | null
          id?: string
          ipfs_hash?: string | null
          issued_at?: string | null
          metadata?: Json | null
          pdf_url?: string | null
          sbt_minted_at?: string | null
          sbt_token_id?: string | null
          sbt_transaction_hash?: string | null
          token_id?: string | null
          transaction_hash?: string | null
          user_id?: string
          verification_url?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      certification_submissions: {
        Row: {
          amount_paid: number | null
          architecture_url: string | null
          currency: string | null
          demo_video_url: string | null
          documentation_url: string | null
          id: string
          paid_at: string | null
          path: string
          production_logs: Json | null
          reviewed_at: string | null
          reviewer_notes: string | null
          roi_document: string | null
          score_architecture: number | null
          score_documentation: number | null
          score_problem_fit: number | null
          score_production_ready: number | null
          score_roi: number | null
          score_working_system: number | null
          status: string | null
          stripe_payment_id: string | null
          stripe_session_id: string | null
          submitted_at: string | null
          total_score: number | null
          user_id: string | null
        }
        Insert: {
          amount_paid?: number | null
          architecture_url?: string | null
          currency?: string | null
          demo_video_url?: string | null
          documentation_url?: string | null
          id?: string
          paid_at?: string | null
          path: string
          production_logs?: Json | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          roi_document?: string | null
          score_architecture?: number | null
          score_documentation?: number | null
          score_problem_fit?: number | null
          score_production_ready?: number | null
          score_roi?: number | null
          score_working_system?: number | null
          status?: string | null
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          submitted_at?: string | null
          total_score?: number | null
          user_id?: string | null
        }
        Update: {
          amount_paid?: number | null
          architecture_url?: string | null
          currency?: string | null
          demo_video_url?: string | null
          documentation_url?: string | null
          id?: string
          paid_at?: string | null
          path?: string
          production_logs?: Json | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          roi_document?: string | null
          score_architecture?: number | null
          score_documentation?: number | null
          score_problem_fit?: number | null
          score_production_ready?: number | null
          score_roi?: number | null
          score_working_system?: number | null
          status?: string | null
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          submitted_at?: string | null
          total_score?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          created_at: string | null
          current_step: number | null
          id: string
          messages: Json | null
          metadata: Json | null
          session_type: Database["public"]["Enums"]["session_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_step?: number | null
          id?: string
          messages?: Json | null
          metadata?: Json | null
          session_type: Database["public"]["Enums"]["session_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_step?: number | null
          id?: string
          messages?: Json | null
          metadata?: Json | null
          session_type?: Database["public"]["Enums"]["session_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      churn_risk_scores: {
        Row: {
          calculated_at: string
          confidence: number | null
          created_at: string | null
          expires_at: string | null
          factors: Json | null
          id: string
          intervention_sent: boolean | null
          intervention_sent_at: string | null
          intervention_type: string | null
          model_version: string | null
          outcome: string | null
          recommended_actions: Json | null
          risk_level: string | null
          score: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calculated_at?: string
          confidence?: number | null
          created_at?: string | null
          expires_at?: string | null
          factors?: Json | null
          id?: string
          intervention_sent?: boolean | null
          intervention_sent_at?: string | null
          intervention_type?: string | null
          model_version?: string | null
          outcome?: string | null
          recommended_actions?: Json | null
          risk_level?: string | null
          score: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calculated_at?: string
          confidence?: number | null
          created_at?: string | null
          expires_at?: string | null
          factors?: Json | null
          id?: string
          intervention_sent?: boolean | null
          intervention_sent_at?: string | null
          intervention_type?: string | null
          model_version?: string | null
          outcome?: string | null
          recommended_actions?: Json | null
          risk_level?: string | null
          score?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "churn_risk_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "churn_risk_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      claimable_credentials: {
        Row: {
          certificate_id: string | null
          claim_code: string
          claimed_at: string | null
          claimed_wallet: string | null
          created_at: string | null
          expires_at: string
          id: string
          status: string | null
          token_id: string | null
          transaction_hash: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          certificate_id?: string | null
          claim_code: string
          claimed_at?: string | null
          claimed_wallet?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          status?: string | null
          token_id?: string | null
          transaction_hash?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          certificate_id?: string | null
          claim_code?: string
          claimed_at?: string | null
          claimed_wallet?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          status?: string | null
          token_id?: string | null
          transaction_hash?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claimable_credentials_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_metrics: {
        Row: {
          avg_contents_completed_week_1: number | null
          avg_sessions_week_1: number | null
          cohort_date: string
          cohort_type: string
          conversion_rate: number | null
          converted_to_paid: number | null
          created_at: string | null
          id: string
          retained_day_1: number | null
          retained_day_14: number | null
          retained_day_3: number | null
          retained_day_30: number | null
          retained_day_60: number | null
          retained_day_7: number | null
          retained_day_90: number | null
          retention_pct_day_1: number | null
          retention_pct_day_30: number | null
          retention_pct_day_7: number | null
          tier_breakdown: Json | null
          updated_at: string | null
          user_count: number | null
        }
        Insert: {
          avg_contents_completed_week_1?: number | null
          avg_sessions_week_1?: number | null
          cohort_date: string
          cohort_type?: string
          conversion_rate?: number | null
          converted_to_paid?: number | null
          created_at?: string | null
          id?: string
          retained_day_1?: number | null
          retained_day_14?: number | null
          retained_day_3?: number | null
          retained_day_30?: number | null
          retained_day_60?: number | null
          retained_day_7?: number | null
          retained_day_90?: number | null
          retention_pct_day_1?: number | null
          retention_pct_day_30?: number | null
          retention_pct_day_7?: number | null
          tier_breakdown?: Json | null
          updated_at?: string | null
          user_count?: number | null
        }
        Update: {
          avg_contents_completed_week_1?: number | null
          avg_sessions_week_1?: number | null
          cohort_date?: string
          cohort_type?: string
          conversion_rate?: number | null
          converted_to_paid?: number | null
          created_at?: string | null
          id?: string
          retained_day_1?: number | null
          retained_day_14?: number | null
          retained_day_3?: number | null
          retained_day_30?: number | null
          retained_day_60?: number | null
          retained_day_7?: number | null
          retained_day_90?: number | null
          retention_pct_day_1?: number | null
          retention_pct_day_30?: number | null
          retention_pct_day_7?: number | null
          tier_breakdown?: Json | null
          updated_at?: string | null
          user_count?: number | null
        }
        Relationships: []
      }
      content_metrics: {
        Row: {
          avg_struggle_score: number | null
          avg_time_spent: number | null
          completion_rate: number | null
          completions: number | null
          completions_by_tier: Json | null
          content_id: string
          content_title: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string | null
          drop_off_count: number | null
          drop_off_points: Json | null
          id: string
          median_time_spent: number | null
          period_end: string | null
          period_start: string | null
          rating_avg: number | null
          rating_count: number | null
          starts: number | null
          total_time_spent: number | null
          unique_viewers: number | null
          updated_at: string | null
          views: number | null
          views_by_tier: Json | null
        }
        Insert: {
          avg_struggle_score?: number | null
          avg_time_spent?: number | null
          completion_rate?: number | null
          completions?: number | null
          completions_by_tier?: Json | null
          content_id: string
          content_title?: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          drop_off_count?: number | null
          drop_off_points?: Json | null
          id?: string
          median_time_spent?: number | null
          period_end?: string | null
          period_start?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          starts?: number | null
          total_time_spent?: number | null
          unique_viewers?: number | null
          updated_at?: string | null
          views?: number | null
          views_by_tier?: Json | null
        }
        Update: {
          avg_struggle_score?: number | null
          avg_time_spent?: number | null
          completion_rate?: number | null
          completions?: number | null
          completions_by_tier?: Json | null
          content_id?: string
          content_title?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          drop_off_count?: number | null
          drop_off_points?: Json | null
          id?: string
          median_time_spent?: number | null
          period_end?: string | null
          period_start?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          starts?: number | null
          total_time_spent?: number | null
          unique_viewers?: number | null
          updated_at?: string | null
          views?: number | null
          views_by_tier?: Json | null
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string | null
          enrolled_at: string | null
          id: string
          progress_percent: number | null
          status: string | null
          student_id: string | null
        }
        Insert: {
          completed_at?: string | null
          course_id?: string | null
          enrolled_at?: string | null
          id?: string
          progress_percent?: number | null
          status?: string | null
          student_id?: string | null
        }
        Update: {
          completed_at?: string | null
          course_id?: string | null
          enrolled_at?: string | null
          id?: string
          progress_percent?: number | null
          status?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "live_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          average_rating: number | null
          category_id: string | null
          created_at: string | null
          currency: string | null
          description: string
          id: string
          instructor_id: string
          is_bestseller: boolean | null
          is_featured: boolean | null
          is_free: boolean | null
          is_new: boolean | null
          language: string | null
          level: Database["public"]["Enums"]["course_level"] | null
          preview_video_url: string | null
          price: number | null
          published_at: string | null
          requirements: string[] | null
          sale_price: number | null
          slug: string
          status: Database["public"]["Enums"]["course_status"] | null
          subcategory_id: string | null
          subtitle: string | null
          tags: string[] | null
          target_audience: string[] | null
          thumbnail_url: string | null
          title: string
          total_duration_minutes: number | null
          total_enrollments: number | null
          total_lessons: number | null
          total_quizzes: number | null
          total_ratings: number | null
          total_resources: number | null
          updated_at: string | null
          what_you_will_learn: string[] | null
        }
        Insert: {
          average_rating?: number | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description: string
          id?: string
          instructor_id: string
          is_bestseller?: boolean | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_new?: boolean | null
          language?: string | null
          level?: Database["public"]["Enums"]["course_level"] | null
          preview_video_url?: string | null
          price?: number | null
          published_at?: string | null
          requirements?: string[] | null
          sale_price?: number | null
          slug: string
          status?: Database["public"]["Enums"]["course_status"] | null
          subcategory_id?: string | null
          subtitle?: string | null
          tags?: string[] | null
          target_audience?: string[] | null
          thumbnail_url?: string | null
          title: string
          total_duration_minutes?: number | null
          total_enrollments?: number | null
          total_lessons?: number | null
          total_quizzes?: number | null
          total_ratings?: number | null
          total_resources?: number | null
          updated_at?: string | null
          what_you_will_learn?: string[] | null
        }
        Update: {
          average_rating?: number | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string
          id?: string
          instructor_id?: string
          is_bestseller?: boolean | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_new?: boolean | null
          language?: string | null
          level?: Database["public"]["Enums"]["course_level"] | null
          preview_video_url?: string | null
          price?: number | null
          published_at?: string | null
          requirements?: string[] | null
          sale_price?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["course_status"] | null
          subcategory_id?: string | null
          subtitle?: string | null
          tags?: string[] | null
          target_audience?: string[] | null
          thumbnail_url?: string | null
          title?: string
          total_duration_minutes?: number | null
          total_enrollments?: number | null
          total_lessons?: number | null
          total_quizzes?: number | null
          total_ratings?: number | null
          total_resources?: number | null
          updated_at?: string | null
          what_you_will_learn?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_user_metrics: {
        Row: {
          active_minutes: number | null
          ai_interactions: number | null
          ai_questions_asked: number | null
          akus_completed: number | null
          code_executions: number | null
          code_submissions: number | null
          contents_completed: number | null
          contents_started: number | null
          created_at: string | null
          date: string
          id: string
          page_views: number | null
          quizzes_attempted: number | null
          quizzes_passed: number | null
          session_minutes: number | null
          sessions_attended: number | null
          streak_maintained: boolean | null
          struggle_score_avg: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_minutes?: number | null
          ai_interactions?: number | null
          ai_questions_asked?: number | null
          akus_completed?: number | null
          code_executions?: number | null
          code_submissions?: number | null
          contents_completed?: number | null
          contents_started?: number | null
          created_at?: string | null
          date: string
          id?: string
          page_views?: number | null
          quizzes_attempted?: number | null
          quizzes_passed?: number | null
          session_minutes?: number | null
          sessions_attended?: number | null
          streak_maintained?: boolean | null
          struggle_score_avg?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_minutes?: number | null
          ai_interactions?: number | null
          ai_questions_asked?: number | null
          akus_completed?: number | null
          code_executions?: number | null
          code_submissions?: number | null
          contents_completed?: number | null
          contents_started?: number | null
          created_at?: string | null
          date?: string
          id?: string
          page_views?: number | null
          quizzes_attempted?: number | null
          quizzes_passed?: number | null
          session_minutes?: number | null
          sessions_attended?: number | null
          streak_maintained?: boolean | null
          struggle_score_avg?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_user_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_user_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_replies: {
        Row: {
          content: string
          created_at: string | null
          discussion_id: string
          id: string
          is_answer: boolean | null
          is_instructor_reply: boolean | null
          updated_at: string | null
          upvotes: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          discussion_id: string
          id?: string
          is_answer?: boolean | null
          is_instructor_reply?: boolean | null
          updated_at?: string | null
          upvotes?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          discussion_id?: string
          id?: string
          is_answer?: boolean | null
          is_instructor_reply?: boolean | null
          updated_at?: string | null
          upvotes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_replies_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      discussions: {
        Row: {
          content: string
          course_id: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          is_resolved: boolean | null
          lesson_id: string | null
          replies_count: number | null
          title: string
          updated_at: string | null
          upvotes: number | null
          user_id: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          is_resolved?: boolean | null
          lesson_id?: string | null
          replies_count?: number | null
          title: string
          updated_at?: string | null
          upvotes?: number | null
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          is_resolved?: boolean | null
          lesson_id?: string | null
          replies_count?: number | null
          title?: string
          updated_at?: string | null
          upvotes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          payment_id: string | null
          progress_percentage: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          payment_id?: string | null
          progress_percentage?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          payment_id?: string | null
          progress_percentage?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_profiles: {
        Row: {
          created_at: string | null
          current_path: string | null
          current_streak: number | null
          id: string
          interaction_dna: Json | null
          last_activity_at: string | null
          longest_streak: number | null
          struggle_score: number | null
          tier: Database["public"]["Enums"]["tier_type"]
          total_learning_time: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_path?: string | null
          current_streak?: number | null
          id?: string
          interaction_dna?: Json | null
          last_activity_at?: string | null
          longest_streak?: number | null
          struggle_score?: number | null
          tier: Database["public"]["Enums"]["tier_type"]
          total_learning_time?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_path?: string | null
          current_streak?: number | null
          id?: string
          interaction_dna?: Json | null
          last_activity_at?: string | null
          longest_streak?: number | null
          struggle_score?: number | null
          tier?: Database["public"]["Enums"]["tier_type"]
          total_learning_time?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_bookmarks: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_bookmarks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_bookmarks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          id: string
          is_completed: boolean | null
          last_position_seconds: number | null
          lesson_id: string
          notes: string | null
          started_at: string | null
          user_id: string
          watch_time_seconds: number | null
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          id?: string
          is_completed?: boolean | null
          last_position_seconds?: number | null
          lesson_id: string
          notes?: string | null
          started_at?: string | null
          user_id: string
          watch_time_seconds?: number | null
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          id?: string
          is_completed?: boolean | null
          last_position_seconds?: number | null
          lesson_id?: string
          notes?: string | null
          started_at?: string | null
          user_id?: string
          watch_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          article_content: string | null
          content_type:
            | Database["public"]["Enums"]["lesson_content_type"]
            | null
          course_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_free_preview: boolean | null
          module_id: string
          title: string
          updated_at: string | null
          video_duration_seconds: number | null
          video_url: string | null
        }
        Insert: {
          article_content?: string | null
          content_type?:
            | Database["public"]["Enums"]["lesson_content_type"]
            | null
          course_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_free_preview?: boolean | null
          module_id: string
          title: string
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_url?: string | null
        }
        Update: {
          article_content?: string | null
          content_type?:
            | Database["public"]["Enums"]["lesson_content_type"]
            | null
          course_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_free_preview?: boolean | null
          module_id?: string
          title?: string
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      live_courses: {
        Row: {
          average_rating: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          max_students: number | null
          price: number | null
          requirements: string[] | null
          slug: string | null
          tags: string[] | null
          teacher_id: string | null
          thumbnail_url: string | null
          tier: Database["public"]["Enums"]["tier_type"] | null
          title: string
          total_enrolled: number | null
          total_sessions: number | null
          updated_at: string | null
          what_you_will_learn: string[] | null
        }
        Insert: {
          average_rating?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_students?: number | null
          price?: number | null
          requirements?: string[] | null
          slug?: string | null
          tags?: string[] | null
          teacher_id?: string | null
          thumbnail_url?: string | null
          tier?: Database["public"]["Enums"]["tier_type"] | null
          title: string
          total_enrolled?: number | null
          total_sessions?: number | null
          updated_at?: string | null
          what_you_will_learn?: string[] | null
        }
        Update: {
          average_rating?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_students?: number | null
          price?: number | null
          requirements?: string[] | null
          slug?: string | null
          tags?: string[] | null
          teacher_id?: string | null
          thumbnail_url?: string | null
          tier?: Database["public"]["Enums"]["tier_type"] | null
          title?: string
          total_enrolled?: number | null
          total_sessions?: number | null
          updated_at?: string | null
          what_you_will_learn?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "live_courses_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_courses_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          course_id: string | null
          created_at: string | null
          current_attendees: number | null
          description: string | null
          duration_minutes: number | null
          early_bird_deadline: string | null
          early_bird_price: number | null
          id: string
          max_attendees: number | null
          max_seats: number | null
          meeting_url: string | null
          platform: string | null
          recording_url: string | null
          scheduled_at: string
          seat_price: number | null
          status: string | null
          target_tier: string | null
          title: string
          updated_at: string | null
          zoom_link: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          duration_minutes?: number | null
          early_bird_deadline?: string | null
          early_bird_price?: number | null
          id?: string
          max_attendees?: number | null
          max_seats?: number | null
          meeting_url?: string | null
          platform?: string | null
          recording_url?: string | null
          scheduled_at: string
          seat_price?: number | null
          status?: string | null
          target_tier?: string | null
          title: string
          updated_at?: string | null
          zoom_link?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          duration_minutes?: number | null
          early_bird_deadline?: string | null
          early_bird_price?: number | null
          id?: string
          max_attendees?: number | null
          max_seats?: number | null
          meeting_url?: string | null
          platform?: string | null
          recording_url?: string | null
          scheduled_at?: string
          seat_price?: number | null
          status?: string | null
          target_tier?: string | null
          title?: string
          updated_at?: string | null
          zoom_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "live_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_free_preview: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_free_preview?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_free_preview?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          completed_at: string | null
          course_id: string
          created_at: string | null
          currency: string | null
          id: string
          payment_method: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_mints: {
        Row: {
          certificate_id: string
          created_at: string | null
          error: string | null
          id: string
          minted_at: string | null
          path: string
          retry_count: number | null
          status: string | null
          token_id: string | null
          transaction_hash: string | null
          updated_at: string | null
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          certificate_id: string
          created_at?: string | null
          error?: string | null
          id?: string
          minted_at?: string | null
          path: string
          retry_count?: number | null
          status?: string | null
          token_id?: string | null
          transaction_hash?: string | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          certificate_id?: string
          created_at?: string | null
          error?: string | null
          id?: string
          minted_at?: string | null
          path?: string
          retry_count?: number | null
          status?: string | null
          token_id?: string | null
          transaction_hash?: string | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_secret: boolean | null
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_secret?: boolean | null
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_secret?: boolean | null
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_answer_ids: string[] | null
          created_at: string | null
          display_order: number | null
          explanation: string | null
          fill_blank_answers: string[] | null
          id: string
          matching_pairs: Json | null
          points: number | null
          question_text: string
          quiz_id: string
          type: Database["public"]["Enums"]["question_type"]
          updated_at: string | null
        }
        Insert: {
          correct_answer_ids?: string[] | null
          created_at?: string | null
          display_order?: number | null
          explanation?: string | null
          fill_blank_answers?: string[] | null
          id?: string
          matching_pairs?: Json | null
          points?: number | null
          question_text: string
          quiz_id: string
          type: Database["public"]["Enums"]["question_type"]
          updated_at?: string | null
        }
        Update: {
          correct_answer_ids?: string[] | null
          created_at?: string | null
          display_order?: number | null
          explanation?: string | null
          fill_blank_answers?: string[] | null
          id?: string
          matching_pairs?: Json | null
          points?: number | null
          question_text?: string
          quiz_id?: string
          type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          id: string
          passed: boolean | null
          quiz_id: string
          score: number | null
          started_at: string | null
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          passed?: boolean | null
          quiz_id: string
          score?: number | null
          started_at?: string | null
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          passed?: boolean | null
          quiz_id?: string
          score?: number | null
          started_at?: string | null
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          max_attempts: number | null
          module_id: string | null
          passing_score: number | null
          show_correct_answers: boolean | null
          shuffle_answers: boolean | null
          shuffle_questions: boolean | null
          time_limit_minutes: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          max_attempts?: number | null
          module_id?: string | null
          passing_score?: number | null
          show_correct_answers?: boolean | null
          shuffle_answers?: boolean | null
          shuffle_questions?: boolean | null
          time_limit_minutes?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          max_attempts?: number | null
          module_id?: string | null
          passing_score?: number | null
          show_correct_answers?: boolean | null
          shuffle_answers?: boolean | null
          shuffle_questions?: boolean | null
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string | null
          display_order: number | null
          file_size: number | null
          id: string
          lesson_id: string
          title: string
          type: Database["public"]["Enums"]["resource_type"]
          url: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          file_size?: number | null
          id?: string
          lesson_id: string
          title: string
          type: Database["public"]["Enums"]["resource_type"]
          url: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          file_size?: number | null
          id?: string
          lesson_id?: string
          title?: string
          type?: Database["public"]["Enums"]["resource_type"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      retention_emails: {
        Row: {
          email_type: Database["public"]["Enums"]["retention_email_type"]
          error_message: string | null
          id: string
          resend_id: string | null
          sent_at: string | null
          success: boolean | null
          user_id: string
        }
        Insert: {
          email_type: Database["public"]["Enums"]["retention_email_type"]
          error_message?: string | null
          id?: string
          resend_id?: string | null
          sent_at?: string | null
          success?: boolean | null
          user_id: string
        }
        Update: {
          email_type?: Database["public"]["Enums"]["retention_email_type"]
          error_message?: string | null
          id?: string
          resend_id?: string | null
          sent_at?: string | null
          success?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retention_emails_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_emails_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_metrics: {
        Row: {
          active_subscriptions: number | null
          arpu: number | null
          arr: number | null
          churn_rate: number | null
          churned: number | null
          churned_revenue: number | null
          contraction_revenue: number | null
          created_at: string | null
          date: string
          downgrades: number | null
          expansion_revenue: number | null
          growth_rate: number | null
          id: string
          ltv_estimate: number | null
          mrr: number | null
          net_revenue_change: number | null
          new_revenue: number | null
          new_subscriptions: number | null
          reactivations: number | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
          upgrades: number | null
        }
        Insert: {
          active_subscriptions?: number | null
          arpu?: number | null
          arr?: number | null
          churn_rate?: number | null
          churned?: number | null
          churned_revenue?: number | null
          contraction_revenue?: number | null
          created_at?: string | null
          date: string
          downgrades?: number | null
          expansion_revenue?: number | null
          growth_rate?: number | null
          id?: string
          ltv_estimate?: number | null
          mrr?: number | null
          net_revenue_change?: number | null
          new_revenue?: number | null
          new_subscriptions?: number | null
          reactivations?: number | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          upgrades?: number | null
        }
        Update: {
          active_subscriptions?: number | null
          arpu?: number | null
          arr?: number | null
          churn_rate?: number | null
          churned?: number | null
          churned_revenue?: number | null
          contraction_revenue?: number | null
          created_at?: string | null
          date?: string
          downgrades?: number | null
          expansion_revenue?: number | null
          growth_rate?: number | null
          id?: string
          ltv_estimate?: number | null
          mrr?: number | null
          net_revenue_change?: number | null
          new_revenue?: number | null
          new_subscriptions?: number | null
          reactivations?: number | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          upgrades?: number | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string
          course_id: string
          created_at: string | null
          helpful_count: number | null
          id: string
          instructor_responded_at: string | null
          instructor_response: string | null
          is_featured: boolean | null
          rating: number
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          instructor_responded_at?: string | null
          instructor_response?: string | null
          is_featured?: boolean | null
          rating: number
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          instructor_responded_at?: string | null
          instructor_response?: string | null
          is_featured?: boolean | null
          rating?: number
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      sandbox_sessions: {
        Row: {
          aku_id: string | null
          code: string
          created_at: string | null
          execution_time: number | null
          id: string
          output: Json | null
          status: Database["public"]["Enums"]["sandbox_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          aku_id?: string | null
          code: string
          created_at?: string | null
          execution_time?: number | null
          id?: string
          output?: Json | null
          status?: Database["public"]["Enums"]["sandbox_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          aku_id?: string | null
          code?: string
          created_at?: string | null
          execution_time?: number | null
          id?: string
          output?: Json | null
          status?: Database["public"]["Enums"]["sandbox_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sandbox_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sandbox_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      seat_purchases: {
        Row: {
          amount_paid: number
          id: string
          payment_intent_id: string | null
          payment_status: string | null
          purchased_at: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_paid: number
          id?: string
          payment_intent_id?: string | null
          payment_status?: string | null
          purchased_at?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_paid?: number
          id?: string
          payment_intent_id?: string | null
          payment_status?: string | null
          purchased_at?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seat_purchases_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seat_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seat_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      session_enrollments: {
        Row: {
          access_type: string | null
          attended: boolean | null
          enrolled_at: string | null
          feedback: string | null
          id: string
          joined_at: string | null
          left_at: string | null
          purchase_id: string | null
          rating: number | null
          session_id: string | null
          student_id: string | null
        }
        Insert: {
          access_type?: string | null
          attended?: boolean | null
          enrolled_at?: string | null
          feedback?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          purchase_id?: string | null
          rating?: number | null
          session_id?: string | null
          student_id?: string | null
        }
        Update: {
          access_type?: string | null
          attended?: boolean | null
          enrolled_at?: string | null
          feedback?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          purchase_id?: string | null
          rating?: number | null
          session_id?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_enrollments_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "seat_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_enrollments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      terminal_history: {
        Row: {
          command: string
          created_at: string | null
          execution_time: number | null
          id: string
          output: string | null
          status: Database["public"]["Enums"]["terminal_status"] | null
          user_id: string
        }
        Insert: {
          command: string
          created_at?: string | null
          execution_time?: number | null
          id?: string
          output?: string | null
          status?: Database["public"]["Enums"]["terminal_status"] | null
          user_id: string
        }
        Update: {
          command?: string
          created_at?: string | null
          execution_time?: number | null
          id?: string
          output?: string | null
          status?: Database["public"]["Enums"]["terminal_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "terminal_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terminal_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_conversations: {
        Row: {
          created_at: string | null
          current_milestone: number | null
          id: string
          messages: Json | null
          path: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_milestone?: number | null
          id?: string
          messages?: Json | null
          path: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_milestone?: number | null
          id?: string
          messages?: Json | null
          path?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_events: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          ip_hash: string | null
          metadata: Json | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_milestones: {
        Row: {
          approved_at: string | null
          created_at: string | null
          feedback: string | null
          id: string
          milestone_number: number
          path: string
          status: string | null
          submission_content: Json | null
          submission_files: string[] | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          milestone_number: number
          path: string
          status?: string | null
          submission_content?: Json | null
          submission_files?: string[] | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          milestone_number?: number
          path?: string
          status?: string | null
          submission_content?: Json | null
          submission_files?: string[] | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          is_current: boolean | null
          last_active_at: string | null
          location: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_current?: boolean | null
          last_active_at?: string | null
          location?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_current?: boolean | null
          last_active_at?: string | null
          location?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          allow_data_collection: boolean | null
          bio: string | null
          community_activity: boolean | null
          created_at: string | null
          daily_goal_minutes: number | null
          display_name: string | null
          email_notifications: boolean | null
          font_size: Database["public"]["Enums"]["font_size_preference"] | null
          high_contrast: boolean | null
          id: string
          learning_pace: Database["public"]["Enums"]["learning_pace"] | null
          learning_reminders: boolean | null
          marketing_emails: boolean | null
          profile_visibility:
            | Database["public"]["Enums"]["profile_visibility"]
            | null
          reduced_motion: boolean | null
          screen_reader_optimized: boolean | null
          show_activity_status: boolean | null
          show_progress_on_profile: boolean | null
          theme: Database["public"]["Enums"]["theme_preference"] | null
          two_factor_enabled: boolean | null
          updated_at: string | null
          user_id: string
          wallet_connected: boolean | null
        }
        Insert: {
          allow_data_collection?: boolean | null
          bio?: string | null
          community_activity?: boolean | null
          created_at?: string | null
          daily_goal_minutes?: number | null
          display_name?: string | null
          email_notifications?: boolean | null
          font_size?: Database["public"]["Enums"]["font_size_preference"] | null
          high_contrast?: boolean | null
          id?: string
          learning_pace?: Database["public"]["Enums"]["learning_pace"] | null
          learning_reminders?: boolean | null
          marketing_emails?: boolean | null
          profile_visibility?:
            | Database["public"]["Enums"]["profile_visibility"]
            | null
          reduced_motion?: boolean | null
          screen_reader_optimized?: boolean | null
          show_activity_status?: boolean | null
          show_progress_on_profile?: boolean | null
          theme?: Database["public"]["Enums"]["theme_preference"] | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
          wallet_connected?: boolean | null
        }
        Update: {
          allow_data_collection?: boolean | null
          bio?: string | null
          community_activity?: boolean | null
          created_at?: string | null
          daily_goal_minutes?: number | null
          display_name?: string | null
          email_notifications?: boolean | null
          font_size?: Database["public"]["Enums"]["font_size_preference"] | null
          high_contrast?: boolean | null
          id?: string
          learning_pace?: Database["public"]["Enums"]["learning_pace"] | null
          learning_reminders?: boolean | null
          marketing_emails?: boolean | null
          profile_visibility?:
            | Database["public"]["Enums"]["profile_visibility"]
            | null
          reduced_motion?: boolean | null
          screen_reader_optimized?: boolean | null
          show_activity_status?: boolean | null
          show_progress_on_profile?: boolean | null
          theme?: Database["public"]["Enums"]["theme_preference"] | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
          wallet_connected?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          admin_tier: Database["public"]["Enums"]["admin_tier"] | null
          avatar_url: string | null
          average_rating: number | null
          bio: string | null
          created_at: string | null
          email: string
          email_verified: boolean | null
          expertise: string[] | null
          full_name: string
          id: string
          is_active: boolean | null
          preferences: Json | null
          profile_completed: boolean | null
          role: Database["public"]["Enums"]["user_role"] | null
          social_links: Json | null
          tier: Database["public"]["Enums"]["tier_type"] | null
          title: string | null
          total_courses: number | null
          total_students: number | null
          updated_at: string | null
          verified: boolean | null
          wallet_address: string | null
        }
        Insert: {
          admin_tier?: Database["public"]["Enums"]["admin_tier"] | null
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          expertise?: string[] | null
          full_name: string
          id: string
          is_active?: boolean | null
          preferences?: Json | null
          profile_completed?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          social_links?: Json | null
          tier?: Database["public"]["Enums"]["tier_type"] | null
          title?: string | null
          total_courses?: number | null
          total_students?: number | null
          updated_at?: string | null
          verified?: boolean | null
          wallet_address?: string | null
        }
        Update: {
          admin_tier?: Database["public"]["Enums"]["admin_tier"] | null
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          expertise?: string[] | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          preferences?: Json | null
          profile_completed?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          social_links?: Json | null
          tier?: Database["public"]["Enums"]["tier_type"] | null
          title?: string | null
          total_courses?: number | null
          total_students?: number | null
          updated_at?: string | null
          verified?: boolean | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      video_chapters: {
        Row: {
          created_at: string | null
          id: string
          lesson_id: string
          start_time_seconds: number
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_id: string
          start_time_seconds: number
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_id?: string
          start_time_seconds?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_chapters_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      video_generations: {
        Row: {
          avatar_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          duration_seconds: number | null
          error_message: string | null
          heygen_video_id: string
          id: string
          lesson_id: string | null
          metadata: Json | null
          script: string
          status: string
          thumbnail_url: string | null
          title: string
          video_url: string | null
          voice_id: string | null
        }
        Insert: {
          avatar_id: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          duration_seconds?: number | null
          error_message?: string | null
          heygen_video_id: string
          id?: string
          lesson_id?: string | null
          metadata?: Json | null
          script: string
          status?: string
          thumbnail_url?: string | null
          title: string
          video_url?: string | null
          voice_id?: string | null
        }
        Update: {
          avatar_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          duration_seconds?: number | null
          error_message?: string | null
          heygen_video_id?: string
          id?: string
          lesson_id?: string | null
          metadata?: Json | null
          script?: string
          status?: string
          thumbnail_url?: string | null
          title?: string
          video_url?: string | null
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_generations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_generations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_generations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string | null
          created_by: string | null
          event_type: string
          failure_count: number | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          secret: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_type: string
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          secret?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_type?: string
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          secret?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_admin_users: {
        Row: {
          admin_tier: Database["public"]["Enums"]["admin_tier"] | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          permission_count: number | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          admin_tier?: Database["public"]["Enums"]["admin_tier"] | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          permission_count?: never
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          admin_tier?: Database["public"]["Enums"]["admin_tier"] | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          permission_count?: never
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
      v_content_performance_summary: {
        Row: {
          avg_completion_rate: number | null
          avg_minutes_spent: number | null
          avg_struggle_score: number | null
          content_count: number | null
          content_type: Database["public"]["Enums"]["content_type"] | null
          total_completions: number | null
          total_views: number | null
        }
        Relationships: []
      }
      v_platform_health: {
        Row: {
          avg_churn_risk: number | null
          completions_today: number | null
          dau: number | null
          events_today: number | null
          high_risk_users: number | null
          mau: number | null
          report_date: string | null
          wau: number | null
        }
        Relationships: []
      }
      v_tier_permissions: {
        Row: {
          category: string | null
          permission_description: string | null
          permission_name: string | null
          tier: Database["public"]["Enums"]["admin_tier"] | null
        }
        Relationships: []
      }
      v_user_activity_today: {
        Row: {
          email: string | null
          event_count: number | null
          event_types: Database["public"]["Enums"]["event_type"][] | null
          first_activity: string | null
          full_name: string | null
          last_activity: string | null
          unique_event_types: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_milestone: {
        Args: {
          p_feedback?: string
          p_milestone: number
          p_path: string
          p_user_id: string
        }
        Returns: undefined
      }
      can_submit_certification: {
        Args: { p_path: string; p_user_id: string }
        Returns: boolean
      }
      claim_credential: {
        Args: { p_claim_code: string; p_wallet_address: string }
        Returns: {
          certificate_id: string
          error_message: string
          success: boolean
        }[]
      }
      expire_claimable_credentials: { Args: never; Returns: number }
      get_certification_status: {
        Args: { p_path: string; p_user_id: string }
        Returns: {
          certificate_id: string
          is_paid: boolean
          sbt_status: string
          submission_status: string
        }[]
      }
      get_cohort_retention: {
        Args: { p_cohort_type?: string; p_limit?: number }
        Returns: {
          cohort_date: string
          conversion_rate: number
          day_1_pct: number
          day_30_pct: number
          day_7_pct: number
          user_count: number
        }[]
      }
      get_content_performance: {
        Args: {
          p_content_type?: Database["public"]["Enums"]["content_type"]
          p_limit?: number
        }
        Returns: {
          avg_struggle_score: number
          avg_time_spent: number
          completion_rate: number
          completions: number
          content_id: string
          content_title: string
          content_type: Database["public"]["Enums"]["content_type"]
          views: number
        }[]
      }
      get_high_churn_risk_users: {
        Args: { p_limit?: number; p_min_score?: number }
        Returns: {
          days_since_activity: number
          email: string
          full_name: string
          intervention_sent: boolean
          risk_level: string
          score: number
          top_factors: Json
          user_id: string
        }[]
      }
      get_path_progress: {
        Args: { p_path: string; p_user_id: string }
        Returns: {
          approved_milestones: number
          completion_percentage: number
          current_milestone: number
          is_eligible_for_certification: boolean
          total_milestones: number
        }[]
      }
      get_retention_email_candidates: {
        Args: {
          p_days_since_signup: number
          p_email_type: Database["public"]["Enums"]["retention_email_type"]
          p_limit?: number
        }
        Returns: {
          created_at: string
          email: string
          full_name: string
          has_activity: boolean
          modules_completed: number
          user_id: string
        }[]
      }
      get_revenue_summary: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          avg_churn_rate: number
          churned: number
          net_growth: number
          new_subscriptions: number
          tier: Database["public"]["Enums"]["subscription_tier"]
          total_mrr: number
          total_subscriptions: number
        }[]
      }
      get_user_activity_summary: {
        Args: { p_days?: number; p_user_id: string }
        Returns: {
          active_days: number
          ai_interactions: number
          avg_struggle_score: number
          contents_completed: number
          contents_started: number
          sessions_attended: number
          total_active_minutes: number
          total_events: number
        }[]
      }
      get_user_permissions: {
        Args: { p_user_id: string }
        Returns: {
          category: string
          permission_description: string
          permission_name: string
        }[]
      }
      has_permission:
        | { Args: { p_permission_name: string }; Returns: boolean }
        | {
            Args: { p_permission_name: string; p_user_id: string }
            Returns: boolean
          }
      initialize_user_path: {
        Args: { p_path: string; p_user_id: string }
        Returns: undefined
      }
      is_super_admin: { Args: { p_user_id?: string }; Returns: boolean }
      process_pending_mints: {
        Args: never
        Returns: {
          mint_id: string
          path: string
          user_id: string
          wallet_address: string
        }[]
      }
      record_user_event: {
        Args: {
          p_event_type: Database["public"]["Enums"]["event_type"]
          p_metadata?: Json
          p_session_id?: string
          p_user_id?: string
        }
        Returns: string
      }
      update_streak: { Args: { p_user_id: string }; Returns: undefined }
      upsert_daily_user_metrics: {
        Args: {
          p_active_minutes?: number
          p_ai_interactions?: number
          p_contents_completed?: number
          p_contents_started?: number
          p_date: string
          p_page_views?: number
          p_sessions_attended?: number
          p_struggle_score_avg?: number
          p_user_id: string
        }
        Returns: string
      }
      user_has_session_access: {
        Args: { p_session_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      admin_tier:
        | "super_admin"
        | "content_admin"
        | "analytics_admin"
        | "support_admin"
        | "teacher"
      aku_status: "not_started" | "in_progress" | "completed" | "verified"
      assignment_submission_status:
        | "pending"
        | "submitted"
        | "graded"
        | "resubmit"
      certification_submission_status:
        | "submitted"
        | "under_review"
        | "passed"
        | "failed"
      content_type:
        | "aku"
        | "video"
        | "article"
        | "quiz"
        | "exercise"
        | "live_session"
        | "sandbox"
        | "project"
      course_level: "beginner" | "intermediate" | "advanced" | "all-levels"
      course_status: "draft" | "published" | "archived"
      event_type:
        | "page_view"
        | "feature_use"
        | "content_start"
        | "content_complete"
        | "content_pause"
        | "content_resume"
        | "session_join"
        | "session_leave"
        | "ai_interaction"
        | "code_execute"
        | "code_submit"
        | "quiz_start"
        | "quiz_complete"
        | "certificate_earned"
        | "streak_achieved"
        | "level_up"
        | "subscription_change"
        | "login"
        | "logout"
        | "error"
      font_size_preference: "small" | "medium" | "large"
      learning_pace: "relaxed" | "standard" | "intensive"
      lesson_content_type: "video" | "article" | "quiz" | "assignment" | "live"
      notification_type:
        | "course_update"
        | "new_lesson"
        | "quiz_result"
        | "certificate_issued"
        | "discussion_reply"
        | "announcement"
        | "reminder"
        | "achievement"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      profile_visibility: "public" | "private" | "connections"
      question_type:
        | "single_choice"
        | "multiple_choice"
        | "true_false"
        | "fill_blank"
        | "matching"
        | "short_answer"
        | "code"
      resource_type: "pdf" | "zip" | "link" | "code" | "image" | "document"
      retention_email_type: "day_1" | "day_3" | "day_7"
      sandbox_status: "idle" | "running" | "success" | "error"
      session_type: "onboarding" | "learning" | "support"
      submission_type: "file" | "url" | "text"
      subscription_tier:
        | "free"
        | "student"
        | "employee"
        | "owner"
        | "enterprise"
      terminal_status: "success" | "error"
      theme_preference: "dark" | "light" | "system"
      tier_type: "student" | "employee" | "owner"
      user_role: "student" | "instructor" | "admin" | "learner" | "teacher"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      admin_tier: [
        "super_admin",
        "content_admin",
        "analytics_admin",
        "support_admin",
        "teacher",
      ],
      aku_status: ["not_started", "in_progress", "completed", "verified"],
      assignment_submission_status: [
        "pending",
        "submitted",
        "graded",
        "resubmit",
      ],
      certification_submission_status: [
        "submitted",
        "under_review",
        "passed",
        "failed",
      ],
      content_type: [
        "aku",
        "video",
        "article",
        "quiz",
        "exercise",
        "live_session",
        "sandbox",
        "project",
      ],
      course_level: ["beginner", "intermediate", "advanced", "all-levels"],
      course_status: ["draft", "published", "archived"],
      event_type: [
        "page_view",
        "feature_use",
        "content_start",
        "content_complete",
        "content_pause",
        "content_resume",
        "session_join",
        "session_leave",
        "ai_interaction",
        "code_execute",
        "code_submit",
        "quiz_start",
        "quiz_complete",
        "certificate_earned",
        "streak_achieved",
        "level_up",
        "subscription_change",
        "login",
        "logout",
        "error",
      ],
      font_size_preference: ["small", "medium", "large"],
      learning_pace: ["relaxed", "standard", "intensive"],
      lesson_content_type: ["video", "article", "quiz", "assignment", "live"],
      notification_type: [
        "course_update",
        "new_lesson",
        "quiz_result",
        "certificate_issued",
        "discussion_reply",
        "announcement",
        "reminder",
        "achievement",
      ],
      payment_status: ["pending", "completed", "failed", "refunded"],
      profile_visibility: ["public", "private", "connections"],
      question_type: [
        "single_choice",
        "multiple_choice",
        "true_false",
        "fill_blank",
        "matching",
        "short_answer",
        "code",
      ],
      resource_type: ["pdf", "zip", "link", "code", "image", "document"],
      retention_email_type: ["day_1", "day_3", "day_7"],
      sandbox_status: ["idle", "running", "success", "error"],
      session_type: ["onboarding", "learning", "support"],
      submission_type: ["file", "url", "text"],
      subscription_tier: ["free", "student", "employee", "owner", "enterprise"],
      terminal_status: ["success", "error"],
      theme_preference: ["dark", "light", "system"],
      tier_type: ["student", "employee", "owner"],
      user_role: ["student", "instructor", "admin", "learner", "teacher"],
    },
  },
} as const
A new version of Supabase CLI is available: v2.75.0 (currently installed v2.74.5)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
