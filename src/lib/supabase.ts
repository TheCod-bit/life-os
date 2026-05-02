import { createClient } from '@supabase/supabase-js';

// Replace these with your Supabase project credentials:
// Go to https://supabase.com → New Project → Settings → API
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface Player {
  id: string;
  username: string;
  tokens: number;
  tier: string;
  updated_at: string;
  created_at: string;
}
