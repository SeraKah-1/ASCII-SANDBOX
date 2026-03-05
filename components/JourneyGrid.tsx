'use client';

import React, { useState } from 'react';
import { useJourneyStore } from '../store/useJourneyStore';
import { GRID_WIDTH, GRID_HEIGHT } from '../store/useEngineStore';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function JourneyGrid() {
  const { journey, currentSceneIndex } = useJourneyStore();
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);

  if (!journey) return null;

  const scene = journey.scenes[currentSceneIndex];
  
  if (!scene) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full text-zinc-500">
        <p>No scene data.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-950 flex flex-col items-center justify-center p-4">
      {/* Grid Container */}
      <div className="relative z-10">
        <div 
          className="relative bg-black border-2 border-white/5 rounded-2xl shadow-2xl overflow-hidden"
          style={{ width: GRID_WIDTH * 16, height: GRID_HEIGHT * 16 }}
        >
          {/* Render Zones (Subtle) */}
          {journey.zones.map(zone => (
            <div 
              key={zone.id}
              className={`absolute border border-white/10 bg-white/5 backdrop-blur-[2px] rounded-xl transition-all duration-500`}
              style={{
                left: zone.bounds.x * 16,
                top: zone.bounds.y * 16,
                width: zone.bounds.w * 16,
                height: zone.bounds.h * 16,
              }}
            >
              <span className="absolute -top-4 left-3 text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold bg-black/60 px-2 py-0.5 rounded-full border border-white/5">
                {zone.name}
              </span>
            </div>
          ))}

          {/* Render Actors */}
          {journey.actors.map(actor => {
            let pos: { x: number; y: number } | undefined;
            if (Array.isArray(scene.positions)) {
              pos = (scene.positions as any[]).find(p => p.actorId === actor.id);
            } else if (scene.positions) {
              pos = (scene.positions as Record<string, {x: number, y: number}>)[actor.id];
            }

            if (!pos) return null;

            let dialogue: string | undefined;
            if (Array.isArray(scene.dialogue)) {
              dialogue = (scene.dialogue as any[]).find(d => d.actorId === actor.id)?.text;
            } else if (scene.dialogue) {
              dialogue = (scene.dialogue as Record<string, string>)[actor.id];
            }

            const isSelected = selectedActorId === actor.id;

            return (
              <div
                key={actor.id}
                className="absolute transition-all duration-1000 ease-in-out"
                style={{
                  left: pos.x * 16,
                  top: pos.y * 16,
                  width: 16,
                  height: 16,
                  zIndex: isSelected ? 50 : 10
                }}
              >
                {/* Actor Character */}
                <button
                  onClick={() => setSelectedActorId(isSelected ? null : actor.id)}
                  className={`w-full h-full flex items-center justify-center text-lg font-bold ${actor.color} hover:scale-150 transition-transform cursor-pointer relative group`}
                >
                  {actor.char}
                  
                  {/* Hover Glow */}
                  <div className={`absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity ${actor.color.replace('text-', 'bg-')}`} />
                </button>
                
                {/* Dialogue Bubble (Always visible if exists) */}
                {dialogue && (
                  <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-max max-w-[220px] bg-white/95 backdrop-blur-md text-zinc-900 text-xs font-medium px-4 py-2.5 rounded-2xl shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-2 border border-white/50">
                    <p className="leading-relaxed">{dialogue}</p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white/95" />
                  </div>
                )}

                {/* Info Card (On Click) */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-72 glass-panel rounded-2xl p-5 shadow-2xl z-50 text-left"
                    >
                      <div className="flex items-center gap-4 mb-3 pb-3 border-b border-white/5">
                        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-xl ${actor.color} border border-white/10`}>
                          {actor.char}
                        </div>
                        <div>
                          <h4 className={`font-display font-bold text-base ${actor.color}`}>{actor.name}</h4>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Entity Wiki</span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                        This entity plays a crucial role in the process of {journey.title}. Click outside to close.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Narrative Overlay (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-8 pb-12 bg-gradient-to-t from-black via-black/80 to-transparent pt-32 pointer-events-none">
        <div className="max-w-3xl mx-auto text-center pointer-events-auto">
          <motion.div
            key={currentSceneIndex}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-3xl p-8 shadow-2xl glow-purple"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30 uppercase tracking-[0.2em]">Scene {currentSceneIndex + 1}</span>
              <h2 className="text-xl font-display font-bold text-white tracking-tight">
                {scene.title}
              </h2>
            </div>
            <p className="text-zinc-200 text-lg leading-relaxed font-serif italic opacity-90">
              &quot;{scene.description}&quot;
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
