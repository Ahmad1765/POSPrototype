import React, { useState } from 'react';
import { X, ArrowRight, CheckCircle2, ShieldCheck, CreditCard, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../store/useAppStore';
import { formatINR } from '../utils/currency';

export const QuickPayModal: React.FC = () => {
  const { activeModal, closeModal, executePayment, isOnline, cards, activeCardIndex } = useAppStore();
  const [amountStr, setAmountStr] = useState('1500');
  const [selectedRecipient, setSelectedRecipient] = useState('Tata Power Electricity');
  const [selectedCategory, setSelectedCategory] = useState('Utilities & Power');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (activeModal !== 'PAYMENT' && activeModal !== 'TOP_UP') return null;

  const isTopUp = activeModal === 'TOP_UP';
  const currentCard = cards[activeCardIndex] || cards[0];

  const presets = isTopUp ? [1000, 2500, 5000, 10000] : [250, 500, 1500, 3000];

  const recipients = [
    { name: 'Tata Power Electricity', category: 'Utility Bill', icon: 'Zap' },
    { name: 'Airtel Fiber 5G', category: 'Telecom & Internet', icon: 'Radio' },
    { name: 'Zomato Gold Delivery', category: 'Food & Dining', icon: 'Utensils' },
    { name: 'Uber Premier Ride', category: 'Cab & Transit', icon: 'ShoppingBag' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amountStr);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    setIsProcessing(true);

    try {
      await executePayment({
        amount: numericAmount,
        merchantName: isTopUp ? 'Instant Bank Cash-In' : selectedRecipient,
        merchantCategory: isTopUp ? 'Card Deposit' : selectedCategory,
        iconName: isTopUp ? 'ArrowDownLeft' : 'ShoppingBag',
        paymentMethod: isTopUp ? 'TOP_UP' : 'CARD',
      });

      setIsProcessing(false);
      setIsSuccess(true);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6B00', '#F59E0B', '#10B981'],
      });

      setTimeout(() => {
        setIsSuccess(false);
        closeModal();
      }, 1600);
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-slate-100">
        
        {/* Header */}
        <div className="p-4 bg-slate-50 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-orange-100 text-brand-600 flex items-center justify-center font-bold text-xs">
              ₹
            </div>
            <h3 className="text-sm font-extrabold text-slate-800">
              {isTopUp ? 'Instant Card Top-Up' : 'Quick Payment'}
            </h3>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 active-press flex items-center justify-center text-slate-500 shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {isSuccess ? (
            <div className="py-8 text-center flex flex-col items-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-3 animate-bounce" />
              <h4 className="text-lg font-black text-slate-900">
                {isTopUp ? 'Top-Up Successful!' : 'Payment Completed!'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {isOnline
                  ? 'Real-time settlement confirmed'
                  : 'Signed locally with HMAC-SHA256 • Stored in offline queue'}
              </p>
              <p className="text-2xl font-black text-brand-600 mt-3">
                {formatINR(parseFloat(amountStr))}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Recipient Selector (If not top-up) */}
              {!isTopUp && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Pay To
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {recipients.map((rec) => (
                      <button
                        type="button"
                        key={rec.name}
                        onClick={() => {
                          setSelectedRecipient(rec.name);
                          setSelectedCategory(rec.category);
                        }}
                        className={`p-2.5 rounded-2xl text-left border text-xs transition-all active-press ${
                          selectedRecipient === rec.name
                            ? 'bg-orange-50/70 border-brand-500 text-brand-900 font-bold shadow-sm'
                            : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <p className="font-bold truncate">{rec.name}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{rec.category}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Enter Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="0"
                    min="1"
                    step="1"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-brand-500 rounded-2xl text-2xl font-black text-slate-900 outline-none transition-all tracking-tight"
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-2 mt-2">
                  {presets.map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setAmountStr(preset.toString())}
                      className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl active-press transition-colors"
                    >
                      +₹{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Card Mini Bar */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand-600" />
                  <span className="text-slate-600 font-medium">Source:</span>
                  <span className="font-bold text-slate-800">{currentCard.name}</span>
                </div>
                <span className="font-mono text-slate-400 text-[11px]">
                  {currentCard.cardNumberMasked.slice(-4)}
                </span>
              </div>

              {/* Security & Offline Badge */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  {isOnline ? 'Online 256-bit SSL' : 'Offline HMAC Protection'}
                </span>
                <span className="flex items-center gap-1 text-brand-600 font-semibold">
                  <Sparkles className="w-3 h-3" />
                  Earn 1% Points
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 bg-gradient-to-r from-brand-550 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-2xl font-extrabold text-sm shadow-btn-orange flex items-center justify-center gap-2 active-press transition-all"
              >
                {isProcessing ? (
                  <span>Processing Payment...</span>
                ) : (
                  <>
                    <span>{isTopUp ? 'Top Up' : 'Pay'} {amountStr ? formatINR(parseFloat(amountStr) || 0) : '₹0'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
