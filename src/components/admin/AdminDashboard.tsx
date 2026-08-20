import React, { useState } from 'react';
import { AdminSidebar, type AdminTab } from './AdminSidebar';
import { KpiSummaryGrid } from './KpiSummaryGrid';
import { TransactionLedgerTable } from './TransactionLedgerTable';
import { useDexieTransactions } from '../../hooks/useDexieTransactions';
import { posDb } from '../../db/db';
import { 
  RefreshCw, Download, ShieldCheck, 
  Terminal as TerminalIcon, Smartphone, CheckCircle2 
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
      
      {/* Sidebar Navigation */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onSwitchToPos={onSwitchToPos}
        merchantName="Metro Specialty Coffee Roasters"
        terminalCode="TERM-MUM-001"
      />

      {/* Main Admin Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Operational Bar */}
        <header className="w-full bg-zinc-900/80 border-b border-zinc-800/80 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-30 backdrop-blur-xl select-none">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Operations & Reconciliation Portal</span>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                LIVE
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              Centralized merchant transaction ledger • Real-time Dexie IndexedDB sync
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Sync All Button */}
            {metrics.pendingSyncCount > 0 && (
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleManualSyncAll}
                className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Settling...' : `Sync All (${metrics.pendingSyncCount})`}</span>
              </button>
            )}

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Switch to POS on mobile/tablet */}
            {onSwitchToPos && (
              <button
                type="button"
                onClick={onSwitchToPos}
                className="lg:hidden px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>POS View</span>
              </button>
            )}
          </div>
        </header>

        {/* Sync Toast Feedback */}
        {syncToast && (
          <div className="w-full bg-emerald-500 text-zinc-950 px-6 py-2 text-xs font-semibold flex items-center justify-between shadow-md animate-fade-in select-none">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-zinc-950" />
              <span>{syncToast}</span>
            </div>
            <button onClick={() => setSyncToast(null)} className="text-[10px] underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Main Dashboard Content */}
        <div className="p-6 flex flex-col gap-6 max-w-7xl w-full mx-auto">
          
          {/* Active Tab View */}
          {activeTab === 'OVERVIEW' || activeTab === 'TRANSACTIONS' ? (
            <>
              {/* 1. Live KPI Summary Cards */}
              <KpiSummaryGrid metrics={metrics} />

              {/* 2. Transaction Ledger Table */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Transaction Ledger
                  </div>
                  <div className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>RBI ₹500/txn limits verified</span>
                  </div>
                </div>

                <TransactionLedgerTable transactions={transactions} />
              </div>
            </>
          ) : activeTab === 'TERMINALS' ? (
            /* Terminals Fleet View */
            <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl flex flex-col gap-4">
              <div className="text-sm font-bold text-white">Registered POS Terminals</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TerminalIcon className="w-4 h-4 text-emerald-400" />
                      <span className="font-mono font-bold text-zinc-100">TERM-MUM-001</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 space-y-1 font-mono">
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
            <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl flex flex-col gap-4">
              <div className="text-sm font-bold text-white">Merchant & RBI Offline Settings</div>
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-300 space-y-2">
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
