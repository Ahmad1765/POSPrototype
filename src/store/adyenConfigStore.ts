import { create } from 'zustand';
import type { 
  AdyenTerminalModel, 
  AdyenTerminalProfile, 
  AdyenSaFConfig 
} from '../types/adyenNexoTypes';

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
    firmwareVersion: 'AdyenOS v4.18.2-pci5',
    status: 'ONLINE'
  },
  {
    model: 'NYC1',
    name: 'Adyen NYC1 Card Reader',
    subtitle: 'Bluetooth Contactless & Chip Reader for SoftPOS',
    poiId: 'NYC1-554433221100',
    connectionType: 'LOCAL_IP',
    ipAddress: '192.168.1.145',
    hasPrinter: false,
    hasCameraScanner: false,
    batteryPercent: 72,
    firmwareVersion: 'Firmware v2.4.1-ble',
    status: 'ONLINE'
  },
  {
    model: 'SATURN_1000F2',
    name: 'Castles Saturn 1000F2',
    subtitle: 'Heavy-duty Enterprise POS Terminal',
    poiId: 'CS10-449922118833',
    connectionType: 'CLOUD',
    ipAddress: '192.168.1.148',
    hasPrinter: true,
    hasCameraScanner: true,
    batteryPercent: 100,
    firmwareVersion: 'CastlesOS v5.1.0',
    status: 'BUSY'
  },
  {
    model: 'TAP_TO_PAY',
    name: 'Adyen Tap to Pay on iPhone/Android',
    subtitle: 'COTS Device Native NFC SoftPOS',
    poiId: 'TTP-IPHONE-009182',
    connectionType: 'CLOUD',
    ipAddress: '192.168.1.150',
    hasPrinter: false,
    hasCameraScanner: false,
    batteryPercent: 91,
    firmwareVersion: 'Adyen-TTP-SDK-v2.1',
    status: 'ONLINE'
  }
];

export const useAdyenConfigStore = create<AdyenConfigState>((set, get) => ({
  merchantAccount: 'MetroCoffeePOS_Store_01',
  companyAccount: 'MetroCoffeeRoastersGroup',
  environment: 'TEST',
  proxyEndpoint: '/api/adyen/terminal',
  connectionMode: 'SIMULATOR',

  localTerminalIp: '192.168.1.140',
  localTerminalPort: 8443,

  activeTerminalModel: 'S1F2',
  activeCurrency: 'INR',
  registeredTerminals: DEFAULT_REGISTERED_TERMINALS,

  safConfig: null,
  isSyncingSafConfig: false,
  lastSafSyncTime: null,
  isOfflineModeAllowed: false,
  safSyncError: null,

  setMerchantAccount: (account) => set({ merchantAccount: account }),
  setCompanyAccount: (company) => set({ companyAccount: company }),
  setEnvironment: (env) => set({ environment: env }),
  setConnectionMode: (mode) => set({ connectionMode: mode }),
  setProxyEndpoint: (endpoint) => set({ proxyEndpoint: endpoint }),
  setLocalTerminalIp: (ip, port = 8443) => set({ localTerminalIp: ip, localTerminalPort: port }),
  setActiveTerminalModel: (model) => set({ activeTerminalModel: model }),
  setActiveCurrency: (currency) => set({ activeCurrency: currency }),

  updateTerminalStatus: (poiId, status, battery) => {
    set((state) => ({
      registeredTerminals: state.registeredTerminals.map((t) =>
        t.poiId === poiId
          ? {
              ...t,
              status,
              batteryPercent: battery !== undefined ? battery : t.batteryPercent
            }
          : t
      )
    }));
  },

  /**
   * Sync Store-and-Forward (SaF) Configuration Routine
   * Fetches latest offline ceilings and rules from backend proxy or fallback simulator.
   */
  syncTerminalConfiguration: async (customMerchant, customPoiId) => {
    const state = get();
    const activeTerminal = state.registeredTerminals.find((t) => t.model === state.activeTerminalModel);
    const merchantAccount = customMerchant || state.merchantAccount;
    const poiId = customPoiId || activeTerminal?.poiId || 'S1F2-000154829102';

    set({ isSyncingSafConfig: true, safSyncError: null });

    try {
      let config: AdyenSaFConfig;

      if (state.connectionMode === 'CLOUD_PROXY') {
        const endpoint = `${state.proxyEndpoint.replace(/\/terminal$/, '')}/saf-config`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantAccount, poiId })
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Proxy SaF Sync Error [HTTP ${res.status}]: ${errText}`);
        }

        config = (await res.json()) as AdyenSaFConfig;
      } else {
        // High-Fidelity Simulator with natural latency
        await new Promise((resolve) => setTimeout(resolve, 600));
        config = {
          merchantAccount,
          poiId,
          store: 'MetroCoffee_MainStore',
          safEnabled: true,
          maxSingleTransactionAmount: {
            EUR: 50.00, USD: 50.00, GBP: 45.00, INR: 500.00,
            SGD: 75.00, AUD: 75.00, CAD: 70.00, JPY: 7500.00
          },
          maxCumulativeOfflineAmount: {
            EUR: 500.00, USD: 500.00, GBP: 450.00, INR: 2000.00,
            SGD: 750.00, AUD: 750.00, CAD: 700.00, JPY: 75000.00
          },
          maxOfflineTransactionCount: 100,
          maxOfflineDurationHours: 48,
          allowedPaymentBrands: ['visa', 'mc', 'amex', 'rupay', 'maestro', 'jcb', 'discover'],
          requireOfflinePin: false,
          supportedCurrencies: ['EUR', 'USD', 'GBP', 'INR', 'SGD', 'AUD', 'CAD', 'JPY'],
          lastSyncedTimestamp: new Date().toISOString(),
          configVersion: 'v2026.09-SaF-rev3'
        };
      }

      set({
        safConfig: config,
        isSyncingSafConfig: false,
        lastSafSyncTime: new Date().toISOString(),
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
