/**
 * SUPABASE DATABASE TYPES
 * Auto-generated types for database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          tier: 'student' | 'employee' | 'owner' | null;
          wallet_address: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          tier?: 'student' | 'employee' | 'owner' | null;
          wallet_address?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          tier?: 'student' | 'employee' | 'owner' | null;
          wallet_address?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      learner_profiles: {
        Row: {
          id: string;
          user_id: string;
          tier: 'student' | 'employee' | 'owner';
          current_path: string;
          interaction_dna: Json;
          struggle_score: number;
          total_learning_time: number;
          current_streak: number;
          longest_streak: number;
          last_activity_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier: 'student' | 'employee' | 'owner';
          current_path?: string;
          interaction_dna?: Json;
          struggle_score?: number;
          total_learning_time?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tier?: 'student' | 'employee' | 'owner';
          current_path?: string;
          interaction_dna?: Json;
          struggle_score?: number;
          total_learning_time?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      aku_progress: {
        Row: {
          id: string;
          user_id: string;
          aku_id: string;
          status: 'not_started' | 'in_progress' | 'completed' | 'verified';
          hints_used: number;
          attempts: number;
          time_spent: number;
          struggle_score: number;
          completed_at: string | null;
          verified_at: string | null;
          workflow_snapshot: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          aku_id: string;
          status?: 'not_started' | 'in_progress' | 'completed' | 'verified';
          hints_used?: number;
          attempts?: number;
          time_spent?: number;
          struggle_score?: number;
          completed_at?: string | null;
          verified_at?: string | null;
          workflow_snapshot?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          aku_id?: string;
          status?: 'not_started' | 'in_progress' | 'completed' | 'verified';
          hints_used?: number;
          attempts?: number;
          time_spent?: number;
          struggle_score?: number;
          completed_at?: string | null;
          verified_at?: string | null;
          workflow_snapshot?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_type: 'onboarding' | 'learning' | 'support';
          messages: Json;
          current_step: number;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_type: 'onboarding' | 'learning' | 'support';
          messages?: Json;
          current_step?: number;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_type?: 'onboarding' | 'learning' | 'support';
          messages?: Json;
          current_step?: number;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      certificates: {
        Row: {
          id: string;
          user_id: string;
          certificate_type: 'student' | 'employee' | 'owner';
          token_id: string | null;
          contract_address: string | null;
          transaction_hash: string | null;
          ipfs_hash: string | null;
          metadata: Json;
          issued_at: string;
          verified_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          certificate_type: 'student' | 'employee' | 'owner';
          token_id?: string | null;
          contract_address?: string | null;
          transaction_hash?: string | null;
          ipfs_hash?: string | null;
          metadata?: Json;
          issued_at?: string;
          verified_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          certificate_type?: 'student' | 'employee' | 'owner';
          token_id?: string | null;
          contract_address?: string | null;
          transaction_hash?: string | null;
          ipfs_hash?: string | null;
          metadata?: Json;
          issued_at?: string;
          verified_at?: string | null;
        };
      };
      sandbox_sessions: {
        Row: {
          id: string;
          user_id: string;
          aku_id: string | null;
          code: string;
          output: Json | null;
          status: 'idle' | 'running' | 'success' | 'error';
          execution_time: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          aku_id?: string | null;
          code: string;
          output?: Json | null;
          status?: 'idle' | 'running' | 'success' | 'error';
          execution_time?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          aku_id?: string | null;
          code?: string;
          output?: Json | null;
          status?: 'idle' | 'running' | 'success' | 'error';
          execution_time?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      terminal_history: {
        Row: {
          id: string;
          user_id: string;
          command: string;
          output: string | null;
          status: 'success' | 'error';
          execution_time: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          command: string;
          output?: string | null;
          status?: 'success' | 'error';
          execution_time?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          command?: string;
          output?: string | null;
          status?: 'success' | 'error';
          execution_time?: number | null;
          created_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          bio: string | null;
          email_notifications: boolean;
          learning_reminders: boolean;
          community_activity: boolean;
          marketing_emails: boolean;
          learning_pace: 'relaxed' | 'standard' | 'intensive';
          daily_goal_minutes: number;
          show_progress_on_profile: boolean;
          theme: 'dark' | 'light' | 'system';
          two_factor_enabled: boolean;
          profile_visibility: 'public' | 'private' | 'connections';
          show_activity_status: boolean;
          allow_data_collection: boolean;
          reduced_motion: boolean;
          high_contrast: boolean;
          font_size: 'small' | 'medium' | 'large';
          screen_reader_optimized: boolean;
          wallet_connected: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          bio?: string | null;
          email_notifications?: boolean;
          learning_reminders?: boolean;
          community_activity?: boolean;
          marketing_emails?: boolean;
          learning_pace?: 'relaxed' | 'standard' | 'intensive';
          daily_goal_minutes?: number;
          show_progress_on_profile?: boolean;
          theme?: 'dark' | 'light' | 'system';
          two_factor_enabled?: boolean;
          profile_visibility?: 'public' | 'private' | 'connections';
          show_activity_status?: boolean;
          allow_data_collection?: boolean;
          reduced_motion?: boolean;
          high_contrast?: boolean;
          font_size?: 'small' | 'medium' | 'large';
          screen_reader_optimized?: boolean;
          wallet_connected?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string | null;
          bio?: string | null;
          email_notifications?: boolean;
          learning_reminders?: boolean;
          community_activity?: boolean;
          marketing_emails?: boolean;
          learning_pace?: 'relaxed' | 'standard' | 'intensive';
          daily_goal_minutes?: number;
          show_progress_on_profile?: boolean;
          theme?: 'dark' | 'light' | 'system';
          two_factor_enabled?: boolean;
          profile_visibility?: 'public' | 'private' | 'connections';
          show_activity_status?: boolean;
          allow_data_collection?: boolean;
          reduced_motion?: boolean;
          high_contrast?: boolean;
          font_size?: 'small' | 'medium' | 'large';
          screen_reader_optimized?: boolean;
          wallet_connected?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      platform_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: Json;
          setting_type: string;
          description: string | null;
          is_secret: boolean;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          setting_key: string;
          setting_value: Json;
          setting_type: string;
          description?: string | null;
          is_secret?: boolean;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          setting_key?: string;
          setting_value?: Json;
          setting_type?: string;
          description?: string | null;
          is_secret?: boolean;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          device_info: string | null;
          ip_address: string | null;
          location: string | null;
          user_agent: string | null;
          is_current: boolean;
          last_active_at: string;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_info?: string | null;
          ip_address?: string | null;
          location?: string | null;
          user_agent?: string | null;
          is_current?: boolean;
          last_active_at?: string;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          device_info?: string | null;
          ip_address?: string | null;
          location?: string | null;
          user_agent?: string | null;
          is_current?: boolean;
          last_active_at?: string;
          created_at?: string;
          expires_at?: string | null;
        };
      };
      webhooks: {
        Row: {
          id: string;
          event_type: string;
          url: string;
          secret: string | null;
          is_active: boolean;
          last_triggered_at: string | null;
          failure_count: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          url: string;
          secret?: string | null;
          is_active?: boolean;
          last_triggered_at?: string | null;
          failure_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          url?: string;
          secret?: string | null;
          is_active?: boolean;
          last_triggered_at?: string | null;
          failure_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      retention_emails: {
        Row: {
          id: string;
          user_id: string;
          email_type: 'day_1' | 'day_3' | 'day_7';
          sent_at: string;
          resend_id: string | null;
          success: boolean;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_type: 'day_1' | 'day_3' | 'day_7';
          sent_at?: string;
          resend_id?: string | null;
          success?: boolean;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_type?: 'day_1' | 'day_3' | 'day_7';
          sent_at?: string;
          resend_id?: string | null;
          success?: boolean;
          error_message?: string | null;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      tier_type: 'student' | 'employee' | 'owner';
      aku_status: 'not_started' | 'in_progress' | 'completed' | 'verified';
      session_type: 'onboarding' | 'learning' | 'support';
      sandbox_status: 'idle' | 'running' | 'success' | 'error';
      learning_pace: 'relaxed' | 'standard' | 'intensive';
      theme_preference: 'dark' | 'light' | 'system';
      profile_visibility: 'public' | 'private' | 'connections';
      font_size_preference: 'small' | 'medium' | 'large';
      retention_email_type: 'day_1' | 'day_3' | 'day_7';
    };
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Insertable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type Updatable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
