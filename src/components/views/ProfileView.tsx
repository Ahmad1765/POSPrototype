import React, { useState } from 'react';
import { 
  ShieldCheck, QrCode, Smartphone, 
  ChevronRight, Copy, Check, MessageSquare, 
  FileText, Zap 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const ProfileView: React.FC = () => {
  const { user, updateUserProfile, openModal, isOnline, toggleOnlineStatus } = useAppStore();
  const [copiedUpi, setCopiedUpi] = useState(false);

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(user.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div className="px-5 space-y-6 pb-28 animate-in fade-in duration-200">
      
      {/* 1. Profile Header Card */}
      <div className="pt-2">
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-subtle flex items-center gap-4">
          <div className="relative">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-brand-500 shadow-subtle"
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border-2 border-white">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900 truncate">{user.name}</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                KYC Verified
              </span>
            </div>
            
            <p className="text-xs text-zinc-500 mt-0.5">{user.phone}</p>
            
            {/* UPI ID with Copy Shortcut */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-mono text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md truncate max-w-[170px]">
                {user.upiId}
              </span>
              <button
                onClick={handleCopyUpi}
                className="text-[10px] font-semibold text-brand-600 hover:text-brand-700 p-1 flex items-center gap-0.5 active-press"
              >
                {copiedUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. My QR Code Shortcut */}
      <button
        onClick={() => openModal('QR_SCANNER')}
        className="w-full bg-gradient-to-r from-zinc-900 to-black text-white rounded-2xl p-4 border border-white/10 shadow-subtle flex items-center justify-between active-press"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
            <QrCode className="w-5 h-5 text-brand-400" />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-bold text-white">Receive Money via UPI QR</h4>
            <p className="text-[11px] text-zinc-400">Show customized QR code with amount</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-400" />
      </button>

      {/* 3. Security & App Preferences */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-subtle overflow-hidden divide-y divide-zinc-100">
        <div className="px-4 py-2.5 bg-zinc-50/50">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Security & Preferences
          </h3>
        </div>

        {/* Biometrics Toggle */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900">Biometric Authentication</h4>
              <p className="text-[11px] text-zinc-500">Require Face ID / Fingerprint for payments</p>
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

        {/* Offline Smart Engine Toggle */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-brand-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900">Offline Payment Shield</h4>
              <p className="text-[11px] text-zinc-500">Store & forward encrypted offline payments</p>
            </div>
          </div>
          <button
            onClick={toggleOnlineStatus}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors active-press ${
              isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {isOnline ? 'Online' : 'Offline'}
          </button>
        </div>
      </div>

      {/* 4. Help, Support & Compliance */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-subtle overflow-hidden divide-y divide-zinc-100">
        <div className="px-4 py-2.5 bg-zinc-50/50">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Help & Regulatory
          </h3>
        </div>

        <button 
          onClick={() => {}} 
          className="w-full p-4 flex items-center justify-between hover:bg-zinc-50/70 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900">24/7 Priority Support</h4>
              <p className="text-[11px] text-zinc-500">Chat with dedicated banking assistant</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        </button>

        <button 
          onClick={() => {}} 
          className="w-full p-4 flex items-center justify-between hover:bg-zinc-50/70 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900">Terms of Service & Privacy</h4>
              <p className="text-[11px] text-zinc-500">NPCI & RBI Certified Payment Guidelines</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* App Version & Certified Security */}
      <div className="text-center pt-2 pb-4 text-zinc-400 text-[11px] space-y-1">
        <p className="font-semibold text-zinc-600">BharatPay Consumer FinTech • v2.4.0</p>
        <p>256-bit SSL • PCI-DSS Level 1 Certified • RBI Authorized</p>
      </div>

    </div>
  );
};
