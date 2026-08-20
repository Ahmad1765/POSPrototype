import React, { useState } from 'react';
import { 
  CreditCard, Lock, Unlock, ShieldCheck, 
  Radio, Check, KeyRound, ChevronRight 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatINR } from '../../utils/currency';

export const CardsView: React.FC = () => {
  const { 
    cards, activeCardIndex, setActiveCardIndex, 
    toggleCardFreeze, openModal 
  } = useAppStore();

  const [isFlipped, setIsFlipped] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const activeCard = cards[activeCardIndex] || cards[0];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="px-5 space-y-6 pb-28 animate-in fade-in duration-200">
      
      {/* 1. Header & Card Selector Pills */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">My Cards & Wallet</h2>
            <p className="text-xs text-zinc-500">Manage virtual & physical payment cards</p>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
            {cards.length} Cards Active
          </span>
        </div>

        {/* Card Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {cards.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => {
                setActiveCardIndex(idx);
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all active-press flex items-center gap-1.5 ${
                activeCardIndex === idx
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-white text-zinc-600 border border-zinc-200/80 hover:bg-zinc-50'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{card.name.split(' ')[0]} {card.name.split(' ')[1]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Interactive 3D Flipped Card */}
      <div className="perspective-1000">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`w-full h-52 rounded-2xl relative cursor-pointer transition-transform duration-700 transform-style-3d shadow-card-float select-none ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Card Front */}
          <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-zinc-900 via-neutral-900 to-black text-white p-5 border border-white/10 flex flex-col justify-between backface-hidden overflow-hidden">
            {/* Ambient Accent Glow */}
            <div 
              className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full opacity-20 blur-2xl pointer-events-none"
              style={{ backgroundColor: activeCard.accentColor }}
            />

            {/* Frozen Overlay */}
            {activeCard.isFrozen && (
              <div className="absolute inset-0 bg-sky-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-sky-200">
                <Lock className="w-8 h-8 mb-1 text-sky-300 animate-bounce" />
                <span className="text-xs font-bold uppercase tracking-wider">Card Temporarily Frozen</span>
                <span className="text-[10px] text-sky-300/80 mt-0.5">Tap below to unfreeze</span>
              </div>
            )}

            {/* Card Header: Brand & Contactless */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  {activeCard.name}
                </span>
                {activeCard.contactlessEnabled && (
                  <Radio className="w-3.5 h-3.5 text-zinc-400 rotate-90" />
                )}
              </div>
              <span className="text-sm font-black italic tracking-widest text-zinc-100">
                {activeCard.brand}
              </span>
            </div>

            {/* EMV Chip & NFC */}
            <div className="flex items-center justify-between relative z-10">
              <div className="w-10 h-7 rounded bg-gradient-to-tr from-amber-400 to-yellow-200 border border-amber-500/40 relative shadow-sm">
                <div className="absolute inset-1 border border-amber-600/30 rounded-sm" />
              </div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                Tap to view CVV / PIN
              </span>
            </div>

            {/* Card Number & Holder */}
            <div className="relative z-10">
              <p className="text-base font-mono tracking-widest text-zinc-100 font-semibold">
                {activeCard.cardNumberMasked}
              </p>
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/10">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-zinc-400">Cardholder</p>
                  <p className="text-xs font-semibold text-zinc-200 tracking-wide">{activeCard.cardHolder}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-wider text-zinc-400">Expires</p>
                  <p className="text-xs font-mono font-medium text-zinc-200">{activeCard.expiryDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card Back */}
          <div className="absolute inset-0 w-full h-full rounded-2xl bg-zinc-950 text-white p-5 border border-white/10 flex flex-col justify-between backface-hidden rotate-y-180 overflow-hidden">
            {/* Magnetic Stripe */}
            <div className="absolute top-4 left-0 right-0 h-9 bg-black" />

            <div className="mt-12 relative z-10">
              {/* Signature Strip & CVV */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-7 bg-zinc-800 rounded px-2 flex items-center justify-end">
                  <span className="text-[10px] font-mono text-zinc-400 italic">Authorized Signature</span>
                </div>
                <div className="w-14 h-7 bg-white text-zinc-900 rounded flex items-center justify-center font-mono font-bold text-xs shadow-inner">
                  {showCvv ? activeCard.cvv : '•••'}
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 text-[10px] text-zinc-400">
                <span>Security CVV Code</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCvv(!showCvv);
                  }}
                  className="text-brand-400 hover:text-brand-300 font-semibold"
                >
                  {showCvv ? 'Hide' : 'Reveal'}
                </button>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between text-[10px] text-zinc-400 border-t border-white/10 pt-2">
              <span>ATM PIN: <span className="font-mono text-zinc-200 font-bold">{activeCard.pin}</span></span>
              <span className="text-zinc-500 font-mono">24/7 Concierge Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Card Balance & Spending Limit Card */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">Available Spending Limit</p>
            <h3 className="text-xl font-bold text-zinc-900 tabular-nums">
              {formatINR(activeCard.availableLimit)}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">Total Credit Line</p>
            <p className="text-sm font-semibold text-zinc-700 tabular-nums">
              {formatINR(activeCard.totalLimit)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-brand-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, ((activeCard.totalLimit - activeCard.availableLimit) / activeCard.totalLimit) * 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-zinc-400 flex items-center justify-between">
          <span>Used: {formatINR(activeCard.balance)}</span>
          <span>Resets on 1st of month</span>
        </p>
      </div>

      {/* 4. Quick Toggles & Security Controls */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-subtle overflow-hidden divide-y divide-zinc-100">
        
        {/* Toggle Freeze */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${activeCard.isFrozen ? 'bg-sky-100 text-sky-700' : 'bg-zinc-100 text-zinc-700'}`}>
              {activeCard.isFrozen ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900">
                {activeCard.isFrozen ? 'Card Frozen' : 'Freeze Card'}
              </h4>
              <p className="text-[11px] text-zinc-500">
                {activeCard.isFrozen ? 'Block all online and in-store transactions' : 'Lock card instantly if misplaced'}
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleCardFreeze(activeCard.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active-press ${
              activeCard.isFrozen
                ? 'bg-sky-600 text-white hover:bg-sky-700'
                : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
            }`}
          >
            {activeCard.isFrozen ? 'Unfreeze' : 'Freeze'}
          </button>
        </div>

        {/* Contactless Tap & Pay Limit */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-brand-600 flex items-center justify-center">
                <Radio className="w-4 h-4 rotate-90" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900">Contactless (NFC) Limit</h4>
                <p className="text-[11px] text-zinc-500">Max per single tap without PIN</p>
              </div>
            </div>
            <span className="text-xs font-bold text-brand-600 font-mono">
              ₹{activeCard.contactlessLimit.toLocaleString('en-IN')}
            </span>
          </div>

          <input
            type="range"
            min="1000"
            max="10000"
            step="1000"
            value={activeCard.contactlessLimit}
            onChange={(e) => {
              const val = Number(e.target.value);
              useAppStore.setState((state) => ({
                cards: state.cards.map((c) => (c.id === activeCard.id ? { ...c, contactlessLimit: val } : c)),
              }));
            }}
            className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-brand-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
            <span>₹1,000</span>
            <span>₹5,000 (RBI Norm)</span>
            <span>₹10,000</span>
          </div>
        </div>

        {/* Manage Settings & PIN Shortcut */}
        <button
          onClick={() => openModal('MANAGE_CARD')}
          className="w-full p-4 flex items-center justify-between hover:bg-zinc-50/70 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900">Card Controls & PIN</h4>
              <p className="text-[11px] text-zinc-500">Change 4-digit ATM PIN & daily limits</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* 5. Copy Card Details Box */}
      <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-zinc-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-mono text-[11px]">{activeCard.fullCardNumber}</span>
        </div>
        <button
          onClick={() => handleCopy(activeCard.fullCardNumber.replace(/\s/g, ''), 'number')}
          className="px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 font-medium active-press text-[11px] flex items-center gap-1"
        >
          {copiedField === 'number' ? (
            <>
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Copied</span>
            </>
          ) : (
            <span>Copy Number</span>
          )}
        </button>
      </div>

    </div>
  );
};
