import { createClient } from '@supabase/supabase-js';
import { useSettingsStore } from '../store/useSettingsStore';

// Helper to get effective config
const getSupabaseConfig = () => {
  const state = useSettingsStore.getState();
  const url = state.getSupabaseUrl();
  const key = state.getSupabaseAnonKey();
  return { url, key };
};

// Initial config for the default export
const initialConfig = getSupabaseConfig();

export const supabase = createClient(
  initialConfig.url || 'https://placeholder.supabase.co',
  initialConfig.key || 'placeholder'
);

// Function to get a fresh client if settings changed
export const getSupabase = () => {
  const { url, key } = getSupabaseConfig();
  if (!url || !key || url === 'https://placeholder.supabase.co') return supabase;
  return createClient(url, key);
};

export type Profile = {
  id: string;
  updated_at: string;
  username: string;
  avatar_url: string;
};

export type SavedState = {
  id: string;
  user_id: string;
  type: 'sandbox' | 'journey' | 'study';
  title: string;
  data: any;
  created_at: string;
  updated_at: string;
};
