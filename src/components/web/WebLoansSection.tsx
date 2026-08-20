import React, { useState } from 'react';
import { 
  BadgePercent, CheckCircle2, Landmark 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatINR } from '../../utils/currency';

export const WebLoansSection: React.FC = () => {
  const { loanAccount, drawdownCredit } = useAppStore();
  const [drawAmount, setDrawAmount] = useState(50000);
  const [isSuccess, setIsSuccess] = useState(false);

  // EMI Calculator State
  const [calcAmount, setCalcAmount] = useState(150000);
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
    <div className="p-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Instant Credit Line & Loans</h2>
          <p className="text-xs text-zinc-500">Zero paperwork • Instant disbursal to primary bank or card</p>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Pre-Approved Credit Line
        </span>
      </div>

      {/* Credit Line Overview Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-zinc-900 via-neutral-900 to-black text-white p-6 border border-white/10 shadow-card-float relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10 space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Available Credit Limit
          </span>
          <h3 className="text-3xl font-bold text-white font-mono tracking-tight">
            {formatINR(loanAccount.availableCredit)}
          </h3>
          <p className="text-xs text-zinc-400">
            Total Sanctioned Line: <span className="text-zinc-200 font-bold">{formatINR(loanAccount.approvedLimit)}</span> @ {loanAccount.interestRate}% p.a.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4 w-full md:w-auto text-xs">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <p className="text-zinc-400 text-[10px]">Monthly EMI</p>
            <p className="font-bold text-zinc-100 mt-0.5">{formatINR(loanAccount.nextEmiAmount)}</p>
            <p className="text-[10px] text-brand-400 mt-0.5">Due {loanAccount.nextEmiDate}</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <p className="text-zinc-400 text-[10px]">Repayment Status</p>
            <p className="font-bold text-emerald-400 mt-0.5">Auto-Debit Active</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">{loanAccount.remainingMonths} of {loanAccount.tenureMonths} Months Left</p>
          </div>
        </div>
      </div>

      {/* Drawdown & Calculator Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Drawdown Column (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-subtle space-y-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Instant Drawdown</h3>
            <p className="text-xs text-zinc-500">Transfer funds immediately to your linked bank account</p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-medium">Selected Amount</span>
              <span className="text-base font-bold text-zinc-900 font-mono">
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
              className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />

            <div className="flex gap-2">
              {[25000, 50000, 100000, 200000].filter(v => v <= loanAccount.availableCredit).map((val) => (
                <button
                  key={val}
                  onClick={() => setDrawAmount(val)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
                    drawAmount === val
                      ? 'bg-brand-500 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  ₹{(val / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleDrawdown}
            disabled={drawAmount > loanAccount.availableCredit}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-btn-orange flex items-center justify-center gap-2 active-press transition-all"
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>₹{drawAmount.toLocaleString('en-IN')} Transferred to Account!</span>
              </>
            ) : (
              <>
                <Landmark className="w-4 h-4" />
                <span>Withdraw {formatINR(drawAmount)} to Bank</span>
              </>
            )}
          </button>
        </div>

        {/* Live EMI Estimator Tool (6 cols) */}
        <div className="lg:col-span-6 bg-zinc-50 rounded-2xl p-6 border border-zinc-200/60 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BadgePercent className="w-4 h-4 text-zinc-700" />
              <h3 className="text-base font-bold text-zinc-900">EMI & Interest Estimator</h3>
            </div>
            <span className="text-xs text-zinc-500 font-mono font-semibold">11.25% APR</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-600 font-medium">Estimated Amount</span>
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
              <span className="text-zinc-600 font-medium">Tenure (Months)</span>
              <span className="font-bold text-zinc-900 font-mono">{calcMonths} Months</span>
            </div>
            <div className="flex gap-2">
              {[6, 12, 24, 36].map((m) => (
                <button
                  key={m}
                  onClick={() => setCalcMonths(m)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
                    calcMonths === m ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-600'
                  }`}
                >
                  {m} Months
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200/80 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-700">Estimated Monthly Installment</span>
            <span className="text-lg font-bold text-brand-600 font-mono">
              {formatINR(simulatedEmi)} / mo
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
