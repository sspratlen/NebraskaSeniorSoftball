import { createClient } from '@supabase/supabase-js';

// Publishable values only — safe to ship to the browser. Row Level Security
// in the database decides what each visitor can read or write.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://qbaruuataehdrlwmxthl.supabase.co';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_b0SJRkOT1nQVbfs-KKIKoQ_moH8XkKw';

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
export const SUPABASE_URL = url;
