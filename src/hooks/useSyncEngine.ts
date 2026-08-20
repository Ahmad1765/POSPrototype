import { useState, useEffect, useRef, useCallback } from 'react';
import { posDb } from '../db/db';
import type { PosTransactionRecord } from '../types/pos';

export interface SyncEngineResult {
  isSyncing: boolean;
  lastSyncedCount: number;
  lastSyncTimestamp: string | null;
  syncOfflineBatch: () => Promise<number>;
}

export function useSyncEngine(
  isOnline: boolean,
  onSyncComplete?: (syncedRecords: PosTransactionRecord[]) => void
): SyncEngineResult {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedCount, setLastSyncedCount] = useState<number>(0);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(null);

  // Track previous online state to detect transition from Offline -> Online
  const prevOnlineRef = useRef<boolean>(isOnline);

  const syncOfflineBatch = useCallback(async (): Promise<number> => {
    try {
      // 1. Query Dexie for all OFFLINE_PENDING or QUEUED transactions
      const pendingTxns = await posDb.transactions
        .filter((t) => t.state === 'OFFLINE_PENDING' || t.state === 'QUEUED')
        .toArray();

      if (pendingTxns.length === 0) {
        return 0;
      }

      setIsSyncing(true);

      // 2. Simulate network batch ingestion latency (2000ms)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const now = new Date().toISOString();
      const updatedTxns: PosTransactionRecord[] = [];

      // 3. Batch update records to SETTLED in Dexie
      await posDb.transaction('rw', posDb.transactions, posDb.terminals, async () => {
        for (const txn of pendingTxns) {
          const updated: PosTransactionRecord = {
            ...txn,
            state: 'SETTLED',
            syncedAt: now,
            settledAt: now,
            authCode: txn.authCode || `AUTH-SYNC-${Math.floor(100000 + Math.random() * 900000)}`
          };
          await posDb.transactions.put(updated);
          updatedTxns.push(updated);
        }

        // Update terminal metadata
        const terminal = await posDb.terminals.get('TERM-MUM-001');
        if (terminal) {
          await posDb.terminals.put({
            ...terminal,
            isOnline: true,
            currentOfflineCumulative: 0,
            lastHeartbeat: now
          });
        }
      });

      setIsSyncing(false);
      setLastSyncedCount(pendingTxns.length);
      setLastSyncTimestamp(now);

      if (onSyncComplete) {
        onSyncComplete(updatedTxns);
      }

      return pendingTxns.length;
    } catch (err) {
      console.error('Error during mock batch sync in Dexie:', err);
      setIsSyncing(false);
      return 0;
    }
  }, [onSyncComplete]);

  // Trigger sync when transitioning from Offline (false) -> Online (true)
  useEffect(() => {
    const wasOffline = !prevOnlineRef.current;
    const isNowOnline = isOnline;

    if (wasOffline && isNowOnline && !isSyncing) {
      syncOfflineBatch();
    }

    prevOnlineRef.current = isOnline;
  }, [isOnline, isSyncing, syncOfflineBatch]);

  return {
    isSyncing,
    lastSyncedCount,
    lastSyncTimestamp,
    syncOfflineBatch
  };
}
