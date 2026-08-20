import { useState, useEffect, useCallback } from 'react';
import { posDb } from '../db/db';
import type { PosTransactionRecord, PosTerminalRecord } from '../types/pos';

export interface AdminMetrics {
  totalCount: number;
  totalVolume: number;
  pendingSyncCount: number;
  pendingSyncVolume: number;
  settledCount: number;
  settledVolume: number;
  declinedCount: number;
  declinedVolume: number;
}

export function useDexieTransactions() {
  const [transactions, setTransactions] = useState<PosTransactionRecord[]>([]);
  const [terminals, setTerminals] = useState<PosTerminalRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalCount: 0,
    totalVolume: 0,
    pendingSyncCount: 0,
    pendingSyncVolume: 0,
    settledCount: 0,
    settledVolume: 0,
    declinedCount: 0,
    declinedVolume: 0
  });

  const refreshData = useCallback(async () => {
    try {
      const txns = await posDb.transactions
        .orderBy('createdAt')
        .reverse()
        .toArray();

      const termList = await posDb.terminals.toArray();

      setTransactions(txns);
      setTerminals(termList);

      // Compute dynamic KPIs
      let totalVol = 0;
      let pendingCount = 0;
      let pendingVol = 0;
      let settledCnt = 0;
      let settledVol = 0;
      let decCount = 0;
      let decVol = 0;

      for (const t of txns) {
        totalVol += t.amount;
        if (t.state === 'OFFLINE_PENDING' || t.state === 'QUEUED') {
          pendingCount++;
          pendingVol += t.amount;
        } else if (t.state === 'SETTLED' || t.state === 'AUTHORIZED') {
          settledCnt++;
          settledVol += t.amount;
        } else if (t.state === 'DECLINED') {
          decCount++;
          decVol += t.amount;
        }
      }

      setMetrics({
        totalCount: txns.length,
        totalVolume: totalVol,
        pendingSyncCount: pendingCount,
        pendingSyncVolume: pendingVol,
        settledCount: settledCnt,
        settledVolume: settledVol,
        declinedCount: decCount,
        declinedVolume: decVol
      });
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching admin data from Dexie:', err);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();

    // 1. Polling interval for fast cross-tab reactivity (1000ms)
    const interval = setInterval(refreshData, 1000);

    // 2. Reactivity on window focus / visibilitychange
    const handleFocus = () => refreshData();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, [refreshData]);

  return {
    transactions,
    terminals,
    metrics,
    isLoading,
    refreshData
  };
}
