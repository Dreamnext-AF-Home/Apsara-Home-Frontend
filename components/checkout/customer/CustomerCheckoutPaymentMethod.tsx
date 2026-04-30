'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';
import { PaymentMethod, PaymentMode } from '@/types/CustomerCheckout/types';
import { CheckoutOnlineBankingProvider } from '@/store/api/paymentApi';
import { AlertCircle } from 'lucide-react';

interface Props {
  selectedMethod: PaymentMethod;
  onSelect: (m: PaymentMethod) => void;
  notice: string;
  paymentMode: PaymentMode;
  paymentModeOptions: PaymentMode[];
  onPaymentModeChange: (mode: PaymentMode) => void;
  selectedOnlineBankingProvider: CheckoutOnlineBankingProvider;
  onOnlineBankingProviderChange: (provider: CheckoutOnlineBankingProvider) => void;
  showOnlineBankingProviderPicker: boolean;
  paymentModeSource?: 'local' | 'admin' | 'hidden';
}

const onlineBankingOptions: Array<{ id: CheckoutOnlineBankingProvider; label: string; description: string }> = [
  { id: 'dob', label: 'BDO', description: 'Currently supported online banking option via PayMongo' },
];
const cardOptions = ['Visa', 'Mastercard'];

const paymentMethods = [
  { id: 'gcash' as PaymentMethod, label: 'GCash', note: 'Pay via GCash wallet', badge: 'Popular', badgeColor: 'bg-blue-500', logos: ['https://1000logos.net/wp-content/uploads/2023/05/GCash-Logo.png'] },
  { id: 'maya' as PaymentMethod, label: 'Maya', note: 'Pay via Maya wallet', badge: 'Fast', badgeColor: 'bg-emerald-500', logos: ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBLMVQZTu66K6hYmx4Ea-VbLaevkjWEHAzWw&s'] },
  { id: 'online_banking' as PaymentMethod, label: 'Online Banking', note: 'Instapay / PesoNet', badge: 'Bank Transfer', badgeColor: 'bg-sky-500', logos: ['https://cdn.simpleicons.org/visa'] },
  { id: 'card' as PaymentMethod, label: 'Credit / Debit Card', note: 'Visa or Mastercard', badge: '3DS Secured', badgeColor: 'bg-slate-700', logos: ['https://cdn.simpleicons.org/visa', 'https://download.logo.wine/logo/Mastercard/Mastercard-Logo.wine.png'] },
];

export default function CustomerCheckoutPaymentMethod({
  selectedMethod,
  onSelect,
  notice,
  paymentMode,
  paymentModeOptions,
  onPaymentModeChange,
  selectedOnlineBankingProvider,
  onOnlineBankingProviderChange,
  showOnlineBankingProviderPicker,
  paymentModeSource = 'hidden',
}: Props) {
  const [selectedCard, setSelectedCard] = useState(cardOptions[0]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700  p-6">
      <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2.5">
        <div className="h-6 w-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center shrink-0">3</div>
        Payment Method
      </h2>

      {paymentModeOptions.length > 1 && (
        <div className="mb-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-300">Payment Mode</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {paymentModeSource === 'local'
                  ? 'Local checkout testing is enabled on this host.'
                  : 'Test mode is currently enabled by admin for customer checkout visibility.'}
              </p>
            </div>
            <div className="inline-flex rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1">
              {paymentModeOptions.map((mode) => {
                const selected = paymentMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onPaymentModeChange(mode)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold capitalize transition ${
                      selected
                        ? 'bg-slate-700 dark:bg-slate-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Method cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {paymentMethods.map(method => {
          const selected = selectedMethod === method.id;
          return (
            <button
              key={method.id}
              onClick={() => onSelect(method.id)}
              className={`text-left rounded-2xl border-2 p-4 transition-all flex items-center gap-3 ${
                selected ? 'border-sky-400 dark:border-sky-600 bg-sky-50 dark:bg-sky-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-sky-200 dark:hover:border-sky-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0  p-1.5 overflow-hidden">
                {method.logos.length === 1 ? (
                  <div className="relative w-full h-full">
                    <Image src={method.logos[0]} alt={method.label} fill className="object-contain" />
                  </div>
                ) : (
                  <div className="flex gap-0.5 w-full h-full items-center justify-center">
                    {method.logos.map(logo => (
                      <div key={logo} className="relative w-4 h-3.5 shrink-0">
                        <Image src={logo} alt="" fill className="object-contain" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{method.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white ${method.badgeColor}`}>{method.badge}</span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{method.note}</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                selected ? 'border-sky-500 dark:border-sky-400 bg-sky-500 dark:bg-sky-500' : 'border-slate-300 dark:border-slate-600'
              }`}>
                {selected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-2 w-2 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bank sub-selector */}
      <AnimatePresence>
        {selectedMethod === 'online_banking' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="mt-3 p-4 rounded-2xl border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-900/20">
              {showOnlineBankingProviderPicker ? (
                <>
                  <p className="text-xs font-bold text-sky-700 dark:text-sky-400 mb-2.5">Choose your bank</p>
                  <p className="mb-3 text-[11px] text-sky-700 dark:text-sky-400/80">Local mode lets you pin the currently supported bank before redirecting to PayMongo.</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {onlineBankingOptions.map(bank => (
                      <button key={bank.id} type="button" onClick={() => onOnlineBankingProviderChange(bank.id)}
                        className={`rounded-xl border-2 px-3 py-3 text-left transition-all ${
                          selectedOnlineBankingProvider === bank.id ? 'border-sky-600 dark:border-sky-500 bg-sky-600 dark:bg-sky-600 text-white' : 'border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 hover:border-sky-400 dark:hover:border-sky-600'
                        }`}>
                        <p className="text-xs font-bold">{bank.label}</p>
                        <p className={`mt-1 text-[11px] ${selectedOnlineBankingProvider === bank.id ? 'text-sky-100' : 'text-sky-700 dark:text-sky-400/70'}`}>{bank.description}</p>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-sky-700 dark:text-sky-400">Bank selection will continue on the PayMongo payment page.</p>
                  <p className="mt-2 text-[11px] text-sky-700 dark:text-sky-400/80">Live mode sends only the currently supported online banking option to PayMongo, so the final bank UI will appear after redirect.</p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card sub-selector */}
      <AnimatePresence>
        {selectedMethod === 'card' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="mt-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">Select card type</p>
              <div className="flex gap-2">
                {cardOptions.map(card => (
                  <button key={card} onClick={() => setSelectedCard(card)}
                    className={`flex-1 py-2.5 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                      selectedCard === card ? 'border-slate-800 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 ' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="relative w-10 h-6 shrink-0">
                      <Image src={`/payment-logos/${card.toLowerCase()}.svg`} alt={card} fill className="object-contain" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{card}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notice */}
      <AnimatePresence>
        {notice && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">{notice}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
