import React from 'react';
import { Home, CreditCard, QrCode, BarChart3, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const BottomNavBar: React.FC = () => {
  const { openModal, setActiveTab } = useAppStore();
  const [activeNav, setActiveNav] = React.useState<'HOME' | 'CARDS' | 'ANALYTICS' | 'PROFILE'>('HOME');

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 px-4 pb-3 pointer-events-none">
      <div className="relative pointer-events-auto">
        {/* Navigation Bar Glass Container */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-nav-bar border border-slate-200/80 px-6 py-2.5 flex items-center justify-between">
          
          {/* 1. Home Tab */}
          <button
            onClick={() => {
              setActiveNav('HOME');
              setActiveTab('CREDIT_CARD');
            }}
            className={`flex flex-col items-center gap-1 active-press transition-colors ${
              activeNav === 'HOME' ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold">Home</span>
          </button>

          {/* 2. Cards Tab */}
          <button
            onClick={() => {
              setActiveNav('CARDS');
              openModal('MANAGE_CARD');
            }}
            className={`flex flex-col items-center gap-1 active-press transition-colors ${
              activeNav === 'CARDS' ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px] font-medium">Cards</span>
          </button>

          {/* 3. Center Elevated Action Button (QR Scanner / Instant POS Pay) */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              onClick={() => openModal('QR_SCANNER')}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-600 to-brand-500 hover:from-brand-550 hover:to-brand-400 text-white flex items-center justify-center shadow-btn-orange active-press border-4 border-white transition-all transform hover:scale-105"
              aria-label="Scan QR Code"
            >
              <QrCode className="w-6 h-6 text-white animate-pulse-slow" />
            </button>
            <span className="text-[9px] font-bold text-brand-700 mt-1 uppercase tracking-tight">
              Scan & Pay
            </span>
          </div>

          {/* 4. Analytics Tab */}
          <button
            onClick={() => {
              setActiveNav('ANALYTICS');
              openModal('REWARDS');
            }}
            className={`flex flex-col items-center gap-1 active-press transition-colors ${
              activeNav === 'ANALYTICS' ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-medium">Insights</span>
          </button>

          {/* 5. Profile Tab */}
          <button
            onClick={() => {
              setActiveNav('PROFILE');
              openModal('NOTIFICATIONS');
            }}
            className={`flex flex-col items-center gap-1 active-press transition-colors ${
              activeNav === 'PROFILE' ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
