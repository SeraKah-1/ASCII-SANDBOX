'use client';

import React, { useState } from 'react';
import { Activity, AlertTriangle, Skull, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEngineStore } from '../store/useEngineStore';
import { handleSandboxIntervention } from '../lib/ai';

export function StorytellerLog() {
  const { logs, scenario, addLog, applyDirectAction } = useEngineStore();
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSubmitting || !scenario) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsSubmitting(true);

    addLog(`User: ${userMessage}`, 'info');

    try {
      const result = await handleSandboxIntervention(userMessage, scenario);
      
      addLog(`GM: ${result.message}`, 'warning');

      if (result.actions && result.actions.length > 0) {
        result.actions.forEach((action: any) => {
          applyDirectAction(action.action, action.entityId, action.x, action.y, action.radius);
        });
      }
    } catch (error) {
      console.error("Failed to process intervention:", error);
      addLog("GM: Gagal memproses intervensi.", 'critical');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-2 px-4 border-b border-zinc-800 bg-zinc-900/50 z-10 shrink-0">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Activity size={14} />
          News Ticker Log
        </h2>
      </div>
      
      <div 
        className="flex-1 p-4 overflow-hidden font-mono text-xs relative flex flex-col justify-end"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 100%)'
        }}
      >
        <div className="flex flex-col gap-2 justify-end">
          <AnimatePresence initial={false}>
            {logs.map((log) => (
              <motion.div 
                key={log.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`p-2 px-3 rounded border shrink-0 flex items-center gap-3 ${
                  log.type === 'critical' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                  log.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                  'bg-zinc-800/50 border-zinc-700/50 text-zinc-300'
                }`}
              >
                <span className="opacity-50 shrink-0">
                  {log.type === 'critical' ? <Skull size={12} /> : 
                   log.type === 'warning' ? <AlertTriangle size={12} /> : '>'}
                </span>
                <span className="leading-relaxed truncate">{log.text}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* User Input Area */}
      <div className="p-2 border-t border-zinc-800 bg-zinc-900/50 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Intervensi simulasi (misal: 'Turunkan hujan', 'Munculkan predator')..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSubmitting}
            className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
