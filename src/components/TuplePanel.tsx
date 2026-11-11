import React, { useState } from 'react';
import { Copy, Check, FileText } from 'lucide-react';
import { PDA } from '../core/pda';
import { formatTupleLatex, formatTupleText, formatLatexState, formatLatexStack } from '../core/format';
import { MathView } from './MathView';

interface TuplePanelProps {
  pda: PDA;
}

export const TuplePanel: React.FC<TuplePanelProps> = ({ pda }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopyLatex = () => {
    const latex = formatTupleLatex(pda);
    navigator.clipboard.writeText(`$$\n${latex}\n$$`);
    setCopied('latex');
    setTimeout(() => setCopied(null), 1800);
  };

  const handleCopyText = () => {
    const text = formatTupleText(pda);
    navigator.clipboard.writeText(text);
    setCopied('text');
    setTimeout(() => setCopied(null), 1800);
  };

  const q0Latex = formatLatexState(pda.start);
  const z0Latex = formatLatexStack(pda.startStack);
  const tupleFormula = `P = (Q, \\Sigma, \\Gamma, \\delta, ${q0Latex}, ${z0Latex}, F)`;

  const specRows = [
    {
      symbol: 'Q',
      name: 'States',
      value: `\\{ ${pda.states.map(formatLatexState).join(', ')} \\}`,
      description: `${pda.states.length} finite control states`,
    },
    {
      symbol: '\\Sigma',
      name: 'Input alphabet',
      value: `\\{ ${pda.inputAlphabet.join(', ')} \\}`,
      description: 'Input alphabet consumed during execution',
    },
    {
      symbol: '\\Gamma',
      name: 'Stack alphabet',
      value: `\\{ ${pda.stackAlphabet.map(formatLatexStack).join(', ')} \\}`,
      description: 'Finite set of pushdown memory symbols',
    },
    {
      symbol: 'q_0',
      name: 'Start state',
      value: q0Latex,
      description: 'Initial state before consuming input',
    },
    {
      symbol: 'Z_0',
      name: 'Start stack symbol',
      value: z0Latex,
      description: 'Initial bottom-of-stack marker symbol',
    },
    {
      symbol: 'F',
      name: 'Acceptance criterion',
      value: pda.acceptBy === 'finalState'
        ? `\\{ ${pda.finals.map(formatLatexState).join(', ')} \\}`
        : '\\text{Empty Stack: } N(P)',
      description: pda.acceptBy === 'finalState'
        ? 'Accepted if entire input is consumed and state ∈ F'
        : 'Accepted if entire input is consumed and stack is empty',
    },
  ];

  return (
    <div className="flex flex-col bg-paper p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-rule">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <h3 className="font-body font-medium text-xs text-ink">
            Automaton Specification (7-Tuple)
          </h3>
        </div>

        <div className="flex items-center gap-1.5 font-body">
          <button
            type="button"
            onClick={handleCopyLatex}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs border border-rule hover:border-muted text-ink transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus"
            title="Copy LaTeX tuple definition"
          >
            {copied === 'latex' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted" />}
            <span>Copy LaTeX</span>
          </button>
          <button
            type="button"
            onClick={handleCopyText}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs border border-rule hover:border-muted text-ink transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus"
            title="Copy plain text definition"
          >
            {copied === 'text' ? <Check className="w-3.5 h-3.5 text-success" /> : <FileText className="w-3.5 h-3.5 text-muted" />}
            <span>Text</span>
          </button>
        </div>
      </div>

      {/* Prominent Formal Equation */}
      <div className="py-3 px-4 mb-4 rounded-md border border-rule text-center bg-paper-3">
        <div className="text-base font-serif text-ink">
          <MathView math={tupleFormula} block />
        </div>
      </div>

      {/* Structured Ledger Specification */}
      <div className="rounded-md border border-rule overflow-hidden">
        <table className="w-full text-left text-xs font-body">
          <thead className="bg-paper-2 border-b border-rule text-xs text-muted">
            <tr>
              <th className="py-2 px-3 w-16 font-medium">Tuple</th>
              <th className="py-2 px-3 w-40 font-medium">Formal name</th>
              <th className="py-2 px-3 font-medium">Mathematical value</th>
              <th className="py-2 px-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {specRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-paper-2 transition-colors duration-150">
                <td className="py-2.5 px-3 font-serif font-bold text-sm text-ink">
                  <MathView math={row.symbol} />
                </td>
                <td className="py-2.5 px-3 font-medium text-ink font-body">
                  {row.name}
                </td>
                <td className="py-2.5 px-3 font-mono font-medium text-ink">
                  <MathView math={row.value} />
                </td>
                <td className="py-2.5 px-3 text-muted font-body text-xs">
                  {row.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
