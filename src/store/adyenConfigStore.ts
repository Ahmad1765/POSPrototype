import { create } from 'zustand';
import type { 
  AdyenTerminalModel, 
  AdyenTerminalProfile, 
  AdyenSaFConfig 
} from '../types/adyenNexoTypes';
import { fetchSaFConfigFromCustomerArea } from '../server/adyenCloudProxy';

export type AdyenConnectionMode = 'SIMULATOR' | 'CLOUD_PROXY' | 'LOCAL_IP';

export interface AdyenConfigState {
  // Merchant Credentials (No secret API keys stored in client state)
  merchantAccount: string;
  companyAccount: string;
  environment: 'TEST' | 'LIVE_EU' | 'LIVE_US';
  proxyEndpoint: string; // Secure backend proxy URL e.g. /api/adyen/terminal
  connectionMode: AdyenConnectionMode;

  // Local IP Direct Terminal settings (Optional for on-premise local IP connections)
  localTerminalIp: string;
  localTerminalPort: number;

  // Active Terminal & Fleet
  activeTerminalModel: AdyenTerminalModel;
  activeCurrency: string;
  registeredTerminals: AdyenTerminalProfile[];

  // Store-and-Forward (SaF) Customer Area Dynamic Configuration
  safConfig: AdyenSaFConfig | null;
  isSyncingSafConfig: boolean;
  lastSafSyncTime: string | null;
  isOfflineModeAllowed: boolean; // Only unlocked once SaF config has been synced
  safSyncError: string | null;

  // Actions
  setMerchantAccount: (account: string) => void;
  setCompanyAccount: (company: string) => void;
  setEnvironment: (env: 'TEST' | 'LIVE_EU' | 'LIVE_US') => void;
  setConnectionMode: (mode: AdyenConnectionMode) => void;
  setProxyEndpoint: (endpoint: string) => void;
  setLocalTerminalIp: (ip: string, port?: number) => void;
  setActiveTerminalModel: (model: AdyenTerminalModel) => void;
  setActiveCurrency: (currency: string) => void;
  updateTerminalStatus: (poiId: string, status: AdyenTerminalProfile['status'], battery?: number) => void;

  // SaF Customer Area Routine
  syncTerminalConfiguration: (merchantAccount?: string, poiId?: string) => Promise<AdyenSaFConfig>;
}

const DEFAULT_REGISTERED_TERMINALS: AdyenTerminalProfile[] = [
  {
    model: 'S1F2',
    name: 'Adyen S1F2 All-in-One',
    subtitle: 'Countertop Android POS with Thermal Printer & Scanner',
    poiId: 'S1F2-000154829102',
    connectionType: 'CLOUD',
    ipAddress: '192.168.1.140',
    hasPrinter: true,
    hasCameraScanner: true,
    batteryPercent: 94,
    firmwareVersion: 'AdyenOS v4.18.2-pci5',
    status: 'ONLINE'
  },
  {
    model: 'AMS1',
    name: 'Adyen AMS1 Mobile POS',
    subtitle: 'Ultra-portable Android Smart Device for Tableside Pay',
    poiId: 'AMS1-987654321045',
    connectionType: 'CLOUD',
    ipAddress: '192.168.1.142',
    hasPrinter: false,
    hasCameraScanner: true,
    batteryPercent: 88,
    firmwareVersion: 'AdyenOS v4.18.1-pci5',
    status: 'ONLINE'
  },
  {
    model: 'SATURN_1000F2',
    name: 'Adyen Castles Saturn 1000F2',
    subtitle: 'Dedicated Countertop PIN Pad with Tactile Keypad',
    poiId: 'SATURN-482019482910',
    connectionType: 'LOCAL_IP',
    ipAddress: '192.168.1.145',
    hasPrinter: true,
    hasCameraScanner: false,
    batteryPercent: 100,
    firmwareVersion: 'SaturnOS v3.22-emv',
    status: 'ONLINE'
  },
  {
    model: 'NYC1',
    name: 'Adyen NYC1 Card Reader',
    subtitle: 'Ultra-compact Bluetooth Pocket Card Reader',
    poiId: 'NYC1-782019283741',
    connectionType: 'BLUETOOTH',
    ipAddress: undefined,
    hasPrinter: false,
    hasCameraScanner: false,
    batteryPercent: 76,
    firmwareVersion: 'NYC-FW-1.9.0',
    status: 'ONLINE'
  },
  {
    model: 'TAP_TO_PAY',
    name: 'Adyen Tap to Pay on Mobile',
    subtitle: 'Contactless SoftPOS on iOS / Android Smartphone',
    poiId: 'TTP-IPHONE-928301',
    connectionType: 'SOFTPOS',
    ipAddress: undefined,
    hasPrinter: false,
    hasCameraScanner: true,
    batteryPercent: 98,
    firmwareVersion: 'AdyenTTP-SDK-2.4',
    status: 'ONLINE'
  }
];

export const useAdyenConfigStore = create<AdyenConfigState>((set, get) => ({
  // Credentials (Proxy-mediated, no secret key exposed)
  merchantAccount: 'MetroCoffeePOS_Store_01',
  companyAccount: 'MetroGroup',
  environment: 'TEST',
  proxyEndpoint: '/api/adyen/terminal',
  connectionMode: 'SIMULATOR',

  localTerminalIp: '192.168.1.140',
  localTerminalPort: 8443,

  activeTerminalModel: 'S1F2',
  activeCurrency: 'INR',
  registeredTerminals: DEFAULT_REGISTERED_TERMINALS,

  // SaF Configuration
  safConfig: null,
  isSyncingSafConfig: false,
  lastSafSyncTime: null,
  isOfflineModeAllowed: false,
  safSyncError: null,

  setMerchantAccount: (merchantAccount) => set({ merchantAccount }),
  setCompanyAccount: (companyAccount) => set({ companyAccount }),
  setEnvironment: (environment) => set({ environment }),
  setConnectionMode: (connectionMode) => set({ connectionMode }),
  setProxyEndpoint: (proxyEndpoint) => set({ proxyEndpoint }),
  setLocalTerminalIp: (localTerminalIp, localTerminalPort = 8443) => set({ localTerminalIp, localTerminalPort }),
  setActiveTerminalModel: (activeTerminalModel) => set({ activeTerminalModel }),
  setActiveCurrency: (activeCurrency) => set({ activeCurrency }),

  updateTerminalStatus: (poiId, status, battery) => {
    set((state) => ({
      registeredTerminals: state.registeredTerminals.map((term) =>
        term.poiId === poiId
          ? {
              ...term,
              status,
              batteryPercent: battery !== undefined ? battery : term.batteryPercent
            }
          : term
      )
    }));
  },

  /**
   * Sync Store-and-Forward (SaF) Configuration Routine
   * Fetches latest offline ceilings and rules from Adyen Customer Area.
   */
  syncTerminalConfiguration: async (customMerchant, customPoiId) => {
    const state = get();
    const activeTerminal = state.registeredTerminals.find((t) => t.model === state.activeTerminalModel);
    const merchantAccount = customMerchant || state.merchantAccount;
    const poiId = customPoiId || activeTerminal?.poiId || 'S1F2-000154829102';

    set({ isSyncingSafConfig: true, safSyncError: null });

    try {
      // Simulate network request to Adyen Customer Area proxy / API
      await new Promise((resolve) => setTimeout(resolve, 800));

      const config = await fetchSaFConfigFromCustomerArea(merchantAccount, poiId);

      set({
        safConfig: config,
        isSyncingSafConfig: false,
        lastSafSyncTime: new Date().toLocaleTimeString(),
        isOfflineModeAllowed: config.safEnabled,
        safSyncError: null
      });

      return config;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to sync with Adyen Customer Area';
      set({
        isSyncingSafConfig: false,
        safSyncError: errorMsg,
        isOfflineModeAllowed: false
      });
      throw err;
    }
  }
}));
