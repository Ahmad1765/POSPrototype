import React, { useState } from 'react';
import { 
  X, ShieldCheck, Clock, Share2, Copy, Check, 
  Users, Download, CheckCircle2 
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatDateTime, formatINR } from '../utils/currency';

export const DigitalReceiptModal: React.FC = () => {
  const { selectedTransaction, setSelectedTransaction } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [splitCount, setSplitCount] = useState(3);
  const [splitSent, setSplitSent] = useState(false);

  if (!selectedTransaction) return null;

  const handleCopyRef = () => {
    navigator.clipboard?.writeText(selectedTransaction.idempotencyKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const splitAmount = Math.round(selectedTransaction.amount / splitCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-modal-pop flex flex-col border border-zinc-200/80">
        
        {/* Receipt Header */}
        <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Transaction Details
            </h3>
          </div>
          <button
            onClick={() => {
              setSelectedTransaction(null);
              setIsSplitMode(false);
            }}
            className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 active-press flex items-center justify-center text-zinc-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Body */}
        <div className="p-6 space-y-4">
          
          {/* Merchant & Amount */}
          <div className="text-center pb-3 border-b border-dashed border-zinc-200">
            <h4 className="text-base font-bold text-zinc-900">
              {selectedTransaction.merchantName}
            </h4>
            <p className="text-xs text-zinc-500 mt-0.5">
              {selectedTransaction.merchantCategory}
            </p>
            <h2 className="text-3xl font-black text-zinc-900 mt-2 tracking-tight font-mono">
              {selectedTransaction.type === 'CREDIT' ? '+' : '−'} {formatINR(selectedTransaction.amount)}
            </h2>
            
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium">
              {selectedTransaction.status === 'OFFLINE_PENDING' ? (
                <span className="text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Offline Protection Active
                </span>
              ) : (
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Bank Settled & Verified
                </span>
              )}
            </div>
          </div>

          {/* Regular Breakdown or Split Mode */}
          {!isSplitMode ? (
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Date & Time</span>
                <span className="font-medium text-zinc-800">{formatDateTime(selectedTransaction.timestamp)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-500">Payment Mode</span>
                <span className="font-semibold text-zinc-900">{selectedTransaction.paymentMethod}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Transaction ID</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[10px] text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded">
                    {selectedTransaction.idempotencyKey.slice(0, 18)}...
                  </span>
                  <button
                    onClick={handleCopyRef}
                    className="text-brand-600 p-0.5 hover:text-brand-700 active-press"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Split with Friends Banner */}
              <div className="pt-2">
                <button
                  onClick={() => setIsSplitMode(true)}
                  className="w-full p-2.5 bg-orange-50/70 hover:bg-orange-50 border border-orange-200/80 rounded-xl text-left flex items-center justify-between text-xs text-brand-900 active-press"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-600" />
                    <span className="font-semibold">Split this bill with friends</span>
                  </div>
                  <span className="text-[11px] font-bold text-brand-600">Calculate →</span>
                </button>
              </div>
            </div>
          ) : (
            /* Split Bill Calculator Mode */
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900">Split Between</span>
                <span className="text-xs font-bold text-brand-600">{splitCount} People</span>
              </div>

              <div className="flex gap-2">
                {[2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => setSplitCount(count)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
                      splitCount === count
                        ? 'bg-zinc-900 text-white'
                        : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between text-xs">
                <span className="text-zinc-600">Each person pays:</span>
                <span className="text-base font-bold text-zinc-900 font-mono">
                  {formatINR(splitAmount)}
                </span>
              </div>

              {splitSent ? (
                <div className="py-2 text-center text-xs font-semibold text-emerald-600 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Split requests sent via UPI!</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSplitSent(true);
                    setTimeout(() => setSplitSent(false), 3000);
                  }}
                  className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-btn-orange active-press"
                >
                  Send UPI Split Request ({formatINR(splitAmount)} each)
                </button>
              )}

              <button
                onClick={() => setIsSplitMode(false)}
                className="w-full text-center text-[11px] text-zinc-500 hover:text-zinc-800"
              >
                Back to receipt
              </button>
            </div>
          )}

          {/* Share & Download Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => window.print()}
              className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active-press"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={() => {
                navigator.share?.({
                  title: `Receipt for ${selectedTransaction.merchantName}`,
                  text: `Paid ${formatINR(selectedTransaction.amount)} on ${formatDateTime(selectedTransaction.timestamp)}`,
                });
              }}
              className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active-press shadow-btn-orange"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
