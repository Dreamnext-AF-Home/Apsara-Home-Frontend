'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useGetWishlistQuery, useRemoveWishlistMutation } from '@/store/api/wishlistApi';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);

const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

export default function Wishlist() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = Boolean(session?.user);
  const [pendingRemoveId, setPendingRemoveId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const {
    data: items = [],
    isFetching,
    isError,
    error,
    refetch,
  } = useGetWishlistQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [removeWishlist] = useRemoveWishlistMutation();

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [items, search]);

  const totalValue = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0), 0),
    [items],
  );

  const errorMessage = useMemo(() => {
    if (!error) return 'Failed to load wishlist from your account.';
    const err = error as FetchBaseQueryError;
    const statusCode = typeof err.status === 'number' ? err.status : String(err.status ?? 'unknown');
    const data = (err.data ?? {}) as { message?: string; error?: string };
    return data.message || data.error || `Request failed (HTTP ${statusCode}).`;
  }, [error]);

  const handleRemove = async (productId: number) => {
    setPendingRemoveId(productId);
    try {
      await removeWishlist(productId).unwrap();
    } finally {
      setPendingRemoveId(null);
    }
  };

  const isLoading = status === 'loading' || isFetching;

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-orange-50/20">
      <div className="container mx-auto px-4 py-10 max-w-7xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-10"
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-5">
            <button
              type="button"
              onClick={() => window.history.length > 1 ? router.back() : router.push('/shop')}
              className="hover:text-orange-500 transition-colors"
            >
              Shop
            </button>
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
            <span className="text-slate-600 font-medium">Wishlist</span>
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">My Wishlist</h1>
                <p className="text-sm text-slate-500">Your saved favorites in one place</p>
              </div>
            </div>

            {/* Stats */}
            {isAuthenticated && !isFetching && !isError && (
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-slate-100 bg-white px-5 py-3 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Saved Items</p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">{items.length}</p>
                </div>
                <div className="rounded-2xl border border-orange-100 bg-orange-50 px-5 py-3 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Total Value</p>
                  <p className="text-xl font-bold text-orange-600 mt-0.5">₱{totalValue.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Search */}
          {isAuthenticated && !isError && items.length > 0 && (
            <div className="mt-6 relative max-w-sm">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search saved items..."
                className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition-all focus:border-orange-300 focus:ring-2 focus:ring-orange-100 placeholder:text-slate-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* Loading skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-white overflow-hidden animate-pulse shadow-sm">
                <div className="aspect-square bg-slate-100" />
                <div className="p-4 space-y-2.5">
                  <div className="h-3 bg-slate-100 rounded-lg w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
                  <div className="h-4 bg-slate-100 rounded-lg w-1/3 mt-3" />
                  <div className="h-8 bg-slate-100 rounded-xl mt-3" />
                </div>
              </div>
            ))}
          </div>

        ) : !isAuthenticated ? (
          /* Not logged in */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white py-24 text-center shadow-sm"
          >
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-400">
              <HeartIcon />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Sign in to view your wishlist</h2>
            <p className="mt-1.5 text-sm text-slate-500 max-w-xs">Save products you love and access them anytime from any device.</p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-200 hover:bg-orange-600 transition-colors"
            >
              Sign In
            </Link>
          </motion.div>

        ) : isError ? (
          /* Error state */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-3xl border border-red-100 bg-red-50 py-20 text-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-red-700 max-w-sm">{errorMessage}</p>
            <button
              onClick={() => refetch()}
              className="mt-5 rounded-2xl border border-red-200 bg-white px-5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              Try Again
            </button>
          </motion.div>

        ) : filteredItems.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white py-24 text-center shadow-sm"
          >
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-400">
              <HeartIcon />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {search ? 'No matching items' : 'Your wishlist is empty'}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              {search ? 'Try a different keyword.' : 'Browse the shop and save products you love.'}
            </p>
            <div className="mt-6 flex items-center gap-2">
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Clear Search
                </button>
              )}
              <Link href="/shop" className="rounded-2xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-200 hover:bg-orange-600 transition-colors">
                Browse Shop
              </Link>
            </div>
          </motion.div>

        ) : (
          /* Product grid */
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => {
                const productPath = `/product/${item.slug}-i${item.productId}`;
                const isRemoving = pendingRemoveId === item.productId;

                return (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.22, delay: index * 0.03 }}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm hover:-translate-y-1 hover:shadow-lg hover:border-orange-100 transition-all duration-300"
                  >
                    {/* Image */}
                    <Link href={productPath} className="relative block aspect-square overflow-hidden bg-slate-50">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      {/* Remove button on hover */}
                      <button
                        type="button"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); handleRemove(item.productId); }}
                        disabled={isRemoving}
                        className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-md text-rose-400 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 hover:bg-rose-50 hover:text-rose-600 transition-all duration-300 disabled:opacity-50"
                        title="Remove from wishlist"
                      >
                        {isRemoving ? (
                          <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                          </svg>
                        ) : <TrashIcon />}
                      </button>
                    </Link>

                    {/* Info */}
                    <div className="flex flex-1 flex-col p-4">
                      <Link href={productPath} className="flex-1">
                        <h2 className="line-clamp-2 text-sm font-semibold text-slate-800 leading-snug group-hover:text-orange-500 transition-colors">{item.name}</h2>
                        <p className="mt-1.5 text-base font-bold text-orange-500">₱{Number(item.price).toLocaleString()}</p>
                      </Link>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Link
                          href={productPath}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition-colors shadow-sm shadow-orange-100"
                        >
                          <CartIcon /> Add to Cart
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.productId)}
                          disabled={isRemoving}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          {isRemoving ? 'Removing…' : <><TrashIcon /> Remove</>}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}
