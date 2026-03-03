'use client';

import { CategoryProduct } from '@/libs/CategoryData';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useMemo, useState, useEffect } from 'react';
import Loading from '../Loading';
import { useRouter } from 'next/navigation';
import { useCreateCheckoutSessionMutation } from '@/store/api/paymentApi';
import { useSession } from 'next-auth/react';

interface BuyNowOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: CategoryProduct;
  quantity?: number;
  selectedColor?: string;
  selectedSize?: string;
  selectedType?: string;
}

type PaymentMethod = 'online_banking' | 'card' | 'gcash' | 'maya';

const onlineBankingOptions = ['BPI', 'BDO', 'UnionBank', 'Landbank'];
const cardOptions = ['Visa', 'Mastercard'];

const paymentMethods: Array<{
  id: PaymentMethod;
  label: string;
  note: string;
  badge: string;
  iconBg: string;
  icon: React.ReactNode;
}> = [
    {
      id: 'gcash',
      label: 'GCash',
      note: 'Pay via GCash wallet',
      badge: 'Popular',
      iconBg: 'bg-gradient-to-br from-blue-400 to-blue-700',
      icon: <span className="text-white font-black text-lg leading-none">G</span>,
    },
    {
      id: 'maya',
      label: 'Maya',
      note: 'Pay via Maya wallet',
      badge: 'Fast',
      iconBg: 'bg-gradient-to-br from-emerald-400 to-green-700',
      icon: <span className="text-white font-black text-lg leading-none">M</span>,
    },
    {
      id: 'online_banking',
      label: 'Online Banking',
      note: 'Instapay / PesoNet',
      badge: 'Bank Transfer',
      iconBg: 'bg-gradient-to-br from-sky-400 to-blue-600',
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      ),
    },
    {
      id: 'card',
      label: 'Credit / Debit Card',
      note: 'Visa or Mastercard',
      badge: '3DS Secured',
      iconBg: 'bg-gradient-to-br from-slate-600 to-slate-900',
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
  ];

const methodLabelMap: Record<PaymentMethod, string> = {
  online_banking: 'Online Banking',
  card: 'Credit / Debit Card',
  gcash: 'GCash',
  maya: 'Maya',
};

const BuyNowOptionsModal = ({
  isOpen,
  onClose,
  product,
  quantity = 1,
  selectedColor,
  selectedSize,
  selectedType,
}: BuyNowOptionsModalProps) => {
  const { data: session } = useSession();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('gcash');
  const [selectedOnlineBank, setSelectedOnlineBank] = useState(onlineBankingOptions[0]);
  const [selectedCardBrand, setSelectedCardBrand] = useState(cardOptions[0]);
  const [notice, setNotice] = useState('');
  const [createCheckoutSession, { isLoading: loading }] = useCreateCheckoutSessionMutation();

  useEffect(() => { setNotice(''); }, [selectedMethod, selectedOnlineBank, selectedCardBrand]);

  const subtotal = useMemo(() => product.price * quantity, [product.price, quantity]);
  const handlingFee = subtotal >= 5000 ? 0 : 99;
  const total = subtotal + handlingFee;
  const router = useRouter();

  const handleProceed = async () => {
    if (selectedMethod === 'online_banking') {
      setNotice(`Online Banking (${selectedOnlineBank}) is coming soon.`);
      return;
    }
    if (selectedMethod === 'card') {
      setNotice(`${selectedCardBrand}`);
    }
    try {
      const customerEmail = session?.user?.email ?? undefined;
      const customerName = session?.user?.name ?? undefined;
      const data = await createCheckoutSession({
        amount: total,
        description: product.name,
        payment_method: selectedMethod,
        customer: customerEmail
          ? {
              email: customerEmail,
              name: customerName,
            }
          : undefined,
        order: {
          product_name: product.name,
          product_id: typeof product.id === 'number' ? product.id : undefined,
          product_sku: product.sku ?? null,
          product_pv: typeof product.prodpv === 'number' ? product.prodpv : 0,
          product_image: product.image,
          quantity,
          selected_color: selectedColor ?? null,
          selected_size: selectedSize ?? null,
          selected_type: selectedType ?? null,
        },
      }).unwrap();

      if (!data.checkout_url) {
        alert('Failed to create checkout session');
        return;
      }
      if (data.checkout_id) {
        localStorage.setItem('last_checkout_id', data.checkout_id);
      }
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error(error);
      alert('Something went wrong');
    }
  };

  const handleCustomerCheckout = () => {
    localStorage.setItem('guest_checkout', JSON.stringify({
      product,
      quantity,
      selectedColor: selectedColor ?? null,
      selectedSize: selectedSize ?? null,
      selectedType: selectedType ?? null,
      subtotal,
      handlingFee,
      total
    }));
    onClose();
    router.push('/checkout/customer')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
          />

          {/* Modal wrapper */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
          >
            <div
              className="mx-auto w-full max-w-5xl rounded-3xl bg-white shadow-2xl max-h-[calc(100vh-1.5rem)] sm:max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 sm:px-7 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-orange-100 text-[10px] font-bold uppercase tracking-widest">AF Home · Secure Checkout</p>
                    <h2 className="text-white font-bold text-lg leading-tight">Choose Payment Method</h2>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/25 text-white transition-colors flex items-center justify-center border border-white/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5">
                {/* ── Left Panel: Order Summary ── */}
                <div className="lg:col-span-2 bg-gradient-to-b from-orange-50/50 to-white border-b lg:border-b-0 lg:border-r border-slate-100 p-5 sm:p-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Order Summary</p>

                  {/* Product */}
                  <div className="flex gap-3.5 rounded-2xl bg-white border border-orange-100 p-3.5 shadow-sm">
                    <div className="relative h-[72px] w-[72px] rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                      <Image src={product.image} alt={product.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">{product.name}</p>
                      <p className="text-orange-500 font-extrabold text-[15px] mt-1.5">PHP {product.price.toLocaleString()}</p>
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        <span className="px-2 py-0.5 bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-bold rounded-full">
                          Qty: {quantity}
                        </span>
                        {selectedColor && (
                          <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-semibold rounded-full">{selectedColor}</span>
                        )}
                        {selectedSize && (
                          <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-semibold rounded-full">{selectedSize}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedType && (
                    <div className="mt-2 flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-slate-100 text-xs">
                      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="text-slate-500">Type:</span>
                      <span className="font-semibold text-slate-700">{selectedType}</span>
                    </div>
                  )}

                  {/* Pricing Breakdown */}
                  <div className="mt-3 rounded-2xl border border-slate-100 bg-white overflow-hidden">
                    <div className="px-4 py-3.5 space-y-2.5 text-sm">
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Subtotal ({quantity} item{quantity > 1 ? 's' : ''})</span>
                        <span className="font-semibold text-slate-700">PHP {subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span>Shipping fee</span>
                          {handlingFee === 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 font-bold rounded-full">FREE</span>
                          )}
                        </div>
                        <span className={handlingFee === 0 ? 'text-green-600 font-semibold' : 'font-semibold text-slate-700'}>
                          {handlingFee === 0 ? 'PHP 0.00' : `PHP ${handlingFee}`}
                        </span>
                      </div>
                    </div>
                    <div className="bg-orange-50 border-t border-orange-100 px-4 py-3 flex justify-between items-center">
                      <span className="font-bold text-slate-800 text-sm">Total Amount</span>
                      <span className="font-extrabold text-orange-500 text-xl">PHP {total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Free shipping note */}
                  {handlingFee === 0 ? (
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl border border-green-100">
                      <svg className="w-3.5 h-3.5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-green-700 font-medium">Free shipping on orders PHP 5,000+</p>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-slate-400">Add more items to get free shipping (PHP 5,000+)</p>
                    </div>
                  )}

                  {/* Trust badges */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
                    {[
                      { icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>, label: 'SSL Encrypted' },
                      { icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>, label: 'PayMongo' },
                      { icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>, label: '3DS Secure' },
                    ].map(b => (
                      <div key={b.label} className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-xl">
                        <span className="text-slate-400">{b.icon}</span>
                        <span className="text-[9px] text-slate-400 font-semibold text-center leading-tight">{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Right Panel: Payment ── */}
                <div className="lg:col-span-3 p-5 sm:p-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Select Payment Method</p>

                  {/* Payment method cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {paymentMethods.map((method) => {
                      const selected = selectedMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setSelectedMethod(method.id)}
                          className={`text-left rounded-2xl border-2 p-4 transition-all duration-200 flex items-center gap-3.5
                            ${selected
                              ? 'border-orange-400 bg-orange-50/70 shadow-sm shadow-orange-100'
                              : 'border-slate-100 hover:border-orange-200 hover:bg-orange-50/20 bg-white'
                            }`}
                        >
                          {/* Icon */}
                          <div className={`${method.iconBg} h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-md`}>
                            {method.icon}
                          </div>

                          {/* Label */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-bold text-slate-800">{method.label}</span>
                              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white leading-none
                                ${method.id === 'gcash' ? 'bg-blue-500' : method.id === 'maya' ? 'bg-emerald-500' : method.id === 'online_banking' ? 'bg-sky-500' : 'bg-slate-700'}
                              `}>
                                {method.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{method.note}</p>
                          </div>

                          {/* Radio */}
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200
                            ${selected ? 'border-orange-500 bg-orange-500' : 'border-slate-300 bg-white'}
                          `}>
                            {selected && (
                              <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="h-2 w-2 rounded-full bg-white"
                              />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bank selector */}
                  <AnimatePresence>
                    {selectedMethod === 'online_banking' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
                          <p className="text-xs font-bold text-sky-700 mb-2.5 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                            Choose your bank
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {onlineBankingOptions.map((bank) => (
                              <button
                                key={bank} type="button" onClick={() => setSelectedOnlineBank(bank)}
                                className={`px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all duration-200
                                  ${selectedOnlineBank === bank
                                    ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-200'
                                    : 'bg-white text-sky-700 border-sky-200 hover:border-sky-400'
                                  }`}
                              >
                                {bank}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Card brand selector */}
                  <AnimatePresence>
                    {selectedMethod === 'card' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                          <p className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                            Select card type
                          </p>
                          <div className="flex gap-2">
                            {cardOptions.map((brand) => (
                              <button
                                key={brand} type="button" onClick={() => setSelectedCardBrand(brand)}
                                className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all duration-200
                                  ${selectedCardBrand === brand
                                    ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                  }`}
                              >
                                {brand === 'Visa' ? '💳 Visa' : '💳 Mastercard'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* What happens next */}
                  <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <p className="text-xs font-bold text-slate-700 mb-3">What happens next?</p>
                    <div className="space-y-2.5">
                      {[
                        { n: '1', text: `Pay via ${methodLabelMap[selectedMethod]}`, active: true },
                        { n: '2', text: 'Checkout screen shows payment summary', active: false },
                        { n: '3', text: 'PayMongo processes your payment securely', active: false },
                      ].map((s) => (
                        <div key={s.n} className="flex items-start gap-3">
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5
                            ${s.active ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {s.n}
                          </div>
                          <p className={`text-xs leading-relaxed ${s.active ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                            {s.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notice */}
                  <AnimatePresence>
                    {notice && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
                      >
                        <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-xs text-amber-800 font-medium">{notice}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* CTA Buttons */}
                  <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
                    <button
                      onClick={onClose}
                      className="sm:flex-1 rounded-xl border-2 border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleProceed}
                      disabled={loading}
                      className="sm:flex-[2] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 text-sm font-bold transition-all shadow-lg shadow-orange-200"
                    >
                      {loading ? (
                        <>
                          <Loading size={16} />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span>Continue to Checkout · PHP {total.toLocaleString()}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Security note */}
                  <p className="mt-3 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Secured by <span className="font-semibold text-slate-500">PayMongo</span> · SSL Encrypted · PCI DSS Compliant
                  </p>

                  {/* CUSTOMER CHECKOUT DIVIDER */}
                  <div className='flex items-center gap-3 mt-4'>
                    <div className='flex-1 h-px bg-slate-100' />
                    <span className='text-[11px] text-slate-400 font-medium'>or</span>
                    <div className='flex-1 h-px bg-slate-100' />
                  </div>

                  {/* GUEST CHECKOUT BUTTON */}
                  <button
                    onClick={handleCustomerCheckout}
                    className='mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50/50 text-xs font-semibold transition-all'
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Continue checkout without account
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BuyNowOptionsModal;

