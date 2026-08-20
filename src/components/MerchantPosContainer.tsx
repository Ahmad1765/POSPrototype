import React, { useState, useEffect, useCallback } from 'react';
import { NetworkStatusBadge } from './pos/NetworkStatusBadge';
import { PosTerminalView } from './pos/PosTerminalView';
import { posDb, initializePosDb } from '../db/db';
import { useSyncEngine } from '../hooks/useSyncEngine';
import type { PosTransactionRecord } from '../types/pos';
import { 
  ShieldCheck, History, Clock, ArrowDownLeft, 
  Database, Trash2, CheckCircle2, RefreshCw 
} from 'lucide-react';

export const MerchantPosContainer: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<PosTransactionRecord[]>([]);
  const [isDbReady, setIsDbReady] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<{ message: string; count: number } | null>(null);

  // Load transactions from Dexie IndexedDB
  const loadTransactionsFromDb = useCallback(async () => {
    try {
      const records = await posDb.transactions
        .orderBy('createdAt')
        .reverse()
        .limit(20)
        .toArray();
      setTransactions(records);
    } catch (err) {
      console.error('Failed to load transactions from Dexie:', err);
    }
  }, []);

  // Hook up mock sync engine
  const handleSyncComplete = useCallback(async (synced: PosTransactionRecord[]) => {
    await loadTransactionsFromDb();
    if (synced.length > 0) {
      setSyncToast({
        message: `Batch Synced: ${synced.length} offline transaction(s) transitioned to SETTLED`,
        count: synced.length
      });
      setTimeout(() => setSyncToast(null), 4000);
    }
  }, [loadTransactionsFromDb]);

  const { isSyncing, syncOfflineBatch } = useSyncEngine(isOnline, handleSyncComplete);

  // Initialize DB on component mount
  useEffect(() => {
    async function setup() {
      await initializePosDb();
      setIsDbReady(true);
      await loadTransactionsFromDb();
    }
    setup();
  }, [loadTransactionsFromDb]);

  const handleTransactionPersisted = async (_txn: PosTransactionRecord) => {
    await loadTransactionsFromDb();
  };

  const handleClearDb = async () => {
    if (confirm('Clear all local transactions from Dexie IndexedDB?')) {
      await posDb.transactions.clear();
      await loadTransactionsFromDb();
    }
  };

  // Metrics
  const pendingOfflineCount = transactions.filter(t => t.state === 'OFFLINE_PENDING').length;
  const settledCount = transactions.filter(t => t.state === 'SETTLED').length;
  const totalShiftVolume = transactions
    .filter(t => t.state === 'SETTLED' || t.state === 'OFFLINE_PENDING')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* Top Header Bar with Sync Engine integration */}
      <NetworkStatusBadge
        isOnline={isOnline}
        onToggleOnline={() => setIsOnline(prev => !prev)}
        isSyncing={isSyncing}
        onManualSync={syncOfflineBatch}
        pendingSyncCount={pendingOfflineCount}
        terminalCode="TERM-MUM-001"
        merchantName="Metro Specialty Coffee Roasters"
      />

      {/* Sync Success Toast */}
      {syncToast && (
        <div className="w-full bg-emerald-500 text-zinc-950 px-3 sm:px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg transition-all animate-fade-in select-none">
          <CheckCircle2 className="w-4 h-4 text-zinc-950 shrink-0" />
          <span className="truncate">{syncToast.message}</span>
        </div>
      )}

      {/* Main Terminal Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-2.5 sm:p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        
        {/* Left Column: Physical POS Terminal Frame */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center w-full">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-[36px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden relative">
            
            {/* Terminal Hardware Top Bezel & Camera / NFC Sensor Indicator */}
            <div className="w-full bg-zinc-950 px-4 sm:px-6 py-2.5 sm:py-3 border-b border-zinc-850 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-zinc-700" />
                <span className="text-[9px] sm:text-[10px] font-mono text-zinc-500 font-semibold tracking-wider">PAX A920 PRO</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                  isSyncing ? 'bg-sky-400 animate-ping' : isOnline ? 'bg-emerald-400' : 'bg-amber-400'
                }`} />
                <span className="text-[9px] sm:text-[10px] text-zinc-400 font-medium">
                  {isSyncing ? 'Syncing...' : isOnline ? 'Ready' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Interactive POS Screen */}
            <div className="p-1 sm:p-2 md:p-4">
              {isDbReady && (
                <PosTerminalView
                  isOnline={isOnline}
                  terminalId="TERM-MUM-001"
                  merchantId="MERCHANT-MUM-01"
                  onTransactionPersisted={handleTransactionPersisted}
                />
              )}
            </div>

            {/* Hardware Chip Card Insertion Slot Visual */}
            <div className="w-full bg-zinc-950 py-2 sm:py-2.5 px-4 sm:px-6 border-t border-zinc-850 flex items-center justify-center">
              <div className="w-32 sm:w-40 h-1 sm:h-1.5 bg-zinc-800 rounded-full border border-zinc-700/60 shadow-inner" />
            </div>
          </div>
        </div>

        {/* Right Column: Terminal Activity & IndexedDB Live Feed */}
        <div className="lg:col-span-5 flex flex-col gap-3.5 sm:gap-4 w-full">
          
          {/* Quick Terminal Stats & Telemetry */}
          <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md">
            <div className="text-xs font-semibold text-zinc-400 mb-2.5 sm:mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>INDEXEDDB TELEMETRY</span>
              </div>
              <div className="flex items-center gap-1">
                {isSyncing && (
                  <RefreshCw className="w-3 h-3 animate-spin text-sky-400 mr-1" />
                )}
                <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  NodePOS_Prototype
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-950/60 border border-zinc-850">
                <div className="text-[9px] sm:text-[10px] text-zinc-500 font-medium">Shift Total</div>
                <div className="text-sm sm:text-base md:text-lg font-mono font-bold text-zinc-100 mt-0.5">
                  ₹{totalShiftVolume.toFixed(2)}
                </div>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-950/60 border border-zinc-850">
                <div className="text-[9px] sm:text-[10px] text-zinc-500 font-medium">Settled</div>
                <div className="text-sm sm:text-base md:text-lg font-mono font-bold text-emerald-400 mt-0.5">
                  {settledCount}
                </div>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-950/60 border border-zinc-850">
                <div className="text-[9px] sm:text-[10px] text-zinc-500 font-medium">Pending</div>
                <div className={`text-sm sm:text-base md:text-lg font-mono font-bold mt-0.5 ${
                  pendingOfflineCount > 0 ? 'text-amber-400 animate-pulse' : 'text-zinc-400'
                }`}>
                  {pendingOfflineCount}
                </div>
              </div>
            </div>

            {/* Sync Action Trigger if transactions pending */}
            {pendingOfflineCount > 0 && isOnline && !isSyncing && (
              <button
                type="button"
                onClick={syncOfflineBatch}
                className="w-full mt-2.5 sm:mt-3 py-2 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync {pendingOfflineCount} Offline Transaction(s) Now</span>
              </button>
            )}
          </div>

          {/* Dexie Live Stored Transactions Feed */}
          <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md flex flex-col gap-2.5 sm:gap-3">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
              <div className="flex items-center gap-1.5">
                <History className="w-4 h-4 text-zinc-400" />
                <span>LOCAL TRANSACTIONS</span>
              </div>
              <button
                onClick={handleClearDb}
                className="text-[10px] text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                title="Clear local Dexie store"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear DB</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-[280px] sm:max-h-[340px] overflow-y-auto pr-1">
              {transactions.length === 0 ? (
                <div className="text-center py-6 text-zinc-600 text-xs font-mono">
                  No local transactions recorded yet.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-2.5 sm:p-3 rounded-xl bg-zinc-950/60 border border-zinc-850 flex items-center justify-between hover:border-zinc-750 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0">
                        <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-200 truncate">{tx.id}</div>
                        <div className="text-[9px] sm:text-[10px] text-zinc-500 flex items-center gap-1 truncate">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {tx.paymentMethod.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <div className="text-xs font-mono font-bold text-zinc-100">
                        ₹{tx.amount.toFixed(2)}
                      </div>
                      <span className={`text-[8px] sm:text-[9px] font-semibold px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded ${
                        tx.state === 'DECLINED'
                          ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                          : tx.state === 'OFFLINE_PENDING'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          : tx.state === 'SETTLED'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          : 'bg-sky-500/10 text-sky-300 border border-sky-500/30'
                      }`}>
                        {tx.state.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Compliance & Sync Info Card */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-850 flex items-center gap-2.5 sm:gap-3 text-zinc-400 text-xs">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />
            <div className="text-[10px] sm:text-[11px] leading-relaxed text-zinc-400">
              <strong className="text-zinc-200">Autonomous Sync:</strong> Reconnecting to Online automatically syncs un-synced Dexie items to <span className="text-emerald-400 font-mono font-semibold">SETTLED</span>.
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};
