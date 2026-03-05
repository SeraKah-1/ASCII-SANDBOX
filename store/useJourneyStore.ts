import { create } from 'zustand';

export interface JourneyZone {
  id: string;
  name: string;
  bounds: { x: number; y: number; w: number; h: number };
  color: string;
}

export interface JourneyActor {
  id: string;
  name: string;
  char: string;
  color: string;
}

export interface JourneyScene {
  id: number;
  title: string;
  description: string;
  background?: string; // URL or keyword for background image
  positions: { actorId: string; x: number; y: number }[] | Record<string, { x: number; y: number }>;
  dialogue?: { actorId: string; text: string }[] | Record<string, string>;
}

export interface JourneyData {
  title: string;
  description: string;
  zones: JourneyZone[];
  actors: JourneyActor[];
  scenes: JourneyScene[];
}

interface JourneyState {
  journey: JourneyData | null;
  currentSceneIndex: number;
  isPlaying: boolean;
  speedMultiplier: number;
  
  setJourney: (journey: JourneyData) => void;
  clearJourney: () => void;
  nextScene: () => void;
  prevScene: () => void;
  setScene: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setSpeedMultiplier: (val: number) => void;
  
  // Editor Actions
  updateScene: (index: number, updates: Partial<JourneyScene>) => void;
  addScene: (scene: JourneyScene) => void;
  deleteScene: (index: number) => void;
  reorderScenes: (fromIndex: number, toIndex: number) => void;

  // Save/Load
  savedJourneys: JourneyData[];
  saveJourney: () => void;
  loadJourney: (title: string) => void;
  deleteJourney: (title: string) => void;
  loadSavedJourneys: () => void;
}

export const useJourneyStore = create<JourneyState>((set, get) => ({
  journey: null,
  currentSceneIndex: 0,
  isPlaying: false,
  speedMultiplier: 1,
  savedJourneys: [],

  setJourney: (journey) => set({ journey, currentSceneIndex: 0, isPlaying: false }),
  clearJourney: () => set({ journey: null, currentSceneIndex: 0, isPlaying: false }),
  
  nextScene: () => set((state) => {
    if (!state.journey) return state;
    const nextIndex = Math.min(state.currentSceneIndex + 1, state.journey.scenes.length - 1);
    return { currentSceneIndex: nextIndex };
  }),
  
  prevScene: () => set((state) => {
    const prevIndex = Math.max(state.currentSceneIndex - 1, 0);
    return { currentSceneIndex: prevIndex };
  }),
  
  setScene: (index) => set((state) => {
    if (!state.journey) return state;
    if (index >= 0 && index < state.journey.scenes.length) {
      return { currentSceneIndex: index };
    }
    return state;
  }),
  
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setSpeedMultiplier: (val) => set({ speedMultiplier: val }),

  updateScene: (index, updates) => set((state) => {
    if (!state.journey) return state;
    const newScenes = [...state.journey.scenes];
    if (index >= 0 && index < newScenes.length) {
      newScenes[index] = { ...newScenes[index], ...updates };
      return { journey: { ...state.journey, scenes: newScenes } };
    }
    return state;
  }),

  addScene: (scene) => set((state) => {
    if (!state.journey) return state;
    return { journey: { ...state.journey, scenes: [...state.journey.scenes, scene] } };
  }),

  deleteScene: (index) => set((state) => {
    if (!state.journey) return state;
    const newScenes = state.journey.scenes.filter((_, i) => i !== index);
    // Adjust current index if needed
    let newIndex = state.currentSceneIndex;
    if (newIndex >= newScenes.length) newIndex = Math.max(0, newScenes.length - 1);
    
    return { 
      journey: { ...state.journey, scenes: newScenes },
      currentSceneIndex: newIndex
    };
  }),

  reorderScenes: (fromIndex, toIndex) => set((state) => {
    if (!state.journey) return state;
    const newScenes = [...state.journey.scenes];
    const [movedScene] = newScenes.splice(fromIndex, 1);
    newScenes.splice(toIndex, 0, movedScene);
    
    // If the current scene was moved, update the index to follow it
    let newCurrentIndex = state.currentSceneIndex;
    if (state.currentSceneIndex === fromIndex) {
      newCurrentIndex = toIndex;
    } else if (state.currentSceneIndex > fromIndex && state.currentSceneIndex <= toIndex) {
      newCurrentIndex--;
    } else if (state.currentSceneIndex < fromIndex && state.currentSceneIndex >= toIndex) {
      newCurrentIndex++;
    }

    return { 
      journey: { ...state.journey, scenes: newScenes },
      currentSceneIndex: newCurrentIndex
    };
  }),

  saveJourney: () => {
    const state = get();
    if (!state.journey) return;
    
    // Check if already exists, update it
    const existingIndex = state.savedJourneys.findIndex(j => j.title === state.journey!.title);
    let newSaved = [...state.savedJourneys];
    
    if (existingIndex >= 0) {
      newSaved[existingIndex] = state.journey;
    } else {
      newSaved.push(state.journey);
    }
    
    localStorage.setItem('journey_sessions', JSON.stringify(newSaved));
    set({ savedJourneys: newSaved });
  },

  loadJourney: (title) => {
    const state = get();
    const journey = state.savedJourneys.find(j => j.title === title);
    if (journey) {
      set({ journey, currentSceneIndex: 0, isPlaying: false });
    }
  },

  deleteJourney: (title) => {
    const state = get();
    const newSaved = state.savedJourneys.filter(j => j.title !== title);
    localStorage.setItem('journey_sessions', JSON.stringify(newSaved));
    set({ savedJourneys: newSaved });
  },

  loadSavedJourneys: () => {
    try {
      const saved = localStorage.getItem('journey_sessions');
      if (saved) {
        set({ savedJourneys: JSON.parse(saved) });
      }
    } catch (e) {
      console.error("Failed to load journeys", e);
    }
  },
}));
