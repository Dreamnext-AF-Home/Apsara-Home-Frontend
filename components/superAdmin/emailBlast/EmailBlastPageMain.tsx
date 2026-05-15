'use client'

import { motion } from 'framer-motion'
import EmailBlastForm from './EmailBlastForm'

export default function EmailBlastPageMain() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
            Email Blast
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Send targeted email campaigns to members and suppliers
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
          <EmailBlastForm />
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Email Blast Information</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Recipients receive emails via BCC to protect email privacy</li>
              <li>You can send to members, suppliers, or both</li>
              <li>Emails can include subject, body text, and an image</li>
              <li>Large campaigns are sent in batches for reliability</li>
              <li>Check the preview before sending</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
