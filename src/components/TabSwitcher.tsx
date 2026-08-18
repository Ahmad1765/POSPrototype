import React from 'react';
import { useAppStore } from '../store/useAppStore';
import type { TabType } from '../types';

export const TabSwitcher: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();

  const tabs: { id: TabType; label: string }[] = [
    { id: 'ACCOUNT', label: 'Account' },
    { id: 'CREDIT_CARD', label: 'Credit Card' },
    { id: 'LOAN', label: 'Loan' },
  ];

  return (
    <div className="px-5 -mt-8 relative z-10">
      <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-full shadow-card-float border border-slate-100 flex items-center justify-between">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-3 rounded-full text-xs font-semibold transition-all duration-300 relative text-center active-press ${
                isActive
                  ? 'bg-gradient-to-r from-brand-550 to-brand-600 text-white shadow-btn-orange font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="sr-only">(Active tab)</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
