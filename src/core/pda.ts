/**
 * Core type definitions for Pushdown Automata (PDA).
 * Pure TypeScript with no external or React dependencies.
 */

export type AcceptanceMode = 'finalState' | 'emptyStack';

export interface Transition {
  id?: string;
  from: string;
  input: string | 'ε';
  pop: string | 'ε';
  to: string;
  push: string[]; // push[0] is the new top of stack. Empty array or ['ε'] means nothing is pushed.
}

export interface PDA {
  states: string[];
  inputAlphabet: string[];
  stackAlphabet: string[];
  transitions: Transition[];
  start: string;
  startStack: string; // default "Z0"
  finals: string[];
  acceptBy: AcceptanceMode;
  name?: string;
  description?: string;
}

export interface Config {
  state: string;
  remaining: string;
  stack: string[]; // stack[0] is the top of the stack
}

export interface SimulationStep {
  config: Config;
  transitionUsed?: Transition;
  stepNumber: number;
  description?: string;
}

export interface SimulationResult {
  accepted: boolean;
  acceptingPath: SimulationStep[];
  totalStepsExplored: number;
  reason: string;
  allBranches?: SimulationStep[][];
}

export type TransitionType = 'PUSH' | 'POP' | 'NO_OP';

/**
 * Determines whether a transition pushes, pops, or leaves stack size unchanged.
 *
 * Net change in stack size:
 * - If pop is not 'ε', 1 symbol is removed (-1).
 * - Number of symbols pushed is filtered (excluding 'ε' and empty strings).
 * - Net = pushed - popped.
 */
export function getTransitionType(t: Transition): TransitionType {
  const popCount = t.pop === 'ε' || t.pop === '' ? 0 : 1;
  const pushCount = t.push.filter(s => s !== 'ε' && s !== '').length;
  const diff = pushCount - popCount;

  if (diff > 0) return 'PUSH';
  if (diff < 0) return 'POP';
  return 'NO_OP';
}

/**
 * Normalizes push symbols by removing ε or empty items.
 */
export function cleanPushSymbols(push: string[]): string[] {
  return push.filter(s => s !== 'ε' && s !== '');
}

/**
 * Formats a transition push array into a string representation for diagrams and tables.
 * e.g. ['a', 'Z0'] -> "aZ0", [] -> "ε"
 */
export function formatPush(push: string[]): string {
  const cleaned = cleanPushSymbols(push);
  return cleaned.length === 0 ? 'ε' : cleaned.join('');
}

/**
 * Returns a stable unique ID for a transition.
 */
export function getTransitionId(t: Transition, index?: number): string {
  if (t.id) return t.id;
  const pushStr = formatPush(t.push);
  const idxStr = index !== undefined ? `_${index}` : '';
  return `${t.from}_${t.input}_${t.pop}__${t.to}_${pushStr}${idxStr}`;
}

/**
 * Checks if a PDA is non-deterministic (NPDA).
 * A PDA is non-deterministic if:
 * 1. From some state and stack top, there are multiple transitions on the same input symbol (including ε).
 * 2. Or, there exists an ε-transition while an input transition is also defined for the same state and stack top.
 */
export function isPDA_NonDeterministic(pda: PDA): { isNondeterministic: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Group transitions by (state, pop)
  for (const q of pda.states) {
    for (const pop of [...pda.stackAlphabet, 'ε']) {
      const ts = pda.transitions.filter(t => t.from === q && (t.pop === pop || t.pop === 'ε'));
      if (ts.length === 0) continue;

      // Group by input symbol
      const byInput = new Map<string, Transition[]>();
      for (const t of ts) {
        const inp = t.input;
        if (!byInput.has(inp)) byInput.set(inp, []);
        byInput.get(inp)!.push(t);
      }

      // Check condition 1: multiple transitions for same input
      for (const [inp, list] of byInput.entries()) {
        if (list.length > 1) {
          reasons.push(
            `State '${q}' with stack top '${pop}' has ${list.length} different transitions on input '${inp}'`
          );
        }
      }

      // Check condition 2: has epsilon transition AND another input transition
      if (byInput.has('ε') && byInput.size > 1) {
        const otherInputs = Array.from(byInput.keys()).filter(k => k !== 'ε');
        reasons.push(
          `State '${q}' with stack top '${pop}' has an ε-transition and input transition(s) for '${otherInputs.join(', ')}'`
        );
      }
    }
  }

  return {
    isNondeterministic: reasons.length > 0,
    reasons,
  };
}
