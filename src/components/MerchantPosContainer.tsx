import React, { useState } from 'react';
import { NetworkStatusBadge } from './pos/NetworkStatusBadge';
import { PosTerminalView } from './pos/PosTerminalView';
import type { PaymentMethodType } from './pos/PaymentMethodSelector';
import { ShieldCheck, History, Clock, ArrowDownLeft } from 'lucide-react';

interface MockTxn {
  id: string;
  amount: number;
  method: PaymentMethodType;
  timestamp: string;
  isOffline: boolean;
  status: 'AUTHORIZED' | 'OFFLINE_STORED';
}

export const MerchantPosContainer: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [recentTxns, setRecentTxns] = useState<MockTxn[]>([
    {
      id: 'TXN-90211',
      amount: 320.00,
      method: 'CARD_NFC',
      timestamp: '14:28',
      isOffline: false,
      status: 'AUTHORIZED'
    },
    {
      id: 'TXN-90210',
      amount: 150.00,
      method: 'UPI_LITE',
      timestamp: '14:15',
      isOffline: true,
      status: 'OFFLINE_STORED'
    },
    {
      id: 'TXN-90209',
      amount: 450.00,
      method: 'CARD_CHIP',
      timestamp: '13:52',
      isOffline: false,
      status: 'AUTHORIZED'
    }
  ]);

  const pendingOfflineCount = recentTxns.filter(t => t.isOffline).length;

  const handlePaymentComplete = (details: {
    amount: number;
    method: PaymentMethodType;
    isOffline: boolean;
  }) => {
    const newTxn: MockTxn = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      amount: details.amount,
      method: details.method,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOffline: details.isOffline,
      status: details.isOffline ? 'OFFLINE_STORED' : 'AUTHORIZED'
    };
    setRecentTxns(prev => [newTxn, ...prev.slice(0, 4)]);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* Top Header Bar */}
      <NetworkStatusBadge
        isOnline={isOnline}
        onToggleOnline={() => setIsOnline(prev => !prev)}
        pendingSyncCount={pendingOfflineCount}
        terminalCode="TERM-MUM-001"
        merchantName="Metro Specialty Coffee Roasters"
      />

      {/* Main Terminal Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Physical POS Terminal Frame */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[36px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden relative">
            
            {/* Terminal Hardware Top Bezel & Camera / NFC Sensor Indicator */}
            <div className="w-full bg-zinc-950 px-6 py-3 border-b border-zinc-850 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="text-[10px] font-mono text-zinc-500 font-semibold tracking-wider">PAX A920 PRO</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className="text-[10px] text-zinc-400 font-medium">{isOnline ? 'Ready' : 'Offline'}</span>
              </div>
            </div>

            {/* Interactive POS Screen */}
            <div className="p-2 sm:p-4">
              <PosTerminalView
                isOnline={isOnline}
                onPaymentComplete={handlePaymentComplete}
              />
            </div>

            {/* Hardware Chip Card Insertion Slot Visual */}
            <div className="w-full bg-zinc-950 py-2.5 px-6 border-t border-zinc-850 flex items-center justify-center">
              <div className="w-40 h-1.5 bg-zinc-800 rounded-full border border-zinc-700/60 shadow-inner" />
            </div>
          </div>
        </div>

        {/* Right Column: Terminal Activity & Recent Transactions Preview */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Quick Terminal Stats */}
          <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-md">
            <div className="text-xs font-semibold text-zinc-400 mb-3 flex items-center justify-between">
              <span>TERMINAL TELEMETRY</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                ACTIVE SHIFT
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-850">
                <div className="text-[10px] text-zinc-500 font-medium">Shift Volume</div>
                <div className="text-lg font-mono font-bold text-zinc-100 mt-0.5">₹920.00</div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-850">
                <div className="text-[10px] text-zinc-500 font-medium">Offline Queue</div>
                <div className="text-lg font-mono font-bold text-amber-400 mt-0.5">
                  {pendingOfflineCount} Txns
                </div>
              </div>
            </div>
          </div>

          {/* Recent Feed */}
          <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-md flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
              <div className="flex items-center gap-1.5">
                <History className="w-4 h-4 text-zinc-400" />
                <span>RECENT TRANSACTIONS</span>
              </div>
              <span className="text-[10px] text-zinc-500">Live Mock Feed</span>
            </div>

            <div className="flex flex-col gap-2">
              {recentTxns.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-850 flex items-center justify-between hover:border-zinc-750 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                      <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">{tx.id}</div>
                      <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{tx.timestamp} • {tx.method.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-zinc-100">
                      ₹{tx.amount.toFixed(2)}
                    </div>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                      tx.isOffline
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {tx.isOffline ? 'Offline' : 'Authorized'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Card */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-850 flex items-center gap-3 text-zinc-400 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="text-[11px] leading-relaxed text-zinc-400">
              <strong className="text-zinc-200">RBI Framework Ready:</strong> ₹500 offline single ticket ceiling & ₹2,000 instrument cap enforced.
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};
