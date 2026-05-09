'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UnilevelAwardItem } from '@/store/api/encashmentApi';

const peso = (v: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(v || 0);

const num = (v: number) =>
  new Intl.NumberFormat('en-PH', { maximumFractionDigits: 2 }).format(v || 0);

const UNILEVEL_TOTAL_RATE_PERCENT = 6;
const UNILEVEL_LEVEL_SPLIT = 10;

const percent = (v: number) => (v * 100).toFixed(2).replace(/\.00$/, '');

const formatDate = (v?: string | null) => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
};

type MonthlyActivation = {
  status: 'active' | 'inactive';
  threshold_pv: number;
  current_month_pv: number;
  qualifying_pv: number;
  remaining_pv: number;
  deadline_day: number;
  deadline_at?: string | null;
  window_open: boolean;
  month_label: string;
};

type Props = {
  awards: UnilevelAwardItem[];
  monthlyActivation?: MonthlyActivation;
};

const LEVEL_COLORS = [
  { bar: 'from-sky-400 to-cyan-400',       badge: 'bg-sky-500',     badgeHex: '#0ea5e9', ring: 'ring-sky-200 dark:ring-sky-800/60',       text: 'text-sky-700 dark:text-sky-300',       bg: 'bg-sky-50 dark:bg-sky-900/20',       border: 'border-sky-200 dark:border-sky-800/60'    },
  { bar: 'from-violet-400 to-purple-400',  badge: 'bg-violet-500',  badgeHex: '#8b5cf6', ring: 'ring-violet-200 dark:ring-violet-800/60', text: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800/60' },
  { bar: 'from-emerald-400 to-teal-400',   badge: 'bg-emerald-500', badgeHex: '#10b981', ring: 'ring-emerald-200 dark:ring-emerald-800/60', text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800/60' },
  { bar: 'from-rose-400 to-pink-400',      badge: 'bg-rose-500',    badgeHex: '#f43f5e', ring: 'ring-rose-200 dark:ring-rose-800/60',     text: 'text-rose-700 dark:text-rose-300',     bg: 'bg-rose-50 dark:bg-rose-900/20',     border: 'border-rose-200 dark:border-rose-800/60'  },
  { bar: 'from-amber-400 to-orange-400',   badge: 'bg-amber-500',   badgeHex: '#f59e0b', ring: 'ring-amber-200 dark:ring-amber-800/60',   text: 'text-amber-700 dark:text-amber-300',   bg: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-200 dark:border-amber-800/60' },
  { bar: 'from-indigo-400 to-blue-400',    badge: 'bg-indigo-500',  badgeHex: '#6366f1', ring: 'ring-indigo-200 dark:ring-indigo-800/60', text: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800/60' },
  { bar: 'from-fuchsia-400 to-purple-400', badge: 'bg-fuchsia-500', badgeHex: '#d946ef', ring: 'ring-fuchsia-200 dark:ring-fuchsia-800/60', text: 'text-fuchsia-700 dark:text-fuchsia-300', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', border: 'border-fuchsia-200 dark:border-fuchsia-800/60' },
  { bar: 'from-cyan-400 to-sky-400',       badge: 'bg-cyan-500',    badgeHex: '#06b6d4', ring: 'ring-cyan-200 dark:ring-cyan-800/60',     text: 'text-cyan-700 dark:text-cyan-300',     bg: 'bg-cyan-50 dark:bg-cyan-900/20',     border: 'border-cyan-200 dark:border-cyan-800/60'  },
  { bar: 'from-lime-400 to-green-400',     badge: 'bg-lime-500',    badgeHex: '#84cc16', ring: 'ring-lime-200 dark:ring-lime-800/60',     text: 'text-lime-700 dark:text-lime-300',     bg: 'bg-lime-50 dark:bg-lime-900/20',     border: 'border-lime-200 dark:border-lime-800/60'  },
  { bar: 'from-orange-400 to-red-400',     badge: 'bg-orange-500',  badgeHex: '#f97316', ring: 'ring-orange-200 dark:ring-orange-800/60', text: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800/60' },
];

const colorOf = (level: number) => LEVEL_COLORS[(level - 1) % LEVEL_COLORS.length];

export default function NetworkEarningsTab({ awards, monthlyActivation }: Props) {
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  const totalBonus = useMemo(() => awards.reduce((s, a) => s + Number(a.bonus_amount ?? 0), 0), [awards]);
  const totalPv    = useMemo(() => awards.reduce((s, a) => s + Number(a.earned_pv    ?? 0), 0), [awards]);

  const levels = useMemo(() => {
    const map = new Map<number, { pv: number; bonus: number; count: number; rate: number }>();
    for (const a of awards) {
      const lvl = Number(a.level_no ?? 0);
      if (!lvl) continue;
      const prev = map.get(lvl) ?? { pv: 0, bonus: 0, count: 0, rate: Number(a.bonus_rate ?? 0) };
      map.set(lvl, {
        pv:    prev.pv    + Number(a.earned_pv    ?? 0),
        bonus: prev.bonus + Number(a.bonus_amount ?? 0),
        count: prev.count + 1,
        rate:  Number(a.bonus_rate ?? 0),
      });
    }
    return [...map.entries()]
      .map(([level, data]) => ({ level, ...data }))
      .sort((a, b) => a.level - b.level);
  }, [awards]);

  const contributors = useMemo(() => {
    const map = new Map<string, {
      key: string; name: string; username: string | null; email: string | null;
      totalPv: number; totalBonus: number; txCount: number;
      levels: Set<number>; latestAt: string | null;
    }>();
    for (const a of awards) {
      const key = String(a.source_customer_id ?? a.source_email ?? a.source_username ?? a.id);
      const prev = map.get(key) ?? {
        key,
        name:     a.source_name     ?? a.source_username ?? a.source_email ?? 'Unknown',
        username: a.source_username ?? null,
        email:    a.source_email    ?? null,
        totalPv: 0, totalBonus: 0, txCount: 0,
        levels: new Set<number>(), latestAt: null,
      };
      prev.totalPv    += Number(a.earned_pv    ?? 0);
      prev.totalBonus += Number(a.bonus_amount ?? 0);
      prev.txCount    += 1;
      prev.levels.add(Number(a.level_no ?? 0));
      if (!prev.latestAt || (a.awarded_at && a.awarded_at > prev.latestAt)) prev.latestAt = a.awarded_at ?? null;
      map.set(key, prev);
    }
    return [...map.values()].sort((a, b) => b.totalBonus - a.totalBonus);
  }, [awards]);

  const isActive      = monthlyActivation?.status === 'active';
  const visibleAwards = activeLevel ? awards.filter((a) => Number(a.level_no) === activeLevel) : awards;

  return (
    <div className="space-y-5 pt-1">

      {/* ── 1. Hero Stats ── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 p-5 text-white shadow-xl md:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-400">Network Earnings</p>
            <h3 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Unilevel Breakdown</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-400">
              Every bonus credited from your downline's delivered purchases.
            </p>
          </div>
          <span className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold ${
            isActive
              ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
          }`}>
            <span className={`h-2 w-2 rounded-full animate-pulse ${isActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {isActive ? 'Active for Unilevel' : 'Inactive for Unilevel'}
          </span>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Bonus',    value: peso(totalBonus),               sub: 'to cash wallet',      accent: 'text-emerald-400' },
            { label: 'Network PV',     value: `${num(totalPv)} PV`,           sub: 'delivered PV total',  accent: 'text-sky-400'     },
            { label: 'Contributors',   value: String(contributors.length),    sub: 'unique downlines',    accent: 'text-violet-400'  },
            { label: 'Active Levels',  value: levels.length ? `${levels.length}` : '—', sub: levels.length ? levels.map((l) => `L${l.level}`).join(' · ') : 'none yet', accent: 'text-amber-400' },
          ].map((card) => (
            <div key={card.label} className="rounded-xl bg-white/5 p-3.5 ring-1 ring-white/10 backdrop-blur-sm md:p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{card.label}</p>
              <p className={`mt-2 text-lg font-black leading-tight tabular-nums ${card.accent}`}>{card.value}</p>
              <p className="mt-0.5 text-[11px] text-slate-500 truncate">{card.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. Award Level Breakdown (Tree + Details) ── */}
      {levels.length === 0 ? (
        <Empty title="No network earnings yet" desc="Once a downline order is delivered and you are active, your level breakdown will appear here." />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          {/* Header */}
          <div className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50 to-sky-50/50 px-5 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-sky-950/30 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-sky-500 dark:text-sky-400">Award Levels</p>
                <h4 className="mt-0.5 text-base font-black text-slate-900 dark:text-white">Level Breakdown & Contributors</h4>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                  {levels.length} level{levels.length !== 1 ? 's' : ''} active
                </span>
                <span className="hidden sm:inline rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                  Click a level to expand
                </span>
              </div>
            </div>
          </div>

          {/* Tree list */}
          <div className="p-4 md:p-5">
            <div className="flex gap-0">
              {/* Left spine column */}
              <div className="flex w-8 shrink-0 flex-col items-center md:w-10">
                {/* "You" dot */}
                <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-[9px] font-black text-white shadow-md ring-2 ring-white dark:ring-slate-900 md:h-8 md:w-8">
                  You
                </div>
                {/* Full spine line */}
                <div className="flex-1 w-px bg-slate-200 dark:bg-slate-700 my-1" />
              </div>

              {/* Levels */}
              <div className="flex-1 min-w-0 space-y-2 pl-1">
                {levels.map((lvl, li) => {
                  const c         = colorOf(lvl.level);
                  const pctTotal  = totalBonus > 0 ? (lvl.bonus / totalBonus) * 100 : 0;
                  const members   = contributors.filter((con) => con.levels.has(lvl.level));
                  const visible   = members.slice(0, 6);
                  const overflow  = members.length - visible.length;
                  const isOpen    = expandedLevel === lvl.level;
                  const isLast    = li === levels.length - 1;
                  const avgPv     = lvl.count > 0 ? lvl.pv / lvl.count : 0;

                  return (
                    <div key={lvl.level} className="relative flex gap-0">
                      {/* Horizontal branch connector */}
                      <div className="flex w-7 shrink-0 flex-col items-center md:w-9">
                        <div className="mt-3.5 h-px w-full bg-slate-200 dark:bg-slate-700" />
                        {!isLast && <div className="flex-1 w-px bg-slate-200 dark:bg-slate-700" />}
                      </div>

                      {/* Level card */}
                      <div className="flex-1 min-w-0 mb-1">
                        {/* Clickable header row */}
                        <button
                          type="button"
                          onClick={() => setExpandedLevel(isOpen ? null : lvl.level)}
                          className={`w-full rounded-xl border p-3 text-left transition-all duration-200 hover:shadow-md md:p-4 ${
                            isOpen
                              ? `${c.bg} ${c.border} shadow-sm`
                              : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50 dark:border-slate-700/60 dark:bg-white/[0.025] dark:hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Level badge */}
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c.badge} text-sm font-black text-white shadow-md`}>
                              L{lvl.level}
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-sm font-black ${c.text}`}>Level {lvl.level}</span>
                                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                    {lvl.level === 1 ? 'Direct downline' : 'Network downline'}
                                    {' · '}
                                    {UNILEVEL_TOTAL_RATE_PERCENT}% / {UNILEVEL_LEVEL_SPLIT} = {percent(lvl.rate)}% rate
                                    {' · '}
                                    {lvl.count} tx
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="text-right">
                                    <p className="text-sm font-black tabular-nums text-slate-900 dark:text-white">{peso(lvl.bonus)}</p>
                                    <p className="text-[11px] text-slate-400">{pctTotal.toFixed(1)}% of total</p>
                                  </div>
                                  <svg
                                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                <motion.div
                                  className={`h-full rounded-full bg-gradient-to-r ${c.bar}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pctTotal}%` }}
                                  transition={{ duration: 0.7, delay: li * 0.06, ease: 'easeOut' }}
                                />
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Expandable details */}
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className={`mt-2 rounded-xl border p-4 ${c.bg} ${c.border}`}>
                                {/* Formula */}
                                <div className="mb-4">
                                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Mathematical Formula</p>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="rounded-xl bg-white/80 px-3 py-2 dark:bg-slate-900/60 shadow-sm ring-1 ring-white/50 dark:ring-slate-700/50">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total PV</p>
                                      <p className={`text-base font-black tabular-nums ${c.text}`}>{num(lvl.pv)}</p>
                                    </div>
                                    <span className="text-lg font-black text-slate-300 dark:text-slate-600">×</span>
                                    <div className="rounded-xl bg-white/80 px-3 py-2 dark:bg-slate-900/60 shadow-sm ring-1 ring-white/50 dark:ring-slate-700/50">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Rate</p>
                                      <p className={`text-base font-black tabular-nums ${c.text}`}>{UNILEVEL_TOTAL_RATE_PERCENT}% / {UNILEVEL_LEVEL_SPLIT}</p>
                                    </div>
                                    <span className="text-lg font-black text-slate-300 dark:text-slate-600">=</span>
                                    <div className={`rounded-xl ${c.badge} px-3 py-2 shadow-md`}>
                                      <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">Bonus</p>
                                      <p className="text-base font-black tabular-nums text-white">{peso(lvl.bonus)}</p>
                                    </div>
                                    <div className="rounded-xl bg-white/80 px-3 py-2 dark:bg-slate-900/60 shadow-sm ring-1 ring-white/50 dark:ring-slate-700/50">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Avg PV/tx</p>
                                      <p className={`text-base font-black tabular-nums ${c.text}`}>{num(avgPv)}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Contributors */}
                                <p className="mb-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                  Contributors — {members.length} member{members.length !== 1 ? 's' : ''}
                                </p>
                                {visible.length === 0 ? (
                                  <p className="rounded-xl border border-dashed border-slate-300 py-6 text-center text-sm text-slate-400 dark:border-slate-600">
                                    No named contributors at this level yet
                                  </p>
                                ) : (
                                  <div className="grid gap-2 md:grid-cols-2">
                                    {visible.map((member, mi) => (
                                      <motion.div
                                        key={member.key}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: mi * 0.03 }}
                                        className="rounded-xl bg-white/75 p-3 shadow-sm ring-1 ring-white/60 dark:bg-slate-900/60 dark:ring-slate-700/40"
                                      >
                                        <div className="flex items-start gap-3">
                                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${c.badge} text-xs font-black text-white shadow-sm`}>
                                            {(member.name[0] ?? '?').toUpperCase()}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="break-words text-sm font-black leading-snug text-slate-900 dark:text-white">{member.name}</p>
                                            <p className="mt-0.5 break-all text-[11px] font-medium leading-tight text-slate-400">
                                              {member.username ? `@${member.username}` : member.email ?? 'Member'}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="mt-3 flex items-end justify-between gap-3 border-t border-slate-200/70 pt-2.5 dark:border-slate-700/60">
                                          <div>
                                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Bonus</p>
                                            <p className="text-sm font-black tabular-nums text-emerald-600 dark:text-emerald-400">+{peso(member.totalBonus)}</p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Activity</p>
                                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                              {member.txCount} tx <span className="text-slate-300 dark:text-slate-600">/</span> {num(member.totalPv)} PV
                                            </p>
                                          </div>
                                        </div>
                                      </motion.div>
                                    ))}
                                    {overflow > 0 && (
                                      <div className={`flex items-center justify-center gap-2 rounded-xl border border-dashed p-3 ${c.text} ${c.border}`}>
                                        <span className="text-sm font-black">+{overflow}</span>
                                        <span className="text-xs font-semibold">more members</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Filter link */}
                                <button
                                  type="button"
                                  onClick={() => setActiveLevel(activeLevel === lvl.level ? null : lvl.level)}
                                  className={`mt-3 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                    activeLevel === lvl.level
                                      ? `${c.badge} text-white shadow-sm`
                                      : `${c.bg} ${c.text} hover:shadow-sm`
                                  }`}
                                >
                                  {activeLevel === lvl.level ? '✓ Filtering table by Level ' + lvl.level : `Filter transaction table by Level ${lvl.level}`}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. Top Contributors ── */}
      {contributors.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/70 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Downline Activity</p>
              <h4 className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">Top Contributors</h4>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {contributors.length} member{contributors.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2">
            {contributors.map((c, i) => {
              const shareOfTotal = totalBonus > 0 ? (c.totalBonus / totalBonus) * 100 : 0;
              const lvlList = [...c.levels].filter(Boolean).sort((a, b) => a - b);
              return (
                <div key={c.key} className="flex items-center gap-3 rounded-xl bg-slate-50/60 p-3 ring-1 ring-slate-100 dark:bg-white/[0.025] dark:ring-slate-700/50">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
                    i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 text-white dark:bg-slate-600' : i === 2 ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}`}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{c.name}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {c.username ? `@${c.username}` : c.email ?? 'Member'}
                          {' · '}
                          {lvlList.map((l) => `L${l}`).join(', ')}
                          {' · '}
                          {c.txCount} tx
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black tabular-nums text-emerald-600 dark:text-emerald-400">+{peso(c.totalBonus)}</p>
                        <p className="text-[11px] text-slate-400">{shareOfTotal.toFixed(1)}% of total</p>
                      </div>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${shareOfTotal}%` }}
                        transition={{ duration: 0.6, delay: i * 0.04, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 4. Transaction Log ── */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/70">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Transaction Log</p>
            <h4 className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
              Computation Details
              {activeLevel && (
                <span className={`ml-2 text-sm font-semibold ${colorOf(activeLevel).text}`}>— Level {activeLevel}</span>
              )}
            </h4>
          </div>
          <div className="flex items-center gap-2">
            {activeLevel && (
              <button
                type="button"
                onClick={() => setActiveLevel(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Clear filter
              </button>
            )}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {visibleAwards.length} entries
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {visibleAwards.length === 0 ? (
            <div className="px-6 py-14">
              <Empty title="No entries yet" desc="Delivered downline purchases will appear here once you are active." />
            </div>
          ) : (
            <table className="w-full min-w-[980px] table-fixed text-sm">
              <colgroup>
                <col className="w-[180px]" />
                <col className="w-[80px]" />
                <col className="w-[230px]" />
                <col className="w-[130px]" />
                <col className="w-[110px]" />
                <col className="w-[180px]" />
                <col className="w-[150px]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-50/80 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:bg-slate-800/40 dark:text-slate-500">
                  {['Downline', 'Level', 'Product / Order', 'PV', 'Rate', 'Formula', 'Bonus'].map((h) => (
                    <th key={h} className={`whitespace-nowrap px-4 py-3 first:pl-5 last:pr-5 md:first:pl-6 md:last:pr-6 ${['PV', 'Rate', 'Bonus'].includes(h) ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {visibleAwards.map((award) => {
                  const lvl  = Number(award.level_no   ?? 0);
                  const pv   = Number(award.earned_pv  ?? 0);
                  const rate = Number(award.bonus_rate ?? 0);
                  const bon  = Number(award.bonus_amount ?? 0);
                  const c    = colorOf(lvl);
                  const src  = award.source_name || award.source_username || award.source_email || 'Unknown';
                  return (
                    <tr key={award.id} className="group transition-colors duration-150 hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3.5 first:pl-5 md:first:pl-6">
                        <p className="font-bold text-slate-900 dark:text-white">{src}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {award.source_username ? `@${award.source_username}` : award.source_email ?? '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${c.bg} ${c.text} ${c.ring}`}>
                          L{lvl}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="max-w-[170px] truncate font-semibold text-slate-700 dark:text-slate-300">
                          {award.product_name || 'Delivered order'}
                        </p>
                        <p className="mt-0.5 max-w-[170px] truncate text-xs text-slate-400 dark:text-slate-500">
                          {award.checkout_id || formatDate(award.awarded_at)}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                        {num(pv)} PV
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3.5 text-right font-black tabular-nums ${c.text}`}>
                        {UNILEVEL_TOTAL_RATE_PERCENT}% / {UNILEVEL_LEVEL_SPLIT}
                      </td>
                      <td className="px-4 py-3.5">
                        <code className="inline-flex whitespace-nowrap rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {num(pv)} × {(rate * 100).toFixed(2).replace(/\.00$/, '')}%
                        </code>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right text-base font-black tabular-nums text-emerald-600 last:pr-5 dark:text-emerald-400 md:last:pr-6">
                        +{peso(bon)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function Empty({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center dark:border-slate-700">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl dark:bg-slate-800">◈</div>
      <p className="font-bold text-slate-700 dark:text-slate-200">{title}</p>
      <p className="text-sm text-slate-400 dark:text-slate-500">{desc}</p>
    </div>
  );
}
