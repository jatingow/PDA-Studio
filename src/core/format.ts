/**
 * Formatting utilities for Pushdown Automata:
 * - 7-tuple formal definition P = (Q, Σ, Γ, δ, q0, Z0, F) in LaTeX and plain text
 * - δ transition function definitions, grouped by PUSH, POP, and NO-CHANGE
 * - Instantaneous Description (ID) traces: (q, w, α) ⊢ ... in LaTeX and plain text
 */

import { PDA, Transition, Config, SimulationStep, getTransitionType, formatPush } from './pda';

/**
 * Formats a single state name for LaTeX math mode.
 * e.g. "q0" -> "q_{0}", "qs" -> "q_{s}", "q_f" -> "q_{f}"
 */
export function formatLatexState(state: string): string {
  if (state.length > 1 && /^([a-zA-Z])([0-9a-zA-Z_]+)$/.test(state)) {
    const match = state.match(/^([a-zA-Z])([0-9a-zA-Z_]+)$/);
    if (match) {
      const base = match[1];
      const sub = match[2].replace(/_/g, '');
      return `${base}_{${sub}}`;
    }
  }
  return state;
}

/**
 * Formats a stack symbol or string of stack symbols for LaTeX.
 * e.g. "Z0" -> "Z_0", "aZ0" -> "aZ_0"
 */
export function formatLatexStack(stackStr: string): string {
  if (stackStr === 'ε' || stackStr === '') return '\\varepsilon';
  return stackStr.replace(/Z0/g, 'Z_{0}');
}

/**
 * Formats the 7-tuple definition of a PDA as LaTeX.
 */
export function formatTupleLatex(pda: PDA): string {
  const Q = `\\{ ${pda.states.map(formatLatexState).join(', ')} \\}`;
  const Sigma = `\\{ ${pda.inputAlphabet.join(', ')} \\}`;
  const Gamma = `\\{ ${pda.stackAlphabet.map(formatLatexStack).join(', ')} \\}`;
  const q0 = formatLatexState(pda.start);
  const Z0 = formatLatexStack(pda.startStack);
  const F = pda.acceptBy === 'finalState'
    ? `\\{ ${pda.finals.map(formatLatexState).join(', ')} \\}`
    : '\\emptyset \\text{ (Accept by empty stack)}';

  return `P = (Q, \\Sigma, \\Gamma, \\delta, ${q0}, ${Z0}, F) \\\\\n` +
    `\\text{where:} \\\\\n` +
    `Q = ${Q} \\\\\n` +
    `\\Sigma = ${Sigma} \\\\\n` +
    `\\Gamma = ${Gamma} \\\\\n` +
    `q_0 = ${q0} \\\\\n` +
    `Z_0 = ${Z0} \\\\\n` +
    `F = ${F}`;
}

/**
 * Formats the 7-tuple definition of a PDA as plain text.
 */
export function formatTupleText(pda: PDA): string {
  const Q = `{${pda.states.join(', ')}}`;
  const Sigma = `{${pda.inputAlphabet.join(', ')}}`;
  const Gamma = `{${pda.stackAlphabet.join(', ')}}`;
  const F = pda.acceptBy === 'finalState' ? `{${pda.finals.join(', ')}}` : '∅ (Accept by empty stack)';

  return `P = (Q, Σ, Γ, δ, ${pda.start}, ${pda.startStack}, F)\n` +
    `  Q = ${Q}\n` +
    `  Σ = ${Sigma}\n` +
    `  Γ = ${Gamma}\n` +
    `  Start state: ${pda.start}\n` +
    `  Start stack symbol: ${pda.startStack}\n` +
    `  Acceptance: ${pda.acceptBy === 'finalState' ? `Final states F = ${F}` : 'Empty stack (N(P))'}`;
}

export interface GroupedTransitions {
  push: Transition[];
  pop: Transition[];
  noOp: Transition[];
}

/**
 * Groups transitions into PUSH, POP, and NO_OP / NEUTRAL sets.
 */
export function groupTransitions(transitions: Transition[]): GroupedTransitions {
  const res: GroupedTransitions = { push: [], pop: [], noOp: [] };
  for (const t of transitions) {
    const type = getTransitionType(t);
    if (type === 'PUSH') res.push.push(t);
    else if (type === 'POP') res.pop.push(t);
    else res.noOp.push(t);
  }
  return res;
}

/**
 * Formats a transition into textbook delta notation.
 * e.g. δ(q0, a, Z0) = {(q0, aZ0)}
 */
export function formatTransitionDeltaText(t: Transition): string {
  const pushStr = formatPush(t.push);
  return `δ(${t.from}, ${t.input}, ${t.pop}) = {(${t.to}, ${pushStr})}`;
}

/**
 * Formats a transition into textbook delta LaTeX notation.
 * e.g. \delta(q_0, a, Z_0) = \{(q_0, aZ_0)\}
 */
export function formatTransitionDeltaLatex(t: Transition): string {
  const from = formatLatexState(t.from);
  const to = formatLatexState(t.to);
  const inp = t.input === 'ε' ? '\\varepsilon' : t.input;
  const pop = t.pop === 'ε' ? '\\varepsilon' : formatLatexStack(t.pop);
  const push = t.push.length === 0 ? '\\varepsilon' : formatLatexStack(formatPush(t.push));

  return `\\delta(${from}, ${inp}, ${pop}) = \\{(${to}, ${push})\\}`;
}

/**
 * Formats a single configuration into Instantaneous Description (ID) string.
 * (q, w, α) where stack top is on the left.
 */
export function formatConfigText(config: Config): string {
  const rem = config.remaining === '' ? 'ε' : config.remaining;
  const stk = config.stack.length === 0 ? 'ε' : config.stack.join('');
  return `(${config.state}, ${rem}, ${stk})`;
}

/**
 * Formats a single configuration into Instantaneous Description (ID) LaTeX string.
 */
export function formatConfigLatex(config: Config): string {
  const q = formatLatexState(config.state);
  const rem = config.remaining === '' ? '\\varepsilon' : config.remaining;
  const stk = config.stack.length === 0 ? '\\varepsilon' : formatLatexStack(config.stack.join(''));
  return `(${q}, ${rem}, ${stk})`;
}

/**
 * Formats a complete sequence of steps into a full ID derivation chain.
 * e.g. (qs, aab, Z0) ⊢ (q0, ab, aZ0) ⊢ (q1, ε, Z0) ⊢ (q2, ε, Z0)
 */
export function formatTraceChainText(path: SimulationStep[]): string {
  if (path.length === 0) return '';
  return path.map(s => formatConfigText(s.config)).join(' ⊢ ');
}

/**
 * Formats a complete sequence of steps into a LaTeX ID derivation.
 */
export function formatTraceChainLatex(path: SimulationStep[]): string {
  if (path.length === 0) return '';
  return path.map(s => formatConfigLatex(s.config)).join(' \\vdash ');
}
