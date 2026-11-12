import React, { useState } from 'react';
import { Copy, Check, FileText } from 'lucide-react';
import { SimulationStep, formatPush } from '../core/pda';
import { formatConfigText, formatTraceChainLatex, formatTraceChainText } from '../core/format';

interface TraceViewProps {
  steps: SimulationStep[];
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
  accepted?: boolean;
}

export const TraceView: React.FC<TraceViewProps> = ({
  steps,
  currentStepIndex,
  onSelectStep,
  accepted = false,
}) => {
  const [copiedType, setCopiedType] = useState<'latex' | 'text' | null>(null);

  const handleCopyLatex = () => {
    const latex = formatTraceChainLatex(steps);
    navigator.clipboard.writeText(`$${latex}$`);
    setCopiedType('latex');
    setTimeout(() => setCopiedType(null), 1800);
  };

  const handleCopyText = () => {
    const text = formatTraceChainText(steps);
    navigator.clipboard.writeText(text);
    setCopiedType('text');
    setTimeout(() => setCopiedType(null), 1800);
  };

  return (
    <div className="flex flex-col bg-paper p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-rule">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <h3 className="text-xs font-body font-medium text-ink">
            Execution Trace
          </h3>
          <span className="text-[11px] font-body px-1.5 py-0.5 rounded-xs border border-rule bg-paper-2 text-muted">
            <span className="font-mono tabular-nums text-ink">{steps.length}</span> {steps.length === 1 ? 'configuration' : 'configurations'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-body">
          <button
            type="button"
            onClick={handleCopyLatex}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-rule hover:border-muted text-ink transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus"
            title="Copy LaTeX ID derivation"
          >
            {copiedType === 'latex' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted" />}
            <span>Copy LaTeX</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-rule hover:border-muted text-ink transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus"
            title="Copy plain text ID derivation"
          >
            {copiedType === 'text' ? <Check className="w-3.5 h-3.5 text-success" /> : <FileText className="w-3.5 h-3.5 text-muted" />}
            <span>Text</span>
          </button>
        </div>
      </div>

      {/* Horizontal Derivation Strip */}
      <div className="p-2.5 mb-3 rounded-md border border-rule bg-paper-3 overflow-x-auto">
        <div className="text-xs font-body text-muted mb-1.5">
          Derivation sequence (click configuration to inspect):
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs whitespace-nowrap py-0.5">
          {steps.map((step, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isLast = idx === steps.length - 1;
            const configText = formatConfigText(step.config);

            return (
              <React.Fragment key={`chain_${idx}`}>
                <button
                  type="button"
                  onClick={() => onSelectStep(idx)}
                  className={`px-2 py-0.5 rounded border transition-colors duration-150 text-xs font-mono cursor-pointer focus-visible:outline-2 focus-visible:outline-focus ${isCurrent
                      ? 'bg-accent text-accent-ink border-accent font-bold'
                      : 'border-rule bg-paper hover:border-muted text-ink'
                    }`}
                  title={`Jump to step ${idx}`}
                >
                  {configText}
                </button>
                {!isLast && (
                  <span className="text-muted font-bold px-0.5 select-none">⊢</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Dense Execution Table */}
      <div className="overflow-x-auto max-h-[300px] overflow-y-auto rounded-md border border-rule">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-paper-2 sticky top-0 z-10 border-b border-rule text-xs font-body text-muted">
            <tr>
              <th className="py-2 px-3 w-12 font-medium">#</th>
              <th className="py-2 px-3 font-medium">State</th>
              <th className="py-2 px-3 font-medium">Remaining input</th>
              <th className="py-2 px-3 font-medium">Stack</th>
              <th className="py-2 px-3 font-medium">Applied δ</th>
              <th className="py-2 px-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {steps.map((step, idx) => {
              const isCurrent = idx === currentStepIndex;
              const t = step.transitionUsed;
              const isLast = idx === steps.length - 1;

              return (
                <tr
                  key={`step_row_${idx}`}
                  onClick={() => onSelectStep(idx)}
                  className={`cursor-pointer transition-colors duration-150 ${isCurrent
                      ? 'bg-paper-3 font-semibold text-ink border-l-2 border-accent'
                      : 'hover:bg-paper-2 text-ink-2'
                    }`}
                >
                  <td className="py-2 px-3 text-muted tabular-nums">
                    {String(idx).padStart(2, '0')}
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.5 rounded-xs border border-rule bg-paper font-mono font-medium text-ink">
                      {step.config.state}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    {step.config.remaining === '' ? (
                      <span className="text-muted italic">ε (empty)</span>
                    ) : (
                      <span className="text-accent font-mono font-bold">
                        {step.config.remaining}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 font-mono font-medium text-ink">
                    {step.config.stack.length === 0 ? 'ε' : step.config.stack.join('')}
                  </td>
                  <td className="py-2 px-3 text-muted">
                    {t ? (
                      <span className="px-1.5 py-0.5 rounded-xs border border-rule bg-paper font-mono text-[11px] text-ink">
                        δ({t.from}, {t.input}, {t.pop}) = ({t.to}, {formatPush(t.push)})
                      </span>
                    ) : (
                      <span className="text-muted italic">Start</span>
                    )}
                  </td>
                  <td className="py-2 px-3 font-body text-xs text-ink-2">
                    {isLast && accepted ? (
                      <span className="font-semibold text-success">
                        Accepted
                      </span>
                    ) : step.description || '-'}
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
