import React, { useState } from 'react';
import { Lock, X, Check, Delete, ShieldAlert } from 'lucide-react';

interface PinEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPinSubmit: (pin: string) => void;
  amount: number;
  pinLength?: 4 | 6;
  isProcessing?: boolean;
}

export const PinEntryModal: React.FC<PinEntryModalProps> = ({
  isOpen,
  onClose,
  onPinSubmit,
  amount,
  pinLength = 4,
  isProcessing = false
}) => {
  const [pin, setPin] = useState<string>('');

  if (!isOpen) return null;

  const handleKeyPress = (digit: string) => {
    if (pin.length < pinLength) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === pinLength) {
        // Auto submit when full pin entered
        setTimeout(() => onPinSubmit(nextPin), 150);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', '⌫']
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-5">
        {/* Header */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>SECURE PIN ENTRY</span>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount & Prompt */}
        <div className="text-center">
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-wide">Enter {pinLength}-Digit PIN for</div>
          <div className="text-2xl font-mono font-bold text-white mt-0.5">
            ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Masked PIN Indicators */}
        <div className="flex items-center justify-center gap-3 my-2">
          {Array.from({ length: pinLength }).map((_, idx) => {
            const isFilled = idx < pin.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                  isFilled
                    ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                    : 'bg-zinc-800 border-zinc-700'
                }`}
              />
            );
          })}
        </div>

        {/* Security Notice */}
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 bg-zinc-850 px-3 py-1.5 rounded-lg border border-zinc-800">
          <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
          <span>PCI-PTS 6.0 Compliant Pin Pad</span>
        </div>

        {/* Numeric PIN Keypad */}
        <div className="w-full grid grid-cols-3 gap-2">
          {keys.map((row, rIdx) => (
            <React.Fragment key={rIdx}>
              {row.map((key) => {
                const isBack = key === '⌫';
                const isClr = key === 'C';
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isProcessing}
                    onClick={() => {
                      if (isBack) handleBackspace();
                      else if (isClr) handleClear();
                      else handleKeyPress(key);
                    }}
                    className="h-12 rounded-xl bg-zinc-850 hover:bg-zinc-800 active:scale-95 border border-zinc-750 font-mono text-lg font-medium text-white flex items-center justify-center transition-all disabled:opacity-50"
                  >
                    {isBack ? <Delete className="w-4 h-4 text-zinc-400" /> : isClr ? <span className="text-xs text-zinc-400">CLR</span> : key}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Action Controls */}
        <div className="w-full flex gap-2 pt-1">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-zinc-750 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pin.length < pinLength || isProcessing}
            onClick={() => onPinSubmit(pin)}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:hover:bg-emerald-500 shadow-md"
          >
            {isProcessing ? (
              <span className="inline-block w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Confirm PIN</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
