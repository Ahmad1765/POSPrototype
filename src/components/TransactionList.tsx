import React from 'react';
import { Coffee, ShoppingBag, Utensils, Plane, ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatDateTime, formatINR } from '../utils/currency';
import type { Transaction } from '../types';

export const TransactionList: React.FC = () => {
  const { transactions, setSelectedTransaction, openModal } = useAppStore();

  const getIcon = (iconName: string) => {
    const iconProps = { className: "w-4 h-4 stroke-[1.8] text-zinc-600" };
    switch (iconName) {
      case 'Coffee':
        return <Coffee {...iconProps} />;
      case 'ShoppingBag':
        return <ShoppingBag {...iconProps} />;
      case 'Utensils':
        return <Utensils {...iconProps} />;
      case 'Plane':
        return <Plane {...iconProps} />;
      case 'ArrowDownLeft':
        return <ArrowDownLeft {...iconProps} />;
      default:
        return <ArrowUpRight {...iconProps} />;
    }
  };

  return (
    <div className="px-5 mt-5 mb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Recent Activity
          </h3>
          <span className="text-[10px] font-mono text-zinc-400">
            ({transactions.length})
          </span>
        </div>
        <button
          onClick={() => openModal('NOTIFICATIONS')}
          className="text-[11px] font-medium text-brand-600 hover:text-brand-700 active-press"
        >
          View All
        </button>
      </div>

      {/* Transactions Container */}
      <div className="bg-white rounded-2xl p-2 border border-zinc-200/80 shadow-subtle divide-y divide-zinc-100 overflow-hidden">
        {transactions.length === 0 ? (
          <div className="py-8 text-center text-zinc-400 text-xs font-medium">
            No transactions recorded yet.
          </div>
        ) : (
          transactions.map((tx: Transaction) => (
            <div
              key={tx.id}
              onClick={() => setSelectedTransaction(tx)}
              className="py-3 px-2.5 flex items-center justify-between hover:bg-zinc-50/80 rounded-xl transition-colors cursor-pointer active-press group"
            >
              {/* Left: Icon & Merchant */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-200/60 flex items-center justify-center shrink-0 group-hover:border-zinc-300 transition-colors">
                  {getIcon(tx.iconName)}
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-zinc-900 truncate tracking-tight">
                    {tx.merchantName}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-400">
                    <span>{formatDateTime(tx.timestamp)}</span>
                    <span className="text-zinc-300">·</span>
                    <span className="text-zinc-500 font-medium truncate">{tx.merchantCategory}</span>
                  </div>
                </div>
              </div>

              {/* Right: Amount & Status Badge */}
              <div className="text-right flex items-center gap-2 shrink-0 pl-2">
                <div>
                  <p
                    className={`text-xs font-bold font-mono tracking-tight tabular-nums ${
                      tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-zinc-900'
                    }`}
                  >
                    {tx.type === 'CREDIT' ? '+' : '−'} {formatINR(tx.amount)}
                  </p>

                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    {tx.status === 'OFFLINE_PENDING' ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Offline SaF
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-medium text-zinc-600 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Synced
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
