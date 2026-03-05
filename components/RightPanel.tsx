'use client';

import React, { useState } from 'react';
import { ControlPanel } from './ControlPanel';
import { InspectorPanel } from './InspectorPanel';
import { EncyclopediaPanel } from './EncyclopediaPanel';
import { Sliders, Search, BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export function RightPanel() {
  const [activeTab, setActiveTab] = useState<'inspector' | 'controls' | 'encyclopedia'>('inspector');
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.div 
      initial={{ width: 384 }}
      animate={{ width: isCollapsed ? 60 : 384 }}
      className="flex flex-col bg-zinc-900/40 backdrop-blur-xl border-l border-white/5 h-full relative transition-all duration-300 shrink-0 shadow-2xl"
    >
      {/* Collapse Toggle */}
      <button 
         onClick={() => setIsCollapsed(!isCollapsed)}
         className="absolute -left-3 top-6 bg-zinc-800 border border-white/10 rounded-full p-1.5 text-zinc-400 hover:text-white z-10 shadow-lg transition-all hover:scale-110 active:scale-90"
       >
         {isCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
       </button>

      {/* Tabs Header */}
      <div className="flex border-b border-white/5 shrink-0 overflow-hidden bg-black/20">
        <button
          onClick={() => setActiveTab('inspector')}
          className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all ${activeTab === 'inspector' ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
          title="Inspector"
        >
          <Search size={14} /> {!isCollapsed && "Inspector"}
        </button>
        <button
          onClick={() => setActiveTab('controls')}
          className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all ${activeTab === 'controls' ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
          title="Controls"
        >
          <Sliders size={14} /> {!isCollapsed && "Controls"}
        </button>
        <button
          onClick={() => setActiveTab('encyclopedia')}
          className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all ${activeTab === 'encyclopedia' ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
          title="Lore"
        >
          <BookOpen size={14} /> {!isCollapsed && "Lore"}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden relative">
        {!isCollapsed && (
          <>
            {activeTab === 'inspector' && <InspectorPanel />}
            {activeTab === 'controls' && <ControlPanel />}
            {activeTab === 'encyclopedia' && <EncyclopediaPanel />}
          </>
        )}
      </div>
    </motion.div>
  );
}
