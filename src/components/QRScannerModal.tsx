import React, { useState } from 'react';
import { 
  X, Flashlight, Image as ImageIcon, CheckCircle2, 
  ShieldCheck, QrCode, Scan, Copy, Check, Share2 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../store/useAppStore';
import { formatINR } from '../utils/currency';

export const QRScannerModal: React.FC = () => {
  const { activeModal, closeModal, executePayment, isOnline, user } = useAppStore();
  const [activeTab, setActiveTab] = useState<'SCAN' | 'RECEIVE'>('SCAN');
  const [torchOn, setTorchOn] = useState(false);
  const [receiveAmount, setReceiveAmount] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);

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

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(user.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
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
      }, 1600);
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 w-full max-w-sm rounded-[32px] overflow-hidden border border-zinc-800 shadow-modal-pop flex flex-col text-white">
        
        {/* Modal Header with Segmented Tab Switcher */}
        <div className="p-4 border-b border-zinc-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              <h3 className="text-sm font-bold tracking-tight">Bharat QR Hub</h3>
            </div>
            <button
              onClick={closeModal}
              className="w-8 h-8 rounded-full bg-zinc-850 hover:bg-zinc-800 active-press flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Segmented Tab Bar */}
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab('SCAN');
                setScannedResult(null);
              }}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'SCAN' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Scan className="w-3.5 h-3.5" />
              <span>Scan QR</span>
            </button>
            <button
              onClick={() => setActiveTab('RECEIVE')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'RECEIVE' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>My QR Code</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Scan Mode */}
        {activeTab === 'SCAN' && (
          <div className="p-6 flex flex-col items-center justify-center relative">
            {!scannedResult ? (
              <>
                <div className="relative w-60 h-60 border-2 border-dashed border-brand-500/40 rounded-3xl overflow-hidden bg-zinc-900/60 flex items-center justify-center">
                  <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-brand-500 rounded-tl-lg" />
                  <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-brand-500 rounded-tr-lg" />
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-brand-500 rounded-bl-lg" />
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-brand-500 rounded-br-lg" />

                  {/* Laser Sweep Line */}
                  <div className="absolute top-0 left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-brand-500 to-transparent shadow-[0_0_12px_#ff6b00] animate-laser-sweep" />

                  {/* Mock Matrix */}
                  <div className="opacity-20">
                    <svg className="w-36 h-36 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-5 0h2v3h-2v-3zm2 3h3v3h-3v-3zm2 3h3v2h-3v-2zm-4 0h2v2h-2v-2zm-2-3h2v2h-2v-2zm0-3h2v2h-2v-2z" />
                    </svg>
                  </div>

                  <p className="absolute bottom-3 text-[10px] font-medium text-zinc-300 bg-zinc-950/80 px-3 py-1 rounded-full border border-zinc-700/60">
                    Point camera at any UPI or Bharat QR
                  </p>
                </div>

                {/* Torch & Fast Scan */}
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={() => setTorchOn(!torchOn)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border active-press ${
                      torchOn ? 'bg-brand-500 text-white border-brand-400' : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                    }`}
                  >
                    <Flashlight className="w-3.5 h-3.5" />
                    <span>{torchOn ? 'Torch On' : 'Torch'}</span>
                  </button>

                  <button
                    onClick={() =>
                      simulateScan({
                        name: 'Starbucks Reserve India',
                        upiId: 'starbucks@hdfcbank',
                        amount: 450,
                      })
                    }
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-850 flex items-center gap-1.5 active-press"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Simulate Scan</span>
                  </button>
                </div>

                {/* Quick Merchant Demos */}
                <div className="mt-4 w-full">
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5 text-center">
                    Quick Sample QR Codes
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        simulateScan({
                          name: 'Blue Tokai Coffee Roasters',
                          upiId: 'bluetokai@icici',
                          amount: 320,
                        })
                      }
                      className="p-2 bg-zinc-900 hover:bg-zinc-850 rounded-xl text-left border border-zinc-800 text-xs active-press"
                    >
                      <p className="font-bold text-zinc-200 truncate">Blue Tokai</p>
                      <p className="text-[10px] text-brand-400 font-semibold font-mono">₹ 320.00</p>
                    </button>

                    <button
                      onClick={() =>
                        simulateScan({
                          name: 'Nature Basket Supermarket',
                          upiId: 'naturebasket@axisbank',
                          amount: 1840,
                        })
                      }
                      className="p-2 bg-zinc-900 hover:bg-zinc-850 rounded-xl text-left border border-zinc-800 text-xs active-press"
                    >
                      <p className="font-bold text-zinc-200 truncate">Nature's Basket</p>
                      <p className="text-[10px] text-brand-400 font-semibold font-mono">₹ 1,840.00</p>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Scanned Review Screen */
              <div className="w-full text-center py-2">
                {isSuccess ? (
                  <div className="py-6 flex flex-col items-center">
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce mb-3" />
                    <h4 className="text-lg font-extrabold text-white">Payment Confirmed!</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      {isOnline
                        ? 'Approved via Instant UPI Network'
                        : 'Securely recorded offline with tamper-proof token'}
                    </p>
                    <p className="text-2xl font-black text-brand-400 mt-3 font-mono">
                      {formatINR(scannedResult.amount)}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mx-auto mb-3 text-brand-400">
                      <ShieldCheck className="w-7 h-7" />
                    </div>

                    <h4 className="text-sm font-bold text-white">{scannedResult.name}</h4>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">{scannedResult.upiId}</p>

                    <div className="my-4 p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                      <p className="text-[10px] text-zinc-400 uppercase font-semibold">Total Payable</p>
                      <p className="text-2xl font-black text-white mt-0.5 font-mono">
                        {formatINR(scannedResult.amount)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => setScannedResult(null)}
                        className="flex-1 py-2.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded-xl font-bold text-xs active-press"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handlePay}
                        disabled={isProcessing}
                        className="flex-2 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-btn-orange active-press"
                      >
                        {isProcessing ? 'Processing...' : `Pay ${formatINR(scannedResult.amount)}`}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Show My QR (Receive Mode) */}
        {activeTab === 'RECEIVE' && (
          <div className="p-6 flex flex-col items-center justify-center space-y-4">
            {/* White Stylized QR Canvas */}
            <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-card-float flex flex-col items-center text-zinc-900">
              <div className="relative p-2">
                <svg className="w-44 h-44 text-zinc-900" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14-2h4v2h-4v-2zm-4 2h2v4h-2v-4zm4 4h4v2h-4v-2zm-6 2h2v2h-2v-2zm8-4h2v2h-2v-2zm-4-4h2v2h-2v-2zm-4 0h2v2h-2v-2z" />
                </svg>
                {/* Center Brand Badge */}
                <div className="absolute inset-0 m-auto w-10 h-10 rounded-xl bg-brand-500 text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-white">
                  ₹
                </div>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs font-bold text-zinc-900">{user.name}</p>
                <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{user.upiId}</p>
                {receiveAmount && Number(receiveAmount) > 0 && (
                  <p className="text-sm font-bold text-brand-600 font-mono mt-1">
                    Requesting: {formatINR(Number(receiveAmount))}
                  </p>
                )}
              </div>
            </div>

            {/* Optional Amount Input Field */}
            <div className="w-full space-y-1.5">
              <label className="text-[11px] text-zinc-400 font-medium">Specify Request Amount (Optional)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-zinc-400 font-bold">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={receiveAmount}
                  onChange={(e) => setReceiveAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Copy UPI & Share Actions */}
            <div className="flex items-center gap-2 w-full pt-1">
              <button
                onClick={handleCopyUpi}
                className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active-press"
              >
                {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUpi ? 'Copied' : 'Copy UPI'}</span>
              </button>

              <button
                onClick={() => {
                  navigator.share?.({ title: 'BharatPay QR', text: `Pay ${user.name} at ${user.upiId}` });
                }}
                className="flex-1 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-btn-orange flex items-center justify-center gap-1.5 active-press"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share QR</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
