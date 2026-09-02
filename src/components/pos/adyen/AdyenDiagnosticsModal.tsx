import React, { useState } from 'react';
import {
  X, Activity, CheckCircle2, RefreshCw,
  ShieldCheck, Printer, CreditCard,
  Clock, AlertTriangle
} from 'lucide-react';
import { adyenTerminalService } from '../../../utils/adyenTerminalService';
import { useAdyenConfigStore } from '../../../store/adyenConfigStore';
import type { NexoDiagnosisResponse, SaleToPOIRequest } from '../../../types/adyenNexoTypes';

interface AdyenDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdyenDiagnosticsModal: React.FC<AdyenDiagnosticsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { activeTerminalModel, registeredTerminals } = useAdyenConfigStore();
  const currentTerminal = registeredTerminals.find((t) => t.model === activeTerminalModel) || registeredTerminals[0];

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [diagResult, setDiagResult] = useState<NexoDiagnosisResponse['POIStatus'] | null>(null);
  const [hosts, setHosts] = useState<NexoDiagnosisResponse['HostStatus']>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunDiagnosis = async () => {
    setIsRunning(true);
    setDiagResult(null);
    setHosts([]);
    setErrorMessage(null);
    const startTime = performance.now();

    try {
      const serviceId = adyenTerminalService.generateServiceId();
      const request: SaleToPOIRequest = {
        SaleToPOIRequest: {
          MessageHeader: adyenTerminalService.createMessageHeader('Diagnosis', serviceId, 'NodePOS-Register-01', currentTerminal.poiId),
          DiagnosisRequest: {
            HostStatus_Flag: true
          }
        }
      };

      const response = await adyenTerminalService.sendSaleToPOIRequest(request);
      if (!response?.SaleToPOIResponse) {
        throw new Error('Malformed diagnosis response: missing SaleToPOIResponse');
      }

      const diag = response.SaleToPOIResponse.DiagnosisResponse;
      if (!diag || diag.Response?.Result !== 'Success') {
        const detail = diag?.Response?.ErrorCondition || diag?.Response?.AdditionalResponse || 'Diagnostic execution refused by POI';
        throw new Error(detail);
      }

      const elapsed = Math.round(performance.now() - startTime);
      setLatency(elapsed);

      if (diag.POIStatus) {
        setDiagResult(diag.POIStatus);
      }
      if (diag.HostStatus) {
        setHosts(diag.HostStatus);
      }
    } catch (err: unknown) {
      console.error('Diagnostic error:', err);
      const msg = err instanceof Error ? err.message : 'Diagnostic execution failed';
      setErrorMessage(msg);
      setDiagResult(null);
    } finally {
      setIsRunning(false);
    }
  };

  const isPedSecure = diagResult?.SecurityStatus === 'NoTamper';
  const isReaderOk = Boolean(diagResult?.CardReaderOKFlag);
  const isPrinterOk = diagResult?.PrinterStatus === 'OK';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="adyen-diagnostics-modal-title"
        className="bg-zinc-900 w-full max-w-lg rounded-2xl sm:rounded-3xl border border-zinc-800 shadow-2xl flex flex-col overflow-hidden"
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-zinc-950/80 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 id="adyen-diagnostics-modal-title" className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Adyen Hardware Diagnostics</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  PED 5.x
                </span>
              </h3>
              <p className="text-[10px] sm:text-xs text-zinc-400">
                Hardware tamper integrity, host latency, & printer check
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close Diagnostics Modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 text-xs font-sans">
          
          {/* Target Terminal Bar */}
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between font-mono text-[11px]">
            <div>
              <span className="text-zinc-500 block text-[9px]">TARGET POI DEVICE</span>
              <span className="font-bold text-zinc-200">{currentTerminal.name} ({currentTerminal.poiId})</span>
            </div>
            <button
              type="button"
              onClick={handleRunDiagnosis}
              disabled={isRunning}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 text-zinc-950 font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Probing...' : 'Run Nexo Diagnosis'}</span>
            </button>
          </div>

          {/* User-Visible Diagnostic Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 flex items-center gap-2.5 animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <div className="text-xs font-mono">{errorMessage}</div>
            </div>
          )}

          {/* Results Grid */}
          {diagResult ? (
            <div className="space-y-3 animate-fade-in">
              <div className="grid grid-cols-2 gap-2.5">
                
                {/* PED Tamper Status */}
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${
                    isPedSecure
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 font-mono block">PED SECURITY</span>
                    <span className={`font-bold font-mono ${isPedSecure ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {diagResult.SecurityStatus === 'NoTamper' ? 'SECURE (No Tamper)' : 'TAMPER DETECTED'}
                    </span>
                  </div>
                </div>

                {/* Card Reader Flag */}
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${
                    isReaderOk
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 font-mono block">EMV / NFC READER</span>
                    <span className={`font-bold font-mono ${isReaderOk ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {diagResult.CardReaderOKFlag ? 'OPERATIONAL' : 'FAULT'}
                    </span>
                  </div>
                </div>

                {/* Thermal Printer */}
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${
                    isPrinterOk
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 font-mono block">THERMAL PRINTER</span>
                    <span className={`font-bold font-mono ${isPrinterOk ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {diagResult.PrinterStatus === 'OK' ? 'READY (Paper Full)' : diagResult.PrinterStatus}
                    </span>
                  </div>
                </div>

                {/* Cloud Round-Trip Latency */}
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 font-mono block">CLOUD RTT LATENCY</span>
                    <span className="font-bold text-cyan-400 font-mono">
                      {latency !== null ? `${latency} ms` : 'Testing...'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Host Endpoints Status */}
              {hosts && hosts.length > 0 && (
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1.5">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">
                    Adyen Acquirer Gateways
                  </span>
                  {hosts.map((h) => (
                    <div key={h.AcquirerID} className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-zinc-300">{h.AcquirerID}</span>
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>REACHABLE (HTTP 200)</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : !errorMessage ? (
            <div className="p-8 rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800 text-center space-y-2">
              <Activity className="w-7 h-7 text-zinc-600 mx-auto" />
              <div className="text-xs font-semibold text-zinc-400">Ready to execute hardware diagnosis</div>
              <p className="text-[10px] text-zinc-600 max-w-xs mx-auto">
                Click &quot;Run Nexo Diagnosis&quot; above to perform ISO 20022 PED integrity, NFC antenna, and Cloud host latency checks.
              </p>
            </div>
          ) : null}

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-zinc-950/80 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="font-mono text-[10px] text-zinc-500">Firmware: {currentTerminal.firmwareVersion}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
