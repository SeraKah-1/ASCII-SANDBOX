'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Terminal, Play, BookOpen, Map, Settings, X, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEngineStore } from '../store/useEngineStore';
import { useSocialStore } from '../store/useSocialStore';
import { useJourneyStore } from '../store/useJourneyStore';
import { useSettingsStore } from '../store/useSettingsStore';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { setAppMode } = useEngineStore();
  const { setSettingsOpen } = useSettingsStore();

  const commands = [
    { id: 'sandbox', name: 'Go to Sandbox', icon: <Terminal size={18} />, action: () => setAppMode('sandbox') },
    { id: 'study', name: 'Go to Study Mode', icon: <BookOpen size={18} />, action: () => setAppMode('study') },
    { id: 'journey', name: 'Go to Diorama', icon: <Map size={18} />, action: () => setAppMode('journey') },
    { id: 'settings', name: 'Open Settings', icon: <Settings size={18} />, action: () => setSettingsOpen(true) },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Palette */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center px-4 border-b border-zinc-800">
            <Search className="text-zinc-500 mr-3" size={20} />
            <input
              autoFocus
              type="text"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 h-14 bg-transparent text-zinc-200 outline-none placeholder:text-zinc-600"
            />
            <div className="flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded text-[10px] text-zinc-500 font-mono">
              <Command size={10} />
              <span>K</span>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {filteredCommands.length > 0 ? (
              <div className="space-y-1">
                {filteredCommands.map((cmd) => (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors text-left group"
                  >
                    <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
                      {cmd.icon}
                    </div>
                    <span className="font-medium">{cmd.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-600">
                No commands found for &quot;{query}&quot;
              </div>
            )}
          </div>

          <div className="px-4 py-3 bg-zinc-950 border-t border-zinc-800 flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
            <span>Navigate with arrows</span>
            <span>Esc to close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
