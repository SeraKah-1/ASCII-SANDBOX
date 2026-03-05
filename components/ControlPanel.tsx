'use client';

import React, { useState } from 'react';
import { Info, Save, Check, X, Sparkles, Loader2 } from 'lucide-react';
import { useEngineStore } from '../store/useEngineStore';
import { useSavedScenariosStore } from '../store/useSavedScenariosStore';
import { generateScenario } from '../lib/ai';

export function ControlPanel() {
  const { scenario, sliderValues, setSliderValue, setScenario, addLog, selectedTool, setSelectedTool } = useEngineStore();
  const { saveScenario } = useSavedScenariosStore();
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const [aiInstruction, setAiInstruction] = useState('');
  const [isAiEditing, setIsAiEditing] = useState(false);

  const handleSave = () => {
    if (!scenario) return;
    if (!saveName.trim()) {
      setSaveName(scenario.title);
    }
    saveScenario(saveName.trim() || scenario.title, scenario);
    setShowSaveInput(false);
    setSaveName('');
    addLog(`Skenario "${saveName.trim() || scenario.title}" berhasil disimpan ke Library.`, 'info');
  };

  const handleAiEdit = async () => {
    if (!aiInstruction.trim() || !scenario) return;
    setIsAiEditing(true);
    addLog(`AI sedang memodifikasi simulasi: "${aiInstruction}"...`, 'info');
    try {
      // We reuse generateScenario but with the current scenario as context (implicitly via prompt engineering in lib/ai if we supported it, 
      // but for now we might just regenerate or we need a specific edit function for sandbox).
      // Since editScenario isn't in lib/ai yet, I'll use generateScenario with a prompt that includes the instruction.
      // Ideally we should have editScenario. For now, let's assume generateScenario can handle "modification" if we phrase it right, 
      // or we just generate a new one based on the instruction.
      // Let's try to generate a new one for now as a "Remix".
      const data = await generateScenario(aiInstruction + " (Based on previous context: " + scenario.title + ")", null);
      setScenario(data);
      addLog(`Simulasi diperbarui berdasarkan instruksi AI.`, 'info');
      setAiInstruction('');
    } catch (e) {
      console.error(e);
      addLog('Gagal memodifikasi simulasi.', 'critical');
    } finally {
      setIsAiEditing(false);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto flex flex-col gap-6">
      {/* AI Director Section */}
      <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800">
        <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles size={12} /> AI Director
        </h2>
        <div className="flex gap-2">
          <input 
            value={aiInstruction}
            onChange={(e) => setAiInstruction(e.target.value)}
            placeholder="Ubah simulasi (misal: 'Tambahkan gravitasi nol')..."
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50"
            onKeyDown={(e) => e.key === 'Enter' && handleAiEdit()}
          />
          <button 
            onClick={handleAiEdit}
            disabled={isAiEditing || !aiInstruction}
            className="p-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 rounded disabled:opacity-50"
          >
            {isAiEditing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          </button>
        </div>
      </div>

      {/* Sliders Section */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          Variabel Lingkungan
          <span title="Geser slider untuk memicu anomali di dalam simulasi">
            <Info size={14} className="text-zinc-600" />
          </span>
        </h2>
        
        <div className="space-y-6">
          {!scenario ? (
            <p className="text-sm text-zinc-600 italic">Slider akan di-generate oleh AI berdasarkan teks Anda.</p>
          ) : (
            scenario.sliders.map(slider => (
              <div key={slider.id}>
                <div className="flex justify-between text-sm mb-2">
                  <label className="text-zinc-300">{slider.name}</label>
                  <span className="font-mono text-zinc-500">{sliderValues[slider.id] || 0}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" 
                  value={sliderValues[slider.id] || 0} 
                  onChange={(e) => setSliderValue(slider.id, Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <p className="text-xs text-zinc-600 mt-1">{slider.desc}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tools Section */}
      {scenario && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            God Tools
            <span title="Klik tool lalu klik di grid untuk berinteraksi">
              <Info size={14} className="text-zinc-600" />
            </span>
          </h2>
          
          <div className="grid grid-cols-2 gap-2">
            {scenario.tools.map(tool => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(selectedTool?.id === tool.id ? null : tool)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedTool?.id === tool.id 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                <div className="text-xs font-bold mb-1">{tool.name}</div>
                <div className="text-[10px] opacity-70 leading-tight">{tool.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Save Section */}
      {scenario && (
        <div className="pt-4 border-t border-zinc-800">
          {!showSaveInput ? (
            <button 
              onClick={() => setShowSaveInput(true)}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Save size={14} /> Simpan Simulasi
            </button>
          ) : (
            <div className="flex gap-2">
              <input 
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder={scenario.title}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200"
                autoFocus
              />
              <button onClick={handleSave} className="p-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 rounded">
                <Check size={14} />
              </button>
              <button onClick={() => setShowSaveInput(false)} className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
