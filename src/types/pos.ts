// 12-Stage Transaction Lifecycle State Machine + Error/Special States
export type TransactionState =
  | 'CREATED'
  | 'VALIDATING'
  | 'OFFLINE_PENDING'
  | 'QUEUED'
  | 'SYNCING'
  | 'PROCESSING'
  | 'AUTHORIZED'
  | 'SETTLED'
  | 'DECLINED'
  | 'SYNC_FAILED'
  | 'RETRY'
  | 'VOIDED'
  | 'REFUNDED'
  | 'DUPLICATE'
  | 'REQUIRES_REVIEW';

export type PaymentMethodType = 'CARD_CHIP' | 'CARD_NFC' | 'UPI_QR' | 'UPI_LITE';

export type CardNetwork = 'VISA' | 'MASTERCARD' | 'RUPAY' | 'AMEX' | 'UPI';

export interface PosTerminalRecord {
  id: string;
  terminalCode: string;
  merchantName: string;
  merchantId: string;
  isOnline: boolean;
  maxOfflineCapPerTxn: number; // ₹500 RBI rule
  maxOfflineCumulativeCap: number; // ₹2,000 RBI rule
  currentOfflineCumulative: number;
  firmwareVersion: string;
  lastHeartbeat: string;
}

export interface PosTransactionRecord {
  id: string; // Internal id / auto-increment or UUID
  clientUuid: string; // Idempotency UUID generated on POS device
  terminalId: string;
  merchantId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethodType;
  cardNetwork?: CardNetwork;
  cardLast4?: string;
  upiVpa?: string;
  state: TransactionState;
  isOffline: boolean;
  authCode?: string;
  rrn?: string;
  declineReason?: string;
  offlineSequenceNumber?: number;
  payloadHash?: string;
  createdAt: string;
  syncedAt?: string;
  settledAt?: string;
}

export interface OfflineValidationResult {
  allowed: boolean;
  state: TransactionState;
  declineReason?: string;
  authCode?: string;
}
