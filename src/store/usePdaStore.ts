import { create } from 'zustand';
import { PDA, SimulationResult, SimulationStep, isPDA_NonDeterministic } from '../core/pda';
import { simulatePDA } from '../core/simulate';
import { BUILT_IN_EXAMPLES } from '../core/examples';

export interface PDAState {
  // PDA definition
  pda: PDA;
  isNondeterministic: boolean;
  ndReasons: string[];

  // Simulation
  inputString: string;
  simulationResult: SimulationResult | null;
  currentStepIndex: number;
  isPlaying: boolean;
  playSpeed: number; // in milliseconds per step

  // UI state
  activeTab: 'diagram' | 'trace' | 'table' | 'tuple' | 'cfg';
  theme: 'light' | 'dark';
  selectedExampleId: string;

  // Actions
  setPDA: (newPDA: PDA) => void;
  setInputString: (newInput: string) => void;
  runSimulation: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  resetSimulation: () => void;
  setStepIndex: (index: number) => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaySpeed: (speed: number) => void;
  setActiveTab: (tab: 'diagram' | 'trace' | 'table' | 'tuple' | 'cfg') => void;
  toggleTheme: () => void;
  loadExample: (exampleId: string) => void;
  getCurrentStep: () => SimulationStep | null;
}

// Initial setup with textbook example a^(2n) b^n (n >= 1) and test input "aaaabb" (n = 2)
const defaultExample = BUILT_IN_EXAMPLES[0];
const initialPDA = defaultExample.getPDA();
const initialInput = defaultExample.defaultInput;
const initialSim = simulatePDA(initialPDA, initialInput);
const initialND = isPDA_NonDeterministic(initialPDA);

const initialTheme: 'light' | 'dark' =
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

if (typeof document !== 'undefined') {
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    document.documentElement.setAttribute('data-mode', 'dark');
  } else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-mode', 'light');
  }
}

export const usePdaStore = create<PDAState>((set, get) => ({
  pda: initialPDA,
  isNondeterministic: initialND.isNondeterministic,
  ndReasons: initialND.reasons,

  inputString: initialInput,
  simulationResult: initialSim,
  currentStepIndex: 0,
  isPlaying: false,
  playSpeed: 700,

  activeTab: 'diagram',
  theme: initialTheme,
  selectedExampleId: defaultExample.id,

  setPDA: (newPDA: PDA) => {
    const nd = isPDA_NonDeterministic(newPDA);
    const { inputString } = get();
    const sim = simulatePDA(newPDA, inputString);
    set({
      pda: newPDA,
      isNondeterministic: nd.isNondeterministic,
      ndReasons: nd.reasons,
      simulationResult: sim,
      currentStepIndex: 0,
      isPlaying: false,
    });
  },

  setInputString: (newInput: string) => {
    const { pda } = get();
    const sim = simulatePDA(pda, newInput);
    set({
      inputString: newInput,
      simulationResult: sim,
      currentStepIndex: 0,
      isPlaying: false,
    });
  },

  runSimulation: () => {
    const { pda, inputString } = get();
    const sim = simulatePDA(pda, inputString);
    set({
      simulationResult: sim,
      currentStepIndex: sim.acceptingPath.length > 0 ? sim.acceptingPath.length - 1 : 0,
      isPlaying: false,
    });
  },

  stepForward: () => {
    const { simulationResult, currentStepIndex, isPlaying } = get();
    if (!simulationResult) return;
    const maxIndex = simulationResult.acceptingPath.length - 1;
    if (currentStepIndex < maxIndex) {
      set({ currentStepIndex: currentStepIndex + 1 });
    } else if (isPlaying) {
      set({ isPlaying: false });
    }
  },

  stepBackward: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1, isPlaying: false });
    }
  },

  resetSimulation: () => {
    set({ currentStepIndex: 0, isPlaying: false });
  },

  setStepIndex: (index: number) => {
    const { simulationResult } = get();
    if (!simulationResult) return;
    const clamped = Math.max(0, Math.min(index, simulationResult.acceptingPath.length - 1));
    set({ currentStepIndex: clamped, isPlaying: false });
  },

  togglePlay: () => {
    const { isPlaying, currentStepIndex, simulationResult } = get();
    if (!isPlaying && simulationResult) {
      // If at end, wrap to start
      if (currentStepIndex >= simulationResult.acceptingPath.length - 1) {
        set({ currentStepIndex: 0, isPlaying: true });
        return;
      }
    }
    set({ isPlaying: !isPlaying });
  },

  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),

  setPlaySpeed: (speed: number) => set({ playSpeed: speed }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    if (typeof document !== 'undefined') {
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.documentElement.setAttribute('data-mode', 'dark');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-mode', 'light');
      }
    }
    set({ theme: next });
  },

  loadExample: (exampleId: string) => {
    const ex = BUILT_IN_EXAMPLES.find(e => e.id === exampleId);
    if (!ex) return;
    const newPDA = ex.getPDA();
    const nd = isPDA_NonDeterministic(newPDA);
    const sim = simulatePDA(newPDA, ex.defaultInput);
    set({
      selectedExampleId: exampleId,
      pda: newPDA,
      inputString: ex.defaultInput,
      simulationResult: sim,
      currentStepIndex: 0,
      isPlaying: false,
      isNondeterministic: nd.isNondeterministic,
      ndReasons: nd.reasons,
    });
  },

  getCurrentStep: () => {
    const { simulationResult, currentStepIndex } = get();
    if (!simulationResult || simulationResult.acceptingPath.length === 0) return null;
    return simulationResult.acceptingPath[currentStepIndex] || null;
  },
}));
