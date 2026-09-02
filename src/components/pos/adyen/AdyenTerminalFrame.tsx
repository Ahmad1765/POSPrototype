import React from 'react';
import {
  Smartphone, CreditCard, Radio, Zap,
  Printer, Battery, Wifi, ShieldCheck, Activity,
  Settings, Terminal as TerminalIcon, Sparkles,
  Layers, Lock
} from 'lucide-react';
import { useAdyenConfigStore } from '../../../store/adyenConfigStore';
import type { AdyenTerminalModel } from '../../../types/adyenNexoTypes';

interface AdyenTerminalFrameProps {
  children: React.ReactNode;
  isOnline: boolean;
  onOpenDiagnostics: () => void;
  onOpenSettings: () => void;
  onToggleNexoInspector: () => void;
  isNexoInspectorOpen: boolean;
  nexoLogCount?: number;
}

export const AdyenTerminalFrame: React.FC<AdyenTerminalFrameProps> = ({
  children,
  isOnline,
  onOpenDiagnostics,
  onOpenSettings,
  onToggleNexoInspector,
  isNexoInspectorOpen,
  nexoLogCount = 0
}) => {
  const {
    activeTerminalModel,
    registeredTerminals,
    connectionMode,
    setActiveTerminalModel,
    isOfflineModeAllowed
  } = useAdyenConfigStore();

  const currentTerminal = registeredTerminals.find((t) => t.model === activeTerminalModel) || registeredTerminals[0];

  const getModelBadgeColor = (model: AdyenTerminalModel) => {
    switch (model) {
      case 'S1F2': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'AMS1': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'SATURN_1000F2': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'NYC1': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
      case 'TAP_TO_PAY': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      default: return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* Hardware Model Switcher Bar */}
      <div className="w-full max-w-lg mb-3 flex items-center justify-between gap-1.5 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl shadow-lg select-none">
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 px-1 scrollbar-none">
          {registeredTerminals.map((t) => {
            const isSelected = activeTerminalModel === t.model;
            return (
              <button
                key={t.model}
                type="button"
                onClick={() => setActiveTerminalModel(t.model)}
                className={`px-2.5 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold tracking-tight transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                {t.model === 'S1F2' && <TerminalIcon className="w-3 h-3" />}
                {t.model === 'AMS1' && <Smartphone className="w-3 h-3" />}
                {t.model === 'SATURN_1000F2' && <CreditCard className="w-3 h-3" />}
                {t.model === 'NYC1' && <Radio className="w-3 h-3" />}
                {t.model === 'TAP_TO_PAY' && <Zap className="w-3 h-3" />}
                <span>{t.model.replace(/_/g, ' ')}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Tools Trigger Buttons */}
        <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-zinc-800">
          <button
            type="button"
            onClick={onToggleNexoInspector}
            title="Toggle Nexo 3.0 Protocol Inspector"
            className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-all cursor-pointer ${
              isNexoInspectorOpen
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold hidden sm:inline">Nexo</span>
            {nexoLogCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-zinc-950 font-bold text-[9px] flex items-center justify-center">
                {nexoLogCount > 9 ? '9+' : nexoLogCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenDiagnostics}
            title="Run Terminal Diagnostics (PED & Cloud Test)"
            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition-colors cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            title="Adyen Fleet & SaF Settings"
            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Physical Terminal Hardware Frame */}
      <div className={`w-full max-w-md transition-all duration-300 relative select-none ${
        activeTerminalModel === 'S1F2'
          ? 'bg-zinc-900 border-2 border-zinc-750 rounded-[36px] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.9)] p-2'
          : activeTerminalModel === 'AMS1'
          ? 'bg-zinc-925 border border-zinc-800 rounded-[32px] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.85)] p-1.5'
          : activeTerminalModel === 'SATURN_1000F2'
          ? 'bg-zinc-950 border-4 border-zinc-800 rounded-2xl shadow-[0_30px_60px_-10px_rgba(0,0,0,0.95)] p-3'
          : activeTerminalModel === 'NYC1'
          ? 'bg-zinc-900 border border-zinc-800 rounded-3xl p-2 max-w-xs mx-auto shadow-2xl'
          : 'bg-black border border-zinc-800 rounded-[44px] p-2.5 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.9)]'
      }`}>
        
        {/* MODEL SPECIFIC TOP BEZEL */}
        {activeTerminalModel === 'S1F2' && (
          <div className="w-full bg-zinc-950 px-4 py-2.5 rounded-t-[28px] border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-bold text-zinc-200">ADYEN S1F2</span>
                <span className="text-[8px] font-mono text-zinc-500">Android 11 POS • 5.5&quot; HD</span>
              </div>
            </div>

            {/* Hardware Status Pill */}
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className={`px-2 py-0.5 rounded-full font-bold border text-[9px] ${getModelBadgeColor('S1F2')}`}>
                {connectionMode}
              </span>
              <div className="flex items-center gap-1 text-zinc-400">
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentTerminal.batteryPercent}%</span>
              </div>
            </div>
          </div>
        )}

        {activeTerminalModel === 'AMS1' && (
          <div className="w-full bg-zinc-950 px-4 py-2 rounded-t-[26px] border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono font-bold text-zinc-200">ADYEN AMS1</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-400">
              <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                TABLESIDE
              </span>
              <span>{currentTerminal.batteryPercent}%</span>
            </div>
          </div>
        )}

        {activeTerminalModel === 'SATURN_1000F2' && (
          <div className="w-full bg-zinc-900 px-4 py-2.5 rounded-t-xl border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-mono font-bold text-zinc-100">CASTLES SATURN 1000F2</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-amber-400">
              <Wifi className="w-3 h-3" />
              <span>DIRECT LAN 8443</span>
            </div>
          </div>
        )}

        {activeTerminalModel === 'TAP_TO_PAY' && (
          <div className="w-full pt-1 pb-2 flex flex-col items-center justify-center">
            {/* SoftPOS iPhone Dynamic Island */}
            <div className="w-24 h-4 bg-zinc-900 rounded-full border border-zinc-800 flex items-center justify-between px-2.5 shadow-inner mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
              <div className="w-2 h-2 rounded-full bg-indigo-950 border border-indigo-500/40" />
            </div>
            <div className="flex items-center gap-1 text-[9px] font-mono text-purple-300 font-semibold">
              <Sparkles className="w-2.5 h-2.5 text-purple-400" />
              <span>Tap to Pay on Mobile • Apple / Android</span>
            </div>
          </div>
        )}

        {/* TERMINAL SCREEN CONTAINER */}
        <div className={`w-full overflow-hidden relative ${
          activeTerminalModel === 'TAP_TO_PAY'
            ? 'rounded-[32px] bg-zinc-950 border border-zinc-850'
            : activeTerminalModel === 'SATURN_1000F2'
            ? 'rounded-lg bg-zinc-950 border border-zinc-800'
            : 'rounded-2xl bg-zinc-950'
        }`}>
          {children}
        </div>

        {/* MODEL SPECIFIC BOTTOM HARDWARE BEZEL */}
        {activeTerminalModel === 'S1F2' && (
          <div className="w-full bg-zinc-950 py-3 px-4 rounded-b-[28px] border-t border-zinc-850 flex items-center justify-between mt-1">
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>58mm Thermal Slot</span>
            </div>
            <div className="w-28 h-1 bg-zinc-800 rounded-full shadow-inner border border-zinc-700/40" />
            <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>PCI-PTS 5.x</span>
            </div>
          </div>
        )}

        {activeTerminalModel === 'SATURN_1000F2' && (
          <div className="w-full bg-zinc-900/90 py-3 px-4 rounded-b-xl border-t border-zinc-800 flex flex-col items-center gap-2 mt-1">
            {/* Tactile EMV Chip Card Insertion Slot */}
            <div className="w-40 h-2 bg-zinc-950 rounded-full border border-zinc-700 shadow-inner flex items-center justify-center">
              <div className="w-24 h-0.5 bg-amber-500/40 rounded-full animate-pulse" />
            </div>
            <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
              Insert EMV Chip Card Below • PIN on Glass/Keypad
            </div>
          </div>
        )}

      </div>

      {/* Terminal Footer Telemetry */}
      <div className="w-full max-w-md mt-2 px-3 flex items-center justify-between text-[10px] font-mono text-zinc-500 select-none">
        <span>POI ID: {currentTerminal.poiId}</span>
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span>{isOnline ? 'Adyen Cloud Reachable' : isOfflineModeAllowed ? 'SaF Offline Validated' : 'Offline (No SaF)'}</span>
        </span>
      </div>

    </div>
  );
};
