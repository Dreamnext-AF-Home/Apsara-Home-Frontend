'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  AdminUserItem,
  useCreateAdminUserMutation,
  useDeleteAdminUserMutation,
  useGetAdminUsersQuery,
  useUpdateAdminUserMutation,
} from '@/store/api/adminUsersApi'

const ROLE_OPTIONS = [
  { value: 1, label: 'Super Admin' },
  { value: 2, label: 'Admin' },
  { value: 3, label: 'CSR' },
  { value: 4, label: 'Web Content' },
  { value: 5, label: 'Accounting' },
  { value: 6, label: 'Finance Officer' },
]

type CreateForm = {
  name: string
  username: string
  email: string
  password: string
  user_level_id: number
}

const initialCreateForm: CreateForm = {
  name: '',
  username: '',
  email: '',
  password: '',
  user_level_id: 2,
}

export default function AdminUsersPageMain() {
  const { data: session } = useSession()
  const role = String(session?.user?.role ?? '').toLowerCase()
  const isSuperAdmin = role === 'super_admin'

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [createForm, setCreateForm] = useState<CreateForm>(initialCreateForm)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [busyUpdateId, setBusyUpdateId] = useState<number | null>(null)
  const [editTarget, setEditTarget] = useState<AdminUserItem | null>(null)
  const [editForm, setEditForm] = useState<CreateForm>(initialCreateForm)

  const { data, isLoading, isError } = useGetAdminUsersQuery({
    search: search.trim() || undefined,
    page,
    perPage: 15,
  })

  const [createAdminUser, { isLoading: isCreating }] = useCreateAdminUserMutation()
  const [updateAdminUser] = useUpdateAdminUserMutation()
  const [deleteAdminUser] = useDeleteAdminUserMutation()

  const rows = useMemo(() => data?.users ?? [], [data?.users])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setMessage(null)

    try {
      await createAdminUser(createForm).unwrap()
      setMessage({ type: 'success', text: 'Admin account created successfully.' })
      setCreateForm(initialCreateForm)
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } }
      const firstValidation = apiErr?.data?.errors ? Object.values(apiErr.data.errors)[0]?.[0] : undefined
      setMessage({
        type: 'error',
        text: firstValidation || apiErr?.data?.message || 'Failed to create admin account.',
      })
    }
  }

  const openEditModal = (row: AdminUserItem) => {
    setEditTarget(row)
    setEditForm({
      name: row.name,
      username: row.username,
      email: row.email,
      password: '',
      user_level_id: row.user_level_id,
    })
  }

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setMessage(null)
    setBusyUpdateId(editTarget.id)
    try {
      await updateAdminUser({
        id: editTarget.id,
        name: editForm.name,
        username: editForm.username,
        email: editForm.email,
        user_level_id: editForm.user_level_id,
        password: editForm.password.trim() || undefined,
      }).unwrap()
      setMessage({ type: 'success', text: `Updated account for ${editTarget.username}.` })
      setEditTarget(null)
      setEditForm(initialCreateForm)
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } }
      const firstValidation = apiErr?.data?.errors ? Object.values(apiErr.data.errors)[0]?.[0] : undefined
      setMessage({
        type: 'error',
        text: firstValidation || apiErr?.data?.message || 'Failed to update admin account.',
      })
    } finally {
      setBusyUpdateId(null)
    }
  }

  const handleDelete = async (row: AdminUserItem) => {
    const confirmed = window.confirm(`Delete admin account "${row.username}"?`)
    if (!confirmed) return
    setMessage(null)
    setBusyUpdateId(row.id)
    try {
      await deleteAdminUser({ id: row.id }).unwrap()
      setMessage({ type: 'success', text: `Deleted account ${row.username}.` })
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } }
      setMessage({ type: 'error', text: apiErr?.data?.message || 'Failed to delete admin account.' })
    } finally {
      setBusyUpdateId(null)
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        Only super admin can access Users & Roles management.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Users & Roles</h1>
        <p className="text-sm text-slate-500 mt-0.5">Create and manage admin accounts in tbl_admin.</p>
      </div>

      <form onSubmit={handleCreate} className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Create Admin Account</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            required
            value={createForm.name}
            onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Full name"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            required
            value={createForm.username}
            onChange={(e) => setCreateForm((p) => ({ ...p, username: e.target.value }))}
            placeholder="Username"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            required
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="Email"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            required
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
            placeholder="Password (min 8)"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={createForm.user_level_id}
            onChange={(e) => setCreateForm((p) => ({ ...p, user_level_id: Number(e.target.value) }))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            {ROLE_OPTIONS.map((roleOption) => (
              <option key={roleOption.value} value={roleOption.value}>
                {roleOption.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isCreating}
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {isCreating ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search name, username, email..."
            className="w-full max-w-md rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <p className="text-xs text-slate-500">Total: {data?.meta?.total ?? 0}</p>
        </div>

        {message ? (
          <div className={`rounded-xl border px-3 py-2 text-sm ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Failed to load admin users.
          </div>
        ) : isLoading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-3 py-2.5 font-semibold">Name</th>
                  <th className="px-3 py-2.5 font-semibold">Username</th>
                  <th className="px-3 py-2.5 font-semibold">Email</th>
                  <th className="px-3 py-2.5 font-semibold">Role</th>
                  <th className="px-3 py-2.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 last:border-b-0 text-sm">
                    <td className="px-3 py-2.5 text-slate-800">{row.name}</td>
                    <td className="px-3 py-2.5 text-slate-700">{row.username}</td>
                    <td className="px-3 py-2.5 text-slate-700">{row.email}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {row.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          disabled={busyUpdateId === row.id}
                          onClick={() => openEditModal(row)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                          Edit
                        </button>
                        <button
                          disabled={busyUpdateId === row.id}
                          onClick={() => handleDelete(row)}
                          className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-500">
                      No admin users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-500">
          <p>
            Showing {data?.meta?.from ?? 0} - {data?.meta?.to ?? 0} of {data?.meta?.total ?? 0}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={(data?.meta?.current_page ?? 1) <= 1}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 disabled:opacity-40"
            >
              Prev
            </button>
            <span>Page {data?.meta?.current_page ?? 1} / {data?.meta?.last_page ?? 1}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(data?.meta?.current_page ?? 1) >= (data?.meta?.last_page ?? 1)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {editTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={handleEditSubmit} className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Edit Admin Account</h3>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="space-y-3 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Full name"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  required
                  value={editForm.username}
                  onChange={(e) => setEditForm((p) => ({ ...p, username: e.target.value }))}
                  placeholder="Username"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  required
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Email"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <select
                  value={editForm.user_level_id}
                  onChange={(e) => setEditForm((p) => ({ ...p, user_level_id: Number(e.target.value) }))}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {ROLE_OPTIONS.map((roleOption) => (
                    <option key={roleOption.value} value={roleOption.value}>
                      {roleOption.label}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="New password (optional, min 8)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busyUpdateId === editTarget.id}
                className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {busyUpdateId === editTarget.id ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
