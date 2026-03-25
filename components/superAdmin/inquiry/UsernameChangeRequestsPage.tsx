'use client'

import { useMemo, useState } from 'react';
import { useApproveUsernameChangeMutation, useGetUsernameChangeRequestsQuery, useRejectUsernameChangeMutation } from '@/store/api/adminInquiriesApi';

const statusStyles: Record<string, string> = {
  pending_review: 'bg-amber-50 text-amber-700 border border-amber-100',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  rejected: 'bg-rose-50 text-rose-700 border border-rose-100',
};

export default function UsernameChangeRequestsPage() {
  const { data, isLoading, isError } = useGetUsernameChangeRequestsQuery();
  const [approveRequest, { isLoading: isApproving }] = useApproveUsernameChangeMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectUsernameChangeMutation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>('all');
  const [confirm, setConfirm] = useState<{ open: boolean; action: 'approve' | 'reject'; id: number | null; requested?: string | null }>({
    open: false,
    action: 'approve',
    id: null,
    requested: null,
  });

  const rows = useMemo(() => {
    const source = data?.requests ?? [];
    const q = search.trim().toLowerCase();
    const filtered = source.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        item.customer_name,
        item.customer_email,
        item.current_username,
        item.requested_username,
        String(item.ticket_id),
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
    return filtered;
  }, [data?.requests, search, statusFilter]);

  const openConfirm = (action: 'approve' | 'reject', id: number, requested?: string | null) => {
    setConfirm({ open: true, action, id, requested });
  };

  const closeConfirm = () => setConfirm({ open: false, action: 'approve', id: null, requested: null });

  const handleConfirm = async () => {
    if (!confirm.id) return;
    if (confirm.action === 'approve') {
      await approveRequest({ id: confirm.id }).unwrap();
    } else {
      await rejectRequest({ id: confirm.id }).unwrap();
    }
    closeConfirm();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Username Change Requests</h1>
          <p className="text-xs text-slate-500 mt-1">All customer requests submitted via OTP and awaiting review.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending_review' | 'approved' | 'rejected')}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300"
          >
            <option value="all">All Status</option>
            <option value="pending_review">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, username, ticket..."
            className="w-64 max-w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {rows.length} request{rows.length !== 1 ? 's' : ''}
          </p>
          {isLoading && <span className="text-xs text-slate-400">Loading…</span>}
        </div>

        {isError && (
          <div className="p-4 text-sm text-rose-600">Failed to load requests.</div>
        )}

        {!isLoading && !rows.length && !isError && (
          <div className="p-6 text-sm text-slate-500">No username change requests yet.</div>
        )}

        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Ticket</th>
                  <th className="text-left px-4 py-3 font-semibold">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold">Current</th>
                  <th className="text-left px-4 py-3 font-semibold">Requested</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Submitted</th>
                  <th className="text-left px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-700 font-semibold">#{item.ticket_id}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800 font-medium">{item.customer_name ?? 'Unknown'}</p>
                      <p className="text-[11px] text-slate-400">{item.customer_email ?? 'No email'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.current_username ? `@${item.current_username}` : '—'}</td>
                    <td className="px-4 py-3 text-slate-800 font-semibold">{item.requested_username ? `@${item.requested_username}` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusStyles[item.status] ?? statusStyles.pending_review}`}>
                        {item.status === 'pending_review' ? 'Pending' : item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {item.submitted_at ? new Date(item.submitted_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {item.status === 'pending_review' ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isApproving}
                            onClick={() => openConfirm('approve', item.id, item.requested_username)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={isRejecting}
                            onClick={() => openConfirm('reject', item.id, item.requested_username)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirm.open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {confirm.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {confirm.action === 'approve'
                  ? 'This will update the customer username.'
                  : 'This will mark the request as rejected.'}
              </p>
            </div>
            <div className="p-5">
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">Requested username</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {confirm.requested ? `@${confirm.requested}` : '—'}
                </p>
              </div>
            </div>
            <div className="p-5 pt-0 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeConfirm}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirm.action === 'approve' ? isApproving : isRejecting}
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white ${
                  confirm.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {confirm.action === 'approve' ? (isApproving ? 'Approving…' : 'Confirm Approval') : (isRejecting ? 'Rejecting…' : 'Confirm Rejection')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
