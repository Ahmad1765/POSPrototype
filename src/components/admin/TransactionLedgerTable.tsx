import React, { useState, useMemo } from 'react';
import type { PosTransactionRecord, TransactionState } from '../../types/pos';
import { 
  Search, CreditCard, Radio, QrCode, Zap, 
  CheckCircle2, AlertCircle, XCircle, ArrowUpDown
} from 'lucide-react';

interface TransactionLedgerTableProps {
  transactions: PosTransactionRecord[];
}

export const TransactionLedgerTable: React.FC<TransactionLedgerTableProps> = ({ transactions }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TransactionState>('ALL');

  const filteredTxns = useMemo(() => {
    return transactions.filter((t) => {
      // Status Filter
      if (statusFilter !== 'ALL' && t.state !== statusFilter) {
        return false;
      }
      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.id.toLowerCase().includes(q) ||
          t.clientUuid.toLowerCase().includes(q) ||
          t.paymentMethod.toLowerCase().includes(q) ||
          t.amount.toString().includes(q) ||
          (t.authCode && t.authCode.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [transactions, statusFilter, searchQuery]);

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'CARD_NFC':
        return (
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>NFC Tap</span>
          </div>
        );
      case 'CARD_CHIP':
        return (
          <div className="flex items-center gap-1.5 text-zinc-300">
            <CreditCard className="w-3.5 h-3.5 text-sky-400" />
            <span>EMV Chip</span>
          </div>
        );
      case 'UPI_QR':
        return (
          <div className="flex items-center gap-1.5 text-zinc-300">
            <QrCode className="w-3.5 h-3.5 text-purple-400" />
            <span>UPI QR</span>
          </div>
        );
      case 'UPI_LITE':
        return (
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>UPI Lite</span>
          </div>
        );
      default:
        return <span>{method}</span>;
    }
  };

  const getStatusPill = (state: TransactionState) => {
    switch (state) {
      case 'SETTLED':
      case 'AUTHORIZED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Settled</span>
          </span>
        );
      case 'OFFLINE_PENDING':
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            <span>Offline Pending</span>
          </span>
        );
      case 'DECLINED':
      case 'SYNC_FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3 h-3 text-rose-400" />
            <span>Declined</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
            <span>{state}</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-zinc-900/80 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-xl shadow-lg flex flex-col">
      
      {/* Table Header Controls */}
      <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 select-none">
        
        {/* Title & Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            {(['ALL', 'SETTLED', 'OFFLINE_PENDING', 'DECLINED'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === filter
                    ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {filter === 'ALL' ? 'All' : filter === 'OFFLINE_PENDING' ? 'Offline' : filter === 'SETTLED' ? 'Settled' : 'Declined'}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, amount..."
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Responsive Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/40 text-zinc-400 uppercase font-mono text-[10px] tracking-wider select-none">
              <th className="py-3 px-4">Transaction ID</th>
              <th className="py-3 px-4">Date / Time</th>
              <th className="py-3 px-4">Payment Method</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <span>Amount (INR)</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-sans">
            {filteredTxns.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-zinc-500 font-mono text-xs">
                  No transactions found matching the filter.
                </td>
              </tr>
            ) : (
              filteredTxns.map((tx) => {
                const dateObj = new Date(tx.createdAt);
                const formattedDate = dateObj.toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric'
                });
                const formattedTime = dateObj.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-zinc-850/40 transition-colors group"
                  >
                    {/* Truncated ID */}
                    <td className="py-3.5 px-4 font-mono font-medium text-zinc-200">
                      <div className="flex items-center gap-1.5">
                        <span>{tx.id}</span>
                        {tx.authCode && (
                          <span className="text-[9px] text-zinc-500 hidden sm:inline-block">
                            ({tx.authCode})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date / Time */}
                    <td className="py-3.5 px-4 text-zinc-400">
                      <div className="text-zinc-300 font-medium">{formattedDate}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{formattedTime}</div>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-4">
                      {getMethodBadge(tx.paymentMethod)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {getStatusPill(tx.state)}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-white">
                      ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-3 bg-zinc-950/40 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 font-mono select-none">
        <span>Showing {filteredTxns.length} of {transactions.length} total entries</span>
        <span className="text-emerald-500/80">Dexie IndexedDB Engine</span>
      </div>
    </div>
  );
};
