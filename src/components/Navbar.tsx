import React, { useState } from 'react';
import { Sun, Moon, HelpCircle, BookOpen, Keyboard, X } from 'lucide-react';
import { usePdaStore } from '../store/usePdaStore';
import { ExamplesMenu } from './ExamplesMenu';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = usePdaStore();
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-rule bg-paper transition-colors duration-150">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-4">
          {/* Logo & Product Identification */}
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-xs bg-accent" />
            <span className="font-display font-medium text-base tracking-tight text-ink">
              PDA Studio
            </span>
            <span className="hidden sm:inline text-xs text-muted border-l border-rule pl-2.5">
              Pushdown Automaton Debugger
            </span>
          </div>

          {/* Right controls: Examples Menu, Shortcuts, Theme */}
          <div className="flex items-center gap-2">
            {/* Examples Selector */}
            <div className="flex items-center">
              <ExamplesMenu />
            </div>

            <div className="w-px h-4 bg-rule mx-1" />

            {/* Shortcuts Guide Button */}
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="p-1.5 rounded border border-transparent hover:border-rule hover:bg-paper-2 text-muted hover:text-ink transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-focus cursor-pointer"
              title="Keyboard shortcuts and automata reference"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Dark / Light Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded border border-transparent hover:border-rule hover:bg-paper-2 text-muted hover:text-ink transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-focus cursor-pointer"
              title="Toggle theme (light or dark)"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-accent" />
              ) : (
                <Moon className="w-4 h-4 text-ink" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Structured Help & Reference Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper/80 motion-safe:transition-opacity duration-150">
          <div className="bg-paper-2 border border-rule rounded-lg max-w-lg w-full p-5 space-y-4 shadow-none">
            <div className="flex items-center justify-between pb-3 border-b border-rule">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" />
                <h3 className="font-display font-medium text-sm text-ink">
                  Automaton Reference & Keyboard Shortcuts
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="p-1 rounded text-muted hover:text-ink border border-transparent hover:border-rule focus-visible:outline-2 focus-visible:outline-focus cursor-pointer"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Shortcuts */}
            <div>
              <div className="text-xs font-medium text-muted mb-2 flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5 text-accent" />
                <span>Keyboard shortcuts</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-paper-3 border border-rule flex items-center justify-between">
                  <span className="text-ink-2">Step forward</span>
                  <kbd className="px-1.5 py-0.5 rounded-xs bg-paper border border-rule text-ink font-mono text-[11px]">
                    →
                  </kbd>
                </div>
                <div className="p-2 rounded bg-paper-3 border border-rule flex items-center justify-between">
                  <span className="text-ink-2">Step backward</span>
                  <kbd className="px-1.5 py-0.5 rounded-xs bg-paper border border-rule text-ink font-mono text-[11px]">
                    ←
                  </kbd>
                </div>
                <div className="p-2 rounded bg-paper-3 border border-rule flex items-center justify-between">
                  <span className="text-ink-2">Play or pause</span>
                  <kbd className="px-1.5 py-0.5 rounded-xs bg-paper border border-rule text-ink font-mono text-[11px]">
                    Space
                  </kbd>
                </div>
                <div className="p-2 rounded bg-paper-3 border border-rule flex items-center justify-between">
                  <span className="text-ink-2">Run to end</span>
                  <kbd className="px-1.5 py-0.5 rounded-xs bg-paper border border-rule text-ink font-mono text-[11px]">
                    Enter
                  </kbd>
                </div>
              </div>
            </div>

            {/* Theory Reference */}
            <div className="pt-2 border-t border-rule">
              <div className="text-xs font-medium text-muted mb-2">
                Pushdown Automaton Fundamentals
              </div>
              <ul className="text-xs space-y-1.5 text-ink-2 list-disc list-inside">
                <li><strong className="text-ink">DPDA vs NPDA:</strong> DPDAs recognize deterministic CFLs; NPDAs recognize all context-free languages.</li>
                <li><strong className="text-ink">CFG to PDA:</strong> Single-state expansion: variable expansions on ε-transitions; terminal matching on input read.</li>
                <li><strong className="text-ink">Acceptance equivalence:</strong> Final state acceptance L(P) and empty stack acceptance N(P) are equivalent for NPDAs.</li>
              </ul>
            </div>

            <div className="pt-2 border-t border-rule flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="px-3 py-1.5 rounded bg-accent text-accent-ink hover:opacity-90 border border-accent text-xs font-medium transition-opacity duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
