'use client';

import React, { useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Info, Send, ChevronRight, ChevronLeft } from 'lucide-react';
import { useJourneyStore } from '../store/useJourneyStore';
import { SpeedControl } from './SpeedControl';
import { handleJourneyIntervention } from '../lib/ai';
import { motion } from 'framer-motion';

export function JourneyPanel() {
  const { journey, currentSceneIndex, isPlaying, nextScene, prevScene, setScene, setIsPlaying, speedMultiplier, setSpeedMultiplier } = useJourneyStore();
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && journey) {
      interval = setInterval(() => {
        if (currentSceneIndex < journey.scenes.length - 1) {
          nextScene();
        } else {
          setIsPlaying(false);
        }
      }, 3000 / speedMultiplier); // 3 seconds per scene
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentSceneIndex, journey, nextScene, setIsPlaying, speedMultiplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSubmitting || !journey) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsSubmitting(true);
    setIsPlaying(false); // Pause while generating

    try {
      const newScene = await handleJourneyIntervention(userMessage, journey, currentSceneIndex);
      
      // Insert new scene after current scene
      const newScenes = [...journey.scenes];
      newScenes.splice(currentSceneIndex + 1, 0, newScene);
      
      // Update journey in store (we need a way to update the journey)
      useJourneyStore.setState({ 
        journey: { ...journey, scenes: newScenes }
      });
      
      // Move to the new scene
      nextScene();
    } catch (error) {
      console.error("Failed to process intervention:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!journey) return null;

  const scene = journey.scenes[currentSceneIndex];

  if (!scene) {
    return (
      <div className="w-80 border-l border-zinc-800 bg-zinc-900/50 flex flex-col shrink-0 p-4 items-center justify-center text-zinc-500">
        <p>No scenes available.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ width: 320 }}
      animate={{ width: isCollapsed ? 60 : 320 }}
      className="flex flex-col bg-zinc-900/50 border-l border-zinc-800 h-full relative transition-all duration-300 shrink-0"
    >
      {/* Collapse Toggle */}
      <button 
         onClick={() => setIsCollapsed(!isCollapsed)}
         className="absolute -left-3 top-4 bg-zinc-800 border border-zinc-700 rounded-full p-1 text-zinc-400 hover:text-white z-10"
       >
         {isCollapsed ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
       </button>

      <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 overflow-hidden">
        <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2 whitespace-nowrap">
          <Info size={16} className="text-purple-400" />
          {!isCollapsed && "Diorama Controls"}
        </h3>
      </div>

      {!isCollapsed && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Playback Controls */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col items-center gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={prevScene}
                  disabled={currentSceneIndex === 0}
                  className="p-2 text-zinc-400 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <SkipBack size={20} />
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-full transition-colors"
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button 
                  onClick={nextScene}
                  disabled={currentSceneIndex === journey.scenes.length - 1}
                  className="p-2 text-zinc-400 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <SkipForward size={20} />
                </button>
              </div>
              
              <SpeedControl speed={speedMultiplier} setSpeed={setSpeedMultiplier} />
              
              <div className="w-full flex items-center gap-2 text-xs text-zinc-500 font-mono">
                <span>01</span>
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                  {journey.scenes.map((s, i) => (
                    <div 
                      key={s.id} 
                      className={`flex-1 h-full border-r border-zinc-900 last:border-0 transition-colors ${i <= currentSceneIndex ? 'bg-purple-500' : 'bg-transparent'}`}
                    />
                  ))}
                </div>
                <span>{String(journey.scenes.length).padStart(2, '0')}</span>
              </div>
            </div>

            {/* Current Scene Info */}
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
              <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
                Adegan {currentSceneIndex + 1}: {scene.title}
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {scene.description}
              </p>
            </div>

            {/* Actors Legend */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Aktor</h4>
              <div className="space-y-2">
                {journey.actors.map(actor => (
                  <div key={actor.id} className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-lg p-2">
                    <div className={`w-8 h-8 rounded bg-zinc-900 flex items-center justify-center font-bold font-mono ${actor.color}`}>
                      {actor.char}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-200 truncate">{actor.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* User Input Area */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Intervensi adegan..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-purple-500/50 transition-colors"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSubmitting}
                className="p-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
