import React, { useState, useEffect } from 'react';
import { Activity, Play, Pause, Settings, Save, FolderOpen, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useEngineStore } from '../store/useEngineStore';
import { useSocialStore } from '../store/useSocialStore';
import { useJourneyStore } from '../store/useJourneyStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useSyncStore } from '../store/useSyncStore';
import { SpeedControl } from './SpeedControl';
import { SavedSessionsModal } from './SavedSessionsModal';

export function Header() {
  const { appMode, scenario, isSimulating: isSimulatingSandbox, setSimulating: setSimulatingSandbox, addLog, speedMultiplier: speedSandbox, setSpeedMultiplier: setSpeedSandbox } = useEngineStore();
  const { topic, isSimulating: isSimulatingStudy, setSimulating: setSimulatingStudy, speedMultiplier: speedStudy, setSpeedMultiplier: setSpeedStudy, saveSession } = useSocialStore();
  const { journey, isPlaying: isSimulatingJourney, setIsPlaying: setSimulatingJourney, speedMultiplier: speedJourney, setSpeedMultiplier: setSpeedJourney } = useJourneyStore();
  
  const { setSettingsOpen } = useSettingsStore();
  const { user, isSyncing, signIn, signOut, checkUser, saveToCloud } = useSyncStore();
  const [isSavedSessionsOpen, setIsSavedSessionsOpen] = useState(false);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const isSimulating = appMode === 'sandbox' ? isSimulatingSandbox : appMode === 'study' ? isSimulatingStudy : isSimulatingJourney;
  const speedMultiplier = appMode === 'sandbox' ? speedSandbox : appMode === 'study' ? speedStudy : speedJourney;
  const setSpeedMultiplier = appMode === 'sandbox' ? setSpeedSandbox : appMode === 'study' ? setSpeedStudy : setSpeedJourney;
  const hasContent = appMode === 'sandbox' ? !!scenario : appMode === 'study' ? !!topic : !!journey;

  const toggleSimulation = () => {
    if (!hasContent) return;
    const nextState = !isSimulating;
    if (appMode === 'sandbox') {
      setSimulatingSandbox(nextState);
      addLog(nextState ? 'Waktu mulai berjalan...' : 'Waktu dijeda.', nextState ? 'info' : 'warning');
    } else if (appMode === 'study') {
      setSimulatingStudy(nextState);
    } else if (appMode === 'journey') {
      setSimulatingJourney(nextState);
    }
  };

  const handleSave = async () => {
    if (!hasContent) return;

    if (user) {
      // Cloud Save
      if (appMode === 'sandbox' && scenario) {
        await saveToCloud('sandbox', scenario.title, scenario);
      } else if (appMode === 'study' && topic) {
        // Study mode has its own complex state, for now we just trigger local save
        saveSession();
        // Ideally we'd sync the whole state
        const state = useSocialStore.getState();
        await saveToCloud('study', topic, {
            topic: state.topic,
            facts: state.facts,
            agents: state.agents,
            chatHistory: state.chatHistory,
            slides: state.slides,
            syllabus: state.syllabus,
            currentFactIndex: state.currentFactIndex,
            learningPhase: state.learningPhase,
            sharedWith: state.sharedWith
        });
      } else if (appMode === 'journey' && journey) {
        await saveToCloud('journey', journey.title, journey);
      }
      alert('Saved to Cloud!');
    } else {
      // Local Save (Download)
      if (appMode === 'study') {
        saveSession();
        alert('Sesi belajar berhasil disimpan (Local)!');
        return;
      }

      let dataToSave;
      let filename = 'save.json';
      
      if (appMode === 'sandbox') {
        dataToSave = useEngineStore.getState().scenario;
        filename = `sandbox_${dataToSave?.title || 'save'}.json`;
      } else if (appMode === 'journey') {
        dataToSave = useJourneyStore.getState().journey;
        filename = `journey_${dataToSave?.title || 'save'}.json`;
      }

      const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <>
      <header className="h-16 shrink-0 bg-zinc-950/50 backdrop-blur-xl border-b border-white/5 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Activity size={18} className="text-black" />
            </div>
            <h1 className="text-lg font-display font-bold text-white tracking-tight">
              ASCII <span className="text-zinc-500">Sandbox</span>
            </h1>
          </div>
          
          <nav className="hidden md:flex items-center bg-white/5 rounded-full px-1 py-1 border border-white/5">
            <button 
              onClick={() => useEngineStore.getState().setAppMode('sandbox')}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${appMode === 'sandbox' ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Sandbox
            </button>
            <button 
              onClick={() => useEngineStore.getState().setAppMode('study')}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${appMode === 'study' ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Study
            </button>
            <button 
              onClick={() => useEngineStore.getState().setAppMode('journey')}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${appMode === 'journey' ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Diorama
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Sync Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
            <div className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-600'}`} />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              {user ? 'Sync Active' : 'Local Only'}
            </span>
          </div>

          <div className="h-8 w-[1px] bg-white/5 mx-2" />

          {hasContent && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="p-2 text-zinc-500 hover:text-white transition-colors"
                title={user ? "Save to Cloud" : "Download Save File"}
              >
                <Save size={20} />
              </button>
              <button 
                onClick={toggleSimulation}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                  isSimulating 
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                    : 'bg-white text-black'
                }`}
              >
                {isSimulating ? <Pause size={18} /> : <Play size={18} />}
              </button>
            </div>
          )}

          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 text-zinc-500 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings size={20} />
          </button>

          {user ? (
            <button
              onClick={signOut}
              className="flex items-center gap-2 pl-2 pr-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-all group"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center overflow-hidden border border-emerald-500/30">
                <Cloud size={12} className="text-emerald-400" />
              </div>
              <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors uppercase tracking-widest">Sign Out</span>
            </button>
          ) : (
            <button
              onClick={signIn}
              className="flex items-center gap-2 px-4 py-1.5 bg-white text-black hover:bg-zinc-200 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95"
            >
              <Cloud size={14} />
              Connect
            </button>
          )}
        </div>
      </header>
      <SavedSessionsModal isOpen={isSavedSessionsOpen} onClose={() => setIsSavedSessionsOpen(false)} />
    </>
  );
}
