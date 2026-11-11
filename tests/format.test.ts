import { describe, it, expect } from 'vitest';
import { PDA } from '../src/core/pda';
import {
  formatTupleLatex,
  formatTupleText,
  formatTransitionDeltaText,
  formatTransitionDeltaLatex,
  groupTransitions,
  formatTraceChainText,
  formatTraceChainLatex,
} from '../src/core/format';
import { simulatePDA } from '../src/core/simulate';

describe('Formatters (LaTeX & Textbook Notation)', () => {
  const pda: PDA = {
    states: ['qs', 'q0', 'q1', 'q2'],
    inputAlphabet: ['a', 'b'],
    stackAlphabet: ['a', 'Z0'],
    start: 'qs',
    startStack: 'Z0',
    finals: ['q2'],
    acceptBy: 'finalState',
    transitions: [
      { from: 'qs', input: 'a', pop: 'Z0', to: 'q0', push: ['a', 'Z0'] },
      { from: 'q0', input: 'a', pop: 'a', to: 'q0', push: ['a', 'a'] },
      { from: 'q0', input: 'b', pop: 'a', to: 'q1', push: [] },
      { from: 'q1', input: 'ε', pop: 'a', to: 'q0', push: [] },
      { from: 'q0', input: 'ε', pop: 'Z0', to: 'q2', push: ['Z0'] },
    ],
  };

  it('formats 7-tuple definition in LaTeX and text', () => {
    const latex = formatTupleLatex(pda);
    expect(latex).toContain('P = (Q, \\Sigma, \\Gamma, \\delta');
    expect(latex).toContain('q_{s}');
    expect(latex).toContain('Z_{0}');

    const text = formatTupleText(pda);
    expect(text).toContain('P = (Q, Σ, Γ, δ, qs, Z0, F)');
  });

  it('groups transitions into PUSH, POP, NO_OP', () => {
    const grouped = groupTransitions(pda.transitions);
    expect(grouped.push.length).toBe(2); // qs->q0 push aZ0 over Z0 (net +1), q0->q0 push aa over a (net +1)
    expect(grouped.pop.length).toBe(2);  // q0->q1 pop a push [] (net -1), q1->q0 pop a push [] (net -1)
    expect(grouped.noOp.length).toBe(1); // q0->q2 pop Z0 push Z0 (net 0)
  });

  it('formats transition delta text and LaTeX', () => {
    const t = pda.transitions[0];
    expect(formatTransitionDeltaText(t)).toBe('δ(qs, a, Z0) = {(q0, aZ0)}');
    expect(formatTransitionDeltaLatex(t)).toContain('\\delta(q_{s}, a, Z_{0}) = \\{(q_{0}, aZ_{0})\\}');
  });

  it('formats ID trace chain in text and LaTeX', () => {
    const sim = simulatePDA(pda, 'aab');
    expect(sim.accepted).toBe(true);

    const traceText = formatTraceChainText(sim.acceptingPath);
    expect(traceText).toContain('(qs, aab, Z0) ⊢');
    expect(traceText).toContain('(q2, ε, Z0)');

    const traceLatex = formatTraceChainLatex(sim.acceptingPath);
    expect(traceLatex).toContain('\\vdash');
    expect(traceLatex).toContain('q_{2}');
  });
});
