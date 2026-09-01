import React, { useState, useMemo } from 'react';
import type { PosTransactionRecord, TransactionState } from '../../types/pos';
import { 
  Search, CreditCard, Radio, Wallet, Zap, QrCode,
  CheckCircle2, AlertCircle, XCircle, RotateCcw
} from 'lucide-react';
import { posDb } from '../../db/db';
import { adyenTerminalService } from '../../utils/adyenTerminalService';
import type { SaleToPOIRequest } from '../../types/adyenNexoTypes';

interface TransactionLedgerTableProps {
  transactions: PosTransactionRecord[];
}

export const TransactionLedgerTable: React.FC<TransactionLedgerTableProps> = ({ transactions }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TransactionState>('ALL');
  const [reversalStatus, setReversalStatus] = useState<{ id: string; message: string } | null>(null);

  const filteredTxns = useMemo(() => {
    return transactions.filter((t) => {
      if (statusFilter !== 'ALL' && t.state !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.id.toLowerCase().includes(q) ||
          t.clientUuid.toLowerCase().includes(q) ||
          t.paymentMethod.toLowerCase().includes(q) ||
          t.amount.toString().includes(q) ||
          (t.pspReference && t.pspReference.toLowerCase().includes(q)) ||
          (t.authCode && t.authCode.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [transactions, statusFilter, searchQuery]);

  const handleTriggerReversal = async (txn: PosTransactionRecord) => {
    try {
      const serviceId = adyenTerminalService.generateServiceId();
      const reversalRequest: SaleToPOIRequest = {
        SaleToPOIRequest: {
          MessageHeader: adyenTerminalService.createMessageHeader('Reversal', serviceId, 'NodePOS-Register-01', txn.terminalId),
          ReversalRequest: {
            OriginalPOITransaction: {
              SaleID: 'NodePOS-Register-01',
              POIID: txn.terminalId,
              POITransactionID: {
                TransactionID: txn.pspReference || txn.id,
                TimeStamp: txn.createdAt
              }
            },
            ReversalReason: 'MerchantCancel',
            ReversedAmount: txn.amount
          }
        }
      };

      await adyenTerminalService.sendSaleToPOIRequest(reversalRequest);

      // Update state in Dexie
      await posDb.transactions.put({
        ...txn,
        state: 'VOIDED',
        declineReason: 'Reversed via Adyen Nexo 3.0 ReversalRequest'
      });

      setReversalStatus({ id: txn.id, message: `Reversed ${txn.pspReference || txn.id}` });
      setTimeout(() => setReversalStatus(null), 4000);
    } catch (err) {
      console.error('Reversal error:', err);
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'ADYEN_NFC':
      case 'CARD_NFC':
        return (
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Adyen Tap</span>
          </div>
        );
      case 'ADYEN_CARD':
      case 'CARD_CHIP':
        return (
          <div className="flex items-center gap-1.5 text-zinc-300">
            <CreditCard className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Adyen Chip</span>
          </div>
        );
      case 'ADYEN_QR':
      case 'ALIPAY':
      case 'WECHAT_PAY':
        return (
          <div className="flex items-center gap-1.5 text-zinc-300">
            <QrCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Adyen QR</span>
          </div>
        );
      case 'CRYPTO_WALLET':
        return (
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Wallet className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span>Crypto Web3</span>
          </div>
        );
      case 'UPI_LITE':
        return (
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Settled</span>
          </span>
        );
      case 'OFFLINE_PENDING':
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Offline SaF</span>
          </span>
        );
      case 'VOIDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
            <RotateCcw className="w-3 h-3 text-zinc-400 shrink-0" />
            <span>Reversed</span>
          </span>
        );
      case 'DECLINED':
      case 'SYNC_FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
            <span>Declined</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
            <span>{state}</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-zinc-900/80 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-xl shadow-lg flex flex-col">
      
      {/* Reversal Toast Notification */}
      {reversalStatus && (
        <div className="p-2.5 bg-zinc-800 border-b border-zinc-700 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Nexo Reversal Dispatched: {reversalStatus.message}</span>
        </div>
      )}

      {/* Table Header Controls */}
      <div className="p-3 sm:p-4 border-b border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 select-none">
        
        {/* Title & Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <div className="flex bg-zinc-950 p-0.5 sm:p-1 rounded-xl border border-zinc-800 text-[11px] sm:text-xs">
            {(['ALL', 'SETTLED', 'OFFLINE_PENDING', 'VOIDED', 'DECLINED'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
                  statusFilter === filter
                    ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {filter === 'ALL' ? 'All' : filter === 'OFFLINE_PENDING' ? 'Offline' : filter === 'SETTLED' ? 'Settled' : filter === 'VOIDED' ? 'Reversed' : 'Declined'}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PSP Ref, ID, amount..."
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-8 sm:pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/40 text-zinc-400 uppercase font-mono text-[10px] tracking-wider select-none">
              <th className="py-3 px-4">Transaction / PSP Ref</th>
              <th className="py-3 px-4">Date / Time</th>
              <th className="py-3 px-4">Payment Method</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-center">Nexo Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-sans">
            {filteredTxns.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-zinc-500 text-xs font-mono">
                  No transactions match your search filter.
                </td>
              </tr>
            ) : (
              filteredTxns.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-850/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-zinc-200">{tx.pspReference || tx.id}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">Terminal: {tx.terminalId}</div>
                  </td>
                  <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                    <div>{new Date(tx.createdAt).toLocaleDateString()}</div>
                    <div className="text-[10px] text-zinc-500">
                      {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {getMethodBadge(tx.paymentMethod)}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusPill(tx.state)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-zinc-100">
                    {tx.currency === 'EUR' ? '€' : tx.currency === 'USD' ? '$' : tx.currency === 'GBP' ? '£' : '₹'}{tx.amount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {tx.state === 'SETTLED' ? (
                      <button
                        type="button"
                        onClick={() => handleTriggerReversal(tx)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-500/40 border border-zinc-700/60 text-zinc-300 text-[10px] font-mono flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                        title="Dispatch Nexo 3.0 Reversal"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reversal</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="sm:hidden divide-y divide-zinc-800/60 p-2 space-y-2">
        {filteredTxns.map((tx) => (
          <div key={tx.id} className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-850 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-zinc-200">{tx.pspReference || tx.id}</span>
              {getStatusPill(tx.state)}
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">{getMethodBadge(tx.paymentMethod)}</span>
              <span className="font-bold text-white">
                {tx.currency === 'EUR' ? '€' : tx.currency === 'USD' ? '$' : tx.currency === 'GBP' ? '£' : '₹'}{tx.amount.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
