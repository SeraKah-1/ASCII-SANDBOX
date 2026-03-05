import React from 'react';
import { FastForward } from 'lucide-react';

interface SpeedControlProps {
  speed: number;
  setSpeed: (speed: number) => void;
}

export function SpeedControl({ speed, setSpeed }: SpeedControlProps) {
  const speeds = [0.5, 1, 2, 4];
  return (
    <div className="flex items-center bg-zinc-800/50 rounded-md border border-zinc-700/50 overflow-hidden text-xs font-medium h-9">
      <div className="px-2 h-full text-zinc-500 border-r border-zinc-700/50 flex items-center justify-center bg-zinc-900/50" title="Kecepatan Simulasi">
        <FastForward size={14} />
      </div>
      {speeds.map(s => (
        <button
          key={s}
          onClick={() => setSpeed(s)}
          className={`px-2.5 h-full transition-colors ${speed === s ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'}`}
        >
          {s}x
        </button>
      ))}
    </div>
  );
}
