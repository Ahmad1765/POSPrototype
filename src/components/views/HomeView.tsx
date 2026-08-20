import React from 'react';
import { 
  Send, QrCode, PlusCircle, Gift, Eye, EyeOff, 
  Sparkles, ChevronRight
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatINR } from '../../utils/currency';
import { TransactionList } from '../TransactionList';

export const HomeView: React.FC = () => {
  const { 
    user, cards, isBalanceVisible, toggleBalanceVisibility, 
    contacts, openModal, isOnline
  } = useAppStore();

  const primaryCard = cards[0];
  const totalBalance = cards.reduce((sum, c) => sum + c.balance, 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Main Balance & Financial Overview Card */}
      <div className="px-5 pt-1">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900 to-black text-white p-5 border border-white/10 shadow-card-float">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                  Total Liquid Balance
                </span>
                <button
                  onClick={toggleBalanceVisibility}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors p-1 rounded-md active-press"
                  aria-label="Toggle Balance Visibility"
                >
                  {isBalanceVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.08] border border-white/10 text-[10px] text-zinc-300">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                <span>{isOnline ? 'Bank Synced' : 'Offline Ready'}</span>
              </div>
            </div>

            {/* Big Clean Numerical Balance */}
            <div className="mt-2 mb-4">
              <h2 className="text-3xl font-bold tracking-tight tabular-nums text-white">
                {isBalanceVisible ? formatINR(totalBalance) : '₹ ••••••••'}
              </h2>
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                <span>Active Card:</span>
                <span className="text-zinc-200 font-medium">{primaryCard.name}</span>
                <span className="text-zinc-500 font-mono text-[11px]">({primaryCard.cardNumberMasked.slice(-4)})</span>
              </p>
            </div>

            {/* Quick Action Grid inside Balance Panel */}
            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-white/[0.08]">
              <button
                onClick={() => openModal('PAYMENT')}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/[0.06] transition-all active-press text-zinc-200"
              >
                <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-btn-orange">
                  <Send className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-medium">Send</span>
              </button>

              <button
                onClick={() => openModal('QR_SCANNER')}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/[0.06] transition-all active-press text-zinc-200"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center border border-white/10">
                  <QrCode className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-medium">QR Code</span>
              </button>

              <button
                onClick={() => openModal('TOP_UP')}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/[0.06] transition-all active-press text-zinc-200"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center border border-white/10">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-medium">Add Money</span>
              </button>

              <button
                onClick={() => openModal('REWARDS')}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/[0.06] transition-all active-press text-zinc-200"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
                  <Gift className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-medium">Rewards</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Beneficiary / Friends Strip */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Quick Transfer
          </h3>
          <button 
            onClick={() => openModal('PAYMENT')}
            className="text-[11px] font-medium text-brand-600 hover:text-brand-700"
          >
            Search Contacts
          </button>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1.5 no-scrollbar">
          {/* Add New Contact Shortcut */}
          <button
            onClick={() => openModal('PAYMENT')}
            className="flex flex-col items-center gap-1.5 shrink-0 group active-press"
          >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-300 hover:border-brand-500 flex items-center justify-center text-zinc-400 group-hover:text-brand-600 transition-colors bg-white">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium text-zinc-600">New</span>
          </button>

          {/* Contact Avatars */}
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => openModal('PAYMENT')}
              className="flex flex-col items-center gap-1.5 shrink-0 group active-press"
            >
              <div className="relative">
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-subtle group-hover:scale-105 transition-transform"
                />
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <span className="text-[10px] font-medium text-zinc-700 max-w-[56px] truncate">
                {contact.name.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Smart Spending Insight Banner */}
      <div className="px-5">
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-3.5 border border-orange-100/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900">
                You earned {user.rewardPoints} points this month
              </p>
              <p className="text-[11px] text-zinc-500">
                Redeem now for ₹{user.rewardPoints} instant card balance
              </p>
            </div>
          </div>
          <button
            onClick={() => openModal('REWARDS')}
            className="p-1.5 rounded-lg bg-white shadow-subtle border border-orange-200/60 text-brand-600 hover:bg-orange-50 active-press"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Recent Transactions Stream */}
      <TransactionList />
    </div>
  );
};
