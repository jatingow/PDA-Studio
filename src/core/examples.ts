import { PDA } from './pda';
import { createAnBnGeneralized, createAnBmGeneralized, createAnBmCnpm, createEvenPalindrome, createEqualAandB, createBalancedParens, createAiBjComparison } from './templates';
import { parseCFG } from './cfgParser';
import { convertCFGToPDA } from './cfgToPda';

export interface ExampleDefinition {
  id: string;
  title: string;
  category: 'Textbook Classics' | 'CFG Equivalences' | 'Language Patterns';
  languageMath: string;
  defaultInput: string;
  description: string;
  getPDA: () => PDA;
}

export const BUILT_IN_EXAMPLES: ExampleDefinition[] = [
  {
    id: 'a2n_bn',
    title: 'a^(2n) b^n (n >= 1)',
    category: 'Textbook Classics',
    languageMath: 'L = \\{ a^{2n} b^n \\mid n \\ge 1 \\}',
    defaultInput: 'aaaabb',
    description: 'Textbook example: reads 2 "a"s for every "b". Forces n >= 1 by requiring "a" in start state qs.',
    getPDA: () => ({
      name: 'L = { a^(2n) b^n | n >= 1 }',
      description: 'Textbook solution using qs (start), q0, q1 (pop intermediate), and q2 (final state).',
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
    }),
  },
  {
    id: 'an_bn',
    title: 'a^n b^n (n >= 1)',
    category: 'Textbook Classics',
    languageMath: 'L = \\{ a^n b^n \\mid n \\ge 1 \\}',
    defaultInput: 'aaabbb',
    description: 'Fundamental context-free language. Pushes one symbol for every "a" and pops on "b".',
    getPDA: () => createAnBnGeneralized(1, 1, 1, 'a', 'b'),
  },
  {
    id: 'an_b2n',
    title: 'a^n b^(2n) (n >= 1)',
    category: 'Textbook Classics',
    languageMath: 'L = \\{ a^n b^{2n} \\mid n \\ge 1 \\}',
    defaultInput: 'aabbbb',
    description: 'Pushes two symbols for each "a", pops one for each "b".',
    getPDA: () => createAnBnGeneralized(1, 2, 1, 'a', 'b'),
  },
  {
    id: 'a2n_bm',
    title: 'a^(2n) b^m (n, m >= 1)',
    category: 'Language Patterns',
    languageMath: 'L = \\{ a^{2n} b^m \\mid n, m \\ge 1 \\}',
    defaultInput: 'aaaabb',
    description: 'Independent exponents: requires an even number of "a"s (n >= 1) followed by any positive number of "b"s (m >= 1).',
    getPDA: () => createAnBmGeneralized(2, 1, 1, 1, 'a', 'b'),
  },
  {
    id: 'an_bm_cnpm',
    title: 'a^n b^m c^(n+m) (n, m >= 1)',
    category: 'Language Patterns',
    languageMath: 'L = \\{ a^n b^m c^{n+m} \\mid n, m \\ge 1 \\}',
    defaultInput: 'aabbccc',
    description: 'Pushes on "a" and "b", then pops one stack symbol for every "c".',
    getPDA: () => createAnBmCnpm(1, 1, 'a', 'b', 'c'),
  },
  {
    id: 'ai_bj_less',
    title: 'a^i b^j with i < j',
    category: 'Language Patterns',
    languageMath: 'L = \\{ a^i b^j \\mid i < j, i, j \\ge 1 \\}',
    defaultInput: 'abbb',
    description: 'Pushes on "a", matches on "b", and requires at least one extra "b" after stack is emptied.',
    getPDA: () => createAiBjComparison('<', 1, 'a', 'b'),
  },
  {
    id: 'ww_r',
    title: 'w w^R (Even Palindromes)',
    category: 'Textbook Classics',
    languageMath: 'L = \\{ w w^R \\mid w \\in \\{a, b\\}^* \\}',
    defaultInput: 'abba',
    description: 'Non-deterministic PDA guessing the midpoint with an ε-transition, then popping matching symbols in reverse order.',
    getPDA: () => createEvenPalindrome('a', 'b'),
  },
  {
    id: 'equal_ab',
    title: 'Equal number of a\'s and b\'s',
    category: 'Language Patterns',
    languageMath: 'L = \\{ w \\in \\{a, b\\}^* \\mid N_a(w) = N_b(w) \\}',
    defaultInput: 'bbaaba',
    description: 'Maintains excess count on stack: "a"s if count(a) > count(b), or "b"s if count(b) > count(a).',
    getPDA: () => createEqualAandB('a', 'b'),
  },
  {
    id: 'balanced_parens',
    title: 'Balanced Parentheses',
    category: 'Textbook Classics',
    languageMath: 'L = \\{ w \\mid w \\text{ has balanced parentheses} \\}',
    defaultInput: '(())()',
    description: 'Standard Dyck language PDA: pushes "(" and pops on ")".',
    getPDA: () => createBalancedParens(),
  },
  {
    id: 'cfg_asb_ab',
    title: 'CFG: S -> aSb | ab',
    category: 'CFG Equivalences',
    languageMath: 'S \\to aSb \\mid ab',
    defaultInput: 'aabb',
    description: 'PDA obtained by standard single-state expansion construction from context-free grammar.',
    getPDA: () => {
      const cfg = parseCFG('S -> aSb | ab').cfg!;
      return convertCFGToPDA(cfg).pda;
    },
  },
];
