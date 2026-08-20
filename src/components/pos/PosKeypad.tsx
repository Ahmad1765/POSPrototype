import React from 'react';
import { Delete } from 'lucide-react';

interface PosKeypadProps {
  onDigitPress: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onAddPreset?: (amount: number) => void;
  disabled?: boolean;
}

export const PosKeypad: React.FC<PosKeypadProps> = ({
  onDigitPress,
  onBackspace,
  onClear,
  onAddPreset,
  disabled = false
}) => {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', '⌫']
  ];

  const presets = [50, 100, 200, 500];

  return (
    <div className="w-full flex flex-col gap-2 sm:gap-3 select-none">
      {/* Quick Amount Presets */}
      {onAddPreset && (
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={disabled}
              onClick={() => onAddPreset(preset)}
              className="py-1 sm:py-1.5 px-1 sm:px-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-750/70 text-zinc-300 hover:text-white text-[11px] sm:text-xs font-mono font-medium transition-all active:scale-95 disabled:opacity-50"
            >
              +₹{preset}
            </button>
          ))}
        </div>
      )}

      {/* Numeric Grid */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
        {keys.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {row.map((key) => {
              const isBackspace = key === '⌫';
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (isBackspace) {
                      onBackspace();
                    } else {
                      onDigitPress(key);
                    }
                  }}
                  className={`h-11 xs:h-12 sm:h-14 md:h-16 rounded-xl flex items-center justify-center font-mono text-lg sm:text-2xl font-medium transition-all duration-150 active:scale-[0.96] disabled:opacity-40 shadow-sm ${
                    isBackspace
                      ? 'bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-zinc-400 hover:text-zinc-200'
                      : 'bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 text-zinc-100 hover:border-zinc-700'
                  }`}
                >
                  {isBackspace ? <Delete className="w-4 h-4 sm:w-5 sm:h-5" /> : key}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Clear Action Row */}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={disabled}
          onClick={onClear}
          className="text-[11px] sm:text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-0.5"
        >
          Clear Amount
        </button>
      </div>
    </div>
  );
};
