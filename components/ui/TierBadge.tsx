import { MemberTier } from '@/types/members/types'

type TierBadgeProps = {
  tier: MemberTier
  className?: string
}

const tierBadgeConfig: Record<MemberTier, { label: string; icon: string; className: string; dot: string }> = {
  'Home Starter': {
    label: 'Home Starter',
    icon: 'HS',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  },
  'Home Builder': {
    label: 'Home Builder',
    icon: 'HB',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-400',
  },
  'Home Stylist': {
    label: 'Home Stylist',
    icon: 'HY',
    className: 'bg-sky-100 text-sky-700 border-sky-200',
    dot: 'bg-sky-400',
  },
  'Lifestyle Consultant': {
    label: 'Lifestyle Consultant',
    icon: 'LC',
    className: 'bg-violet-100 text-violet-700 border-violet-200',
    dot: 'bg-violet-400',
  },
  'Lifestyle Elite': {
    label: 'Lifestyle Elite',
    icon: 'LE',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-400',
  },
}

export default function TierBadge({ tier, className = '' }: TierBadgeProps) {
  const cfg = tierBadgeConfig[tier]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.className} ${className}`.trim()}
      title={`${cfg.label} tier`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-md bg-white/70 px-1 text-[10px] font-bold">
        {cfg.icon}
      </span>
      <span>{cfg.label}</span>
    </span>
  )
}
