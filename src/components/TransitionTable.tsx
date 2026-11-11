import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { PDA, Transition, formatPush, getTransitionType } from '../core/pda';
import { groupTransitions, formatTransitionDeltaLatex } from '../core/format';
import { MathView } from './MathView';

interface TransitionTableProps {
  pda: PDA;
  activeTransition?: Transition;
}

export const TransitionTable: React.FC<TransitionTableProps> = ({ pda, activeTransition }) => {
  const [copied, setCopied] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'PUSH' | 'POP' | 'NO_OP'>('ALL');

  const grouped = groupTransitions(pda.transitions);

  const handleCopyAllLatex = () => {
    const lines = pda.transitions.map(t => formatTransitionDeltaLatex(t));
    navigator.clipboard.writeText(`\\begin{aligned}\n${lines.join(' \\\\\n')}\n\\end{aligned}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const isTransitionActive = (t: Transition) => {
    if (!activeTransition) return false;
    return (
      t.from === activeTransition.from &&
      t.input === activeTransition.input &&
      t.pop === activeTransition.pop &&
      t.to === activeTransition.to &&
      formatPush(t.push) === formatPush(activeTransition.push)
    );
  };

  const visibleTransitions =
    filterType === 'ALL'
      ? pda.transitions
      : filterType === 'PUSH'
      ? grouped.push
      : filterType === 'POP'
      ? grouped.pop
      : grouped.noOp;

  return (
    <div className="flex flex-col bg-paper p-4 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-rule">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <h3 className="font-body font-medium text-xs text-ink">
            Transition Function (δ)
          </h3>
          <span className="text-[11px] font-body px-1.5 py-0.5 rounded-xs border border-rule bg-paper-2 text-muted">
            <span className="font-mono tabular-nums text-ink">{pda.transitions.length}</span> total
          </span>
        </div>

        {/* Filter Segment & Copy */}
        <div className="flex items-center gap-2 font-body text-xs">
          <div className="inline-flex rounded-md border border-rule bg-paper-3 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-2 py-0.5 rounded transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus ${
                filterType === 'ALL'
                  ? 'bg-paper text-ink font-semibold border border-rule shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              All ({pda.transitions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('PUSH')}
              className={`px-2 py-0.5 rounded transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus ${
                filterType === 'PUSH'
                  ? 'bg-paper text-ink font-semibold border border-rule shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Push ({grouped.push.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('POP')}
              className={`px-2 py-0.5 rounded transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus ${
                filterType === 'POP'
                  ? 'bg-paper text-ink font-semibold border border-rule shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Pop ({grouped.pop.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('NO_OP')}
              className={`px-2 py-0.5 rounded transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus ${
                filterType === 'NO_OP'
                  ? 'bg-paper text-ink font-semibold border border-rule shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Neutral ({grouped.noOp.length})
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyAllLatex}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs border border-rule hover:border-muted text-ink transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted" />}
            <span>Copy δ</span>
          </button>
        </div>
      </div>

      {/* Transition Ledger Table */}
      <div className="rounded-md border border-rule overflow-hidden max-h-[380px] overflow-y-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-paper-2 sticky top-0 z-10 border-b border-rule font-body text-xs text-muted">
            <tr>
              <th className="py-2 px-3 w-10 font-medium">#</th>
              <th className="py-2 px-3 w-20 font-medium">Type</th>
              <th className="py-2 px-3 font-medium">State</th>
              <th className="py-2 px-3 font-medium">Input</th>
              <th className="py-2 px-3 font-medium">Pop</th>
              <th className="py-2 px-3 font-medium">Next state</th>
              <th className="py-2 px-3 font-medium">Push</th>
              <th className="py-2 px-3 font-medium">Formula δ(q, a, X)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {visibleTransitions.map((t, idx) => {
              const isActive = isTransitionActive(t);
              const type = getTransitionType(t);
              const deltaLatex = formatTransitionDeltaLatex(t);
              const pushStr = formatPush(t.push);

              return (
                <tr
                  key={`tr_${idx}_${t.from}_${t.input}_${t.pop}`}
                  className={`transition-colors duration-150 ${
                    isActive
                      ? 'bg-paper-3 font-semibold text-ink border-l-2 border-accent'
                      : 'hover:bg-paper-2 text-ink-2'
                  }`}
                >
                  <td className="py-2 px-3 text-muted tabular-nums">
                    {String(idx + 1).padStart(2, '0')}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`text-xs font-body font-medium ${
                        type === 'PUSH'
                          ? 'text-accent-2 font-semibold'
                          : type === 'POP'
                          ? 'text-error font-semibold'
                          : 'text-muted'
                      }`}
                    >
                      {type === 'PUSH' ? '↑ push' : type === 'POP' ? '↓ pop' : 'neutral'}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono font-medium text-ink">
                    {t.from}
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.5 rounded-xs border border-rule bg-paper font-mono text-ink">
                      {t.input}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.5 rounded-xs border border-rule bg-paper font-mono text-ink">
                      {t.pop}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono font-medium text-ink">
                    {t.to}
                  </td>
                  <td className="py-2 px-3">
                    <span className="font-mono text-ink">
                      {pushStr}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-serif text-xs text-ink">
                    <MathView math={deltaLatex} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
