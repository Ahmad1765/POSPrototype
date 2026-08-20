import React from 'react';
import { 
  Search, Bell, QrCode, Send, PlusCircle, 
  ShieldCheck, Eye, EyeOff, RefreshCw 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const WebTopHeader: React.FC = () => {
  const { 
    user, openModal, isBalanceVisible, toggleBalanceVisibility, 
    searchQuery, setSearchQuery, isSyncing, syncOfflineBatch, isOnline, transactions 
  } = useAppStore();

  const pendingCount = transactions.filter((t) => t.status === 'OFFLINE_PENDING').length;

  return (
    <header className="h-16 bg-white border-b border-zinc-200/80 px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      
      {/* Left: Search Bar */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions, merchants, or categories..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-brand-500 focus:bg-white transition-all font-medium"
          />
        </div>
      </div>

      {/* Right: Actions & User Summary */}
      <div className="flex items-center gap-3">
        
        {/* Offline Sync Button if pending */}
        {pendingCount > 0 && (
          <button
            onClick={() => isOnline && syncOfflineBatch()}
            disabled={!isOnline || isSyncing}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isOnline
                ? 'bg-orange-50 text-brand-700 border-orange-200 hover:bg-orange-100 active-press cursor-pointer'
                : 'bg-zinc-100 text-zinc-500 border-zinc-200 cursor-not-allowed opacity-60'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync {pendingCount} Offline Payments</span>
          </button>
        )}

        {/* Privacy Balance Toggle */}
        <button
          onClick={toggleBalanceVisibility}
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors border border-zinc-200/60"
          title="Toggle Sensitive Balance Visibility"
        >
          {isBalanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        {/* Primary Action Buttons */}
        <button
          onClick={() => openModal('PAYMENT')}
          className="px-3.5 py-2 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-btn-orange flex items-center gap-1.5 active-press transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send Money</span>
        </button>

        <button
          onClick={() => openModal('QR_SCANNER')}
          className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 active-press transition-all"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>QR Hub</span>
        </button>

        <button
          onClick={() => openModal('TOP_UP')}
          className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-zinc-200/80 active-press transition-all"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Add Money</span>
        </button>

        <div className="h-6 w-px bg-zinc-200 mx-1" />

        {/* Notifications */}
        <button
          onClick={() => openModal('NOTIFICATIONS')}
          className="relative p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors border border-zinc-200/60"
        >
          <Bell className="w-4 h-4" />
          {user.unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500" />
          )}
        </button>

        {/* KYC Status Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified</span>
        </div>
      </div>

    </header>
  );
};
