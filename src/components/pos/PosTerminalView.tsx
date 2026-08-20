import React, { useState } from 'react';
import { PosKeypad } from './PosKeypad';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { PaymentWorkflowModal } from './PaymentWorkflowModal';
import type { PaymentMethodType, PosTransactionRecord } from '../../types/pos';
import { ShieldCheck, AlertCircle, CheckCircle2, ArrowRight, XCircle } from 'lucide-react';

interface PosTerminalViewProps {
  isOnline?: boolean;
  terminalId?: string;
  merchantId?: string;
  merchantName?: string;
  onTransactionPersisted?: (txn: PosTransactionRecord) => void;
}

export const PosTerminalView: React.FC<PosTerminalViewProps> = ({
  isOnline = true,
  terminalId = 'TERM-MUM-001',
  merchantId = 'MERCHANT-MUM-01',
  merchantName = 'Metro Specialty Coffee Roasters',
  onTransactionPersisted
}) => {
  const [amountStr, setAmountStr] = useState<string>('0');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('CARD_NFC');
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState<boolean>(false);
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
    setIsWorkflowModalOpen(true);
  };

  const handlePaymentSuccess = (newRecord: PosTransactionRecord) => {
    setLastTxn(newRecord);
    setAmountStr('0');
    if (onTransactionPersisted) {
      onTransactionPersisted(newRecord);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-2.5 sm:p-4 md:p-6 flex flex-col gap-3 sm:gap-4 md:gap-5 select-none font-sans">
      
      {/* Offline Status Alert Banner */}
      {!isOnline && (
        <div className="w-full p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="font-semibold text-[11px] sm:text-xs text-amber-100">Offline Standalone Mode</div>
              <div className="text-[9px] sm:text-[10px] text-amber-300/80">Dexie queue active • ₹500 RBI ceiling</div>
            </div>
          </div>
          <span className="text-[9px] sm:text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0">
            OFFLINE
          </span>
        </div>
      )}

      {/* Main Amount Card Display */}
      <div className="w-full bg-zinc-900/90 border border-zinc-800/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-lg backdrop-blur-xl">
        <div className="text-[10px] sm:text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1 mb-1">
          <span>Charge Amount</span>
        </div>

        {/* Currency & Monospaced Number */}
        <div className="flex items-baseline justify-center gap-1 text-white font-mono my-0.5 sm:my-1">
          <span className="text-xl sm:text-2xl md:text-3xl text-zinc-400 font-light">₹</span>
          <span className="text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tight">
            {amountStr.includes('.') ? amountStr : `${parseInt(amountStr, 10).toLocaleString('en-IN')}`}
          </span>
        </div>

        {/* RBI Compliance Notice */}
        <div className="mt-1 flex items-center gap-1 text-[9px] sm:text-[10px] text-zinc-500">
          <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
          <span>Dexie IndexedDB Secured • EMV Contactless</span>
        </div>
      </div>

      {/* Payment Method Selector */}
      <PaymentMethodSelector
        selectedMethod={selectedMethod}
        onSelectMethod={(method) => {
          setSelectedMethod(method);
        }}
        disabled={isWorkflowModalOpen}
      />

      {/* Numeric Keypad */}
      <PosKeypad
        onDigitPress={handleDigitPress}
        onBackspace={handleBackspace}
        onClear={handleClear}
        onAddPreset={handleAddPreset}
        disabled={isWorkflowModalOpen}
      />

      {/* Primary Action Button: Charge */}
      <button
        type="button"
        disabled={numericAmount <= 0}
        onClick={handleInitiatePayment}
        className={`w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-xl active:scale-[0.98] ${
          numericAmount > 0
            ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20 cursor-pointer'
            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-750'
        }`}
      >
        <span>Charge ₹{numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>

      {/* Recent Transaction Result Banner */}
      {lastTxn && (
        <div className={`w-full p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border text-xs flex items-center justify-between animate-fade-in ${
          lastTxn.state === 'DECLINED'
            ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
            : lastTxn.isOffline
            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            {lastTxn.state === 'DECLINED' ? (
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                <span>₹{lastTxn.amount.toFixed(2)}</span>
                <span className={`text-[9px] sm:text-[10px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                  lastTxn.state === 'DECLINED'
                    ? 'bg-rose-500/20 text-rose-300'
                    : lastTxn.state === 'OFFLINE_PENDING'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {lastTxn.state.replace('_', ' ')}
                </span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-zinc-400 font-mono mt-0.5 truncate">
                {lastTxn.declineReason || `${lastTxn.id} • ${lastTxn.authCode || 'Stored in Dexie'}`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Step-by-Step Payment Workflow Modal */}
      <PaymentWorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        method={selectedMethod}
        amount={numericAmount}
        isOnline={isOnline}
        terminalId={terminalId}
        merchantId={merchantId}
        merchantName={merchantName}
        onPaymentSuccess={handlePaymentSuccess}
        onChangeMethod={(newMethod) => setSelectedMethod(newMethod)}
      />
    </div>
  );
};
