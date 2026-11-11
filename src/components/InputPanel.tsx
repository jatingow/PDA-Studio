import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Cpu,
} from 'lucide-react';
import { usePdaStore } from '../store/usePdaStore';
import { parseLanguageInput, SUPPORTED_PATTERNS_LIST } from '../core/langParser';
import { generatePDAFromParsed } from '../core/templates';
import { parseCFG } from '../core/cfgParser';
import { convertCFGToPDA } from '../core/cfgToPda';
import { PDA } from '../core/pda';
import { MathView } from './MathView';

export const InputPanel: React.FC = () => {
  const {
    pda,
    setPDA,
    inputString,
    setInputString,
    simulationResult,
    currentStepIndex,
    isPlaying,
    togglePlay,
    stepForward,
    stepBackward,
    resetSimulation,
    runSimulation,
    playSpeed,
    setPlaySpeed,
    isNondeterministic,
    ndReasons,
  } = usePdaStore();

  const [activeTab, setActiveTab] = useState<'guided' | 'free' | 'cfg'>('guided');

  // Guided form state
  const [patternType, setPatternType] = useState<string>('an_bn_gen');
  const [pVal, setPVal] = useState<number>(2);
  const [qVal, setQVal] = useState<number>(1);
  const [constraintN, setConstraintN] = useState<number>(1); // n >= 1
  const [compOp, setCompOp] = useState<'<' | '>' | '≠'>('<');

  // Free text state
  const [freeInput, setFreeInput] = useState<string>('a^2n b^n, n >= 1');
  const [freeError, setFreeError] = useState<string | null>(null);

  // CFG state
  const [cfgText, setCfgText] = useState<string>('S -> aSb | ab');
  const [cfgError, setCfgError] = useState<string | null>(null);

  // Guided Preview Formula
  const getGuidedPreviewFormula = () => {
    if (patternType === 'an_bn_gen') {
      const p = Math.max(1, pVal || 1);
      const q = Math.max(1, qVal || 1);
      const pStr = p === 1 ? '' : p.toString();
      const qStr = q === 1 ? '' : q.toString();
      return `L = \\{ a^{${pStr}n} b^{${qStr}n} \\mid n \\ge ${constraintN} \\}`;
    }
    if (patternType === 'an_bm_cnpm') {
      return `L = \\{ a^n b^m c^{n+m} \\mid n, m \\ge ${constraintN} \\}`;
    }
    if (patternType === 'an_bn_cm') {
      return `L = \\{ a^n b^n c^m \\mid n, m \\ge ${constraintN} \\}`;
    }
    if (patternType === 'ai_bj') {
      const opLatex = compOp === '≠' ? '\\neq' : compOp;
      return `L = \\{ a^i b^j \\mid i ${opLatex} j, i, j \\ge ${constraintN} \\}`;
    }
    if (patternType === 'ww_r') {
      return `L = \\{ w w^R \\mid w \\in \\{a, b\\}^* \\}`;
    }
    if (patternType === 'wcw_r') {
      return `L = \\{ w c w^R \\mid w \\in \\{a, b\\}^* \\}`;
    }
    if (patternType === 'equal_ab') {
      return `L = \\{ w \\in \\{a, b\\}^* \\mid N_a(w) = N_b(w) \\}`;
    }
    return `L = \\{ w \\mid w \\text{ has balanced parentheses} \\}`;
  };

  // Handle Guided Form Generation
  const handleGenerateGuided = () => {
    let pdaGenerated: PDA;
    if (patternType === 'an_bn_gen') {
      const p = Math.max(1, pVal || 1);
      const q = Math.max(1, qVal || 1);
      const parse = parseLanguageInput(`a^${p === 1 ? '' : p}n b^${q === 1 ? '' : q}n, n >= ${constraintN}`);
      pdaGenerated = generatePDAFromParsed(parse.parsed!);
    } else if (patternType === 'an_bm_cnpm') {
      const parse = parseLanguageInput(`a^n b^m c^(n+m), n >= ${constraintN}`);
      pdaGenerated = generatePDAFromParsed(parse.parsed!);
    } else if (patternType === 'an_bn_cm') {
      const parse = parseLanguageInput(`a^n b^n c^m, n >= ${constraintN}`);
      pdaGenerated = generatePDAFromParsed(parse.parsed!);
    } else if (patternType === 'ai_bj') {
      const parse = parseLanguageInput(`a^i b^j with i ${compOp} j, i >= ${constraintN}`);
      pdaGenerated = generatePDAFromParsed(parse.parsed!);
    } else if (patternType === 'ww_r') {
      const parse = parseLanguageInput('w w^R');
      pdaGenerated = generatePDAFromParsed(parse.parsed!);
    } else if (patternType === 'wcw_r') {
      const parse = parseLanguageInput('w c w^R');
      pdaGenerated = generatePDAFromParsed(parse.parsed!);
    } else if (patternType === 'equal_ab') {
      const parse = parseLanguageInput('equal number of a and b');
      pdaGenerated = generatePDAFromParsed(parse.parsed!);
    } else {
      const parse = parseLanguageInput('balanced parentheses');
      pdaGenerated = generatePDAFromParsed(parse.parsed!);
    }

    setPDA(pdaGenerated);
  };

  // Handle Free-Text Generation
  const handleGenerateFree = () => {
    setFreeError(null);
    const res = parseLanguageInput(freeInput);
    if (!res.success || !res.parsed) {
      setFreeError(res.error || 'This language pattern is not supported.');
      return;
    }
    const pdaGenerated = generatePDAFromParsed(res.parsed);
    setPDA(pdaGenerated);
  };

  // Handle CFG Conversion
  const handleConvertCFG = () => {
    setCfgError(null);
    const parse = parseCFG(cfgText);
    if (!parse.success || !parse.cfg) {
      setCfgError(parse.error || 'Failed to parse grammar.');
      return;
    }
    const { pda: pdaGenerated } = convertCFGToPDA(parse.cfg);
    setPDA(pdaGenerated);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Input Mode Selector Container */}
      <div className="bg-paper-2 border border-rule rounded-lg p-3 shadow-none">
        {/* Segmented Controls */}
        <div className="flex items-center p-0.5 rounded-md bg-paper-3 border border-rule text-xs font-body">
          <button
            type="button"
            onClick={() => setActiveTab('guided')}
            className={`flex-1 py-1.5 px-2 text-center rounded transition-colors duration-150 cursor-pointer ${
              activeTab === 'guided'
                ? 'bg-paper text-ink font-semibold border border-rule shadow-xs'
                : 'text-muted hover:text-ink'
            }`}
          >
            Templates
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('free')}
            className={`flex-1 py-1.5 px-2 text-center rounded transition-colors duration-150 cursor-pointer ${
              activeTab === 'free'
                ? 'bg-paper text-ink font-semibold border border-rule shadow-xs'
                : 'text-muted hover:text-ink'
            }`}
          >
            Expression
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cfg')}
            className={`flex-1 py-1.5 px-2 text-center rounded transition-colors duration-150 cursor-pointer ${
              activeTab === 'cfg'
                ? 'bg-paper text-ink font-semibold border border-rule shadow-xs'
                : 'text-muted hover:text-ink'
            }`}
          >
            Grammar
          </button>
        </div>

        {/* Tab 1: Guided Form */}
        {activeTab === 'guided' && (
          <div className="mt-3 space-y-2.5">
            <div>
              <label className="block text-xs font-body text-muted mb-1">
                Language Pattern Preset
              </label>
              <select
                value={patternType}
                onChange={e => setPatternType(e.target.value)}
                className="w-full text-xs font-body py-1.5 px-2 rounded-md border border-rule bg-paper text-ink focus-visible:outline-2 focus-visible:outline-focus cursor-pointer"
              >
                <option value="an_bn_gen">a^(p·n) b^(q·n) (generalized)</option>
                <option value="an_bm_cnpm">a^n b^m c^(n+m)</option>
                <option value="an_bn_cm">a^n b^n c^m</option>
                <option value="ai_bj">a^i b^j with comparison (i &lt; j, i &gt; j, i ≠ j)</option>
                <option value="ww_r">w w^R (even palindromes)</option>
                <option value="wcw_r">w c w^R (odd palindromes with center marker c)</option>
                <option value="equal_ab">Equal count: N_a(w) = N_b(w)</option>
                <option value="balanced_parens">Balanced parentheses Dyck language</option>
              </select>
            </div>

            {/* Coefficients for a^(pn) b^(qn) */}
            {patternType === 'an_bn_gen' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-body text-muted mb-0.5">
                    Exponent Multiplier p
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={pVal}
                    onChange={e => setPVal(parseInt(e.target.value, 10) || 1)}
                    className="w-full text-xs py-1.5 px-2 rounded-md border border-rule bg-paper font-mono text-ink tabular-nums focus-visible:outline-2 focus-visible:outline-focus"
                  />
                </div>
                <div>
                  <label className="block text-xs font-body text-muted mb-0.5">
                    Exponent Multiplier q
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={qVal}
                    onChange={e => setQVal(parseInt(e.target.value, 10) || 1)}
                    className="w-full text-xs py-1.5 px-2 rounded-md border border-rule bg-paper font-mono text-ink tabular-nums focus-visible:outline-2 focus-visible:outline-focus"
                  />
                </div>
              </div>
            )}

            {/* Comparison selector for a^i b^j */}
            {patternType === 'ai_bj' && (
              <div>
                <label className="block text-xs font-body text-muted mb-0.5">
                  Comparison Constraint
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['<', '>', '≠'] as const).map(op => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setCompOp(op)}
                      className={`py-1 rounded text-xs font-mono font-medium border transition-colors duration-150 cursor-pointer ${
                        compOp === op
                          ? 'bg-accent text-accent-ink border-accent font-bold'
                          : 'bg-paper border-rule text-ink hover:border-muted'
                      }`}
                    >
                      i {op} j
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Constraint n >= 1 vs n >= 0 */}
            {(patternType === 'an_bn_gen' || patternType === 'an_bm_cnpm' || patternType === 'an_bn_cm' || patternType === 'ai_bj') && (
              <div>
                <label className="block text-xs font-body text-muted mb-0.5">
                  Lower Bound Constraint
                </label>
                <select
                  value={constraintN}
                  onChange={e => setConstraintN(parseInt(e.target.value, 10))}
                  className="w-full text-xs py-1.5 px-2 rounded-md border border-rule bg-paper font-body text-ink cursor-pointer focus-visible:outline-2 focus-visible:outline-focus"
                >
                  <option value="1">n ≥ 1 (reject ε)</option>
                  <option value="0">n ≥ 0 (accept ε)</option>
                </select>
              </div>
            )}

            {/* Mathematical Formula Preview Box */}
            <div className="p-2 rounded-md border border-rule bg-paper-3 text-center text-xs">
              <MathView math={getGuidedPreviewFormula()} />
            </div>

            <button
              type="button"
              onClick={handleGenerateGuided}
              className="w-full py-2 px-3 rounded-md bg-accent text-accent-ink hover:opacity-90 border border-accent text-xs font-body font-medium transition-opacity duration-150 flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Compile Automaton</span>
            </button>
          </div>
        )}

        {/* Tab 2: Free Text Form */}
        {activeTab === 'free' && (
          <div className="mt-3 space-y-2.5">
            <div>
              <label className="block text-xs font-body text-muted mb-1">
                Language Expression
              </label>
              <input
                type="text"
                value={freeInput}
                onChange={e => setFreeInput(e.target.value)}
                placeholder={'e.g. a^2n b^n, a^n b^m c^(n+m), w w^R'}
                className="w-full text-xs py-1.5 px-2.5 rounded-md border border-rule bg-paper text-ink font-mono focus-visible:outline-2 focus-visible:outline-focus"
              />
            </div>

            {/* Quick chips */}
            <div>
              <span className="text-xs font-body text-muted">
                Presets:
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {['a^2n b^n', 'a^n b^n', 'a^n b^2n', 'w w^R', 'a^i b^j with i < j', 'equal a and b'].map(pat => (
                  <button
                    key={pat}
                    type="button"
                    onClick={() => setFreeInput(pat)}
                    className="text-xs px-2 py-0.5 rounded border border-rule bg-paper text-ink hover:border-accent hover:text-accent font-mono transition-colors duration-150 cursor-pointer"
                  >
                    {pat}
                  </button>
                ))}
              </div>
            </div>

            {freeError && (
              <div className="p-2.5 rounded-md border border-error bg-paper-3 text-error text-xs font-body">
                <div className="font-semibold flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{freeError}</span>
                </div>
                <div className="text-[11px] text-muted">
                  Supported: {SUPPORTED_PATTERNS_LIST.slice(0, 3).join(', ')}…
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerateFree}
              className="w-full py-2 px-3 rounded-md bg-accent text-accent-ink hover:opacity-90 border border-accent text-xs font-body font-medium transition-opacity duration-150 flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Compile Expression</span>
            </button>
          </div>
        )}

        {/* Tab 3: CFG -> PDA */}
        {activeTab === 'cfg' && (
          <div className="mt-3 space-y-2.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-body text-muted">
                  Production Rules (CFG)
                </label>
                <span className="text-[11px] font-body text-muted">Variables uppercase (S, A), terminals lowercase</span>
              </div>
              <textarea
                rows={4}
                value={cfgText}
                onChange={e => setCfgText(e.target.value)}
                placeholder={'S -> aSb | ab'}
                className="w-full text-xs p-2 rounded-md border border-rule bg-paper text-ink font-mono focus-visible:outline-2 focus-visible:outline-focus"
              />
            </div>

            {/* Presets */}
            <div>
              <span className="text-xs font-body text-muted">
                Examples:
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                <button
                  type="button"
                  onClick={() => setCfgText('S -> aSb | ab')}
                  className="text-xs px-2 py-0.5 rounded border border-rule bg-paper text-ink hover:border-accent font-mono transition-colors duration-150 cursor-pointer"
                >
                  S → aSb | ab
                </button>
                <button
                  type="button"
                  onClick={() => setCfgText('S -> ( S ) | S S | ε')}
                  className="text-xs px-2 py-0.5 rounded border border-rule bg-paper text-ink hover:border-accent font-mono transition-colors duration-150 cursor-pointer"
                >
                  S → (S) | SS | ε
                </button>
                <button
                  type="button"
                  onClick={() => setCfgText('S -> aSa | bSb | ε')}
                  className="text-xs px-2 py-0.5 rounded border border-rule bg-paper text-ink hover:border-accent font-mono transition-colors duration-150 cursor-pointer"
                >
                  S → aSa | bSb | ε
                </button>
              </div>
            </div>

            {cfgError && (
              <div className="p-2 rounded-md border border-error bg-paper-3 text-error text-xs font-body">
                {cfgError}
              </div>
            )}

            <button
              type="button"
              onClick={handleConvertCFG}
              className="w-full py-2 px-3 rounded-md bg-accent text-accent-ink hover:opacity-90 border border-accent text-xs font-body font-medium transition-opacity duration-150 flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Compile Grammar to PDA</span>
            </button>
          </div>
        )}
      </div>

      {/* Non-determinism Warning Banner */}
      {isNondeterministic && (
        <div className="p-2.5 rounded-lg border border-accent bg-paper-3 text-ink text-xs font-body">
          <div className="flex items-center gap-1.5 font-semibold text-accent mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>Nondeterministic Automaton (NPDA)</span>
          </div>
          <p className="text-xs text-ink-2 mb-1 leading-normal">
            Automaton contains branch paths or concurrent ε-transitions. Shortest accepting path evaluated via Breadth-First Search (BFS).
          </p>
          {ndReasons.length > 0 && (
            <div className="text-[11px] font-mono text-muted bg-paper p-1 rounded border border-rule">
              {ndReasons[0]}
            </div>
          )}
        </div>
      )}

      {/* Test String & Hardware Playback Control Panel */}
      <div className="bg-paper-2 border border-rule rounded-lg p-3.5 shadow-none space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-body font-medium text-ink">
            Test Input (w)
          </span>

          {/* Quick Alphabet Insert */}
          <div className="flex items-center gap-1 font-mono text-xs">
            <span className="text-xs font-body text-muted">Σ:</span>
            {pda.inputAlphabet.map(sym => (
              <button
                key={sym}
                type="button"
                onClick={() => setInputString(inputString + sym)}
                className="w-5 h-5 rounded-xs border border-rule bg-paper hover:border-accent hover:text-accent text-ink font-mono font-medium transition-colors duration-150 cursor-pointer"
                title={`Append '${sym}'`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Input String Field with Run button */}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={inputString}
            onChange={e => setInputString(e.target.value)}
            placeholder={'Input string (e.g. aaaabb)'}
            className="flex-1 text-xs py-1.5 px-2.5 rounded-md border border-rule bg-paper font-mono text-ink focus-visible:outline-2 focus-visible:outline-focus"
          />
          <button
            type="button"
            onClick={runSimulation}
            className="py-1.5 px-3 rounded-md bg-accent text-accent-ink hover:opacity-90 border border-accent text-xs font-body font-medium shrink-0 transition-opacity duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus"
            title="Instant run to completion (Enter)"
          >
            Run
          </button>
        </div>

        {/* Transport Controller Bar */}
        <div className="flex items-center justify-between p-1.5 rounded-md border border-rule bg-paper-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={resetSimulation}
              className="p-1 rounded border border-transparent hover:border-rule text-muted hover:text-ink transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus"
              title="Reset execution (Step 0)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={stepBackward}
              disabled={currentStepIndex === 0}
              className="p-1 rounded border border-transparent hover:border-rule text-muted hover:text-ink disabled:opacity-30 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus"
              title="Step backward (Left arrow)"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className={`p-1.5 rounded font-body font-medium flex items-center justify-center transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus ${
                isPlaying
                  ? 'bg-accent text-accent-ink border border-accent'
                  : 'bg-paper border border-rule text-ink hover:border-muted'
              }`}
              title={isPlaying ? 'Pause playback (Space)' : 'Start playback (Space)'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={stepForward}
              disabled={!simulationResult || currentStepIndex >= simulationResult.acceptingPath.length - 1}
              className="p-1 rounded border border-transparent hover:border-rule text-muted hover:text-ink disabled:opacity-30 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus"
              title="Step forward (Right arrow)"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Speed slider */}
          <div className="flex items-center gap-1.5 text-xs font-body text-muted">
            <span className="font-mono tabular-nums">{playSpeed}ms</span>
            <input
              type="range"
              min="200"
              max="1500"
              step="100"
              value={playSpeed}
              onChange={e => setPlaySpeed(parseInt(e.target.value, 10))}
              className="w-16 accent-accent cursor-pointer"
              title={`Playback interval: ${playSpeed}ms`}
            />
          </div>
        </div>

        {/* Execution Result Banner */}
        {simulationResult && (
          <div
            className={`p-2.5 rounded-md border flex items-start gap-2 transition-colors duration-150 text-xs font-body ${
              simulationResult.accepted
                ? 'bg-paper-3 border-success text-ink'
                : 'bg-paper-3 border-error text-ink'
            }`}
          >
            {simulationResult.accepted ? (
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
            )}

            <div className="flex-1">
              <div className="font-semibold text-xs mb-0.5 flex items-center gap-1.5">
                <span>Result:</span>
                <span className={simulationResult.accepted ? 'text-success font-bold' : 'text-error font-bold'}>
                  {simulationResult.accepted ? 'Accepted' : 'Rejected'}
                </span>
              </div>
              <p className="text-xs text-ink-2 leading-tight">
                {simulationResult.reason}
              </p>
              <div className="mt-1 text-[11px] text-muted flex items-center gap-2">
                <span>Path: <span className="font-mono tabular-nums text-ink">{simulationResult.acceptingPath.length - 1}</span> steps</span>
                <span>•</span>
                <span>Explored: <span className="font-mono tabular-nums text-ink">{simulationResult.totalStepsExplored}</span> configurations</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
