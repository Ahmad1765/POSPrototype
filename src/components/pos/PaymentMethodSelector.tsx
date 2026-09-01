import React from 'react';
import { CreditCard, Radio, Zap, Wallet, QrCode } from 'lucide-react';
import type { PaymentMethodType } from '../../types/pos';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType;
  onSelectMethod: (method: PaymentMethodType) => void;
  disabled?: boolean;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
  disabled = false
}) => {
  const methods: Array<{
    id: PaymentMethodType;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: 'ADYEN_NFC',
      label: 'Adyen Tap',
      sublabel: 'NFC Contactless / SoftPOS',
      icon: <Radio className="w-4 h-4 sm:w-5 sm:h-5" />,
      badge: 'Nexo 3.0'
    },
    {
      id: 'ADYEN_CARD',
      label: 'Adyen Chip',
      sublabel: 'EMV Chip & PIN / PED',
      icon: <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />,
      badge: 'Nexo 3.0'
    },
    {
      id: 'ADYEN_QR',
      label: 'Adyen QR / APMs',
      sublabel: 'Alipay / WeChat / Webhook',
      icon: <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />,
      badge: 'Async 3-5s'
    },
    {
      id: 'UPI_LITE',
      label: 'UPI Lite',
      sublabel: 'RBI On-Device Offline',
      icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5" />,
      badge: 'Offline OK'
    },
    {
      id: 'CRYPTO_WALLET',
      label: 'Crypto Web3',
      sublabel: 'USDT / ETH / SOL Offline',
      icon: <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />,
      badge: 'Offline OK'
    }
  ];

  return (
    <div className="w-full flex flex-col gap-1.5 sm:gap-2 select-none">
      <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-zinc-400 px-0.5">
        <span>PAYMENT METHOD</span>
        <span className="text-[9px] sm:text-[10px] text-zinc-500 font-mono">ISO 20022 / WEB3</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
        {methods.map((method) => {
          const isSelected = selectedMethod === method.id;
          return (
            <button
              key={method.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectMethod(method.id)}
              className={`p-2 sm:p-2.5 rounded-xl border flex flex-col items-start gap-1 text-left transition-all duration-150 active:scale-[0.98] relative overflow-hidden cursor-pointer ${
                isSelected
                  ? 'bg-zinc-800/95 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.12)] text-white'
                  : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="w-full flex items-center justify-between">
                <div className={`p-1 rounded-lg ${isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                  {method.icon}
                </div>
                {method.badge && (
                  <span className={`text-[8px] font-semibold px-1 py-0.2 rounded font-mono ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                  }`}>
                    {method.badge}
                  </span>
                )}
              </div>

              <div>
                <div className="text-[11px] font-semibold tracking-tight text-zinc-100">{method.label}</div>
                <div className="text-[9px] text-zinc-400 truncate max-w-[110px]">{method.sublabel}</div>
              </div>

              {isSelected && (
                <div className="absolute top-0 right-0 w-6 h-6 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
