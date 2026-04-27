'use client'

import { useMemo, useState } from 'react'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import { getPartnerStorefrontConfig } from '@/libs/partnerStorefront'
import {
  useCreatePartnerUserMutation,
  useDeletePartnerUserMutation,
  useGetPartnerUsersQuery,
  useUpdatePartnerUserMutation,
  type PartnerUserItem,
} from '@/store/api/partnerUsersApi'
import { useGetAdminWebPageItemsQuery } from '@/store/api/webPagesApi'

type FormState = {
  name: string
  username: string
  email: string
  password: string
  storefrontIds: number[]
}

const emptyForm: FormState = {
  name: '',
  username: '',
  email: '',
  password: '',
  storefrontIds: [],
}

export default function PartnerUsersPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<PartnerUserItem | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [showPassword, setShowPassword] = useState(false)

  const { data: storefrontData } = useGetAdminWebPageItemsQuery({ type: 'partner-storefront', page: 1, perPage: 100, status: 'all' })
  const storefronts = useMemo(() => {
    const storefrontItems = storefrontData?.items ?? []
    return storefrontItems
      .map((item) => {
        const cfg = getPartnerStorefrontConfig(item)
        return {
          id: item.id,
          slug: cfg?.slug || String(item.key ?? '').trim() || `storefront-${item.id}`,
          name: cfg?.displayName || String(item.title ?? '').trim() || String(item.key ?? '').trim() || `Storefront #${item.id}`,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [storefrontData?.items])

  const storefrontNameById = useMemo(() => {
    const map = new Map<number, string>()
    storefronts.forEach((s) => map.set(s.id, s.name))
    return map
  }, [storefronts])

  const {
    data,
    isLoading,
    isError,
    error: loadError,
    refetch,
  } = useGetPartnerUsersQuery(
    {
      search,
    },
    // This page is often visited right after a backend deploy; ensure we don't
    // get stuck showing a cached error response.
    { refetchOnMountOrArgChange: true },
  )
  const [createUser, { isLoading: isCreating }] = useCreatePartnerUserMutation()
  const [updateUser, { isLoading: isUpdating }] = useUpdatePartnerUserMutation()
  const [deleteUser, { isLoading: isDeleting }] = useDeletePartnerUserMutation()

  const users = useMemo(() => data?.users ?? [], [data?.users])
  const visibleUsers = users
  const busy = isCreating || isUpdating || isDeleting

  const resetForm = () => {
    setSelected(null)
    setForm(emptyForm)
  }

  const startEdit = (user: PartnerUserItem) => {
    setSelected(user)
    setForm({
      name: user.name,
      username: user.username,
      email: user.email ?? '',
      storefrontIds: user.storefront_ids ?? [],
      password: '',
    })
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.username.trim()) {
      showErrorToast('Name and username are required.')
      return
    }
    if ((form.storefrontIds ?? []).length === 0) {
      showErrorToast('Select at least one storefront for this account.')
      return
    }

    try {
      if (selected) {
        await updateUser({
          id: selected.id,
          name: form.name.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password.trim() || undefined,
          storefront_ids: form.storefrontIds,
        }).unwrap()
        showSuccessToast('Partner user updated.')
      } else {
        if (!form.password.trim()) {
          showErrorToast('Password is required for new users.')
          return
        }
        await createUser({
          name: form.name.trim(),
          username: form.username.trim(),
          email: form.email.trim() || undefined,
          password: form.password.trim(),
          storefront_ids: form.storefrontIds,
        }).unwrap()
        showSuccessToast('Partner user created.')
      }
      setSelected(null)
      setForm(emptyForm)
    } catch (error) {
      const apiErr = error as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message || 'Failed to save partner user.')
    }
  }

  const handleDelete = async (user: PartnerUserItem) => {
    if (busy) return
    if (!confirm(`Delete @${user.username}?`)) return
    try {
      await deleteUser({ id: user.id }).unwrap()
      showSuccessToast('Partner user deleted.')
      if (selected?.id === user.id) resetForm()
    } catch (error) {
      const apiErr = error as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message || 'Failed to delete partner user.')
    }
  }

  if (isLoading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading partner users...</div>
  }

  if (isError) {
    const apiMessage =
      (loadError as { data?: { message?: string } } | undefined)?.data?.message ||
      (loadError as { error?: string } | undefined)?.error ||
      'Failed to load partner users.'

    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center shadow-sm dark:border-red-900/40 dark:bg-red-950/30">
        <p className="text-sm font-semibold text-red-700 dark:text-red-300">{apiMessage}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-2xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)] dark:bg-slate-950 dark:text-slate-100">
      <aside className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-400">Partner Users</p>
          <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">Manage Accounts</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create users that can only manage your storefront.</p>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Field label="Assigned Storefront(s)">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/80">
              {storefronts.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">No partner storefronts found yet.</p>
              ) : (
                <div className="max-h-44 space-y-2 overflow-auto pr-1">
                  {storefronts.map((store) => {
                    const checked = form.storefrontIds.includes(store.id)
                    return (
                      <label key={store.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm dark:bg-slate-900">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-slate-800">{store.name}</span>
                          <span className="block truncate text-xs text-slate-400">ID #{store.id} • {store.slug}</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setForm((prev) => {
                              const next = new Set(prev.storefrontIds)
                              if (next.has(store.id)) next.delete(store.id)
                              else next.add(store.id)
                              return { ...prev, storefrontIds: Array.from(next) }
                            })
                          }}
                        />
                      </label>
                    )
                  })}
                </div>
              )}

              {form.storefrontIds.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.storefrontIds
                    .slice()
                    .sort((a, b) => a - b)
                    .map((id) => (
                      <span key={id} className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300">
                        {storefrontNameById.get(id) || `Storefront #${id}`}
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({ ...prev, storefrontIds: prev.storefrontIds.filter((x) => x !== id) }))
                          }
                          className="text-cyan-700/70 hover:text-cyan-800 dark:text-cyan-300/80 dark:hover:text-cyan-200"
                          aria-label={`Remove storefront ${id}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              ) : null}
            </div>
          </Field>

          <Field label="Full Name">
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Jane Doe"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
            />
          </Field>
          <Field label="Username">
            <input
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              placeholder="janedoe"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
            />
          </Field>
          <Field label="Email (optional)">
            <input
              type="email"
              name="partner_user_email"
              autoComplete="off"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="jane@email.com"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
            />
          </Field>
          <Field label={selected ? 'New Password (optional)' : 'Password'}>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="partner_user_password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder={selected ? 'Leave blank to keep' : '********'}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm outline-none focus:border-cyan-300 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </Field>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={busy}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {selected ? 'Update User' : 'Create User'}
            </button>
            {selected ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      </aside>

      <section className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, username, email..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white md:w-80 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
            />
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {visibleUsers.length} users
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {visibleUsers.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 dark:text-slate-400">No partner users yet.</p>
          ) : (
            <div className="space-y-2">
              {visibleUsers.map((user) => (
                <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</p>
                    {user.email ? <p className="text-xs text-slate-400 dark:text-slate-500">{user.email}</p> : null}
                    {(user.storefront_ids ?? []).length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {user.storefront_ids.map((id) => (
                          <span key={id} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                            {storefrontNameById.get(id) || `Storefront #${id}`}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">No storefront assigned</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(user)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-700 dark:hover:text-cyan-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(user)}
                      className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </label>
  )
}
