import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatLatexStack } from '../core/format';
import { MathView } from './MathView';

interface StackViewProps {
  stack: string[];
  maxVisible?: number;
}

export const StackView: React.FC<StackViewProps> = ({ stack, maxVisible = 10 }) => {
  // stack[0] is TOP. Display top at top, bottom at bottom.
  const displayStack = stack.slice(0, maxVisible);
  const truncatedCount = stack.length - displayStack.length;

  return (
    <div className="flex flex-col h-full bg-paper-3 p-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-rule">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <h3 className="font-body font-medium text-xs text-ink">
            Stack Inspector
          </h3>
        </div>
        <div className="text-xs text-muted flex items-center gap-1.5 font-body">
          <span>Depth:</span>
          <span className="font-mono tabular-nums font-semibold text-ink px-1.5 py-0.5 rounded-xs border border-rule bg-paper">{stack.length}</span>
        </div>
      </div>

      {/* Stack Frames Area */}
      <div className="flex-1 flex flex-col justify-end items-center py-1 px-0.5 overflow-hidden min-h-[240px]">
        {truncatedCount > 0 && (
          <div className="text-[11px] text-muted mb-1 flex items-center gap-1">
            <span>↓</span>
            <span className="font-mono tabular-nums">+{truncatedCount}</span>
            <span>deeper in stack</span>
          </div>
        )}

        <div className="w-full flex flex-col items-center">
          {stack.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="w-full py-7 rounded border border-dashed border-rule text-center text-xs text-muted font-body"
            >
              Empty stack (ε)
            </motion.div>
          ) : (
            <div className="w-full flex flex-col space-y-1">
              <AnimatePresence initial={false} mode="popLayout">
                {displayStack.map((symbol, idx) => {
                  const isTop = idx === 0;
                  const isBase = idx === stack.length - 1;
                  const itemKey = `frame_${stack.length - idx}_${symbol}`;

                  return (
                    <motion.div
                      key={itemKey}
                      layout
                      initial={{ opacity: 0, y: -8, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className={`relative w-full py-1.5 px-2.5 rounded border text-xs flex items-center justify-between transition-colors duration-150 ${
                        isTop
                          ? 'bg-accent text-accent-ink border-accent font-medium'
                          : isBase && symbol === 'Z0'
                          ? 'bg-paper-2 text-ink border-rule'
                          : 'bg-paper text-ink border-rule'
                      }`}
                    >
                      {/* Left: Stack Offset */}
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-mono tabular-nums ${isTop ? 'opacity-80' : 'text-muted'}`}>
                          [{stack.length - 1 - idx}]
                        </span>
                        <span className="text-sm font-semibold font-mono">
                          <MathView math={formatLatexStack(symbol)} />
                        </span>
                      </div>

                      {/* Right: Tag */}
                      <div className="flex items-center gap-1">
                        {isTop && (
                          <span className="text-[10px] font-body px-1.5 py-0.5 rounded-xs bg-paper/20 text-accent-ink border border-accent-ink/30">
                            SP (Top)
                          </span>
                        )}
                        {!isTop && symbol === 'Z0' && (
                          <span className="text-[10px] font-body px-1.5 py-0.5 rounded-xs bg-paper-3 text-muted border border-rule">
                            Base (Z₀)
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Stack Base Boundary */}
          <div className="w-full mt-2 pt-1.5 border-t border-rule flex items-center justify-between px-1 text-[11px] font-body text-muted">
            <span className="font-mono text-[10px]">Base (Z₀)</span>
            <span>Bottom of stack</span>
          </div>
        </div>
      </div>

      {/* Summary Tape Representation */}
      <div className="mt-2 pt-2 border-t border-rule text-xs flex items-center justify-between">
        <span className="text-muted">Contents:</span>
        <span className="font-mono font-medium text-ink truncate max-w-[140px]">
          {stack.length === 0 ? 'ε' : stack.join('')}
        </span>
      </div>
    </div>
  );
};
