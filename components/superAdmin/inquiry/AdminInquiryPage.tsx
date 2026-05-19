'use client'

import { useState } from 'react'
import UsernameChangeRequestsPage from './UsernameChangeRequestsPage'
import WebstoreRequestsPage from './WebstoreRequestsPage'

type InquiryTab = 'username' | 'webstore'

export default function AdminInquiryPage() {
  const [tab, setTab] = useState<InquiryTab>('username')

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('username')}
            className={
              tab === 'username'
                ? 'rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white'
                : 'rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }
          >
            Username Change Requests
          </button>
          <button
            type="button"
            onClick={() => setTab('webstore')}
            className={
              tab === 'webstore'
                ? 'rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white'
                : 'rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }
          >
            Webstore Requests
          </button>
        </div>
      </div>

      {tab === 'username' ? <UsernameChangeRequestsPage /> : <WebstoreRequestsPage />}
    </div>
  )
}

