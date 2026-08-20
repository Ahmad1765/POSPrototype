import React, { useState } from 'react';
import { X, Lock, Unlock, Radio, ShieldAlert, KeyRound, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatINR } from '../utils/currency';

export const ManageCardModal: React.FC = () => {
  const { activeModal, closeModal, cards, activeCardIndex, toggleCardFreeze, updateCardLimit, updateCardPin } = useAppStore();
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinSaved, setPinSaved] = useState(false);

  if (activeModal !== 'MANAGE_CARD') return null;

  const currentCard = cards[activeCardIndex] || cards[0];

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length === 4) {
      updateCardPin(currentCard.id, newPin);
      setPinSaved(true);
      setTimeout(() => {
        setPinSaved(false);
        setIsChangingPin(false);
        setNewPin('');
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-modal-pop flex flex-col border border-zinc-200/80">
        
        {/* Header */}
        <div className="p-4 bg-zinc-50/80 flex items-center justify-between border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-zinc-900">Card Controls & Security</h3>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-white hover:bg-zinc-100 active-press flex items-center justify-center text-zinc-500 border border-zinc-200/60 shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3.5">
          
          {/* Card Summary Badge */}
          <div className="p-3 bg-zinc-900 text-white rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-zinc-400 font-medium uppercase">{currentCard.name}</p>
              <p className="font-mono text-sm font-bold text-zinc-200">{currentCard.cardNumberMasked}</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500 text-white">
              {currentCard.brand}
            </span>
          </div>

          {/* Toggle 1: Freeze Card */}
          <div className="p-3.5 bg-zinc-50 rounded-2xl flex items-center justify-between border border-zinc-200/60">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentCard.isFrozen ? 'bg-sky-100 text-sky-700' : 'bg-zinc-200 text-zinc-700'}`}>
                {currentCard.isFrozen ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900">Freeze Card</p>
                <p className="text-[11px] text-zinc-500">Temporarily lock all card payments</p>
              </div>
            </div>
            <button
              onClick={() => toggleCardFreeze(currentCard.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all active-press ${
                currentCard.isFrozen ? 'bg-sky-600 text-white' : 'bg-zinc-200 text-zinc-800'
              }`}
            >
              {currentCard.isFrozen ? 'Unfreeze' : 'Freeze'}
            </button>
          </div>

          {/* Toggle 2: Contactless Tap-to-Pay (NFC) */}
          <div className="p-3.5 bg-zinc-50 rounded-2xl flex items-center justify-between border border-zinc-200/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-brand-600 flex items-center justify-center">
                <Radio className="w-4 h-4 rotate-90" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900">Contactless NFC Tap</p>
                <p className="text-[11px] text-zinc-500">Up to ₹{currentCard.contactlessLimit.toLocaleString('en-IN')}/tap</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Enabled
            </span>
          </div>

          {/* Spending Limit Slider */}
          <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-700">Total Spending Limit</span>
              <span className="font-mono font-bold text-brand-600">{formatINR(currentCard.totalLimit)}</span>
            </div>
            <input
              type="range"
              min="50000"
              max="1000000"
              step="50000"
              value={currentCard.totalLimit}
              onChange={(e) => updateCardLimit(currentCard.id, Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
              <span>₹50,000</span>
              <span>₹10,00,000</span>
            </div>
          </div>

          {/* Reset PIN Drawer */}
          {!isChangingPin ? (
            <button
              onClick={() => setIsChangingPin(true)}
              className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 active-press transition-colors"
            >
              <KeyRound className="w-4 h-4 text-zinc-600" />
              <span>Change 4-Digit ATM PIN</span>
            </button>
          ) : (
            <form onSubmit={handleSavePin} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-zinc-900">Enter New 4-Digit PIN</span>
                <button
                  type="button"
                  onClick={() => setIsChangingPin(false)}
                  className="text-zinc-400 hover:text-zinc-600 text-[11px]"
                >
                  Cancel
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-center font-mono font-bold tracking-widest text-sm focus:outline-none focus:border-brand-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={newPin.length !== 4}
                  className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold active-press"
                >
                  {pinSaved ? <Check className="w-3.5 h-3.5" /> : 'Save'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
