import React from 'react';
import { Eye, EyeOff, Radio, ArrowUpRight, ShieldCheck, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatINR } from '../utils/currency';

export const CreditCardView: React.FC = () => {
  const {
    activeTab,
    cards,
    activeCardIndex,
    setActiveCardIndex,
    isBalanceVisible,
    toggleBalanceVisibility,
    openModal,
  } = useAppStore();

  const currentCard = cards[activeCardIndex] || cards[0];

  const handleNextCard = () => {
    setActiveCardIndex((activeCardIndex + 1) % cards.length);
  };

  const handlePrevCard = () => {
    setActiveCardIndex((activeCardIndex - 1 + cards.length) % cards.length);
  };

  // If Account Tab is chosen
  if (activeTab === 'ACCOUNT') {
    return (
      <div className="px-5 mt-5">
        <div className="bg-white rounded-3xl p-6 shadow-card-float border border-slate-100/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Primary Savings Account (HDFC Bank)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
              Active KYC
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Available Balance</p>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {isBalanceVisible ? formatINR(284950.00) : '₹ ••••••••'}
              </h2>
            </div>
            <button
              onClick={toggleBalanceVisibility}
              className="p-2 text-slate-400 hover:text-slate-600 active-press rounded-full hover:bg-slate-100"
            >
              {isBalanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between mb-4 text-xs">
            <div>
              <p className="text-slate-400 font-medium">A/C Number</p>
              <p className="font-mono font-bold text-slate-800">50100489920194</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">IFSC Code</p>
              <p className="font-mono font-bold text-slate-800">HDFC0000240</p>
            </div>
          </div>

          <button
            onClick={() => openModal('PAYMENT')}
            className="w-full py-3 bg-brand-600 hover:bg-brand-550 text-white rounded-2xl font-bold text-sm shadow-btn-orange flex items-center justify-center gap-2 active-press transition-all"
          >
            <span>Transfer Funds</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // If Loan Tab is chosen
  if (activeTab === 'LOAN') {
    return (
      <div className="px-5 mt-5">
        <div className="bg-white rounded-3xl p-6 shadow-card-float border border-slate-100/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Business Overdraft & Working Capital
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
              Pre-Approved
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Sanctioned Line of Credit</p>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {isBalanceVisible ? formatINR(1000000.00, false) : '₹ ••••••••'}
              </h2>
            </div>
            <button
              onClick={toggleBalanceVisibility}
              className="p-2 text-slate-400 hover:text-slate-600 active-press rounded-full hover:bg-slate-100"
            >
              {isBalanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="space-y-2 mb-4 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Utilized: {formatINR(120000.0)}</span>
              <span>Available: {formatINR(880000.0)}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-brand-600 h-full rounded-full w-[12%]" />
            </div>
            <p className="text-[11px] text-slate-400 text-right">Interest Rate: 9.25% p.a.</p>
          </div>

          <button
            onClick={() => openModal('PAYMENT')}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm shadow-subtle flex items-center justify-center gap-2 active-press transition-all"
          >
            <span>Drawdown to Account</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Default: Credit Card View (Active by Default)
  return (
    <div className="px-5 mt-4">
      {/* Floating Card Container */}
      <div className="relative group">
        {/* The Credit Card Graphic */}
        <div
          className={`card-metallic rounded-3xl p-6 text-white shadow-card-float border border-slate-700/50 bg-gradient-to-br ${currentCard.gradient} transition-all duration-300`}
        >
          {/* Card Top Row: Chip, Contactless Wave, and Card Brand */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* EMV Microchip */}
              <div className="emv-chip w-10 h-7 rounded-md shadow-inner flex items-center justify-center">
                <div className="w-6 h-4 border-t border-b border-amber-800/40" />
              </div>

              {/* Contactless RFID Wave */}
              <Radio className="w-4 h-4 text-white/70 rotate-90" />

              {currentCard.isFrozen && (
                <span className="flex items-center gap-1 text-[10px] font-bold bg-red-500/80 px-2 py-0.5 rounded-full backdrop-blur-sm text-white">
                  <Lock className="w-2.5 h-2.5" /> FROZEN
                </span>
              )}
            </div>

            {/* Card Brand & Type Badge */}
            <div className="text-right">
              <span className="text-xs font-black tracking-wider uppercase text-orange-400">
                {currentCard.brand === 'VISA' ? 'VISA' : currentCard.brand === 'RUPAY' ? 'RuPay' : 'Mastercard'}
              </span>
              <p className="text-[10px] font-medium text-slate-300">
                {currentCard.cardType}
              </p>
            </div>
          </div>

          {/* Masked Card Number */}
          <div className="mb-4">
            <p className="font-mono text-sm tracking-[0.25em] text-slate-300 font-medium drop-shadow-sm">
              {currentCard.cardNumberMasked}
            </p>
          </div>

          {/* Card Balance & Eye Toggle */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Total Balance
                </span>
                <button
                  onClick={toggleBalanceVisibility}
                  className="text-slate-400 hover:text-white transition-colors p-0.5 active-press"
                  aria-label="Toggle Balance Visibility"
                >
                  {isBalanceVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {isBalanceVisible ? formatINR(currentCard.balance) : '₹ ••••••••'}
              </h2>
            </div>

            {/* Quick "Pay" Button on Card */}
            <button
              onClick={() => openModal('PAYMENT')}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-550 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-xs font-extrabold shadow-btn-orange flex items-center gap-1.5 active-press transition-transform"
            >
              <span>Pay</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cardholder & Expiry Row */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
            <div>
              <p className="text-slate-400 text-[9px] uppercase tracking-wider font-semibold">Card Holder</p>
              <p className="font-semibold text-slate-200 tracking-wide">{currentCard.cardHolder}</p>
            </div>

            <div className="text-right">
              <p className="text-slate-400 text-[9px] uppercase tracking-wider font-semibold">Expires</p>
              <p className="font-mono font-semibold text-slate-200">{currentCard.expiryDate}</p>
            </div>
          </div>
        </div>

        {/* Card Switcher Carousel Indicators & Controls */}
        <div className="flex items-center justify-between mt-3 px-1">
          <button
            onClick={handlePrevCard}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 active-press hover:bg-slate-100"
            aria-label="Previous Card"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {cards.map((card, idx) => (
              <button
                key={card.id}
                onClick={() => setActiveCardIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeCardIndex === idx ? 'w-6 bg-brand-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Switch to card ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNextCard}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 active-press hover:bg-slate-100"
            aria-label="Next Card"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Available Limit Progress Mini-Card */}
        <div className="mt-2.5 bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-subtle border border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span className="text-slate-500 font-medium">Available Limit:</span>
            <span className="font-bold text-slate-800">
              {isBalanceVisible ? formatINR(currentCard.availableLimit, false) : '••••'}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-brand-600">
            Total {formatINR(currentCard.totalLimit, false)}
          </span>
        </div>
      </div>
    </div>
  );
};
