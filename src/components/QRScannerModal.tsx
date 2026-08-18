import React, { useState } from 'react';
import { X, Flashlight, Image as ImageIcon, CheckCircle2, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../store/useAppStore';
import { formatINR } from '../utils/currency';

export const QRScannerModal: React.FC = () => {
  const { activeModal, closeModal, executePayment, isOnline } = useAppStore();
  const [torchOn, setTorchOn] = useState(false);
  const [scannedResult, setScannedResult] = useState<{
    name: string;
    upiId: string;
    amount: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (activeModal !== 'QR_SCANNER') return null;

  const simulateScan = (merchant: { name: string; upiId: string; amount: number }) => {
    setScannedResult(merchant);
  };

  const handlePay = async () => {
    if (!scannedResult) return;
    setIsProcessing(true);

    try {
      await executePayment({
        amount: scannedResult.amount,
        merchantName: scannedResult.name,
        merchantCategory: 'UPI Merchant QR',
        iconName: 'ShoppingBag',
        paymentMethod: 'UPI_QR',
      });

      setIsProcessing(false);
      setIsSuccess(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FF6B00', '#FF8800', '#10B981'],
      });

      setTimeout(() => {
        setIsSuccess(false);
        setScannedResult(null);
        closeModal();
      }, 1800);
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-sm rounded-[32px] overflow-hidden border border-slate-800 shadow-2xl flex flex-col text-white">
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
            <h3 className="text-sm font-bold tracking-tight">Bharat QR / UPI Scanner</h3>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 active-press flex items-center justify-center text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder View */}
        <div className="p-6 flex flex-col items-center justify-center relative">
          {!scannedResult ? (
            <>
              <div className="relative w-64 h-64 border-2 border-dashed border-brand-500/50 rounded-3xl overflow-hidden bg-slate-950/70 flex items-center justify-center">
                {/* Glowing Corner Accents */}
                <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-brand-500 rounded-tl-lg" />
                <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-brand-500 rounded-tr-lg" />
                <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-brand-500 rounded-bl-lg" />
                <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-brand-500 rounded-br-lg" />

                {/* Laser Sweep Line */}
                <div className="absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-brand-500 to-transparent shadow-[0_0_12px_#ff6b00] animate-laser-sweep" />

                {/* Placeholder Mock QR Code */}
                <div className="opacity-25 filter blur-[0.5px]">
                  <svg className="w-40 h-40 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-5 0h2v3h-2v-3zm2 3h3v3h-3v-3zm2 3h3v2h-3v-2zm-4 0h2v2h-2v-2zm-2-3h2v2h-2v-2zm0-3h2v2h-2v-2z" />
                  </svg>
                </div>

                <p className="absolute bottom-4 text-[11px] font-medium text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700/60">
                  Align Bharat QR inside frame
                </p>
              </div>

              {/* Torch & Gallery Controls */}
              <div className="flex items-center gap-4 mt-5">
                <button
                  onClick={() => setTorchOn(!torchOn)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 border active-press ${
                    torchOn
                      ? 'bg-brand-500 text-white border-brand-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Flashlight className="w-3.5 h-3.5" />
                  <span>{torchOn ? 'Flash On' : 'Torch'}</span>
                </button>

                <button
                  onClick={() =>
                    simulateScan({
                      name: 'Chai Point • Cyber Hub',
                      upiId: 'chaipoint@icici',
                      amount: 180,
                    })
                  }
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 flex items-center gap-2 active-press"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Demo Scan</span>
                </button>
              </div>

              {/* Quick Preset Merchant Scans */}
              <div className="mt-5 w-full">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 text-center">
                  Quick Simulate Merchant QR
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      simulateScan({
                        name: 'Haldiram Sweets Delhi',
                        upiId: 'haldiram@hdfcbank',
                        amount: 650,
                      })
                    }
                    className="p-2 bg-slate-800/80 hover:bg-slate-800 rounded-xl text-left border border-slate-700/50 text-xs active-press"
                  >
                    <p className="font-bold text-slate-200 truncate">Haldiram's</p>
                    <p className="text-[10px] text-brand-400 font-semibold">₹ 650.00</p>
                  </button>

                  <button
                    onClick={() =>
                      simulateScan({
                        name: 'Reliance Smart Superstore',
                        upiId: 'relsmart@sbi',
                        amount: 2450,
                      })
                    }
                    className="p-2 bg-slate-800/80 hover:bg-slate-800 rounded-xl text-left border border-slate-700/50 text-xs active-press"
                  >
                    <p className="font-bold text-slate-200 truncate">Reliance Smart</p>
                    <p className="text-[10px] text-brand-400 font-semibold">₹ 2,450.00</p>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Scanned Confirmation View */
            <div className="w-full text-center py-2">
              {isSuccess ? (
                <div className="py-6 flex flex-col items-center">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce mb-3" />
                  <h4 className="text-lg font-extrabold text-white">Payment Successful!</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {isOnline
                      ? 'Authorized by NPCI / Acquirer Gateway'
                      : 'Cryptographically signed & saved to local offline ledger'}
                  </p>
                  <p className="text-2xl font-black text-brand-400 mt-3">
                    {formatINR(scannedResult.amount)}
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mx-auto mb-3 text-brand-400">
                    <ShieldCheck className="w-8 h-8" />
                  </div>

                  <h4 className="text-base font-bold text-white">{scannedResult.name}</h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{scannedResult.upiId}</p>

                  <div className="my-5 p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
                    <p className="text-[11px] text-slate-400 uppercase font-semibold">Amount to Pay</p>
                    <p className="text-3xl font-black text-white mt-1">
                      {formatINR(scannedResult.amount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setScannedResult(null)}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs active-press"
                    >
                      Rescan
                    </button>
                    <button
                      onClick={handlePay}
                      disabled={isProcessing}
                      className="flex-2 py-3 bg-gradient-to-r from-brand-600 to-brand-550 hover:from-brand-550 hover:to-brand-500 text-white rounded-xl font-extrabold text-xs shadow-btn-orange active-press flex items-center justify-center gap-1.5"
                    >
                      {isProcessing ? 'Processing...' : `Pay ${formatINR(scannedResult.amount)}`}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
