'use client';

import React, { useEffect } from 'react';
import { Crosshair, Zap, ShieldAlert } from 'lucide-react';
import { useEngineStore } from '../store/useEngineStore';

export function SimulationGrid() {
  const { scenario, grid, selectedTool, setSelectedTool, applyTool, isSimulating, tick, trackedInstanceId, setTrackedInstance, speedMultiplier } = useEngineStore();

  // Engine Loop
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      tick();
    }, 200 / speedMultiplier);
    return () => clearInterval(interval);
  }, [isSimulating, tick, speedMultiplier]);

  if (!scenario) return null;

  return (
    <div className="flex flex-col items-center">
      <div 
        className={`font-mono text-lg leading-none tracking-[0.2em] select-none ${selectedTool ? 'cursor-crosshair' : 'cursor-default'}`}
      >
        {grid.map((row, y) => (
          <div key={y} className="flex">
            {row.map((cell, x) => {
              const entity = cell.entityId ? scenario.entities.find(e => e.id === cell.entityId) : null;
              const isTracked = trackedInstanceId && cell.instanceId === trackedInstanceId;
              return (
                <span 
                  key={`${x}-${y}`} 
                  onClick={() => {
                    if (selectedTool) applyTool(x, y);
                    else setTrackedInstance(cell.instanceId || null);
                  }}
                  className={`${entity ? entity.color : 'text-zinc-800'} transition-colors duration-75 hover:bg-zinc-800/50 ${isTracked ? 'bg-zinc-700 ring-1 ring-emerald-500 z-10 relative' : ''}`}
                >
                  {entity ? entity.char : '.'}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      {/* God Tools Toolbar */}
      <div className="mt-8 flex gap-4 bg-zinc-900/80 p-2 rounded-xl border border-zinc-800 backdrop-blur-sm">
        {scenario.tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => setSelectedTool(selectedTool?.id === tool.id ? null : tool)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              selectedTool?.id === tool.id 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                : 'hover:bg-zinc-800 text-zinc-400 border border-transparent'
            }`}
            title={tool.desc}
          >
            {tool.action === 'spawn' ? <Zap size={18} /> : <ShieldAlert size={18} />}
            <span className="text-xs font-medium">{tool.name}</span>
          </button>
        ))}
      </div>
      {selectedTool && (
        <p className="text-xs text-emerald-400 mt-3 animate-pulse flex items-center gap-2">
          <Crosshair size={12} /> Klik area di grid untuk menggunakan {selectedTool.name} (Radius: {selectedTool.radius})
        </p>
      )}
    </div>
  );
}
