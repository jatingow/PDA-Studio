import React from 'react';

interface TapeViewProps {
  inputString: string;
  remaining: string;
}

export const TapeView: React.FC<TapeViewProps> = ({ inputString, remaining }) => {
  const consumedCount = inputString.length - remaining.length;
  const isFinished = remaining.length === 0;
  const cells = inputString.split('');

  return (
    <div className="w-full bg-paper px-3.5 py-2.5 flex flex-col gap-1.5 select-none border-t border-rule">
      {/* Tape Strip Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-2" />
          <span className="font-body font-medium text-xs text-ink">
            Input Buffer
          </span>
        </div>
        <div className="text-xs text-muted flex items-center gap-1.5 font-body">
          <span>Offset:</span>
          <span className="font-mono tabular-nums text-ink font-medium px-1.5 py-0.5 rounded-xs border border-rule bg-paper">{consumedCount}</span>
          <span>/</span>
          <span className="font-mono tabular-nums text-ink font-medium">{inputString.length}</span>
        </div>
      </div>

      {inputString.length === 0 ? (
        <div className="py-2 text-center text-xs font-body text-muted">
          Empty input string (ε)
        </div>
      ) : (
        <div className="flex flex-col items-center py-0.5 overflow-x-auto">
          {/* Input Character Stream Strip */}
          <div className="inline-flex items-center rounded border border-rule bg-paper-3 divide-x divide-rule overflow-hidden">
            {/* Start of tape marker */}
            <div className="w-8 h-8 flex items-center justify-center font-mono text-xs text-muted bg-paper-2 select-none" title="Start of input">
              ⊢
            </div>

            {cells.map((char, idx) => {
              const isConsumed = idx < consumedCount;
              const isCurrent = idx === consumedCount;

              return (
                <div
                  key={`cell_${idx}`}
                  className={`relative w-8 h-8 flex flex-col items-center justify-center font-mono text-xs transition-colors duration-150 ${
                    isCurrent
                      ? 'bg-accent text-accent-ink font-bold z-10'
                      : isConsumed
                      ? 'bg-paper-3 text-muted-2 line-through'
                      : 'bg-paper text-ink'
                  }`}
                >
                  <span className="text-xs">{char}</span>
                  <span className={`text-[9px] font-mono tabular-nums ${isCurrent ? 'opacity-80' : 'text-muted'}`}>
                    {idx}
                  </span>
                </div>
              );
            })}

            {/* End of Input marker ($) */}
            <div
              className={`w-8 h-8 flex flex-col items-center justify-center font-mono text-xs font-medium transition-colors duration-150 ${
                isFinished
                  ? 'bg-success text-accent-ink font-bold'
                  : 'bg-paper-2 text-muted'
              }`}
              title="End of input marker ($)"
            >
              <span>$</span>
              <span className="text-[9px] font-body text-muted">end</span>
            </div>
          </div>

          {/* Cursor Pointer */}
          <div className="flex items-center mt-1 h-4 text-xs font-body text-muted">
            <span className="inline-flex items-center gap-1 font-medium text-accent-2">
              <span className="text-[9px]">▲</span>
              <span>Cursor: {isFinished ? 'At end ($)' : `Reading symbol '${inputString[consumedCount]}'`}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
