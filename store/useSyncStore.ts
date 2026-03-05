import { create } from 'zustand';
import { getSupabase, SavedState } from '../lib/supabase';
import { useEngineStore } from './useEngineStore';
import { useJourneyStore } from './useJourneyStore';
import { useSocialStore } from './useSocialStore';

interface SyncState {
  user: any | null;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  
  // Auth
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  checkUser: () => Promise<void>;
  
  // Sync
  saveToCloud: (type: 'sandbox' | 'journey' | 'study', title: string, data: any) => Promise<void>;
  loadFromCloud: () => Promise<SavedState[]>;
  deleteFromCloud: (id: string) => Promise<void>;
  syncAll: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  user: null,
  isLoading: true,
  isSyncing: false,
  lastSyncTime: null,

  checkUser: async () => {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user || null, isLoading: false });
    
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user || null });
    });
  },

  signIn: async () => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) console.error('Error signing in:', error);
  },

  signOut: async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    set({ user: null });
  },

  saveToCloud: async (type, title, data) => {
    const { user } = get();
    if (!user) return;

    const supabase = getSupabase();
    set({ isSyncing: true });
    try {
      // Check if exists
      const { data: existing } = await supabase
        .from('saved_states')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', type)
        .eq('title', title)
        .single();

      if (existing) {
        await supabase
          .from('saved_states')
          .update({ 
            data, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('saved_states')
          .insert({
            user_id: user.id,
            type,
            title,
            data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
      set({ lastSyncTime: Date.now() });
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      set({ isSyncing: false });
    }
  },

  loadFromCloud: async () => {
    const { user } = get();
    if (!user) return [];

    const supabase = getSupabase();
    set({ isSyncing: true });
    try {
      const { data, error } = await supabase
        .from('saved_states')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as SavedState[];
    } catch (error) {
      console.error('Load failed:', error);
      return [];
    } finally {
      set({ isSyncing: false });
    }
  },

  deleteFromCloud: async (id) => {
    const { user } = get();
    if (!user) return;

    const supabase = getSupabase();
    set({ isSyncing: true });
    try {
      await supabase.from('saved_states').delete().eq('id', id).eq('user_id', user.id);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      set({ isSyncing: false });
    }
  },

  syncAll: async () => {
    // This would be a more complex function to merge local and cloud states
    // For now, we'll just trigger a load
    await get().loadFromCloud();
  }
}));
