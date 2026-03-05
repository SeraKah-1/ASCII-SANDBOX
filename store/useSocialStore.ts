import { create } from 'zustand';

export type AgentPersona = 'Nerd' | 'Joker' | 'Skeptic' | 'Philosopher';

export interface Agent {
  id: string;
  name: string;
  persona: AgentPersona;
  color: string;
  char: string;
  state: 'wandering' | 'reading' | 'debating' | 'cooldown';
  memory: string[];
  cooldownTimer: number;
  bubbleText?: string;
  bubbleTimer?: number;
}

export interface ChatMessage {
  id: string;
  agentId?: string;
  agentName?: string;
  color?: string;
  text: string;
  type: 'thought' | 'dialogue' | 'system' | 'user';
  timestamp: number;
}

export type LearningPhase = 'C1' | 'C2' | 'Brainstorm' | 'Solution';

export interface Slide {
  id: string;
  title: string;
  content: string[];
  phase: LearningPhase;
  type: 'concept' | 'challenge' | 'solution' | 'implementation';
}

export interface SyllabusItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  slideId?: string;
}

export interface SavedSession {
  id: string;
  date: number;
  topic: string;
  facts: string[];
  agents: Agent[];
  chatHistory: ChatMessage[];
  slides: Slide[];
  syllabus: SyllabusItem[];
  currentFactIndex: number;
  learningPhase: LearningPhase;
  sharedWith: string[];
}

interface SocialState {
  isSimulating: boolean;
  topic: string;
  facts: string[];
  agents: Agent[];
  chatHistory: ChatMessage[];
  slides: Slide[];
  syllabus: SyllabusItem[];
  isGeneratingSyllabus: boolean;
  isGeneratingSlides: boolean;
  speedMultiplier: number;
  currentFactIndex: number;
  sharedWith: string[];
  learningPhase: LearningPhase;
  phaseMessageCount: number;
  savedSessions: SavedSession[];
  
  // Actions
  setupStudyGroup: (topic: string, facts: string[], agents: Omit<Agent, 'state'|'memory'|'cooldownTimer'>[]) => void;
  setSimulating: (val: boolean) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  addSlide: (slide: Omit<Slide, 'id'>) => void;
  setSyllabus: (items: SyllabusItem[]) => void;
  updateSyllabusItem: (id: string, updates: Partial<SyllabusItem>) => void;
  setGeneratingSyllabus: (val: boolean) => void;
  setGeneratingSlides: (val: boolean) => void;
  clear: () => void;
  tick: () => void;
  setSpeedMultiplier: (val: number) => void;
  setLearningPhase: (phase: LearningPhase) => void;
  incrementPhaseMessageCount: () => void;
  
  // Save/Load
  saveSession: () => void;
  loadSession: (id: string) => void;
  deleteSession: (id: string) => void;
  loadSavedSessions: () => void;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  isSimulating: false,
  topic: '',
  facts: [],
  agents: [],
  chatHistory: [],
  slides: [],
  syllabus: [],
  isGeneratingSyllabus: false,
  isGeneratingSlides: false,
  speedMultiplier: 1,
  currentFactIndex: 0,
  sharedWith: [],
  learningPhase: 'C1',
  phaseMessageCount: 0,
  savedSessions: [],

  setupStudyGroup: (topic, facts, newAgents) => {
    const agents: Agent[] = newAgents.map((a, i) => {
      return {
        ...a,
        state: 'wandering',
        memory: [],
        cooldownTimer: 0
      };
    });

    // Convert facts to syllabus items
    const syllabusItems: SyllabusItem[] = facts.map(fact => ({
      id: Math.random().toString(36).substring(7),
      title: fact.length > 30 ? fact.substring(0, 30) + '...' : fact,
      description: fact,
      status: 'pending'
    }));

    set({
      topic,
      facts,
      agents,
      chatHistory: [{ id: 'sys-1', text: `Podcast Edukasi dimulai: Topik "${topic}"`, type: 'system', timestamp: Date.now() }],
      slides: [],
      syllabus: syllabusItems,
      isSimulating: true,
      currentFactIndex: 0,
      sharedWith: [],
      learningPhase: 'C1',
      phaseMessageCount: 0
    });
  },

  setSimulating: (val) => set({ isSimulating: val }),
  setSpeedMultiplier: (val) => set({ speedMultiplier: val }),
  setLearningPhase: (phase) => set({ learningPhase: phase, phaseMessageCount: 0 }),
  incrementPhaseMessageCount: () => set((state) => ({ phaseMessageCount: state.phaseMessageCount + 1 })),
  
  setSyllabus: (items) => set({ syllabus: items }),
  updateSyllabusItem: (id, updates) => set((state) => ({
    syllabus: state.syllabus.map(item => item.id === id ? { ...item, ...updates } : item)
  })),
  setGeneratingSyllabus: (val) => set({ isGeneratingSyllabus: val }),
  setGeneratingSlides: (val) => set({ isGeneratingSlides: val }),

  saveSession: () => {
    const state = get();
    if (!state.topic) return;
    
    const newSession: SavedSession = {
      id: Date.now().toString(),
      date: Date.now(),
      topic: state.topic,
      facts: state.facts,
      agents: state.agents,
      chatHistory: state.chatHistory,
      slides: state.slides,
      syllabus: state.syllabus,
      currentFactIndex: state.currentFactIndex,
      learningPhase: state.learningPhase,
      sharedWith: state.sharedWith
    };

    const saved = [...state.savedSessions, newSession];
    localStorage.setItem('study_sessions', JSON.stringify(saved));
    set({ savedSessions: saved });
  },

  loadSession: (id) => {
    const state = get();
    const session = state.savedSessions.find(s => s.id === id);
    if (session) {
      set({
        topic: session.topic,
        facts: session.facts,
        agents: session.agents,
        chatHistory: session.chatHistory,
        slides: session.slides || [],
        syllabus: session.syllabus || [],
        currentFactIndex: session.currentFactIndex,
        learningPhase: session.learningPhase,
        sharedWith: session.sharedWith,
        isSimulating: true,
        phaseMessageCount: 0
      });
    }
  },

  deleteSession: (id) => {
    const state = get();
    const saved = state.savedSessions.filter(s => s.id !== id);
    localStorage.setItem('study_sessions', JSON.stringify(saved));
    set({ savedSessions: saved });
  },

  loadSavedSessions: () => {
    try {
      const saved = localStorage.getItem('study_sessions');
      if (saved) {
        set({ savedSessions: JSON.parse(saved) });
      }
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  },

  updateAgent: (id, updates) => set((state) => ({
    agents: state.agents.map(a => a.id === id ? { ...a, ...updates } : a)
  })),

  addChatMessage: (msg) => set((state) => ({
    chatHistory: [...state.chatHistory, { ...msg, id: Math.random().toString(36).substring(2,9), timestamp: Date.now() }]
  })),

  addSlide: (slide) => set((state) => ({
    slides: [...state.slides, { ...slide, id: Math.random().toString(36).substring(2,9) }]
  })),

  clear: () => set({
    isSimulating: false,
    topic: '',
    facts: [],
    agents: [],
    chatHistory: [],
    slides: [],
    currentFactIndex: 0,
    sharedWith: []
  }),

  tick: () => {
    const { agents, isSimulating } = get();
    if (!isSimulating) return;

    const nextAgents = agents.map(agent => {
      let next = { ...agent };

      // Decrease timers
      if (next.cooldownTimer > 0) next.cooldownTimer--;
      if (next.bubbleTimer && next.bubbleTimer > 0) {
        next.bubbleTimer--;
        if (next.bubbleTimer <= 0) {
          next.bubbleText = undefined;
        }
      }

      // If cooldown finished, back to wandering
      if (next.state === 'cooldown' && next.cooldownTimer <= 0) {
        next.state = 'wandering';
      }

      return next;
    });

    set({ agents: nextAgents });
  }
}));
