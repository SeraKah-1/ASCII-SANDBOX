'use client';

import React, { useEffect, useRef } from 'react';
import { useSocialStore, LearningPhase } from '../store/useSocialStore';
import { generateAgentThought, generateAgentDialogue } from '../lib/ai';
import { SlideDeck } from './SlideDeck';
import { Mic, User } from 'lucide-react';

export function SocialGrid() {
  const { 
    agents, 
    isSimulating, 
    tick, 
    updateAgent, 
    addChatMessage,
    facts,
    speedMultiplier,
    topic,
    chatHistory,
    currentFactIndex,
    sharedWith,
    learningPhase,
    incrementPhaseMessageCount,
    setLearningPhase
  } = useSocialStore();

  const tickRef = useRef<NodeJS.Timeout | null>(null);

  // Main Simulation Loop
  useEffect(() => {
    if (isSimulating) {
      tickRef.current = setInterval(() => {
        tick();
      }, 1500 / speedMultiplier); // Slow pace: 1.5 seconds per tick
    } else if (tickRef.current) {
      clearInterval(tickRef.current);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [isSimulating, tick, speedMultiplier]);

  const processingRef = useRef(false);

  // Handle Interactions (Async AI Calls)
  useEffect(() => {
    if (!isSimulating || processingRef.current || facts.length === 0) return;

    const handleInteractions = async () => {
      if (processingRef.current) return;
      processingRef.current = true;

      try {
        let interactionOccurred = false;
        const state = useSocialStore.getState();
        
        // Find an agent who is ready to talk (wandering state)
        // In this text-based version, 'wandering' just means 'idle/ready'
        const readyAgents = agents.filter(a => a.state === 'wandering' && a.cooldownTimer <= 0);
        
        if (readyAgents.length > 0) {
          // Phase 0: Reading/Thinking (Everyone must read first)
          const unreadAgents = readyAgents.filter(a => !sharedWith.includes(a.id));
          
          if (unreadAgents.length > 0) {
            // Pick one to read
            const agent = unreadAgents[0];
            interactionOccurred = true;
            updateAgent(agent.id, { state: 'reading' });
            
            const fact = facts[currentFactIndex];
            const result = await generateAgentThought(agent, fact, topic);
            const thoughtText = typeof result === 'string' ? result : result.thought;
            const slide = typeof result === 'object' ? result.slide : null;

            if (slide) {
              useSocialStore.getState().addSlide({
                title: slide.title,
                content: slide.content,
                phase: 'C1',
                type: slide.type
              });
            }
            
            useSocialStore.setState(s => {
              const newShared = [...s.sharedWith, agent.id];
              if (newShared.length === s.agents.length) {
                // Everyone has read, start C1 discussion
                setTimeout(() => {
                  if (!useSocialStore.getState().isSimulating) return;
                  useSocialStore.getState().addChatMessage({
                    text: `Semua sudah membaca. Memulai Ketukan 1 (The Hook & Curiosity).`,
                    type: 'system'
                  });
                }, 1000);
              }
              return { sharedWith: newShared };
            });
            
            updateAgent(agent.id, { 
              state: 'cooldown', 
              cooldownTimer: 3, 
              memory: [...agent.memory, fact].slice(-3) 
            });
            
            addChatMessage({
              agentId: agent.id,
              agentName: agent.name,
              color: agent.color,
              text: thoughtText,
              type: 'thought'
            });
          } 
          // Phase 1+: Discussion (Only if everyone has read)
          else if (sharedWith.length === agents.length && readyAgents.length >= 2) {
             // Pick two random agents to talk
             const agentA = readyAgents[Math.floor(Math.random() * readyAgents.length)];
             const others = readyAgents.filter(a => a.id !== agentA.id);
             if (others.length > 0) {
                const agentB = others[Math.floor(Math.random() * others.length)];
                
                interactionOccurred = true;
                updateAgent(agentA.id, { state: 'debating' });
                updateAgent(agentB.id, { state: 'debating' });

                const fact = facts[currentFactIndex];
                // Get richer context: last 8 messages to ensure flow
                const recentChats = chatHistory.slice(-8).map(c => `${c.agentName}: ${c.text}`).join('\n');
                
                const dialogue = await generateAgentDialogue(agentA, agentB, topic, recentChats, learningPhase);
                
                if (dialogue.slide) {
                  useSocialStore.getState().addSlide({
                    title: dialogue.slide.title,
                    content: dialogue.slide.content,
                    phase: learningPhase,
                    type: dialogue.slide.type as any
                  });
                }

                updateAgent(agentA.id, { state: 'cooldown', cooldownTimer: 5 });
                updateAgent(agentB.id, { state: 'cooldown', cooldownTimer: 5 });

                addChatMessage({ agentId: agentA.id, agentName: agentA.name, color: agentA.color, text: dialogue.dialogueA, type: 'dialogue' });
                addChatMessage({ agentId: agentB.id, agentName: agentB.name, color: agentB.color, text: dialogue.dialogueB, type: 'dialogue' });

                incrementPhaseMessageCount();
                
                // Check for phase transition
                const newCount = useSocialStore.getState().phaseMessageCount;
                if (newCount >= 2) { // 2 exchanges per phase
                  let nextPhase: LearningPhase | null = null;
                  let phaseMsg = '';
                  
                  if (learningPhase === 'C1') {
                    nextPhase = 'C2';
                    phaseMsg = 'Lanjut ke Ketukan 2 (Deep Dive & Refine).';
                  } else if (learningPhase === 'C2') {
                    nextPhase = 'Brainstorm';
                    phaseMsg = 'Lanjut ke Ketukan 3 (Challenge & Application).';
                  } else if (learningPhase === 'Brainstorm') {
                    nextPhase = 'Solution';
                    phaseMsg = 'Lanjut ke Ketukan 4 (The Perfect Takeaway).';
                  } else if (learningPhase === 'Solution') {
                    // Next fact
                    setTimeout(() => {
                      if (!useSocialStore.getState().isSimulating) return;
                      useSocialStore.setState(st => ({
                        currentFactIndex: Math.min(st.currentFactIndex + 1, st.facts.length - 1),
                        sharedWith: [],
                        learningPhase: 'C1',
                        phaseMessageCount: 0
                      }));
                      useSocialStore.getState().addChatMessage({
                        text: `Poin materi selesai dibahas. Lanjut ke poin berikutnya!`,
                        type: 'system'
                      });
                    }, 2000);
                  }

                  if (nextPhase) {
                    setLearningPhase(nextPhase);
                    setTimeout(() => {
                      if (!useSocialStore.getState().isSimulating) return;
                      useSocialStore.getState().addChatMessage({
                        text: phaseMsg,
                        type: 'system'
                      });
                    }, 1000);
                  }
                }
             }
          }
        }
      } catch (error) {
        console.error("Interaction error:", error);
        // Reset stuck agents if any
        agents.forEach(a => {
            if (a.state === 'reading' || a.state === 'debating') {
                updateAgent(a.id, { state: 'wandering', cooldownTimer: 2 });
            }
        });
      } finally {
        processingRef.current = false;
      }
    };

    handleInteractions();
  }, [agents, isSimulating, facts, updateAgent, addChatMessage, topic, chatHistory, currentFactIndex, sharedWith, learningPhase]);

  return (
    <div className="flex w-full h-full gap-4 p-4 overflow-hidden">
      {/* Left: Podcast Studio Visuals */}
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950/50 rounded-xl border border-zinc-800/50 p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=2500&auto=format&fit=crop')] bg-cover bg-center opacity-10 blur-sm"></div>
        
        <div className="z-10 flex flex-col items-center gap-8 w-full max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-500/20 rounded-full animate-pulse">
                    <Mic className="text-red-500" size={24} />
                </div>
                <h2 className="text-xl font-bold text-zinc-200 tracking-wider">LIVE ON AIR</h2>
            </div>

            <div className="flex justify-center gap-8 w-full">
                {agents.map(agent => (
                    <div key={agent.id} className="flex flex-col items-center gap-3 transition-all duration-500" style={{
                        transform: agent.state === 'debating' || agent.state === 'reading' ? 'scale(1.1)' : 'scale(1)',
                        opacity: agent.state === 'debating' || agent.state === 'reading' ? 1 : 0.7
                    }}>
                        <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center bg-zinc-900 shadow-xl relative overflow-hidden`} style={{ borderColor: agent.color }}>
                            <User size={48} style={{ color: agent.color }} />
                            {/* Audio visualizer effect */}
                            {(agent.state === 'debating' || agent.state === 'reading') && (
                                <div className="absolute inset-0 flex items-end justify-center gap-1 pb-4 opacity-50">
                                    <div className="w-1 bg-current h-4 animate-[bounce_1s_infinite]" style={{ color: agent.color }}></div>
                                    <div className="w-1 bg-current h-6 animate-[bounce_1.2s_infinite]" style={{ color: agent.color }}></div>
                                    <div className="w-1 bg-current h-3 animate-[bounce_0.8s_infinite]" style={{ color: agent.color }}></div>
                                </div>
                            )}
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-sm" style={{ color: agent.color }}>{agent.name}</div>
                            <div className="text-xs text-zinc-500 uppercase tracking-wide">{agent.persona}</div>
                        </div>
                        
                        {/* Status Indicator */}
                        <div className="h-6">
                            {agent.state === 'reading' && <span className="text-xs text-zinc-400 animate-pulse">Thinking...</span>}
                            {agent.state === 'debating' && <span className="text-xs text-emerald-400 font-bold">Speaking</span>}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 p-4 bg-zinc-900/80 rounded-lg border border-zinc-800 w-full text-center">
                <div className="text-xs text-zinc-500 uppercase mb-1">Current Topic</div>
                <div className="text-zinc-200 font-medium">{facts[currentFactIndex] || "Loading topic..."}</div>
            </div>
        </div>
      </div>
      
      {/* Right: Slide Deck */}
      <div className="flex-1 min-w-[400px]">
        <SlideDeck />
      </div>
    </div>
  );
}
