import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Delete, Radio, CreditCard, Zap, Wallet,
  CheckCircle2, Volume2,
  Smartphone, Lock, XCircle, QrCode,
  RefreshCw, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { DynamicQrCode } from './DynamicQrCode';
import { validateTransactionRules } from '../../utils/rulesEngine';
import { posDb } from '../../db/db';
import { adyenTerminalService } from '../../utils/adyenTerminalService';
import { useAdyenConfigStore } from '../../store/adyenConfigStore';
import type { PaymentMethodType, PosTransactionRecord, CardNetwork, CryptoChain } from '../../types/pos';
import type { SaleToPOIRequest } from '../../types/adyenNexoTypes';

const CHAIN_DISPLAY: Record<CryptoChain, { label: string; symbol: string; color: string; rate: number }> = {
  ETH: { label: 'Ethereum', symbol: 'ETH', color: 'text-indigo-400', rate: 0.0000046 },
  BTC: { label: 'Bitcoin', symbol: 'BTC', color: 'text-amber-400', rate: 0.00000018 },
  USDT_TRC20: { label: 'USDT (TRC-20)', symbol: 'USDT', color: 'text-emerald-400', rate: 0.012 },
  SOL: { label: 'Solana', symbol: 'SOL', color: 'text-violet-400', rate: 0.000085 }
};

import { CURRENCY_SYMBOLS } from '../../utils/currency';

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
  terminalId = 'S1F2-000154829102',
  merchantId = 'MetroCoffeePOS_Store_01',
  merchantName = 'Metro Specialty Coffee Roasters',
  onPaymentSuccess,
  onChangeMethod: _onChangeMethod
}) => {
  const { activeCurrency, safConfig, isOfflineModeAllowed } = useAdyenConfigStore();
  const currencySymbol = CURRENCY_SYMBOLS[activeCurrency] || '₹';

  const [step, setStep] = useState<'IDLE' | 'READING' | 'PIN_ENTRY' | 'AUTHORIZING' | 'WAITING_WEBHOOK' | 'REMOVE_CARD' | 'APPROVED' | 'DECLINED'>('IDLE');
  const [pin, setPin] = useState<string>('');
  const [declineReason, setDeclineReason] = useState<string>('');
  const [selectedCardNetwork, setSelectedCardNetwork] = useState<CardNetwork>('RUPAY');
  const [cardLast4, setCardLast4] = useState<string>('4829');
  const [customerVpa] = useState<string>('customer@okhdfcbank');
  const [soundboxAlert, setSoundboxAlert] = useState<string | null>(null);
  const [completedTxn, setCompletedTxn] = useState<PosTransactionRecord | null>(null);
  const [asyncQrCountdown] = useState<number>(4);
  const [inFlightMerchantRef, setInFlightMerchantRef] = useState<string | null>(null);

  // Crypto state
  const [selectedChain, setSelectedChain] = useState<CryptoChain>('USDT_TRC20');
  const [customerCryptoAddress, setCustomerCryptoAddress] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setStep('IDLE');
      setPin('');
      setDeclineReason('');
      setSoundboxAlert(null);
      setCompletedTxn(null);
      setCardLast4(`${Math.floor(1000 + Math.random() * 9000)}`);
      setCustomerCryptoAddress('');
      setInFlightMerchantRef(null);

      if (method === 'CARD_NFC' || method === 'ADYEN_NFC') {
        setSelectedCardNetwork(activeCurrency === 'INR' ? 'RUPAY' : 'VISA');
      } else if (method === 'CARD_CHIP' || method === 'ADYEN_CARD') {
        setSelectedCardNetwork('VISA');
      } else if (method === 'CRYPTO_WALLET') {
        setSelectedChain('USDT_TRC20');
      }
    }
  }, [isOpen, method, activeCurrency]);

  const triggerSoundbox = (msg: string) => {
    setSoundboxAlert(msg);
    setTimeout(() => {
      setSoundboxAlert(null);
    }, 4500);
  };

  // Asynchronous Webhook Subscriber - Active strictly for the pending in-flight QR session
  useEffect(() => {
    if (!isOpen || step !== 'WAITING_WEBHOOK' || !inFlightMerchantRef) return;

    const unsubscribe = adyenTerminalService.subscribeToAdyenWebhooks((item) => {
      if (item.eventCode === 'AUTHORISATION' && item.merchantReference === inFlightMerchantRef) {
        const isSuccess = item.success === 'true';
        if (isSuccess) {
          triggerSoundbox(`${currencySymbol}${amount.toFixed(2)} received via ${item.paymentMethod.toUpperCase()} Webhook!`);
          setStep('APPROVED');
        } else {
          setDeclineReason(item.reason || 'Asynchronous authorization refused by issuer');
          setStep('DECLINED');
        }
      }
    });

    return () => unsubscribe();
  }, [isOpen, step, inFlightMerchantRef, amount, currencySymbol]);

  // Finalize Transaction Routine with Adyen Store-and-Forward (SaF) Interceptor
  const finalizeTransaction = useCallback(async (
    forcedNetwork?: CardNetwork,
    customVpa?: string,
    cryptoAddr?: string,
    chain?: CryptoChain,
    customPspRef?: string,
    customAuthCode?: string
  ) => {
    setStep('AUTHORIZING');

    try {
      const now = new Date().toISOString();
      const clientUuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `uuid-${Date.now()}`;
      const txnId = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
      const serviceId = adyenTerminalService.generateServiceId();
      let pspReference = customPspRef || adyenTerminalService.generatePspReference();
      let authCode = customAuthCode || `AUTH-${Math.floor(100000 + Math.random() * 900000)}`;

      const isAdyenMethod = method === 'ADYEN_NFC' || method === 'ADYEN_CARD' || method === 'ADYEN_QR' || method === 'CARD_NFC' || method === 'CARD_CHIP';

      // =========================================================================
      // 1. OFFLINE MODE: Store-and-Forward (SaF) Validation Flow
      // =========================================================================
      if (!isOnline) {
        if (isAdyenMethod) {
          // Check if offline mode is allowed/synced with Customer Area
          if (!isOfflineModeAllowed || !safConfig) {
            const errorMsg = 'Adyen Store-and-Forward (SaF) is not enabled or synchronized for this terminal.';
            setDeclineReason(errorMsg);
            setStep('DECLINED');

            const declinedRecord: PosTransactionRecord = {
              id: txnId,
              clientUuid,
              terminalId,
              merchantId,
              amount,
              currency: activeCurrency,
              paymentMethod: method,
              cardNetwork: forcedNetwork || selectedCardNetwork,
              cardLast4,
              state: 'DECLINED',
              isOffline: true,
              declineReason: errorMsg,
              createdAt: now
            };
            await posDb.transactions.put(declinedRecord);
            return;
          }

          // Fetch current cumulative offline transactions & batch count from Dexie
          const pendingOfflineTxns = await posDb.transactions
            .filter((t) => t.state === 'OFFLINE_PENDING' || t.state === 'STORED_OFFLINE' || t.state === 'QUEUED')
            .toArray();

          const currentCumulativeOffline = pendingOfflineTxns
            .filter((t) => (t.currency || 'INR') === activeCurrency)
            .reduce((sum, t) => sum + t.amount, 0);

          const currentOfflineCount = pendingOfflineTxns.length;

          // Execute Adyen SaF Risk Evaluator Rules
          const safResult = adyenTerminalService.evaluateAdyenOfflineTransaction({
            amount,
            currency: activeCurrency,
            safConfig,
            currentCumulativeOffline,
            currentOfflineCount
          });

          // DECLINE PATH: Risk limits exceeded
          if (!safResult.allowed) {
            const errorMsg = safResult.reason || 'Amount exceeds Adyen SaF offline ceiling policy.';
            setDeclineReason(errorMsg);
            setStep('DECLINED');

            const declinedRecord: PosTransactionRecord = {
              id: txnId,
              clientUuid,
              terminalId,
              merchantId,
              amount,
              currency: activeCurrency,
              paymentMethod: method,
              cardNetwork: forcedNetwork || selectedCardNetwork,
              cardLast4,
              state: 'DECLINED',
              isOffline: true,
              declineReason: errorMsg,
              createdAt: now
            };
            await posDb.transactions.put(declinedRecord);
            return;
          }

          // APPROVAL PATH: SaF Queued with Offline Signature
          const offlineAuthCode = safResult.authCode || `ADYEN-SAF-${Math.floor(1000 + Math.random() * 9000)}`;
          const offlineSignature = safResult.offlineSignature || `HMAC-${Math.random().toString(36).substring(2, 14).toUpperCase()}`;

          const queuedOfflineRecord: PosTransactionRecord = {
            id: txnId,
            clientUuid,
            terminalId,
            merchantId,
            amount,
            currency: activeCurrency,
            paymentMethod: method,
            cardNetwork: forcedNetwork || selectedCardNetwork,
            cardLast4,
            pspReference,
            serviceId,
            saleTransactionId: txnId,
            authCode: offlineAuthCode,
            offlineSignature,
            nexoResponse: undefined, // Bypassed cloud proxy
            state: 'STORED_OFFLINE',
            isOffline: true,
            rrn: `RRN${Date.now().toString().slice(-10)}`,
            createdAt: now
          };

          await posDb.transactions.put(queuedOfflineRecord);
          setCompletedTxn(queuedOfflineRecord);

          const amountFormatted = `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
          triggerSoundbox(`${amountFormatted} stored offline (Adyen SaF Queue)!`);

          if (method === 'CARD_CHIP' || method === 'ADYEN_CARD') {
            setStep('REMOVE_CARD');
          } else {
            setStep('APPROVED');
          }

          onPaymentSuccess(queuedOfflineRecord);
          return;
        }

        // Non-Adyen offline payment methods (e.g. UPI Lite / Crypto)
        const legacyValidation = await validateTransactionRules({
          amount,
          paymentMethod: method,
          isOnline
        });

        if (!legacyValidation.allowed) {
          const errorMsg = legacyValidation.declineReason || 'Transaction Declined by Offline Rules Engine';
          setDeclineReason(errorMsg);
          setStep('DECLINED');

          const declinedRecord: PosTransactionRecord = {
            id: txnId,
            clientUuid,
            terminalId,
            merchantId,
            amount,
            currency: activeCurrency,
            paymentMethod: method,
            upiVpa: method === 'UPI_LITE' ? (customVpa || customerVpa) : undefined,
            cryptoWalletAddress: method === 'CRYPTO_WALLET' ? (cryptoAddr || customerCryptoAddress) : undefined,
            cryptoChain: method === 'CRYPTO_WALLET' ? (chain || selectedChain) : undefined,
            state: 'DECLINED',
            isOffline: true,
            declineReason: errorMsg,
            createdAt: now
          };
          await posDb.transactions.put(declinedRecord);
          return;
        }

        const offlineAltRecord: PosTransactionRecord = {
          id: txnId,
          clientUuid,
          terminalId,
          merchantId,
          amount,
          currency: activeCurrency,
          paymentMethod: method,
          upiVpa: method === 'UPI_LITE' ? (customVpa || customerVpa) : undefined,
          cryptoWalletAddress: method === 'CRYPTO_WALLET' ? (cryptoAddr || customerCryptoAddress) : undefined,
          cryptoChain: method === 'CRYPTO_WALLET' ? (chain || selectedChain) : undefined,
          cryptoTxHash: method === 'CRYPTO_WALLET' ? `0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}` : undefined,
          cryptoAmountToken: method === 'CRYPTO_WALLET' ? (amount * (CHAIN_DISPLAY[chain || selectedChain]?.rate || 0.012)).toFixed(8) : undefined,
          state: 'OFFLINE_PENDING',
          isOffline: true,
          authCode: `AUTH-OFFLINE-${Math.floor(1000 + Math.random() * 9000)}`,
          rrn: `RRN${Date.now().toString().slice(-10)}`,
          createdAt: now
        };

        await posDb.transactions.put(offlineAltRecord);
        setCompletedTxn(offlineAltRecord);

        const amountFormatted = `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        if (method === 'UPI_LITE') {
          triggerSoundbox(`${amountFormatted} received on UPI Lite!`);
        } else if (method === 'CRYPTO_WALLET') {
          const chainInfo = CHAIN_DISPLAY[chain || selectedChain];
          triggerSoundbox(`${amountFormatted} signed via ${chainInfo.label}!`);
        }

        setStep('APPROVED');
        onPaymentSuccess(offlineAltRecord);
        return;
      }

      // =========================================================================
      // 2. ONLINE MODE: Live Cloud Proxy / Nexo 3.0 Standard Dispatch
      // =========================================================================
      let nexoResponseStr: string | undefined;

      if (isAdyenMethod) {
        const saleToPoiReq: SaleToPOIRequest = {
          SaleToPOIRequest: {
            MessageHeader: adyenTerminalService.createMessageHeader('Payment', serviceId, 'NodePOS-Register-01', terminalId),
            PaymentRequest: {
              SaleData: {
                SaleTransactionID: {
                  TransactionID: txnId,
                  TimeStamp: now
                }
              },
              PaymentTransaction: {
                AmountsReq: {
                  Currency: activeCurrency,
                  RequestedAmount: amount
                },
                TransactionConditions: {
                  AllowedPaymentBrand: [forcedNetwork?.toLowerCase() || selectedCardNetwork.toLowerCase() || 'visa']
                }
              }
            }
          }
        };

        const res = await adyenTerminalService.sendSaleToPOIRequest(saleToPoiReq);
        nexoResponseStr = JSON.stringify(res);

        const paymentResp = res.SaleToPOIResponse?.PaymentResponse;
        const result = paymentResp?.Response?.Result;
        const errorCondition = paymentResp?.Response?.ErrorCondition;
        const additionalResponse = paymentResp?.Response?.AdditionalResponse;

        // Inspect Response.Result and handle terminal / issuer refusals
        if (result !== 'Success') {
          const declineMsg = errorCondition || additionalResponse || 'Payment refused by Adyen terminal / issuer';
          setDeclineReason(declineMsg);
          setStep('DECLINED');

          const declinedRecord: PosTransactionRecord = {
            id: txnId,
            clientUuid,
            terminalId,
            merchantId,
            amount,
            currency: activeCurrency,
            paymentMethod: method,
            cardNetwork: (method === 'CARD_CHIP' || method === 'CARD_NFC' || method === 'ADYEN_CARD' || method === 'ADYEN_NFC') ? (forcedNetwork || selectedCardNetwork) : undefined,
            cardLast4: (method === 'CARD_CHIP' || method === 'CARD_NFC' || method === 'ADYEN_CARD' || method === 'ADYEN_NFC') ? cardLast4 : undefined,
            state: 'DECLINED',
            isOffline: false,
            declineReason: declineMsg,
            nexoResponse: nexoResponseStr,
            createdAt: now
          };
          await posDb.transactions.put(declinedRecord);
          return;
        }

        // Populate authoritative pspReference and authCode from returned POIData / PaymentResult
        if (paymentResp?.POIData?.POITransactionID?.TransactionID) {
          pspReference = paymentResp.POIData.POITransactionID.TransactionID;
        }
        if (paymentResp?.PaymentResult?.PaymentAcquirerData?.ApprovalCode) {
          authCode = paymentResp.PaymentResult.PaymentAcquirerData.ApprovalCode;
        }
      }

      const onlineRecord: PosTransactionRecord = {
        id: txnId,
        clientUuid,
        terminalId,
        merchantId,
        amount,
        currency: activeCurrency,
        paymentMethod: method,
        cardNetwork: (method === 'CARD_CHIP' || method === 'CARD_NFC' || method === 'ADYEN_CARD' || method === 'ADYEN_NFC') ? (forcedNetwork || selectedCardNetwork) : undefined,
        cardLast4: (method === 'CARD_CHIP' || method === 'CARD_NFC' || method === 'ADYEN_CARD' || method === 'ADYEN_NFC') ? cardLast4 : undefined,
        upiVpa: method === 'UPI_LITE' ? (customVpa || customerVpa) : undefined,
        cryptoWalletAddress: method === 'CRYPTO_WALLET' ? (cryptoAddr || customerCryptoAddress) : undefined,
        cryptoChain: method === 'CRYPTO_WALLET' ? (chain || selectedChain) : undefined,
        cryptoTxHash: method === 'CRYPTO_WALLET' ? `0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}` : undefined,
        cryptoAmountToken: method === 'CRYPTO_WALLET' ? (amount * (CHAIN_DISPLAY[chain || selectedChain]?.rate || 0.012)).toFixed(8) : undefined,
        
        pspReference,
        serviceId,
        saleTransactionId: txnId,
        authCode,
        nexoResponse: nexoResponseStr,
        
        state: 'SETTLED',
        isOffline: false,
        rrn: `RRN${Date.now().toString().slice(-10)}`,
        createdAt: now,
        settledAt: now
      };

      await posDb.transactions.put(onlineRecord);
      setCompletedTxn(onlineRecord);

      const amountFormatted = `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      triggerSoundbox(`${amountFormatted} approved on Adyen ${onlineRecord.cardNetwork || 'Terminal'}!`);

      if (method === 'CARD_CHIP' || method === 'ADYEN_CARD') {
        setStep('REMOVE_CARD');
      } else {
        setStep('APPROVED');
      }
      onPaymentSuccess(onlineRecord);

    } catch (err: unknown) {
      console.error('Failed to complete transaction:', err);
      const errorMessage = err instanceof Error ? err.message : 'Terminal API / Network Communication Failure';
      setDeclineReason(errorMessage);
      setStep('DECLINED');
    }
  }, [activeCurrency, amount, cardLast4, currencySymbol, customerCryptoAddress, customerVpa, isOfflineModeAllowed, isOnline, merchantId, method, onPaymentSuccess, safConfig, selectedCardNetwork, selectedChain, terminalId]);

  if (!isOpen) return null;

  // Contactless Tap Handler
  const handleSimulateTap = (_sourceType: 'CARD' | 'PHONE', network: CardNetwork = 'RUPAY') => {
    setSelectedCardNetwork(network);
    setStep('READING');

    setTimeout(() => {
      if (amount > 5000 && activeCurrency === 'INR' && isOnline) {
        setStep('PIN_ENTRY');
      } else {
        finalizeTransaction(network);
      }
    }, 900);
  };

  // Insert Card Handler
  const handleSimulateInsertCard = (network: CardNetwork = 'VISA') => {
    setSelectedCardNetwork(network);
    setStep('READING');
    setTimeout(() => {
      setStep('PIN_ENTRY');
    }, 850);
  };

  // Adyen Async QR Handler
  const handleSimulateAsyncQrScan = (apmName: 'Alipay' | 'WeChat Pay' | 'PayByBank') => {
    setStep('WAITING_WEBHOOK');
    const pspRef = adyenTerminalService.generatePspReference();
    const txnId = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
    setInFlightMerchantRef(txnId);

    const now = new Date().toISOString();
    const inFlightTxn: PosTransactionRecord = {
      id: txnId,
      clientUuid: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `uuid-${Date.now()}`,
      terminalId,
      merchantId,
      amount,
      currency: activeCurrency,
      paymentMethod: 'ADYEN_QR',
      pspReference: pspRef,
      state: 'IN_FLIGHT',
      isOffline: !isOnline,
      createdAt: now
    };
    posDb.transactions.put(inFlightTxn);

    adyenTerminalService.triggerMockAsyncWebhook({
      merchantReference: txnId,
      pspReference: pspRef,
      amount,
      currency: activeCurrency,
      paymentMethod: apmName,
      delayMs: 3500,
      shouldSucceed: true
    })
    .then(async (item) => {
      const isSuccess = item.success === 'true';
      const settledTimestamp = new Date().toISOString();

      if (isSuccess) {
        const settledRecord: PosTransactionRecord = {
          ...inFlightTxn,
          state: 'SETTLED',
          authCode: item.additionalData.authCode,
          syncedAt: settledTimestamp,
          settledAt: settledTimestamp
        };
        await posDb.transactions.put(settledRecord);
        setCompletedTxn(settledRecord);
        setInFlightMerchantRef(null);
        onPaymentSuccess(settledRecord);
      } else {
        const declinedRecord: PosTransactionRecord = {
          ...inFlightTxn,
          state: 'DECLINED',
          declineReason: item.reason || 'Asynchronous authorization refused by issuer'
        };
        await posDb.transactions.put(declinedRecord);
        setInFlightMerchantRef(null);
        setDeclineReason(item.reason || 'Asynchronous authorization refused by issuer');
        setStep('DECLINED');
      }
    })
    .catch((err: unknown) => {
      console.error('[AsyncQR] Webhook resolution failed:', err);
      const errMsg = err instanceof Error ? err.message : 'Asynchronous payment authorization timeout or error';
      setInFlightMerchantRef(null);
      setDeclineReason(errMsg);
      setStep('DECLINED');
    });
  };

  // PIN Keypad Handlers
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

  const handlePinBackspace = () => setPin(prev => prev.slice(0, -1));
  const handlePinClear = () => setPin('');

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
          <span>🔊 Soundbox: &quot;{soundboxAlert}&quot;</span>
        </div>
      )}

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center gap-4 relative overflow-hidden text-zinc-100 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Top Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-emerald-400">
              {(method === 'CARD_NFC' || method === 'ADYEN_NFC') && <Radio className="w-4 h-4" />}
              {(method === 'CARD_CHIP' || method === 'ADYEN_CARD') && <CreditCard className="w-4 h-4" />}
              {(method === 'ADYEN_QR') && <QrCode className="w-4 h-4" />}
              {method === 'UPI_LITE' && <Zap className="w-4 h-4" />}
              {method === 'CRYPTO_WALLET' && <Wallet className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-zinc-100">
                {(method === 'CARD_NFC' || method === 'ADYEN_NFC') && 'Adyen Contactless Tap to Pay'}
                {(method === 'CARD_CHIP' || method === 'ADYEN_CARD') && 'Adyen EMV Chip & PIN'}
                {(method === 'ADYEN_QR') && 'Adyen Async QR / APMs'}
                {method === 'UPI_LITE' && 'UPI Lite Offline'}
                {method === 'CRYPTO_WALLET' && 'Crypto Web3 Offline Sign'}
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">
                {merchantName} • {terminalId}
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close Payment Modal"
            onClick={onClose}
            disabled={step === 'READING' || step === 'AUTHORIZING' || step === 'WAITING_WEBHOOK'}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Charge Amount Banner */}
        <div className="w-full bg-zinc-950/80 border border-zinc-850 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Total Payable</span>
            <span className="text-xl sm:text-2xl font-mono font-black text-white">
              {currencySymbol}{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-right font-mono">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              {isOnline ? 'Adyen Cloud' : 'SaF Offline Queue'}
            </span>
          </div>
        </div>

        {/* 1. ADYEN CONTACTLESS TAP */}
        {(method === 'CARD_NFC' || method === 'ADYEN_NFC') && step === 'IDLE' && (
          <div className="w-full flex flex-col items-center gap-4 py-2">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-emerald-500/15 animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-emerald-500/50 flex flex-col items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
                <Radio className="w-8 h-8 animate-pulse" />
                <span className="text-[8px] font-bold tracking-wider mt-0.5">NFC ZONE</span>
              </div>
            </div>

            <div className="text-center">
              <h4 className="text-sm font-bold text-zinc-100">Tap Card or Phone on Terminal</h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                Hold contactless EMV card or Apple/Google Pay near the top NFC antenna.
              </p>
            </div>

            <div className="w-full flex flex-col gap-2 pt-2 border-t border-zinc-800">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateTap('CARD', 'RUPAY')}
                  className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 active:scale-95 border border-zinc-700 flex flex-col items-center gap-1 transition-all text-xs font-semibold text-zinc-200 cursor-pointer"
                >
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <span>RuPay Contactless</span>
                  <span className="text-[9px] text-zinc-400 font-mono">•••• 8392</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateTap('CARD', 'VISA')}
                  className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 active:scale-95 border border-zinc-700 flex flex-col items-center gap-1 transition-all text-xs font-semibold text-zinc-200 cursor-pointer"
                >
                  <CreditCard className="w-5 h-5 text-sky-400" />
                  <span>Visa PayWave</span>
                  <span className="text-[9px] text-zinc-400 font-mono">•••• 4120</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleSimulateTap('PHONE', 'VISA')}
                className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-98 border border-emerald-500/30 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-300 transition-all cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Simulate Phone NFC Tap (Apple / Google Pay)</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. ADYEN CHIP & PIN */}
        {(method === 'CARD_CHIP' || method === 'ADYEN_CARD') && step === 'IDLE' && (
          <div className="w-full flex flex-col items-center gap-4 py-2">
            <div className="w-full max-w-xs p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col items-center gap-3 relative overflow-hidden">
              <div className="w-48 h-28 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-zinc-600 p-3 flex flex-col justify-between shadow-lg">
                <div className="flex justify-between items-center">
                  <div className="w-8 h-6 rounded bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 border border-amber-600 shadow-inner flex items-center justify-center" />
                  <span className="text-[10px] font-bold text-zinc-300 font-mono">EMV CHIP</span>
                </div>
                <div className="font-mono text-xs text-zinc-200 tracking-wider">
                  •••• •••• •••• 5921
                </div>
              </div>
            </div>

            <div className="text-center">
              <h4 className="text-sm font-bold text-zinc-100">Insert Card into EMV Reader</h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                Insert chip-first into terminal bottom slot and keep inserted for PIN entry.
              </p>
            </div>

            <div className="w-full flex flex-col gap-2 pt-2 border-t border-zinc-800">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateInsertCard('VISA')}
                  className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 active:scale-95 border border-zinc-700 flex flex-col items-center gap-1 transition-all text-xs font-semibold text-zinc-200 cursor-pointer"
                >
                  <CreditCard className="w-5 h-5 text-sky-400" />
                  <span>Insert Visa Chip</span>
                  <span className="text-[9px] text-zinc-400 font-mono">•••• 5921</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateInsertCard('MASTERCARD')}
                  className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 active:scale-95 border border-zinc-700 flex flex-col items-center gap-1 transition-all text-xs font-semibold text-zinc-200 cursor-pointer"
                >
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  <span>Insert Mastercard</span>
                  <span className="text-[9px] text-zinc-400 font-mono">•••• 8820</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. ADYEN DYNAMIC ASYNC QR */}
        {method === 'ADYEN_QR' && step === 'IDLE' && (
          <div className="w-full flex flex-col items-center gap-3.5 py-1">
            <div className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-4 flex flex-col items-center gap-3 shadow-lg">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Adyen Dynamic QR Session</span>
                    <span className="text-[9px] text-zinc-400 font-mono">Async Webhook Settlement (3-5s)</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                  ORDER_OPENED
                </span>
              </div>

              <div className="relative p-2 rounded-2xl bg-white border border-zinc-300 shadow-inner flex flex-col items-center">
                <DynamicQrCode
                  value={`https://qr.adyen.com/pay/${merchantId}?amt=${amount}&cur=${activeCurrency}&sid=${adyenTerminalService.generateServiceId()}`}
                  size={150}
                />
              </div>

              <div className="text-[10px] text-zinc-400 font-mono text-center">
                Scan with Alipay, WeChat Pay, or PayByBank app
              </div>
            </div>

            <div className="w-full flex flex-col gap-2 pt-2 border-t border-zinc-800">
              <span className="text-[10px] font-semibold text-zinc-400 text-center uppercase tracking-wider">
                Simulate Shopper Mobile Scan
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateAsyncQrScan('Alipay')}
                  className="py-2.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 active:scale-95 border border-sky-500/30 flex items-center justify-center gap-1.5 text-xs font-semibold text-sky-300 transition-all cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                  <span>Scan via Alipay</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateAsyncQrScan('WeChat Pay')}
                  className="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 border border-emerald-500/30 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-300 transition-all cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Scan via WeChat</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. ASYNC WEBHOOK WAITING VIEW */}
        {step === 'WAITING_WEBHOOK' && (
          <div className="w-full py-10 flex flex-col items-center justify-center gap-4 text-center animate-fade-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin flex items-center justify-center" />
              <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs text-emerald-400">
                {asyncQrCountdown}s
              </div>
            </div>

            <div>
              <h4 className="text-sm sm:text-base font-bold text-white flex items-center justify-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                <span>Waiting for Adyen Webhook Dispatcher...</span>
              </h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                Customer has scanned QR code on mobile. Simulating inbound Adyen AUTHORISATION webhook payload (3-5s network latency).
              </p>
            </div>
          </div>
        )}

        {/* READING / AUTHORIZING VIEW */}
        {(step === 'READING' || step === 'AUTHORIZING') && (
          <div className="w-full py-10 flex flex-col items-center justify-center gap-4 text-center animate-fade-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin flex items-center justify-center" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-6 h-6 text-emerald-400" />
              </div>
            </div>

            <div>
              <h4 className="text-sm sm:text-base font-bold text-white">
                {step === 'READING' ? 'Reading Contactless / Chip Element...' : 'Exchanging Nexo 3.0 ISO 20022 Cryptogram...'}
              </h4>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                Adyen Terminal API • {terminalId}
              </p>
            </div>
          </div>
        )}

        {/* PIN ENTRY VIEW */}
        {step === 'PIN_ENTRY' && (
          <div className="w-full flex flex-col items-center gap-3 animate-fade-in">
            <div className="text-center">
              <div className="text-xs font-semibold text-zinc-300 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enter 4-Digit Card PIN on Terminal</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                PCI-PTS 5.x / PIN on Glass Verification
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 my-1">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                    idx < pin.length
                      ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                      : 'bg-zinc-800 border-zinc-700'
                  }`}
                />
              ))}
            </div>

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
                        className="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-750 active:scale-95 border border-zinc-700 font-mono text-base font-medium text-white flex items-center justify-center transition-all cursor-pointer"
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

        {/* REMOVE CARD VIEW */}
        {step === 'REMOVE_CARD' && (
          <div className="w-full py-8 flex flex-col items-center justify-center gap-4 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <CreditCard className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Please Remove Card</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Authorization complete. Remove card from the reader.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep('APPROVED')}
              className="py-2.5 px-6 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs transition-transform active:scale-95 cursor-pointer"
            >
              Simulate Card Removed →
            </button>
          </div>
        )}

        {/* APPROVED RECEIPT VIEW */}
        {step === 'APPROVED' && (
          <div className="w-full flex flex-col items-center gap-3 py-2 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">
                {completedTxn?.state === 'STORED_OFFLINE' ? 'Offline Payment Queued!' : 'Payment Approved!'}
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                PSP Ref: {completedTxn?.pspReference || '883619284729104A'}
              </p>
            </div>

            <div className="w-full p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] font-mono text-zinc-300 space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-zinc-500">AMOUNT PAID:</span>
                <span className="font-bold text-white">{currencySymbol}{amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">AUTH CODE:</span>
                <span className="text-emerald-400 font-bold">{completedTxn?.authCode || 'AUTH-928301'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">TERMINAL:</span>
                <span className="text-zinc-300">{terminalId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">SETTLEMENT MODE:</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                  completedTxn?.state === 'STORED_OFFLINE'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                }`}>
                  {completedTxn?.state === 'STORED_OFFLINE' ? 'STORED_OFFLINE (SaF)' : 'ADYEN_CLOUD_SYNC'}
                </span>
              </div>

              {/* Dynamic Display of Adyen-Offline-Auth-Signature */}
              {completedTxn?.offlineSignature && (
                <div className="flex flex-col gap-1 pt-1.5 mt-1 border-t border-zinc-800">
                  <div className="flex items-center gap-1 text-[9px] font-semibold text-amber-400 uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Adyen-Offline-Auth-Signature</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-black border border-amber-500/30 text-[9.5px] font-mono text-amber-200 break-all select-all">
                    {completedTxn.offlineSignature}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full mt-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Done & Print Thermal Receipt
            </button>
          </div>
        )}

        {/* DECLINED VIEW (Dark High-Contrast Risk Error State) */}
        {step === 'DECLINED' && (
          <div className="w-full flex flex-col items-center gap-3 py-4 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-400 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <XCircle className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">Transaction Declined</h4>
              <p className="text-xs text-zinc-400 mt-0.5">Adyen Terminal Risk Engine Refusal</p>
            </div>

            {/* High-Contrast Error Card */}
            <div className="w-full p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-left space-y-1.5">
              <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-bold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>DECLINE REASON</span>
              </div>
              <p className="text-xs text-rose-200 font-mono leading-relaxed">
                {declineReason || 'Declined by Adyen Store-and-Forward (SaF) policy.'}
              </p>
              {!isOnline && (
                <div className="pt-1 border-t border-rose-900/50 text-[10px] text-zinc-400 font-mono">
                  Current Status: Terminal Offline • SaF Single/Cumulative Limit Exceeded
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setStep('IDLE');
                setPin('');
              }}
              className="w-full mt-2 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white font-bold text-xs transition-colors border border-zinc-700 cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};
