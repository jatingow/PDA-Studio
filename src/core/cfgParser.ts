/**
 * Parser for Context-Free Grammars (CFGs).
 * Parses input like:
 *   S -> aSb | ab
 *   S -> ( S ) | S S | ε
 * Supports standard arrow variants (->, →, ::=), multiple lines, and alternatives (|).
 */

export interface Production {
  lhs: string; // Non-terminal / Variable (uppercase, e.g. "S", "A")
  rhs: string[]; // List of symbols, e.g. ["a", "S", "b"] or [] for ε
  rawRhs: string; // String representation, e.g. "aSb" or "ε"
}

export interface CFG {
  variables: string[];
  terminals: string[];
  productions: Production[];
  startVariable: string;
  raw: string;
}

export interface CFGParseResult {
  success: boolean;
  cfg?: CFG;
  error?: string;
}

const EPSILON_VARIANTS = new Set(['ε', 'epsilon', 'eps', 'lambda', 'λ', '""', "''"]);

/**
 * Tokenizes a RHS string into terminal and variable symbols.
 * If spaces are used (e.g. "a S b"), splits by whitespace.
 * Otherwise, splits into characters.
 */
function tokenizeRhs(rhsStr: string): string[] {
  const trimmed = rhsStr.trim();
  if (!trimmed || EPSILON_VARIANTS.has(trimmed.toLowerCase())) {
    return [];
  }

  // If there are internal spaces, token split by spaces
  if (/\s+/.test(trimmed)) {
    return trimmed.split(/\s+/).filter(tok => !EPSILON_VARIANTS.has(tok.toLowerCase()));
  }

  // Character-by-character tokenization
  const tokens: string[] = [];
  for (const ch of trimmed) {
    if (!EPSILON_VARIANTS.has(ch)) {
      tokens.push(ch);
    }
  }
  return tokens;
}

/**
 * Parses a string of CFG rules into a CFG object.
 */
export function parseCFG(input: string): CFGParseResult {
  const lines = input
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('//') && !line.startsWith('#'));

  if (lines.length === 0) {
    return {
      success: false,
      error: 'Please enter at least one CFG production rule (e.g. S -> aSb | ab).',
    };
  }

  const productions: Production[] = [];
  const variablesSet = new Set<string>();
  const terminalsSet = new Set<string>();
  let startVariable: string | null = null;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];

    // Match LHS -> RHS
    const arrowMatch = line.match(/^([A-Z][a-zA-Z0-9_]*|.)\s*(?:->|→|::=)\s*(.*)$/);
    if (!arrowMatch) {
      return {
        success: false,
        error: `Syntax error on line ${lineIndex + 1}: "${line}". Expected format like "A -> α | β".`,
      };
    }

    const lhs = arrowMatch[1].trim();
    const rhsAll = arrowMatch[2].trim();

    if (!lhs) {
      return {
        success: false,
        error: `Missing variable on left side of arrow on line ${lineIndex + 1}.`,
      };
    }

    if (!startVariable) {
      startVariable = lhs;
    }
    variablesSet.add(lhs);

    // Split alternatives by '|'
    const alternatives = rhsAll.split('|').map(a => a.trim());
    if (alternatives.length === 0 || (alternatives.length === 1 && alternatives[0] === '')) {
      // Empty RHS implies ε
      productions.push({
        lhs,
        rhs: [],
        rawRhs: 'ε',
      });
      continue;
    }

    for (const alt of alternatives) {
      const tokens = tokenizeRhs(alt);
      productions.push({
        lhs,
        rhs: tokens,
        rawRhs: tokens.length === 0 ? 'ε' : tokens.join(''),
      });
    }
  }

  // Now classify all symbols in RHS: if in variablesSet, it's a variable; otherwise, terminal
  for (const prod of productions) {
    for (const sym of prod.rhs) {
      if (/^[A-Z]/.test(sym) && !terminalsSet.has(sym)) {
        variablesSet.add(sym);
      } else if (!variablesSet.has(sym)) {
        terminalsSet.add(sym);
      }
    }
  }

  if (!startVariable) {
    return {
      success: false,
      error: 'No valid start variable found in CFG.',
    };
  }

  return {
    success: true,
    cfg: {
      variables: Array.from(variablesSet),
      terminals: Array.from(terminalsSet),
      productions,
      startVariable,
      raw: input,
    },
  };
}
