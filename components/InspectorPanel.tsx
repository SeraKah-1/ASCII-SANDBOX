'use client';

import React, { useState } from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { useSavedScenariosStore } from '../store/useSavedScenariosStore';
import { Info, Target, Activity, X, Save } from 'lucide-react';

export function InspectorPanel() {
  const { scenario, grid, trackedInstanceId, trackedPosition, setTrackedInstance } = useEngineStore();
  const { saveScenario, scenarios } = useSavedScenariosStore();
  const [saved, setSaved] = useState(false);

  if (!scenario) return <div className="p-6 text-sm text-zinc-500">Menunggu simulasi...</div>;

  const handleSave = () => {
    saveScenario(scenario.title, scenario);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  let inspectedEntity: any = null;
  let cellData: any = null;

  if (trackedInstanceId && trackedPosition) {
    cellData = grid[trackedPosition.y]?.[trackedPosition.x];
    if (cellData?.entityId) {
      inspectedEntity = scenario.entities.find(e => e.id === cellData.entityId);
    }
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      {inspectedEntity && cellData ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Target size={14} className="text-emerald-400 animate-pulse" /> Tracking Entitas
            </h3>
            <button 
              onClick={() => setTrackedInstance(null)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Stop Tracking"
            >
              <X size={16} />
            </button>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-2xl ${inspectedEntity.color}`}>{inspectedEntity.char}</span>
              <div>
                <h4 className="font-bold text-zinc-100">{inspectedEntity.name}</h4>
                <p className="text-xs text-zinc-500 font-mono">ID: {inspectedEntity.id}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Instance</span>
                <span className="text-zinc-300 font-mono text-xs">{trackedInstanceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Movement</span>
                <span className="text-zinc-300 capitalize">{inspectedEntity.movement}</span>
              </div>
              {inspectedEntity.targetEntity && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Target</span>
                  <span className="text-zinc-300">{inspectedEntity.targetEntity}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">Umur (Ticks)</span>
                <span className="text-zinc-300">{cellData.age} {inspectedEntity.lifespan ? `/ ${inspectedEntity.lifespan}` : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Posisi</span>
                <span className="text-zinc-300 font-mono">X:{trackedPosition?.x}, Y:{trackedPosition?.y}</span>
              </div>
            </div>
            {inspectedEntity.description && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">Penjelasan Ilmiah</span>
                <p className="text-xs text-zinc-300 leading-relaxed">{inspectedEntity.description}</p>
              </div>
            )}
          </div>
          <p className="text-xs text-zinc-500 italic mt-4">Kotak hijau di grid akan mengikuti pergerakan entitas ini.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {trackedInstanceId && !trackedPosition && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs flex items-center justify-between mb-4">
              <span>Entitas yang di-track telah mati/hilang.</span>
              <button onClick={() => setTrackedInstance(null)}><X size={14}/></button>
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Info size={14} /> Informasi Skenario
            </h3>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4">
              <h4 className="font-bold text-zinc-100 mb-1">{scenario.title}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">{scenario.description}</p>
              
              <button 
                onClick={handleSave} 
                disabled={saved}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded text-xs font-semibold transition-colors ${
                  saved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                {saved ? 'Tersimpan ke Library!' : <><Save size={14} /> Simpan Simulasi</>}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Activity size={14} /> Legenda Entitas
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {scenario.entities.map(e => (
                <div key={e.id} className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800/50 rounded p-2">
                  <span className={`w-6 text-center text-lg ${e.color}`}>{e.char}</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-zinc-200">{e.name}</p>
                    <p className="text-[10px] text-zinc-500 capitalize">{e.movement} {e.targetEntity ? `→ ${e.targetEntity}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
