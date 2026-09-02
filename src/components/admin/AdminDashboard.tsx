import React, { useState } from 'react';
import { AdminSidebar, type AdminTab } from './AdminSidebar';
import { KpiSummaryGrid } from './KpiSummaryGrid';
import { TransactionLedgerTable } from './TransactionLedgerTable';
import { useDexieTransactions } from '../../hooks/useDexieTransactions';
import { useAdyenConfigStore } from '../../store/adyenConfigStore';
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
  const { registeredTerminals, safConfig, isOfflineModeAllowed, connectionMode } = useAdyenConfigStore();

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

  const escapeCsv = (val?: string | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const handleExportCsv = () => {
    if (transactions.length === 0) {
      alert('No transactions to export.');
      return;
    }
    const headers = 'ID,PSP Ref,Amount,Currency,Payment Method,State,Is Offline,Created At,Auth Code\n';
    const rows = transactions.map(t => 
      `${escapeCsv(t.id)},${escapeCsv(t.pspReference)},${t.amount},${escapeCsv(t.currency)},${escapeCsv(t.paymentMethod)},${escapeCsv(t.state)},${t.isOffline},${escapeCsv(t.createdAt)},${escapeCsv(t.authCode)}`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AdyenPOS_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTerminalStatusBadgeClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ONLINE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'BUSY':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'OFFLINE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'ERROR':
      case 'DISCONNECTED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-750';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* Sidebar Navigation */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onSwitchToPos={onSwitchToPos}
        merchantName="Metro Specialty Coffee Roasters"
        terminalCode="S1F2-000154829102"
      />

      {/* Main Admin Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="w-full bg-zinc-900/80 border-b border-zinc-800/80 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 sticky top-0 z-30 backdrop-blur-xl select-none">
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm md:text-base font-bold text-white tracking-tight flex items-center gap-1.5 sm:gap-2">
              <span className="truncate">Adyen POS Operations & Reconciliation</span>
              <span className="text-[8px] sm:text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full shrink-0">
                NEXO 3.0
              </span>
            </h1>
            <p className="text-[10px] sm:text-xs text-zinc-400 truncate hidden xs:block">
              Adyen Terminal API fleet • Store-and-Forward ledger • Real-time Dexie sync
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {metrics.pendingSyncCount > 0 && (
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleManualSyncAll}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 text-[10px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Settling...' : `Sync All (${metrics.pendingSyncCount})`}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-white text-[10px] sm:text-xs font-medium flex items-center gap-1 sm:gap-1.5 transition-all active:scale-95 cursor-pointer"
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
            <button onClick={() => setSyncToast(null)} className="text-[10px] underline shrink-0 ml-2 cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Main Dashboard Content */}
        <div className="p-3 sm:p-4 md:p-6 flex flex-col gap-3.5 sm:gap-6 max-w-7xl w-full mx-auto">
          
          {/* Overview or Transactions */}
          {activeTab === 'OVERVIEW' || activeTab === 'TRANSACTIONS' ? (
            <>
              <KpiSummaryGrid metrics={metrics} />

              <div className="flex flex-col gap-2 sm:gap-3">
                <div className="flex items-center justify-between px-0.5">
                  <div className="text-[11px] sm:text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Adyen Terminal Ledger & Nexo Reversals
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                    <span>Adyen SaF Policy Active</span>
                  </div>
                </div>

                <TransactionLedgerTable transactions={transactions} />
              </div>
            </>
          ) : activeTab === 'TERMINALS' ? (
            /* Terminals Fleet View */
            <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 backdrop-blur-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Registered Adyen POS Terminal Fleet</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Live terminal profiles, hardware telemetry, & SaF offline limits</p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {registeredTerminals.length} Terminals Registered
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {registeredTerminals.map((term) => (
                  <div key={term.poiId} className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex flex-col justify-between gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TerminalIcon className="w-4 h-4 text-emerald-400" />
                        <span className="font-mono font-bold text-xs sm:text-sm text-zinc-100">{term.name}</span>
                      </div>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${getTerminalStatusBadgeClass(term.status)}`}>
                        {term.status}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400">{term.subtitle}</p>

                    <div className="text-[10px] text-zinc-400 space-y-1 font-mono pt-2 border-t border-zinc-800/80">
                      <div>• POI ID: {term.poiId}</div>
                      <div>• Connection: {term.connectionType} ({term.ipAddress || 'Bluetooth / SoftPOS'})</div>
                      <div>• Firmware: {term.firmwareVersion}</div>
                      <div>• Battery: {term.batteryPercent}%</div>
                      <div>• Features: {term.hasPrinter ? 'Thermal Printer' : 'Paperless'} | {term.hasCameraScanner ? '2D Scanner' : 'No Scanner'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Settings View */
            <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 backdrop-blur-xl flex flex-col gap-4">
              <div className="text-sm font-bold text-white">Merchant & Adyen Customer Area Configuration</div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-300 space-y-2.5">
                  <div className="font-bold text-white text-xs uppercase tracking-wider text-emerald-400">Merchant Credentials</div>
                  <div><strong>Merchant Entity:</strong> Metro Retail Ventures Pvt Ltd</div>
                  <div><strong>Adyen Merchant Account:</strong> MetroCoffeePOS_Store_01</div>
                  <div><strong>Company Account:</strong> MetroGroup</div>
                  <div><strong>Connection Mode:</strong> {connectionMode}</div>
                  <div><strong>Proxy Route:</strong> /api/adyen/terminal (Secure Backend Key Vault)</div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-300 space-y-2.5">
                  <div className="font-bold text-white text-xs uppercase tracking-wider text-emerald-400">Store-and-Forward (SaF) Policy</div>
                  <div><strong>SaF Policy Status:</strong> {isOfflineModeAllowed ? 'Synchronized & Enforced' : 'Not Synchronized'}</div>
                  <div><strong>Version:</strong> {safConfig?.configVersion || 'v2026.09-SaF-rev3'}</div>
                  <div><strong>Single Limit (INR):</strong> ₹{safConfig?.maxSingleTransactionAmount.INR?.toFixed(2) || '500.00'}</div>
                  <div><strong>Cumulative Cap (INR):</strong> ₹{safConfig?.maxCumulativeOfflineAmount.INR?.toFixed(2) || '2,000.00'}</div>
                  <div><strong>Max Batch Capacity:</strong> {safConfig?.maxOfflineTransactionCount || 100} txns</div>
                </div>
              </div>
            </div>
          )}

        </div>

      </main>
    </div>
  );
};
