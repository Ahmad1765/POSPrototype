import React from 'react';
import { 
  LayoutDashboard, ReceiptText, Smartphone, Settings, 
  Store, Terminal, ShieldCheck, ArrowLeftRight
} from 'lucide-react';

export type AdminTab = 'OVERVIEW' | 'TRANSACTIONS' | 'TERMINALS' | 'SETTINGS';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onSwitchToPos?: () => void;
  merchantName?: string;
  terminalCode?: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  onSwitchToPos,
  merchantName = 'Metro Specialty Coffee',
  terminalCode = 'TERM-MUM-001'
}) => {
  const navItems: Array<{
    id: AdminTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: 'OVERVIEW',
      label: 'Overview',
      icon: <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    },
    {
      id: 'TRANSACTIONS',
      label: 'Ledger',
      icon: <ReceiptText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    },
    {
      id: 'TERMINALS',
      label: 'Terminals',
      icon: <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
      badge: '1 Live'
    },
    {
      id: 'SETTINGS',
      label: 'Settings',
      icon: <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    }
  ];

  return (
    <aside className="w-full lg:w-64 bg-zinc-900/90 border-b lg:border-b-0 lg:border-r border-zinc-800/80 p-2 sm:p-4 flex flex-col justify-between select-none shrink-0 backdrop-blur-xl">
      <div className="flex flex-col gap-2 lg:gap-6">
        
        {/* Merchant Branding (shown on desktop, compact on mobile) */}
        <div className="hidden lg:flex items-center gap-3 px-2 py-1.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/60 flex items-center justify-center text-emerald-400 font-bold text-sm shadow-inner shrink-0">
            <Store className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-zinc-100 truncate tracking-tight">{merchantName}</div>
            <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>NodePOS Operations</span>
            </div>
          </div>
        </div>

        {/* Navigation Links (Grid on mobile, column on desktop) */}
        <nav className="grid grid-cols-4 lg:flex lg:flex-col gap-1 p-1 bg-zinc-950/60 lg:bg-transparent rounded-xl border lg:border-none border-zinc-800/80">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`py-2 px-1.5 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-medium flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-1 sm:gap-2.5 transition-all duration-150 active:scale-[0.98] ${
                  isActive
                    ? 'bg-zinc-800 text-white font-semibold shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60 border border-transparent'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-2.5">
                  <span className={isActive ? 'text-emerald-400' : 'text-zinc-400'}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="hidden lg:inline-block text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section for Desktop */}
      <div className="hidden lg:flex flex-col gap-3 pt-6 border-t border-zinc-800/80">
        
        {/* Terminal Info Card */}
        <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-850 text-xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-1">
            <span>ACTIVE TERMINAL</span>
            <span className="text-emerald-400 font-mono text-[9px] font-bold">LIVE</span>
          </div>
          <div className="font-mono text-zinc-200 text-xs font-semibold">{terminalCode}</div>
          <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Dexie IndexedDB Live</span>
          </div>
        </div>

        {/* Switch Back to POS Terminal Mode */}
        {onSwitchToPos && (
          <button
            type="button"
            onClick={onSwitchToPos}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/70 text-zinc-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open POS Terminal</span>
            <ArrowLeftRight className="w-3 h-3 text-zinc-500" />
          </button>
        )}
      </div>
    </aside>
  );
};
