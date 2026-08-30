/**
 * Supabase Client Configuration for Tempo
 * Strictly follows STANDARDS.md
 */
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPABASE_URL = 'https://lrtudzxzytqwhhiiszun.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_7TDL7BAku8jkwBtYBfHT1A_yXSQ7o2F';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
