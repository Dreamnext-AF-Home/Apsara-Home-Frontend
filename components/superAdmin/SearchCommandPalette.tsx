'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

interface Page {
  title: string;
  href: string;
  breadcrumbs: string[];
}

const ADMIN_PAGES: Page[] = [
  { title: 'Dashboard', href: '/admin/dashboard', breadcrumbs: ['Admin', 'Dashboard'] },
  { title: 'Chat', href: '/admin/chat', breadcrumbs: ['Admin', 'Chat'] },
  { title: 'All Members', href: '/admin/members', breadcrumbs: ['Admin', 'Members'] },
  { title: 'Orders', href: '/admin/orders', breadcrumbs: ['Admin', 'Orders'] },
  { title: 'Interior Requests', href: '/admin/interior-requests', breadcrumbs: ['Admin', 'Interior Requests'] },
  { title: 'Accounting Dashboard', href: '/admin/accounting', breadcrumbs: ['Admin', 'Accounting'] },
  { title: 'Products', href: '/admin/products', breadcrumbs: ['Admin', 'Products'] },
  { title: 'Shipping Rates', href: '/admin/shipping/rates', breadcrumbs: ['Admin', 'Shipping', 'Rates'] },
  { title: 'Suppliers', href: '/admin/suppliers', breadcrumbs: ['Admin', 'Suppliers'] },
  { title: 'Inquiry', href: '/admin/inquiry', breadcrumbs: ['Admin', 'Inquiry'] },
  { title: 'Project', href: '/admin/project', breadcrumbs: ['Admin', 'Project'] },
  { title: 'Shop Builder', href: '/admin/webpages/shop-builder', breadcrumbs: ['Admin', 'Web Content', 'Shop Builder'] },

  { title: 'All Expenses', href: '/admin/expenses', breadcrumbs: ['Admin', 'Expenses'] },
  { title: 'General Settings', href: '/admin/settings/general', breadcrumbs: ['Admin', 'Settings', 'General'] },
  { title: 'Profile', href: '/admin/profile', breadcrumbs: ['Admin', 'Profile'] },
];

export default function SearchCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const filteredPages = search.trim() === ''
    ? []
    : ADMIN_PAGES.filter((page) => {
        const query = search.toLowerCase();
        return (
          page.title.toLowerCase().includes(query) ||
          page.breadcrumbs.some((crumb) => crumb.toLowerCase().includes(query))
        );
      });

  const close = useCallback(() => {
    setIsOpen(false);
    setSearch('');
  }, []);

  const handleSubmit = useCallback(() => {
    const query = search.trim().toLowerCase();
    if (!query) return;

    const currentPage = filteredPages[selectedIndex];
    if (currentPage) {
      window.location.assign(currentPage.href);
      close();
      return;
    }

    const match = ADMIN_PAGES.find((page) =>
      page.title.toLowerCase().includes(query) ||
      page.breadcrumbs.some((crumb) => crumb.toLowerCase().includes(query)),
    );

    if (match) {
      window.location.assign(match.href);
      close();
    }
  }, [close, search]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) close();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close, isOpen]);

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9998] bg-black/30"
            onClick={close}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -14 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-1/2 z-[9999] w-[min(92vw,40rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="border-b border-gray-100 px-4 py-4 dark:border-gray-700">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown' && filteredPages.length > 0) {
                      event.preventDefault();
                      setSelectedIndex((prev) => (prev + 1) % filteredPages.length);
                    }
                    if (event.key === 'ArrowUp' && filteredPages.length > 0) {
                      event.preventDefault();
                      setSelectedIndex((prev) => (prev - 1 + filteredPages.length) % filteredPages.length);
                    }
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleSubmit();
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      close();
                    }
                  }}
                  placeholder="Search pages, members, products..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-700 transition-all placeholder:text-gray-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-sky-400 dark:focus:ring-sky-400/40"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Type to search. Results update as you type.
              </p>
            </div>

            <div className="max-h-[28rem] overflow-y-auto overscroll-contain">
              {search.trim().length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Start typing to search admin pages.</p>
                </div>
              ) : filteredPages.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">No pages found</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Try a different keyword.</p>
                </div>
              ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredPages.map((page, index) => (
                    <button
                      key={page.href}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => {
                        window.location.assign(page.href);
                        close();
                      }}
                      className={`flex w-full items-start gap-4 px-4 py-3 text-left transition-colors ${
                        index === selectedIndex
                          ? 'bg-sky-50 dark:bg-sky-500/10'
                          : 'hover:bg-sky-50 dark:hover:bg-sky-500/10'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${index === selectedIndex ? 'text-sky-700 dark:text-sky-300' : 'text-gray-800 dark:text-gray-100'}`}>{page.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          {page.breadcrumbs.map((crumb, index) => (
                            <span key={`${page.href}-${crumb}-${index}`} className="text-xs text-gray-500 dark:text-gray-400">
                              {crumb}
                              {index < page.breadcrumbs.length - 1 ? ' /' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-4 py-2.5 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
              <div className="flex items-center justify-between">
                <span>Click a result or press Enter</span>
                <span className="text-[11px] text-gray-400 dark:text-gray-600">Esc to close</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div className="flex-1 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm text-gray-500 transition-all hover:border-gray-300 hover:bg-white dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800"
        >
          <svg className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="truncate">Search pages, members, products...</span>
        </button>
      </div>

      {isMounted ? createPortal(modal, document.body) : null}
    </>
  );
}
