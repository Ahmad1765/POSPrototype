import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Delete, Radio, CreditCard, Zap, Wallet,
  ShieldCheck, AlertCircle, CheckCircle2, Volume2, ArrowRight,
  Sparkles, Smartphone, Lock, XCircle, RotateCcw, Link2, Hash, QrCode
} from 'lucide-react';
import { DynamicQrCode } from './DynamicQrCode';
import { validateTransactionRules } from '../../utils/rulesEngine';
import { posDb } from '../../db/db';
import type { PaymentMethodType, PosTransactionRecord, CardNetwork, CryptoChain } from '../../types/pos';

// Demo merchant crypto addresses per chain
const MERCHANT_CRYPTO_ADDRESSES: Record<CryptoChain, string> = {
  ETH: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
  BTC: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
  USDT_TRC20: 'TJYjR7BwzSc8HMvGHKnTiDnRBfNqRj5eCA',
  SOL: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
};

const CHAIN_DISPLAY: Record<CryptoChain, { label: string; symbol: string; color: string; rate: number }> = {
  ETH: { label: 'Ethereum', symbol: 'ETH', color: 'text-indigo-400', rate: 0.0000046 },
  BTC: { label: 'Bitcoin', symbol: 'BTC', color: 'text-amber-400', rate: 0.00000018 },
  USDT_TRC20: { label: 'USDT (TRC-20)', symbol: 'USDT', color: 'text-emerald-400', rate: 0.012 },
  SOL: { label: 'Solana', symbol: 'SOL', color: 'text-violet-400', rate: 0.000085 }
};

interface PaymentWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  method: PaymentMethodType;
  amount: number;
  isOnline: boolean;
  terminalId?: string;
  merchantId?: string;
  merchantName?: string;
  onPaymentSuccess: (txn: PosTransactionRecord) => void;
  onChangeMethod?: (newMethod: PaymentMethodType) => void;
}

export const PaymentWorkflowModal: React.FC<PaymentWorkflowModalProps> = ({
  isOpen,
  onClose,
  method,
  amount,
  isOnline,
  terminalId = 'TERM-MUM-001',
  merchantId = 'MERCHANT-MUM-01',
  merchantName = 'Metro Specialty Coffee Roasters',
  onPaymentSuccess,
  onChangeMethod
}) => {
  // Modal Steps & Workflow States
  const [step, setStep] = useState<'IDLE' | 'READING' | 'PIN_ENTRY' | 'AUTHORIZING' | 'REMOVE_CARD' | 'APPROVED' | 'DECLINED'>('IDLE');
  const [pin, setPin] = useState<string>('');
  const [declineReason, setDeclineReason] = useState<string>('');
  const [selectedCardNetwork, setSelectedCardNetwork] = useState<CardNetwork>('RUPAY');
  const [cardLast4, setCardLast4] = useState<string>('4829');
  const [customerVpa] = useState<string>('customer@okhdfcbank');
  const [soundboxAlert, setSoundboxAlert] = useState<string | null>(null);
  const [completedTxn, setCompletedTxn] = useState<PosTransactionRecord | null>(null);

  // Crypto-specific state
  const [selectedChain, setSelectedChain] = useState<CryptoChain>('USDT_TRC20');
  const [customerCryptoAddress, setCustomerCryptoAddress] = useState<string>('');

  // Initialize or reset when modal opens or method changes
  useEffect(() => {
    if (isOpen) {
      setStep('IDLE');
      setPin('');
      setDeclineReason('');
      setSoundboxAlert(null);
      setCompletedTxn(null);
      setCardLast4(`${Math.floor(1000 + Math.random() * 9000)}`);
      setCustomerCryptoAddress('');
      
      if (method === 'CARD_NFC') {
        setSelectedCardNetwork('RUPAY');
      } else if (method === 'CARD_CHIP') {
        setSelectedCardNetwork('VISA');
      } else if (method === 'CRYPTO_WALLET') {
        setSelectedChain('USDT_TRC20');
      }
    }
  }, [isOpen, method]);

  // Soundbox Voice Alert Effect
  const triggerSoundbox = (msg: string) => {
    setSoundboxAlert(msg);
    setTimeout(() => {
      setSoundboxAlert(null);
    }, 4500);
  };

  // Complete and save transaction to Dexie IndexedDB
  const finalizeTransaction = useCallback(async (forcedNetwork?: CardNetwork, customVpa?: string, cryptoAddr?: string, chain?: CryptoChain) => {
    setStep('AUTHORIZING');

    try {
      const validation = await validateTransactionRules({
        amount,
        paymentMethod: method,
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
        amount,
        currency: 'INR',
        paymentMethod: method,
        cardNetwork: (method === 'CARD_CHIP' || method === 'CARD_NFC') ? (forcedNetwork || selectedCardNetwork) : undefined,
        cardLast4: (method === 'CARD_CHIP' || method === 'CARD_NFC') ? cardLast4 : undefined,
        upiVpa: method === 'UPI_LITE' ? (customVpa || customerVpa) : undefined,
        // Crypto fields
        cryptoWalletAddress: method === 'CRYPTO_WALLET' ? (cryptoAddr || customerCryptoAddress) : undefined,
        cryptoChain: method === 'CRYPTO_WALLET' ? (chain || selectedChain) : undefined,
        cryptoTxHash: method === 'CRYPTO_WALLET' ? `0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}` : undefined,
        cryptoAmountToken: method === 'CRYPTO_WALLET' ? (amount * (CHAIN_DISPLAY[chain || selectedChain]?.rate || 0.012)).toFixed(8) : undefined,
        state: validation.state,
        isOffline: !isOnline,
        authCode: validation.authCode,
        declineReason: validation.declineReason,
        rrn: `RRN${Date.now().toString().slice(-10)}`,
        createdAt: now,
        settledAt: isOnline && validation.allowed ? now : undefined
      };

      await posDb.transactions.put(newRecord);
      setCompletedTxn(newRecord);

      if (!validation.allowed || validation.state === 'DECLINED') {
        setDeclineReason(validation.declineReason || 'Transaction Declined by Rules Engine');
        setStep('DECLINED');
      } else {
        // Trigger voice soundbox announcement
        const amountFormatted = `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        if (method === 'UPI_LITE') {
          triggerSoundbox(`${amountFormatted} received on UPI Lite Offline!`);
        } else if (method === 'CRYPTO_WALLET') {
          const chainInfo = CHAIN_DISPLAY[chain || selectedChain];
          triggerSoundbox(`${amountFormatted} signed via ${chainInfo.label}! ${newRecord.isOffline ? 'Queued for broadcast.' : 'Confirmed on-chain.'}`);
        } else {
          triggerSoundbox(`${amountFormatted} approved on ${newRecord.cardNetwork || 'Card'}!`);
        }

        if (method === 'CARD_CHIP') {
          setStep('REMOVE_CARD');
        } else {
          setStep('APPROVED');
        }
        onPaymentSuccess(newRecord);
      }
    } catch (err) {
      console.error('Failed to complete transaction:', err);
      setDeclineReason('Dexie Database Storage Error');
      setStep('DECLINED');
    }
  }, [amount, cardLast4, customerVpa, customerCryptoAddress, isOnline, merchantId, method, onPaymentSuccess, selectedCardNetwork, selectedChain, terminalId]);

  if (!isOpen) return null;

  // --- Tap to Pay (NFC) Handlers ---
  const handleSimulateTap = (_sourceType: 'CARD' | 'PHONE', network: CardNetwork = 'RUPAY') => {
    setSelectedCardNetwork(network);
    setStep('READING');

    setTimeout(() => {
      // RBI Contactless Rule: Transactions > ₹5,000 require PIN verification
      if (amount > 5000) {
        setStep('PIN_ENTRY');
      } else {
        finalizeTransaction(network);
      }
    }, 900);
  };

  // --- Insert Card (EMV Chip) Handlers ---
  const handleSimulateInsertCard = (network: CardNetwork = 'VISA') => {
    setSelectedCardNetwork(network);
    setStep('READING');

    setTimeout(() => {
      // Move to secure PIN entry
      setStep('PIN_ENTRY');
    }, 850);
  };

  const handleSimulateRemoveCard = () => {
    setStep('APPROVED');
  };

  // --- UPI Lite Handlers ---
  const handleSimulateUpiLitePay = () => {
    setStep('READING');
    setTimeout(() => {
      finalizeTransaction(undefined, 'user9823@npci-lite');
    }, 450);
  };

  // --- Crypto Wallet Handlers ---
  const handleSimulateCryptoScan = (chain: CryptoChain) => {
    const demoAddresses: Record<CryptoChain, string> = {
      ETH: '0x1a2B3c4D5e6F7a8B9c0D1E2f3A4b5C6d7E8f9A0B',
      BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      USDT_TRC20: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
      SOL: '3Kzh9qAqVWQhEsfJDjHKLYNMkdasX7bUTaEoLXZhNhR5'
    };

    setSelectedChain(chain);
    setCustomerCryptoAddress(demoAddresses[chain]);
    setStep('READING');

    setTimeout(() => {
      finalizeTransaction(undefined, undefined, demoAddresses[chain], chain);
    }, 1200);
  };

  // --- PIN Keypad Handlers ---
  const handlePinDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => {
          finalizeTransaction();
        }, 200);
      }
    }
  };

  const handlePinBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handlePinClear = () => {
    setPin('');
  };

  const pinKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['CLR', '0', '⌫']
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      
      {/* Voice Soundbox Toast */}
      {soundboxAlert && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[110] bg-emerald-500 text-zinc-950 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold text-xs sm:text-sm animate-bounce border-2 border-emerald-300">
          <Volume2 className="w-5 h-5 animate-pulse shrink-0" />
          <span>🔊 Soundbox: "{soundboxAlert}"</span>
        </div>
      )}

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center gap-4 relative overflow-hidden text-zinc-100 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Top Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-emerald-400">
              {method === 'CARD_NFC' && <Radio className="w-4 h-4" />}
              {method === 'CARD_CHIP' && <CreditCard className="w-4 h-4" />}
              {method === 'UPI_LITE' && <Zap className="w-4 h-4" />}
              {method === 'CRYPTO_WALLET' && <Wallet className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-zinc-100">
                {method === 'CARD_NFC' && 'Contactless Tap to Pay'}
                {method === 'CARD_CHIP' && 'EMV Chip & PIN Insertion'}
                {method === 'UPI_LITE' && 'UPI Lite On-Device Wallet'}
                {method === 'CRYPTO_WALLET' && 'Crypto Wallet Payment'}
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">
                {merchantName} • {terminalId}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={step === 'READING' || step === 'AUTHORIZING'}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Charge Amount Banner */}
        <div className="w-full bg-zinc-950/80 border border-zinc-850 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Total Payable</span>
            <span className="text-xl sm:text-2xl font-mono font-black text-white">
              ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-right">
            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              {isOnline ? 'Online Gateway' : 'Offline Dexie'}
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* WORKFLOW VIEW 1: TAP TO PAY (CARD_NFC) */}
        {/* ======================================================== */}
        {method === 'CARD_NFC' && step === 'IDLE' && (
          <div className="w-full flex flex-col items-center gap-4 py-2">
            
            {/* NFC Contactless Pulsing Waves Animation */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-emerald-500/15 animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-emerald-500/50 flex flex-col items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
                <Radio className="w-8 h-8 animate-pulse" />
                <span className="text-[8px] font-bold tracking-wider mt-0.5">NFC ZONE</span>
              </div>
            </div>

            <div className="text-center">
              <h4 className="text-sm font-bold text-zinc-100">Please Tap Card or Phone</h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                Hold contactless RuPay/Visa card or NFC-enabled phone near the top of the terminal.
              </p>
              {amount > 5000 && (
                <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-1 rounded-lg">
                  <AlertCircle className="w-3 h-3" />
                  <span>Amount &gt; ₹5,000 requires PIN verification (RBI rule)</span>
                </div>
              )}
            </div>

            {/* Interactive Simulation Triggers */}
            <div className="w-full flex flex-col gap-2 pt-2 border-t border-zinc-800">
              <span className="text-[10px] font-semibold text-zinc-400 text-center uppercase tracking-wider">
                Simulate Contactless Hardware Tap
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateTap('CARD', 'RUPAY')}
                  className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 active:scale-95 border border-zinc-700 flex flex-col items-center gap-1 transition-all text-xs font-semibold text-zinc-200"
                >
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <span>RuPay Contactless</span>
                  <span className="text-[9px] text-zinc-400 font-mono">•••• 8392</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateTap('CARD', 'VISA')}
                  className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 active:scale-95 border border-zinc-700 flex flex-col items-center gap-1 transition-all text-xs font-semibold text-zinc-200"
                >
                  <CreditCard className="w-5 h-5 text-sky-400" />
                  <span>Visa PayWave</span>
                  <span className="text-[9px] text-zinc-400 font-mono">•••• 4120</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleSimulateTap('PHONE', 'RUPAY')}
                className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-98 border border-emerald-500/30 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-300 transition-all"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Simulate Phone NFC Tap (Google Pay / Apple Pay)</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* WORKFLOW VIEW 2: INSERT CARD (CARD_CHIP) */}
        {/* ======================================================== */}
        {method === 'CARD_CHIP' && step === 'IDLE' && (
          <div className="w-full flex flex-col items-center gap-4 py-2">
            
            {/* Card Insertion Reader Visual Animation */}
            <div className="w-full max-w-xs p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col items-center gap-3 relative overflow-hidden">
              <div className="w-48 h-28 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-zinc-600 p-3 flex flex-col justify-between shadow-lg relative animate-pulse">
                <div className="flex justify-between items-center">
                  {/* EMV Golden Chip Graphic */}
                  <div className="w-8 h-6 rounded bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 border border-amber-600 shadow-inner flex items-center justify-center">
                    <div className="w-full h-[1px] bg-amber-700/50" />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-300">EMV CHIP</span>
                </div>
                <div className="font-mono text-xs text-zinc-200 tracking-wider">
                  •••• •••• •••• 5921
                </div>
              </div>

              {/* Hardware Slot Indicator */}
              <div className="w-40 h-2 bg-zinc-800 rounded-full border border-zinc-700 shadow-inner flex items-center justify-center">
                <div className="w-20 h-0.5 bg-emerald-500/80 animate-pulse" />
              </div>
            </div>

            <div className="text-center">
              <h4 className="text-sm font-bold text-zinc-100">Please Insert EMV Chip Card</h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                Insert card chip-first into the slot at the bottom of the terminal and leave it inserted.
              </p>
            </div>

            {/* Insertion Trigger Buttons */}
            <div className="w-full flex flex-col gap-2 pt-2 border-t border-zinc-800">
              <span className="text-[10px] font-semibold text-zinc-400 text-center uppercase tracking-wider">
                Simulate Card Insertion
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateInsertCard('VISA')}
                  className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 active:scale-95 border border-zinc-700 flex flex-col items-center gap-1 transition-all text-xs font-semibold text-zinc-200"
                >
                  <CreditCard className="w-5 h-5 text-sky-400" />
                  <span>Insert Visa Chip</span>
                  <span className="text-[9px] text-zinc-400 font-mono">•••• 5921</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateInsertCard('RUPAY')}
                  className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 active:scale-95 border border-zinc-700 flex flex-col items-center gap-1 transition-all text-xs font-semibold text-zinc-200"
                >
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <span>Insert RuPay Chip</span>
                  <span className="text-[9px] text-zinc-400 font-mono">•••• 3318</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* WORKFLOW VIEW 3: UPI LITE (UPI_LITE) */}
        {/* ======================================================== */}
        {method === 'UPI_LITE' && step === 'IDLE' && (
          <div className="w-full flex flex-col items-center gap-4 py-2">
            
            {/* UPI Lite Visual Card */}
            <div className="w-full rounded-2xl bg-gradient-to-br from-indigo-950/80 via-zinc-900 to-zinc-950 border border-indigo-500/30 p-4 flex flex-col gap-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-bold">
                    <Zap className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-indigo-100 flex items-center gap-1.5">
                      <span>UPI LITE WALLET</span>
                      <span className="text-[8px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1 py-0.2 rounded font-mono">
                        ZERO-PIN
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">On-device Offline Ledger</div>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Connected
                </span>
              </div>

              {/* RBI Specification Notice */}
              <div className="text-[11px] text-zinc-300 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-850 space-y-1">
                <div className="flex items-center gap-1 font-semibold text-zinc-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>RBI UPI Lite Framework</span>
                </div>
                <div className="text-[10px] text-zinc-400 leading-relaxed">
                  Fast 1-click debit without banking server latency. Zero PIN required for amounts up to ₹500.00.
                </div>
              </div>

              {/* Customer Simulated Device Ledger */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-850">
                  <span className="text-[9px] text-zinc-500 block">DEVICE ID</span>
                  <span className="text-zinc-200 font-semibold">NPCI-LITE-9842</span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-850">
                  <span className="text-[9px] text-zinc-500 block">WALLET BAL</span>
                  <span className="text-emerald-400 font-semibold">₹1,850.00</span>
                </div>
              </div>
            </div>

            {/* Warning if amount > ₹500 */}
            {amount > 500 && (
              <div className="w-full p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Amount exceeds RBI UPI Lite ₹500 limit</span>
                </div>
                <div className="text-[10px] text-amber-300/80">
                  RBI caps single UPI Lite transactions at ₹500. For higher amounts, please switch to another method.
                </div>
                {onChangeMethod && (
                  <button
                    type="button"
                    onClick={() => onChangeMethod('CARD_NFC')}
                    className="mt-1 py-1.5 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold text-xs text-center transition-all border border-amber-500/40"
                  >
                    Switch to Tap to Pay →
                  </button>
                )}
              </div>
            )}

            {/* Instant Authorize Trigger */}
            <div className="w-full pt-1">
              <button
                type="button"
                onClick={handleSimulateUpiLitePay}
                className="w-full py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 active:scale-98 text-zinc-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Simulate 1-Tap UPI Lite Auth (₹{amount.toFixed(2)})</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* WORKFLOW VIEW 4: CRYPTO WALLET (CRYPTO_WALLET) */}
        {/* ======================================================== */}
        {method === 'CRYPTO_WALLET' && step === 'IDLE' && (
          <div className="w-full flex flex-col items-center gap-3.5 py-1">
            
            {/* Crypto Header Card */}
            <div className="w-full rounded-2xl bg-gradient-to-br from-violet-950/80 via-zinc-900 to-zinc-950 border border-violet-500/30 p-4 flex flex-col gap-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/40 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-violet-100 flex items-center gap-1.5">
                      <span>CRYPTO RECEIVE</span>
                      <span className="text-[8px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-1 py-0.2 rounded font-mono">
                        STORE & FORWARD
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">Offline-signed, broadcast on sync</div>
                  </div>
                </div>

                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  isOnline
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30'
                    : 'text-amber-400 bg-amber-950/60 border-amber-500/30'
                }`}>
                  {isOnline ? 'Node Active' : 'Offline Sign'}
                </span>
              </div>

              {/* Chain Selector */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">SELECT CHAIN</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.entries(CHAIN_DISPLAY) as [CryptoChain, typeof CHAIN_DISPLAY[CryptoChain]][]).map(([chain, info]) => (
                    <button
                      key={chain}
                      type="button"
                      onClick={() => setSelectedChain(chain)}
                      className={`py-1.5 px-1 rounded-lg text-center transition-all text-[10px] font-semibold border ${
                        selectedChain === chain
                          ? 'bg-violet-500/20 border-violet-500/40 text-violet-200'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <span className={selectedChain === chain ? info.color : ''}>{info.symbol}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversion Rate Display */}
              <div className="p-2 rounded-lg bg-zinc-950/80 border border-zinc-850 text-[10px] text-zinc-400 font-mono flex items-center justify-between">
                <span>₹{amount.toFixed(2)} ≈</span>
                <span className={`font-semibold ${CHAIN_DISPLAY[selectedChain].color}`}>
                  {(amount * CHAIN_DISPLAY[selectedChain].rate).toFixed(8)} {CHAIN_DISPLAY[selectedChain].symbol}
                </span>
              </div>
            </div>

            {/* Merchant Receiving QR Code */}
            <div className="w-full flex flex-col items-center gap-2">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                Merchant Receiving Address
              </span>
              <div className="relative p-2 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-inner flex flex-col items-center">
                <DynamicQrCode
                  value={MERCHANT_CRYPTO_ADDRESSES[selectedChain]}
                  size={160}
                  logo={
                    <div className="w-6 h-6 rounded bg-violet-500 flex items-center justify-center font-black text-[8px] text-white">
                      {CHAIN_DISPLAY[selectedChain].symbol.slice(0, 2)}
                    </div>
                  }
                />
                {/* Scan laser animation overlay */}
                <div className="absolute inset-x-4 top-2 h-1 bg-violet-400/80 rounded-full shadow-[0_0_12px_rgba(139,92,246,1)] animate-bounce pointer-events-none" />
              </div>

              {/* Truncated Address */}
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono bg-zinc-950/60 border border-zinc-850 px-2.5 py-1 rounded-lg max-w-full">
                <Link2 className="w-3 h-3 text-violet-400 shrink-0" />
                <span className="truncate">{MERCHANT_CRYPTO_ADDRESSES[selectedChain]}</span>
              </div>
            </div>

            {/* Simulate Customer Wallet Scan */}
            <div className="w-full flex flex-col gap-2 pt-2 border-t border-zinc-800">
              <span className="text-[10px] font-semibold text-zinc-400 text-center uppercase tracking-wider">
                Simulate Customer Wallet Scan
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateCryptoScan(selectedChain)}
                  className="py-2.5 px-3 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 active:scale-95 border border-violet-500/30 flex items-center justify-center gap-1.5 text-xs font-semibold text-violet-200 transition-all"
                >
                  <QrCode className="w-3.5 h-3.5 text-violet-400" />
                  <span>Scan & Sign</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateCryptoScan(selectedChain)}
                  className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 active:scale-95 border border-zinc-700 flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-200 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>WalletConnect</span>
                </button>
              </div>

              {/* Offline notice */}
              {!isOnline && (
                <div className="w-full p-2 rounded-xl bg-amber-950/30 border border-amber-500/20 text-[10px] text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Transaction will be signed offline & broadcast when connectivity is restored.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* INTERMEDIATE STEP: READING CHIP / CONTACTLESS / CRYPTO */}
        {/* ======================================================== */}
        {(step === 'READING' || step === 'AUTHORIZING') && (
          <div className="w-full py-10 flex flex-col items-center justify-center gap-4 text-center animate-fade-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin flex items-center justify-center" />
              <div className="absolute inset-0 flex items-center justify-center">
                {method === 'CRYPTO_WALLET'
                  ? <Hash className="w-6 h-6 text-violet-400" />
                  : <Lock className="w-6 h-6 text-emerald-400" />
                }
              </div>
            </div>

            <div>
              <h4 className="text-sm sm:text-base font-bold text-white">
                {step === 'READING' && method === 'CRYPTO_WALLET' && 'Signing Transaction Offline...'}
                {step === 'READING' && method !== 'CRYPTO_WALLET' && 'Reading Secure Element...'}
                {step === 'AUTHORIZING' && method === 'CRYPTO_WALLET' && 'Storing Signed Transaction in Dexie...'}
                {step === 'AUTHORIZING' && method !== 'CRYPTO_WALLET' && 'Exchanging EMV Cryptogram & Authorizing...'}
              </h4>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                {method === 'CRYPTO_WALLET'
                  ? `${CHAIN_DISPLAY[selectedChain].label} • ${terminalId}`
                  : `${method.replace('_', ' ')} • ${terminalId}`
                }
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* INTERMEDIATE STEP: SECURE PIN ENTRY KEYPAD */}
        {/* ======================================================== */}
        {step === 'PIN_ENTRY' && (
          <div className="w-full flex flex-col items-center gap-3 animate-fade-in">
            <div className="text-center">
              <div className="text-xs font-semibold text-zinc-300 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enter 4-Digit Chip PIN</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                PCI-PTS 6.0 Compliant PIN Verification
              </div>
            </div>

            {/* Masked PIN Bullets */}
            <div className="flex items-center justify-center gap-3 my-1">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = idx < pin.length;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                      isFilled
                        ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                        : 'bg-zinc-800 border-zinc-700'
                    }`}
                  />
                );
              })}
            </div>

            {/* Numeric Keypad Grid */}
            <div className="w-full grid grid-cols-3 gap-2">
              {pinKeys.map((row, rIdx) => (
                <React.Fragment key={rIdx}>
                  {row.map((key) => {
                    const isBack = key === '⌫';
                    const isClr = key === 'CLR';
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          if (isBack) handlePinBackspace();
                          else if (isClr) handlePinClear();
                          else handlePinDigit(key);
                        }}
                        className="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-750 active:scale-95 border border-zinc-700 font-mono text-base font-medium text-white flex items-center justify-center transition-all"
                      >
                        {isBack ? <Delete className="w-4 h-4 text-zinc-400" /> : isClr ? <span className="text-[11px] text-zinc-400">CLR</span> : key}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* INTERMEDIATE STEP: REMOVE CARD (CHIP FLOW) */}
        {/* ======================================================== */}
        {step === 'REMOVE_CARD' && (
          <div className="w-full py-6 flex flex-col items-center justify-center gap-4 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 animate-pulse">
              <CreditCard className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">Please Remove Card</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Transaction processed successfully. Remove chip card from slot.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSimulateRemoveCard}
              className="mt-2 py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg"
            >
              <span>Simulate Remove Card</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* FINAL STATE: APPROVED RECEIPT */}
        {/* ======================================================== */}
        {step === 'APPROVED' && (
          <div className="w-full flex flex-col items-center gap-4 py-2 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="text-center">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                {completedTxn?.isOffline ? 'Offline Stored in Dexie' : 'Online Settled'}
              </span>
              <h3 className="text-lg font-black text-white mt-1.5">Payment Successful!</h3>
              <div className="text-2xl font-mono font-bold text-emerald-400 mt-0.5">
                ₹{amount.toFixed(2)}
              </div>
            </div>

            {/* Receipt Summary Details */}
            <div className="w-full p-3 rounded-2xl bg-zinc-950 border border-zinc-850 text-xs space-y-2 font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>TXN ID</span>
                <span className="text-zinc-200 font-semibold">{completedTxn?.id || 'TXN-98412'}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>AUTH CODE</span>
                <span className="text-emerald-300 font-semibold">{completedTxn?.authCode || 'AUTH-OK-982'}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>PAYMENT METHOD</span>
                <span className="text-zinc-200">{method.replace('_', ' ')}</span>
              </div>
              {completedTxn?.cardLast4 && (
                <div className="flex justify-between text-zinc-400">
                  <span>CARD</span>
                  <span className="text-zinc-200">{completedTxn.cardNetwork} •••• {completedTxn.cardLast4}</span>
                </div>
              )}
              {completedTxn?.upiVpa && (
                <div className="flex justify-between text-zinc-400">
                  <span>UPI VPA</span>
                  <span className="text-zinc-200">{completedTxn.upiVpa}</span>
                </div>
              )}
              {completedTxn?.cryptoChain && (
                <>
                  <div className="flex justify-between text-zinc-400">
                    <span>CHAIN</span>
                    <span className={`font-semibold ${CHAIN_DISPLAY[completedTxn.cryptoChain].color}`}>
                      {CHAIN_DISPLAY[completedTxn.cryptoChain].label}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>AMOUNT</span>
                    <span className="text-zinc-200">
                      {completedTxn.cryptoAmountToken} {CHAIN_DISPLAY[completedTxn.cryptoChain].symbol}
                    </span>
                  </div>
                  {completedTxn.cryptoTxHash && (
                    <div className="flex justify-between text-zinc-400">
                      <span>TX HASH</span>
                      <span className="text-violet-300 text-[10px] truncate max-w-[180px]">{completedTxn.cryptoTxHash}</span>
                    </div>
                  )}
                  {completedTxn.cryptoWalletAddress && (
                    <div className="flex justify-between text-zinc-400">
                      <span>FROM</span>
                      <span className="text-zinc-300 text-[10px] truncate max-w-[180px]">{completedTxn.cryptoWalletAddress}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between text-zinc-400">
                <span>RRN / REF</span>
                <span className="text-zinc-400 text-[10px]">{completedTxn?.rrn || 'RRN99238481'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-lg"
            >
              <span>Done (Next Sale)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* FINAL STATE: DECLINED */}
        {/* ======================================================== */}
        {step === 'DECLINED' && (
          <div className="w-full flex flex-col items-center gap-4 py-2 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <XCircle className="w-8 h-8" />
            </div>

            <div className="text-center">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded">
                Declined
              </span>
              <h3 className="text-lg font-bold text-white mt-1.5">Transaction Declined</h3>
              <p className="text-xs text-rose-300/90 mt-1 max-w-xs leading-relaxed">
                {declineReason || 'Transaction validation failed by terminal security engine.'}
              </p>
            </div>

            <div className="w-full flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-xs font-semibold text-zinc-300 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep('IDLE')}
                className="flex-1 py-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Payment</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};
