import React, { useState, useMemo } from 'react';
import {
  Clock, CheckCircle2, AlertTriangle, Radio, CreditCard, Zap, Wallet,
  ArrowRight, RefreshCw, XCircle, Loader2, ChevronDown, ChevronUp,
  Activity, Timer, ArrowUpRight, Layers
} from 'lucide-react';
import type { PosTransactionRecord, TransactionState, PaymentMethodType } from '../../types/pos';

interface OfflinePaymentTrackerProps {
  transactions: PosTransactionRecord[];
  isSyncing: boolean;
  isOnline: boolean;
  onManualSync?: () => void;
}

// Offline pipeline stages in order
const PIPELINE_STAGES: { state: TransactionState; label: string; shortLabel: string }[] = [
  { state: 'CREATED', label: 'Created', shortLabel: 'CRT' },
  { state: 'OFFLINE_PENDING', label: 'Offline Pending', shortLabel: 'PEND' },
  { state: 'QUEUED', label: 'Queued for Sync', shortLabel: 'QUE' },
  { state: 'SYNCING', label: 'Syncing', shortLabel: 'SYN' },
  { state: 'SETTLED', label: 'Settled', shortLabel: 'SET' },
];

const STATE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  CREATED: { bg: 'bg-zinc-500/10', text: 'text-zinc-300', border: 'border-zinc-500/30', dot: 'bg-zinc-400' },
  OFFLINE_PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  QUEUED: { bg: 'bg-sky-500/10', text: 'text-sky-300', border: 'border-sky-500/30', dot: 'bg-sky-400' },
  SYNCING: { bg: 'bg-indigo-500/10', text: 'text-indigo-300', border: 'border-indigo-500/30', dot: 'bg-indigo-400' },
  PROCESSING: { bg: 'bg-blue-500/10', text: 'text-blue-300', border: 'border-blue-500/30', dot: 'bg-blue-400' },
  AUTHORIZED: { bg: 'bg-teal-500/10', text: 'text-teal-300', border: 'border-teal-500/30', dot: 'bg-teal-400' },
  SETTLED: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  DECLINED: { bg: 'bg-rose-500/10', text: 'text-rose-300', border: 'border-rose-500/30', dot: 'bg-rose-400' },
  SYNC_FAILED: { bg: 'bg-red-500/10', text: 'text-red-300', border: 'border-red-500/30', dot: 'bg-red-400' },
  RETRY: { bg: 'bg-orange-500/10', text: 'text-orange-300', border: 'border-orange-500/30', dot: 'bg-orange-400' },
  VOIDED: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-600/30', dot: 'bg-zinc-500' },
  REFUNDED: { bg: 'bg-purple-500/10', text: 'text-purple-300', border: 'border-purple-500/30', dot: 'bg-purple-400' },
};

const METHOD_ICON: Record<PaymentMethodType, React.ReactNode> = {
  CARD_NFC: <Radio className="w-3 h-3" />,
  CARD_CHIP: <CreditCard className="w-3 h-3" />,
  UPI_LITE: <Zap className="w-3 h-3" />,
  CRYPTO_WALLET: <Wallet className="w-3 h-3" />,
};

const METHOD_LABEL: Record<PaymentMethodType, string> = {
  CARD_NFC: 'NFC Tap',
  CARD_CHIP: 'Chip',
  UPI_LITE: 'UPI Lite',
  CRYPTO_WALLET: 'Crypto',
};

function getStageIndex(state: TransactionState): number {
  const idx = PIPELINE_STAGES.findIndex(s => s.state === state);
  return idx >= 0 ? idx : -1;
}

function getAge(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ${Math.floor((ms % 3_600_000) / 60_000)}m`;
  return `${Math.floor(ms / 86_400_000)}d`;
}

function isTerminalState(state: TransactionState): boolean {
  return ['DECLINED', 'SYNC_FAILED', 'VOIDED', 'REFUNDED'].includes(state);
}

function isActiveState(state: TransactionState): boolean {
  return ['OFFLINE_PENDING', 'QUEUED', 'SYNCING', 'PROCESSING', 'RETRY', 'CREATED'].includes(state);
}

export const OfflinePaymentTracker: React.FC<OfflinePaymentTrackerProps> = ({
  transactions,
  isSyncing,
  isOnline,
  onManualSync
}) => {
  const [expandedTxnId, setExpandedTxnId] = useState<string | null>(null);

  // Filter to only show offline or in-pipeline transactions
  const offlineTxns = useMemo(() => {
    return transactions.filter(t =>
      t.isOffline || isActiveState(t.state) || t.state === 'SETTLED'
    ).slice(0, 10);
  }, [transactions]);

  const pendingCount = useMemo(() =>
    offlineTxns.filter(t => isActiveState(t.state)).length,
    [offlineTxns]
  );

  const totalPendingAmount = useMemo(() =>
    offlineTxns
      .filter(t => isActiveState(t.state))
      .reduce((sum, t) => sum + t.amount, 0),
    [offlineTxns]
  );

  const oldestPending = useMemo(() => {
    const pending = offlineTxns.filter(t => isActiveState(t.state));
    if (pending.length === 0) return null;
    return pending.reduce((oldest, t) =>
      new Date(t.createdAt) < new Date(oldest.createdAt) ? t : oldest
    );
  }, [offlineTxns]);

  const settledCount = useMemo(() =>
    offlineTxns.filter(t => t.state === 'SETTLED' && t.isOffline).length,
    [offlineTxns]
  );

  if (offlineTxns.length === 0) {
    return (
      <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 mb-3">
          <Activity className="w-3.5 h-3.5 text-zinc-500" />
          <span>OFFLINE PAYMENT TRACKER</span>
        </div>
        <div className="text-center py-4 text-zinc-600 text-xs font-mono">
          No offline transactions to track.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md flex flex-col gap-3">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
          <Activity className="w-3.5 h-3.5 text-violet-400" />
          <span>OFFLINE PAYMENT TRACKER</span>
        </div>
        {isSyncing && (
          <div className="flex items-center gap-1 text-[10px] text-sky-400 font-mono">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Syncing...</span>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-850">
          <div className="text-[9px] text-zinc-500 font-medium">In Pipeline</div>
          <div className={`text-sm font-mono font-bold mt-0.5 ${pendingCount > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
            {pendingCount}
          </div>
        </div>
        <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-850">
          <div className="text-[9px] text-zinc-500 font-medium">Pending ₹</div>
          <div className={`text-sm font-mono font-bold mt-0.5 ${totalPendingAmount > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
            ₹{totalPendingAmount.toFixed(0)}
          </div>
        </div>
        <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-850">
          <div className="text-[9px] text-zinc-500 font-medium">Synced</div>
          <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
            {settledCount}
          </div>
        </div>
      </div>

      {/* Oldest Pending Age */}
      {oldestPending && (
        <div className="flex items-center gap-1.5 text-[10px] text-amber-300/80 bg-amber-950/30 border border-amber-500/20 px-2.5 py-1.5 rounded-lg">
          <Timer className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Oldest pending: <strong className="text-amber-200">{getAge(oldestPending.createdAt)}</strong> ago — {oldestPending.id}</span>
        </div>
      )}

      {/* Sync Trigger */}
      {pendingCount > 0 && isOnline && !isSyncing && onManualSync && (
        <button
          type="button"
          onClick={onManualSync}
          className="w-full py-2 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync {pendingCount} Pending Transaction{pendingCount > 1 ? 's' : ''}</span>
        </button>
      )}

      {/* Pipeline Flow Diagram (global) */}
      <div className="w-full flex items-center justify-between px-1 py-1.5">
        {PIPELINE_STAGES.map((stage, idx) => {
          const hasTxnAtStage = offlineTxns.some(t => t.state === stage.state);
          const countAtStage = offlineTxns.filter(t => t.state === stage.state).length;
          return (
            <React.Fragment key={stage.state}>
              <div className="flex flex-col items-center gap-0.5 relative">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  hasTxnAtStage
                    ? stage.state === 'SETTLED'
                      ? 'bg-emerald-500/30 border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                      : stage.state === 'OFFLINE_PENDING'
                      ? 'bg-amber-500/30 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)] animate-pulse'
                      : 'bg-sky-500/30 border-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.4)]'
                    : 'bg-zinc-800 border-zinc-700'
                }`}>
                  {stage.state === 'SETTLED' && hasTxnAtStage && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  {stage.state === 'SYNCING' && hasTxnAtStage && <Loader2 className="w-3 h-3 text-sky-400 animate-spin" />}
                  {stage.state === 'OFFLINE_PENDING' && hasTxnAtStage && <Clock className="w-3 h-3 text-amber-400" />}
                  {stage.state === 'QUEUED' && hasTxnAtStage && <Layers className="w-3 h-3 text-sky-300" />}
                  {stage.state === 'CREATED' && hasTxnAtStage && <ArrowUpRight className="w-3 h-3 text-zinc-300" />}
                </div>
                <span className={`text-[7px] font-mono font-semibold ${hasTxnAtStage ? 'text-zinc-200' : 'text-zinc-600'}`}>
                  {stage.shortLabel}
                </span>
                {countAtStage > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 text-[7px] font-bold bg-zinc-700 text-zinc-200 w-3.5 h-3.5 rounded-full flex items-center justify-center border border-zinc-600">
                    {countAtStage}
                  </span>
                )}
              </div>
              {idx < PIPELINE_STAGES.length - 1 && (
                <div className={`flex-1 h-[2px] mx-0.5 rounded transition-all ${
                  offlineTxns.some(t => getStageIndex(t.state) > idx)
                    ? 'bg-gradient-to-r from-emerald-500/50 to-emerald-500/20'
                    : 'bg-zinc-800'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Per-Transaction Cards */}
      <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto pr-0.5">
        {offlineTxns.map((tx) => {
          const isExpanded = expandedTxnId === tx.id;
          const colors = STATE_COLORS[tx.state] || STATE_COLORS.CREATED;
          const currentStageIdx = getStageIndex(tx.state);
          const isTerminal = isTerminalState(tx.state);
          const isActive = isActiveState(tx.state);

          return (
            <div key={tx.id} className="w-full">
              {/* Compact Row */}
              <button
                type="button"
                onClick={() => setExpandedTxnId(isExpanded ? null : tx.id)}
                className={`w-full p-2 rounded-xl border flex items-center justify-between gap-2 transition-all hover:bg-zinc-850 ${
                  isExpanded ? 'bg-zinc-850 border-zinc-700' : 'bg-zinc-950/40 border-zinc-850'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${colors.bg} ${colors.text} border ${colors.border}`}>
                    {METHOD_ICON[tx.paymentMethod]}
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-[11px] font-semibold text-zinc-200 flex items-center gap-1.5">
                      <span>₹{tx.amount.toFixed(2)}</span>
                      <span className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
                        {tx.state.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[9px] text-zinc-500 font-mono flex items-center gap-1">
                      <span>{tx.id}</span>
                      <span>•</span>
                      <span>{METHOD_LABEL[tx.paymentMethod]}</span>
                      {isActive && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400">{getAge(tx.createdAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isActive && <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`} />}
                  {isExpanded ? <ChevronUp className="w-3 h-3 text-zinc-500" /> : <ChevronDown className="w-3 h-3 text-zinc-500" />}
                </div>
              </button>

              {/* Expanded Detail View */}
              {isExpanded && (
                <div className="mt-1 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-850 flex flex-col gap-2.5 animate-fade-in">
                  {/* Per-Transaction Pipeline Stepper */}
                  <div className="flex items-center gap-0.5 w-full">
                    {PIPELINE_STAGES.map((stage, idx) => {
                      const isPassed = currentStageIdx >= 0 && idx < currentStageIdx;
                      const isCurrent = idx === currentStageIdx;
                      const isFuture = currentStageIdx >= 0 && idx > currentStageIdx;

                      return (
                        <React.Fragment key={stage.state}>
                          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              isPassed
                                ? 'bg-emerald-500/30 border-emerald-400'
                                : isCurrent
                                ? `${colors.bg} ${colors.border} border-2 shadow-[0_0_6px_rgba(255,255,255,0.1)] animate-pulse`
                                : isTerminal
                                ? 'bg-rose-500/10 border-rose-500/30'
                                : 'bg-zinc-800/60 border-zinc-700/60'
                            }`}>
                              {isPassed && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                              {isCurrent && !isTerminal && <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />}
                              {isCurrent && isTerminal && <XCircle className="w-2.5 h-2.5 text-rose-400" />}
                            </div>
                            <span className={`text-[6px] font-mono font-semibold ${
                              isPassed ? 'text-emerald-400' : isCurrent ? colors.text : isFuture ? 'text-zinc-700' : 'text-zinc-600'
                            }`}>
                              {stage.shortLabel}
                            </span>
                          </div>
                          {idx < PIPELINE_STAGES.length - 1 && (
                            <div className={`flex-1 h-[1.5px] mx-0.5 rounded ${
                              isPassed ? 'bg-emerald-500/50' : 'bg-zinc-800'
                            }`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Error / Terminal state branching */}
                  {isTerminal && (
                    <div className="flex items-center gap-1.5 text-[10px] text-rose-300 bg-rose-950/30 border border-rose-500/20 px-2 py-1.5 rounded-lg">
                      <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>{tx.declineReason || `Transaction ${tx.state.replace('_', ' ').toLowerCase()}`}</span>
                    </div>
                  )}

                  {/* Transaction Detail Grid */}
                  <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
                    <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-850">
                      <span className="text-zinc-600">AUTH</span>
                      <div className="text-zinc-300 font-semibold truncate">{tx.authCode || '—'}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-850">
                      <span className="text-zinc-600">RRN</span>
                      <div className="text-zinc-300 font-semibold truncate">{tx.rrn || '—'}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-850">
                      <span className="text-zinc-600">CREATED</span>
                      <div className="text-zinc-300 font-semibold">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-850">
                      <span className="text-zinc-600">{tx.state === 'SETTLED' ? 'SETTLED' : 'EST. SETTLE'}</span>
                      <div className={`font-semibold ${tx.settledAt ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {tx.settledAt
                          ? new Date(tx.settledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                          : 'On Reconnect'
                        }
                      </div>
                    </div>
                    {tx.cryptoChain && (
                      <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-850 col-span-2">
                        <span className="text-zinc-600">CHAIN / TX HASH</span>
                        <div className="text-violet-300 font-semibold truncate">{tx.cryptoChain} • {tx.cryptoTxHash || '—'}</div>
                      </div>
                    )}
                  </div>

                  {/* Next action hint */}
                  {isActive && (
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                      <ArrowRight className="w-3 h-3 text-zinc-500 shrink-0" />
                      <span>
                        {tx.state === 'OFFLINE_PENDING' && 'Will sync when connection is restored.'}
                        {tx.state === 'QUEUED' && 'In sync queue — waiting for batch processing.'}
                        {tx.state === 'SYNCING' && 'Transmitting to server...'}
                        {tx.state === 'CREATED' && 'Awaiting offline validation.'}
                        {tx.state === 'RETRY' && 'Will retry on next sync cycle.'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
