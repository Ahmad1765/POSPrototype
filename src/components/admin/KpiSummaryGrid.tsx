import React from 'react';
import type { AdminMetrics } from '../../hooks/useDexieTransactions';
import { CreditCard, TrendingUp, RefreshCw, CheckCircle2, ArrowUpRight } from 'lucide-react';

interface KpiSummaryGridProps {
  metrics: AdminMetrics;
}

export const KpiSummaryGrid: React.FC<KpiSummaryGridProps> = ({ metrics }) => {
  const cards = [
    {
      title: 'Total Txns',
      value: metrics.totalCount.toString(),
      subtext: `${metrics.settledCount} Settled`,
      icon: <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-300" />,
      accent: 'border-zinc-800'
    },
    {
      title: 'Gross Volume',
      value: `₹${metrics.totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: 'Shift transacted',
      icon: <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />,
      trend: '+12%',
      accent: 'border-zinc-800'
    },
    {
      title: 'Pending Sync',
      value: metrics.pendingSyncCount.toString(),
      subtext: metrics.pendingSyncCount > 0 
        ? `₹${metrics.pendingSyncVolume.toFixed(0)} queued`
        : 'Queue clear',
      icon: <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${metrics.pendingSyncCount > 0 ? 'text-amber-400 animate-spin' : 'text-zinc-500'}`} />,
      isAlert: metrics.pendingSyncCount > 0,
      accent: metrics.pendingSyncCount > 0 ? 'border-amber-500/40 bg-amber-950/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]' : 'border-zinc-800'
    },
    {
      title: 'Settled Volume',
      value: `₹${metrics.settledVolume.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: `${metrics.settledCount} settled`,
      icon: <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />,
      accent: 'border-zinc-800'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 select-none">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-900/80 border ${card.accent} backdrop-blur-xl flex flex-col justify-between shadow-sm hover:border-zinc-700/80 transition-all duration-200`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              {card.title}
            </span>
            <div className="p-1 sm:p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/50 shrink-0">
              {card.icon}
            </div>
          </div>

          <div className="my-1.5 sm:my-2">
            <div className="text-lg sm:text-2xl lg:text-3xl font-mono font-bold text-white tracking-tight truncate">
              {card.value}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-400">
            <span className="truncate">{card.subtext}</span>
            {card.trend && (
              <span className="hidden sm:flex items-center text-emerald-400 font-mono font-semibold text-[10px] ml-1 shrink-0">
                <ArrowUpRight className="w-3 h-3" />
                {card.trend}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
