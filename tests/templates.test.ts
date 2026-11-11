import { describe, it, expect } from 'vitest';
import { parseLanguageInput } from '../src/core/langParser';
import { generatePDAFromParsed } from '../src/core/templates';
import { simulatePDA } from '../src/core/simulate';

// Helper to generate all strings over alphabet of lengths up to maxLen
function generateAllStrings(alphabet: string[], maxLen: number): string[] {
  const result: string[] = [''];
  let currentLevel = [''];

  for (let len = 1; len <= maxLen; len++) {
    const nextLevel: string[] = [];
    for (const prefix of currentLevel) {
      for (const char of alphabet) {
        const str = prefix + char;
        nextLevel.push(str);
        result.push(str);
      }
    }
    currentLevel = nextLevel;
  }

  return result;
}

describe('Language Parser', () => {
  it('parses a^2n b^n (n >= 1)', () => {
    const res = parseLanguageInput('a^2n b^n, n >= 1');
    expect(res.success).toBe(true);
    expect(res.parsed?.type).toBe('an_bn_generalized');
    expect(res.parsed?.p).toBe(2);
    expect(res.parsed?.q).toBe(1);
    expect(res.parsed?.minN).toBe(1);
  });

  it('parses a^n b^2n (n >= 0)', () => {
    const res = parseLanguageInput('a^n b^2n, n >= 0');
    expect(res.success).toBe(true);
    expect(res.parsed?.type).toBe('an_bn_generalized');
    expect(res.parsed?.p).toBe(1);
    expect(res.parsed?.q).toBe(2);
    expect(res.parsed?.minN).toBe(0);
  });

  it('parses a^n b^m c^(n+m)', () => {
    const res = parseLanguageInput('a^n b^m c^(n+m)');
    expect(res.success).toBe(true);
    expect(res.parsed?.type).toBe('an_bm_c_n_plus_m');
  });

  it('parses a^i b^j with i < j', () => {
    const res = parseLanguageInput('a^i b^j with i < j');
    expect(res.success).toBe(true);
    expect(res.parsed?.type).toBe('ai_bj_comparison');
    expect(res.parsed?.comparison).toBe('<');
  });

  it('parses w w^R', () => {
    const res = parseLanguageInput('w w^R');
    expect(res.success).toBe(true);
    expect(res.parsed?.type).toBe('palindrome_even');
  });

  it('parses equal number of a\'s and b\'s', () => {
    const res = parseLanguageInput('equal number of a\'s and b\'s');
    expect(res.success).toBe(true);
    expect(res.parsed?.type).toBe('equal_a_b');
  });

  it('gracefully rejects unsupported pattern with helpful message', () => {
    const res = parseLanguageInput('a^n b^n c^n'); // Famous non-CFL
    expect(res.success).toBe(false);
    expect(res.error).toContain('This language pattern is not supported');
    expect(res.supportedPatterns?.length).toBeGreaterThan(0);
  });
});

describe('PDA Templates Cross-Checked Against Brute-Force Membership', () => {
  it('cross-checks a^n b^n (n >= 1) on all strings up to length 8', () => {
    const parseRes = parseLanguageInput('a^n b^n, n >= 1');
    const pda = generatePDAFromParsed(parseRes.parsed!);

    // Brute-force oracle for a^n b^n (n >= 1)
    const oracle = (s: string) => {
      const match = s.match(/^a+b+$/);
      if (!match) return false;
      const numA = (s.match(/a/g) || []).length;
      const numB = (s.match(/b/g) || []).length;
      return numA === numB && numA >= 1;
    };

    const strings = generateAllStrings(['a', 'b'], 8);
    for (const str of strings) {
      const expected = oracle(str);
      const actual = simulatePDA(pda, str).accepted;
      if (expected !== actual) {
        throw new Error(`Mismatch on string "${str}": expected ${expected}, got ${actual}`);
      }
    }
  });

  it('cross-checks a^(2n) b^n (n >= 1) on all strings up to length 8', () => {
    const parseRes = parseLanguageInput('a^2n b^n, n >= 1');
    const pda = generatePDAFromParsed(parseRes.parsed!);

    // Brute-force oracle for a^(2n) b^n (n >= 1)
    const oracle = (s: string) => {
      const match = s.match(/^a+b+$/);
      if (!match) return false;
      const numA = (s.match(/a/g) || []).length;
      const numB = (s.match(/b/g) || []).length;
      return numA === 2 * numB && numB >= 1;
    };

    const strings = generateAllStrings(['a', 'b'], 8);
    for (const str of strings) {
      const expected = oracle(str);
      const actual = simulatePDA(pda, str).accepted;
      if (expected !== actual) {
        throw new Error(`Mismatch on string "${str}": expected ${expected}, got ${actual}`);
      }
    }
  });

  it('cross-checks a^n b^(2n) (n >= 1) on all strings up to length 8', () => {
    const parseRes = parseLanguageInput('a^n b^2n, n >= 1');
    const pda = generatePDAFromParsed(parseRes.parsed!);

    // Brute-force oracle for a^n b^(2n) (n >= 1)
    const oracle = (s: string) => {
      const match = s.match(/^a+b+$/);
      if (!match) return false;
      const numA = (s.match(/a/g) || []).length;
      const numB = (s.match(/b/g) || []).length;
      return numB === 2 * numA && numA >= 1;
    };

    const strings = generateAllStrings(['a', 'b'], 8);
    for (const str of strings) {
      const expected = oracle(str);
      const actual = simulatePDA(pda, str).accepted;
      if (expected !== actual) {
        throw new Error(`Mismatch on string "${str}": expected ${expected}, got ${actual}`);
      }
    }
  });

  it('cross-checks equal number of a\'s and b\'s on all strings up to length 6', () => {
    const parseRes = parseLanguageInput('equal number of a and b');
    const pda = generatePDAFromParsed(parseRes.parsed!);

    const oracle = (s: string) => {
      const numA = (s.match(/a/g) || []).length;
      const numB = (s.match(/b/g) || []).length;
      return numA === numB;
    };

    const strings = generateAllStrings(['a', 'b'], 6);
    for (const str of strings) {
      const expected = oracle(str);
      const actual = simulatePDA(pda, str).accepted;
      if (expected !== actual) {
        throw new Error(`Mismatch on string "${str}": expected ${expected}, got ${actual}`);
      }
    }
  });

  it('cross-checks w w^R (palindromes) on all strings up to length 6', () => {
    const parseRes = parseLanguageInput('w w^R');
    const pda = generatePDAFromParsed(parseRes.parsed!);

    const oracle = (s: string) => {
      if (s.length % 2 !== 0) return false;
      const half = s.length / 2;
      const firstHalf = s.slice(0, half);
      const secondHalfRev = s.slice(half).split('').reverse().join('');
      return firstHalf === secondHalfRev;
    };

    const strings = generateAllStrings(['a', 'b'], 6);
    for (const str of strings) {
      const expected = oracle(str);
      const actual = simulatePDA(pda, str).accepted;
      if (expected !== actual) {
        throw new Error(`Mismatch on string "${str}": expected ${expected}, got ${actual}`);
      }
    }
  });
});
