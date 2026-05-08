'use client'

import { motion } from 'framer-motion'
import { formatTimestamp, timeAgo } from './types'
import type { ActivityLog } from '@/store/api/activityLogsApi'
import AvatarImg from '@/components/superAdmin/AvatarImg'

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

const formatUserAgent = (userAgent?: string | null) => {
  if (!userAgent) return 'N/A'

  const ua = userAgent.toLowerCase()
  const browser = ua.includes('edg/') ? 'Edge'
    : ua.includes('opr/') || ua.includes('opera') ? 'Opera'
      : ua.includes('chrome/') || ua.includes('crios/') ? 'Chrome'
        : ua.includes('safari/') && !ua.includes('chrome/') ? 'Safari'
          : ua.includes('firefox/') || ua.includes('fxios/') ? 'Firefox'
            : 'Unknown Browser'

  const device = ua.includes('ipad') || ua.includes('tablet') ? 'Tablet'
    : ua.includes('mobile') || ua.includes('iphone') || ua.includes('android') ? 'Mobile'
      : 'Desktop'

  const platform = ua.includes('windows') ? 'Windows'
    : ua.includes('mac os') || ua.includes('macintosh') ? 'Mac'
      : ua.includes('android') ? 'Android'
        : ua.includes('iphone') || ua.includes('ipad') ? 'iOS'
          : ua.includes('linux') ? 'Linux'
            : 'Unknown OS'

  return `${browser} - ${device} - ${platform}`
}

const ACTIVITY_TYPES: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  login: { label: 'Login', icon: '🔐', bg: 'bg-blue-50', text: 'text-blue-700' },
  logout: { label: 'Logout', icon: '🚪', bg: 'bg-slate-100', text: 'text-slate-600' },
  purchase: { label: 'Purchase', icon: '🛍️', bg: 'bg-teal-50', text: 'text-teal-700' },
  profile_update: { label: 'Profile Update', icon: '✏️', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  wallet_transaction: { label: 'Wallet', icon: '💳', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  encashment_request: { label: 'Encashment', icon: '💸', bg: 'bg-sky-50', text: 'text-sky-700' },
  verification_request: { label: 'Verification', icon: '✔️', bg: 'bg-purple-50', text: 'text-purple-700' },
  password_change: { label: 'Password Change', icon: '🔑', bg: 'bg-rose-50', text: 'text-rose-700' },
  account_status_change: { label: 'Account Status', icon: '⚙️', bg: 'bg-amber-50', text: 'text-amber-700' },
}

interface ActivityLogsTableProps {
  logs: ActivityLog[]
}

export default function ActivityLogsTable({ logs }: ActivityLogsTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40">
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Member</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Action</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Detail</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">IP / Device</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No activity logs found</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map(log => {
                const activityConfig = ACTIVITY_TYPES[log.activity_type] || { label: log.activity_type, icon: '📋', bg: 'bg-gray-50', text: 'text-gray-700' }
                const customerName = log.customer?.name || 'Unknown'
                const customerEmail = log.customer?.email || 'N/A'
                return (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    {/* Member */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <AvatarImg src={log.customer?.avatar_url} name={customerName} size="h-8 w-8" bg="bg-gradient-to-br from-teal-400 to-teal-600" textSize="text-[10px]" />
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white">{customerName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{customerEmail}</p>
                        </div>
                      </div>
                    </td>

                    {/* Activity Type */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${activityConfig.bg} ${activityConfig.text}`}>
                        <span>{activityConfig.icon}</span>
                        {activityConfig.label}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3.5 max-w-[220px]">
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={log.description}>{log.description || 'N/A'}</p>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {log.action}
                      </span>
                    </td>

                    {/* IP / User Agent */}
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{log.ip_address || 'N/A'}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[180px]" title={log.user_agent || undefined}>
                        {formatUserAgent(log.user_agent)}
                      </p>
                    </td>

                    {/* Time */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{timeAgo(log.created_at)}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{formatTimestamp(log.created_at)}</p>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        {logs.length} {logs.length === 1 ? 'entry' : 'entries'} shown · Latest first
      </div>
    </motion.div>
  )
}

