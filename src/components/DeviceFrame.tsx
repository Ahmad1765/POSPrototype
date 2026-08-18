import React, { useState } from 'react';
import { Smartphone, Monitor, Zap } from 'lucide-react';
import { CurvedHeader } from './CurvedHeader';
import { TabSwitcher } from './TabSwitcher';
import { CreditCardView } from './CreditCardView';
import { ActionGrid } from './ActionGrid';
import { TransactionList } from './TransactionList';
import { BottomNavBar } from './BottomNavBar';
import { QRScannerModal } from './QRScannerModal';
import { QuickPayModal } from './QuickPayModal';
import { ManageCardModal } from './ManageCardModal';
import { RewardPointsModal } from './RewardPointsModal';
import { DigitalReceiptModal } from './DigitalReceiptModal';
import { SearchModal, NotificationDrawer } from './HeaderModals';
import { useAppStore } from '../store/useAppStore';

export const MainAppContainer: React.FC = () => {
  const [isFrameEnabled, setIsFrameEnabled] = useState(true);
  const { isOnline, toggleOnlineStatus, transactions } = useAppStore();

  const pendingCount = transactions.filter((t) => t.status === 'OFFLINE_PENDING').length;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col items-center justify-start sm:py-8 px-0 sm:px-4 font-sans selection:bg-brand-500 selection:text-white">
      
      {/* Top Controls Bar (Desktop Demo Mode Switcher) */}
      <div className="w-full max-w-4xl mb-4 px-4 hidden sm:flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-btn-orange">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              BharatPay POS • Offline-Ready Prototype
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
                Tier-One FinTech
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              React + Vite • Orange Corporate Aesthetic • Indian Market (₹ / INR)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Online/Offline Simulator Quick Button */}
          <button
            onClick={toggleOnlineStatus}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all active-press ${
              isOnline
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
                : 'bg-amber-950/60 text-amber-300 border-amber-500/40 hover:bg-amber-900/60 animate-pulse'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>{isOnline ? 'Network: Online' : 'Network: Offline (SaF)'}</span>
            {pendingCount > 0 && (
              <span className="bg-amber-400 text-slate-900 text-[9px] px-1.5 py-0.2 rounded-full font-black">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Toggle Device Mockup Frame */}
          <button
            onClick={() => setIsFrameEnabled(!isFrameEnabled)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 active-press transition-colors"
          >
            {isFrameEnabled ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span>{isFrameEnabled ? 'Full View' : 'Phone Frame'}</span>
          </button>
        </div>
      </div>

      {/* Main Mobile App Wrapper */}
      <div
        className={`w-full transition-all duration-300 ${
          isFrameEnabled
            ? 'max-w-[412px] bg-slate-50 text-slate-900 sm:rounded-[48px] sm:shadow-[0_25px_70px_rgba(0,0,0,0.6)] sm:border-[8px] sm:border-slate-800/90 overflow-hidden relative min-h-[880px]'
            : 'max-w-md bg-slate-50 text-slate-900 min-h-screen relative overflow-hidden'
        }`}
      >
        {/* Dynamic Island Notch (Phone Mockup Header) */}
        {isFrameEnabled && (
          <div className="hidden sm:block absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 shadow-md">
            <div className="w-full h-full flex items-center justify-end px-3">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
            </div>
          </div>
        )}

        {/* Mobile Viewport Container */}
        <div className="flex flex-col min-h-full pb-10">
          {/* 1. Curved Header & Status Bar */}
          <CurvedHeader />

          {/* 2. Floating Segmented Tab Switcher (Account | Credit Card | Loan) */}
          <TabSwitcher />

          {/* 3. Main Glossy Credit Card Component */}
          <CreditCardView />

          {/* 4. Refined 4-Item Action Grid */}
          <ActionGrid />

          {/* 5. Indian Transaction Stream with Offline Badges */}
          <TransactionList />

          {/* 6. Custom Floating Bottom Navigation with Elevated Center Action */}
          <BottomNavBar />
        </div>

        {/* Interactive Modals */}
        <QRScannerModal />
        <QuickPayModal />
        <ManageCardModal />
        <RewardPointsModal />
        <DigitalReceiptModal />
        <SearchModal />
        <NotificationDrawer />
      </div>

      {/* Footer Info for Enterprise Review */}
      <div className="mt-4 text-center text-xs text-slate-500 max-w-md hidden sm:block">
        <p>
          Architecture compliance: <span className="text-brand-400 font-semibold">HMAC-SHA256</span> • Idempotency Protection • NPCI UPI & Visa EMV Compliant
        </p>
      </div>
    </div>
  );
};
