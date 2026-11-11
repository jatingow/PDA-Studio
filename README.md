# ⚡ PDA Studio

> **Pushdown Automaton (PDA) Simulator & Generator**  
> A fully client-side interactive web application for Theory of Computation / Formal Languages and Automata Theory courses.

---

## 🌟 Overview

**PDA Studio** is an educational tool and simulator for Pushdown Automata (PDAs). It bridges abstract automata theory with dynamic visual simulation:
- **Language to PDA**: Generates provably correct PDAs from language specifications such as $a^{2n} b^n$, $a^n b^{2n}$, $a^n b^m c^{n+m}$, $w w^R$, $a^i b^j$ ($i < j$), and more.
- **CFG to PDA**: Implements standard textbook context-free grammar to pushdown automaton conversion.
- **Interactive Step-by-Step Simulation**: Breadth-First Search (BFS) engine exploring all non-deterministic branches, handling $\varepsilon$-transitions, and guarding against infinite loops.
- **Textbook Solution Output**:
  - **Formal 7-tuple definition**: $P = (Q, \Sigma, \Gamma, \delta, q_0, Z_0, F)$ rendered in KaTeX.
  - **Grouped Transition Function**: Grouped by $\text{PUSH}$, $\text{POP}$, and $\text{NO-CHANGE}$ transitions.
  - **State Transition Diagram**: Interactive Cytoscape.js diagram with curved labeled edges, self-loops, double-circle final states, start arrow, live highlighting, and PNG/SVG export.
  - **Instantaneous Description (ID) Trace**: Textbook $(q, w, \alpha) \vdash \dots$ derivation chain with one-click "Copy as LaTeX" and clickable seeking.
  - **Live Animated Stack**: Push and pop animations powered by Framer Motion, with a distinct $\text{TOP}$ indicator and depth counter.
  - **Input Tape & Read Head**: Visual tape cells with head pointer tracking consumed, current, and remaining input symbols.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+ recommended)
- npm or pnpm

### Installation & Development
```bash
# Navigate to the project directory
cd pda-studio

# Install dependencies
npm install

# Start development server
npm run dev
```

### Running Unit Tests
```bash
# Run Vitest test suites
npm test
```

### Building for Production
```bash
# TypeScript verification + Vite production build
npm run build
```

---

## 📐 Features & Architecture

```
pda-studio/
├── src/
│   ├── core/                  # Pure TypeScript automata logic (Zero React imports)
│   │   ├── pda.ts             # Data models: PDA, Transition, Config, SimulationStep
│   │   ├── simulate.ts        # BFS simulation engine, loop detection, branch explorer
│   │   ├── langParser.ts      # Parses patterns like a^2n b^n, w w^R, equal a and b
│   │   ├── templates.ts       # PDA generators for generalized patterns
│   │   ├── cfgParser.ts       # Context-Free Grammar parser (S -> aSb | ab)
│   │   ├── cfgToPda.ts        # Standard CFG -> PDA conversion algorithm
│   │   ├── format.ts          # LaTeX & textbook notation formatters
│   │   └── examples.ts        # Built-in curriculum examples catalog
│   ├── components/            # UI components (Tailwind CSS, Cytoscape, KaTeX, Framer Motion)
│   │   ├── Diagram.tsx        # Cytoscape diagram with export & active highlight
│   │   ├── StackView.tsx      # Framer Motion animated vertical pushdown stack
│   │   ├── TapeView.tsx       # Input tape with read head pointer
│   │   ├── TraceView.tsx      # Instantaneous description trace table & LaTeX export
│   │   ├── TuplePanel.tsx     # Formal 7-tuple rendered in KaTeX
│   │   ├── TransitionTable.tsx# Grouped δ transitions (PUSH / POP / NO-CHANGE)
│   │   ├── InputPanel.tsx     # Guided form, free-text box, CFG editor, simulation controls
│   │   ├── ExamplesMenu.tsx   # Built-in examples quick loader
│   │   ├── MathView.tsx       # KaTeX renderer wrapper
│   │   └── Navbar.tsx         # App bar with theme toggle & keyboard shortcut guide
│   ├── store/
│   │   └── usePdaStore.ts     # Zustand state store
│   ├── App.tsx                # Main responsive layout
│   └── main.tsx
└── tests/                     # Unit test suites (Vitest)
    ├── simulate.test.ts       # BFS, loops, acceptance modes
    ├── templates.test.ts      # Template generators & brute-force cross-check up to length 8
    ├── cfg.test.ts            # Grammar parsing & CFG-to-PDA equivalence
    └── format.test.ts         # LaTeX and ID trace formatters
```

---

## 📚 Supported Language Patterns

| Language Pattern | Example Specification | Automaton Type | Description |
|---|---|---|---|
| $a^{p \cdot n} b^{q \cdot n}$ | `a^2n b^n, n >= 1` | DPDA | Pushes $q$ symbols per $a$, pops $p$ symbols per $b$. Rejects $\varepsilon$ when $n \ge 1$. |
| $a^n b^{2n}$ | `a^n b^2n, n >= 1` | DPDA | Pushes 2 symbols for each $a$, pops 1 for each $b$. |
| $a^n b^m c^{n+m}$ | `a^n b^m c^(n+m)` | DPDA | Pushes $A$ on $a$, $B$ on $b$, pops on each $c$. |
| $a^n b^n c^m$ | `a^n b^n c^m` | DPDA | Matches $a^n b^n$ via stack, then reads $c^m$ without changing stack. |
| $a^i b^j$ ($i < j$) | `a^i b^j with i < j` | DPDA | Enforces at least one extra $b$ after stack returns to $Z_0$. |
| $a^i b^j$ ($i > j$) | `a^i b^j with i > j` | DPDA | Requires leftover stack symbols when input is consumed. |
| $a^i b^j$ ($i \neq j$) | `a^i b^j with i != j` | NPDA | Non-deterministic union branching into $i < j$ and $i > j$. |
| $w w^R$ | `w w^R` | NPDA | Even-length palindromes; guesses midpoint on $\varepsilon$-transition. |
| $w c w^R$ | `w c w^R` | DPDA | Odd-length palindromes with center marker $c$. |
| Equal $a$'s and $b$'s | `equal number of a and b` | DPDA | Maintains excess count on stack; accepts when stack is $Z_0$. |
| Balanced Parentheses | `balanced parens` | DPDA | Standard Dyck language: pushes on `(`, pops on `)`. |

*Note: If an unsupported pattern (such as $a^n b^n c^n$, which is non-context-free) is typed, PDA Studio explicitly warns the user and lists all supported patterns without producing an incorrect PDA.*

---

## 🔄 Context-Free Grammar (CFG) to PDA Construction

PDA Studio implements the standard single-state expansion algorithm (Hopcroft & Ullman / Sipser / Linz):

Given a grammar $G = (V, \Sigma, R, S)$:
1. **Start Configuration**:
   $$\delta(q_s, \varepsilon, Z_0) = \{(q, S Z_0)\}$$
   The start state $q_s$ pushes the grammar start symbol $S$ onto the stack above the bottom marker $Z_0$ and transfers control to $q$.
2. **Variable Expansions**:
   For every production rule $A \to \alpha \in R$:
   $$\delta(q, \varepsilon, A) = \{(q, \alpha)\}$$
   Non-terminals on top of the stack are replaced non-deterministically by their right-hand sides without consuming input.
3. **Terminal Matching**:
   For every terminal $a \in \Sigma$:
   $$\delta(q, a, a) = \{(q, \varepsilon)\}$$
   When the top of the stack matches the current input symbol, both are consumed and popped.
4. **Acceptance**:
   $$\delta(q, \varepsilon, Z_0) = \{(q_f, Z_0)\} \quad \text{with } F = \{q_f\}$$
   When the entire input has been matched and the stack is reduced back to $Z_0$, the automaton transitions to the accepting state $q_f$.

---

## 🎓 Theory of Computation Syllabus Mapping

This project maps directly to standard university automata theory curricula (**Unit 3: Pushdown Automata and Context-Free Languages**):

1. **Definition of Pushdown Automata (7-Tuple)**:
   $$P = (Q, \Sigma, \Gamma, \delta, q_0, Z_0, F)$$
   - Formal mathematical rendering in KaTeX.
   - Distinct display of states $Q$, input alphabet $\Sigma$, and stack alphabet $\Gamma$.
2. **Deterministic vs Non-Deterministic PDAs (DPDA vs NPDA)**:
   - PDA Studio automatically tests whether a PDA satisfies determinism conditions.
   - For NPDAs (e.g., $w w^R$ or CFG conversions), a non-determinism warning banner explains the branching points and shows the shortest accepting path found via Breadth-First Search.
3. **Instantaneous Descriptions (IDs)**:
   - Standard notation $(q, w, \alpha)$ where $q \in Q$ is the current state, $w \in \Sigma^*$ is the unread input, and $\alpha \in \Gamma^*$ is the stack contents with the top on the left.
   - Transition relation $\vdash$ and reflexive transitive closure $\vdash^*$.
4. **Equivalence of Acceptance Criteria**:
   - Language accepted by final state: $L(P) = \{w \in \Sigma^* \mid (q_0, w, Z_0) \vdash^* (q, \varepsilon, \alpha) \text{ where } q \in F\}$
   - Language accepted by empty stack: $N(P) = \{w \in \Sigma^* \mid (q_0, w, Z_0) \vdash^* (q, \varepsilon, \varepsilon)\}$
   - Both modes are supported in PDA Studio.
5. **Chomsky Hierarchy Level 2 Equivalence**:
   - Equivalence of languages generated by CFGs and languages accepted by NPDAs.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Description |
|---|---|---|
| <kbd>→</kbd> | Step Forward | Advances simulation by one step along the computation path |
| <kbd>←</kbd> | Step Backward | Reverts simulation to previous configuration |
| <kbd>Space</kbd> | Play / Pause | Starts or pauses animated auto-playback |
| <kbd>Enter</kbd> | Run | Instantly computes the complete simulation trace |

---

## 📸 Screenshots

*(Placeholder for UI screenshots: State Transition Diagram with live highlight, Framer Motion animated stack, tape view, and KaTeX textbook formal derivation)*

---

## 🌐 Deployment

The project is configured with `base: './'` in `vite.config.ts`, making it completely portable and ready for one-click deployment:
- **Vercel**: Connect the repository and select Vite preset.
- **GitHub Pages**: Run `npm run build` and publish the `dist/` directory.

---

## 🧪 Testing Verification

Run the comprehensive unit test suite:
```bash
npm test
```
The test suite validates:
- Simulation of valid and invalid strings on all built-in templates.
- Complete brute-force oracle verification on all strings up to length 8 over $\{a, b\}$.
- Non-determinism and $\varepsilon$-loop detection with visited state pruning.
- Acceptance by final state vs empty stack.
- CFG parsing and CFG-to-PDA equivalence ($S \to aSb \mid ab$, balanced parentheses, palindromes).
- KaTeX 7-tuple and instantaneous description trace formatting.
