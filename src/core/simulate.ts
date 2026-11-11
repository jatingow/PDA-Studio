/**
 * Pure TypeScript Pushdown Automaton (PDA) simulation engine.
 * Supports non-determinism, ε-transitions, loop protection via visited sets,
 * configurable step limits, and stack-size caps.
 */

import { PDA, Config, SimulationStep, SimulationResult, Transition, cleanPushSymbols, formatPush } from './pda';

export interface SimulateOptions {
  maxSteps?: number;
  maxStackDepth?: number;
  maxSampleBranches?: number;
}

const DEFAULT_MAX_STEPS = 10000;
const DEFAULT_MAX_STACK_DEPTH = 500;

/**
 * Checks whether a configuration satisfies the acceptance condition of the PDA.
 */
export function isAcceptingConfig(config: Config, pda: PDA): boolean {
  if (config.remaining.length !== 0) {
    return false;
  }

  if (pda.acceptBy === 'emptyStack') {
    return config.stack.length === 0;
  }

  // acceptBy === 'finalState'
  return pda.finals.includes(config.state);
}

/**
 * Creates a unique signature string for a configuration.
 */
export function configSignature(config: Config): string {
  return `${config.state}#${config.remaining}#${config.stack.join(',')}`;
}

/**
 * Checks whether a transition can be applied to a given configuration.
 */
export function canApplyTransition(t: Transition, config: Config): boolean {
  if (t.from !== config.state) {
    return false;
  }

  // Input matching: either ε or matches the first character of remaining input
  if (t.input !== 'ε' && t.input !== '') {
    if (config.remaining.length === 0 || config.remaining[0] !== t.input) {
      return false;
    }
  }

  // Stack matching: either ε or matches top of stack
  if (t.pop !== 'ε' && t.pop !== '') {
    if (config.stack.length === 0 || config.stack[0] !== t.pop) {
      return false;
    }
  }

  return true;
}

/**
 * Applies a transition to a configuration, producing a new configuration.
 */
export function applyTransition(t: Transition, config: Config): Config {
  // Consume input symbol if not ε
  const nextRemaining = (t.input !== 'ε' && t.input !== '')
    ? config.remaining.slice(1)
    : config.remaining;

  // Pop from stack if not ε
  const restStack = (t.pop !== 'ε' && t.pop !== '')
    ? config.stack.slice(1)
    : config.stack;

  // Push new symbols (push[0] becomes new top of stack)
  const pushSymbols = cleanPushSymbols(t.push);
  const nextStack = [...pushSymbols, ...restStack];

  return {
    state: t.to,
    remaining: nextRemaining,
    stack: nextStack,
  };
}

interface BFSNode {
  config: Config;
  path: SimulationStep[];
  depth: number;
}

/**
 * Simulates a PDA on an input string using Breadth-First Search (BFS).
 * Finds the shortest accepting path if one exists.
 */
export function simulatePDA(
  pda: PDA,
  inputString: string,
  options: SimulateOptions = {}
): SimulationResult {
  const maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;
  const maxStackDepth = options.maxStackDepth ?? DEFAULT_MAX_STACK_DEPTH;
  const maxSampleBranches = options.maxSampleBranches ?? 20;

  // Validate start configuration
  const initialStack = pda.startStack ? [pda.startStack] : [];
  const initialConfig: Config = {
    state: pda.start,
    remaining: inputString,
    stack: initialStack,
  };

  const initialStep: SimulationStep = {
    config: initialConfig,
    stepNumber: 0,
    description: `Initial configuration: State ${initialConfig.state}, Input "${initialConfig.remaining}", Stack [${initialConfig.stack.join(', ')}]`,
  };

  // Check if initial configuration itself is accepting
  if (isAcceptingConfig(initialConfig, pda)) {
    return {
      accepted: true,
      acceptingPath: [initialStep],
      totalStepsExplored: 1,
      reason: `Accepted at start configuration: remaining input is empty and ${
        pda.acceptBy === 'emptyStack' ? 'stack is empty' : `state '${initialConfig.state}' is in final states`
      }.`,
      allBranches: [[initialStep]],
    };
  }

  const queue: BFSNode[] = [{
    config: initialConfig,
    path: [initialStep],
    depth: 0,
  }];

  const visited = new Set<string>();
  visited.add(configSignature(initialConfig));

  let totalStepsExplored = 0;
  let bestPath: SimulationStep[] = [initialStep];
  let mostCharsConsumed = 0;
  const sampledDeadEnds: SimulationStep[][] = [];
  let limitReached = false;

  while (queue.length > 0) {
    if (totalStepsExplored >= maxSteps) {
      limitReached = true;
      break;
    }

    const current = queue.shift()!;
    totalStepsExplored++;

    // Track best path so far for feedback on reject
    const consumed = inputString.length - current.config.remaining.length;
    if (consumed > mostCharsConsumed || (consumed === mostCharsConsumed && current.path.length > bestPath.length)) {
      mostCharsConsumed = consumed;
      bestPath = current.path;
    }

    // Find all applicable transitions from current state
    const applicableTransitions = pda.transitions.filter(t => canApplyTransition(t, current.config));

    if (applicableTransitions.length === 0) {
      // Dead end
      if (sampledDeadEnds.length < maxSampleBranches) {
        sampledDeadEnds.push(current.path);
      }
      continue;
    }

    for (const t of applicableTransitions) {
      const nextConfig = applyTransition(t, current.config);

      // Stack size cap to guard against unbounded push loops
      if (nextConfig.stack.length > maxStackDepth) {
        continue;
      }

      const sig = configSignature(nextConfig);
      if (visited.has(sig)) {
        continue;
      }
      visited.add(sig);

      const actionDesc = `${t.from} → ${t.to} on read '${t.input}', pop '${t.pop}', push '${formatPush(t.push)}'`;
      const nextStep: SimulationStep = {
        config: nextConfig,
        transitionUsed: t,
        stepNumber: current.path.length,
        description: actionDesc,
      };

      const nextPath = [...current.path, nextStep];

      // Check for acceptance immediately when target config is generated
      if (isAcceptingConfig(nextConfig, pda)) {
        return {
          accepted: true,
          acceptingPath: nextPath,
          totalStepsExplored,
          reason: `Accepted in ${nextPath.length - 1} transitions: entire input consumed and ${
            pda.acceptBy === 'emptyStack'
              ? 'stack is empty'
              : `reached final state '${nextConfig.state}'`
          }.`,
          allBranches: [nextPath, ...sampledDeadEnds.slice(0, 5)],
        };
      }

      queue.push({
        config: nextConfig,
        path: nextPath,
        depth: current.depth + 1,
      });
    }
  }

  // If we exited without accepting
  const reason = limitReached
    ? `Simulation reached limit of ${maxSteps} configurations without reaching an accepting state.`
    : `Rejected: all explored execution branches halted (${totalStepsExplored} configurations checked). Consumed ${mostCharsConsumed} of ${inputString.length} characters.`;

  return {
    accepted: false,
    acceptingPath: bestPath,
    totalStepsExplored,
    reason,
    allBranches: sampledDeadEnds.slice(0, 10),
  };
}
