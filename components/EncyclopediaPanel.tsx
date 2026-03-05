'use client';

import React from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { BookOpen, ArrowRight } from 'lucide-react';

export function EncyclopediaPanel() {
  const { scenario } = useEngineStore();

  if (!scenario) return <div className="p-6 text-sm text-zinc-500">Menunggu simulasi...</div>;

  return (
    <div className="p-6 overflow-y-auto h-full space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <BookOpen className="text-emerald-400" size={20} />
        <h3 className="text-lg font-medium text-zinc-100">Ensiklopedia</h3>
      </div>
      <p className="text-xs text-zinc-400 leading-relaxed border-b border-zinc-800 pb-4">
        Daftar entitas dan hukum alam yang berlaku di dunia <strong>{scenario.title}</strong>.
      </p>

      <div className="space-y-4">
        {scenario.entities.map(entity => {
          // Find interactions involving this entity
          const interactions = scenario.interactions.filter(
            i => i.entity1 === entity.id || i.entity2 === entity.id
          );

          return (
            <div key={entity.id} className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-2xl w-8 text-center ${entity.color}`}>{entity.char}</span>
                <div>
                  <h4 className="font-bold text-zinc-100">{entity.name}</h4>
                  <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">{entity.movement} {entity.targetEntity ? `→ ${entity.targetEntity}` : ''}</p>
                </div>
              </div>
              
              {entity.description && (
                <p className="text-xs text-zinc-300 leading-relaxed mb-4 bg-zinc-950/50 p-3 rounded">
                  {entity.description}
                </p>
              )}

              {interactions.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">Reaksi & Interaksi</span>
                  <ul className="space-y-2">
                    {interactions.map((interaction, idx) => {
                      const otherEntityId = interaction.entity1 === entity.id ? interaction.entity2 : interaction.entity1;
                      const otherEntity = scenario.entities.find(e => e.id === otherEntityId);
                      const myResult = interaction.entity1 === entity.id ? interaction.result1 : interaction.result2;
                      const otherResult = interaction.entity1 === entity.id ? interaction.result2 : interaction.result1;
                      
                      return (
                        <li key={idx} className="text-xs flex items-start gap-2 bg-zinc-800/30 p-2 rounded">
                          <ArrowRight size={12} className="text-zinc-500 mt-0.5 shrink-0" />
                          <span className="text-zinc-400 leading-relaxed">
                            Bertemu <strong>{otherEntity?.name || otherEntityId}</strong>: 
                            {myResult === 'none' ? ' Mati/Hancur.' : myResult === 'same' ? ' Tidak berubah.' : ` Menjadi ${myResult}.`}
                            {interaction.spawnEntity && ` Menghasilkan ${interaction.spawnEntity}.`}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
