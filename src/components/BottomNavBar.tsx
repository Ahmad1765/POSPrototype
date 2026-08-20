import React from 'react';
import { Home, CreditCard, QrCode, BarChart3, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const BottomNavBar: React.FC = () => {
  const { currentScreen, setCurrentScreen, openModal } = useAppStore();

  const navItems = [
    { id: 'HOME' as const, label: 'Home', icon: Home },
    { id: 'CARDS' as const, label: 'Cards', icon: CreditCard },
    { id: 'ANALYTICS' as const, label: 'Insights', icon: BarChart3 },
    { id: 'PROFILE' as const, label: 'Profile', icon: User },
  ];

  return (
    <div className="w-full px-3 pb-3 pt-1 bg-gradient-to-t from-zinc-50 via-zinc-50/95 to-transparent select-none">
      {/* Floating Glass Dock */}
      <nav 
        aria-label="Main Navigation"
        className="relative bg-white/95 backdrop-blur-2xl rounded-[24px] border border-black/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.07)] px-2.5 py-1.5 flex items-center justify-between"
      >
        {/* Left Nav Pair: Home & Cards */}
        <div className="flex items-center flex-1 justify-around">
          {navItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 active-press relative ${
                  isActive
                    ? 'text-brand-600 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-700'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[1.8] transition-transform group-hover:scale-105" />
                <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-brand-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Center Elevated Action: QR Scanner & Pay */}
        <div className="relative -top-4 px-1 flex flex-col items-center shrink-0">
          <button
            onClick={() => openModal('QR_SCANNER')}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 via-brand-550 to-brand-400 hover:from-brand-550 hover:to-brand-400 text-white flex items-center justify-center shadow-[0_6px_16px_rgba(224,83,0,0.36)] active-press border-[3px] border-white transition-all transform hover:scale-105"
            aria-label="Scan or Show QR Code"
            title="Scan or Show QR Code"
          >
            <QrCode className="w-5 h-5 text-white" />
          </button>
          <span className="text-[9px] font-bold text-zinc-700 mt-0.5 uppercase tracking-wider font-mono">
            Pay
          </span>
        </div>

        {/* Right Nav Pair: Insights & Profile */}
        <div className="flex items-center flex-1 justify-around">
          {navItems.slice(2, 4).map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 active-press relative ${
                  isActive
                    ? 'text-brand-600 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-700'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[1.8] transition-transform group-hover:scale-105" />
                <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-brand-500" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* iOS Home Indicator Bar */}
      <div className="w-24 h-1 bg-zinc-300 rounded-full mx-auto mt-2" />
    </div>
  );
};
