import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Admin — Desktop Only',
}

export default function AdminMobileBlockedPage() {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-gray-950 px-6 text-center">
      {/* Icon */}
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-gray-800 shadow-xl">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-12 w-12 text-red-400"
        >
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
          <line x1="2" y1="2" x2="22" y2="22" strokeWidth="2" />
        </svg>
      </div>

      {/* Heading */}
      <h1 className="mb-3 text-2xl font-bold tracking-tight text-white">
        Desktop Only
      </h1>

      {/* Message */}
      <p className="mb-2 max-w-xs text-base text-gray-400 leading-relaxed">
        The Admin Panel is not accessible on mobile devices.
      </p>
      <p className="mb-10 max-w-xs text-sm text-gray-500 leading-relaxed">
        Please open this page on a desktop or laptop computer to continue.
      </p>

      {/* Divider hint */}
      <div className="mb-6 flex items-center gap-3 text-gray-600">
        <span className="h-px w-16 bg-gray-700" />
        <span className="text-xs uppercase tracking-widest">or</span>
        <span className="h-px w-16 bg-gray-700" />
      </div>

      {/* Back to shop */}
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500 active:scale-95"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path
            fillRule="evenodd"
            d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z"
            clipRule="evenodd"
          />
        </svg>
        Go to Shop
      </Link>
    </div>
  )
}
