import React, { useState } from 'react';
import { 
  Lock, Unlock, Radio, 
  Check, KeyRound, Copy, PlusCircle 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatINR } from '../../utils/currency';

export const WebCardsSection: React.FC = () => {
  const { cards, activeCardIndex, setActiveCardIndex, toggleCardFreeze, openModal, updateCardLimit } = useAppStore();
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeCard = cards[activeCardIndex] || cards[0];

  const handleCopy = (num: string, id: string) => {
    navigator.clipboard?.writeText(num.replace(/\s/g, ''));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Cards & Wallets</h2>
          <p className="text-xs text-zinc-500">Manage virtual credit lines, contactless tap rules, and physical cards</p>
        </div>
        <button
          onClick={() => openModal('TOP_UP')}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-btn-orange flex items-center gap-2 active-press transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Money / New Card</span>
        </button>
      </div>

      {/* Cards Grid Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => {
          const isFlipped = flippedCardId === card.id;
          const isSelected = activeCardIndex === idx;

          return (
            <div key={card.id} className="space-y-4">
              {/* 3D Card Item */}
              <div className="perspective-1000">
                <div
                  onClick={() => setFlippedCardId(isFlipped ? null : card.id)}
                  className={`w-full h-52 rounded-2xl relative cursor-pointer transition-transform duration-700 transform-style-3d shadow-card-float select-none ${
                    isFlipped ? 'rotate-y-180' : ''
                  } ${isSelected ? 'ring-2 ring-brand-500 ring-offset-2' : ''}`}
                >
                  {/* Front */}
                  <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-zinc-900 via-neutral-900 to-black text-white p-5 border border-white/10 flex flex-col justify-between backface-hidden overflow-hidden">
                    {/* Ambient Glow */}
                    <div
                      className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full opacity-20 blur-2xl pointer-events-none"
                      style={{ backgroundColor: card.accentColor }}
                    />

                    {card.isFrozen && (
                      <div className="absolute inset-0 bg-sky-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-sky-200">
                        <Lock className="w-7 h-7 mb-1 text-sky-300 animate-bounce" />
                        <span className="text-xs font-bold uppercase tracking-wider">Card Frozen</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">{card.name}</span>
                      <span className="text-sm font-black italic tracking-widest text-zinc-100">{card.brand}</span>
                    </div>

                    <div className="flex items-center justify-between relative z-10">
                      <div className="w-10 h-7 rounded bg-gradient-to-tr from-amber-400 to-yellow-200 border border-amber-500/40 relative shadow-sm">
                        <div className="absolute inset-1 border border-amber-600/30 rounded-sm" />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">Click to flip</span>
                    </div>

                    <div className="relative z-10">
                      <p className="text-base font-mono tracking-widest text-zinc-100 font-semibold">{card.cardNumberMasked}</p>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/10 text-xs">
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-zinc-400">Cardholder</p>
                          <p className="font-semibold text-zinc-200">{card.cardHolder}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] uppercase tracking-wider text-zinc-400">Expires</p>
                          <p className="font-mono text-zinc-200">{card.expiryDate}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Back */}
                  <div className="absolute inset-0 w-full h-full rounded-2xl bg-zinc-950 text-white p-5 border border-white/10 flex flex-col justify-between backface-hidden rotate-y-180 overflow-hidden">
                    <div className="absolute top-4 left-0 right-0 h-9 bg-black" />
                    <div className="mt-12 relative z-10 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-7 bg-zinc-800 rounded px-2 flex items-center justify-end">
                          <span className="text-[10px] font-mono text-zinc-400 italic">Signature</span>
                        </div>
                        <div className="w-14 h-7 bg-white text-zinc-900 rounded flex items-center justify-center font-mono font-bold text-xs">
                          {card.cvv}
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-400">Security CVV Code: {card.cvv}</p>
                    </div>

                    <div className="relative z-10 flex items-center justify-between text-[10px] text-zinc-400 border-t border-white/10 pt-2">
                      <span>PIN: <span className="font-mono text-zinc-200 font-bold">{card.pin}</span></span>
                      <span>24/7 Support</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Meta & Control Box */}
              <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-500">Available Limit</p>
                    <h4 className="text-lg font-bold text-zinc-900 font-mono tabular-nums">{formatINR(card.availableLimit)}</h4>
                  </div>
                  <button
                    onClick={() => setActiveCardIndex(idx)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      isSelected ? 'bg-brand-500 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    {isSelected ? 'Active' : 'Select'}
                  </button>
                </div>

                {/* Limit Progress */}
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, ((card.totalLimit - card.availableLimit) / card.totalLimit) * 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs">
                  <button
                    onClick={() => toggleCardFreeze(card.id)}
                    className={`flex items-center gap-1.5 font-semibold ${
                      card.isFrozen ? 'text-sky-600' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {card.isFrozen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span>{card.isFrozen ? 'Unfreeze' : 'Freeze Card'}</span>
                  </button>

                  <button
                    onClick={() => handleCopy(card.fullCardNumber, card.id)}
                    className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
                  >
                    {copiedId === card.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === card.id ? 'Copied' : 'Copy Number'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Card Security & Limit Controls */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-subtle space-y-6">
        <div>
          <h3 className="text-base font-bold text-zinc-900">Card Controls: {activeCard.name}</h3>
          <p className="text-xs text-zinc-500">Configure contactless rules, international switches, and ATM PIN</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* NFC Limit Slider */}
          <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/60 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-800 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-brand-600 rotate-90" />
                <span>Contactless (NFC) Limit</span>
              </span>
              <span className="font-mono font-bold text-brand-600">₹{activeCard.contactlessLimit.toLocaleString('en-IN')}</span>
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
              className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
            <p className="text-[10px] text-zinc-400">Max amount per single tap without requiring PIN</p>
          </div>

          {/* Daily Spend Limit */}
          <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/60 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-800">Total Credit Line</span>
              <span className="font-mono font-bold text-zinc-900">{formatINR(activeCard.totalLimit)}</span>
            </div>
            <input
              type="range"
              min="50000"
              max="1000000"
              step="50000"
              value={activeCard.totalLimit}
              onChange={(e) => updateCardLimit(activeCard.id, Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
            <p className="text-[10px] text-zinc-400">Current available balance: {formatINR(activeCard.availableLimit)}</p>
          </div>

          {/* PIN & Security */}
          <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/60 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-800">Security PIN</span>
                <span className="font-mono font-bold text-zinc-900">{activeCard.pin}</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">ATM & In-store verification PIN</p>
            </div>
            <button
              onClick={() => openModal('MANAGE_CARD')}
              className="w-full py-2 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-lg text-xs font-semibold text-zinc-800 flex items-center justify-center gap-1.5 active-press"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change PIN in Modal</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
