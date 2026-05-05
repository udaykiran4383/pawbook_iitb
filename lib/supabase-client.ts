'use client';

import { createClient } from '@supabase/supabase-js';

let supabaseInstance: any = null;

// Lazy initialize Supabase only in browser
function getSupabaseClient() {
  if (typeof window === 'undefined') return null;
  
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      supabaseInstance = createClient(supabaseUrl, supabaseKey);
    }
  }

  return supabaseInstance;
}

export const supabase = getSupabaseClient();

// Helper to get user ID (using localStorage for demo)
export function getUserId(): string {
  if (typeof window === 'undefined') return '';
  
  let userId = localStorage.getItem('pawbook_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('pawbook_user_id', userId);
  }
  return userId;
}
