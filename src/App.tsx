import React, { useState } from 'react';
import { MerchantPosContainer } from './components/MerchantPosContainer';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Smartphone, LayoutDashboard } from 'lucide-react';

export const App: React.FC = () => {
  const [appMode, setAppMode] = useState<'POS' | 'ADMIN'>('POS');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Prototype Switcher Banner */}
      <header className="w-full bg-zinc-900/95 border-b border-zinc-800/80 backdrop-blur-xl px-3 sm:px-6 py-2 flex items-center justify-between sticky top-0 z-50 select-none shrink-0 h-12">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-zinc-950 text-xs shadow-sm shrink-0">
            ₹
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-bold text-white tracking-tight">NodePOS</span>
            <span className="hidden sm:inline-block text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Prototype
            </span>
          </div>
        </div>

        {/* Mode Switcher Pill */}
        <div className="flex bg-zinc-950 p-0.5 rounded-lg sm:rounded-xl border border-zinc-800 text-xs font-medium shrink-0">
          <button
            type="button"
            onClick={() => setAppMode('POS')}
            className={`px-2.5 sm:px-3 py-1 rounded-md sm:rounded-lg flex items-center gap-1.5 transition-all text-xs ${
              appMode === 'POS'
                ? 'bg-zinc-800 text-white font-semibold shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="sm:hidden">POS</span>
            <span className="hidden sm:inline">POS Terminal</span>
          </button>

          <button
            type="button"
            onClick={() => setAppMode('ADMIN')}
            className={`px-2.5 sm:px-3 py-1 rounded-md sm:rounded-lg flex items-center gap-1.5 transition-all text-xs ${
              appMode === 'ADMIN'
                ? 'bg-zinc-800 text-white font-semibold shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="sm:hidden">Admin</span>
            <span className="hidden sm:inline">Admin Dashboard</span>
          </button>
        </div>
      </header>

      {/* Main Mode View */}
      <main className="flex-1 flex flex-col min-w-0">
        {appMode === 'POS' ? (
          <MerchantPosContainer />
        ) : (
          <AdminDashboard onSwitchToPos={() => setAppMode('POS')} />
        )}
      </main>
    </div>
  );
};

export default App;
