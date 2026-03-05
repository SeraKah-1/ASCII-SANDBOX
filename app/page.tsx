'use client';

import React from 'react';
import { FileText, LogOut } from 'lucide-react';
import { Header } from '../components/Header';
import { SetupPanel } from '../components/SetupPanel';
import { SimulationGrid } from '../components/SimulationGrid';
import { SocialGrid } from '../components/SocialGrid';
import { JourneyGrid } from '../components/JourneyGrid';
import { RightPanel } from '../components/RightPanel';
import { ChatHistoryPanel } from '../components/ChatHistoryPanel';
import { JourneyPanel } from '../components/JourneyPanel';
import { StorytellerLog } from '../components/StorytellerLog';
import { SettingsModal } from '../components/SettingsModal';
import { SyllabusEditor } from '../components/SyllabusEditor';
import { JourneySidebar } from '../components/JourneySidebar';
import { CommandPalette } from '../components/CommandPalette';
import { useEngineStore } from '../store/useEngineStore';
import { useSocialStore } from '../store/useSocialStore';
import { useJourneyStore } from '../store/useJourneyStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function AsciiSandbox() {
  const { appMode, scenario, clearScenario } = useEngineStore();
  const { topic, clear: clearSocial } = useSocialStore();
  const { journey, clearJourney } = useJourneyStore();

  const isSetup = (appMode === 'sandbox' && !scenario) || 
                  (appMode === 'study' && !topic) || 
                  (appMode === 'journey' && !journey);

  return (
    <div className="h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-emerald-500/30 flex flex-col overflow-hidden">
      <Header />
      <SettingsModal />
      <CommandPalette />

      <main className="flex-1 flex overflow-hidden">
        {/* Syllabus Editor (New Sidebar) */}
        <AnimatePresence mode="wait">
          {appMode === 'study' && topic && (
            <motion.div
              key="study-sidebar"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="shrink-0"
            >
              <SyllabusEditor />
            </motion.div>
          )}
          {appMode === 'journey' && journey && (
            <motion.div
              key="journey-sidebar"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="shrink-0"
            >
              <JourneySidebar />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left Panel: Simulation View & Log */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 backdrop-blur-sm flex justify-between items-center shrink-0 z-10">
            <h2 className="text-sm font-display font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <FileText size={14} className="text-emerald-500" />
              Viewport: {appMode === 'sandbox' ? (scenario ? scenario.title : 'Menunggu Input') : appMode === 'study' ? (topic ? topic : 'Menunggu Input') : (journey ? journey.title : 'Menunggu Input')}
            </h2>
            <div className="flex items-center gap-4">
              {appMode === 'sandbox' && scenario && (
                <div className="flex gap-4 text-xs font-mono text-zinc-500 flex-wrap justify-end max-w-lg">
                  {scenario.entities.map(e => (
                    <span key={e.id} className="flex items-center gap-1" title={`${e.id} (${e.movement})`}>
                      <span className={e.color}>{e.char}</span> {e.name}
                    </span>
                  ))}
                </div>
              )}
              {!isSetup && (
                <button 
                  onClick={() => {
                    if (appMode === 'sandbox') clearScenario();
                    else if (appMode === 'study') clearSocial();
                    else clearJourney();
                  }}
                  className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md transition-all hover:scale-110 active:scale-95 border border-red-500/20"
                  title="Keluar"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 bg-[#0a0a0a] flex flex-col items-center justify-center overflow-auto relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${appMode}-${isSetup}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'linear' }}
                className="w-full h-full flex flex-col items-center justify-center"
              >
                {appMode === 'sandbox' ? (
                  !scenario ? <SetupPanel /> : <SimulationGrid />
                ) : appMode === 'study' ? (
                  !topic ? <SetupPanel /> : <SocialGrid />
                ) : (
                  !journey ? <SetupPanel /> : <JourneyGrid />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Ticker Log di bawah Grid (hanya untuk Sandbox) */}
          <AnimatePresence>
            {appMode === 'sandbox' && scenario && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 160, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-md shrink-0 overflow-hidden"
              >
                <StorytellerLog />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel: Controls & Inspector atau Chat History */}
        <AnimatePresence mode="wait">
          {appMode === 'sandbox' && scenario && (
            <motion.div
              key="sandbox-right"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="shrink-0"
            >
              <RightPanel />
            </motion.div>
          )}
          {appMode === 'study' && topic && (
            <motion.div
              key="study-right"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="shrink-0"
            >
              <ChatHistoryPanel />
            </motion.div>
          )}
          {appMode === 'journey' && journey && (
            <motion.div
              key="journey-right"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="shrink-0"
            >
              <JourneyPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
