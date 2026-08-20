import { create } from 'zustand';
import type { 
  CardData, TabType, Transaction, UserProfile, MainScreenType, 
  BeneficiaryContact, LoanAccount, BrandPerk 
} from '../types';
import { computeOfflinePayloadHash, generateIdempotencyKey } from '../utils/cryptoOffline';

interface AppState {
  // Navigation & Screen Control
  currentScreen: MainScreenType;
  setCurrentScreen: (screen: MainScreenType) => void;

  // User Profile
  user: UserProfile;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  
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
  updateCardPin: (cardId: string, newPin: string) => void;

  // Beneficiaries / Quick Contacts
  contacts: BeneficiaryContact[];

  // Loan State
  loanAccount: LoanAccount;
  drawdownCredit: (amount: number) => void;

  // Brand Perks & Scratch Cards
  perks: BrandPerk[];
  scratchedCardsCount: number;
  claimScratchReward: () => number;

  // Offline / Online Engine State
  isOnline: boolean;
  toggleOnlineStatus: () => void;
  isSyncing: boolean;
  syncOfflineBatch: () => Promise<void>;

  // Transactions State
  transactions: Transaction[];
  selectedTransaction: Transaction | null;
  setSelectedTransaction: (tx: Transaction | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Modal Navigation
  activeModal: 'QR_SCANNER' | 'PAYMENT' | 'TOP_UP' | 'MANAGE_CARD' | 'REWARDS' | 'SEARCH' | 'NOTIFICATIONS' | 'RECEIPT' | 'SPLIT_BILL' | null;
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
    name: 'Visa Signature Black',
    brand: 'VISA',
    cardType: 'Signature Credit',
    cardNumberMasked: '•••• •••• •••• 4892',
    fullCardNumber: '4111 8920 3481 4892',
    cardHolder: 'AARAV SHARMA',
    expiryDate: '08/29',
    cvv: '849',
    pin: '7429',
    balance: 148750.00,
    availableLimit: 351250.00,
    totalLimit: 500000.00,
    isFrozen: false,
    internationalAllowed: true,
    contactlessEnabled: true,
    contactlessLimit: 5000,
    gradient: 'from-zinc-900 via-neutral-900 to-black',
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
    pin: '1092',
    balance: 64200.00,
    availableLimit: 235800.00,
    totalLimit: 300000.00,
    isFrozen: false,
    internationalAllowed: false,
    contactlessEnabled: true,
    contactlessLimit: 5000,
    gradient: 'from-stone-900 via-zinc-900 to-neutral-950',
    accentColor: '#F59E0B',
  },
  {
    id: 'card-3',
    name: 'BharatPay Platinum Offline',
    brand: 'MASTERCARD',
    cardType: 'Offline Tap & Pay Card',
    cardNumberMasked: '•••• •••• •••• 1045',
    fullCardNumber: '5241 9901 3341 1045',
    cardHolder: 'AARAV SHARMA',
    expiryDate: '05/31',
    cvv: '120',
    pin: '8371',
    balance: 28540.00,
    availableLimit: 71460.00,
    totalLimit: 100000.00,
    isFrozen: false,
    internationalAllowed: false,
    contactlessEnabled: true,
    contactlessLimit: 10000,
    gradient: 'from-zinc-900 via-slate-900 to-black',
    accentColor: '#EA580C',
  }
];

const INITIAL_CONTACTS: BeneficiaryContact[] = [
  {
    id: 'c-1',
    name: 'Priya Patel',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    upiId: 'priya.patel@okaxis',
    recentAmount: 1200,
  },
  {
    id: 'c-2',
    name: 'Rahul Verma',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    upiId: 'rahul.v@oksbi',
    recentAmount: 3500,
  },
  {
    id: 'c-3',
    name: 'Ananya Roy',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
    upiId: 'ananya.roy@okicici',
    recentAmount: 750,
  },
  {
    id: 'c-4',
    name: 'Vikram Singh',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    upiId: 'vikram.pos@okhdfcbank',
    recentAmount: 5000,
  }
];

const INITIAL_LOAN: LoanAccount = {
  id: 'loan-4091',
  loanNumber: 'PL-MUM-984210',
  type: 'Pre-Approved Instant Credit Line',
  approvedLimit: 750000.00,
  drawnAmount: 180000.00,
  availableCredit: 570000.00,
  interestRate: 11.25,
  nextEmiDate: '05 Sep 2026',
  nextEmiAmount: 14850.00,
  tenureMonths: 24,
  remainingMonths: 18,
};

const INITIAL_PERKS: BrandPerk[] = [
  {
    id: 'p-1',
    brand: 'Starbucks',
    title: 'Flat 20% off on Beverage Orders',
    code: 'BHARAT20',
    discount: '20% OFF',
    expires: '31 Aug 2026',
    iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    logoText: 'SB',
  },
  {
    id: 'p-2',
    brand: 'Swiggy Gourmet',
    title: '₹150 Instant Cashback above ₹699',
    code: 'SWIGGYPOS',
    discount: '₹150 CASHBACK',
    expires: '28 Aug 2026',
    iconBg: 'bg-orange-50 text-orange-700 border-orange-200/60',
    logoText: 'SW',
  },
  {
    id: 'p-3',
    brand: 'IndiGo Airlines',
    title: 'Zero Convenience Fee on Domestic Flights',
    code: 'FLYBHARAT',
    discount: 'ZERO FEE',
    expires: '15 Sep 2026',
    iconBg: 'bg-blue-50 text-blue-700 border-blue-200/60',
    logoText: '6E',
  },
  {
    id: 'p-4',
    brand: 'Apple Store Online',
    title: '₹5,000 Instant Reward on Mac & iPad',
    code: 'APPLE5000',
    discount: '₹5,000 OFF',
    expires: '30 Sep 2026',
    iconBg: 'bg-zinc-100 text-zinc-800 border-zinc-200',
    logoText: 'AP',
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    idempotencyKey: 'POS001-20260818-1001-A9F4',
    amount: 1450.00,
    currency: 'INR',
    merchantName: 'Starbucks Reserve',
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
    merchantName: 'Reliance Digital Store',
    merchantCategory: 'Electronics & Gadgets',
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
    merchantCategory: 'Food & Dining',
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
    merchantName: 'IndiGo Flight Booking',
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
    merchantName: 'Bank Account Top-up',
    merchantCategory: 'Account Inflow',
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
  currentScreen: 'HOME',
  setCurrentScreen: (screen) => set({ currentScreen: screen }),

  user: {
    name: 'Aarav Sharma',
    greeting: 'Welcome back',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    upiId: 'aarav.sharma@okhdfcbank',
    terminalCode: 'POS-MUM-4891',
    merchantName: 'Aarav Sharma',
    rewardPoints: 4850,
    unreadNotifications: 2,
    phone: '+91 98201 44892',
    email: 'aarav.sharma@techfin.in',
    isKycVerified: true,
    biometricsEnabled: true,
  },

  updateUserProfile: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),

  activeTab: 'CREDIT_CARD',
  setActiveTab: (tab) => {
    set({ activeTab: tab });
    if (tab === 'LOAN') {
      set({ currentScreen: 'LOANS' });
    } else if (tab === 'CREDIT_CARD') {
      set({ currentScreen: 'CARDS' });
    } else {
      set({ currentScreen: 'HOME' });
    }
  },

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

  updateCardPin: (cardId, newPin) => {
    set((state) => ({
      cards: state.cards.map((c) => (c.id === cardId ? { ...c, pin: newPin } : c)),
    }));
  },

  contacts: INITIAL_CONTACTS,

  loanAccount: INITIAL_LOAN,
  drawdownCredit: (amount: number) => {
    const { loanAccount, cards } = get();
    if (amount > loanAccount.availableCredit) return;

    const updatedLoan: LoanAccount = {
      ...loanAccount,
      drawnAmount: loanAccount.drawnAmount + amount,
      availableCredit: loanAccount.availableCredit - amount,
    };

    const updatedCards = [...cards];
    updatedCards[0] = {
      ...updatedCards[0],
      balance: updatedCards[0].balance + amount,
    };

    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      idempotencyKey: generateIdempotencyKey('LOAN-DRAW'),
      amount,
      currency: 'INR',
      merchantName: 'Instant Credit Line Drawdown',
      merchantCategory: 'Credit Disbursal',
      iconName: 'ArrowDownLeft',
      timestamp: new Date().toISOString(),
      status: 'SYNCED',
      offlineFlag: false,
      payloadSignature: 'DISBURSAL-' + Date.now(),
      paymentMethod: 'TOP_UP',
      type: 'CREDIT',
    };

    set((state) => ({
      loanAccount: updatedLoan,
      cards: updatedCards,
      transactions: [newTx, ...state.transactions],
    }));
  },

  perks: INITIAL_PERKS,
  scratchedCardsCount: 0,
  claimScratchReward: () => {
    const bonus = Math.floor(Math.random() * 250) + 50; // Random 50 to 300 pts
    set((state) => ({
      user: { ...state.user, rewardPoints: state.user.rewardPoints + bonus },
      scratchedCardsCount: state.scratchedCardsCount + 1,
    }));
    return bonus;
  },

  isOnline: true,
  toggleOnlineStatus: () => {
    const nextState = !get().isOnline;
    set({ isOnline: nextState });
    if (nextState) {
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
    await new Promise((resolve) => setTimeout(resolve, 1200));

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
  
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

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
      const cashbackINR = points; // 1 pt = ₹1
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
