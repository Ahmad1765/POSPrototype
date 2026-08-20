import React from 'react';
import { 
  LayoutDashboard, CreditCard, Landmark, BarChart3, 
  User, QrCode, Send, PlusCircle, Gift, ShieldCheck, 
  Wifi, WifiOff, ChevronRight 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { MainScreenType } from '../../types';

export const WebSidebar: React.FC = () => {
  const { currentScreen, setCurrentScreen, openModal, user, isOnline, toggleOnlineStatus } = useAppStore();

  const navItems: { id: MainScreenType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'HOME', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'CARDS', label: 'Cards & Wallet', icon: CreditCard },
    { id: 'LOANS', label: 'Instant Credit Line', icon: Landmark },
    { id: 'ANALYTICS', label: 'Spending Insights', icon: BarChart3 },
    { id: 'PROFILE', label: 'Account & Settings', icon: User },
  ];

  return (
    <aside className="w-64 bg-zinc-950 text-zinc-100 flex flex-col border-r border-zinc-850 h-screen sticky top-0 shrink-0 select-none">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-850/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-base shadow-btn-orange">
            ₹
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              BharatPay POS
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400">Enterprise Consumer Portal</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Links */}
      <div className="p-3 flex-1 space-y-1 overflow-y-auto no-scrollbar">
        <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Navigation
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all active-press ${
                isActive
                  ? 'bg-brand-500 text-white shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
            </button>
          );
        })}

        {/* Quick Action Shortcuts */}
        <p className="px-3 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Quick Actions
        </p>

        <button
          onClick={() => openModal('PAYMENT')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          <Send className="w-4 h-4 text-brand-400" />
          <span>Send / Transfer</span>
        </button>

        <button
          onClick={() => openModal('QR_SCANNER')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          <QrCode className="w-4 h-4 text-emerald-400" />
          <span>Show My QR Code</span>
        </button>

        <button
          onClick={() => openModal('TOP_UP')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          <PlusCircle className="w-4 h-4 text-blue-400" />
          <span>Add Money to Card</span>
        </button>

        <button
          onClick={() => openModal('REWARDS')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          <Gift className="w-4 h-4 text-amber-400" />
          <span>Rewards & Scratch Card</span>
        </button>
      </div>

      {/* Network & User Status Footer */}
      <div className="p-3 border-t border-zinc-850/80 bg-zinc-925 space-y-2.5">
        {/* Network Mode Toggle */}
        <button
          onClick={toggleOnlineStatus}
          className={`w-full px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-between transition-colors active-press ${
            isOnline
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/40'
              : 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:bg-amber-900/40 animate-pulse'
          }`}
        >
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? 'Bank Network Synced' : 'Offline Wallet Active'}</span>
          </div>
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        </button>

        {/* User Profile Summary */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border border-zinc-700"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-zinc-400 font-mono truncate">{user.upiId}</p>
            </div>
          </div>

          <button
            onClick={() => setCurrentScreen('PROFILE')}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 transition-colors"
            title="Open Profile"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

    </aside>
  );
};
