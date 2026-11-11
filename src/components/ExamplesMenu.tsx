import React from 'react';
import { ChevronDown } from 'lucide-react';
import { BUILT_IN_EXAMPLES } from '../core/examples';
import { usePdaStore } from '../store/usePdaStore';

export const ExamplesMenu: React.FC = () => {
  const { selectedExampleId, loadExample } = usePdaStore();

  return (
    <div className="relative inline-block text-left">
      <select
        value={selectedExampleId}
        onChange={e => loadExample(e.target.value)}
        className="appearance-none text-xs font-body py-1.5 pl-2.5 pr-7 rounded border border-rule bg-paper text-ink hover:border-muted focus-visible:outline-2 focus-visible:outline-focus transition-colors duration-150 cursor-pointer"
        title="Select an automaton model"
      >
        <optgroup label="Standard Automata">
          {BUILT_IN_EXAMPLES.filter(e => e.category === 'Textbook Classics').map(ex => (
            <option key={ex.id} value={ex.id}>
              {ex.title}
            </option>
          ))}
        </optgroup>
        <optgroup label="Grammar Models">
          {BUILT_IN_EXAMPLES.filter(e => e.category === 'CFG Equivalences').map(ex => (
            <option key={ex.id} value={ex.id}>
              {ex.title}
            </option>
          ))}
        </optgroup>
        <optgroup label="Parametric Languages">
          {BUILT_IN_EXAMPLES.filter(e => e.category === 'Language Patterns').map(ex => (
            <option key={ex.id} value={ex.id}>
              {ex.title}
            </option>
          ))}
        </optgroup>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-muted">
        <ChevronDown className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};
