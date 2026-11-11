/**
 * Converts a Context-Free Grammar (CFG) to an equivalent Pushdown Automaton (PDA).
 * Implements the standard textbook construction (Hopcroft & Ullman / Sipser / Linz):
 * - States: qs (start), q (loop/expansion state), q_f (final state)
 * - Push start variable S over Z0: δ(qs, ε, Z0) = {(q, SZ0)}
 * - For each production A -> α: δ(q, ε, A) = {(q, α)}
 * - For each terminal a: δ(q, a, a) = {(q, ε)}
 * - Acceptance: δ(q, ε, Z0) = {(q_f, Z0)} (or pop Z0 for empty stack acceptance)
 */

import { PDA, Transition, AcceptanceMode, isPDA_NonDeterministic } from './pda';
import { CFG } from './cfgParser';

export interface CFGConversionResult {
  pda: PDA;
  isNondeterministic: boolean;
  warnings: string[];
}

/**
 * Converts a parsed CFG into a PDA.
 */
export function convertCFGToPDA(
  cfg: CFG,
  acceptBy: AcceptanceMode = 'finalState'
): CFGConversionResult {
  const transitions: Transition[] = [];
  const startVar = cfg.startVariable;
  const startStack = 'Z0';

  const states = ['qs', 'q'];
  if (acceptBy === 'finalState') {
    states.push('q_f');
  }

  // 1. Initial transition: push start variable over Z0
  transitions.push({
    from: 'qs',
    input: 'ε',
    pop: startStack,
    to: 'q',
    push: [startVar, startStack],
  });

  // 2. Production transitions: for each A -> α, add δ(q, ε, A) = (q, α)
  for (const prod of cfg.productions) {
    transitions.push({
      from: 'q',
      input: 'ε',
      pop: prod.lhs,
      to: 'q',
      push: prod.rhs, // prod.rhs is string[], [] if ε
    });
  }

  // 3. Terminal matching transitions: for each terminal a, add δ(q, a, a) = (q, ε)
  for (const term of cfg.terminals) {
    transitions.push({
      from: 'q',
      input: term,
      pop: term,
      to: 'q',
      push: [],
    });
  }

  // 4. Acceptance transition
  if (acceptBy === 'finalState') {
    transitions.push({
      from: 'q',
      input: 'ε',
      pop: startStack,
      to: 'q_f',
      push: [startStack],
    });
  } else {
    // Empty stack: pop Z0
    transitions.push({
      from: 'q',
      input: 'ε',
      pop: startStack,
      to: 'q',
      push: [],
    });
  }

  // Stack alphabet consists of all variables, terminals, and start stack Z0
  const stackAlphabetSet = new Set<string>();
  stackAlphabetSet.add(startStack);
  for (const v of cfg.variables) stackAlphabetSet.add(v);
  for (const t of cfg.terminals) stackAlphabetSet.add(t);

  const pda: PDA = {
    name: `PDA for CFG (${cfg.productions.length} productions)`,
    description: `Constructed from grammar with start variable '${startVar}'. Non-terminals are expanded on ε-transitions; terminals are matched and popped.`,
    states,
    inputAlphabet: cfg.terminals,
    stackAlphabet: Array.from(stackAlphabetSet),
    transitions,
    start: 'qs',
    startStack,
    finals: acceptBy === 'finalState' ? ['q_f'] : [],
    acceptBy,
  };

  const ndCheck = isPDA_NonDeterministic(pda);
  const warnings: string[] = [];

  if (ndCheck.isNondeterministic) {
    warnings.push(
      'Warning: This PDA is non-deterministic (NPDA). Standard CFG-to-PDA conversion naturally creates non-deterministic ε-expansions when non-terminals have multiple production choices.'
    );
  }

  return {
    pda,
    isNondeterministic: ndCheck.isNondeterministic,
    warnings,
  };
}
