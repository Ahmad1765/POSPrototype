export type TabType = 'ACCOUNT' | 'CREDIT_CARD' | 'LOAN';

export type CardBrand = 'VISA' | 'RUPAY' | 'MASTERCARD';

export interface CardData {
  id: string;
  name: string;
  brand: CardBrand;
  cardType: string;
  cardNumberMasked: string;
  fullCardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  balance: number;
  availableLimit: number;
  totalLimit: number;
  isFrozen: boolean;
  internationalAllowed: boolean;
  contactlessEnabled: boolean;
  contactlessLimit: number;
  gradient: string;
  accentColor: string;
}

export type TransactionStatus = 'SYNCED' | 'OFFLINE_PENDING' | 'SETTLED' | 'PROCESSING';

export interface Transaction {
  id: string;
  idempotencyKey: string;
  amount: number;
  currency: string;
  merchantName: string;
  merchantCategory: string;
  iconName: string;
  timestamp: string;
  status: TransactionStatus;
  offlineFlag: boolean;
  payloadSignature: string;
  paymentMethod: 'CARD' | 'UPI_QR' | 'NFC_TAP' | 'TOP_UP';
  type: 'DEBIT' | 'CREDIT';
}

export interface UserProfile {
  name: string;
  greeting: string;
  avatarUrl: string;
  upiId: string;
  terminalCode: string;
  merchantName: string;
  rewardPoints: number;
  unreadNotifications: number;
}
