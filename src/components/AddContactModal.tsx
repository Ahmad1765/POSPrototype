import React, { useState } from 'react';
import { X, UserPlus, Check, Sparkles, AtSign } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../store/useAppStore';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

const UPI_HANDLES = ['@okaxis', '@okhdfcbank', '@paytm', '@ybl', '@upi'];

export const AddContactModal: React.FC = () => {
  const { activeModal, closeModal, addContact } = useAppStore();
  const [name, setName] = useState('');
  const [upiPrefix, setUpiPrefix] = useState('');
  const [selectedHandle, setSelectedHandle] = useState('@okaxis');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [isSuccess, setIsSuccess] = useState(false);

  if (activeModal !== 'ADD_CONTACT') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !upiPrefix.trim()) return;

    const fullUpi = upiPrefix.includes('@') ? upiPrefix.trim().toLowerCase() : `${upiPrefix.trim().toLowerCase()}${selectedHandle}`;

    addContact({
      name: name.trim(),
      avatar: selectedAvatar,
      upiId: fullUpi,
    });

    setIsSuccess(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    setTimeout(() => {
      setIsSuccess(false);
      setName('');
      setUpiPrefix('');
      closeModal();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-modal-pop flex flex-col border border-zinc-200/80">
        
        {/* Header */}
        <div className="p-4 bg-zinc-50/80 flex items-center justify-between border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-brand-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Add New Beneficiary</h3>
              <p className="text-[10px] text-zinc-400">Save contact for instant 1-tap transfers</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-white hover:bg-zinc-100 active-press flex items-center justify-center text-zinc-500 border border-zinc-200/60 shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Avatar Selector */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-2">
              Select Contact Avatar
            </label>
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
              {PRESET_AVATARS.map((avatar, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 transition-all active-press relative ${
                    selectedAvatar === avatar
                      ? 'border-brand-500 ring-2 ring-brand-500/30 scale-105'
                      : 'border-zinc-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={avatar} alt="Preset Avatar" className="w-full h-full object-cover" />
                  {selectedAvatar === avatar && (
                    <div className="absolute inset-0 bg-brand-500/20 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Full Name Input */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
              Full Legal Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rohan Mehta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 outline-none focus:border-brand-500 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* UPI ID Input */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
              UPI ID or Phone Handle
            </label>
            <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden focus-within:border-brand-500 focus-within:bg-white transition-all">
              <div className="pl-3 text-zinc-400">
                <AtSign className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                required
                placeholder="rohanmehta"
                value={upiPrefix}
                onChange={(e) => setUpiPrefix(e.target.value)}
                className="w-full px-2.5 py-2.5 bg-transparent text-xs text-zinc-800 outline-none font-mono font-semibold"
              />
              {!upiPrefix.includes('@') && (
                <span className="pr-3 text-xs font-mono text-zinc-400 font-semibold select-none">
                  {selectedHandle}
                </span>
              )}
            </div>

            {/* UPI Handle Quick Preset Chips */}
            {!upiPrefix.includes('@') && (
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar">
                {UPI_HANDLES.map((handle) => (
                  <button
                    type="button"
                    key={handle}
                    onClick={() => setSelectedHandle(handle)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-colors active-press ${
                      selectedHandle === handle
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {handle}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!name.trim() || !upiPrefix.trim() || isSuccess}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-btn-orange flex items-center justify-center gap-2 active-press transition-all mt-2"
          >
            {isSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Contact Saved!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Save Beneficiary Contact</span>
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
};
