import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ScenarioDef } from '../types/engine';

export interface SavedScenario {
  id: string;
  name: string;
  data: ScenarioDef;
  createdAt: number;
}

interface SavedScenariosState {
  scenarios: SavedScenario[];
  saveScenario: (name: string, data: ScenarioDef) => void;
  renameScenario: (id: string, newName: string) => void;
  deleteScenario: (id: string) => void;
}

export const useSavedScenariosStore = create<SavedScenariosState>()(
  persist(
    (set) => ({
      scenarios: [],
      saveScenario: (name, data) => set((state) => ({
        scenarios: [
          ...state.scenarios, 
          { id: Math.random().toString(36).substring(2, 9), name, data, createdAt: Date.now() }
        ]
      })),
      renameScenario: (id, newName) => set((state) => ({
        scenarios: state.scenarios.map(s => s.id === id ? { ...s, name: newName } : s)
      })),
      deleteScenario: (id) => set((state) => ({
        scenarios: state.scenarios.filter(s => s.id !== id)
      }))
    }),
    { name: 'ascii-saved-scenarios' }
  )
);
