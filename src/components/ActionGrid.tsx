import React from 'react';
import { Zap, PlusCircle, Shield, Gift } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const ActionGrid: React.FC = () => {
  const { openModal, user } = useAppStore();

  const actions = [
    {
      id: 'PAYMENT',
      label: 'Payments',
      sublabel: 'UPI & Bills',
      icon: Zap,
      iconBg: 'bg-orange-50 text-brand-600 border border-orange-100',
      badge: null,
      onClick: () => openModal('PAYMENT'),
    },
    {
      id: 'TOP_UP',
      label: 'Top Up',
      sublabel: 'Instant Cash-In',
      icon: PlusCircle,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      badge: null,
      onClick: () => openModal('TOP_UP'),
    },
    {
      id: 'MANAGE_CARD',
      label: 'Manage Cards',
      sublabel: 'Limits & Security',
      icon: Shield,
      iconBg: 'bg-slate-50 text-slate-700 border border-slate-200/80',
      badge: null,
      onClick: () => openModal('MANAGE_CARD'),
    },
    {
      id: 'REWARDS',
      label: 'Reward Points',
      sublabel: `${user.rewardPoints.toLocaleString('en-IN')} Pts`,
      icon: Gift,
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
      badge: 'Cashback',
      onClick: () => openModal('REWARDS'),
    },
  ];

  return (
    <div className="px-5 mt-5">
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Quick Services
        </h3>
        <span className="text-[11px] font-medium text-brand-600 hover:text-brand-700 cursor-pointer">
          View All
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className="bg-white hover:bg-slate-50/80 rounded-2xl p-3 flex flex-col items-center justify-between text-center shadow-subtle hover:shadow-card-float border border-slate-100/90 transition-all duration-200 active-press group relative"
            >
              {action.badge && (
                <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-gradient-to-r from-rose-500 to-red-500 text-[8px] font-black text-white rounded-full shadow-sm">
                  {action.badge}
                </span>
              )}

              {/* Icon Container */}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform ${action.iconBg}`}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Text Labels */}
              <p className="text-[11px] font-bold text-slate-800 leading-tight">
                {action.label}
              </p>
              <p className="text-[9px] font-medium text-slate-400 mt-0.5 truncate max-w-full">
                {action.sublabel}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
