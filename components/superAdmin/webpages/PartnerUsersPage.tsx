'use client'

import { useEffect, useMemo, useState } from 'react'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import { getPartnerStorefrontConfig } from '@/libs/partnerStorefront'
import { Pencil, Trash2 } from 'lucide-react'
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

const shellCard =
  'rounded-3xl border border-slate-200/90 bg-white/95 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900'
const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-900/30'

export default function PartnerUsersPage({ showStorefrontFilter = true }: { showStorefrontFilter?: boolean }) {
  const [search, setSearch] = useState('')
  const [storefrontFilter, setStorefrontFilter] = useState<string>('all')
  const [selected, setSelected] = useState<PartnerUserItem | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [showPassword, setShowPassword] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [deleteModalUser, setDeleteModalUser] = useState<PartnerUserItem | null>(null)
  const [accessStorefrontIds, setAccessStorefrontIds] = useState<number[]>([])
  const [accessTargetUserId, setAccessTargetUserId] = useState<number | null>(null)

  const { data: storefrontData } = useGetAdminWebPageItemsQuery({
    type: 'partner-storefront',
    page: 1,
    perPage: 100,
    status: 'all',
  })

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

  const { data, isLoading, isError, error: loadError, refetch } = useGetPartnerUsersQuery(
    { search },
    { refetchOnMountOrArgChange: true },
  )

  const [createUser, { isLoading: isCreating }] = useCreatePartnerUserMutation()
  const [updateUser, { isLoading: isUpdating }] = useUpdatePartnerUserMutation()
  const [deleteUser, { isLoading: isDeleting }] = useDeletePartnerUserMutation()
  const [isSavingStorefrontAccess, setIsSavingStorefrontAccess] = useState(false)

  const users = useMemo(() => data?.users ?? [], [data?.users])
  const busy = isCreating || isUpdating || isDeleting

  useEffect(() => {
    if (users.length === 0) {
      setAccessTargetUserId(null)
      setAccessStorefrontIds([])
      return
    }
    if (accessTargetUserId !== null) return
    const firstUser = users[0]
    if (!firstUser) return
    setAccessTargetUserId(firstUser.id)
    setAccessStorefrontIds(
      (firstUser.disabled_storefront_ids ?? [])
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id)),
    )
  }, [users, accessTargetUserId])

  useEffect(() => {
    // Partner page: default to all assigned storefronts selected for new-create mode.
    if (showStorefrontFilter) return
    if (selected) return
    if (storefronts.length === 0) return
    if (form.storefrontIds.length > 0) return
    setForm((prev) => ({ ...prev, storefrontIds: storefronts.map((s) => s.id) }))
  }, [showStorefrontFilter, selected, storefronts, form.storefrontIds.length])

  const visibleUsers = useMemo(() => {
    if (!showStorefrontFilter) return users
    if (storefrontFilter === 'all') {
      // Show only users that are connected to at least one storefront by default.
      return users.filter((u) => (u.storefront_ids ?? []).length > 0)
    }
    const id = Number(storefrontFilter)
    if (!Number.isFinite(id)) return users
    return users.filter((u) => (u.storefront_ids ?? []).includes(id))
  }, [users, storefrontFilter, showStorefrontFilter])

  const resetForm = () => {
    setSelected(null)
    setForm(emptyForm)
    setShowPassword(false)
  }

  const startEdit = (user: PartnerUserItem) => {
    const normalizedStorefrontIds = (user.storefront_ids ?? []).map((id) => Number(id)).filter((id) => Number.isFinite(id))
    setSelected(user)
    setForm({
      name: user.name,
      username: user.username,
      email: user.email ?? '',
      storefrontIds: normalizedStorefrontIds,
      password: '',
    })
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.username.trim()) {
      showErrorToast('Name and username are required.')
      return
    }
    if (form.storefrontIds.length === 0) {
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
      resetForm()
    } catch (error) {
      const apiErr = error as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message || 'Failed to save partner user.')
    }
  }

  const targetAccessUser = useMemo(() => {
    if (accessTargetUserId !== null) {
      return users.find((u) => u.id === accessTargetUserId) ?? null
    }
    return null
  }, [accessTargetUserId, users])

  const currentAccessIds = useMemo(() => {
    if (!targetAccessUser) return []
    if (accessTargetUserId === targetAccessUser.id) {
      return accessStorefrontIds
    }
    return (targetAccessUser.disabled_storefront_ids ?? []).map((id) => Number(id)).filter((id) => Number.isFinite(id))
  }, [targetAccessUser, accessTargetUserId, accessStorefrontIds])

  const currentAssignedAccessIds = useMemo(() => {
    if (!targetAccessUser) return []
    return (targetAccessUser.storefront_ids ?? []).map((id) => Number(id)).filter((id) => Number.isFinite(id))
  }, [targetAccessUser])

  const saveStorefrontAccess = async (targetUser: PartnerUserItem, nextDisabledIds: number[]) => {
    setIsSavingStorefrontAccess(true)
    try {
      await updateUser({
        id: targetUser.id,
        name: targetUser.name.trim(),
        username: targetUser.username.trim(),
        email: (targetUser.email ?? '').trim(),
        disabled_storefront_ids: nextDisabledIds,
      }).unwrap()
      setAccessStorefrontIds(nextDisabledIds)
      await refetch()
      showSuccessToast('Storefront access updated.')
    } catch (error) {
      const apiErr = error as { data?: { message?: string } }
      showErrorToast(apiErr?.data?.message || 'Failed to update storefront access.')
      const fallbackIds = (targetUser.disabled_storefront_ids ?? []).map((id) => Number(id)).filter((id) => Number.isFinite(id))
      setAccessStorefrontIds(fallbackIds)
    } finally {
      setIsSavingStorefrontAccess(false)
    }
  }

  const toggleStorefrontAccess = async (storefrontId: number) => {
    const targetUser = targetAccessUser
    if (!targetUser) {
      showErrorToast('No partner user available to update.')
      return
    }
    const assignedIds = (targetUser.storefront_ids ?? []).map((id) => Number(id)).filter((id) => Number.isFinite(id))
    if (!assignedIds.includes(storefrontId)) {
      showErrorToast('This storefront is not assigned to the selected user.')
      return
    }

    const currentDisabledIds = accessTargetUserId === targetUser.id
      ? accessStorefrontIds
      : (targetUser.disabled_storefront_ids ?? []).map((id) => Number(id)).filter((id) => Number.isFinite(id))
    // In this section, a toggled ON switch means "disable access".
    // Stored IDs here are disabled IDs, so ON adds the storefront ID.
    const next = new Set(currentDisabledIds)
    const isCurrentlyDisabled = next.has(storefrontId)
    if (isCurrentlyDisabled) next.delete(storefrontId)
    else next.add(storefrontId)
    const nextDisabledIds = Array.from(next)

    setAccessTargetUserId(targetUser.id)
    setAccessStorefrontIds(nextDisabledIds)
    await saveStorefrontAccess(targetUser, nextDisabledIds)
  }

  const handleDelete = async (user: PartnerUserItem) => {
    if (busy) return
    setDeleteModalUser(user)
  }

  const confirmDelete = async () => {
    const user = deleteModalUser
    setDeleteModalUser(null)
    if (!user) return
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
    const apiMessage = (loadError as { data?: { message?: string } } | undefined)?.data?.message
      || (loadError as { error?: string } | undefined)?.error
      || 'Failed to load partner users.'

    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center shadow-sm dark:border-red-900/40 dark:bg-red-950/30">
        <p className="text-sm font-semibold text-red-700 dark:text-red-300">{apiMessage}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={`${shellCard} p-4`}>
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-100">Partner Users</p>
            <h1 className="mt-2 text-3xl font-bold leading-none">Manage Accounts</h1>
            <p className="mt-2 text-sm text-indigo-100">Create, edit and manage partner user accounts and their access.</p>
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Assigned Storefronts</p>
            <div className="space-y-2">
              {storefronts.map((store) => {
                const count = users.filter((u) => (u.storefront_ids ?? []).includes(store.id)).length
                return (
                  <div key={store.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{store.name}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{store.slug}</p>
                    </div>
                    <span className="rounded-lg bg-white px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <Field label="Full Name">
              <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Enter full name" className={inputClass} />
            </Field>
            <Field label="Username">
              <input
                name="partner_user_username_input"
                autoComplete="off"
                value={form.username}
                onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
                placeholder="Enter username"
                className={inputClass}
              />
            </Field>
            <Field label="Email (Optional)">
              <input
                type="email"
                name="partner_user_email_input"
                autoComplete="off"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="name@example.com"
                className={inputClass}
              />
            </Field>
            <Field label={selected ? 'Password (Optional)' : 'Password'}>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="partner_user_password_input"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder={selected ? 'Leave blank to keep' : '••••••••'}
                  className={`${inputClass} pr-14`}
                />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-700">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </Field>
            <Field label="Assign Storefronts">
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/60">
                {showStorefrontFilter ? (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, storefrontIds: storefronts.map((s) => s.id) }))}
                      disabled={storefronts.length === 0}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, storefrontIds: [] }))}
                      disabled={form.storefrontIds.length === 0}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Clear
                    </button>
                  </div>
                ) : null}
                <div className="max-h-36 overflow-auto rounded-lg border border-slate-200 bg-white p-1.5 dark:border-slate-700 dark:bg-slate-900">
                  {storefronts.map((store) => {
                    const checked = form.storefrontIds.includes(store.id)
                    return (
                      <label key={`assign-${store.id}`} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setForm((prev) => {
                              const next = new Set(prev.storefrontIds)
                              if (next.has(store.id)) next.delete(store.id)
                              else next.add(store.id)
                              return { ...prev, storefrontIds: Array.from(next) }
                            })
                          }
                        />
                        <span className="truncate">{store.name}</span>
                        <span className="text-[10px] text-slate-400">({store.slug})</span>
                      </label>
                    )
                  })}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Selected: <span className="font-semibold">{form.storefrontIds.length}</span>
                </p>
              </div>
            </Field>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={busy}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {selected ? 'Update User' : 'Create User'}
            </button>
            {selected ? (
              <button type="button" onClick={resetForm} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                Cancel Edit
              </button>
            ) : null}
          </div>
        </aside>

        <section className="space-y-4">
          <div className={`${shellCard} p-4`}>
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, username, email..."
                className="min-w-[240px] flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800"
              />
              {showStorefrontFilter ? (
                <select value={storefrontFilter} onChange={(event) => setStorefrontFilter(event.target.value)} className="w-[220px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800">
                  <option value="all">All Storefronts</option>
                  {storefronts.map((store) => (
                    <option key={store.id} value={String(store.id)}>{store.name}</option>
                  ))}
                </select>
              ) : null}
              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
              >
                Filters
              </button>
            </div>
            {showFilters ? (
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">{visibleUsers.length} users shown</span>
                <button type="button" onClick={() => setStorefrontFilter('all')} className="rounded-lg border border-slate-300 px-2 py-1 font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Reset Store Filter</button>
              </div>
            ) : null}
          </div>

          <div className={`${shellCard} p-4`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Users <span className="ml-2 rounded-lg bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">{visibleUsers.length}</span></h2>
            </div>

            {visibleUsers.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">No partner users found.</p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_140px_180px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 md:grid dark:border-slate-700 dark:bg-slate-800/60">
                  <p>User</p>
                  <p>Store</p>
                  <p>Status</p>
                  <p className="text-right">Actions</p>
                </div>

                {visibleUsers.map((user) => (
                  <div key={user.id} className="grid gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_140px_180px] dark:border-slate-800">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">@{user.username}</p>
                      {user.email ? <p className="truncate text-xs text-slate-400 dark:text-slate-500">{user.email}</p> : null}
                    </div>
                    <div className="min-w-0">
                      {(user.storefront_ids ?? []).length > 0 ? (
                        (user.storefront_ids ?? []).slice(0, 2).map((id) => (
                          <p key={`${user.id}-${id}`} className="truncate text-sm text-slate-700 dark:text-slate-300">{storefrontNameById.get(id) || `Storefront #${id}`}</p>
                        ))
                      ) : (
                        <p className="text-xs text-amber-600 dark:text-amber-300">No storefront assigned</p>
                      )}
                    </div>
                    <div>
                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">Active</span>
                    </div>
                    <div className="flex items-center justify-start gap-2 md:justify-end">
                      <button
                        type="button"
                        onClick={() => startEdit(user)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
                        title="Edit user"
                        aria-label="Edit user"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(user)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
                        title="Delete user"
                        aria-label="Delete user"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showStorefrontFilter ? (
            <div className={`${shellCard} p-4`}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Partner Storefront Access (toggle ON = access disabled)</p>
                <button
                  type="button"
                  onClick={() => {
                    if (!targetAccessUser) return
                    const nextIds: number[] = []
                    setAccessTargetUserId(targetAccessUser.id)
                    setAccessStorefrontIds(nextIds)
                    void saveStorefrontAccess(targetAccessUser, nextIds)
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300"
                  disabled={!targetAccessUser || isSavingStorefrontAccess}
                >
                  Enable All Access
                </button>
              </div>
              <p className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                {targetAccessUser
                  ? <>Managing access for <span className="font-semibold">@{targetAccessUser.username}</span>.</>
                  : <>No user selected: click <span className="font-semibold">Edit</span> on a user first.</>}
              </p>


              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                {storefronts.map((store) => {
                  const isAssigned = currentAssignedAccessIds.includes(store.id)
                  const isDisabled = currentAccessIds.includes(store.id)
                  return (
                    <label key={`toggle-${store.id}`} className="flex cursor-pointer items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-800">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{store.name}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {store.slug}
                          {!isAssigned ? ' • Not assigned' : ''}
                        </p>
                      </div>
                      <span className="relative inline-flex h-6 w-11 items-center">
                        <input
                          type="checkbox"
                          checked={isDisabled}
                          onChange={() => void toggleStorefrontAccess(store.id)}
                          disabled={isSavingStorefrontAccess || !targetAccessUser || !isAssigned}
                          className="peer sr-only"
                        />
                        <span className={`h-6 w-11 rounded-full transition ${isDisabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'} ${(isSavingStorefrontAccess || !targetAccessUser || !isAssigned) ? 'opacity-50' : ''}`} />
                        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isDisabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {deleteModalUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setDeleteModalUser(null)} role="presentation" />
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Delete partner user</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to delete <span className="font-semibold">@{deleteModalUser.username}</span>?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
                disabled={busy}
              >
                {busy ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </div>
  )
}
