import React, { useEffect, useState } from 'react';
import {
  GitCommit,
  BookOpen,
  TableProperties,
} from 'lucide-react';
import { usePdaStore } from './store/usePdaStore';
import { Navbar } from './components/Navbar';
import { Diagram } from './components/Diagram';
import { StackView } from './components/StackView';
import { TapeView } from './components/TapeView';
import { TraceView } from './components/TraceView';
import { TuplePanel } from './components/TuplePanel';
import { TransitionTable } from './components/TransitionTable';
import { InputPanel } from './components/InputPanel';

export const App: React.FC = () => {
  const {
    pda,
    inputString,
    simulationResult,
    currentStepIndex,
    isPlaying,
    playSpeed,
    stepForward,
    stepBackward,
    togglePlay,
    runSimulation,
    setStepIndex,
    theme,
  } = usePdaStore();

  const [activeBottomTab, setActiveBottomTab] = useState<'trace' | 'tuple' | 'delta'>('trace');

  // Active step details
  const currentStep =
    simulationResult && simulationResult.acceptingPath.length > 0
      ? simulationResult.acceptingPath[currentStepIndex] || simulationResult.acceptingPath[0]
      : null;

  const activeState = currentStep ? currentStep.config.state : pda.start;
  const activeRemaining = currentStep ? currentStep.config.remaining : inputString;
  const activeStack = currentStep ? currentStep.config.stack : (pda.startStack ? [pda.startStack] : []);
  const activeTransition = currentStep ? currentStep.transitionUsed : undefined;

  // Auto-play timer effect
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      stepForward();
    }, playSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, playSpeed, stepForward]);

  // Keyboard shortcuts (ArrowRight, ArrowLeft, Space, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Enter') {
          runSimulation();
        }
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepForward();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepBackward();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        runSimulation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stepForward, stepBackward, togglePlay, runSimulation]);

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-body transition-colors duration-150">
      <Navbar />

      {/* Main Grid Workspace */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Generator, Grammar & Controls (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <InputPanel />
        </div>

        {/* Right Column: Automata Workbench & Formal Ledgers (lg:col-span-8) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Integrated Workbench: State Graph + Stack Inspector + Input Buffer */}
          <div className="rounded-lg border border-rule bg-paper-2 overflow-hidden divide-y divide-rule shadow-none">
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-rule">
              {/* Cytoscape State Diagram (md:col-span-8) */}
              <div className="md:col-span-8 flex flex-col min-h-[470px] lg:min-h-[510px]">
                <Diagram
                  pda={pda}
                  activeState={activeState}
                  activeTransition={activeTransition}
                  theme={theme}
                />
              </div>

              {/* Stack Inspector (md:col-span-4) */}
              <div className="md:col-span-4 flex flex-col min-h-[470px] lg:min-h-[510px]">
                <StackView stack={activeStack} />
              </div>
            </div>

            {/* Docked Input Buffer */}
            <TapeView inputString={inputString} remaining={activeRemaining} />
          </div>

          {/* Bottom Section: Formal Specification & Trace Ledger */}
          <div className="rounded-lg border border-rule bg-paper-2 overflow-hidden shadow-none">
            {/* Segmented Bottom Tab Headers */}
            <div className="flex items-center justify-between border-b border-rule bg-paper-3 px-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveBottomTab('trace')}
                  className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-body font-medium border-b-2 transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                    activeBottomTab === 'trace'
                      ? 'border-accent text-ink font-semibold'
                      : 'border-transparent text-muted hover:text-ink'
                  }`}
                >
                  <GitCommit className="w-3.5 h-3.5 text-accent" />
                  <span>Execution Trace</span>
                  {simulationResult && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded-xs bg-paper border border-rule text-ink font-mono tabular-nums">
                      {simulationResult.acceptingPath.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBottomTab('tuple')}
                  className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-body font-medium border-b-2 transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                    activeBottomTab === 'tuple'
                      ? 'border-accent text-ink font-semibold'
                      : 'border-transparent text-muted hover:text-ink'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-accent" />
                  <span>Specification</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBottomTab('delta')}
                  className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-body font-medium border-b-2 transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                    activeBottomTab === 'delta'
                      ? 'border-accent text-ink font-semibold'
                      : 'border-transparent text-muted hover:text-ink'
                  }`}
                >
                  <TableProperties className="w-3.5 h-3.5 text-accent" />
                  <span>Transitions (δ)</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-xs bg-paper border border-rule text-ink font-mono tabular-nums">
                    {pda.transitions.length}
                  </span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted pr-2 font-body">
                <span>Step</span>
                <span className="font-mono text-ink font-medium tabular-nums">{currentStepIndex}</span>
                <span>/</span>
                <span className="font-mono text-ink font-medium tabular-nums">{simulationResult ? simulationResult.acceptingPath.length - 1 : 0}</span>
              </div>
            </div>

            {/* Bottom Panel Views */}
            <div>
              {activeBottomTab === 'trace' && simulationResult && (
                <TraceView
                  steps={simulationResult.acceptingPath}
                  currentStepIndex={currentStepIndex}
                  onSelectStep={setStepIndex}
                  accepted={simulationResult.accepted}
                />
              )}

              {activeBottomTab === 'trace' && !simulationResult && (
                <div className="py-12 text-center text-xs text-muted">
                  Enter an input string and click &ldquo;Run&rdquo; or press Space to view execution trace.
                </div>
              )}

              {activeBottomTab === 'tuple' && (
                <TuplePanel pda={pda} />
              )}

              {activeBottomTab === 'delta' && (
                <TransitionTable pda={pda} activeTransition={activeTransition} />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Engineering Footer */}
      <footer className="mt-auto border-t border-rule bg-paper-3 py-3 text-xs text-muted">
        <div className="max-w-[1440px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink">PDA Studio</span>
            <span className="text-rule">•</span>
            <span>Pushdown Automata Simulator & Debugger</span>
          </div>
          <div className="text-[11px] text-muted-2">
            Pure client-side execution (React 19, TypeScript, Cytoscape, KaTeX)
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
