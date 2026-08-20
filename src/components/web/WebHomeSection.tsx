import React, { useState } from 'react';
import { 
  Lock, Unlock, Sparkles, Gift, 
  Copy, Check 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatINR, formatDateTime } from '../../utils/currency';
import type { Transaction } from '../../types';

export const WebHomeSection: React.FC = () => {
  const { 
    user, cards, activeCardIndex, toggleCardFreeze, 
    transactions, setSelectedTransaction, loanAccount, isBalanceVisible, 
    openModal, contacts, perks, searchQuery, claimScratchReward 
  } = useAppStore();

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [scratchWon, setScratchWon] = useState<number | null>(null);

  const totalBalance = cards.reduce((sum, c) => sum + c.balance, 0);
  const activeCard = cards[activeCardIndex] || cards[0];

  const filteredTransactions = transactions.filter(
    (t) =>
      t.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.merchantCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.amount.toString().includes(searchQuery)
  );

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleScratch = () => {
    if (scratchWon !== null) return;
    const bonus = claimScratchReward();
    setScratchWon(bonus);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-200">
      
      {/* 1. Metric KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Balance */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900 via-neutral-900 to-black text-white border border-white/10 shadow-subtle relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-28 h-28 bg-brand-500/20 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="font-semibold uppercase tracking-wider">Total Balance</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-200 border border-white/10">
                Liquid
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mt-2 font-mono tracking-tight">
              {isBalanceVisible ? formatINR(totalBalance) : '₹ ••••••••'}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <span>Primary:</span>
              <span className="text-zinc-200 font-medium">{activeCard.name}</span>
            </p>
          </div>
        </div>

        {/* Card 2: Instant Credit Line */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-subtle">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-semibold uppercase tracking-wider">Credit Line</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Pre-Approved
            </span>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 mt-2 font-mono tracking-tight">
            {formatINR(loanAccount.availableCredit)}
          </h3>
          <p className="text-xs text-brand-600 font-semibold mt-1 flex items-center justify-between">
            <span>Interest: 11.25% APR</span>
            <button
              onClick={() => openModal('TOP_UP')}
              className="text-xs hover:underline"
            >
              Drawdown →
            </button>
          </p>
        </div>

        {/* Card 3: Monthly Inflow */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-subtle">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-semibold uppercase tracking-wider">Monthly Spend</span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              -12% MoM
            </span>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 mt-2 font-mono tracking-tight">
            ₹22,449.00
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Budget health: <span className="text-zinc-700 font-bold">56% of ₹40,000</span>
          </p>
        </div>

        {/* Card 4: Rewards & Points */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-subtle">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-semibold uppercase tracking-wider">Reward Points</span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              1 Pt = ₹1
            </span>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 mt-2 font-mono tracking-tight">
            {user.rewardPoints.toLocaleString('en-IN')} <span className="text-sm font-semibold text-brand-600">PTS</span>
          </h3>
          <p className="text-xs mt-1 flex items-center justify-between">
            <span className="text-zinc-400">Cash: {formatINR(user.rewardPoints)}</span>
            <button
              onClick={() => openModal('REWARDS')}
              className="text-brand-600 font-bold hover:underline"
            >
              Redeem →
            </button>
          </p>
        </div>

      </div>

      {/* 2. Main Workspace Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Cards Showcase + Transactions Table (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Card Quick Strip */}
          <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-10 rounded-lg bg-zinc-900 text-white flex flex-col justify-between p-2 shadow-sm shrink-0 border border-zinc-700">
                <div className="flex justify-between items-center text-[8px] font-bold text-zinc-400">
                  <span>EMV</span>
                  <span>{activeCard.brand}</span>
                </div>
                <span className="text-[9px] font-mono">{activeCard.cardNumberMasked.slice(-4)}</span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-zinc-900">{activeCard.name}</h4>
                  {activeCard.isFrozen && (
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.2 rounded border border-sky-200">
                      Frozen
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Available Limit: <span className="font-bold text-zinc-800 font-mono">{formatINR(activeCard.availableLimit)}</span> of {formatINR(activeCard.totalLimit)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => toggleCardFreeze(activeCard.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active-press flex items-center gap-1.5 ${
                  activeCard.isFrozen
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200'
                }`}
              >
                {activeCard.isFrozen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>{activeCard.isFrozen ? 'Unfreeze' : 'Freeze'}</span>
              </button>

              <button
                onClick={() => openModal('MANAGE_CARD')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 active-press"
              >
                Card Controls
              </button>
            </div>
          </div>

          {/* Transactions Ledger Table */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-subtle overflow-hidden">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Recent Transactions</h3>
                <p className="text-xs text-zinc-500">Live payment stream & settlement logs</p>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                {filteredTransactions.length} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-50/70 border-b border-zinc-100 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-5">Merchant & Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-400 text-xs">
                        No transactions found matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx: Transaction) => (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTransaction(tx)}
                        className="hover:bg-zinc-50/80 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-5 font-semibold text-zinc-900 group-hover:text-brand-600 transition-colors">
                          <div className="flex items-center gap-2">
                            <span>{tx.merchantName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-500 font-medium">
                          {tx.merchantCategory}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                          {formatDateTime(tx.timestamp)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-mono text-[10px]">
                            {tx.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold font-mono tabular-nums">
                          <span className={tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-zinc-900'}>
                            {tx.type === 'CREDIT' ? '+' : '−'} {formatINR(tx.amount)}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {tx.status === 'OFFLINE_PENDING' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 font-medium text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Offline SaF
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200/60 font-medium text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Settled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Contacts, Scratch Card & Brand Perks (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Transfer Beneficiaries */}
          <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-subtle space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Quick Transfer
              </h4>
              <button
                onClick={() => openModal('ADD_CONTACT')}
                className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1"
              >
                <span>+ Add Contact</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {/* Add New Contact Tile */}
              <button
                onClick={() => openModal('ADD_CONTACT')}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-zinc-50 transition-colors active-press group"
              >
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-300 group-hover:border-brand-500 flex items-center justify-center text-zinc-400 group-hover:text-brand-600 transition-colors bg-white">
                  <span className="text-lg font-bold leading-none">+</span>
                </div>
                <span className="text-[11px] font-semibold text-zinc-600 truncate max-w-[64px]">
                  Add
                </span>
              </button>

              {contacts.slice(0, 3).map((c) => (
                <button
                  key={c.id}
                  onClick={() => openModal('PAYMENT')}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-zinc-50 transition-colors active-press group"
                >
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-zinc-100 group-hover:border-brand-500 transition-colors"
                  />
                  <span className="text-[11px] font-semibold text-zinc-700 truncate max-w-[64px]">
                    {c.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Mystery Scratch Card Widget */}
          <div className="bg-gradient-to-br from-zinc-900 to-black text-white rounded-2xl p-5 border border-white/10 shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-brand-400" />
                <h4 className="text-xs font-bold text-white">Mystery Scratch Card</h4>
              </div>
              <span className="text-[10px] text-amber-400 font-mono">Daily Prize</span>
            </div>

            <div
              onClick={handleScratch}
              className={`p-4 rounded-xl border border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                scratchWon !== null
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-white/5 border-white/20 hover:border-brand-400 text-zinc-300'
              }`}
            >
              {scratchWon !== null ? (
                <div className="text-center animate-in zoom-in-50">
                  <p className="text-xs font-bold uppercase text-brand-400">Bonus Claimed!</p>
                  <p className="text-2xl font-black text-white font-mono mt-0.5">+{scratchWon} Points</p>
                </div>
              ) : (
                <div className="text-center py-2">
                  <Sparkles className="w-6 h-6 text-brand-400 mx-auto mb-1 animate-pulse" />
                  <p className="text-xs font-bold text-white">Click to Scratch & Win</p>
                  <p className="text-[10px] text-zinc-400">Up to 300 instant cashback points</p>
                </div>
              )}
            </div>
          </div>

          {/* Curated Brand Perks */}
          <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Exclusive Perks
              </h4>
              <button
                onClick={() => openModal('REWARDS')}
                className="text-xs text-brand-600 font-semibold hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5">
              {perks.slice(0, 3).map((perk) => (
                <div
                  key={perk.id}
                  className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${perk.iconBg}`}>
                      {perk.logoText}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 truncate">{perk.brand}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{perk.discount}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(perk.code)}
                    className="px-2 py-1 rounded bg-white border border-zinc-200 text-zinc-700 text-[10px] font-mono font-bold hover:bg-zinc-100 flex items-center gap-1 shrink-0 active-press"
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
          </div>

        </div>

      </div>

    </div>
  );
};
