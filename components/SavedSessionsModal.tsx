'use client';

import React, { useEffect } from 'react';
import { X, Trash2, Play } from 'lucide-react';
import { useSocialStore } from '../store/useSocialStore';

interface SavedSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SavedSessionsModal({ isOpen, onClose }: SavedSessionsModalProps) {
  const { savedSessions, loadSavedSessions, loadSession, deleteSession } = useSocialStore();

  useEffect(() => {
    if (isOpen) {
      loadSavedSessions();
    }
  }, [isOpen, loadSavedSessions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            Saved Study Sessions
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          {savedSessions.length === 0 ? (
            <div className="text-center text-zinc-500 py-10">
              Belum ada sesi yang disimpan.
            </div>
          ) : (
            <div className="space-y-3">
              {savedSessions.map(session => (
                <div key={session.id} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-200">{session.topic}</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(session.date).toLocaleString()} • Fase: {session.learningPhase} • Poin: {session.currentFactIndex + 1}/{session.facts.length}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        loadSession(session.id);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm font-medium transition-colors"
                    >
                      <Play size={14} /> Lanjut
                    </button>
                    <button
                      onClick={() => deleteSession(session.id)}
                      className="flex items-center gap-1 px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded text-sm font-medium transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
