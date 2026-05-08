'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { UnilevelAwardItem } from '@/store/api/encashmentApi';

const peso = (v: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(v || 0);

const num = (v: number) =>
  new Intl.NumberFormat('en-PH', { maximumFractionDigits: 2 }).format(v || 0);

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
  { bar: 'from-sky-400 to-cyan-400',       badge: 'bg-sky-500',     ring: 'ring-sky-200 dark:ring-sky-800/60',     text: 'text-sky-700 dark:text-sky-300',     bg: 'bg-sky-50 dark:bg-sky-900/20' },
  { bar: 'from-violet-400 to-purple-400',  badge: 'bg-violet-500',  ring: 'ring-violet-200 dark:ring-violet-800/60', text: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  { bar: 'from-emerald-400 to-teal-400',   badge: 'bg-emerald-500', ring: 'ring-emerald-200 dark:ring-emerald-800/60', text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { bar: 'from-rose-400 to-pink-400',      badge: 'bg-rose-500',    ring: 'ring-rose-200 dark:ring-rose-800/60',   text: 'text-rose-700 dark:text-rose-300',   bg: 'bg-rose-50 dark:bg-rose-900/20' },
  { bar: 'from-amber-400 to-orange-400',   badge: 'bg-amber-500',   ring: 'ring-amber-200 dark:ring-amber-800/60', text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { bar: 'from-indigo-400 to-blue-400',    badge: 'bg-indigo-500',  ring: 'ring-indigo-200 dark:ring-indigo-800/60', text: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  { bar: 'from-fuchsia-400 to-purple-400', badge: 'bg-fuchsia-500', ring: 'ring-fuchsia-200 dark:ring-fuchsia-800/60', text: 'text-fuchsia-700 dark:text-fuchsia-300', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20' },
  { bar: 'from-cyan-400 to-sky-400',       badge: 'bg-cyan-500',    ring: 'ring-cyan-200 dark:ring-cyan-800/60',   text: 'text-cyan-700 dark:text-cyan-300',   bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  { bar: 'from-lime-400 to-green-400',     badge: 'bg-lime-500',    ring: 'ring-lime-200 dark:ring-lime-800/60',   text: 'text-lime-700 dark:text-lime-300',   bg: 'bg-lime-50 dark:bg-lime-900/20' },
  { bar: 'from-orange-400 to-red-400',     badge: 'bg-orange-500',  ring: 'ring-orange-200 dark:ring-orange-800/60', text: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-900/20' },
];

const colorOf = (level: number) => LEVEL_COLORS[(level - 1) % LEVEL_COLORS.length];

export default function NetworkEarningsTab({ awards, monthlyActivation }: Props) {
  const [activeLevel, setActiveLevel] = useState<number | null>(null);

  const totalBonus = useMemo(() => awards.reduce((s, a) => s + Number(a.bonus_amount ?? 0), 0), [awards]);
  const totalPv    = useMemo(() => awards.reduce((s, a) => s + Number(a.earned_pv ?? 0), 0), [awards]);

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
        name:       a.source_name     ?? a.source_username ?? a.source_email ?? 'Unknown',
        username:   a.source_username ?? null,
        email:      a.source_email    ?? null,
        totalPv: 0, totalBonus: 0, txCount: 0,
        levels: new Set<number>(),
        latestAt: null,
      };
      prev.totalPv    += Number(a.earned_pv    ?? 0);
      prev.totalBonus += Number(a.bonus_amount ?? 0);
      prev.txCount    += 1;
      prev.levels.add(Number(a.level_no ?? 0));
      if (!prev.latestAt || (a.awarded_at && a.awarded_at > prev.latestAt)) {
        prev.latestAt = a.awarded_at ?? null;
      }
      map.set(key, prev);
    }
    return [...map.values()].sort((a, b) => b.totalBonus - a.totalBonus);
  }, [awards]);

  const maxBonus = levels.length ? Math.max(...levels.map((l) => l.bonus)) : 1;
  const isActive = monthlyActivation?.status === 'active';

  const visibleAwards = activeLevel
    ? awards.filter((a) => Number(a.level_no) === activeLevel)
    : awards;

  return (
    <div className="space-y-6 pt-1">

      {/* ── Hero Stats ── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 p-6 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-400">Network Earnings</p>
            <h3 className="mt-1.5 text-2xl font-black tracking-tight">Unilevel Breakdown</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-400">
              Every Unilevel bonus credited from your downline's delivered purchases.
            </p>
          </div>
          <span className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold ${
            isActive ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40' : 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
          }`}>
            <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
            {isActive ? 'Active for Unilevel' : 'Inactive for Unilevel'}
          </span>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Bonus',      value: peso(totalBonus),                        sub: 'credited to cash wallet', accent: 'text-emerald-400' },
            { label: 'Network PV',       value: `${num(totalPv)} PV`,                    sub: 'delivered downline PV',   accent: 'text-sky-400'     },
            { label: 'Contributors',     value: String(contributors.length),              sub: 'unique downline members', accent: 'text-violet-400'  },
            { label: 'Active Levels',    value: levels.length ? levels.map((l) => `L${l.level}`).join(' · ') : '—', sub: 'paid level range', accent: 'text-amber-400' },
          ].map((card) => (
            <div key={card.label} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{card.label}</p>
              <p className={`mt-2 text-lg font-black leading-tight tabular-nums ${card.accent}`}>{card.value}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{card.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Network Tree ── */}
      {levels.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/70 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Structure</p>
              <h4 className="mt-1 text-base font-bold text-slate-900 dark:text-white">Network Level Tree</h4>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Levels 1–{levels[levels.length - 1].level}
            </span>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="min-w-[360px] flex flex-col items-center">

              {/* Root node — You */}
              <div className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-5 py-3 shadow-lg ring-2 ring-slate-700 z-10">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-[11px] font-black text-white shadow">
                  You
                </div>
                <div>
                  <p className="text-sm font-black text-white leading-tight">You</p>
                  <p className="text-[11px] text-slate-400">Network root · {levels.length} level{levels.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {levels.map((lvl, li) => {
                const c = colorOf(lvl.level);
                const members = contributors.filter((con) => con.levels.has(lvl.level));
                const visible = members.slice(0, 6);
                const overflow = members.length - visible.length;
                const nodeCount = visible.length + (overflow > 0 ? 1 : 0) || 1;
                const isLast = li === levels.length - 1;

                return (
                  <div key={lvl.level} className="flex flex-col items-center w-full">

                    {/* Spine line from parent to level badge */}
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

                    {/* Level badge */}
                    <div className={`z-10 flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-black text-white shadow-md ${c.badge}`}>
                      <span>Level {lvl.level}</span>
                      <span className="opacity-70">·</span>
                      <span>{(lvl.rate * 100).toFixed(0)}%</span>
                      <span className="opacity-70">·</span>
                      <span>{peso(lvl.bonus)}</span>
                    </div>

                    {/* Spine to horizontal branch */}
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />

                    {/* Members row with connecting lines */}
                    <div className="relative w-full flex justify-center">
                      {/* Horizontal branch line — spans center of first to center of last node */}
                      {nodeCount > 1 && (
                        <div
                          className="absolute top-0 h-px bg-slate-200 dark:bg-slate-700"
                          style={{
                            left:  `calc(50% - (${nodeCount - 1} * 56px))`,
                            right: `calc(50% - (${nodeCount - 1} * 56px))`,
                          }}
                        />
                      )}

                      <div className="flex gap-3 flex-wrap justify-center">
                        {visible.length === 0 ? (
                          <div className="flex flex-col items-center">
                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                            <div className={`rounded-xl px-3 py-2 text-[11px] font-semibold ring-1 ${c.bg} ${c.text} ${c.ring}`}>
                              No contributors yet
                            </div>
                          </div>
                        ) : (
                          <>
                            {visible.map((member, mi) => (
                              <motion.div
                                key={member.key}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: li * 0.05 + mi * 0.04 }}
                                className="flex flex-col items-center"
                              >
                                {/* Vertical drop from horizontal branch */}
                                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                                {/* Node card */}
                                <div className={`flex flex-col items-center gap-1 rounded-xl p-2.5 w-[88px] text-center ring-1 ${c.bg} ${c.ring}`}>
                                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${c.badge} text-[11px] font-black text-white shadow-sm`}>
                                    {(member.name[0] ?? '?').toUpperCase()}
                                  </div>
                                  <p className={`w-full truncate text-[11px] font-bold leading-tight ${c.text}`}>{member.name}</p>
                                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">+{peso(member.totalBonus)}</p>
                                  <p className="text-[10px] text-slate-400">{member.txCount} tx</p>
                                </div>
                              </motion.div>
                            ))}
                            {overflow > 0 && (
                              <div className="flex flex-col items-center">
                                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                                <div className={`flex flex-col items-center gap-1 rounded-xl p-2.5 w-[88px] text-center ring-1 ${c.bg} ${c.ring}`}>
                                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${c.badge} text-xs font-black text-white`}>
                                    +{overflow}
                                  </div>
                                  <p className={`text-[11px] font-bold ${c.text}`}>more</p>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Spine continuing down — hidden on last level */}
                    {!isLast && <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mt-3" />}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Level Earnings Chart ── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/70 md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Earnings Chart</p>
            <h4 className="mt-1 text-base font-bold text-slate-900 dark:text-white">Bonus by Level</h4>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {levels.length} level{levels.length !== 1 ? 's' : ''}
          </span>
        </div>

        {levels.length === 0 ? (
          <Empty title="No earnings yet" desc="Delivered downline purchases will appear here." />
        ) : (
          <div className="space-y-3">
            {levels.map((lvl, i) => {
              const c = colorOf(lvl.level);
              const pct = totalBonus > 0 ? (lvl.bonus / totalBonus) * 100 : 0;
              const barPct = maxBonus > 0 ? (lvl.bonus / maxBonus) * 100 : 0;
              const isSelected = activeLevel === lvl.level;
              return (
                <button
                  key={lvl.level}
                  type="button"
                  onClick={() => setActiveLevel(isSelected ? null : lvl.level)}
                  className={`w-full rounded-xl p-3 text-left ring-1 transition-all duration-200 hover:shadow-md ${
                    isSelected
                      ? `${c.bg} ${c.ring}`
                      : 'bg-slate-50/70 ring-slate-100 hover:bg-slate-50 dark:bg-white/[0.03] dark:ring-slate-700/50 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c.badge} text-[11px] font-black text-white shadow-sm`}>
                      L{lvl.level}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-sm font-bold ${c.text}`}>Level {lvl.level}</span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            {lvl.count} tx · {(lvl.rate * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black tabular-nums text-slate-900 dark:text-white">{peso(lvl.bonus)}</p>
                          <p className="text-[11px] text-slate-400">{pct.toFixed(1)}% of total</p>
                        </div>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${c.bar}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${barPct}%` }}
                          transition={{ duration: 0.7, delay: i * 0.06, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {levels.length > 0 && (
          <p className="mt-3 text-center text-[11px] text-slate-400 dark:text-slate-500">
            Click a level to filter the computation table below
          </p>
        )}
      </section>

      {/* ── Per-Level Computation Cards ── */}
      {levels.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Mathematical Breakdown</p>
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {levels.map((lvl) => {
              const c = colorOf(lvl.level);
              const avgPv = lvl.count > 0 ? lvl.pv / lvl.count : 0;
              return (
                <div key={lvl.level} className={`rounded-2xl border p-4 ${c.bg} ring-1 ${c.ring}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.badge} text-[11px] font-black text-white`}>
                        L{lvl.level}
                      </span>
                      <span className={`text-sm font-bold ${c.text}`}>Level {lvl.level}</span>
                    </div>
                    <span className={`text-[11px] font-bold ${c.text} opacity-70`}>{lvl.count} transaction{lvl.count !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Formula */}
                  <div className="mt-3 rounded-xl bg-white/60 p-3 dark:bg-black/20">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Formula</p>
                    <div className="flex flex-wrap items-center gap-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                      <span className="rounded-md bg-white dark:bg-slate-800 px-2 py-0.5 tabular-nums shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
                        {num(lvl.pv)} PV
                      </span>
                      <span className="text-slate-400">×</span>
                      <span className="rounded-md bg-white dark:bg-slate-800 px-2 py-0.5 tabular-nums shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
                        {(lvl.rate * 100).toFixed(2).replace(/\.00$/, '')}%
                      </span>
                      <span className="text-slate-400">=</span>
                      <span className={`rounded-md px-2 py-0.5 tabular-nums font-black ${c.bg} ${c.text} ring-1 ${c.ring}`}>
                        {peso(lvl.bonus)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="rounded-lg bg-white/50 dark:bg-black/20 px-2.5 py-1.5">
                      <p className="text-slate-400">Total PV</p>
                      <p className={`font-black tabular-nums ${c.text}`}>{num(lvl.pv)} PV</p>
                    </div>
                    <div className="rounded-lg bg-white/50 dark:bg-black/20 px-2.5 py-1.5">
                      <p className="text-slate-400">Avg PV/tx</p>
                      <p className={`font-black tabular-nums ${c.text}`}>{num(avgPv)} PV</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Downline Contributors ── */}
      {contributors.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/70 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Downline Activity</p>
              <h4 className="mt-1 text-base font-bold text-slate-900 dark:text-white">Contributors to Your Earnings</h4>
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
                <div key={c.key} className="flex items-center gap-3 rounded-xl bg-slate-50/70 p-3 dark:bg-white/[0.03] ring-1 ring-slate-100 dark:ring-slate-700/50">
                  {/* Rank */}
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white ${
                    i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-orange-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    {i < 3 ? ['🥇','🥈','🥉'][i] : `#${i + 1}`}
                  </span>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
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
                        <p className="text-[11px] text-slate-400">{num(c.totalPv)} PV · {shareOfTotal.toFixed(1)}%</p>
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

      {/* ── Detailed Computation Table ── */}
      <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/70 overflow-hidden">
        <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 md:px-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Transaction Log</p>
            <h4 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
              Computation Details
              {activeLevel && (
                <span className={`ml-2 text-sm font-semibold ${colorOf(activeLevel).text}`}>— Level {activeLevel} only</span>
              )}
            </h4>
          </div>
          <div className="flex items-center gap-2">
            {activeLevel && (
              <button
                type="button"
                onClick={() => setActiveLevel(null)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Clear filter
              </button>
            )}
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
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
            <table className="min-w-[800px] w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {['Downline', 'Level', 'Product / Order', 'Delivered PV', 'Rate', 'Computation', 'Bonus'].map((h) => (
                    <th key={h} className={`px-4 py-3 first:pl-5 md:first:pl-6 last:pr-5 ${h === 'Delivered PV' || h === 'Rate' || h === 'Bonus' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {visibleAwards.map((award) => {
                  const lvl  = Number(award.level_no ?? 0);
                  const pv   = Number(award.earned_pv   ?? 0);
                  const rate = Number(award.bonus_rate  ?? 0);
                  const bon  = Number(award.bonus_amount ?? 0);
                  const c    = colorOf(lvl);
                  const src  = award.source_name || award.source_username || award.source_email || 'Unknown';
                  return (
                    <tr key={award.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors duration-150">
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
                        <p className="max-w-[180px] truncate font-semibold text-slate-700 dark:text-slate-300">
                          {award.product_name || 'Delivered order'}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                          {award.checkout_id || formatDate(award.awarded_at)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                        {num(pv)} PV
                      </td>
                      <td className={`px-4 py-3.5 text-right font-black tabular-nums ${c.text}`}>
                        {(rate * 100).toFixed(2).replace(/\.00$/, '')}%
                      </td>
                      <td className="px-4 py-3.5">
                        <code className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                          {num(pv)} × {(rate * 100).toFixed(2).replace(/\.00$/, '')}%
                        </code>
                      </td>
                      <td className="px-4 py-3.5 last:pr-5 md:last:pr-6 text-right text-base font-black tabular-nums text-emerald-600 dark:text-emerald-400">
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
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-xl">◈</div>
      <p className="font-bold text-slate-700 dark:text-slate-200">{title}</p>
      <p className="text-sm text-slate-400 dark:text-slate-500">{desc}</p>
    </div>
  );
}
