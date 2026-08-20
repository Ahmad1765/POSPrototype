import React, { useState } from 'react';
import { 
  ArrowDownRight, Calendar, Download, ShoppingBag, 
  Utensils, Plane, Zap 
} from 'lucide-react';
import { formatINR } from '../../utils/currency';

export const WebAnalyticsSection: React.FC = () => {
  const [selectedMonth] = useState('August 2026');

  const categoryMap = [
    { name: 'Food & Dining', amount: 2300, color: 'bg-amber-500', barBg: 'bg-amber-100', icon: Utensils, count: '14 transactions' },
    { name: 'Electronics & Retail', amount: 4299, color: 'bg-blue-500', barBg: 'bg-blue-100', icon: ShoppingBag, count: '3 transactions' },
    { name: 'Travel & Airlines', amount: 12500, color: 'bg-indigo-500', barBg: 'bg-indigo-100', icon: Plane, count: '2 transactions' },
    { name: 'Bills & Utilities', amount: 3450, color: 'bg-emerald-500', barBg: 'bg-emerald-100', icon: Zap, count: '6 transactions' },
  ];

  const totalSpent = categoryMap.reduce((sum, c) => sum + c.amount, 0);
  const monthlyBudget = 40000;
  const budgetPercentage = Math.round((totalSpent / monthlyBudget) * 100);

  const weeklyData = [
    { label: 'Week 1 (Aug 1 - 7)', amount: 4200, height: '40%' },
    { label: 'Week 2 (Aug 8 - 14)', amount: 7800, height: '70%' },
    { label: 'Week 3 (Aug 15 - 21)', amount: 12500, height: '95%' },
    { label: 'Week 4 (Aug 22 - 28)', amount: 2500, height: '25%' },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Spending & Financial Analytics</h2>
          <p className="text-xs text-zinc-500">Track multi-category cash outflows and manage monthly budgets</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-zinc-200 text-xs font-semibold text-zinc-700 shadow-subtle">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>{selectedMonth}</span>
          </div>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 active-press transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Outflow */}
        <div className="p-5 bg-white rounded-2xl border border-zinc-200/80 shadow-subtle space-y-1">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Total Monthly Outflow</span>
          <h3 className="text-2xl font-bold text-zinc-900 font-mono tracking-tight">{formatINR(totalSpent)}</h3>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 pt-1">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>12% less spending than last month</span>
          </div>
        </div>

        {/* Budget Health */}
        <div className="p-5 bg-white rounded-2xl border border-zinc-200/80 shadow-subtle space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-500 font-semibold uppercase tracking-wider">Budget Health</span>
            <span className="font-bold text-zinc-800">{budgetPercentage}% utilized</span>
          </div>
          <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetPercentage > 85 ? 'bg-rose-500' : 'bg-brand-500'
              }`}
              style={{ width: `${Math.min(100, budgetPercentage)}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-400">
            ₹{(monthlyBudget - totalSpent).toLocaleString('en-IN')} remaining of ₹{monthlyBudget.toLocaleString('en-IN')} budget
          </p>
        </div>

        {/* Average Transaction */}
        <div className="p-5 bg-white rounded-2xl border border-zinc-200/80 shadow-subtle space-y-1">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Average Ticket Size</span>
          <h3 className="text-2xl font-bold text-zinc-900 font-mono tracking-tight">₹898.00</h3>
          <p className="text-[11px] text-zinc-400 pt-1">Across 25 transactions settled this month</p>
        </div>

      </div>

      {/* Weekly Chart & Category Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Weekly Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-900">Weekly Spend Trajectory</h3>
              <p className="text-xs text-zinc-500">Distribution over 4 billing cycles</p>
            </div>
            <span className="text-xs font-mono text-zinc-400">INR (₹)</span>
          </div>

          <div className="flex items-end justify-between gap-6 h-56 pt-6 px-4">
            {weeklyData.map((w, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-xs font-mono text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  ₹{(w.amount / 1000).toFixed(1)}k
                </span>
                <div className="w-full max-w-[48px] bg-zinc-100 rounded-t-xl relative overflow-hidden h-full flex items-end">
                  <div
                    className="w-full bg-brand-500 rounded-t-xl transition-all duration-500 group-hover:bg-brand-600"
                    style={{ height: w.height }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-zinc-600 text-center">{w.label.split(' ')[0]} {w.label.split(' ')[1]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-900">Category Breakdown</h3>
            <span className="text-xs font-bold text-brand-600">{categoryMap.length} Categories</span>
          </div>

          <div className="space-y-4 pt-1">
            {categoryMap.map((cat) => {
              const pct = Math.round((cat.amount / totalSpent) * 100);
              const Icon = cat.icon;
              return (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg ${cat.barBg} flex items-center justify-center`}>
                        <Icon className="w-3.5 h-3.5 text-zinc-800" />
                      </div>
                      <span className="font-bold text-zinc-900">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-zinc-900">{formatINR(cat.amount)}</span>
                      <span className="text-[11px] text-zinc-400 w-8 text-right font-normal">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`${cat.color} h-full rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
