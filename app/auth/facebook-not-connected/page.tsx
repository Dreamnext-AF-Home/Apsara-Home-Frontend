'use client';

import Link from 'next/link';
import Header from '@/components/landing-page/Header';
import Footer from '@/components/landing-page/Footer';

export default function FacebookNotConnectedPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Light background section - force header to use dark text */}
      <section className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
        {/* Force header to use scrolled/dark style by adding the same classes directly */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-soft">
          <div className="container mx-auto">
            <div className="flex items-center justify-between h-20 px-4">
              <a href="/" className="flex items-center shrink-0">
                <img src="/af_home_logo.png" alt="AFhome Logo" className="h-10 md:h-12" />
              </a>
              <div className="flex items-center gap-4 shrink-0">
                <a href="/login" className="text-sm font-medium text-gray-700 dark:text-white hover:text-amber-500 transition-colors">
                  Sign In
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Spacer matching fixed header height */}
        <div className="h-20 shrink-0" />

        {/* Vertically centered card */}
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
              {/* Error Icon */}
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              {/* Facebook Icon */}
              <div className="mx-auto w-10 h-10 flex items-center justify-center mb-4">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                </svg>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Facebook Account Not Connected
              </h1>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Your Facebook account is not linked to any AF Home account. To sign in with Facebook, you need to first link your Facebook account to your existing AF Home account.
              </p>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Link
                  href="/profile"
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                  </svg>
                  Link Facebook Account
                </Link>

                <Link
                  href="/login"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white px-4 py-3 text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Use Email and Password
                </Link>
              </div>

              {/* Help Text */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  After linking your Facebook account on the profile page, you can sign in with Facebook seamlessly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer is below the fold — visible only when scrolling */}
      <Footer />
    </div>
  );
}
