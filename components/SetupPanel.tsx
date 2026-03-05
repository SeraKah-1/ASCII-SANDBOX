'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, RefreshCw, Upload, Library, Play, Edit2, Trash2, Check, X, Map } from 'lucide-react';
import { useEngineStore } from '../store/useEngineStore';
import { useSavedScenariosStore } from '../store/useSavedScenariosStore';
import { useSocialStore } from '../store/useSocialStore';
import { useJourneyStore } from '../store/useJourneyStore';
import { generateScenario, generateStudyMaterial, generateJourney } from '../lib/ai';

export function SetupPanel() {
  const { appMode, setAppMode, setScenario, addLog } = useEngineStore();
  const { setupStudyGroup } = useSocialStore();
  const { setJourney } = useJourneyStore();
  const [activeTab, setActiveTab] = useState<'new' | 'library'>('new');
  const [inputText, setInputText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { scenarios, deleteScenario, renameScenario } = useSavedScenariosStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      setUploadedFile({ data: base64, mimeType: file.type, name: file.name });
      if (appMode === 'sandbox') {
        addLog(`Dokumen "${file.name}" dimuat. Siap dianalisis.`, 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() && !uploadedFile) return;
    setIsAnalyzing(true);
    
    try {
      if (appMode === 'sandbox') {
        addLog('Menganalisis dokumen/teks dan merancang hukum fisika simulasi...', 'info');
        const data = await generateScenario(inputText, uploadedFile);
        setScenario(data);
        addLog(`Dunia "${data.title}" berhasil diciptakan.`, 'info');
        addLog(data.description, 'info');
      } else if (appMode === 'study') {
        const data = await generateStudyMaterial(inputText, uploadedFile);
        setupStudyGroup(data.topic, data.facts, data.agents);
      } else if (appMode === 'journey') {
        const data = await generateJourney(inputText, uploadedFile);
        setJourney(data);
      }
    } catch (error) {
      console.error(error);
      if (appMode === 'sandbox') {
        addLog('Gagal merancang simulasi. Pastikan API Key valid atau format dokumen didukung.', 'critical');
      } else {
        alert('Gagal membuat simulasi. Cek API Key.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const saveRename = (id: string) => {
    if (editName.trim()) {
      renameScenario(id, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="w-full max-w-3xl glass-panel rounded-[2.5rem] p-10 shadow-2xl border border-white/10 relative overflow-hidden">
      {/* Subtle Background Accent */}
      <div className={`absolute -top-24 -right-24 w-64 h-64 blur-[120px] opacity-20 rounded-full transition-colors duration-700 ${appMode === 'sandbox' ? 'bg-emerald-500' : appMode === 'study' ? 'bg-blue-500' : 'bg-purple-500'}`} />

      <div className="relative z-10">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-display font-bold text-white tracking-tight mb-2">
            {appMode === 'sandbox' ? 'World Builder' : appMode === 'study' ? 'Study Group' : 'Interactive Diorama'}
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            {appMode === 'sandbox' ? 'Design a living simulation from any concept' : appMode === 'study' ? 'Learn complex topics through expert dialogue' : 'Visualize processes in a step-by-step interactive view'}
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-white/5 rounded-2xl p-1.5 mb-10 border border-white/5 max-w-md mx-auto">
          <button
            onClick={() => setAppMode('sandbox')}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${appMode === 'sandbox' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Sandbox
          </button>
          <button
            onClick={() => setAppMode('study')}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${appMode === 'study' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Study
          </button>
          <button
            onClick={() => setAppMode('journey')}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${appMode === 'journey' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Diorama
          </button>
        </div>

        {appMode === 'sandbox' && (
          <div className="flex items-center justify-center gap-10 mb-8">
            <button 
              onClick={() => setActiveTab('new')}
              className={`flex items-center gap-2 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'new' ? 'text-white border-b border-white' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              <Sparkles size={14} /> Create New
            </button>
            <button 
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-2 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'library' ? 'text-white border-b border-white' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              <Library size={14} /> Library ({scenarios.length})
            </button>
          </div>
        )}

        {(appMode === 'study' || appMode === 'journey' || activeTab === 'new') ? (
          <div className="space-y-8">
            <div className="relative group">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={appMode === 'sandbox' ? "Describe your world... (e.g., Chemical reaction, forest ecosystem)" : appMode === 'study' ? "Paste study material here..." : "What process should we visualize?"}
                className="w-full h-48 bg-black/40 border border-white/10 rounded-3xl p-6 text-sm text-zinc-200 font-medium focus:outline-none focus:border-white/30 transition-all resize-none placeholder:text-zinc-700"
              />
              
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <label className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer transition-all group/upload">
                  <Upload size={18} className="text-zinc-500 group-hover/upload:text-white transition-colors" />
                  <input type="file" accept=".pdf,.txt" className="hidden" onChange={handleFileChange} />
                </label>
                {uploadedFile && (
                  <div className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-3 py-2 rounded-xl border border-emerald-500/20 max-w-[120px] truncate">
                    {uploadedFile.name}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!inputText.trim() && !uploadedFile)}
              className="w-full group relative flex items-center justify-center gap-3 px-8 py-5 bg-white text-black disabled:bg-zinc-800 disabled:text-zinc-600 rounded-3xl font-bold text-sm uppercase tracking-[0.2em] transition-all hover:scale-[1.01] active:scale-[0.99] overflow-hidden"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Initialize Simulation</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
            {scenarios.length === 0 ? (
              <div className="col-span-2 text-center py-20 text-zinc-700 font-bold uppercase tracking-widest text-xs">
                No saved simulations
              </div>
            ) : (
              scenarios.map(s => (
                <div key={s.id} className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col justify-between group hover:bg-white/10 hover:border-white/20 transition-all relative overflow-hidden">
                  <div className="mb-4">
                    <h4 className="font-display font-bold text-zinc-100 text-lg truncate mb-1">{s.name}</h4>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{new Date(s.createdAt).toLocaleDateString()} • {s.data.entities.length} ENTITIES</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setScenario(s.data)}
                      className="flex-1 py-3 bg-white text-black rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-zinc-200 active:scale-95"
                    >
                      LOAD
                    </button>
                    <button 
                      onClick={() => startRename(s.id, s.name)}
                      className="p-3 bg-white/5 text-zinc-400 hover:text-white rounded-2xl transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => deleteScenario(s.id)}
                      className="p-3 bg-white/5 text-zinc-400 hover:text-red-400 rounded-2xl transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
