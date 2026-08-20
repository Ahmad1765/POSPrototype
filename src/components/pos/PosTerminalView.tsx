import React, { useState } from 'react';
import { PosKeypad } from './PosKeypad';
import { PaymentMethodSelector, type PaymentMethodType } from './PaymentMethodSelector';
import { PinEntryModal } from './PinEntryModal';
import { ShieldCheck, AlertCircle, CheckCircle2, ArrowRight, RefreshCw, FileText } from 'lucide-react';

interface PosTerminalViewProps {
  isOnline?: boolean;
  onPaymentComplete?: (details: {
    amount: number;
    method: PaymentMethodType;
    isOffline: boolean;
  }) => void;
}

export const PosTerminalView: React.FC<PosTerminalViewProps> = ({
  isOnline = true,
  onPaymentComplete
}) => {
  const [amountStr, setAmountStr] = useState<string>('0');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('CARD_NFC');
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastSuccessTxn, setLastSuccessTxn] = useState<{
    id: string;
    amount: number;
    method: PaymentMethodType;
    timestamp: string;
    authCode: string;
    isOffline: boolean;
  } | null>(null);

  const numericAmount = parseFloat(amountStr) || 0;

  // Keypad Handlers
  const handleDigitPress = (digit: string) => {
    if (digit === '.') {
      if (amountStr.includes('.')) return;
      setAmountStr(prev => prev + '.');
      return;
    }

    if (amountStr === '0') {
      setAmountStr(digit);
    } else {
      // Limit to 2 decimal places if dot exists
      if (amountStr.includes('.')) {
        const [, decimals] = amountStr.split('.');
        if (decimals && decimals.length >= 2) return;
      }
      // Limit max digits
      if (amountStr.length >= 8) return;
      setAmountStr(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    if (amountStr.length <= 1) {
      setAmountStr('0');
    } else {
      setAmountStr(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    setAmountStr('0');
  };

  const handleAddPreset = (preset: number) => {
    const current = parseFloat(amountStr) || 0;
    const next = current + preset;
    setAmountStr(next.toString());
  };

  // Charge / Checkout Trigger
  const handleInitiatePayment = () => {
    if (numericAmount <= 0) return;

    // If Chip & PIN, open PIN Modal
    if (selectedMethod === 'CARD_CHIP') {
      setIsPinModalOpen(true);
    } else {
      // Direct simulation with simple setTimeout (No complex backend!)
      processPaymentMock();
    }
  };

  const handlePinSubmit = (_pin: string) => {
    setIsPinModalOpen(false);
    processPaymentMock();
  };

  const processPaymentMock = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const txnRecord = {
        id: `TXN-${Date.now().toString().slice(-6)}`,
        amount: numericAmount,
        method: selectedMethod,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        authCode: `AUTH${Math.floor(100000 + Math.random() * 900000)}`,
        isOffline: !isOnline
      };

      setLastSuccessTxn(txnRecord);
      setAmountStr('0');

      if (onPaymentComplete) {
        onPaymentComplete({
          amount: numericAmount,
          method: selectedMethod,
          isOffline: !isOnline
        });
      }
    }, 800);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 flex flex-col gap-5 select-none font-sans">
      
      {/* Offline Status Alert Banner */}
      {!isOnline && (
        <div className="w-full p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="font-semibold text-amber-100">Offline Standalone Mode</div>
              <div className="text-[10px] text-amber-300/80">Local queue active • ₹500 RBI max ceiling</div>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30">
            OFFLINE
          </span>
        </div>
      )}

      {/* Main Amount Card Display */}
      <div className="w-full bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-lg backdrop-blur-xl">
        <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
          <span>Charge Amount</span>
        </div>

        {/* Currency & Monospaced Number */}
        <div className="flex items-baseline justify-center gap-1 text-white font-mono my-1">
          <span className="text-2xl sm:text-3xl text-zinc-400 font-light">₹</span>
          <span className="text-4xl sm:text-5xl font-bold tracking-tight">
            {amountStr.includes('.') ? amountStr : `${parseInt(amountStr, 10).toLocaleString('en-IN')}`}
          </span>
        </div>

        {/* RBI Compliance Notice */}
        <div className="mt-2 flex items-center gap-1 text-[10px] text-zinc-500">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>Instant Settlement Ready • Encrypted EMV</span>
        </div>
      </div>

      {/* Payment Method Selector */}
      <PaymentMethodSelector
        selectedMethod={selectedMethod}
        onSelectMethod={setSelectedMethod}
        disabled={isProcessing}
      />

      {/* Numeric Keypad */}
      <PosKeypad
        onDigitPress={handleDigitPress}
        onBackspace={handleBackspace}
        onClear={handleClear}
        onAddPreset={handleAddPreset}
        disabled={isProcessing}
      />

      {/* Primary Action Button: Charge */}
      <button
        type="button"
        disabled={numericAmount <= 0 || isProcessing}
        onClick={handleInitiatePayment}
        className={`w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-xl active:scale-[0.98] ${
          numericAmount > 0 && !isProcessing
            ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20'
            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-750'
        }`}
      >
        {isProcessing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
            <span>Processing Authorization...</span>
          </>
        ) : (
          <>
            <span>Charge ₹{numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Recent Success Pill (If available) */}
      {lastSuccessTxn && (
        <div className="w-full p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-semibold text-emerald-100">
                ₹{lastSuccessTxn.amount.toFixed(2)} Approved ({lastSuccessTxn.isOffline ? 'Offline Stored' : 'Online'})
              </div>
              <div className="text-[10px] text-emerald-400/80 font-mono">
                {lastSuccessTxn.id} • {lastSuccessTxn.authCode}
              </div>
            </div>
          </div>
          <button
            onClick={() => alert(`Receipt for ${lastSuccessTxn.id}\nAmount: ₹${lastSuccessTxn.amount}\nStatus: APPROVED`)}
            className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition-colors"
            title="View Receipt"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Secure PIN Modal */}
      <PinEntryModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onPinSubmit={handlePinSubmit}
        amount={numericAmount}
        pinLength={4}
        isProcessing={isProcessing}
      />
    </div>
  );
};
