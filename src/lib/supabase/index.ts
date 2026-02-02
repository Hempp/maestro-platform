/**
 * SUPABASE EXPORTS
 * Centralized exports for Supabase utilities
 */

export { createClient, getSupabaseClient } from './client';
export { createServerSupabaseClient, createAdminClient } from './server';
export type { Database, Tables, Insertable, Updatable, Json } from './types';
