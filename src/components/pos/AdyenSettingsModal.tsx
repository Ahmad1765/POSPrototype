import React, { useEffect } from 'react';
import { useAdyenConfigStore, type AdyenConnectionMode } from '../../store/adyenConfigStore';

interface AdyenSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdyenSettingsModal: React.FC<AdyenSettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    merchantAccount,
    environment,
    connectionMode,
    activeTerminalModel,
    activeCurrency,
    safConfig,
    isSyncingSafConfig,
    lastSafSyncTime,
    isOfflineModeAllowed,
    safSyncError,
    syncTerminalConfiguration,
    setConnectionMode,
    setEnvironment
  } = useAdyenConfigStore();

  // Optionally auto-sync when the modal opens if we don't have a config yet
  useEffect(() => {
    if (isOpen && !safConfig && !isSyncingSafConfig) {
      syncTerminalConfiguration().catch(() => {});
    }
  }, [isOpen, safConfig, isSyncingSafConfig, syncTerminalConfiguration]);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    try {
      await syncTerminalConfiguration();
    } catch (error) {
      console.error('Manual sync failed', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-2xl text-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-black px-6 py-5 border-b border-gray-800 flex justify-between items-center rounded-t-xl">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">Adyen Terminal Fleet Settings</h2>
            <p className="text-sm text-gray-400 mt-1">
              Manage cloud routing and offline configurations for <span className="text-gray-200 font-mono text-xs">{merchantAccount}</span>.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* General Config Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Connection & Environment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                <label className="block text-xs text-gray-400 mb-2">Connection Mode</label>
                <select 
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-white outline-none cursor-pointer"
                  value={connectionMode}
                  onChange={(e) => setConnectionMode(e.target.value as AdyenConnectionMode)}
                >
                  <option value="SIMULATOR">High-Fidelity Simulator</option>
                  <option value="CLOUD_PROXY">Adyen Cloud API (Proxy)</option>
                  <option value="LOCAL_IP">Local Network (LAN)</option>
                </select>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                <label className="block text-xs text-gray-400 mb-2">Environment</label>
                <select 
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-white outline-none cursor-pointer"
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as 'TEST' | 'LIVE_EU' | 'LIVE_US')}
                >
                  <option value="TEST">Adyen Test Environment</option>
                  <option value="LIVE_EU">Live (EU Region)</option>
                  <option value="LIVE_US">Live (US Region)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Store and Forward Section */}
          <section className="space-y-4">
            <div className="flex justify-between items-end">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Store and Forward (SaF) Policy</h3>
              <button
                onClick={handleManualSync}
                disabled={isSyncingSafConfig}
                className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-3 py-1.5 rounded border border-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {isSyncingSafConfig ? (
                  <>
                    <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                    Syncing...
                  </>
                ) : (
                  'Sync Customer Area Policies'
                )}
              </button>
            </div>

            <div className="bg-black p-5 rounded-lg border border-gray-800 relative overflow-hidden">
              {/* Dynamic Status Indicator */}
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b" 
                   style={{ backgroundImage: isOfflineModeAllowed ? 'linear-gradient(to bottom, #10b981, #047857)' : 'linear-gradient(to bottom, #ef4444, #b91c1c)' }} 
              />
              
              <div className="flex items-center justify-between mb-6 ml-2">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${isOfflineModeAllowed ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="font-medium text-gray-200">
                      Offline Mode {isOfflineModeAllowed ? 'Enabled & Verified' : 'Disabled / Unverified'}
                    </span>
                  </div>
                  {lastSafSyncTime && (
                    <p className="text-xs text-gray-500 mt-1">Last synced: {lastSafSyncTime} • Terminal: {activeTerminalModel}</p>
                  )}
                </div>
              </div>

              {safSyncError && (
                <div className="ml-2 mb-4 p-3 bg-red-950/30 border border-red-900/50 rounded text-sm text-red-400">
                  ⚠️ {safSyncError}
                </div>
              )}

              {safConfig ? (
                <div className="ml-2 grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Max Single Transaction ({activeCurrency})</label>
                    <div className="text-2xl font-light text-white">
                      {safConfig.maxSingleTransactionAmount[activeCurrency]?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Max Cumulative Offline ({activeCurrency})</label>
                    <div className="text-2xl font-light text-white">
                      {safConfig.maxCumulativeOfflineAmount[activeCurrency]?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Max Offline Batch Size</label>
                    <div className="text-lg text-gray-300">
                      {safConfig.maxOfflineTransactionCount} Transactions
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Allowed Card Brands</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {safConfig.allowedPaymentBrands.slice(0, 4).map(brand => (
                        <span key={brand} className="text-[10px] uppercase bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded border border-gray-700">
                          {brand}
                        </span>
                      ))}
                      {safConfig.allowedPaymentBrands.length > 4 && (
                        <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700">
                          +{safConfig.allowedPaymentBrands.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ml-2 py-6 text-center text-sm text-gray-500 border border-dashed border-gray-700 rounded-lg">
                  No Store & Forward configuration loaded.<br/>Sync with Customer Area to enable offline payments.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-gray-900 px-6 py-4 border-t border-gray-800 flex justify-end rounded-b-xl">
          <button 
            onClick={onClose}
            className="bg-white text-black hover:bg-gray-200 px-6 py-2 rounded font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
