import React, { useState, useEffect, useCallback } from 'react';
import { PosKeypad } from './PosKeypad';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { PaymentWorkflowModal } from './PaymentWorkflowModal';
import type { PaymentMethodType, PosTransactionRecord } from '../../types/pos';
import { ShieldCheck, AlertCircle, CheckCircle2, ArrowRight, XCircle, Percent } from 'lucide-react';
import { adyenTerminalService } from '../../utils/adyenTerminalService';
import { useAdyenConfigStore } from '../../store/adyenConfigStore';

interface PosTerminalViewProps {
  isOnline?: boolean;
  terminalId?: string;
  merchantId?: string;
  merchantName?: string;
  onTransactionPersisted?: (txn: PosTransactionRecord) => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  EUR: '€',
  USD: '$',
  GBP: '£',
  SGD: 'S$'
};

export const PosTerminalView: React.FC<PosTerminalViewProps> = ({
  isOnline = true,
  terminalId = 'S1F2-000154829102',
  merchantId = 'MetroCoffeePOS_Store_01',
  merchantName = 'Metro Specialty Coffee Roasters',
  onTransactionPersisted
}) => {
  const { activeCurrency, setActiveCurrency, isOfflineModeAllowed, safConfig } = useAdyenConfigStore();

  const [amountStr, setAmountStr] = useState<string>('0');
  const [tipPercent, setTipPercent] = useState<number>(0);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('ADYEN_NFC');
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState<boolean>(false);
  const [lastTxn, setLastTxn] = useState<PosTransactionRecord | null>(null);
  const [recoveryToast, setRecoveryToast] = useState<{ message: string; count: number } | null>(null);

  const numericBaseAmount = parseFloat(amountStr) || 0;
  const tipAmount = tipPercent > 0 ? (numericBaseAmount * tipPercent) / 100 : 0;
  const totalAmount = numericBaseAmount + tipAmount;
  const currencySymbol = CURRENCY_SYMBOLS[activeCurrency] || '₹';

  // State Recovery & Idempotency Loop on Mount
  const runStateRecovery = useCallback(async () => {
    try {
      const reconciled = await adyenTerminalService.recoverUnresolvedTransactions((records) => {
        if (records.length > 0) {
          setRecoveryToast({
            message: `State Recovery: ${records.length} in-flight payment(s) reconciled via Nexo TransactionStatusRequest`,
            count: records.length
          });
          setTimeout(() => setRecoveryToast(null), 6000);
        }
      });
      if (reconciled.length > 0 && onTransactionPersisted) {
        onTransactionPersisted(reconciled[0]);
      }
    } catch (err) {
      console.error('[PosTerminalView] Error running state recovery:', err);
    }
  }, [onTransactionPersisted]);

  useEffect(() => {
    runStateRecovery();
  }, [runStateRecovery]);

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
    setTipPercent(0);
  };

  const handleAddPreset = (preset: number) => {
    const current = parseFloat(amountStr) || 0;
    const next = current + preset;
    setAmountStr(next.toString());
  };

  // Charge Trigger
  const handleInitiatePayment = () => {
    if (totalAmount <= 0) return;
    setIsWorkflowModalOpen(true);
  };

  const handlePaymentSuccess = (newRecord: PosTransactionRecord) => {
    setLastTxn(newRecord);
    setAmountStr('0');
    setTipPercent(0);
    if (onTransactionPersisted) {
      onTransactionPersisted(newRecord);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-2.5 sm:p-4 md:p-5 flex flex-col gap-3 sm:gap-4 select-none font-sans">
      
      {/* State Recovery Reconciliation Notification Banner */}
      {recoveryToast && (
        <div className="w-full p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{recoveryToast.message}</span>
          </div>
        </div>
      )}

      {/* Offline Status Alert Banner */}
      {!isOnline && (
        <div className="w-full p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="font-semibold text-[11px] sm:text-xs text-amber-100">Store-and-Forward (SaF) Active</div>
              <div className="text-[9px] sm:text-[10px] text-amber-300/80">
                {isOfflineModeAllowed && safConfig
                  ? `Adyen SaF Limit: ${currencySymbol}${safConfig.maxSingleTransactionAmount[activeCurrency] || 50} / txn`
                  : 'SaF Not Synced • Local Queue Active'}
              </div>
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0">
            OFFLINE
          </span>
        </div>
      )}

      {/* Currency Selector Bar & Amount Display */}
      <div className="w-full bg-zinc-900/90 border border-zinc-800/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-lg backdrop-blur-xl">
        
        {/* Top Currency Switcher Pills */}
        <div className="w-full flex items-center justify-between mb-1 pb-1.5 border-b border-zinc-800/60 text-[10px] font-mono">
          <span className="text-zinc-500 font-semibold">TERMINAL CURRENCY</span>
          <div className="flex items-center gap-1">
            {['INR', 'EUR', 'USD', 'GBP', 'SGD'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCurrency(c)}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  activeCurrency === c
                    ? 'bg-emerald-500 text-zinc-950 font-bold'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Currency Symbol & Large Numeric Amount */}
        <div className="flex items-baseline justify-center gap-1 text-white font-mono my-1">
          <span className="text-xl sm:text-2xl md:text-3xl text-zinc-400 font-light">{currencySymbol}</span>
          <span className="text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tight">
            {amountStr.includes('.') ? amountStr : `${parseInt(amountStr, 10).toLocaleString()}`}
          </span>
        </div>

        {/* Tip Breakdown if selected */}
        {tipPercent > 0 && numericBaseAmount > 0 && (
          <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 mb-1">
            Includes {tipPercent}% Tip (+{currencySymbol}{tipAmount.toFixed(2)}) = Total {currencySymbol}{totalAmount.toFixed(2)}
          </div>
        )}

        {/* Nexo 3.0 ISO Compliance Notice */}
        <div className="mt-0.5 flex items-center gap-1 text-[9px] text-zinc-500">
          <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
          <span>Nexo 3.0 / ISO 20022 Encrypted • Adyen Terminal API</span>
        </div>
      </div>

      {/* Tip Selection Preset Pills */}
      {numericBaseAmount > 0 && (
        <div className="w-full flex items-center justify-between gap-1 p-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[10px] font-mono">
          <span className="text-zinc-500 pl-1 flex items-center gap-1 font-semibold">
            <Percent className="w-3 h-3 text-emerald-400" />
            <span>TIP:</span>
          </span>
          <div className="flex items-center gap-1">
            {[0, 10, 15, 20].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setTipPercent(pct)}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  tipPercent === pct
                    ? 'bg-emerald-500 text-zinc-950 font-bold'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {pct === 0 ? 'No Tip' : `${pct}%`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Payment Method Selector */}
      <PaymentMethodSelector
        selectedMethod={selectedMethod}
        onSelectMethod={(method) => setSelectedMethod(method)}
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
        disabled={totalAmount <= 0}
        onClick={handleInitiatePayment}
        className={`w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-xl active:scale-[0.98] cursor-pointer ${
          totalAmount > 0
            ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20'
            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-750'
        }`}
      >
        <span>Charge {currencySymbol}{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>

      {/* Recent Transaction Result Banner */}
      {lastTxn && (
        <div className={`w-full p-2.5 sm:p-3 rounded-xl border text-xs flex items-center justify-between animate-fade-in ${
          lastTxn.state === 'DECLINED'
            ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
            : lastTxn.isOffline
            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            {lastTxn.state === 'DECLINED' ? (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                <span>{currencySymbol}{lastTxn.amount.toFixed(2)}</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase bg-emerald-500/20 text-emerald-300">
                  {lastTxn.state.replace('_', ' ')}
                </span>
              </div>
              <div className="text-[9px] text-zinc-400 font-mono mt-0.5 truncate">
                PSP: {lastTxn.pspReference || lastTxn.id} • Auth: {lastTxn.authCode || 'OK'}
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
        amount={totalAmount}
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
