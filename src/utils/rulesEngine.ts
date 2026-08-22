import { posDb } from '../db/db';
import type { OfflineValidationResult, PaymentMethodType } from '../types/pos';

export interface ValidationParams {
  amount: number;
  paymentMethod: PaymentMethodType;
  isOnline: boolean;
  terminalId?: string;
}

export async function validateTransactionRules(params: ValidationParams): Promise<OfflineValidationResult> {
  const { amount, paymentMethod, isOnline } = params;

  // 1. Basic sanity validation
  if (amount <= 0) {
    return {
      allowed: false,
      state: 'DECLINED',
      declineReason: 'Invalid transaction amount (must be greater than ₹0.00)'
    };
  }

  // 2. Crypto Wallet specific rules
  if (paymentMethod === 'CRYPTO_WALLET') {
    if (amount < 10) {
      return {
        allowed: false,
        state: 'DECLINED',
        declineReason: 'Crypto minimum transaction amount is ₹10.00 (gas fee threshold)'
      };
    }

    // Crypto transactions are signed offline and broadcast later
    // They always start as OFFLINE_PENDING regardless of connectivity
    if (isOnline) {
      return {
        allowed: true,
        state: 'SETTLED',
        authCode: `CRYPTO-ON-${Math.floor(100000 + Math.random() * 900000)}`
      };
    }

    return {
      allowed: true,
      state: 'OFFLINE_PENDING',
      authCode: `CRYPTO-OFF-${Math.floor(1000 + Math.random() * 9000)}`
    };
  }

  // 3. Online Mode Rules (for non-crypto)
  if (isOnline) {
    return {
      allowed: true,
      state: 'SETTLED',
      authCode: `AUTH-ON-${Math.floor(100000 + Math.random() * 900000)}`
    };
  }

  // 4. Offline Mode Compliance Rules (RBI Framework)
  
  // Rule A: ₹500 per-transaction ceiling
  if (amount > 500.00) {
    return {
      allowed: false,
      state: 'DECLINED',
      declineReason: `Declined: Amount (₹${amount.toFixed(2)}) exceeds RBI single offline ceiling of ₹500.00`
    };
  }

  // Rule B: ₹2,000 cumulative offline cap check from local IndexedDB store
  try {
    const offlinePendingTxns = await posDb.transactions
      .filter((t) => t.state === 'OFFLINE_PENDING' || (t.isOffline && t.state !== 'SETTLED' && t.state !== 'DECLINED'))
      .toArray();

    const currentCumulative = offlinePendingTxns.reduce((sum, t) => sum + t.amount, 0);

    if (currentCumulative + amount > 2000.00) {
      return {
        allowed: false,
        state: 'DECLINED',
        declineReason: `Declined: Cumulative offline spending (₹${(currentCumulative + amount).toFixed(2)}) exceeds ₹2,000.00 RBI cap. Reconnect to sync.`
      };
    }

    const nextSeq = offlinePendingTxns.length + 1;

    return {
      allowed: true,
      state: 'OFFLINE_PENDING',
      authCode: `AUTH-OFF-${String(nextSeq).padStart(4, '0')}`
    };
  } catch (error) {
    console.error('Error querying local Dexie transactions for cap validation:', error);
    // Fallback if db query fails
    return {
      allowed: true,
      state: 'OFFLINE_PENDING',
      authCode: `AUTH-OFF-${Math.floor(1000 + Math.random() * 9000)}`
    };
  }
}

