'use client';

interface PvStatCardProps {
    label: string;
    value: number | string;
    accent?: 'blue' | 'sky' | 'violet' | 'emerald'
    helper?: string;
}


const accentStyles = {
  blue: {
    card: 'border-sky-100 dark:border-sky-800/60 bg-gradient-to-br from-sky-50 to-cyan-50/40 dark:from-sky-950/50 dark:to-cyan-950/30',
    dot: 'bg-sky-500',
    label: 'text-sky-600 dark:text-sky-400',
    value: 'text-sky-900 dark:text-sky-100',
    sub: 'text-sky-500/70 dark:text-sky-400/60',
  },
  sky: {
    card: 'border-sky-100 dark:border-sky-800/60 bg-gradient-to-br from-sky-50 to-indigo-50/30 dark:from-sky-950/50 dark:to-indigo-950/20',
    dot: 'bg-sky-400',
    label: 'text-sky-600 dark:text-sky-400',
    value: 'text-sky-900 dark:text-sky-100',
    sub: 'text-sky-500/70 dark:text-sky-400/60',
  },
  emerald: {
    card: 'border-emerald-100 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50 to-teal-50/40 dark:from-emerald-950/50 dark:to-teal-950/30',
    dot: 'bg-emerald-500',
    label: 'text-emerald-700 dark:text-emerald-400',
    value: 'text-emerald-900 dark:text-emerald-100',
    sub: 'text-emerald-600/60 dark:text-emerald-400/50',
  },
  violet: {
    card: 'border-violet-100 dark:border-violet-800/60 bg-gradient-to-br from-violet-50 to-fuchsia-50/40 dark:from-violet-950/50 dark:to-fuchsia-950/30',
    dot: 'bg-violet-500',
    label: 'text-violet-700 dark:text-violet-400',
    value: 'text-violet-900 dark:text-violet-100',
    sub: 'text-violet-600/60 dark:text-violet-400/50',
  },
}

const PvStatCard = ({
  label,
  value,
  accent = 'blue',
  helper,
}: PvStatCardProps) => {
  const s = accentStyles[accent]
  const isNumber = typeof value === 'number'
  const display = isNumber ? value.toLocaleString() : String(value)

  return (
    <div className={`rounded-2xl border ${s.card} p-5 flex flex-col gap-3`}>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${s.dot} shrink-0`} />
        <p className={`text-xs font-semibold uppercase tracking-wide ${s.label}`}>{label}</p>
      </div>

      <div>
        <p className={`text-3xl font-bold tabular-nums -tracking-tight ${s.value}`}>
          {display}
        </p>
      </div>

      {helper && (
        <p className="text-xs leading-relaxed text-slate-500 dark:text-gray-400 border-t border-current/10 pt-2.5 mt-auto">
          {helper}
        </p>
      )}
    </div>
  )
}

export default PvStatCard
