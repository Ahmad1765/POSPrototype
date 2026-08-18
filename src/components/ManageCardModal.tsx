import React from 'react';
import { X, Lock, Unlock, Radio, Globe, ShieldAlert, KeyRound } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatINR } from '../utils/currency';

export const ManageCardModal: React.FC = () => {
  const { activeModal, closeModal, cards, activeCardIndex, toggleCardFreeze, updateCardLimit } = useAppStore();

  if (activeModal !== 'MANAGE_CARD') return null;

  const currentCard = cards[activeCardIndex] || cards[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-slate-100">
        
        {/* Header */}
        <div className="p-4 bg-slate-50 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-brand-600" />
            <h3 className="text-sm font-extrabold text-slate-800">Card Controls & Security</h3>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 active-press flex items-center justify-center text-slate-500 shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          {/* Card Summary Badge */}
          <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase">{currentCard.cardType}</p>
              <p className="font-mono text-sm font-bold text-slate-200">{currentCard.cardNumberMasked}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-brand-600 text-white">
              {currentCard.brand}
            </span>
          </div>

          {/* Toggle 1: Freeze Card */}
          <div className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentCard.isFrozen ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-700'}`}>
                {currentCard.isFrozen ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Freeze Card</p>
                <p className="text-[10px] text-slate-400">Instantly block all card transactions</p>
              </div>
            </div>
            <button
              onClick={() => toggleCardFreeze(currentCard.id)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 active-press ${
                currentCard.isFrozen ? 'bg-red-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-md block transition-transform ${
                  currentCard.isFrozen ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Toggle 2: Contactless Tap-to-Pay (NFC) */}
          <div className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-brand-600 flex items-center justify-center">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Contactless Tap & Pay</p>
                <p className="text-[10px] text-slate-400">RBI limit up to {formatINR(5000, false)}/tap</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Enabled
            </span>
          </div>

          {/* Toggle 3: International Transactions */}
          <div className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">International Usage</p>
                <p className="text-[10px] text-slate-400">Enable cross-border payments</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-full">
              {currentCard.internationalAllowed ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {/* Spending Limit Slider */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">Daily Spending Limit</span>
              <span className="font-mono font-bold text-brand-600">{formatINR(currentCard.totalLimit, false)}</span>
            </div>
            <input
              type="range"
              min="50000"
              max="1000000"
              step="50000"
              value={currentCard.totalLimit}
              onChange={(e) => updateCardLimit(currentCard.id, Number(e.target.value))}
              className="w-full accent-brand-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>₹50,000</span>
              <span>₹10,00,000</span>
            </div>
          </div>

          {/* Reset PIN Button */}
          <button
            onClick={() => alert('Terminal PIN reset OTP dispatched to registered mobile.')}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active-press transition-colors"
          >
            <KeyRound className="w-4 h-4 text-slate-500" />
            <span>Set / Reset 4-Digit ATM PIN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
