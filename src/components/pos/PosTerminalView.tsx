import React, { useState } from 'react';
import { PosKeypad } from './PosKeypad';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { PinEntryModal } from './PinEntryModal';
import { posDb } from '../../db/db';
import { validateTransactionRules } from '../../utils/rulesEngine';
import type { PaymentMethodType, PosTransactionRecord } from '../../types/pos';
import { ShieldCheck, AlertCircle, CheckCircle2, ArrowRight, RefreshCw, XCircle } from 'lucide-react';

interface PosTerminalViewProps {
  isOnline?: boolean;
  terminalId?: string;
  merchantId?: string;
  onTransactionPersisted?: (txn: PosTransactionRecord) => void;
}

export const PosTerminalView: React.FC<PosTerminalViewProps> = ({
  isOnline = true,
  terminalId = 'TERM-MUM-001',
  merchantId = 'MERCHANT-MUM-01',
  onTransactionPersisted
}) => {
  const [amountStr, setAmountStr] = useState<string>('0');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('CARD_NFC');
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastTxn, setLastTxn] = useState<PosTransactionRecord | null>(null);

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
      if (amountStr.includes('.')) {
        const [, decimals] = amountStr.split('.');
        if (decimals && decimals.length >= 2) return;
      }
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

    if (selectedMethod === 'CARD_CHIP') {
      setIsPinModalOpen(true);
    } else {
      processTransaction();
    }
  };

  const handlePinSubmit = (_pin: string) => {
    setIsPinModalOpen(false);
    processTransaction();
  };

  const processTransaction = async () => {
    setIsProcessing(true);

    // Simulate processing latency with setTimeout
    setTimeout(async () => {
      try {
        // 1. Evaluate mock offline rules
        const validation = await validateTransactionRules({
          amount: numericAmount,
          paymentMethod: selectedMethod,
          isOnline
        });

        const now = new Date().toISOString();
        const clientUuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `uuid-${Date.now()}`;
        const txnId = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;

        const newRecord: PosTransactionRecord = {
          id: txnId,
          clientUuid,
          terminalId,
          merchantId,
          amount: numericAmount,
          currency: 'INR',
          paymentMethod: selectedMethod,
          cardNetwork: selectedMethod === 'CARD_CHIP' ? 'VISA' : selectedMethod === 'CARD_NFC' ? 'RUPAY' : undefined,
          cardLast4: selectedMethod.startsWith('CARD') ? `${Math.floor(1000 + Math.random() * 9000)}` : undefined,
          upiVpa: selectedMethod.startsWith('UPI') ? 'customer@upi' : undefined,
          state: validation.state,
          isOffline: !isOnline,
          authCode: validation.authCode,
          declineReason: validation.declineReason,
          rrn: `RRN${Date.now().toString().slice(-10)}`,
          createdAt: now,
          settledAt: isOnline && validation.allowed ? now : undefined
        };

        // 2. Persist record directly to Dexie IndexedDB
        await posDb.transactions.put(newRecord);

        // Update local state
        setLastTxn(newRecord);
        setAmountStr('0');
        setIsProcessing(false);

        // Notify parent container
        if (onTransactionPersisted) {
          onTransactionPersisted(newRecord);
        }
      } catch (err) {
        console.error('Error persisting transaction to Dexie:', err);
        setIsProcessing(false);
      }
    }, 600);
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
              <div className="text-[10px] text-amber-300/80">Dexie IndexedDB queue • ₹500 RBI max ceiling</div>
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
          <span>Local Dexie IndexedDB Connected • Encrypted Store</span>
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
            <span>Validating & Storing in Dexie...</span>
          </>
        ) : (
          <>
            <span>Charge ₹{numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Recent Transaction Result Banner */}
      {lastTxn && (
        <div className={`w-full p-3.5 rounded-2xl border text-xs flex items-center justify-between animate-fade-in ${
          lastTxn.state === 'DECLINED'
            ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
            : lastTxn.isOffline
            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {lastTxn.state === 'DECLINED' ? (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <div>
              <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                <span>₹{lastTxn.amount.toFixed(2)}</span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                  lastTxn.state === 'DECLINED'
                    ? 'bg-rose-500/20 text-rose-300'
                    : lastTxn.state === 'OFFLINE_PENDING'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {lastTxn.state.replace('_', ' ')}
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                {lastTxn.declineReason || `${lastTxn.id} • ${lastTxn.authCode || 'Stored locally in IndexedDB'}`}
              </div>
            </div>
          </div>
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
