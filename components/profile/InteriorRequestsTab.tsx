'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import {
  Clock,
  Eye,
  FileText,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Inbox,
  UserCheck,
  AlertTriangle,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react';
import {
  InteriorRequestItem,
  InteriorRequestStatus,
  InteriorRequestUpdateType,
  useGetMyInteriorRequestsQuery,
} from '@/store/api/interiorRequestsApi';

/* --- Config --- */
const statusMeta: Record<
  InteriorRequestStatus,
  { label: string; pill: string; dot: string; accent: string; icon: React.ReactNode; tone: string }
> = {
  pending: {
    label: 'Pending Review',
    tone: 'text-sky-600 dark:text-sky-400',
    dot: 'bg-sky-400',
    accent: 'border-l-sky-400',
    pill: 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400',
    icon: <Clock className="h-3 w-3" />,
  },
  reviewing: {
    label: 'Reviewing',
    tone: 'text-sky-600 dark:text-sky-400',
    dot: 'bg-sky-500',
    accent: 'border-l-sky-500',
    pill: 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400',
    icon: <Eye className="h-3 w-3" />,
  },
  estimate_ready: {
    label: 'Estimate Ready',
    tone: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    accent: 'border-l-emerald-500',
    pill: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400',
    icon: <FileText className="h-3 w-3" />,
  },
  scheduled: {
    label: 'Scheduled',
    tone: 'text-violet-600 dark:text-violet-400',
    dot: 'bg-violet-500',
    accent: 'border-l-violet-500',
    pill: 'bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400',
    icon: <CalendarCheck className="h-3 w-3" />,
  },
  completed: {
    label: 'Completed',
    tone: 'text-green-600 dark:text-green-400',
    dot: 'bg-green-500',
    accent: 'border-l-green-500',
    pill: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-400',
    accent: 'border-l-rose-400',
    pill: 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400',
    icon: <XCircle className="h-3 w-3" />,
  },
};

const updateMeta: Record<
  InteriorRequestUpdateType,
  { label: string; dot: string; badge: string }
> = {
  message: {
    label: 'Admin Note',
    dot: 'bg-slate-400 dark:bg-slate-500',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  },
  estimate: {
    label: 'Estimate',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  },
  design: {
    label: 'Design',
    dot: 'bg-fuchsia-500',
    badge: 'bg-fuchsia-50 dark:bg-fuchsia-900/40 text-fuchsia-700 dark:text-fuchsia-300',
  },
  schedule: {
    label: 'Schedule',
    dot: 'bg-sky-500',
    badge: 'bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
  },
};

const statusOrder: InteriorRequestStatus[] = [
  'pending', 'reviewing', 'estimate_ready', 'scheduled', 'completed', 'cancelled',
];

/* --- Helpers --- */
const formatDateTime = (date?: string | null, time?: string | null) => {
  if (!date && !time) return 'Awaiting confirmation';
  if (!date) return time || 'Awaiting confirmation';
  const parsed = new Date(date);
  const displayDate = Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  return time ? `${displayDate} · ${time}` : displayDate;
};

const formatTimestamp = (value?: string | null) => {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
};

/* --- Main component --- */
export default function InteriorRequestsTab() {
  const searchParams = useSearchParams();
  const highlightedRequest = Number(searchParams.get('request') ?? 0);
  const { data, isLoading, isError } = useGetMyInteriorRequestsQuery();
  const requests = useMemo(() => data?.requests ?? [], [data?.requests]);
  const [selectedRequestId, setSelectedRequestId] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<InteriorRequestStatus | 'all'>('all');
  const [isMobile, setIsMobile] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1280);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isMobile && mobileDetailOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, mobileDetailOpen]);

  const selectedRequest = useMemo(() => {
    if (!requests.length) return null;
    if (selectedRequestId > 0) return requests.find((r) => r.id === selectedRequestId) ?? requests[0];
    if (highlightedRequest > 0) return requests.find((r) => r.id === highlightedRequest) ?? requests[0];
    return requests[0];
  }, [highlightedRequest, requests, selectedRequestId]);

  const filteredRequests = useMemo(() =>
    statusFilter === 'all' ? requests : requests.filter((r) => r.status === statusFilter),
    [requests, statusFilter],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: requests.length };
    requests.forEach((r) => { map[r.status] = (map[r.status] ?? 0) + 1; });
    return map;
  }, [requests]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-16">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500 dark:text-gray-400">Loading your interior requests…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-5">
        <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
        <p className="text-sm text-red-700 dark:text-red-400">Could not load your interior requests. Please try again.</p>
      </div>
    );
  }

  if (!requests.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-10 text-center"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-900/30">
          <Inbox className="h-7 w-7 text-sky-400 dark:text-sky-500" />
        </div>
        <p className="text-base font-bold text-slate-900 dark:text-white">No Interior Requests Yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-gray-400">
          Once you submit a booking from the Interior Services page, your project inbox will appear here.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="space-y-4"
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-900/30">
            <Inbox className="h-4.5 w-4.5 text-sky-500 dark:text-sky-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Interior Requests</h3>
            <p className="text-[11px] text-slate-500 dark:text-gray-400">{requests.length} total request{requests.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <span className="rounded-full border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/30 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:text-sky-400">
          Authenticated access only
        </span>
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
        {([['all', 'All'] as const, ...statusOrder.map((s) => [s, statusMeta[s].label] as const)]).map(([key, label]) => {
          const count = counts[key] ?? 0;
          const active = statusFilter === key;
          if (key !== 'all' && count === 0) return null;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                active
                  ? key === 'all'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                    : `${statusMeta[key as InteriorRequestStatus].pill} border-current`
                  : 'bg-white dark:bg-gray-900 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
              }`}
            >
              {key !== 'all' && active && statusMeta[key as InteriorRequestStatus].icon}
              {label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${active ? 'bg-white/25' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Two-column layout */}
      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">

        {/* Request list */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-3">
          <p className="mb-2.5 px-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-gray-500">
            My Requests
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={statusFilter}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="space-y-1.5"
            >
              {filteredRequests.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400 dark:text-gray-500">No requests for this status.</p>
              ) : filteredRequests.map((request, i) => {
                const active = request.id === selectedRequest?.id;
                const meta = statusMeta[request.status];
                return (
                  <motion.button
                    key={request.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18, delay: i * 0.04 }}
                    type="button"
                    onClick={() => { setSelectedRequestId(request.id); if (isMobile) setMobileDetailOpen(true); }}
                    className={`group w-full rounded-xl border-l-[3px] border border-slate-200 dark:border-slate-700 p-3.5 text-left transition-all ${meta.accent} ${
                      active
                        ? 'bg-slate-50 dark:bg-gray-700/60 shadow-sm'
                        : 'bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500">
                          {request.reference}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white">
                          {request.project_type}
                        </p>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.pill}`}>
                        {meta.icon}
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500 dark:text-gray-400">
                      {request.service_type} · {request.property_type || 'Property TBD'}
                    </p>
                    {request.latest_update?.message && (
                      <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-slate-400 dark:text-gray-500">
                        {request.latest_update.message}
                      </p>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Detail panel — desktop only */}
        <AnimatePresence mode="wait">
          {selectedRequest && (
            <motion.div
              key={selectedRequest.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="hidden xl:block space-y-3.5"
            >
              <RequestHeader selectedRequest={selectedRequest} />
              <ProjectInbox selectedRequest={selectedRequest} />
              <WhatsNext />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile full-screen detail slide panel */}
      <motion.div
        initial={false}
        animate={{ x: isMobile && mobileDetailOpen ? 0 : '100%' }}
        transition={{ type: 'tween', duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
        className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-gray-900 xl:hidden"
      >
        {/* Mobile header with back button */}
        <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3">
          <button
            type="button"
            onClick={() => setMobileDetailOpen(false)}
            className="flex items-center gap-1.5 rounded-lg p-1 text-sky-600 dark:text-sky-400 transition active:bg-sky-50 dark:active:bg-sky-900/30"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          {selectedRequest && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {selectedRequest.project_type}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">{selectedRequest.reference}</p>
            </div>
          )}
        </div>

        {/* Scrollable detail content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <AnimatePresence mode="wait">
            {selectedRequest && mobileDetailOpen && (
              <motion.div
                key={selectedRequest.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5 p-4"
              >
                <RequestHeader selectedRequest={selectedRequest} />
                <ProjectInbox selectedRequest={selectedRequest} />
                <WhatsNext />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* --- Request header --- */
function RequestHeader({ selectedRequest }: { selectedRequest: InteriorRequestItem }) {
  const meta = statusMeta[selectedRequest.status];
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500">
            {selectedRequest.reference}
          </p>
          <h4 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            {selectedRequest.project_type}
          </h4>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-gray-400">
            {selectedRequest.service_type} for {selectedRequest.property_type || 'your property'}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${meta.pill}`}>
          {meta.icon}
          {meta.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
        {[
          { label: 'Preferred Schedule', value: formatDateTime(selectedRequest.preferred_date, selectedRequest.preferred_time) },
          { label: 'Assigned Admin', value: selectedRequest.assigned_admin?.name || 'Unassigned' },
          { label: 'Budget Range', value: selectedRequest.budget || 'Not provided' },
          { label: 'Target Timeline', value: selectedRequest.target_timeline || 'To be discussed' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: i * 0.05 }}
            className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-gray-700/40 px-4 py-3"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-gray-500">{item.label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-gray-200">{item.value}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* --- Project inbox / timeline --- */
function ProjectInbox({ selectedRequest }: { selectedRequest: InteriorRequestItem }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-gray-700/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <MessageSquare className="h-4 w-4 text-slate-400 dark:text-gray-500" />
          <span className="text-sm font-bold text-slate-900 dark:text-white">Project Inbox</span>
          <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-700/40 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-gray-400">
            {selectedRequest.updates.length} {selectedRequest.updates.length === 1 ? 'update' : 'updates'}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="inbox-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-5">
              <p className="mb-4 text-xs text-slate-500 dark:text-gray-400">
                Only updates tied to your account appear here.
              </p>

              {selectedRequest.updates.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-700/40 p-6 text-center">
                  <p className="text-sm text-slate-400 dark:text-gray-500">No updates yet. Check back soon.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedRequest.updates.map((update, index) => {
                    const meta = updateMeta[update.type];
                    return (
                      <motion.div
                        key={update.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: index * 0.05 }}
                        className="flex gap-3"
                      >
                        <div className="flex flex-col items-center pt-1">
                          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} />
                          {index !== selectedRequest.updates.length - 1 && (
                            <span className="mt-2 h-full min-h-8 w-px bg-slate-200 dark:bg-slate-700" />
                          )}
                        </div>
                        <div className="flex-1 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-gray-700/40 px-4 py-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.badge}`}>
                                {meta.label}
                              </span>
                              <span className="text-sm font-semibold text-slate-900 dark:text-white">{update.title}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 dark:text-gray-500">{formatTimestamp(update.created_at)}</span>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-gray-300">{update.message}</p>
                          {update.actor_admin?.name && (
                            <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-gray-400">
                              <UserCheck className="h-3 w-3" />
                              Posted by {update.actor_admin.name}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --- What's next --- */
function WhatsNext() {
  return (
    <div className="rounded-2xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/60 dark:bg-sky-900/10 p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-sky-500 dark:text-sky-400">What Happens Next</p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-gray-400">Your admin team will walk you through each step below.</p>
      <div className="mt-3.5 grid gap-2.5 md:grid-cols-3">
        {[
          { icon: <FileText className="h-4 w-4 text-sky-500" />, label: 'Estimate', desc: 'Review costing and scope once the admin uploads your quotation.' },
          { icon: <Eye className="h-4 w-4 text-sky-500" />, label: 'Design Files', desc: 'Concept directions and design updates stay tied to this request.' },
          { icon: <CalendarCheck className="h-4 w-4 text-sky-500" />, label: 'Schedule', desc: 'Consultation and site-visit confirmations appear here and in your email.' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: i * 0.06 }}
            className="rounded-xl border border-sky-200 dark:border-sky-800/50 bg-white/80 dark:bg-gray-800/60 px-4 py-3.5"
          >
            <div className="flex items-center gap-2 mb-2">
              {item.icon}
              <p className="text-xs font-bold uppercase tracking-wide text-sky-600 dark:text-sky-400">{item.label}</p>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-300">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
