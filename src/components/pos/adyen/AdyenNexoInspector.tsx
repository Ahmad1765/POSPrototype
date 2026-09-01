import React, { useState, useEffect } from 'react';
import {
  X, Layers, Copy, Check, Trash2, ArrowUpRight, ArrowDownLeft,
  Filter, Clock, Code, ShieldCheck
} from 'lucide-react';
import { adyenTerminalService, type NexoLogEntry } from '../../../utils/adyenTerminalService';

interface AdyenNexoInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  onLogCountChange?: (count: number) => void;
}

export const AdyenNexoInspector: React.FC<AdyenNexoInspectorProps> = ({
  isOpen,
  onClose,
  onLogCountChange
}) => {
  const [logs, setLogs] = useState<NexoLogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<NexoLogEntry | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = adyenTerminalService.subscribeToNexoLogs((newEntry) => {
      setLogs((prev) => {
        const updated = [newEntry, ...prev.slice(0, 49)];
        if (onLogCountChange) onLogCountChange(updated.length);
        return updated;
      });
      // Auto-select latest
      setSelectedLog(newEntry);
    });

    return () => unsubscribe();
  }, [onLogCountChange]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (filterCategory === 'ALL') return true;
    return log.category.toUpperCase() === filterCategory.toUpperCase();
  });

  const handleCopyJson = (payload: unknown, id: string) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setLogs([]);
    setSelectedLog(null);
    if (onLogCountChange) onLogCountChange(0);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col font-sans animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Nexo 3.0 Protocol Inspector</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ISO 20022
              </span>
            </h3>
            <p className="text-[10px] text-zinc-400">Live SaleToPOI Request & Response Envelopes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-rose-400 text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Clear Log History"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-2.5 bg-zinc-925 border-b border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono">
        <Filter className="w-3 h-3 text-zinc-500 ml-1 shrink-0" />
        {['ALL', 'Payment', 'TransactionStatus', 'Diagnosis', 'Reversal'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filterCategory === cat
                ? 'bg-emerald-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        
        {/* Left List Stream */}
        <div className="md:col-span-5 border-r border-zinc-800/80 overflow-y-auto p-2 space-y-1.5 max-h-[40vh] md:max-h-full">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-zinc-600 text-xs font-mono">
              <div>No Nexo messages captured yet.</div>
              <div className="text-[10px] text-zinc-700 mt-1">Initiate a charge or diagnosis to inspect payloads.</div>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isSelected = selectedLog?.id === log.id;
              const isRequest = log.direction === 'REQUEST';
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                      : 'bg-zinc-900/60 border-zinc-850 hover:border-zinc-750 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      {isRequest ? (
                        <span className="w-4 h-4 rounded-md bg-sky-500/20 text-sky-400 flex items-center justify-center text-[9px] font-bold">
                          <ArrowUpRight className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="w-4 h-4 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9px] font-bold">
                          <ArrowDownLeft className="w-3 h-3" />
                        </span>
                      )}
                      <span className="text-[11px] font-bold font-mono truncate">{log.category}</span>
                    </div>
                    {log.latencyMs !== undefined && (
                      <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {log.latencyMs}ms
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
                    <span className="truncate">SID: {log.serviceId}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right JSON Detail Inspector */}
        <div className="md:col-span-7 flex flex-col bg-zinc-950 overflow-hidden">
          {selectedLog ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-zinc-200">
                    {selectedLog.direction} • {selectedLog.category}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyJson(selectedLog.payload, selectedLog.id)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedId === selectedLog.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>

              {/* Formatted JSON Viewer */}
              <div className="flex-1 p-3 overflow-y-auto font-mono text-[10.5px] leading-relaxed text-zinc-300 bg-zinc-950 select-text">
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(selectedLog.payload, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-600 text-xs font-mono p-6 text-center">
              Select a message envelope from the left stream to inspect raw Nexo 3.0 ISO 20022 JSON.
            </div>
          )}
        </div>

      </div>

      {/* Footer Compliance Notice */}
      <div className="p-2.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <ShieldCheck className="w-3 h-3" />
          <span>Nexo IS0 20022 / SaleToPOI 3.0 Schema Compliant</span>
        </div>
        <span>{logs.length} events</span>
      </div>

    </div>
  );
};
