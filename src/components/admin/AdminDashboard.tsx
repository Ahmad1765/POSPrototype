import React, { useState } from 'react';
import { AdminSidebar, type AdminTab } from './AdminSidebar';
import { KpiSummaryGrid } from './KpiSummaryGrid';
import { TransactionLedgerTable } from './TransactionLedgerTable';
import { useDexieTransactions } from '../../hooks/useDexieTransactions';
import { posDb } from '../../db/db';
import { 
  RefreshCw, Download, ShieldCheck, 
  Terminal as TerminalIcon, CheckCircle2 
} from 'lucide-react';

interface AdminDashboardProps {
  onSwitchToPos?: () => void;
  isOnline?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onSwitchToPos,
  isOnline: _isOnline = true 
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const { transactions, metrics, isLoading: _isLoading, refreshData } = useDexieTransactions();

  const handleManualSyncAll = async () => {
    setIsSyncing(true);
    setTimeout(async () => {
      try {
        const pending = await posDb.transactions
          .filter(t => t.state === 'OFFLINE_PENDING' || t.state === 'QUEUED')
          .toArray();

        const now = new Date().toISOString();
        for (const t of pending) {
          await posDb.transactions.put({
            ...t,
            state: 'SETTLED',
            syncedAt: now,
            settledAt: now
          });
        }
        await refreshData();
        setIsSyncing(false);
        setSyncToast(`Reconciliation complete: ${pending.length} offline transactions settled`);
        setTimeout(() => setSyncToast(null), 4000);
      } catch (err) {
        console.error('Error in admin manual sync:', err);
        setIsSyncing(false);
      }
    }, 1500);
  };

  const handleExportCsv = () => {
    if (transactions.length === 0) {
      alert('No transactions to export.');
      return;
    }
    const headers = 'ID,Client UUID,Amount,Payment Method,State,Is Offline,Created At,Auth Code\n';
    const rows = transactions.map(t => 
      `"${t.id}","${t.clientUuid}",${t.amount},"${t.paymentMethod}","${t.state}",${t.isOffline},"${t.createdAt}","${t.authCode || ''}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NodePOS_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* Sidebar / Mobile Tab Navigation */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onSwitchToPos={onSwitchToPos}
        merchantName="Metro Specialty Coffee Roasters"
        terminalCode="TERM-MUM-001"
      />

      {/* Main Admin Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="w-full bg-zinc-900/80 border-b border-zinc-800/80 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 sticky top-0 z-30 backdrop-blur-xl select-none">
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm md:text-base font-bold text-white tracking-tight flex items-center gap-1.5 sm:gap-2">
              <span className="truncate">Operations & Reconciliation</span>
              <span className="text-[8px] sm:text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full shrink-0">
                LIVE
              </span>
            </h1>
            <p className="text-[10px] sm:text-xs text-zinc-400 truncate hidden xs:block">
              Centralized merchant transaction ledger • Real-time Dexie sync
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Sync All Button */}
            {metrics.pendingSyncCount > 0 && (
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleManualSyncAll}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 text-[10px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Settling...' : `Sync All (${metrics.pendingSyncCount})`}</span>
              </button>
            )}

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-white text-[10px] sm:text-xs font-medium flex items-center gap-1 sm:gap-1.5 transition-all active:scale-95"
            >
              <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </header>

        {/* Sync Toast Feedback */}
        {syncToast && (
          <div className="w-full bg-emerald-500 text-zinc-950 px-3 sm:px-6 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold flex items-center justify-between shadow-md animate-fade-in select-none">
            <div className="flex items-center gap-1.5 sm:gap-2 truncate">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-950 shrink-0" />
              <span className="truncate">{syncToast}</span>
            </div>
            <button onClick={() => setSyncToast(null)} className="text-[10px] underline shrink-0 ml-2">
              Dismiss
            </button>
          </div>
        )}

        {/* Main Dashboard Content */}
        <div className="p-3 sm:p-4 md:p-6 flex flex-col gap-3.5 sm:gap-6 max-w-7xl w-full mx-auto">
          
          {/* Active Tab View */}
          {activeTab === 'OVERVIEW' || activeTab === 'TRANSACTIONS' ? (
            <>
              {/* 1. Live KPI Summary Cards */}
              <KpiSummaryGrid metrics={metrics} />

              {/* 2. Transaction Ledger Table */}
              <div className="flex flex-col gap-2 sm:gap-3">
                <div className="flex items-center justify-between px-0.5">
                  <div className="text-[11px] sm:text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Transaction Ledger
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                    <span>RBI Limits Verified</span>
                  </div>
                </div>

                <TransactionLedgerTable transactions={transactions} />
              </div>
            </>
          ) : activeTab === 'TERMINALS' ? (
            /* Terminals Fleet View */
            <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 backdrop-blur-xl flex flex-col gap-3 sm:gap-4">
              <div className="text-xs sm:text-sm font-bold text-white">Registered POS Terminals</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
                <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col gap-2.5 sm:gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TerminalIcon className="w-4 h-4 text-emerald-400" />
                      <span className="font-mono font-bold text-xs sm:text-sm text-zinc-100">TERM-MUM-001</span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-zinc-400 space-y-1 font-mono">
                    <div>Model: PAX A920 PRO</div>
                    <div>Firmware: 3.4.2-PRO</div>
                    <div>Max Offline Cap: ₹500.00 / txn</div>
                    <div>Cumulative RBI Cap: ₹2,000.00</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Settings View */
            <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 backdrop-blur-xl flex flex-col gap-3 sm:gap-4">
              <div className="text-xs sm:text-sm font-bold text-white">Merchant & RBI Offline Settings</div>
              <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-[11px] sm:text-xs text-zinc-300 space-y-2">
                <div><strong>Merchant Entity:</strong> Metro Retail Ventures Pvt Ltd</div>
                <div><strong>Settlement Account:</strong> HDFC Bank •••• 3741</div>
                <div><strong>RBI Offline Rule:</strong> ₹500 Single Transaction Max Enabled</div>
                <div><strong>Storage Engine:</strong> Client-Side Dexie.js (IndexedDB)</div>
              </div>
            </div>
          )}

        </div>

      </main>
    </div>
  );
};
