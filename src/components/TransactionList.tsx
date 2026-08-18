import React from 'react';
import { Coffee, ShoppingBag, Utensils, Plane, ArrowDownLeft, ArrowUpRight, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatDateTime, formatINR } from '../utils/currency';
import type { Transaction } from '../types';

export const TransactionList: React.FC = () => {
  const { transactions, setSelectedTransaction } = useAppStore();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coffee':
        return <Coffee className="w-4 h-4 text-amber-700" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-4 h-4 text-blue-600" />;
      case 'Utensils':
        return <Utensils className="w-4 h-4 text-orange-600" />;
      case 'Plane':
        return <Plane className="w-4 h-4 text-indigo-600" />;
      case 'ArrowDownLeft':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-600" />;
      default:
        return <ArrowUpRight className="w-4 h-4 text-slate-700" />;
    }
  };

  return (
    <div className="px-5 mt-6 mb-24">
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recent Activity
          </h3>
        </div>
        <button
          onClick={() => {}}
          className="text-[11px] font-semibold text-brand-600 hover:text-brand-700"
        >
          Statement (PDF)
        </button>
      </div>

      <div className="bg-white rounded-3xl p-3 shadow-card-float border border-slate-100 divide-y divide-slate-100">
        {transactions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No transactions recorded yet.
          </div>
        ) : (
          transactions.map((tx: Transaction) => (
            <div
              key={tx.id}
              onClick={() => setSelectedTransaction(tx)}
              className="py-3 px-2 flex items-center justify-between hover:bg-slate-50/70 rounded-2xl transition-colors cursor-pointer active-press group"
            >
              {/* Left: Icon & Merchant Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200/60 shadow-sm group-hover:scale-105 transition-transform">
                  {getIcon(tx.iconName)}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {tx.merchantName}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-slate-400">
                      {formatDateTime(tx.timestamp)}
                    </span>
                    <span className="text-[10px] text-slate-300">•</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {tx.merchantCategory}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Amount & Status */}
              <div className="text-right flex items-center gap-2">
                <div>
                  <p
                    className={`text-xs font-extrabold tracking-tight ${
                      tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {tx.type === 'CREDIT' ? '+' : '-'} {formatINR(tx.amount)}
                  </p>

                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    {tx.status === 'OFFLINE_PENDING' ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        <Clock className="w-2.5 h-2.5" /> Offline SaF
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        <ShieldCheck className="w-2.5 h-2.5" /> Synced
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
