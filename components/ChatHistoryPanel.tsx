'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSocialStore } from '../store/useSocialStore';
import { MessageSquare, Play, Pause, Trash2, Send, ChevronRight, ChevronLeft } from 'lucide-react';
import { SpeedControl } from './SpeedControl';
import { generateAgentReactionToUser } from '../lib/ai';
import { motion } from 'framer-motion';

export function ChatHistoryPanel() {
  const { agents, chatHistory, isSimulating, setSimulating, clear, speedMultiplier, setSpeedMultiplier, addChatMessage, updateAgent, topic } = useSocialStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSubmitting) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsSubmitting(true);

    // Add user message
    addChatMessage({
      text: userMessage,
      type: 'user',
      agentName: 'You',
      color: 'text-zinc-300'
    });

    // Pick a random agent to react
    const randomAgent = agents[Math.floor(Math.random() * agents.length)];
    
    try {
      const reaction = await generateAgentReactionToUser(randomAgent, userMessage, topic);
      
      updateAgent(randomAgent.id, { 
        state: 'cooldown', 
        cooldownTimer: 4,
        bubbleText: reaction,
        bubbleTimer: 5
      });

      addChatMessage({
        agentId: randomAgent.id,
        agentName: randomAgent.name,
        color: randomAgent.color,
        text: reaction,
        type: 'dialogue'
      });
    } catch (error) {
      console.error("Failed to get agent reaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ width: 384 }} // w-96 is 24rem = 384px
      animate={{ width: isCollapsed ? 60 : 384 }}
      className="flex flex-col bg-zinc-900/20 border-l border-zinc-800 h-full relative transition-all duration-300 shrink-0"
    >
      {/* Collapse Toggle */}
      <button 
         onClick={() => setIsCollapsed(!isCollapsed)}
         className="absolute -left-3 top-4 bg-zinc-800 border border-zinc-700 rounded-full p-1 text-zinc-400 hover:text-white z-10"
       >
         {isCollapsed ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
       </button>

      <div className="p-4 border-b border-zinc-800 shrink-0 flex items-center justify-between overflow-hidden">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2 whitespace-nowrap">
          <MessageSquare size={14} /> {!isCollapsed && "Transkrip Diskusi"}
        </h2>
        {!isCollapsed && (
          <div className="flex gap-2">
            <SpeedControl speed={speedMultiplier} setSpeed={setSpeedMultiplier} />
            <button
              onClick={() => setSimulating(!isSimulating)}
              className={`p-1.5 rounded-md transition-colors ${isSimulating ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
              title={isSimulating ? 'Pause' : 'Play'}
            >
              {isSimulating ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              onClick={clear}
              className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md transition-colors"
              title="Keluar"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.type === 'system' ? 'items-center' : msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.type === 'system' ? (
                  <div className="bg-zinc-800/50 text-zinc-400 text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
                    {msg.text}
                  </div>
                ) : msg.type === 'user' ? (
                  <div className="max-w-[85%] rounded-lg p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-100">
                    <div className="flex items-center gap-2 mb-1 justify-end">
                      <span className="text-[9px] text-emerald-500/70">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">You</span>
                    </div>
                    <p className="text-xs leading-relaxed">{msg.text}</p>
                  </div>
                ) : (
                  <div className={`max-w-[85%] rounded-lg p-3 ${msg.type === 'thought' ? 'bg-zinc-800/30 border border-zinc-700/50' : 'bg-zinc-800 border-l-2 border-emerald-500'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.color}`}>{msg.agentName}</span>
                      <span className="text-[9px] text-zinc-600">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">{msg.text}</p>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* User Input Area */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Intervensi diskusi..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSubmitting}
                className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </>
      )}
    </motion.div>
  );
}
