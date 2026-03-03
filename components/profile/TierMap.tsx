const TIER_MAP: Record<string, { ring: string; badge: string; label: string; emoji: string }> = {
  'Home Starter': {
    ring: 'ring-slate-300',
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    label: 'Home Starter',
    emoji: 'Starter',
  },
  'Home Builder': {
    ring: 'ring-emerald-300',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'Home Builder',
    emoji: 'Builder',
  },
  'Home Stylist': {
    ring: 'ring-sky-300',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    label: 'Home Stylist',
    emoji: 'Stylist',
  },
  'Lifestyle Consultant': {
    ring: 'ring-violet-300',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    label: 'Lifestyle Consultant',
    emoji: 'Consultant',
  },
  'Lifestyle Elite': {
    ring: 'ring-amber-400',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    label: 'Lifestyle Elite',
    emoji: 'Elite',
  },
};

export default TIER_MAP;
