import React from 'react';
import { X, ShieldCheck, Clock, Printer, Share2, Copy, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatDateTime, formatINR } from '../utils/currency';

export const DigitalReceiptModal: React.FC = () => {
  const { selectedTransaction, setSelectedTransaction, user } = useAppStore();
  const [copied, setCopied] = React.useState(false);

  if (!selectedTransaction) return null;

  const handleCopyHash = () => {
    navigator.clipboard?.writeText(selectedTransaction.payloadSignature);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-slate-100">
        
        {/* Receipt Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Bharat POS Digital Receipt
            </h3>
          </div>
          <button
            onClick={() => setSelectedTransaction(null)}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 active-press flex items-center justify-center text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Body */}
        <div className="p-6 space-y-4">
          
          {/* Merchant & Amount */}
          <div className="text-center pb-3 border-b border-dashed border-slate-200">
            <h4 className="text-base font-black text-slate-900">
              {selectedTransaction.merchantName}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedTransaction.merchantCategory}
            </p>
            <h2 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
              {formatINR(selectedTransaction.amount)}
            </h2>
            
            <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border">
              {selectedTransaction.status === 'OFFLINE_PENDING' ? (
                <span className="text-amber-600 bg-amber-50 border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Stored Offline (Pending Sync)
                </span>
              ) : (
                <span className="text-emerald-600 bg-emerald-50 border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Acquirer Settled & Verified
                </span>
              )}
            </div>
          </div>

          {/* Technical Metadata (Complies with Offline POS Blueprint) */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Terminal Code:</span>
              <span className="font-mono font-bold text-slate-800">{user.terminalCode}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Date & Time:</span>
              <span className="font-medium text-slate-700">{formatDateTime(selectedTransaction.timestamp)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Payment Mode:</span>
              <span className="font-bold text-slate-800">{selectedTransaction.paymentMethod}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Idempotency Key:</span>
              <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                {selectedTransaction.idempotencyKey}
              </span>
            </div>

            {/* Cryptographic Signature */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  HMAC-SHA256 Security Hash
                </span>
                <button
                  onClick={handleCopyHash}
                  className="flex items-center gap-1 text-[10px] text-brand-600 hover:text-brand-700 active-press font-semibold"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="font-mono text-[10px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200/60 break-all select-all">
                {selectedTransaction.payloadSignature}
              </p>
            </div>
          </div>

          {/* Print & Share Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => window.print()}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active-press"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={() => alert('Receipt link copied to clipboard.')}
              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-550 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active-press shadow-btn-orange"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
