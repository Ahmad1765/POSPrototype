import React, { useState } from 'react';
import { X, Search, Clock } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatINR } from '../utils/currency';

export const SearchModal: React.FC = () => {
  const { activeModal, closeModal, transactions, setSelectedTransaction } = useAppStore();
  const [query, setQuery] = useState('');

  if (activeModal !== 'SEARCH') return null;

  const filtered = transactions.filter(
    (t) =>
      t.merchantName.toLowerCase().includes(query.toLowerCase()) ||
      t.merchantCategory.toLowerCase().includes(query.toLowerCase()) ||
      t.amount.toString().includes(query)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-slate-100 max-h-[85vh]">
        
        {/* Search Header */}
        <div className="p-4 bg-slate-50 flex items-center gap-3 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search merchants, categories, or amounts..."
            autoFocus
            className="flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
          />
          <button
            onClick={closeModal}
            className="w-7 h-7 rounded-full bg-slate-200/80 hover:bg-slate-300 active-press flex items-center justify-center text-slate-600 text-xs font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Stream */}
        <div className="p-4 overflow-y-auto divide-y divide-slate-100 flex-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No matching transactions or merchants found.
            </div>
          ) : (
            filtered.map((tx) => (
              <div
                key={tx.id}
                onClick={() => {
                  setSelectedTransaction(tx);
                }}
                className="py-3 flex items-center justify-between hover:bg-slate-50 rounded-xl px-2 cursor-pointer transition-colors"
              >
                <div>
                  <h5 className="text-xs font-bold text-slate-900">{tx.merchantName}</h5>
                  <p className="text-[10px] text-slate-400">{tx.merchantCategory}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-extrabold text-slate-900">{formatINR(tx.amount)}</p>
                  <span className="text-[9px] text-brand-600 font-semibold flex items-center justify-end gap-0.5">
                    <Clock className="w-2.5 h-2.5" /> View Receipt
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const NotificationDrawer: React.FC = () => {
  const { activeModal, closeModal, isOnline } = useAppStore();

  if (activeModal !== 'NOTIFICATIONS') return null;

  const notifications = [
    {
      id: 1,
      title: isOnline ? 'Acquirer Batch Synced' : 'Terminal in Offline Mode',
      desc: isOnline
        ? 'All pending Store-and-Forward items synced successfully with NestJS Cloud.'
        : 'Transactions will be signed with HMAC-SHA256 and queued locally until network recovers.',
      time: 'Just now',
      unread: true,
    },
    {
      id: 2,
      title: 'RBI Domestic Limit Update',
      desc: 'Contactless NFC limit configured to ₹5,000 per tap per RBI framework.',
      time: '2 hours ago',
      unread: true,
    },
    {
      id: 3,
      title: 'Monthly CashBack Ready',
      desc: '4,850 reward points available for instant 1:1 INR redemption.',
      time: 'Yesterday',
      unread: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-slate-100">
        <div className="p-4 bg-slate-50 flex items-center justify-between border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-800">Notifications & Alerts</h3>
          <button
            onClick={closeModal}
            className="w-7 h-7 rounded-full bg-slate-200/80 hover:bg-slate-300 active-press flex items-center justify-center text-slate-600 text-xs font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2.5">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 rounded-2xl border text-xs ${
                n.unread ? 'bg-orange-50/60 border-orange-100' : 'bg-slate-50 border-slate-100'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <h5 className="font-bold text-slate-900">{n.title}</h5>
                <span className="text-[10px] text-slate-400">{n.time}</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">{n.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
