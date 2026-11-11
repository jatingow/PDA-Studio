/**
 * Parser for language specifications such as:
 * - a^n b^n, a^2n b^n, a^n b^2n, a^(p*n) b^(q*n)
 * - a^n b^m c^(n+m)
 * - a^n b^n c^m
 * - a^i b^j with i=j, i<j, i>j, i≠j (or i!=j)
 * - w w^R, w c w^R (palindromes)
 * - equal number of a's and b's
 * - balanced parentheses
 */

export type PatternType =
  | 'an_bn_generalized'
  | 'an_bm_c_n_plus_m'
  | 'an_bn_cm'
  | 'ai_bj_comparison'
  | 'palindrome_even'
  | 'palindrome_center'
  | 'equal_a_b'
  | 'balanced_parens';

export interface ParsedLanguage {
  type: PatternType;
  raw: string;
  minN: number; // 0 or 1 (e.g. n >= 1 or n >= 0)
  minM: number; // 0 or 1 (e.g. m >= 1 or m >= 0)
  p: number; // coefficient of first symbol, e.g. 2 in a^(2n)
  q: number; // coefficient of second symbol, e.g. 1 in b^n
  sym1: string; // usually 'a'
  sym2: string; // usually 'b'
  sym3?: string; // usually 'c'
  comparison?: '=' | '<' | '>' | '≠';
  description: string;
}

export const SUPPORTED_PATTERNS_LIST = [
  'a^(p·n) b^(q·n) (e.g., a^n b^n, a^2n b^n, a^n b^2n, n >= 0 or n >= 1)',
  'a^n b^m c^(n+m) (n, m >= 0 or n, m >= 1)',
  'a^n b^n c^m (n, m >= 0 or n, m >= 1)',
  'a^i b^j with i = j, i < j, i > j, or i ≠ j (i != j)',
  'w w^R (even palindromes over {a, b})',
  'w c w^R (odd palindromes with center marker c)',
  'equal number of a\'s and b\'s',
  'balanced parentheses ()',
];

export interface ParseResult {
  success: boolean;
  parsed?: ParsedLanguage;
  error?: string;
  supportedPatterns?: string[];
}

/**
 * Parses a free-form or guided language description into a structured representation.
 */
export function parseLanguageInput(input: string): ParseResult {
  const cleaned = input
    .trim()
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ');

  if (!cleaned) {
    return {
      success: false,
      error: 'Please enter a language expression.',
      supportedPatterns: SUPPORTED_PATTERNS_LIST,
    };
  }

  const lower = cleaned.toLowerCase();

  // 1. Equal number of a's and b's
  if (
    lower.includes('equal') && (lower.includes('a') || lower.includes("a's")) && (lower.includes('b') || lower.includes("b's")) ||
    lower.includes('na(w) = nb(w)') ||
    lower.includes('n_a(w) = n_b(w)')
  ) {
    return {
      success: true,
      parsed: {
        type: 'equal_a_b',
        raw: input,
        minN: 0,
        minM: 0,
        p: 1,
        q: 1,
        sym1: 'a',
        sym2: 'b',
        description: "L = { w ∈ {a, b}* | N_a(w) = N_b(w) }",
      },
    };
  }

  // 2. Balanced parentheses
  if (
    lower.includes('balanced paren') ||
    lower.includes('parentheses') ||
    lower === '()' ||
    lower === 'dyck'
  ) {
    return {
      success: true,
      parsed: {
        type: 'balanced_parens',
        raw: input,
        minN: 0,
        minM: 0,
        p: 1,
        q: 1,
        sym1: '(',
        sym2: ')',
        description: 'L = { w | w has balanced parentheses }',
      },
    };
  }

  // 3. Palindromes: w w^R or w c w^R
  if (
    cleaned.match(/w\s*c\s*w\^?[rR]/i) ||
    lower.includes('w c w^r') ||
    lower.includes('wcw^r')
  ) {
    return {
      success: true,
      parsed: {
        type: 'palindrome_center',
        raw: input,
        minN: 0,
        minM: 0,
        p: 1,
        q: 1,
        sym1: 'a',
        sym2: 'b',
        sym3: 'c',
        description: 'L = { w c w^R | w ∈ {a, b}* }',
      },
    };
  }

  if (
    cleaned.match(/w\s*w\^?[rR]/i) ||
    lower.includes('ww^r') ||
    lower.includes('w w^r') ||
    lower.includes('palindrome')
  ) {
    return {
      success: true,
      parsed: {
        type: 'palindrome_even',
        raw: input,
        minN: 0,
        minM: 0,
        p: 1,
        q: 1,
        sym1: 'a',
        sym2: 'b',
        description: 'L = { w w^R | w ∈ {a, b}* }',
      },
    };
  }

  // Determine min constraint: n >= 1 vs n >= 0 (default to 1 as per course standards)
  let minN = 1;
  if (/n\s*>=\s*0|n\s*≥\s*0/.test(cleaned) || /i\s*>=\s*0|i\s*≥\s*0/.test(cleaned)) {
    minN = 0;
  } else if (/n\s*>=\s*1|n\s*≥\s*1|n\s*>\s*0/.test(cleaned) || /i\s*>=\s*1|i\s*≥\s*1|i\s*>\s*0/.test(cleaned)) {
    minN = 1;
  }

  let minM = minN;
  if (/m\s*>=\s*0|m\s*≥\s*0/.test(cleaned) || /j\s*>=\s*0|j\s*≥\s*0/.test(cleaned)) {
    minM = 0;
  } else if (/m\s*>=\s*1|m\s*≥\s*1|m\s*>\s*0/.test(cleaned) || /j\s*>=\s*1|j\s*≥\s*1|j\s*>\s*0/.test(cleaned)) {
    minM = 1;
  }

  // Separate pattern part from condition part (e.g. "a^n b^n, n>=1" -> pattern "a^n b^n")
  const parts = cleaned.split(/[,;|]/);
  const patternPart = parts[0].trim();

  // 4. a^i b^j with i=j, i<j, i>j, i≠j
  const compMatch = cleaned.match(/([a-z])\^i\s*([a-z])\^j.*(?:with|where|,|;|\|)?\s*i\s*(=|<|>|<=|>=|!=|≠)\s*j/i);
  if (compMatch) {
    const sym1 = compMatch[1];
    const sym2 = compMatch[2];
    let comp = compMatch[3];
    if (comp === '!=') comp = '≠';
    if (comp === '=') {
      return {
        success: true,
        parsed: {
          type: 'an_bn_generalized',
          raw: input,
          minN,
          minM,
          p: 1,
          q: 1,
          sym1,
          sym2,
          description: `L = { ${sym1}^i ${sym2}^j | i = j, i, j >= ${minN} }`,
        },
      };
    }
    return {
      success: true,
      parsed: {
        type: 'ai_bj_comparison',
        raw: input,
        minN,
        minM,
        p: 1,
        q: 1,
        sym1,
        sym2,
        comparison: comp as '<' | '>' | '≠',
        description: `L = { ${sym1}^i ${sym2}^j | i ${comp} j, i, j >= ${minN} }`,
      },
    };
  }

  // 5. a^n b^m c^(n+m) or a^n b^m c^(m+n)
  const anBmCnpmMatch = patternPart.match(/^([a-z])\^[a-z]\s*([a-z])\^[a-z]\s*([a-z])\^\(?([a-z])\s*\+\s*([a-z])\)?$/i);
  if (anBmCnpmMatch) {
    const sym1 = anBmCnpmMatch[1];
    const sym2 = anBmCnpmMatch[2];
    const sym3 = anBmCnpmMatch[3];
    return {
      success: true,
      parsed: {
        type: 'an_bm_c_n_plus_m',
        raw: input,
        minN,
        minM,
        p: 1,
        q: 1,
        sym1,
        sym2,
        sym3,
        description: `L = { ${sym1}^n ${sym2}^m ${sym3}^(n+m) | n >= ${minN}, m >= ${minM} }`,
      },
    };
  }

  // 6. a^n b^n c^m
  const anBnCmMatch = patternPart.match(/^([a-z])\^([a-z])\s*([a-z])\^\2\s*([a-z])\^([a-z])$/i);
  if (anBnCmMatch && anBnCmMatch[2] !== anBnCmMatch[5]) {
    const sym1 = anBnCmMatch[1];
    const sym2 = anBnCmMatch[3];
    const sym3 = anBnCmMatch[4];
    return {
      success: true,
      parsed: {
        type: 'an_bn_cm',
        raw: input,
        minN,
        minM,
        p: 1,
        q: 1,
        sym1,
        sym2,
        sym3,
        description: `L = { ${sym1}^n ${sym2}^n ${sym3}^m | n >= ${minN}, m >= ${minM} }`,
      },
    };
  }

  // 7. Generalized a^(p*n) b^(q*n): e.g. a^2n b^n, a^n b^2n, a^3n b^2n, a^n b^n
  // Must match the entire patternPart!
  const genMatch = patternPart.match(
    /^([a-z])\^\(?(\d*)\s*\*?\s*([a-z])\)?\s*([a-z])\^\(?(\d*)\s*\*?\s*\3\)?$/i
  );

  if (genMatch) {
    const sym1 = genMatch[1];
    const pStr = genMatch[2];
    const sym2 = genMatch[4];
    const qStr = genMatch[5];

    const p = pStr ? parseInt(pStr, 10) : 1;
    const q = qStr ? parseInt(qStr, 10) : 1;

    if (p > 0 && q > 0) {
      const pText = p === 1 ? '' : p;
      const qText = q === 1 ? '' : q;
      return {
        success: true,
        parsed: {
          type: 'an_bn_generalized',
          raw: input,
          minN,
          minM,
          p,
          q,
          sym1,
          sym2,
          description: `L = { ${sym1}^(${pText}n) ${sym2}^(${qText}n) | n >= ${minN} }`,
        },
      };
    }
  }

  // If pattern not matched
  return {
    success: false,
    error: 'This language pattern is not supported.',
    supportedPatterns: SUPPORTED_PATTERNS_LIST,
  };
}
