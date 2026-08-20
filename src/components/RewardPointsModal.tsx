import React, { useState } from 'react';
import { 
  X, Gift, Sparkles, CheckCircle2, ArrowRight, 
  Copy, Check, Trophy, Flame 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../store/useAppStore';
import { formatINR } from '../utils/currency';

export const RewardPointsModal: React.FC = () => {
  const { activeModal, closeModal, user, redeemPoints, perks, claimScratchReward } = useAppStore();
  const [activeTab, setActiveTab] = useState<'REDEEM' | 'SCRATCH' | 'PERKS'>('REDEEM');
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [scratchRevealed, setScratchRevealed] = useState(false);
  const [scratchedBonus, setScratchedBonus] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (activeModal !== 'REWARDS') return null;

  const handleRedeem = () => {
    if (user.rewardPoints <= 0) return;

    redeemPoints(user.rewardPoints);
    setIsRedeemed(true);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#FF6B00', '#F59E0B', '#10B981'],
    });

    setTimeout(() => {
      setIsRedeemed(false);
      closeModal();
    }, 1600);
  };

  const handleScratch = () => {
    if (scratchRevealed) return;
    const bonus = claimScratchReward();
    setScratchedBonus(bonus);
    setScratchRevealed(true);

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#FF6B00', '#F59E0B', '#3B82F6'],
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-modal-pop flex flex-col border border-zinc-200/80 max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-zinc-900 text-white flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-brand-400" />
              <h3 className="text-sm font-bold">Rewards & Cashback</h3>
            </div>
            <button
              onClick={closeModal}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active-press flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-zinc-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('REDEEM')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'REDEEM' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Cashback
            </button>
            <button
              onClick={() => setActiveTab('SCRATCH')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeTab === 'SCRATCH' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Scratch</span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            </button>
            <button
              onClick={() => setActiveTab('PERKS')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'PERKS' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Perks ({perks.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Redeem Points */}
        {activeTab === 'REDEEM' && (
          <div className="p-6 text-center">
            {isRedeemed ? (
              <div className="py-6 flex flex-col items-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-3 animate-bounce" />
                <h4 className="text-lg font-bold text-zinc-900">Cashback Credited!</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Deposited directly to your active card balance.
                </p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-2 text-brand-600 shadow-subtle">
                  <Sparkles className="w-7 h-7" />
                </div>

                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Available Reward Points
                </p>
                <h3 className="text-3xl font-black text-zinc-900 mt-0.5 tracking-tight font-mono">
                  {user.rewardPoints.toLocaleString('en-IN')} <span className="text-sm font-bold text-brand-600">PTS</span>
                </h3>

                <div className="my-4 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/80 text-left space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-600">Conversion Rate:</span>
                    <span className="font-semibold text-brand-600">1 Point = ₹1.00 INR</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-zinc-200/60">
                    <span className="text-zinc-600 font-medium">Instant Cash Value:</span>
                    <span className="text-sm font-bold text-zinc-900 font-mono">
                      {formatINR(user.rewardPoints)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleRedeem}
                  disabled={user.rewardPoints <= 0}
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-btn-orange flex items-center justify-center gap-2 active-press transition-all disabled:opacity-50"
                >
                  <span>Redeem {formatINR(user.rewardPoints)} to Card</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Tab 2: Scratch Card Mini Game */}
        {activeTab === 'SCRATCH' && (
          <div className="p-6 text-center space-y-4">
            <div>
              <h4 className="text-sm font-bold text-zinc-900">Daily Mystery Scratch Card</h4>
              <p className="text-[11px] text-zinc-500">Tap below to reveal guaranteed cashback points</p>
            </div>

            <div
              onClick={handleScratch}
              className={`w-full h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 select-none ${
                scratchRevealed
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-brand-400'
                  : 'bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700 hover:border-brand-500'
              }`}
            >
              {scratchRevealed ? (
                <div className="animate-in zoom-in-50 duration-300">
                  <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-1 animate-bounce" />
                  <p className="text-xs font-bold uppercase text-brand-600 tracking-wider">You Won</p>
                  <p className="text-3xl font-black text-zinc-900 font-mono">+{scratchedBonus} PTS</p>
                  <p className="text-[10px] text-zinc-500 mt-1">Added to your points balance!</p>
                </div>
              ) : (
                <div className="text-center text-zinc-300">
                  <Flame className="w-10 h-10 text-brand-400 mx-auto mb-2 animate-pulse" />
                  <p className="text-xs font-bold text-white">TAP TO SCRATCH</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Win up to 300 points</p>
                </div>
              )}
            </div>

            {scratchRevealed && (
              <button
                onClick={() => {
                  setScratchRevealed(false);
                  handleScratch();
                }}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 active-press"
              >
                Scratch Another Card
              </button>
            )}
          </div>
        )}

        {/* Tab 3: Brand Perks & Coupons */}
        {activeTab === 'PERKS' && (
          <div className="p-4 space-y-2.5 overflow-y-auto max-h-[380px] no-scrollbar">
            {perks.map((perk) => (
              <div
                key={perk.id}
                className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${perk.iconBg}`}>
                    {perk.logoText}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 truncate">{perk.brand}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{perk.title}</p>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Exp: {perk.expires}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleCopyCode(perk.code)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-700 text-[10px] font-mono font-bold hover:bg-zinc-100 flex items-center gap-1 shrink-0 active-press"
                >
                  {copiedCode === perk.code ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-zinc-400" />
                      <span>{perk.code}</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
