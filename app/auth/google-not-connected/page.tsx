'use client';

import Link from 'next/link';
import Header from '@/components/landing-page/Header';
import Footer from '@/components/landing-page/Footer';

export default function GoogleNotConnectedPage() {
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

              {/* Google Icon */}
              <div className="mx-auto w-10 h-10 flex items-center justify-center mb-4">
                <svg className="w-10 h-10" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Google Account Not Connected
              </h1>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Your Google account is not linked to any AF Home account. To sign in with Google, you need to first link your Google account to your existing AF Home account.
              </p>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Link
                  href="/profile"
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Link Google Account
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
                  After linking your Google account on the profile page, you can sign in with Google seamlessly.
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