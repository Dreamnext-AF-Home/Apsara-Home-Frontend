import Image from 'next/image'
import { MemberTier } from '@/types/members/types'

type TierBadgeProps = {
  tier: MemberTier | string
  className?: string
  sizeClassName?: string
}

const tierBadgeConfig: Record<MemberTier, { label: string; imageSrc: string; imageAlt: string }> = {
  'Home Starter': {
    label: 'Home Starter',
    imageSrc: '/Badge/homeStarter.png',
    imageAlt: 'Home Starter badge',
  },
  'Home Builder': {
    label: 'Home Builder',
    imageSrc: '/Badge/homeBuilder.png',
    imageAlt: 'Home Builder badge',
  },
  'Home Stylist': {
    label: 'Home Stylist',
    imageSrc: '/Badge/homeStylist.png',
    imageAlt: 'Home Stylist badge',
  },
  'Lifestyle Consultant': {
    label: 'Lifestyle Consultant',
    imageSrc: '/Badge/lifestyleConsultant.png',
    imageAlt: 'Lifestyle Consultant badge',
  },
  'Lifestyle Elite': {
    label: 'Lifestyle Elite',
    imageSrc: '/Badge/lifestyleElite.png',
    imageAlt: 'Lifestyle Elite badge',
  },
}

export default function TierBadge({ tier, className = '', sizeClassName = 'h-14 w-14' }: TierBadgeProps) {
  const cfg = tierBadgeConfig[tier as MemberTier]

  if (!cfg) {
    return (
      <span
        className={`inline-flex items-center justify-center ${className}`.trim()}
        title={String(tier || 'Unknown tier')}
      >
        <span className={`inline-flex ${sizeClassName} shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-bold uppercase text-slate-500`}>
          N/A
        </span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center justify-center ${className}`.trim()}
      title={cfg.label}
    >
      <span className={`relative ${sizeClassName} shrink-0 overflow-hidden`}>
        <Image
          src={cfg.imageSrc}
          alt={cfg.imageAlt}
          fill
          sizes="96px"
          className="object-contain"
        />
      </span>
    </span>
  )
}
