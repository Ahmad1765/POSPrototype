import React, { useState } from 'react';
import { X, ArrowRight, CheckCircle2, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../store/useAppStore';
import { formatINR } from '../utils/currency';

export const QuickPayModal: React.FC = () => {
  const { activeModal, closeModal, openModal, executePayment, isOnline, cards, activeCardIndex, contacts } = useAppStore();
  const [amountStr, setAmountStr] = useState('1500');
  const [selectedRecipient, setSelectedRecipient] = useState(contacts[0]?.name || 'Priya Patel');
  const [selectedCategory, setSelectedCategory] = useState('Personal Transfer');
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (activeModal !== 'PAYMENT' && activeModal !== 'TOP_UP') return null;

  const isTopUp = activeModal === 'TOP_UP';
  const currentCard = cards[activeCardIndex] || cards[0];

  const presets = isTopUp ? [1000, 2500, 5000, 10000] : [250, 500, 1500, 3000];

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
        particleCount: 90,
        spread: 60,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-modal-pop flex flex-col border border-zinc-200/80">
        
        {/* Header */}
        <div className="p-4 bg-zinc-50/80 flex items-center justify-between border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-orange-50 text-brand-600 flex items-center justify-center font-bold text-xs">
              ₹
            </div>
            <h3 className="text-sm font-bold text-zinc-900">
              {isTopUp ? 'Add Money to Card' : 'Send Money'}
            </h3>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-white hover:bg-zinc-100 active-press flex items-center justify-center text-zinc-500 border border-zinc-200/60 shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {isSuccess ? (
            <div className="py-8 text-center flex flex-col items-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-3 animate-bounce" />
              <h4 className="text-lg font-bold text-zinc-900">
                {isTopUp ? 'Funds Added Successfully!' : 'Payment Completed!'}
              </h4>
              <p className="text-xs text-zinc-500 mt-1">
                {isOnline
                  ? 'Real-time settlement confirmed'
                  : 'Encrypted & queued in offline wallet'}
              </p>
              <p className="text-2xl font-bold text-brand-600 mt-3 font-mono">
                {formatINR(parseFloat(amountStr))}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Beneficiary Quick Picker (If Send Money) */}
              {!isTopUp && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                      Select Contact
                    </label>
                    <button
                      type="button"
                      onClick={() => openModal('ADD_CONTACT')}
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-700"
                    >
                      + Add New
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {/* Add Contact Button Chip */}
                    <button
                      type="button"
                      onClick={() => openModal('ADD_CONTACT')}
                      className="flex flex-col items-center gap-1 shrink-0 p-1.5 rounded-xl border border-dashed border-zinc-300 hover:border-brand-500 bg-white hover:bg-zinc-50 transition-all active-press"
                    >
                      <div className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-500 font-bold text-base">
                        +
                      </div>
                      <span className="text-[10px] font-semibold text-zinc-600 max-w-[56px] truncate">
                        New
                      </span>
                    </button>

                    {contacts.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => {
                          setSelectedRecipient(c.name);
                          setSelectedCategory('Personal Transfer');
                        }}
                        className={`flex flex-col items-center gap-1 shrink-0 p-1.5 rounded-xl border transition-all active-press ${
                          selectedRecipient === c.name
                            ? 'border-brand-500 bg-orange-50/50 shadow-sm'
                            : 'border-zinc-200 bg-white hover:bg-zinc-50'
                        }`}
                      >
                        <img
                          src={c.avatar}
                          alt={c.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className="text-[10px] font-semibold text-zinc-800 max-w-[56px] truncate">
                          {c.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-zinc-400">
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
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 focus:border-brand-500 rounded-2xl text-2xl font-bold text-zinc-900 outline-none transition-all tracking-tight font-mono"
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-2 mt-2">
                  {presets.map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setAmountStr(preset.toString())}
                      className="flex-1 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-semibold rounded-xl active-press transition-colors"
                    >
                      +₹{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note / Remarks Field */}
              {!isTopUp && (
                <div>
                  <input
                    type="text"
                    placeholder="Add a note (e.g. Dinner, Rent, Groceries)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-brand-500"
                  />
                </div>
              )}

              {/* Source Card Bar */}
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand-600" />
                  <span className="text-zinc-500">Paying from:</span>
                  <span className="font-semibold text-zinc-800">{currentCard.name}</span>
                </div>
                <span className="font-mono text-zinc-400 text-[11px]">
                  ({currentCard.cardNumberMasked.slice(-4)})
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-btn-orange flex items-center justify-center gap-2 active-press transition-all"
              >
                {isProcessing ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>{isTopUp ? 'Add Funds' : `Pay ${selectedRecipient}`}</span>
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
