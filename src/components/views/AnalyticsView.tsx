import React, { useState } from 'react';
import { 
  ArrowDownRight, Calendar, Download 
} from 'lucide-react';
import { formatINR } from '../../utils/currency';

export const AnalyticsView: React.FC = () => {
  const [selectedMonth] = useState('August 2026');

  // Compute category totals
  const categoryMap: Record<string, { amount: number; color: string; bg: string; icon: string }> = {
    'Food & Dining': { amount: 2300, color: 'bg-amber-500', bg: 'bg-amber-50 text-amber-600', icon: 'Utensils' },
    'Electronics & Gadgets': { amount: 4299, color: 'bg-blue-500', bg: 'bg-blue-50 text-blue-600', icon: 'ShoppingBag' },
    'Travel & Airlines': { amount: 12500, color: 'bg-indigo-500', bg: 'bg-indigo-50 text-indigo-600', icon: 'Plane' },
    'Bills & Utilities': { amount: 3450, color: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-600', icon: 'Zap' },
  };

  const totalSpent = Object.values(categoryMap).reduce((sum, c) => sum + c.amount, 0);
  const monthlyBudget = 40000;
  const budgetPercentage = Math.round((totalSpent / monthlyBudget) * 100);

  // Weekly bar comparison
  const weeklyData = [
    { label: 'W1', amount: 4200, height: '40%' },
    { label: 'W2', amount: 7800, height: '70%' },
    { label: 'W3', amount: 12500, height: '95%' },
    { label: 'W4', amount: 2500, height: '25%' },
  ];

  return (
    <div className="px-5 space-y-6 pb-28 animate-in fade-in duration-200">
      
      {/* Header & Month Filter */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-zinc-900 tracking-tight">Spending & Insights</h2>
          <p className="text-xs text-zinc-500">Track and optimize monthly cash flow</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-zinc-200/80 text-xs font-semibold text-zinc-700 shadow-subtle">
          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
          <span>{selectedMonth}</span>
        </div>
      </div>

      {/* 1. Monthly Total & Budget Progress Card */}
      <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">Total Spent this Month</p>
            <h3 className="text-2xl font-bold text-zinc-900 tabular-nums mt-0.5">
              {formatINR(totalSpent)}
            </h3>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/60">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>12% vs last month</span>
          </div>
        </div>

        {/* Budget Health Indicator */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500 font-medium">Monthly Budget Health</span>
            <span className="font-semibold text-zinc-800">{budgetPercentage}% of {formatINR(monthlyBudget)}</span>
          </div>
          <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden flex">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                budgetPercentage > 85 ? 'bg-rose-500' : 'bg-brand-500'
              }`}
              style={{ width: `${Math.min(100, budgetPercentage)}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-400">
            ₹{(monthlyBudget - totalSpent).toLocaleString('en-IN')} remaining for the next 11 days
          </p>
        </div>
      </div>

      {/* 2. Weekly Spending Chart */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-subtle space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-zinc-900">Weekly Breakdown</h4>
          <span className="text-[11px] text-zinc-400 font-mono">Aug 1 – Aug 31</span>
        </div>

        <div className="flex items-end justify-between gap-3 h-32 pt-4 px-2">
          {weeklyData.map((w, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <span className="text-[10px] font-mono text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                ₹{(w.amount / 1000).toFixed(1)}k
              </span>
              <div className="w-full max-w-[36px] bg-zinc-100 rounded-t-lg relative overflow-hidden h-full flex items-end">
                <div
                  className="w-full bg-brand-500 rounded-t-lg transition-all duration-500 group-hover:bg-brand-600"
                  style={{ height: w.height }}
                />
              </div>
              <span className="text-[11px] font-medium text-zinc-600">{w.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Category Breakdown */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-subtle space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-zinc-900">Top Spending Categories</h4>
          <span className="text-[11px] text-brand-600 font-medium cursor-pointer">View All</span>
        </div>

        <div className="space-y-3 pt-1">
          {Object.entries(categoryMap).map(([cat, data]) => {
            const pct = Math.round((data.amount / totalSpent) * 100);
            return (
              <div key={cat} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${data.color}`} />
                    <span className="font-medium text-zinc-800">{cat}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900 font-mono">{formatINR(data.amount)}</span>
                    <span className="text-[10px] text-zinc-400 w-7 text-right">{pct}%</span>
                  </div>
                </div>
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`${data.color} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Statement Export Action */}
      <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Download className="w-4 h-4 text-zinc-600" />
          <span className="text-xs font-semibold text-zinc-800">Download Financial Statement</span>
        </div>
        <button
          onClick={() => {}}
          className="px-3 py-1 bg-white border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-100 active-press shadow-subtle"
        >
          Export PDF
        </button>
      </div>

    </div>
  );
};
