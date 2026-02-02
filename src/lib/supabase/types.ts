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
    };
    Views: {};
    Functions: {};
    Enums: {
      tier_type: 'student' | 'employee' | 'owner';
      aku_status: 'not_started' | 'in_progress' | 'completed' | 'verified';
      session_type: 'onboarding' | 'learning' | 'support';
      sandbox_status: 'idle' | 'running' | 'success' | 'error';
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
