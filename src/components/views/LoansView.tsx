import React, { useState } from 'react';
import { 
  BadgePercent, CheckCircle2, 
  Zap, Landmark 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatINR } from '../../utils/currency';

export const LoansView: React.FC = () => {
  const { loanAccount, drawdownCredit } = useAppStore();
  const [drawAmount, setDrawAmount] = useState(25000);
  const [isSuccess, setIsSuccess] = useState(false);

  // EMI Calculator State
  const [calcAmount, setCalcAmount] = useState(100000);
  const [calcMonths, setCalcMonths] = useState(12);

  const calculateEmi = (p: number, rPercent: number, n: number) => {
    const r = rPercent / 12 / 100;
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  };

  const simulatedEmi = calculateEmi(calcAmount, 11.25, calcMonths);

  const handleDrawdown = () => {
    drawdownCredit(drawAmount);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <div className="px-5 space-y-6 pb-28 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">Instant Credit Line</h2>
            <p className="text-xs text-zinc-500">Zero paperwork • Instant disbursal</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Pre-Approved
          </span>
        </div>
      </div>

      {/* 1. Pre-Approved Credit Overview Card */}
      <div className="rounded-2xl bg-gradient-to-br from-zinc-900 via-neutral-900 to-black text-white p-5 border border-white/10 shadow-card-float relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-brand-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              Available Credit Limit
            </span>
            <div className="flex items-center gap-1 text-[10px] text-brand-400 font-semibold bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
              <Zap className="w-3 h-3" />
              <span>Instant Cash</span>
            </div>
          </div>

          <h3 className="text-3xl font-bold tracking-tight tabular-nums text-white mt-1">
            {formatINR(loanAccount.availableCredit)}
          </h3>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/10 text-xs">
            <div>
              <p className="text-zinc-400 text-[10px]">Total Sanctioned</p>
              <p className="font-semibold text-zinc-200">{formatINR(loanAccount.approvedLimit)}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-[10px]">Interest Rate</p>
              <p className="font-semibold text-zinc-200">{loanAccount.interestRate}% p.a. reducing</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Instant Drawdown Box */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-subtle space-y-4">
        <div>
          <h4 className="text-xs font-bold text-zinc-900">Transfer to Bank Account</h4>
          <p className="text-[11px] text-zinc-500">Money credited in under 60 seconds</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-medium">Select Draw Amount</span>
            <span className="text-sm font-bold text-zinc-900 font-mono">
              {formatINR(drawAmount)}
            </span>
          </div>

          <input
            type="range"
            min="5000"
            max={loanAccount.availableCredit}
            step="5000"
            value={drawAmount}
            onChange={(e) => setDrawAmount(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-brand-500"
          />

          <div className="flex gap-2 pt-1">
            {[10000, 25000, 50000, 100000].filter(v => v <= loanAccount.availableCredit).map((val) => (
              <button
                key={val}
                onClick={() => setDrawAmount(val)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-colors active-press ${
                  drawAmount === val
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                ₹{(val / 1000).toFixed(0)}k
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleDrawdown}
          disabled={drawAmount > loanAccount.availableCredit || drawAmount === 0}
          className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold text-xs shadow-btn-orange transition-all active-press flex items-center justify-center gap-2"
        >
          {isSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>₹{drawAmount.toLocaleString('en-IN')} Transferred to Account!</span>
            </>
          ) : (
            <>
              <Landmark className="w-4 h-4" />
              <span>Withdraw {formatINR(drawAmount)} Instantly</span>
            </>
          )}
        </button>
      </div>

      {/* 3. Active Loan & Repayment Schedule */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-subtle space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <div>
            <h4 className="text-xs font-bold text-zinc-900">Active Repayment Schedule</h4>
            <p className="text-[11px] text-zinc-500 font-mono">Loan Ref: {loanAccount.loanNumber}</p>
          </div>
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            Auto-Debit Active
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
            <p className="text-[10px] text-zinc-500">Next Upcoming EMI</p>
            <p className="text-sm font-bold text-zinc-900 mt-0.5">{formatINR(loanAccount.nextEmiAmount)}</p>
            <p className="text-[10px] text-brand-600 font-medium mt-1">Due {loanAccount.nextEmiDate}</p>
          </div>

          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
            <p className="text-[10px] text-zinc-500">Tenure Remaining</p>
            <p className="text-sm font-bold text-zinc-900 mt-0.5">
              {loanAccount.remainingMonths} / {loanAccount.tenureMonths} Months
            </p>
            <p className="text-[10px] text-zinc-500 mt-1">6 EMIs Paid on time</p>
          </div>
        </div>
      </div>

      {/* 4. Interactive EMI Calculator Tool */}
      <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BadgePercent className="w-4 h-4 text-zinc-700" />
            <h4 className="text-xs font-bold text-zinc-900">EMI & Interest Estimator</h4>
          </div>
          <span className="text-[10px] text-zinc-500">11.25% APR</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500">Loan Amount</span>
            <span className="font-bold text-zinc-900 font-mono">{formatINR(calcAmount)}</span>
          </div>
          <input
            type="range"
            min="20000"
            max="500000"
            step="10000"
            value={calcAmount}
            onChange={(e) => setCalcAmount(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-800"
          />
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500">Duration (Months)</span>
            <span className="font-bold text-zinc-900 font-mono">{calcMonths} Months</span>
          </div>
          <div className="flex gap-2">
            {[6, 12, 24, 36].map((m) => (
              <button
                key={m}
                onClick={() => setCalcMonths(m)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-semibold ${
                  calcMonths === m ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-600'
                }`}
              >
                {m}M
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between">
          <span className="text-xs text-zinc-600 font-medium">Estimated Monthly EMI</span>
          <span className="text-sm font-bold text-brand-600 font-mono">
            {formatINR(simulatedEmi)} / mo
          </span>
        </div>
      </div>

    </div>
  );
};
