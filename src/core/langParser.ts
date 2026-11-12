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
  | 'an_bm_generalized'
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
  q: number; // coefficient of second symbol, e.g. 1 in b^n or b^m
  sym1: string; // usually 'a'
  sym2: string; // usually 'b'
  sym3?: string; // usually 'c'
  comparison?: '=' | '<' | '>' | '≠';
  description: string;
}

export const SUPPORTED_PATTERNS_LIST = [
  'a^(p·n) b^(q·n) (e.g., a^n b^n, a^2n b^n, a^n b^2n, n >= 0 or n >= 1)',
  'a^(p·n) b^(q·m) (e.g., a^2n b^m, a^n b^m, a^n b^2m, n, m >= 0 or n, m >= 1)',
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
    .replace(/^L\s*=\s*/i, '')
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
  let minM = 1;

  // Joint constraints: e.g. "n,m >= 0", "n, m >= 0", "n,m >= 1", "n, m >= 1", "i,j >= 0", "i, j >= 1"
  const jointMatch = cleaned.match(/(?:n|m|i|j)\s*(?:,|\band\b|\s)\s*(?:n|m|i|j)\s*(?:>=|≥|>)\s*([01])/i);
  if (jointMatch) {
    const val = parseInt(jointMatch[1], 10);
    const isStrictGt = />\s*0/.test(jointMatch[0]);
    const bound = isStrictGt ? 1 : val;
    minN = bound;
    minM = bound;
  } else {
    // Individual constraints for n / i
    if (/(?:n|i)\s*(?:>=|≥)\s*0/i.test(cleaned)) {
      minN = 0;
    } else if (/(?:n|i)\s*(?:>=|≥)\s*1|(?:n|i)\s*>\s*0/i.test(cleaned)) {
      minN = 1;
    }

    // Individual constraints for m / j
    if (/(?:m|j)\s*(?:>=|≥)\s*0/i.test(cleaned)) {
      minM = 0;
    } else if (/(?:m|j)\s*(?:>=|≥)\s*1|(?:m|j)\s*>\s*0/i.test(cleaned)) {
      minM = 1;
    } else {
      // If m is not explicitly specified, inherit minN
      minM = minN;
    }
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

  // 7. Generalized two-symbol pattern: a^(p·var1) b^(q·var2)
  // E.g. a^2n b^n (shared variable -> an_bn_generalized)
  // E.g. a^2n b^m (independent variables -> an_bm_generalized)
  const twoSymMatch = patternPart.match(
    /^([a-z0-9])\s*\^\s*\(?(\d*)\s*\*?\s*([a-z])\)?\s*([a-z0-9])\s*\^\s*\(?(\d*)\s*\*?\s*([a-z])\)?$/i
  );

  if (twoSymMatch) {
    const sym1 = twoSymMatch[1];
    const pStr = twoSymMatch[2];
    const var1 = twoSymMatch[3].toLowerCase();
    const sym2 = twoSymMatch[4];
    const qStr = twoSymMatch[5];
    const var2 = twoSymMatch[6].toLowerCase();

    const p = pStr ? parseInt(pStr, 10) : 1;
    const q = qStr ? parseInt(qStr, 10) : 1;

    if (p > 0 && q > 0) {
      const exp1 = p === 1 ? var1 : `${p}${var1}`;
      const exp2 = q === 1 ? var2 : `${q}${var2}`;

      if (var1 === var2) {
        // Shared index variable (e.g. n and n): stack-coupled PDA
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
            description: `L = { ${sym1}^${exp1} ${sym2}^${exp2} | ${var1} >= ${minN} }`,
          },
        };
      } else {
        // Independent index variables (e.g. n and m, or i and j): independent-count PDA
        return {
          success: true,
          parsed: {
            type: 'an_bm_generalized',
            raw: input,
            minN,
            minM,
            p,
            q,
            sym1,
            sym2,
            description: `L = { ${sym1}^${exp1} ${sym2}^${exp2} | ${var1} >= ${minN}, ${var2} >= ${minM} }`,
          },
        };
      }
    }
  }

  // If pattern not matched
  return {
    success: false,
    error: 'This language pattern is not supported.',
    supportedPatterns: SUPPORTED_PATTERNS_LIST,
  };
}
