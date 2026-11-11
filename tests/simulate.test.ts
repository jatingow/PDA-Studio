import { describe, it, expect } from 'vitest';
import { PDA } from '../src/core/pda';
import { simulatePDA } from '../src/core/simulate';

describe('PDA Simulator - a^(2n) b^n (n >= 1)', () => {
  // Built-in textbook example from project specification
  const pdaA2nBn: PDA = {
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

  it('accepts valid strings: aab (n=1), aaaabb (n=2), aaaaaabbb (n=3)', () => {
    expect(simulatePDA(pdaA2nBn, 'aab').accepted).toBe(true);
    expect(simulatePDA(pdaA2nBn, 'aaaabb').accepted).toBe(true);
    expect(simulatePDA(pdaA2nBn, 'aaaaaabbb').accepted).toBe(true);
  });

  it('rejects invalid strings: empty string, a, aa, aaab, aabb, abb, ba', () => {
    expect(simulatePDA(pdaA2nBn, '').accepted).toBe(false);
    expect(simulatePDA(pdaA2nBn, 'a').accepted).toBe(false);
    expect(simulatePDA(pdaA2nBn, 'aa').accepted).toBe(false);
    expect(simulatePDA(pdaA2nBn, 'aaab').accepted).toBe(false);
    expect(simulatePDA(pdaA2nBn, 'aabb').accepted).toBe(false);
    expect(simulatePDA(pdaA2nBn, 'abb').accepted).toBe(false);
    expect(simulatePDA(pdaA2nBn, 'ba').accepted).toBe(false);
  });

  it('provides a detailed accepting path for aaaabb', () => {
    const res = simulatePDA(pdaA2nBn, 'aaaabb');
    expect(res.accepted).toBe(true);
    expect(res.acceptingPath.length).toBeGreaterThan(0);
    // Initial config: (qs, aaaabb, [Z0])
    expect(res.acceptingPath[0].config.state).toBe('qs');
    expect(res.acceptingPath[0].config.remaining).toBe('aaaabb');
    // Final config: (q2, '', [Z0])
    const lastStep = res.acceptingPath[res.acceptingPath.length - 1];
    expect(lastStep.config.state).toBe('q2');
    expect(lastStep.config.remaining).toBe('');
  });

  it('handles acceptance by empty stack', () => {
    // PDA accepting a^n b^n by empty stack
    const pdaEmptyStack: PDA = {
      states: ['q0', 'q1'],
      inputAlphabet: ['a', 'b'],
      stackAlphabet: ['a', 'Z0'],
      start: 'q0',
      startStack: 'Z0',
      finals: [],
      acceptBy: 'emptyStack',
      transitions: [
        { from: 'q0', input: 'a', pop: 'Z0', to: 'q0', push: ['a', 'Z0'] },
        { from: 'q0', input: 'a', pop: 'a', to: 'q0', push: ['a', 'a'] },
        { from: 'q0', input: 'b', pop: 'a', to: 'q1', push: [] },
        { from: 'q1', input: 'b', pop: 'a', to: 'q1', push: [] },
        { from: 'q1', input: 'ε', pop: 'Z0', to: 'q1', push: [] }, // pop Z0 at the end to empty stack
      ],
    };

    expect(simulatePDA(pdaEmptyStack, 'ab').accepted).toBe(true);
    expect(simulatePDA(pdaEmptyStack, 'aabb').accepted).toBe(true);
    expect(simulatePDA(pdaEmptyStack, 'a').accepted).toBe(false);
    expect(simulatePDA(pdaEmptyStack, 'abb').accepted).toBe(false);
  });

  it('prevents infinite epsilon loops', () => {
    const pdaLoop: PDA = {
      states: ['q0'],
      inputAlphabet: ['a'],
      stackAlphabet: ['Z0'],
      start: 'q0',
      startStack: 'Z0',
      finals: ['q_fake'],
      acceptBy: 'finalState',
      transitions: [
        { from: 'q0', input: 'ε', pop: 'Z0', to: 'q0', push: ['Z0'] }, // cyclic self-loop
      ],
    };

    const res = simulatePDA(pdaLoop, 'a', { maxSteps: 50 });
    expect(res.accepted).toBe(false);
    expect(res.totalStepsExplored).toBeLessThan(10); // Loop detection prunes redundant states immediately!
  });
});
