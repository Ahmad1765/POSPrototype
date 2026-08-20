import React, { useState } from 'react';
import { 
  ShieldCheck, QrCode, Smartphone, ChevronRight, 
  Copy, Check, MessageSquare, FileText, Zap, 
  Mail, Phone 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const WebProfileSection: React.FC = () => {
  const { user, updateUserProfile, openModal, isOnline, toggleOnlineStatus } = useAppStore();
  const [copiedUpi, setCopiedUpi] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(user.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-200 max-w-5xl">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Account & Security Settings</h2>
        <p className="text-xs text-zinc-500">Manage identity, linked payment IDs, and offline wallet parameters</p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-brand-500 shadow-md"
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-zinc-900">{user.name}</h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                KYC Level 3 Verified
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-zinc-400" /> {user.phone}</span>
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-zinc-400" /> {user.email}</span>
            </div>

            {/* UPI ID */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-mono text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-lg">
                {user.upiId}
              </span>
              <button
                onClick={handleCopy}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 p-1"
              >
                {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => openModal('QR_SCANNER')}
          className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm active-press"
        >
          <QrCode className="w-4 h-4 text-brand-400" />
          <span>Show Merchant QR</span>
        </button>
      </div>

      {/* Security & Preferences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Security Box */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-subtle p-6 space-y-4">
          <h4 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3">
            Security & Authentication
          </h4>

          {/* Biometrics */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-zinc-900">Biometric Authentication</p>
                <p className="text-[11px] text-zinc-500">Require Face ID / Touch ID for payments</p>
              </div>
            </div>
            <button
              onClick={() => updateUserProfile({ biometricsEnabled: !user.biometricsEnabled })}
              className={`w-11 h-6 rounded-full transition-colors relative active-press ${
                user.biometricsEnabled ? 'bg-brand-500' : 'bg-zinc-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  user.biometricsEnabled ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Offline Protection */}
          <div className="flex items-center justify-between text-xs pt-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-brand-600">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-zinc-900">Offline Payment Shield</p>
                <p className="text-[11px] text-zinc-500">Enable HMAC-SHA256 store & forward</p>
              </div>
            </div>
            <button
              onClick={toggleOnlineStatus}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isOnline ? 'Online' : 'Offline'}
            </button>
          </div>
        </div>

        {/* Support & Regulatory Box */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-subtle p-6 space-y-3">
          <h4 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3">
            Support & Help Desk
          </h4>

          <button
            onClick={() => {}}
            className="w-full p-3 rounded-xl hover:bg-zinc-50 flex items-center justify-between transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900">24/7 Dedicated Support</p>
                <p className="text-[11px] text-zinc-500">Direct concierge for enterprise merchants</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400" />
          </button>

          <button
            onClick={() => {}}
            className="w-full p-3 rounded-xl hover:bg-zinc-50 flex items-center justify-between transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900">Terms & Compliance Guidelines</p>
                <p className="text-[11px] text-zinc-500">NPCI UPI & RBI Master Circulars</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

      </div>

    </div>
  );
};
