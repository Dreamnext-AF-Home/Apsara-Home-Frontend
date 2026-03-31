'use client';

import { TABS } from "@/types/Data";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "./Icons";
import OrderCard from "./OrderCard";
import { useSession } from "next-auth/react";
import { useGetCheckoutHistoryQuery } from "@/store/api/paymentApi";

type TabKey = typeof TABS[number]['key'];


const OrdersPageMain = () => {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const { data, isLoading, isError } = useGetCheckoutHistoryQuery(undefined, {
    skip: authStatus !== 'authenticated',
  });
  const orders = data?.orders ?? [];

  const filtered = useMemo(() => {
    let list = orders;
    if (activeTab !== 'all') list = list.filter((o) => o.status === activeTab || (activeTab === 'shipped' && o.status === 'out_for_delivery'));
    if (search.trim()) list = list.filter((o) => o.order_number.toLocaleLowerCase().includes(search.toLowerCase()) || o.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase())))
    return list;
  }, [activeTab, search, orders]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: orders.length
    };
    orders.forEach((o) => {
      const key = o.status === 'out_for_delivery' ? 'shipped' : o.status;
      counts[key] = (counts[key] ?? 0) + 1
    })
    return counts
  }, [orders])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden bg-gradient-to-br from-orange-50/50 via-white to-white min-h-screen"
    >
      {/* BLOBS */}
      <div className="pointer-events-none absolute -top-20 -left-20 h-56 w-56 rounded-full bg-orange-200/25 blur-3xl" />
      <div className="pointer-events-none absolute top-0 right-0 h-56 w-56 rounded-full bg-amber-200/20 blur-3xl" />

      <div className="container mx-auto px-4 py-8 md:py-10">
        {/* HEADER */}
        <div className="mb-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">My Orders</h1>
              <p>{orders.length} total{orders.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/shop')}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm shadow-orange-200 whitespace-nowrap"
            >
              <Icon.ShoppingBag className="h-4 w-4" />
              Shop More
            </button>
          </div>
        </div>
        {/* SEARCH */}
        <div className="relative mb-5">
          <Icon.Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number or item name..."
            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 placeholder:text-gray-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-1/2 text-gray-400 hover:text-gray-600"
            >
              <Icon.X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* TABS */}
        <div className="mb-5 flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((tab) => {
            const count = tabCounts[tab.key] ?? 0;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${active
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>{count}</span>
                )}
              </button>
            )
          })}
        </div>
        {authStatus !== 'authenticated' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            Sign in required to view your checkout history.
          </motion.div>
        )}

        {isError && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            Failed to load your order history.
          </motion.div>
        )}

        {/* ORDER LIST */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-gray-200 bg-white p-8 text-center"
            >
              <p className="text-sm text-gray-500">Loading your order history...</p>
            </motion.div>
          ) : filtered.length > 0 ? (
            <motion.div
              key={activeTab + search}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {filtered.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </motion.div>
          ) : (
            <>
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center"
              >
                <div className="h-16 w-16 rounded-2xl bg-orange-50 text-orange-300 flex items-center justify-center mb-4">
                  <Icon.Package className="h-8 w-8" />
                </div>
                <p className="text-base font-bold text-gray-800 ">No orders</p>
                <p className="mt-1 text-sm text-gray-400 max-w-xs">{search ? `No results for ${search}. Try a different keyword.` : "You don't have any orders in this category yet."}
                </p>
                <button
                  type="button"
                  onClick={() => { 
                    setSearch(''); 
                    setActiveTab('all'); 
                    router.push(authStatus === 'authenticated' ? '/' : '/login');
                  }}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                >
                  <Icon.ShoppingBag className="h-4 w-4" />
                  {authStatus === 'authenticated' ? 'Start Shopping' : 'Go to Login'}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      <div />
    </motion.div>
  )
}

export default OrdersPageMain
