import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  isSettingsOpen: boolean;
  geminiKey: string;
  groqKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  worldBuilderProvider: 'gemini' | 'groq';
  worldBuilderModel: string;
  storytellerProvider: 'gemini' | 'groq';
  storytellerModel: string;

  setSettingsOpen: (isOpen: boolean) => void;
  setKeys: (gemini: string, groq: string) => void;
  setSupabaseConfig: (url: string, key: string) => void;
  setWorldBuilder: (provider: 'gemini' | 'groq', model: string) => void;
  setStoryteller: (provider: 'gemini' | 'groq', model: string) => void;
  
  // Getters for effective keys (Settings OR Env)
  getGeminiKey: () => string;
  getGroqKey: () => string;
  getSupabaseUrl: () => string;
  getSupabaseAnonKey: () => string;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      isSettingsOpen: false,
      geminiKey: '',
      groqKey: '',
      supabaseUrl: '',
      supabaseAnonKey: '',
      worldBuilderProvider: 'gemini',
      worldBuilderModel: 'gemini-3.1-pro-preview',
      storytellerProvider: 'gemini',
      storytellerModel: 'gemini-2.5-flash-lite',

      setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
      setKeys: (gemini, groq) => set({ geminiKey: gemini, groqKey: groq }),
      setSupabaseConfig: (url, key) => set({ supabaseUrl: url, supabaseAnonKey: key }),
      setWorldBuilder: (provider, model) => set({ worldBuilderProvider: provider, worldBuilderModel: model }),
      setStoryteller: (provider, model) => set({ storytellerProvider: provider, storytellerModel: model }),

      getGeminiKey: () => get().geminiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
      getGroqKey: () => get().groqKey || process.env.NEXT_PUBLIC_GROQ_API_KEY || '',
      getSupabaseUrl: () => get().supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      getSupabaseAnonKey: () => get().supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    }),
    {
      name: 'ascii-sandbox-settings',
      partialize: (state) => ({
        geminiKey: state.geminiKey,
        groqKey: state.groqKey,
        supabaseUrl: state.supabaseUrl,
        supabaseAnonKey: state.supabaseAnonKey,
        worldBuilderProvider: state.worldBuilderProvider,
        worldBuilderModel: state.worldBuilderModel,
        storytellerProvider: state.storytellerProvider,
        storytellerModel: state.storytellerModel,
      }),
    }
  )
);
