import { create } from 'zustand';
import type { CardData, TabType, Transaction, UserProfile } from '../types';
import { computeOfflinePayloadHash, generateIdempotencyKey } from '../utils/cryptoOffline';

interface AppState {
  // User Profile
  user: UserProfile;
  
  // Tab State (Account | Credit Card | Loan)
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  // Balance Visibility (Eye Toggle)
  isBalanceVisible: boolean;
  toggleBalanceVisibility: () => void;

  // Cards State
  cards: CardData[];
  activeCardIndex: number;
  setActiveCardIndex: (index: number) => void;
  toggleCardFreeze: (cardId: string) => void;
  updateCardLimit: (cardId: string, limit: number) => void;

  // Offline / Online Engine State
  isOnline: boolean;
  toggleOnlineStatus: () => void;
  isSyncing: boolean;
  syncOfflineBatch: () => Promise<void>;

  // Transactions State
  transactions: Transaction[];
  selectedTransaction: Transaction | null;
  setSelectedTransaction: (tx: Transaction | null) => void;

  // Modal Navigation
  activeModal: 'QR_SCANNER' | 'PAYMENT' | 'TOP_UP' | 'MANAGE_CARD' | 'REWARDS' | 'SEARCH' | 'NOTIFICATIONS' | 'RECEIPT' | null;
  openModal: (modal: AppState['activeModal']) => void;
  closeModal: () => void;

  // Payment Processing (Offline Store & Forward or Online Direct)
  executePayment: (params: {
    amount: number;
    merchantName: string;
    merchantCategory: string;
    iconName: string;
    paymentMethod: 'CARD' | 'UPI_QR' | 'NFC_TAP' | 'TOP_UP';
  }) => Promise<Transaction>;

  // Redeem Reward Points
  redeemPoints: (points: number) => void;
}

const INITIAL_CARDS: CardData[] = [
  {
    id: 'card-1',
    name: 'Visa Signature Corporate',
    brand: 'VISA',
    cardType: 'Signature Credit',
    cardNumberMasked: '•••• •••• •••• 4892',
    fullCardNumber: '4111 8920 3481 4892',
    cardHolder: 'AARAV SHARMA',
    expiryDate: '08/29',
    cvv: '849',
    balance: 148750.00,
    availableLimit: 351250.00,
    totalLimit: 500000.00,
    isFrozen: false,
    internationalAllowed: true,
    contactlessEnabled: true,
    contactlessLimit: 5000,
    gradient: 'from-slate-900 via-zinc-900 to-neutral-950',
    accentColor: '#FF6B00',
  },
  {
    id: 'card-2',
    name: 'RuPay Select Business',
    brand: 'RUPAY',
    cardType: 'UPI-Linked Credit',
    cardNumberMasked: '•••• •••• •••• 9210',
    fullCardNumber: '6074 4891 2291 9210',
    cardHolder: 'AARAV SHARMA',
    expiryDate: '11/30',
    cvv: '392',
    balance: 64200.00,
    availableLimit: 235800.00,
    totalLimit: 300000.00,
    isFrozen: false,
    internationalAllowed: false,
    contactlessEnabled: true,
    contactlessLimit: 5000,
    gradient: 'from-amber-950 via-orange-950 to-stone-900',
    accentColor: '#F59E0B',
  },
  {
    id: 'card-3',
    name: 'BharatPay POS Offline Smart Card',
    brand: 'MASTERCARD',
    cardType: 'Store & Forward Terminal Card',
    cardNumberMasked: '•••• •••• •••• 1045',
    fullCardNumber: '5241 9901 3341 1045',
    cardHolder: 'AARAV SHARMA',
    expiryDate: '05/31',
    cvv: '120',
    balance: 28540.00,
    availableLimit: 71460.00,
    totalLimit: 100000.00,
    isFrozen: false,
    internationalAllowed: false,
    contactlessEnabled: true,
    contactlessLimit: 10000,
    gradient: 'from-orange-900 via-stone-900 to-zinc-950',
    accentColor: '#EA580C',
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    idempotencyKey: 'POS001-20260818-1001-A9F4',
    amount: 1450.00,
    currency: 'INR',
    merchantName: 'Starbucks Reserve India',
    merchantCategory: 'Food & Dining',
    iconName: 'Coffee',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    status: 'SYNCED',
    offlineFlag: false,
    payloadSignature: 'HMAC-7E82C94B3F1089A',
    paymentMethod: 'NFC_TAP',
    type: 'DEBIT',
  },
  {
    id: 'tx-2',
    idempotencyKey: 'POS001-20260818-1002-B83C',
    amount: 4299.00,
    currency: 'INR',
    merchantName: 'Reliance Digital',
    merchantCategory: 'Electronics & Retail',
    iconName: 'ShoppingBag',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    status: 'SYNCED',
    offlineFlag: false,
    payloadSignature: 'HMAC-44F901AC89DE4B1',
    paymentMethod: 'CARD',
    type: 'DEBIT',
  },
  {
    id: 'tx-3',
    idempotencyKey: 'POS001-20260817-0941-K82D',
    amount: 850.00,
    currency: 'INR',
    merchantName: 'Swiggy Gourmet Order',
    merchantCategory: 'Food Delivery',
    iconName: 'Utensils',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    status: 'SYNCED',
    offlineFlag: false,
    payloadSignature: 'HMAC-88A92BC3421EF98',
    paymentMethod: 'UPI_QR',
    type: 'DEBIT',
  },
  {
    id: 'tx-4',
    idempotencyKey: 'POS001-20260817-0810-M90C',
    amount: 12500.00,
    currency: 'INR',
    merchantName: 'Indigo Airlines Flight Ref',
    merchantCategory: 'Travel & Airlines',
    iconName: 'Plane',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    status: 'SYNCED',
    offlineFlag: false,
    payloadSignature: 'HMAC-11C23D489EF765A',
    paymentMethod: 'CARD',
    type: 'DEBIT',
  },
  {
    id: 'tx-5',
    idempotencyKey: 'POS001-20260816-0701-N44R',
    amount: 25000.00,
    currency: 'INR',
    merchantName: 'HDFC Instant Card Top-up',
    merchantCategory: 'Payment Inflow',
    iconName: 'ArrowDownLeft',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    status: 'SYNCED',
    offlineFlag: false,
    payloadSignature: 'HMAC-99B77E651D83AA2',
    paymentMethod: 'TOP_UP',
    type: 'CREDIT',
  }
];

export const useAppStore = create<AppState>((set, get) => ({
  user: {
    name: 'Aarav Sharma',
    greeting: 'Good morning',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    upiId: 'aarav.sharma@okhdfcbank',
    terminalCode: 'POS-MUM-4891',
    merchantName: 'Aarav Tech & Retail Hub',
    rewardPoints: 4850,
    unreadNotifications: 2,
  },

  activeTab: 'CREDIT_CARD', // Credit Card is default active as specified in prompt
  setActiveTab: (tab) => set({ activeTab: tab }),

  isBalanceVisible: true,
  toggleBalanceVisibility: () => set((state) => ({ isBalanceVisible: !state.isBalanceVisible })),

  cards: INITIAL_CARDS,
  activeCardIndex: 0,
  setActiveCardIndex: (index) => set({ activeCardIndex: index }),

  toggleCardFreeze: (cardId) => {
    set((state) => ({
      cards: state.cards.map((c) => (c.id === cardId ? { ...c, isFrozen: !c.isFrozen } : c)),
    }));
  },

  updateCardLimit: (cardId, limit) => {
    set((state) => ({
      cards: state.cards.map((c) => (c.id === cardId ? { ...c, totalLimit: limit, availableLimit: Math.max(0, limit - c.balance) } : c)),
    }));
  },

  isOnline: true,
  toggleOnlineStatus: () => {
    const nextState = !get().isOnline;
    set({ isOnline: nextState });
    if (nextState) {
      // Automatically trigger sync when back online
      get().syncOfflineBatch();
    }
  },

  isSyncing: false,
  syncOfflineBatch: async () => {
    const { transactions, isOnline } = get();
    if (!isOnline) return;

    const pendingCount = transactions.filter((t) => t.status === 'OFFLINE_PENDING').length;
    if (pendingCount === 0) return;

    set({ isSyncing: true });

    // Simulate batch cryptographic synchronization with NestJS backend
    await new Promise((resolve) => setTimeout(resolve, 1400));

    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.status === 'OFFLINE_PENDING' ? { ...t, status: 'SYNCED', offlineFlag: true } : t
      ),
      isSyncing: false,
    }));
  },

  transactions: INITIAL_TRANSACTIONS,
  selectedTransaction: null,
  setSelectedTransaction: (tx) => set({ selectedTransaction: tx, activeModal: tx ? 'RECEIPT' : null }),

  activeModal: null,
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null, selectedTransaction: null }),

  executePayment: async ({ amount, merchantName, merchantCategory, iconName, paymentMethod }) => {
    const { isOnline, cards, activeCardIndex, user } = get();
    const currentCard = cards[activeCardIndex];

    const idempotencyKey = generateIdempotencyKey(user.terminalCode);
    const signature = await computeOfflinePayloadHash({
      amount,
      merchantName,
      terminalCode: user.terminalCode,
      timestamp: new Date().toISOString(),
      idempotencyKey,
    });

    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      idempotencyKey,
      amount,
      currency: 'INR',
      merchantName,
      merchantCategory,
      iconName,
      timestamp: new Date().toISOString(),
      status: isOnline ? 'SYNCED' : 'OFFLINE_PENDING',
      offlineFlag: !isOnline,
      payloadSignature: signature,
      paymentMethod,
      type: paymentMethod === 'TOP_UP' ? 'CREDIT' : 'DEBIT',
    };

    // Update balances
    const updatedCards = [...cards];
    if (paymentMethod === 'TOP_UP') {
      updatedCards[activeCardIndex] = {
        ...currentCard,
        balance: currentCard.balance + amount,
        availableLimit: currentCard.availableLimit + amount,
      };
    } else {
      updatedCards[activeCardIndex] = {
        ...currentCard,
        balance: currentCard.balance - amount,
        availableLimit: Math.max(0, currentCard.availableLimit - amount),
      };
    }

    // Add reward points (1% reward)
    const earnedPoints = Math.floor(amount * 0.01);

    set((state) => ({
      cards: updatedCards,
      transactions: [newTx, ...state.transactions],
      user: {
        ...state.user,
        rewardPoints: state.user.rewardPoints + (paymentMethod !== 'TOP_UP' ? earnedPoints : 0),
      },
    }));

    return newTx;
  },

  redeemPoints: (points) => {
    set((state) => {
      const cashbackINR = points; // 1 pt = ₹ 1
      const updatedCards = [...state.cards];
      updatedCards[0] = {
        ...updatedCards[0],
        balance: updatedCards[0].balance + cashbackINR,
      };
      return {
        user: { ...state.user, rewardPoints: Math.max(0, state.user.rewardPoints - points) },
        cards: updatedCards,
      };
    });
  },
}));
