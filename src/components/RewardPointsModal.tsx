import React, { useState } from 'react';
import { X, Gift, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../store/useAppStore';
import { formatINR } from '../utils/currency';

export const RewardPointsModal: React.FC = () => {
  const { activeModal, closeModal, user, redeemPoints } = useAppStore();
  const [isRedeemed, setIsRedeemed] = useState(false);

  if (activeModal !== 'REWARDS') return null;

  const handleRedeem = () => {
    if (user.rewardPoints <= 0) return;

    redeemPoints(user.rewardPoints);
    setIsRedeemed(true);

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#FF6B00', '#FF8800', '#10B981', '#EC4899'],
    });

    setTimeout(() => {
      setIsRedeemed(false);
      closeModal();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-slate-100">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-orange-500 to-rose-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            <h3 className="text-sm font-extrabold">FinTech Reward Hub</h3>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 active-press flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {isRedeemed ? (
            <div className="py-6 flex flex-col items-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-3 animate-bounce" />
              <h4 className="text-lg font-black text-slate-900">Cashback Credited!</h4>
              <p className="text-xs text-slate-500 mt-1">
                Transferred directly to your primary card balance.
              </p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-3 text-rose-500 shadow-inner">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>

              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Available Reward Balance
              </h4>
              <p className="text-4xl font-black text-slate-900 mt-1 tracking-tight">
                {user.rewardPoints.toLocaleString('en-IN')} <span className="text-sm font-bold text-brand-600">Pts</span>
              </p>

              <div className="my-5 p-4 bg-orange-50/80 rounded-2xl border border-orange-100 text-left">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Conversion Rate:</span>
                  <span className="font-bold text-brand-600">1 Point = ₹ 1.00 INR</span>
                </div>
                <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-orange-200/60">
                  <span className="font-semibold text-slate-700">Instant Cash Value:</span>
                  <span className="text-sm font-black text-slate-900">
                    {formatINR(user.rewardPoints)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleRedeem}
                disabled={user.rewardPoints <= 0}
                className="w-full py-3.5 bg-gradient-to-r from-brand-550 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-2xl font-extrabold text-sm shadow-btn-orange flex items-center justify-center gap-2 active-press transition-all disabled:opacity-50"
              >
                <span>Redeem {formatINR(user.rewardPoints)} to Card</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
