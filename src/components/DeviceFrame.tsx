import React, { useState } from 'react';
import { Smartphone, Monitor, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { CurvedHeader } from './CurvedHeader';
import { TabSwitcher } from './TabSwitcher';
import { HomeView } from './views/HomeView';
import { CardsView } from './views/CardsView';
import { LoansView } from './views/LoansView';
import { AnalyticsView } from './views/AnalyticsView';
import { ProfileView } from './views/ProfileView';
import { BottomNavBar } from './BottomNavBar';
import { QRScannerModal } from './QRScannerModal';
import { QuickPayModal } from './QuickPayModal';
import { ManageCardModal } from './ManageCardModal';
import { RewardPointsModal } from './RewardPointsModal';
import { DigitalReceiptModal } from './DigitalReceiptModal';
import { SearchModal, NotificationDrawer } from './HeaderModals';
import { WebDashboard } from './web/WebDashboard';
import { useAppStore } from '../store/useAppStore';

export const MainAppContainer: React.FC = () => {
  const [viewMode, setViewMode] = useState<'WEB' | 'MOBILE'>('WEB');
  const { isOnline, toggleOnlineStatus, transactions, currentScreen } = useAppStore();

  const pendingCount = transactions.filter((t) => t.status === 'OFFLINE_PENDING').length;

  const renderActiveMobileScreen = () => {
    switch (currentScreen) {
      case 'CARDS':
        return <CardsView />;
      case 'LOANS':
        return <LoansView />;
      case 'ANALYTICS':
        return <AnalyticsView />;
      case 'PROFILE':
        return <ProfileView />;
      case 'HOME':
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      
      {/* Top Experience Switcher Bar */}
      <header className="w-full bg-zinc-900/90 border-b border-zinc-800 backdrop-blur-md px-6 py-2.5 flex items-center justify-between sticky top-0 z-50 select-none">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-brand-500 flex items-center justify-center font-bold text-white text-xs">
            ₹
          </div>
          <div>
            <h1 className="text-xs font-bold text-white tracking-tight flex items-center gap-2">
              BharatPay FinTech Portal
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                Live Prototype
              </span>
            </h1>
          </div>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center gap-3">
          {/* Online / Offline Simulator */}
          <button
            onClick={toggleOnlineStatus}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-all active-press ${
              isOnline
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/40'
                : 'bg-amber-950/50 text-amber-300 border-amber-500/40 hover:bg-amber-900/50 animate-pulse'
            }`}
          >
            {isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
            {pendingCount > 0 && (
              <span className="bg-amber-400 text-zinc-950 text-[9px] px-1 rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Switch between Web Desktop and Mobile App */}
          <div className="flex bg-zinc-850 p-0.5 rounded-xl border border-zinc-750 text-xs font-semibold">
            <button
              onClick={() => setViewMode('WEB')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'WEB' ? 'bg-brand-500 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Web Portal</span>
            </button>

            <button
              onClick={() => setViewMode('MOBILE')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'MOBILE' ? 'bg-brand-500 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile App</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Experience View */}
      {viewMode === 'WEB' ? (
        /* 1. Desktop Web Portal View */
        <div className="flex-1 flex flex-col">
          <WebDashboard />
        </div>
      ) : (
        /* 2. Mobile Phone Frame Simulator View */
        <div className="flex-1 flex flex-col items-center justify-start py-8 px-4">
          <div className="w-full max-w-[412px] bg-zinc-50 text-zinc-900 sm:rounded-[48px] sm:shadow-[0_20px_60px_rgba(0,0,0,0.6)] sm:border-[8px] sm:border-zinc-900 relative sm:h-[880px] flex flex-col overflow-hidden">
            {/* Dynamic Island Notch */}
            <div className="hidden sm:block absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-50 shadow-sm pointer-events-none">
              <div className="w-full h-full flex items-center justify-end px-2.5">
                <div className="w-2 h-2 rounded-full bg-zinc-900 border border-zinc-800" />
              </div>
            </div>

            {/* Scrollable Mobile Body */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col select-none">
              <CurvedHeader />
              {(currentScreen === 'HOME' || currentScreen === 'CARDS' || currentScreen === 'LOANS') && (
                <TabSwitcher />
              )}
              <main className="flex-1 mt-4">
                {renderActiveMobileScreen()}
              </main>
            </div>

            {/* Pinned Bottom Nav Dock */}
            <div className="shrink-0 relative z-30">
              <BottomNavBar />
            </div>

            {/* Modals */}
            <QRScannerModal />
            <QuickPayModal />
            <ManageCardModal />
            <RewardPointsModal />
            <DigitalReceiptModal />
            <SearchModal />
            <NotificationDrawer />
          </div>

          {/* Trust Footer */}
          <div className="mt-4 text-center text-[11px] text-zinc-500 max-w-md">
            <p className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>NPCI UPI Certified • 256-bit AES Cryptographic Security</span>
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
