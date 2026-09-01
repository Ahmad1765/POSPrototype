// 12-Stage Transaction Lifecycle State Machine + Error/Special States
export type TransactionState =
  | 'CREATED'
  | 'VALIDATING'
  | 'IN_FLIGHT'
  | 'OFFLINE_PENDING'
  | 'STORED_OFFLINE'
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

export type PaymentMethodType = 
  | 'CARD_CHIP' 
  | 'CARD_NFC' 
  | 'UPI_LITE' 
  | 'CRYPTO_WALLET'
  | 'ADYEN_CARD'
  | 'ADYEN_NFC'
  | 'ADYEN_QR'
  | 'ALIPAY'
  | 'WECHAT_PAY';

export type CardNetwork = 'VISA' | 'MASTERCARD' | 'RUPAY' | 'AMEX' | 'MAESTRO' | 'JCB' | 'DISCOVER' | 'UPI';

export type CryptoChain = 'ETH' | 'BTC' | 'USDT_TRC20' | 'SOL';

export interface PosTerminalRecord {
  id: string;
  terminalCode: string;
  merchantName: string;
  merchantId: string;
  isOnline: boolean;
  maxOfflineCapPerTxn: number;
  maxOfflineCumulativeCap: number;
  currentOfflineCumulative: number;
  firmwareVersion: string;
  lastHeartbeat: string;
  // Crypto wallet receiving address for the merchant
  cryptoReceivingAddress?: string;
  cryptoDefaultChain?: CryptoChain;
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
  cardBin?: string;
  issuerCountry?: string;
  upiVpa?: string;
  
  // Adyen Terminal API & Nexo Standard Fields
  pspReference?: string; // Adyen 16-character PSP Reference (e.g. 883619284729104A)
  serviceId?: string; // Nexo ServiceID used for idempotency/status query
  saleTransactionId?: string; // Nexo SaleTransactionID
  tenderReference?: string; // Adyen tender reference
  entryMode?: string; // 'ICC' | 'Contactless' | 'Tapped' | 'QRCode' | 'MagStripe'
  tipAmount?: number;
  originalPspReference?: string; // For refunds / reversals
  offlineSignature?: string; // HMAC-SHA256 offline signature
  nexoRequest?: string; // JSON-serialized SaleToPOIRequest
  nexoResponse?: string; // JSON-serialized SaleToPOIResponse

  // Crypto-specific fields for store-and-forward
  cryptoWalletAddress?: string; // Customer's wallet address
  cryptoChain?: CryptoChain;
  cryptoTxHash?: string; // Signed transaction hash (offline-generated)
  cryptoAmountToken?: string; // Amount in crypto token units
  
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
  offlineSignature?: string;
}

