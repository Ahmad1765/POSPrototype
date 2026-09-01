import React, { useState, useEffect, useCallback } from 'react';
import { NetworkStatusBadge } from './pos/NetworkStatusBadge';
import { PosTerminalView, CURRENCY_SYMBOLS } from './pos/PosTerminalView';
import { OfflinePaymentTracker } from './pos/OfflinePaymentTracker';
import { AdyenTerminalFrame } from './pos/adyen/AdyenTerminalFrame';
import { AdyenNexoInspector } from './pos/adyen/AdyenNexoInspector';
import { AdyenDiagnosticsModal } from './pos/adyen/AdyenDiagnosticsModal';
import { AdyenSettingsModal } from './pos/AdyenSettingsModal';
import { posDb, initializePosDb } from '../db/db';
import { useSyncEngine } from '../hooks/useSyncEngine';
import { useAdyenConfigStore } from '../store/adyenConfigStore';
import type { PosTransactionRecord } from '../types/pos';
import { 
  ShieldCheck, History, Clock, ArrowDownLeft, 
  Database, Trash2, CheckCircle2, RefreshCw, Layers,
  Activity, Settings, Lock
} from 'lucide-react';

export const MerchantPosContainer: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<PosTransactionRecord[]>([]);
  const [isDbReady, setIsDbReady] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<{ message: string; count: number } | null>(null);

  // Adyen Modals & Tools
  const [isNexoInspectorOpen, setIsNexoInspectorOpen] = useState<boolean>(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [nexoLogCount, setNexoLogCount] = useState<number>(0);

  const {
    activeTerminalModel,
    registeredTerminals,
    connectionMode,
    isOfflineModeAllowed,
    activeCurrency
  } = useAdyenConfigStore();

  const currentTerminal = registeredTerminals.find((t) => t.model === activeTerminalModel) || registeredTerminals[0];

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

  const handleTransactionPersisted = async () => {
    await loadTransactionsFromDb();
  };

  const handleClearDb = async () => {
    if (confirm('Clear all local transactions from Dexie IndexedDB?')) {
      await posDb.transactions.clear();
      await loadTransactionsFromDb();
    }
  };

  // Metrics
  const pendingOfflineCount = transactions.filter(t => t.state === 'OFFLINE_PENDING' || t.state === 'STORED_OFFLINE').length;
  const settledCount = transactions.filter(t => t.state === 'SETTLED').length;
  const shiftTotalsByCurrency = transactions
    .filter(t => t.state === 'SETTLED' || t.state === 'OFFLINE_PENDING' || t.state === 'STORED_OFFLINE')
    .reduce<Record<string, number>>((acc, t) => {
      const curr = t.currency || activeCurrency || 'INR';
      acc[curr] = (acc[curr] || 0) + t.amount;
      return acc;
    }, {});
  const shiftTotalEntries = Object.entries(shiftTotalsByCurrency);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* Top Header Bar with Sync Engine & Terminal telemetry */}
      <NetworkStatusBadge
        isOnline={isOnline}
        onToggleOnline={() => setIsOnline(prev => !prev)}
        isSyncing={isSyncing}
        onManualSync={syncOfflineBatch}
        pendingSyncCount={pendingOfflineCount}
        terminalCode={currentTerminal.poiId}
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        
        {/* Left Column: High-Fidelity Adyen Terminal Hardware Frame */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center w-full">
          <AdyenTerminalFrame
            isOnline={isOnline}
            onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onToggleNexoInspector={() => setIsNexoInspectorOpen(prev => !prev)}
            isNexoInspectorOpen={isNexoInspectorOpen}
            nexoLogCount={nexoLogCount}
          >
            {isDbReady && (
              <PosTerminalView
                isOnline={isOnline}
                terminalId={currentTerminal.poiId}
                merchantId="MetroCoffeePOS_Store_01"
                onTransactionPersisted={handleTransactionPersisted}
              />
            )}
          </AdyenTerminalFrame>
        </div>

        {/* Right Column: Terminal Activity & Live Telemetry Feed */}
        <div className="lg:col-span-5 flex flex-col gap-3.5 sm:gap-4 w-full">
          
          {/* Adyen Architecture Status Card */}
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md space-y-3">
            <div className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-zinc-200">ADYEN CLOUD POS ARCHITECTURE</span>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                NEXO 3.0 / ISO 20022
              </span>
            </div>

            {/* Metric Capsules */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-850">
                <div className="text-[9px] text-zinc-500 font-mono">CONNECTION</div>
                <div className="text-xs font-mono font-bold text-zinc-100 mt-0.5 truncate">
                  {connectionMode}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-850">
                <div className="text-[9px] text-zinc-500 font-mono">SAF OFFLINE</div>
                <div className={`text-xs font-mono font-bold mt-0.5 ${isOfflineModeAllowed ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isOfflineModeAllowed ? 'SYNCED' : 'NOT SYNCED'}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-850">
                <div className="text-[9px] text-zinc-500 font-mono">PROXY AUTH</div>
                <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>SECURE</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsNexoInspectorOpen(true)}
                className="py-2 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-colors border border-zinc-700/60 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nexo Logs</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDiagnosticsOpen(true)}
                className="py-2 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-colors border border-zinc-700/60 cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Diagnostics</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="py-2 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-colors border border-zinc-700/60 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400" />
                <span>SaF Settings</span>
              </button>
            </div>
          </div>

          {/* Quick Shift Summary */}
          <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md">
            <div className="text-xs font-semibold text-zinc-400 mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>INDEXEDDB TELEMETRY</span>
              </div>
              <div className="flex items-center gap-1">
                {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-sky-400 mr-1" />}
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  Dexie_POS_DB
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-850">
                <div className="text-[9px] text-zinc-500 font-medium">Shift Total</div>
                <div className="text-xs font-mono font-bold text-zinc-100 mt-0.5 truncate" title={shiftTotalEntries.map(([c, val]) => `${CURRENCY_SYMBOLS[c] || c}${val.toFixed(2)}`).join(' / ')}>
                  {shiftTotalEntries.length === 0
                    ? `${CURRENCY_SYMBOLS[activeCurrency] || activeCurrency || '₹'}0.00`
                    : shiftTotalEntries.map(([c, val]) => `${CURRENCY_SYMBOLS[c] || c}${val.toFixed(2)}`).join(' • ')}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-850">
                <div className="text-[9px] text-zinc-500 font-medium">Settled</div>
                <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                  {settledCount}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-850">
                <div className="text-[9px] text-zinc-500 font-medium">Pending</div>
                <div className={`text-sm font-mono font-bold mt-0.5 ${
                  pendingOfflineCount > 0 ? 'text-amber-400 animate-pulse' : 'text-zinc-400'
                }`}>
                  {pendingOfflineCount}
                </div>
              </div>
            </div>

            {/* Sync Action Trigger */}
            {pendingOfflineCount > 0 && isOnline && !isSyncing && (
              <button
                type="button"
                onClick={syncOfflineBatch}
                className="w-full mt-2.5 py-2 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync {pendingOfflineCount} Offline Transaction(s) to Adyen</span>
              </button>
            )}
          </div>

          {/* Offline Payment Tracker */}
          <OfflinePaymentTracker
            transactions={transactions}
            isSyncing={isSyncing}
            isOnline={isOnline}
            onManualSync={syncOfflineBatch}
          />

          {/* Dexie Live Stored Transactions Feed */}
          <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
              <div className="flex items-center gap-1.5">
                <History className="w-4 h-4 text-zinc-400" />
                <span>LOCAL TRANSACTIONS</span>
              </div>
              <button
                onClick={handleClearDb}
                className="text-[10px] text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
                title="Clear local Dexie store"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear DB</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
              {transactions.length === 0 ? (
                <div className="text-center py-6 text-zinc-600 text-xs font-mono">
                  No local transactions recorded yet.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-850 flex items-center justify-between hover:border-zinc-750 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0">
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-200 truncate">
                          {tx.pspReference ? `PSP: ${tx.pspReference}` : tx.id}
                        </div>
                        <div className="text-[9px] text-zinc-500 flex items-center gap-1 truncate font-mono">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {tx.paymentMethod.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <div className="text-xs font-mono font-bold text-zinc-100">
                        {CURRENCY_SYMBOLS[tx.currency] || tx.currency || '₹'}{tx.amount.toFixed(2)}
                      </div>
                      <span className={`text-[8px] font-semibold px-1 py-0.2 rounded font-mono ${
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

        </div>

      </main>

      {/* Adyen Nexo Inspector Drawer */}
      <AdyenNexoInspector
        isOpen={isNexoInspectorOpen}
        onClose={() => setIsNexoInspectorOpen(false)}
        onLogCountChange={(count) => setNexoLogCount(count)}
      />

      {/* Adyen Diagnostics Modal */}
      <AdyenDiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />

      {/* Adyen Settings & SaF Modal */}
      <AdyenSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

    </div>
  );
};
