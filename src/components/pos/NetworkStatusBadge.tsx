import React from 'react';
import { Wifi, WifiOff, RefreshCw, ShieldCheck } from 'lucide-react';

interface NetworkStatusBadgeProps {
  isOnline: boolean;
  onToggleOnline?: () => void;
  pendingSyncCount?: number;
  terminalCode?: string;
  merchantName?: string;
}

export const NetworkStatusBadge: React.FC<NetworkStatusBadgeProps> = ({
  isOnline = true,
  onToggleOnline,
  pendingSyncCount = 0,
  terminalCode = 'TERM-MUM-001',
  merchantName = 'Metro Specialty Coffee'
}) => {
  return (
    <div className="w-full bg-zinc-900/90 border-b border-zinc-800/80 backdrop-blur-xl px-4 py-2.5 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Terminal & Merchant Info */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 font-mono text-xs font-semibold">
          POS
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-zinc-100 tracking-tight">{merchantName}</span>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/40">
              {terminalCode}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>RBI Offline Cap: ₹500/txn</span>
          </p>
        </div>
      </div>

      {/* Online/Offline Status Pill & Toggle */}
      <div className="flex items-center gap-2">
        {pendingSyncCount > 0 && (
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full animate-pulse">
            <RefreshCw className="w-3 h-3" />
            <span>{pendingSyncCount} Pending Sync</span>
          </div>
        )}

        <button
          type="button"
          onClick={onToggleOnline}
          className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
            isOnline
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
          }`}
          title="Click to simulate network disconnect/reconnect"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
          {isOnline ? (
            <div className="flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span>Offline Mode</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
