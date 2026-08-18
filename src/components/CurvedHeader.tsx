import React from 'react';
import { Search, Bell, LogOut, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const CurvedHeader: React.FC = () => {
  const { user, isOnline, toggleOnlineStatus, isSyncing, syncOfflineBatch, openModal, transactions } = useAppStore();

  const pendingOfflineCount = transactions.filter((t) => t.status === 'OFFLINE_PENDING').length;

  return (
    <div className="relative text-white select-none">
      {/* Curved Header Background Container with Organic SVG Bottom Wave */}
      <div className="curved-header-bg pt-7 pb-16 px-5 rounded-b-[38px] shadow-card-glow">
        
        {/* Network & Offline Status Banner */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={toggleOnlineStatus}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition-all active-press ${
              isOnline
                ? 'bg-black/20 text-emerald-300 border border-emerald-400/30'
                : 'bg-black/30 text-amber-300 border border-amber-400/40 animate-pulse'
            }`}
            title="Click to toggle Online/Offline POS Mode"
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <Wifi className="w-3.5 h-3.5" />
                <span>ONLINE • POS-001</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <WifiOff className="w-3.5 h-3.5" />
                <span>OFFLINE (STORE & FORWARD)</span>
              </>
            )}
          </button>

          {/* Sync Trigger / Pending Count */}
          {pendingOfflineCount > 0 && (
            <button
              onClick={() => isOnline && syncOfflineBatch()}
              disabled={!isOnline || isSyncing}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md transition-all ${
                isOnline
                  ? 'bg-white/20 text-white hover:bg-white/30 active-press cursor-pointer'
                  : 'bg-black/20 text-amber-200 cursor-not-allowed opacity-75'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{pendingOfflineCount} Pending Sync</span>
            </button>
          )}
        </div>

        {/* Top Bar: Profile, Greeting & Action Icons */}
        <div className="flex items-center justify-between">
          {/* Left: User Profile Avatar & Greeting */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/80 shadow-md ring-2 ring-orange-300/40"
              />
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-orange-600 ${
                  isOnline ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-orange-100/90 tracking-wide uppercase">
                {user.greeting},
              </p>
              <h1 className="text-lg font-bold text-white tracking-tight leading-tight">
                {user.name}
              </h1>
            </div>
          </div>

          {/* Right: Action Icons (Search, Notifications, Logout) */}
          <div className="flex items-center gap-2">
            {/* Search Icon */}
            <button
              onClick={() => openModal('SEARCH')}
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active-press flex items-center justify-center backdrop-blur-md transition-colors border border-white/20"
              aria-label="Search"
            >
              <Search className="w-4.5 h-4.5 text-white" />
            </button>

            {/* Notifications with Badge */}
            <button
              onClick={() => openModal('NOTIFICATIONS')}
              className="relative w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active-press flex items-center justify-center backdrop-blur-md transition-colors border border-white/20"
              aria-label="Notifications"
            >
              <Bell className="w-4.5 h-4.5 text-white" />
              {user.unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[10px] font-bold rounded-full flex items-center justify-center text-white border border-orange-600 shadow-sm animate-bounce">
                  {user.unreadNotifications}
                </span>
              )}
            </button>

            {/* Logout / Terminal Lock */}
            <button
              onClick={() => alert(`POS Terminal [${user.terminalCode}] locked securely.`)}
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active-press flex items-center justify-center backdrop-blur-md transition-colors border border-white/20 text-white/90 hover:text-white"
              aria-label="Lock POS Terminal"
              title="Lock Terminal"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
