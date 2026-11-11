import { describe, it, expect } from 'vitest';
import { parseCFG } from '../src/core/cfgParser';
import { convertCFGToPDA } from '../src/core/cfgToPda';
import { simulatePDA } from '../src/core/simulate';

describe('CFG Parser and CFG -> PDA Conversion', () => {
  it('parses S -> aSb | ab and generates equivalent PDA', () => {
    const parseResult = parseCFG('S -> aSb | ab');
    expect(parseResult.success).toBe(true);
    expect(parseResult.cfg?.variables).toContain('S');
    expect(parseResult.cfg?.terminals).toEqual(expect.arrayContaining(['a', 'b']));

    const { pda, isNondeterministic } = convertCFGToPDA(parseResult.cfg!);
    expect(isNondeterministic).toBe(true); // S has 2 choices on ε

    // Accept valid strings: ab, aabb, aaabbb
    expect(simulatePDA(pda, 'ab').accepted).toBe(true);
    expect(simulatePDA(pda, 'aabb').accepted).toBe(true);
    expect(simulatePDA(pda, 'aaabbb').accepted).toBe(true);

    // Reject invalid strings
    expect(simulatePDA(pda, '').accepted).toBe(false);
    expect(simulatePDA(pda, 'a').accepted).toBe(false);
    expect(simulatePDA(pda, 'b').accepted).toBe(false);
    expect(simulatePDA(pda, 'aab').accepted).toBe(false);
    expect(simulatePDA(pda, 'aba').accepted).toBe(false);
  });

  it('handles Balanced Parentheses grammar: S -> ( S ) | S S | ε', () => {
    const grammar = `
      S -> ( S )
      S -> S S
      S -> ε
    `;
    const parseResult = parseCFG(grammar);
    expect(parseResult.success).toBe(true);

    const { pda } = convertCFGToPDA(parseResult.cfg!);

    // Accepted
    expect(simulatePDA(pda, '').accepted).toBe(true);
    expect(simulatePDA(pda, '()').accepted).toBe(true);
    expect(simulatePDA(pda, '(())').accepted).toBe(true);
    expect(simulatePDA(pda, '()()').accepted).toBe(true);

    // Rejected
    expect(simulatePDA(pda, '(').accepted).toBe(false);
    expect(simulatePDA(pda, ')').accepted).toBe(false);
    expect(simulatePDA(pda, ')(').accepted).toBe(false);
  });

  it('handles Palindrome grammar: S -> aSa | bSb | ε', () => {
    const grammar = 'S -> aSa | bSb | ε';
    const parseResult = parseCFG(grammar);
    expect(parseResult.success).toBe(true);

    const { pda } = convertCFGToPDA(parseResult.cfg!);

    // Accepted
    expect(simulatePDA(pda, '').accepted).toBe(true);
    expect(simulatePDA(pda, 'aa').accepted).toBe(true);
    expect(simulatePDA(pda, 'abba').accepted).toBe(true);
    expect(simulatePDA(pda, 'baab').accepted).toBe(true);

    // Rejected
    expect(simulatePDA(pda, 'ab').accepted).toBe(false);
    expect(simulatePDA(pda, 'ba').accepted).toBe(false);
    expect(simulatePDA(pda, 'abb').accepted).toBe(false);
  });

  it('reports syntax error on invalid grammar line', () => {
    const parseResult = parseCFG('This is not a grammar rule');
    expect(parseResult.success).toBe(false);
    expect(parseResult.error).toContain('Syntax error');
  });
});
