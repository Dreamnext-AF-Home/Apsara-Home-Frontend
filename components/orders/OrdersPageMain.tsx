'use client';

import { TABS } from "@/types/Data";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Skeleton } from "@heroui/react/skeleton";
import Icon from "./Icons";
import OrderCard from "./OrderCard";
import { useSession } from "next-auth/react";
import { useGetCheckoutHistoryQuery } from "@/store/api/paymentApi";
import TopBar from "@/components/layout/TopBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing-page/Footer";
import TrustBar from "@/components/layout/TrustBar";
import type { Category } from '@/store/api/categoriesApi';

type TabKey = typeof TABS[number]['key'];

const ORDER_STATUS_PRIORITY: Record<string, number> = {
  pending: 0,
  processing: 1,
  packed: 2,
  shipped: 3,
  out_for_delivery: 3,
  delivered: 4,
  cancelled: 5,
  refunded: 5,
};

const getOrderTimestamp = (value?: string | null) => {
  if (!value) return 0;
  const normalized = value.includes('T') ? value.trim() : value.trim().replace(' ', 'T');
  const hasTimeZone = /([zZ]|[+-]\d{2}:\d{2})$/.test(normalized);
  const parsed = new Date(hasTimeZone ? normalized : `${normalized}Z`).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

function OrdersPageSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-800 overflow-hidden"
        >
          <div className="flex flex-col gap-4 border-b border-gray-100 dark:border-slate-700 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>

          <div className="flex items-center gap-3 px-5 py-4">
            <div className="flex -space-x-2">
              {Array.from({ length: 3 }).map((_, itemIndex) => (
                <Skeleton
                  key={itemIndex}
                  className="h-10 w-10 rounded-lg border-2 border-white dark:border-gray-700"
                />
              ))}
            </div>
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5 rounded" />
              <Skeleton className="h-3 w-1/3 rounded" />
            </div>
            <div className="hidden sm:block">
              <Skeleton className="h-4 w-16 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

type OrdersPageMainProps = {
  initialCategories?: Category[];
  partnerBranding?: {
    slug: string;
    displayName: string;
    logoUrl?: string | null;
    tabLogoUrl?: string | null;
    notificationEmail?: string;
  };
};

const OrdersPageMain = ({ initialCategories, partnerBranding }: OrdersPageMainProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { status: authStatus } = useSession();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const { data, isLoading, isError } = useGetCheckoutHistoryQuery(undefined, {
    skip: authStatus !== 'authenticated',
    refetchOnMountOrArgChange: true,
  });
  const orders = useMemo(() => data?.orders ?? [], [data?.orders]);
  const isAuthLoading = authStatus === 'loading';
  const isFetchingOrders = isAuthLoading || (authStatus === 'authenticated' && isLoading);

  const filtered = useMemo(() => {
    let list = orders;
    if (activeTab !== 'all') list = list.filter((o) => o.status === activeTab || (activeTab === 'shipped' && o.status === 'out_for_delivery'));
    if (search.trim()) list = list.filter((o) => o.order_number.toLocaleLowerCase().includes(search.toLowerCase()) || o.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase())))

    return [...list].sort((left, right) => {
      const timeDiff = getOrderTimestamp(right.created_at) - getOrderTimestamp(left.created_at);
      if (timeDiff !== 0) return timeDiff;

      const statusDiff = (ORDER_STATUS_PRIORITY[left.status] ?? 99) - (ORDER_STATUS_PRIORITY[right.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;

      return right.id - left.id;
    });
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

  const isPartnerStorefrontRoute = Boolean(partnerBranding?.slug);
  const partnerProductHref = isPartnerStorefrontRoute ? `/shop/${partnerBranding?.slug}/product` : '/shop';
  const partnerLogoSrc = partnerBranding?.logoUrl || partnerBranding?.tabLogoUrl || '/Images/af_home_logo.png';
  const partnerName = partnerBranding?.displayName || 'Partner Store';

  return (
    <>
      {!isPartnerStorefrontRoute && <TopBar />}
      <Navbar
        initialCategories={initialCategories}
        logoSrc={isPartnerStorefrontRoute ? partnerLogoSrc : undefined}
        logoAlt={isPartnerStorefrontRoute ? partnerName : undefined}
        logoHref={isPartnerStorefrontRoute ? partnerProductHref : undefined}
        categoryOnlyNav={isPartnerStorefrontRoute}
        stickToTop={isPartnerStorefrontRoute}
        showGuestCartWishlist={isPartnerStorefrontRoute}
      />
      <TrustBar />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden bg-white dark:bg-gray-950 min-h-screen border-t border-gray-200 dark:border-slate-800"
      >
      <div className="container mx-auto px-4 py-8 md:py-10">
        {/* HEADER */}
        <div className="mb-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">My Orders</h1>
              <p className="text-gray-600 dark:text-gray-400">{orders.length} total{orders.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/shop')}
              suppressHydrationWarning
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 dark:hover:bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors whitespace-nowrap"
            >
              <Icon.ShoppingBag className="h-4 w-4" />
              Shop More
            </button>
          </div>
        </div>
        {/* SEARCH */}
        <div className="relative mb-5">
          <Icon.Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number or item name..."
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900 pl-10 pr-4 py-2.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
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
                    ? 'bg-sky-500 dark:bg-sky-600 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>{count}</span>
                )}
              </button>
            )
          })}
        </div>
        {authStatus === 'unauthenticated' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/30 px-4 py-3 text-sm text-sky-800 dark:text-sky-300"
          >
            Sign in required to view your checkout history.
          </motion.div>
        )}

        {isError && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-400"
          >
            Failed to load your order history.
          </motion.div>
        )}

        {/* ORDER LIST */}
        <AnimatePresence mode="wait">
          {isFetchingOrders ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-5 py-4">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="mt-3 h-3 w-64 max-w-full rounded" />
              </div>
              <OrdersPageSkeleton />
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
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-800 py-16 text-center"
              >
                <div className="h-16 w-16 rounded-2xl bg-sky-50 dark:bg-sky-900/30 text-sky-300 dark:text-sky-500 flex items-center justify-center mb-4">
                  <Icon.Package className="h-8 w-8" />
                </div>
                <p className="text-base font-bold text-gray-800 dark:text-white">No orders</p>
                <p className="mt-1 text-sm text-gray-400 dark:text-gray-500 max-w-xs">{search ? `No results for ${search}. Try a different keyword.` : "You don't have any orders in this category yet."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setActiveTab('all');
                    router.push(authStatus === 'authenticated' ? '/shop' : `/login?callback=${encodeURIComponent(pathname || '/orders')}`);
                  }}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 dark:hover:bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
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
      {isPartnerStorefrontRoute ? (
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <p>
              Orders from <span className="font-semibold text-slate-800">{partnerName}</span> are still processed through AF Home.
            </p>
            {partnerBranding?.notificationEmail ? <p>Partner notifications: {partnerBranding.notificationEmail}</p> : null}
          </div>
        </footer>
      ) : (
        <Footer />
      )}
    </>
  )
}

export default OrdersPageMain
