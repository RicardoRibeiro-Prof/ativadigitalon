import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL = 'https://owwunfgkjcgfczmilcui.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_laDadIrk9k2J9zLyEZJtJg_yg5Pymqe';
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
