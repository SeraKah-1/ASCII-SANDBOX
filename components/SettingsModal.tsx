'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, Cpu, RefreshCw, CheckCircle2, Database, Settings } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

const GEMINI_MODELS = [
  'gemini-3.1-pro-preview',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3.1-flash-lite-preview' ,
  
];

export function SettingsModal() {
  const {
    isSettingsOpen,
    setSettingsOpen,
    geminiKey,
    groqKey,
    supabaseUrl,
    supabaseAnonKey,
    worldBuilderProvider,
    worldBuilderModel,
    storytellerProvider,
    storytellerModel,
    setKeys,
    setSupabaseConfig,
    setWorldBuilder,
    setStoryteller,
  } = useSettingsStore();

  const [localGemini, setLocalGemini] = useState(geminiKey);
  const [localGroq, setLocalGroq] = useState(groqKey);
  const [localSupabaseUrl, setLocalSupabaseUrl] = useState(supabaseUrl);
  const [localSupabaseKey, setLocalSupabaseKey] = useState(supabaseAnonKey);
  const [groqModels, setGroqModels] = useState<string[]>([]);
  const [isLoadingGroq, setIsLoadingGroq] = useState(false);
  const [groqError, setGroqError] = useState('');

  useEffect(() => {
    if (isSettingsOpen) {
      setLocalGemini(geminiKey);
      setLocalGroq(groqKey);
      setLocalSupabaseUrl(supabaseUrl);
      setLocalSupabaseKey(supabaseAnonKey);
      if (groqKey && groqModels.length === 0) {
        fetchGroqModels(groqKey);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSettingsOpen, geminiKey, groqKey, supabaseUrl, supabaseAnonKey]);

  const fetchGroqModels = async (key: string) => {
    if (!key) return;
    setIsLoadingGroq(true);
    setGroqError('');
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Invalid Groq API Key');
      const data = await res.json();
      // Filter for common chat/instruction models to keep the list clean but comprehensive
      const models = data.data
        .map((m: any) => m.id)
        .filter((id: string) => 
          id.includes('llama') || 
          id.includes('mixtral') || 
          id.includes('gemma') ||
          id.includes('whisper') ||
          id.includes('distil')
        )
        .sort();
      setGroqModels(models);
    } catch (err: any) {
      setGroqError(err.message);
      setGroqModels([]);
    } finally {
      setIsLoadingGroq(false);
    }
  };

  const handleSave = () => {
    setKeys(localGemini, localGroq);
    setSupabaseConfig(localSupabaseUrl, localSupabaseKey);
    setSettingsOpen(false);
  };

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-zinc-100">Engine Settings</h2>
              <p className="text-xs text-zinc-500 font-medium">Configure AI models and cloud synchronization</p>
            </div>
          </div>
          <button onClick={() => setSettingsOpen(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-10 flex-1 no-scrollbar">
          {/* API Keys Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-white/5">
              <Key size={16} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-[0.2em]">API Authentication</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Gemini API Key</label>
                <input
                  type="password"
                  value={localGemini}
                  onChange={(e) => setLocalGemini(e.target.value)}
                  placeholder={process.env.NEXT_PUBLIC_GEMINI_API_KEY ? "Using Environment Key (Vercel)" : "Enter Gemini API Key..."}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Groq API Key</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={localGroq}
                    onChange={(e) => setLocalGroq(e.target.value)}
                    placeholder={process.env.NEXT_PUBLIC_GROQ_API_KEY ? "Using Environment Key (Vercel)" : "gsk_..."}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                  />
                  <button
                    onClick={() => fetchGroqModels(localGroq)}
                    disabled={!localGroq || isLoadingGroq}
                    className="px-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 rounded-xl flex items-center gap-2 text-xs font-bold transition-all"
                  >
                    {isLoadingGroq ? <RefreshCw size={14} className="animate-spin" /> : 'VERIFY'}
                  </button>
                </div>
                {groqError && <p className="text-[10px] text-red-400 font-medium">{groqError}</p>}
                {groqModels.length > 0 && <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 size={12} /> CONNECTED ({groqModels.length} MODELS)</p>}
              </div>
            </div>
          </section>

          {/* Cloud Sync Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-white/5">
              <Database size={16} className="text-blue-400" />
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-[0.2em]">Cloud Synchronization</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Supabase URL</label>
                <input
                  type="text"
                  value={localSupabaseUrl}
                  onChange={(e) => setLocalSupabaseUrl(e.target.value)}
                  placeholder={process.env.NEXT_PUBLIC_SUPABASE_URL ? "Using Environment URL (Vercel)" : "https://xyz.supabase.co"}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Supabase Anon Key</label>
                <input
                  type="password"
                  value={localSupabaseKey}
                  onChange={(e) => setLocalSupabaseKey(e.target.value)}
                  placeholder={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Using Environment Key (Vercel)" : "eyJhbGciOiJIUzI1NiIsInR..."}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
              Syncing requires a <code className="text-zinc-400 bg-white/5 px-1 rounded">saved_states</code> table in your Supabase project. 
              Leave empty to use the default project or local storage only.
            </p>
          </section>

          {/* Model Selection Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-white/5">
              <Cpu size={16} className="text-purple-400" />
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-[0.2em]">Model Intelligence</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* World Builder */}
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">World Builder</h4>
                    <p className="text-[10px] text-zinc-500 font-medium mt-1">Generates rules & entities</p>
                  </div>
                  <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase rounded border border-emerald-500/20">High IQ</div>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase">Provider</label>
                    <select
                      value={worldBuilderProvider}
                      onChange={(e) => setWorldBuilder(e.target.value as 'gemini' | 'groq', worldBuilderModel)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none"
                    >
                      <option value="gemini">Google Gemini</option>
                      <option value="groq" disabled={groqModels.length === 0}>Groq (Fast)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase">Model</label>
                    <select
                      value={worldBuilderModel}
                      onChange={(e) => setWorldBuilder(worldBuilderProvider, e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none"
                    >
                      {worldBuilderProvider === 'gemini' 
                        ? GEMINI_MODELS.map(m => <option key={m} value={m}>{m}</option>)
                        : groqModels.map(m => <option key={m} value={m}>{m}</option>)
                      }
                    </select>
                  </div>
                </div>
              </div>

              {/* Storyteller */}
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Storyteller</h4>
                    <p className="text-[10px] text-zinc-500 font-medium mt-1">Real-time commentary</p>
                  </div>
                  <div className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[8px] font-bold uppercase rounded border border-blue-500/20">Low Latency</div>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase">Provider</label>
                    <select
                      value={storytellerProvider}
                      onChange={(e) => setStoryteller(e.target.value as 'gemini' | 'groq', storytellerModel)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none"
                    >
                      <option value="gemini">Google Gemini</option>
                      <option value="groq" disabled={groqModels.length === 0}>Groq (Fast)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase">Model</label>
                    <select
                      value={storytellerModel}
                      onChange={(e) => setStoryteller(storytellerProvider, e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none"
                    >
                      {storytellerProvider === 'gemini' 
                        ? GEMINI_MODELS.map(m => <option key={m} value={m}>{m}</option>)
                        : groqModels.map(m => <option key={m} value={m}>{m}</option>)
                      }
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end gap-3">
          <button
            onClick={() => setSettingsOpen(false)}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold text-sm transition-all active:scale-95"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            SAVE CHANGES
          </button>
        </div>
      </div>
    </div>
  );
}
