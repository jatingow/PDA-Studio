/**
 * PDA Templates Generator for Context-Free Languages.
 * Produces clean, minimal, textbook-standard PDAs.
 */

import { PDA, Transition } from './pda';
import { ParsedLanguage } from './langParser';

/**
 * Helper to build an array of push symbols for pushing k copies of `sym` over stack top `top`.
 * e.g. k=2, sym='a', top='Z0' -> ['a', 'a', 'Z0']
 */
function makePush(count: number, sym: string, top?: string): string[] {
  const arr: string[] = [];
  for (let i = 0; i < count; i++) {
    arr.push(sym);
  }
  if (top) {
    arr.push(top);
  }
  return arr;
}

/**
 * 1. a^(p*n) b^(q*n)
 * e.g., a^n b^n (p=1, q=1), a^2n b^n (p=2, q=1), a^n b^2n (p=1, q=2)
 *
 * Construction:
 * - Start state qs.
 * - For n >= 1, qs requires reading an 'a' to enter qa, rejecting the empty string.
 * - In state qa, read all 'a's, pushing q stack symbols per 'a'.
 * - When first 'b' is encountered, transition to b-reading state qb (via intermediate pop states if p > 1).
 * - In state qb, each 'b' pops p stack symbols. 'a' cannot be read in qb, preventing interleaving.
 * - When stack returns to Z0 and input ends, transition to final state qf.
 */
export function createAnBnGeneralized(
  p: number,
  q: number,
  minN: number = 1,
  sym1: string = 'a',
  sym2: string = 'b'
): PDA {
  const stackSym = sym1;
  const transitions: Transition[] = [];
  const states = ['qs', 'qa', 'qb'];

  // Intermediate states for multi-pop when p > 1
  for (let k = 1; k < p; k++) {
    states.push(`q_pop${k}`);
  }
  states.push('qf');

  // Push q symbols per sym1
  const pushOnFirstA = makePush(q, stackSym, 'Z0');
  const pushOnLoopA = makePush(q + 1, stackSym); // replaces 1 stackSym with (q+1), so net +q

  // First sym1 from qs -> qa
  transitions.push({
    from: 'qs',
    input: sym1,
    pop: 'Z0',
    to: 'qa',
    push: pushOnFirstA,
  });

  // Loop reading sym1 in qa
  transitions.push({
    from: 'qa',
    input: sym1,
    pop: stackSym,
    to: 'qa',
    push: pushOnLoopA,
  });

  // Reading sym2 and popping p symbols:
  if (p === 1) {
    // Transition from qa to qb on first sym2
    transitions.push({
      from: 'qa',
      input: sym2,
      pop: stackSym,
      to: 'qb',
      push: [],
    });

    // Loop reading sym2 in qb
    transitions.push({
      from: 'qb',
      input: sym2,
      pop: stackSym,
      to: 'qb',
      push: [],
    });
  } else {
    // First sym2 from qa -> q_pop1
    transitions.push({
      from: 'qa',
      input: sym2,
      pop: stackSym,
      to: 'q_pop1',
      push: [],
    });

    // Loop sym2 from qb -> q_pop1
    transitions.push({
      from: 'qb',
      input: sym2,
      pop: stackSym,
      to: 'q_pop1',
      push: [],
    });

    // Intermediate ε-pops
    for (let k = 1; k < p - 1; k++) {
      transitions.push({
        from: `q_pop${k}`,
        input: 'ε',
        pop: stackSym,
        to: `q_pop${k + 1}`,
        push: [],
      });
    }

    // Final pop returns to qb
    transitions.push({
      from: `q_pop${p - 1}`,
      input: 'ε',
      pop: stackSym,
      to: 'qb',
      push: [],
    });
  }

  // Acceptance transition when Z0 is reached from qb
  transitions.push({
    from: 'qb',
    input: 'ε',
    pop: 'Z0',
    to: 'qf',
    push: ['Z0'],
  });

  // If minN === 0, allow empty string
  if (minN === 0) {
    transitions.push({
      from: 'qs',
      input: 'ε',
      pop: 'Z0',
      to: 'qf',
      push: ['Z0'],
    });
  }

  const pStr = p === 1 ? '' : p.toString();
  const qStr = q === 1 ? '' : q.toString();

  return {
    name: `L = { ${sym1}^(${pStr}n) ${sym2}^(${qStr}n) | n >= ${minN} }`,
    description: `Deterministic PDA pushing ${q} symbol${q > 1 ? 's' : ''} per '${sym1}' and popping ${p} symbol${p > 1 ? 's' : ''} per '${sym2}'.`,
    states,
    inputAlphabet: [sym1, sym2],
    stackAlphabet: [stackSym, 'Z0'],
    transitions,
    start: 'qs',
    startStack: 'Z0',
    finals: ['qf'],
    acceptBy: 'finalState',
  };
}

/**
 * 2. a^n b^m c^(n+m) (n, m >= 1 or >= 0)
 */
export function createAnBmCnpm(
  minN: number = 1,
  minM: number = 1,
  sym1: string = 'a',
  sym2: string = 'b',
  sym3: string = 'c'
): PDA {
  const states = ['qs', 'qa', 'qb', 'qc', 'qf'];
  const transitions: Transition[] = [];

  // Start logic
  if (minN >= 1) {
    transitions.push({ from: 'qs', input: sym1, pop: 'Z0', to: 'qa', push: ['A', 'Z0'] });
  } else {
    transitions.push({ from: 'qs', input: 'ε', pop: 'Z0', to: 'qa', push: ['Z0'] });
  }

  // qa: read sym1, push A
  transitions.push({ from: 'qa', input: sym1, pop: 'A', to: 'qa', push: ['A', 'A'] });

  // Move to qb
  if (minM >= 1) {
    transitions.push({ from: 'qa', input: sym2, pop: 'A', to: 'qb', push: ['B', 'A'] });
    if (minN === 0) {
      transitions.push({ from: 'qa', input: sym2, pop: 'Z0', to: 'qb', push: ['B', 'Z0'] });
    }
  } else {
    transitions.push({ from: 'qa', input: 'ε', pop: 'A', to: 'qb', push: ['A'] });
    transitions.push({ from: 'qa', input: 'ε', pop: 'Z0', to: 'qb', push: ['Z0'] });
  }

  // qb: read sym2, push B
  transitions.push({ from: 'qb', input: sym2, pop: 'B', to: 'qb', push: ['B', 'B'] });

  // Move to qc: read sym3, pop B (or pop A if no B)
  transitions.push({ from: 'qb', input: sym3, pop: 'B', to: 'qc', push: [] });
  transitions.push({ from: 'qb', input: sym3, pop: 'A', to: 'qc', push: [] });

  // qc: read sym3, pop B then A
  transitions.push({ from: 'qc', input: sym3, pop: 'B', to: 'qc', push: [] });
  transitions.push({ from: 'qc', input: sym3, pop: 'A', to: 'qc', push: [] });

  // Accept
  transitions.push({ from: 'qc', input: 'ε', pop: 'Z0', to: 'qf', push: ['Z0'] });

  if (minN === 0 && minM === 0) {
    transitions.push({ from: 'qs', input: 'ε', pop: 'Z0', to: 'qf', push: ['Z0'] });
  }

  return {
    name: `L = { ${sym1}^n ${sym2}^m ${sym3}^(n+m) | n >= ${minN}, m >= ${minM} }`,
    description: `PDA pushes 'A' on '${sym1}', 'B' on '${sym2}', then pops one symbol for every '${sym3}'.`,
    states,
    inputAlphabet: [sym1, sym2, sym3],
    stackAlphabet: ['A', 'B', 'Z0'],
    transitions,
    start: 'qs',
    startStack: 'Z0',
    finals: ['qf'],
    acceptBy: 'finalState',
  };
}

/**
 * 3. a^n b^n c^m (n, m >= 1 or >= 0)
 */
export function createAnBnCm(
  minN: number = 1,
  minM: number = 1,
  sym1: string = 'a',
  sym2: string = 'b',
  sym3: string = 'c'
): PDA {
  const states = ['qs', 'qa', 'qb', 'qc', 'qf'];
  const transitions: Transition[] = [];

  if (minN >= 1) {
    transitions.push({ from: 'qs', input: sym1, pop: 'Z0', to: 'qa', push: ['A', 'Z0'] });
  } else {
    transitions.push({ from: 'qs', input: 'ε', pop: 'Z0', to: 'qa', push: ['Z0'] });
  }

  transitions.push({ from: 'qa', input: sym1, pop: 'A', to: 'qa', push: ['A', 'A'] });
  transitions.push({ from: 'qa', input: sym2, pop: 'A', to: 'qb', push: [] });
  transitions.push({ from: 'qb', input: sym2, pop: 'A', to: 'qb', push: [] });

  if (minM >= 1) {
    transitions.push({ from: 'qb', input: sym3, pop: 'Z0', to: 'qc', push: ['Z0'] });
    if (minN === 0) {
      transitions.push({ from: 'qa', input: sym3, pop: 'Z0', to: 'qc', push: ['Z0'] });
    }
  } else {
    transitions.push({ from: 'qb', input: 'ε', pop: 'Z0', to: 'qc', push: ['Z0'] });
    if (minN === 0) {
      transitions.push({ from: 'qa', input: 'ε', pop: 'Z0', to: 'qc', push: ['Z0'] });
    }
  }

  transitions.push({ from: 'qc', input: sym3, pop: 'Z0', to: 'qc', push: ['Z0'] });
  transitions.push({ from: 'qc', input: 'ε', pop: 'Z0', to: 'qf', push: ['Z0'] });

  if (minN === 0 && minM === 0) {
    transitions.push({ from: 'qs', input: 'ε', pop: 'Z0', to: 'qf', push: ['Z0'] });
  }

  return {
    name: `L = { ${sym1}^n ${sym2}^n ${sym3}^m | n >= ${minN}, m >= ${minM} }`,
    description: `PDA pushes 'A' for '${sym1}', pops for '${sym2}', then reads '${sym3}' in state qc without stack modification.`,
    states,
    inputAlphabet: [sym1, sym2, sym3],
    stackAlphabet: ['A', 'Z0'],
    transitions,
    start: 'qs',
    startStack: 'Z0',
    finals: ['qf'],
    acceptBy: 'finalState',
  };
}

/**
 * 4. a^i b^j with i < j, i > j, i ≠ j
 */
export function createAiBjComparison(
  comparison: '<' | '>' | '≠',
  minN: number = 1,
  sym1: string = 'a',
  sym2: string = 'b'
): PDA {
  if (comparison === '<') {
    // i < j: more b's than a's
    const states = ['qs', 'qa', 'qb', 'q_more_b', 'qf'];
    const transitions: Transition[] = [
      // read a, push A
      { from: 'qs', input: sym1, pop: 'Z0', to: 'qa', push: ['A', 'Z0'] },
      { from: 'qa', input: sym1, pop: 'A', to: 'qa', push: ['A', 'A'] },

      // if i=0 and minN=0, can start directly on b
      ...(minN === 0
        ? [{ from: 'qs', input: sym2, pop: 'Z0', to: 'q_more_b', push: ['Z0'] }]
        : []),

      // read b, pop A
      { from: 'qa', input: sym2, pop: 'A', to: 'qb', push: [] },
      { from: 'qb', input: sym2, pop: 'A', to: 'qb', push: [] },

      // once all A's popped and stack is Z0, must read AT LEAST ONE more b to ensure i < j
      { from: 'qb', input: sym2, pop: 'Z0', to: 'q_more_b', push: ['Z0'] },
      { from: 'q_more_b', input: sym2, pop: 'Z0', to: 'q_more_b', push: ['Z0'] },
      { from: 'q_more_b', input: 'ε', pop: 'Z0', to: 'qf', push: ['Z0'] },
    ];

    return {
      name: `L = { ${sym1}^i ${sym2}^j | i < j, i, j >= ${minN} }`,
      description: `PDA pushes 'A' on '${sym1}', matches on '${sym2}', and enforces at least one additional '${sym2}' after stack empties to Z0.`,
      states,
      inputAlphabet: [sym1, sym2],
      stackAlphabet: ['A', 'Z0'],
      transitions,
      start: 'qs',
      startStack: 'Z0',
      finals: ['qf'],
      acceptBy: 'finalState',
    };
  }

  if (comparison === '>') {
    // i > j: more a's than b's
    const states = ['qs', 'qa', 'qb', 'q_drain', 'qf'];
    const transitions: Transition[] = [
      // read at least one a
      { from: 'qs', input: sym1, pop: 'Z0', to: 'qa', push: ['A', 'Z0'] },
      { from: 'qa', input: sym1, pop: 'A', to: 'qa', push: ['A', 'A'] },

      // read b, pop A
      { from: 'qa', input: sym2, pop: 'A', to: 'qb', push: [] },
      { from: 'qb', input: sym2, pop: 'A', to: 'qb', push: [] },

      // after all b's read, stack MUST have at least one A remaining (i > j)
      { from: 'qa', input: 'ε', pop: 'A', to: 'q_drain', push: [] },
      { from: 'qb', input: 'ε', pop: 'A', to: 'q_drain', push: [] },

      // drain any other remaining A's
      { from: 'q_drain', input: 'ε', pop: 'A', to: 'q_drain', push: [] },
      { from: 'q_drain', input: 'ε', pop: 'Z0', to: 'qf', push: ['Z0'] },
    ];

    return {
      name: `L = { ${sym1}^i ${sym2}^j | i > j, i, j >= ${minN} }`,
      description: `PDA pushes 'A' on '${sym1}', pops on '${sym2}', and requires at least one 'A' remaining on stack when input is consumed.`,
      states,
      inputAlphabet: [sym1, sym2],
      stackAlphabet: ['A', 'Z0'],
      transitions,
      start: 'qs',
      startStack: 'Z0',
      finals: ['qf'],
      acceptBy: 'finalState',
    };
  }

  // comparison === '≠'
  // Nondeterministic union of i < j and i > j
  const pdaLess = createAiBjComparison('<', minN, sym1, sym2);
  const pdaGreater = createAiBjComparison('>', minN, sym1, sym2);

  const states = ['qs', 'qf'];
  const transitions: Transition[] = [];

  // ε branch to i < j
  transitions.push({ from: 'qs', input: 'ε', pop: 'Z0', to: `L_${pdaLess.start}`, push: ['Z0'] });
  // ε branch to i > j
  transitions.push({ from: 'qs', input: 'ε', pop: 'Z0', to: `G_${pdaGreater.start}`, push: ['Z0'] });

  for (const s of pdaLess.states) {
    states.push(`L_${s}`);
  }
  for (const t of pdaLess.transitions) {
    transitions.push({
      from: `L_${t.from}`,
      input: t.input,
      pop: t.pop,
      to: t.to === 'qf' ? 'qf' : `L_${t.to}`,
      push: t.push,
    });
  }

  for (const s of pdaGreater.states) {
    states.push(`G_${s}`);
  }
  for (const t of pdaGreater.transitions) {
    transitions.push({
      from: `G_${t.from}`,
      input: t.input,
      pop: t.pop,
      to: t.to === 'qf' ? 'qf' : `G_${t.to}`,
      push: t.push,
    });
  }

  return {
    name: `L = { ${sym1}^i ${sym2}^j | i ≠ j, i, j >= ${minN} }`,
    description: `Non-deterministic PDA branching non-deterministically into two sub-automata: one checking i < j and one checking i > j.`,
    states: Array.from(new Set(states)),
    inputAlphabet: [sym1, sym2],
    stackAlphabet: ['A', 'Z0'],
    transitions,
    start: 'qs',
    startStack: 'Z0',
    finals: ['qf'],
    acceptBy: 'finalState',
  };
}

/**
 * 5. w w^R (even-length palindromes)
 * NPDA guessing the middle point
 */
export function createEvenPalindrome(sym1: string = 'a', sym2: string = 'b'): PDA {
  return {
    name: `L = { w w^R | w ∈ {${sym1}, ${sym2}}* }`,
    description: `Non-deterministic PDA guessing the midpoint with an ε-transition, then popping symbols in reverse order.`,
    states: ['q0', 'q1', 'qf'],
    inputAlphabet: [sym1, sym2],
    stackAlphabet: [sym1, sym2, 'Z0'],
    transitions: [
      // In q0, read and push
      { from: 'q0', input: sym1, pop: 'Z0', to: 'q0', push: [sym1, 'Z0'] },
      { from: 'q0', input: sym2, pop: 'Z0', to: 'q0', push: [sym2, 'Z0'] },
      { from: 'q0', input: sym1, pop: sym1, to: 'q0', push: [sym1, sym1] },
      { from: 'q0', input: sym1, pop: sym2, to: 'q0', push: [sym1, sym2] },
      { from: 'q0', input: sym2, pop: sym1, to: 'q0', push: [sym2, sym1] },
      { from: 'q0', input: sym2, pop: sym2, to: 'q0', push: [sym2, sym2] },

      // Guess the center: ε move to q1
      { from: 'q0', input: 'ε', pop: sym1, to: 'q1', push: [sym1] },
      { from: 'q0', input: 'ε', pop: sym2, to: 'q1', push: [sym2] },
      { from: 'q0', input: 'ε', pop: 'Z0', to: 'q1', push: ['Z0'] },

      // In q1, read and pop matching
      { from: 'q1', input: sym1, pop: sym1, to: 'q1', push: [] },
      { from: 'q1', input: sym2, pop: sym2, to: 'q1', push: [] },

      // Acceptance
      { from: 'q1', input: 'ε', pop: 'Z0', to: 'qf', push: ['Z0'] },
    ],
    start: 'q0',
    startStack: 'Z0',
    finals: ['qf'],
    acceptBy: 'finalState',
  };
}

/**
 * 6. w c w^R (odd-length palindromes with center marker 'c')
 * Deterministic PDA
 */
export function createOddPalindromeCenter(
  sym1: string = 'a',
  sym2: string = 'b',
  center: string = 'c'
): PDA {
  return {
    name: `L = { w ${center} w^R | w ∈ {${sym1}, ${sym2}}* }`,
    description: `Deterministic PDA pushing symbols until the center marker '${center}' is read, then popping in reverse order.`,
    states: ['q0', 'q1', 'qf'],
    inputAlphabet: [sym1, sym2, center],
    stackAlphabet: [sym1, sym2, 'Z0'],
    transitions: [
      // Push first half
      { from: 'q0', input: sym1, pop: 'Z0', to: 'q0', push: [sym1, 'Z0'] },
      { from: 'q0', input: sym2, pop: 'Z0', to: 'q0', push: [sym2, 'Z0'] },
      { from: 'q0', input: sym1, pop: sym1, to: 'q0', push: [sym1, sym1] },
      { from: 'q0', input: sym1, pop: sym2, to: 'q0', push: [sym1, sym2] },
      { from: 'q0', input: sym2, pop: sym1, to: 'q0', push: [sym2, sym1] },
      { from: 'q0', input: sym2, pop: sym2, to: 'q0', push: [sym2, sym2] },

      // Center marker
      { from: 'q0', input: center, pop: sym1, to: 'q1', push: [sym1] },
      { from: 'q0', input: center, pop: sym2, to: 'q1', push: [sym2] },
      { from: 'q0', input: center, pop: 'Z0', to: 'q1', push: ['Z0'] },

      // Pop matching reverse
      { from: 'q1', input: sym1, pop: sym1, to: 'q1', push: [] },
      { from: 'q1', input: sym2, pop: sym2, to: 'q1', push: [] },

      // Accept
      { from: 'q1', input: 'ε', pop: 'Z0', to: 'qf', push: ['Z0'] },
    ],
    start: 'q0',
    startStack: 'Z0',
    finals: ['qf'],
    acceptBy: 'finalState',
  };
}

/**
 * 7. Equal number of a's and b's
 */
export function createEqualAandB(sym1: string = 'a', sym2: string = 'b'): PDA {
  return {
    name: `L = { w ∈ {${sym1}, ${sym2}}* | N_${sym1}(w) = N_${sym2}(w) }`,
    description: `PDA tracking difference in counts: stack contains excess '${sym1}'s or '${sym2}'s. Accepts on empty stack.`,
    states: ['q0', 'qf'],
    inputAlphabet: [sym1, sym2],
    stackAlphabet: [sym1, sym2, 'Z0'],
    transitions: [
      // On empty stack (Z0):
      { from: 'q0', input: sym1, pop: 'Z0', to: 'q0', push: [sym1, 'Z0'] },
      { from: 'q0', input: sym2, pop: 'Z0', to: 'q0', push: [sym2, 'Z0'] },

      // On sym1 top:
      { from: 'q0', input: sym1, pop: sym1, to: 'q0', push: [sym1, sym1] }, // more sym1
      { from: 'q0', input: sym2, pop: sym1, to: 'q0', push: [] },             // balance sym1

      // On sym2 top:
      { from: 'q0', input: sym2, pop: sym2, to: 'q0', push: [sym2, sym2] }, // more sym2
      { from: 'q0', input: sym1, pop: sym2, to: 'q0', push: [] },             // balance sym2

      // Accept on empty stack / return to Z0
      { from: 'q0', input: 'ε', pop: 'Z0', to: 'qf', push: ['Z0'] },
    ],
    start: 'q0',
    startStack: 'Z0',
    finals: ['qf'],
    acceptBy: 'finalState',
  };
}

/**
 * 8. Balanced parentheses
 */
export function createBalancedParens(): PDA {
  return {
    name: 'L = { w | w has balanced parentheses }',
    description: 'Deterministic PDA pushing on "(" and popping on ")".',
    states: ['q0', 'qf'],
    inputAlphabet: ['(', ')'],
    stackAlphabet: ['(', 'Z0'],
    transitions: [
      { from: 'q0', input: '(', pop: 'Z0', to: 'q0', push: ['(', 'Z0'] },
      { from: 'q0', input: '(', pop: '(', to: 'q0', push: ['(', '('] },
      { from: 'q0', input: ')', pop: '(', to: 'q0', push: [] },
      { from: 'q0', input: 'ε', pop: 'Z0', to: 'qf', push: ['Z0'] },
    ],
    start: 'q0',
    startStack: 'Z0',
    finals: ['qf'],
    acceptBy: 'finalState',
  };
}

/**
 * Dispatches a parsed language specification to its corresponding PDA generator template.
 */
export function generatePDAFromParsed(parsed: ParsedLanguage): PDA {
  switch (parsed.type) {
    case 'an_bn_generalized':
      return createAnBnGeneralized(parsed.p, parsed.q, parsed.minN, parsed.sym1, parsed.sym2);

    case 'an_bm_c_n_plus_m':
      return createAnBmCnpm(parsed.minN, parsed.minM, parsed.sym1, parsed.sym2, parsed.sym3 ?? 'c');

    case 'an_bn_cm':
      return createAnBnCm(parsed.minN, parsed.minM, parsed.sym1, parsed.sym2, parsed.sym3 ?? 'c');

    case 'ai_bj_comparison':
      return createAiBjComparison(
        (parsed.comparison === '=' ? '<' : parsed.comparison) ?? '<',
        parsed.minN,
        parsed.sym1,
        parsed.sym2
      );

    case 'palindrome_even':
      return createEvenPalindrome(parsed.sym1, parsed.sym2);

    case 'palindrome_center':
      return createOddPalindromeCenter(parsed.sym1, parsed.sym2, parsed.sym3 ?? 'c');

    case 'equal_a_b':
      return createEqualAandB(parsed.sym1, parsed.sym2);

    case 'balanced_parens':
      return createBalancedParens();

    default:
      throw new Error(`Unsupported pattern type: ${(parsed as any).type}`);
  }
}
