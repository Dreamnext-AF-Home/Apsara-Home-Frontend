'use client'

import { useEffect, useRef, useState } from 'react'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import {
  useGetAdminNotificationSettingsQuery,
  useUpdateAdminNotificationSettingsMutation,
} from '@/store/api/adminSettingsApi'

export default function AdminNotificationsSettingsPageMain() {
  const { data, isFetching } = useGetAdminNotificationSettingsQuery()
  const [saveSettings, { isLoading: isSaving }] = useUpdateAdminNotificationSettingsMutation()
  const hasHydrated = useRef(false)

  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [adminAlerts, setAdminAlerts] = useState(true)

  useEffect(() => {
    if (!data?.settings || hasHydrated.current) return
    const settings = data.settings
    setEmailNotifications(Boolean(settings.email_notifications))
    setSmsNotifications(Boolean(settings.sms_notifications))
    setAdminAlerts(Boolean(settings.admin_alerts))
    hasHydrated.current = true
  }, [data])

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
        <div className="pointer-events-none absolute -right-20 -top-16 h-48 w-48 rounded-full bg-amber-200/50 blur-3xl dark:bg-amber-600/20" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-600/20" />
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-amber-700 dark:text-amber-300">Settings</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Notification Settings</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Control how admins receive system updates, alerts, and transactional messages.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Channels</p>
          <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Admin Notifications</h2>
        </div>

        <div className="mt-6 grid gap-4">
          {[
            {
              id: 'email',
              label: 'Email Notifications',
              description: 'Send order updates, approvals, and system notices via email.',
              enabled: emailNotifications,
              toggle: () => setEmailNotifications((prev) => !prev),
            },
            {
              id: 'sms',
              label: 'SMS Notifications',
              description: 'Deliver urgent notifications to the registered phone number.',
              enabled: smsNotifications,
              toggle: () => setSmsNotifications((prev) => !prev),
            },
            {
              id: 'alerts',
              label: 'Admin Alerts',
              description: 'Show critical alerts in the admin dashboard and header.',
              enabled: adminAlerts,
              toggle: () => setAdminAlerts((prev) => !prev),
            },
          ].map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white px-4 py-4 dark:border-slate-700 dark:from-slate-700/50 dark:to-slate-800"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
              </div>
              <button
                type="button"
                onClick={item.toggle}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                  item.enabled ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
                aria-pressed={item.enabled}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    item.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={async () => {
            try {
              const response = await saveSettings({
                email_notifications: emailNotifications,
                sms_notifications: smsNotifications,
                admin_alerts: adminAlerts,
              }).unwrap()

              setEmailNotifications(Boolean(response.settings.email_notifications))
              setSmsNotifications(Boolean(response.settings.sms_notifications))
              setAdminAlerts(Boolean(response.settings.admin_alerts))
              showSuccessToast(response.message || 'Notification settings saved.')
            } catch (error) {
              console.error(error)
              showErrorToast('Failed to save notification settings. Please try again.')
            }
          }}
          disabled={isSaving || isFetching}
          className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md dark:from-amber-600 dark:to-orange-600"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
