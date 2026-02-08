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
        ]
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
            foreignKeyName: "courses_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
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
        ]
      }
      users: {
        Row: {
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
          title: string | null
          total_courses: number | null
          total_students: number | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
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
          title?: string | null
          total_courses?: number | null
          total_students?: number | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
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
          title?: string | null
          total_courses?: number | null
          total_students?: number | null
          updated_at?: string | null
          verified?: boolean | null
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
            foreignKeyName: "video_generations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          display_name: string | null
          bio: string | null
          email_notifications: boolean
          learning_reminders: boolean
          community_activity: boolean
          marketing_emails: boolean
          learning_pace: "relaxed" | "standard" | "intensive"
          daily_goal_minutes: number
          show_progress_on_profile: boolean
          theme: "dark" | "light" | "system"
          two_factor_enabled: boolean
          profile_visibility: "public" | "private" | "connections"
          show_activity_status: boolean
          allow_data_collection: boolean
          reduced_motion: boolean
          high_contrast: boolean
          font_size: "small" | "medium" | "large"
          screen_reader_optimized: boolean
          wallet_connected: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name?: string | null
          bio?: string | null
          email_notifications?: boolean
          learning_reminders?: boolean
          community_activity?: boolean
          marketing_emails?: boolean
          learning_pace?: "relaxed" | "standard" | "intensive"
          daily_goal_minutes?: number
          show_progress_on_profile?: boolean
          theme?: "dark" | "light" | "system"
          two_factor_enabled?: boolean
          profile_visibility?: "public" | "private" | "connections"
          show_activity_status?: boolean
          allow_data_collection?: boolean
          reduced_motion?: boolean
          high_contrast?: boolean
          font_size?: "small" | "medium" | "large"
          screen_reader_optimized?: boolean
          wallet_connected?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          display_name?: string | null
          bio?: string | null
          email_notifications?: boolean
          learning_reminders?: boolean
          community_activity?: boolean
          marketing_emails?: boolean
          learning_pace?: "relaxed" | "standard" | "intensive"
          daily_goal_minutes?: number
          show_progress_on_profile?: boolean
          theme?: "dark" | "light" | "system"
          two_factor_enabled?: boolean
          profile_visibility?: "public" | "private" | "connections"
          show_activity_status?: boolean
          allow_data_collection?: boolean
          reduced_motion?: boolean
          high_contrast?: boolean
          font_size?: "small" | "medium" | "large"
          screen_reader_optimized?: boolean
          wallet_connected?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          setting_type: string
          description: string | null
          is_secret: boolean
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: Json
          setting_type: string
          description?: string | null
          is_secret?: boolean
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          setting_type?: string
          description?: string | null
          is_secret?: boolean
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          device_info: string | null
          ip_address: string | null
          location: string | null
          user_agent: string | null
          is_current: boolean
          last_active_at: string
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          device_info?: string | null
          ip_address?: string | null
          location?: string | null
          user_agent?: string | null
          is_current?: boolean
          last_active_at?: string
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          device_info?: string | null
          ip_address?: string | null
          location?: string | null
          user_agent?: string | null
          is_current?: boolean
          last_active_at?: string
          created_at?: string
          expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          id: string
          event_type: string
          url: string
          secret: string | null
          is_active: boolean
          last_triggered_at: string | null
          failure_count: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_type: string
          url: string
          secret?: string | null
          is_active?: boolean
          last_triggered_at?: string | null
          failure_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          url?: string
          secret?: string | null
          is_active?: boolean
          last_triggered_at?: string | null
          failure_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      retention_emails: {
        Row: {
          id: string
          user_id: string
          email_type: Database["public"]["Enums"]["retention_email_type"]
          sent_at: string
          resend_id: string | null
          success: boolean
          error_message: string | null
        }
        Insert: {
          id?: string
          user_id: string
          email_type: Database["public"]["Enums"]["retention_email_type"]
          sent_at?: string
          resend_id?: string | null
          success?: boolean
          error_message?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          email_type?: Database["public"]["Enums"]["retention_email_type"]
          sent_at?: string
          resend_id?: string | null
          success?: boolean
          error_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retention_emails_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_streak: { Args: { p_user_id: string }; Returns: undefined }
    }
    Enums: {
      aku_status: "not_started" | "in_progress" | "completed" | "verified"
      assignment_submission_status:
        | "pending"
        | "submitted"
        | "graded"
        | "resubmit"
      course_level: "beginner" | "intermediate" | "advanced" | "all-levels"
      course_status: "draft" | "published" | "archived"
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
      question_type:
        | "single_choice"
        | "multiple_choice"
        | "true_false"
        | "fill_blank"
        | "matching"
        | "short_answer"
        | "code"
      resource_type: "pdf" | "zip" | "link" | "code" | "image" | "document"
      sandbox_status: "idle" | "running" | "success" | "error"
      session_type: "onboarding" | "learning" | "support"
      submission_type: "file" | "url" | "text"
      terminal_status: "success" | "error"
      tier_type: "student" | "employee" | "owner"
      user_role: "student" | "instructor" | "admin"
      retention_email_type: "day_1" | "day_3" | "day_7"
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
      aku_status: ["not_started", "in_progress", "completed", "verified"],
      assignment_submission_status: [
        "pending",
        "submitted",
        "graded",
        "resubmit",
      ],
      course_level: ["beginner", "intermediate", "advanced", "all-levels"],
      course_status: ["draft", "published", "archived"],
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
      sandbox_status: ["idle", "running", "success", "error"],
      session_type: ["onboarding", "learning", "support"],
      submission_type: ["file", "url", "text"],
      terminal_status: ["success", "error"],
      tier_type: ["student", "employee", "owner"],
      user_role: ["student", "instructor", "admin"],
      retention_email_type: ["day_1", "day_3", "day_7"],
    },
  },
} as const
