'use client';

import Footer from '@/components/landing-page/Footer';
import Navbar from '@/components/layout/Navbar';
import TopBar from '@/components/layout/TopBar';
import type { Category } from '@/store/api/categoriesApi';
import type { MeResponse } from '@/store/api/userApi';
import { useGetPublicWebPageItemsQuery } from '@/store/api/webPagesApi';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { extractPartnerSlugFromPath } from '@/libs/storefrontRouting';
import { getPartnerStorefrontConfig } from '@/libs/partnerStorefront';

type MemberTier =
  | 'Home Starter'
  | 'Home Builder'
  | 'Home Stylist'
  | 'Lifestyle Consultant'
  | 'Lifestyle Elite';

const TIER_BADGE_IMAGE: Record<MemberTier, string> = {
  'Home Starter': '/Badge/homeStarter.png',
  'Home Builder': '/Badge/homeBuilder.png',
  'Home Stylist': '/Badge/homeStylist.png',
  'Lifestyle Consultant': '/Badge/lifestyleConsultant.png',
  'Lifestyle Elite': '/Badge/lifestyleElite.png',
};

const TIER_COVER: Record<MemberTier, { gradient: string; glow: string; accent: string }> = {
  'Home Starter': {
    gradient: 'from-slate-950 via-slate-800 to-sky-700',
    glow: 'bg-sky-400/30',
    accent: 'text-sky-200',
  },
  'Home Builder': {
    gradient: 'from-slate-950 via-teal-950 to-emerald-700',
    glow: 'bg-emerald-400/30',
    accent: 'text-emerald-200',
  },
  'Home Stylist': {
    gradient: 'from-slate-950 via-blue-950 to-cyan-700',
    glow: 'bg-cyan-400/30',
    accent: 'text-cyan-200',
  },
  'Lifestyle Consultant': {
    gradient: 'from-slate-950 via-stone-900 to-amber-700',
    glow: 'bg-amber-400/30',
    accent: 'text-amber-200',
  },
  'Lifestyle Elite': {
    gradient: 'from-slate-950 via-sky-950 to-rose-700',
    glow: 'bg-rose-400/30',
    accent: 'text-rose-200',
  },
};

const TIER_ORDER: MemberTier[] = [
  'Home Starter',
  'Home Builder',
  'Home Stylist',
  'Lifestyle Consultant',
  'Lifestyle Elite',
];

const rankToTier = (rank: number): MemberTier => {
  if (rank >= 5) return 'Lifestyle Elite';
  if (rank === 4) return 'Lifestyle Consultant';
  if (rank === 3) return 'Home Stylist';
  if (rank === 2) return 'Home Builder';
  return 'Home Starter';
};

const TIER_DESCRIPTIONS: Record<MemberTier, string> = {
  'Home Starter': 'Your affiliate journey begins here. Build your network, grow your PV, and unlock your next badge.',
  'Home Builder': 'You unlocked Home Builder. Your account now reflects a stronger referral base and qualified purchase volume.',
  'Home Stylist': 'You unlocked Home Stylist. Your network is growing and your structure is beginning to activate deeper levels.',
  'Lifestyle Consultant': 'You unlocked Lifestyle Consultant. This level reflects stronger personal volume, active builders, and wider group growth.',
  'Lifestyle Elite': 'You unlocked Lifestyle Elite. This top-tier milestone reflects a mature and high-performing affiliate network.',
};

const TIER_REWARDS: Record<MemberTier, string[]> = {
  'Home Starter': ['Affiliate profile activated', 'Starter badge displayed', 'PV progress tracking'],
  'Home Builder': ['Builder badge unlocked', 'Stronger referral base', 'Qualified PV growth'],
  'Home Stylist': ['Deeper network momentum', 'Stylist milestone badge', 'Higher level tracking'],
  'Lifestyle Consultant': ['Advanced rank recognition', 'Wider group growth', 'Consultant milestone badge'],
  'Lifestyle Elite': ['Top-tier rank status', 'Elite badge recognition', 'Mature affiliate network'],
};

type LevelUpPageProps = {
  initialCategories?: Category[];
  initialProfile?: MeResponse | null;
  rank?: number;
};

export default function LevelUpPage({
  initialCategories = [],
  initialProfile = null,
  rank,
}: LevelUpPageProps) {
  const pathname = usePathname();
  const partnerSlug = useMemo(() => extractPartnerSlugFromPath(pathname), [pathname]);
  const { data: partnerStorefrontData } = useGetPublicWebPageItemsQuery('partner-storefront', {
    skip: !partnerSlug,
  });
  const partnerStorefront = useMemo(() => {
    if (!partnerSlug) return null;
    const storefrontItems = partnerStorefrontData?.items ?? [];
    const matched = storefrontItems.find((item) => getPartnerStorefrontConfig(item)?.slug === partnerSlug);
    return getPartnerStorefrontConfig(matched);
  }, [partnerSlug, partnerStorefrontData?.items]);
  const partnerLogoUrl = partnerStorefront?.logoUrl
    ? `${partnerStorefront.logoUrl}${partnerStorefront.logoUrl.includes('?') ? '&' : '?'}v=${partnerStorefront.logoVersion || '1'}`
    : undefined;
  const partnerHomeHref = partnerSlug ? `/shop/${partnerSlug}` : '/shop';
  const profileBasePath = partnerSlug ? `/${partnerSlug}/profile` : '/profile';
  const effectiveRank = rank ?? initialProfile?.rank ?? 1;
  const tier = useMemo(() => rankToTier(effectiveRank), [effectiveRank]);
  const tierIndex = TIER_ORDER.indexOf(tier);
  const nextTier = TIER_ORDER[tierIndex + 1];
  const progressPercent = Math.min(100, Math.max(20, ((tierIndex + 1) / TIER_ORDER.length) * 100));
  const memberName = initialProfile?.name?.trim() || initialProfile?.username?.trim() || 'Member';

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f1ea] text-slate-950 dark:bg-[#080b10] dark:text-white">
      {!partnerSlug && <TopBar />}
      <Navbar
        initialCategories={initialCategories}
        logoSrc={partnerLogoUrl ?? '/Images/af_home_logo.png'}
        logoAlt={partnerStorefront?.displayName || 'AF Home'}
        logoHref={partnerHomeHref}
        categoryOnlyNav={Boolean(partnerSlug)}
        showGuestCartWishlist={Boolean(partnerSlug)}
        stickToTop={Boolean(partnerSlug)}
      />

      <section className="relative px-4 py-8 md:px-6 md:py-12">
        <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-300/20 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute -right-24 top-40 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-500/10" />
        <div className="absolute -left-24 bottom-28 h-80 w-80 rounded-full bg-rose-300/20 blur-3xl dark:bg-rose-500/10" />

        <div className="relative mx-auto max-w-7xl">
          <div className={`relative overflow-hidden rounded-[38px] border border-white/30 bg-gradient-to-br ${TIER_COVER[tier].gradient} shadow-[0_30px_90px_rgba(15,23,42,0.28)] dark:border-white/10`}>
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.18),transparent_32%,rgba(255,255,255,0.08)_62%,transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.22),transparent_22%),radial-gradient(circle_at_80%_12%,rgba(255,255,255,0.16),transparent_18%),radial-gradient(circle_at_65%_90%,rgba(255,255,255,0.10),transparent_28%)]" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/35 to-transparent" />

            <div className="relative grid gap-10 px-5 py-8 sm:px-8 md:grid-cols-[1.05fr_0.95fr] md:px-12 md:py-14 lg:px-16">
              <div className="flex flex-col justify-between gap-10">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white/85 backdrop-blur-md">
                    <span className={`h-2 w-2 rounded-full ${TIER_COVER[tier].glow}`} />
                    Rank {Math.max(1, Math.min(5, effectiveRank))} Milestone
                  </div>

                  <p className={`mt-8 text-xs font-black uppercase tracking-[0.28em] ${TIER_COVER[tier].accent}`}>
                    Congratulations
                  </p>
                  <h1 className="mt-3 max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
                    You just reached {tier}.
                  </h1>
                  <p className="mt-6 max-w-2xl text-base leading-8 text-white/78 md:text-lg">
                    {TIER_DESCRIPTIONS[tier]}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {TIER_REWARDS[tier].map((reward) => (
                    <div key={reward} className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">Unlocked</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-white">{reward}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                <div className={`absolute h-72 w-72 rounded-full ${TIER_COVER[tier].glow} blur-3xl`} />
                <div className="relative w-full max-w-sm rounded-[34px] border border-white/20 bg-white/[0.14] p-5 shadow-2xl backdrop-blur-xl">
                  <div className="rounded-[28px] border border-white/20 bg-white/[0.18] p-6">
                    <div className="relative mx-auto flex h-56 w-56 items-center justify-center rounded-full border border-white/20 bg-black/20 shadow-inner">
                      <div className="absolute inset-5 rounded-full border border-white/10" />
                      <Image
                        src={TIER_BADGE_IMAGE[tier]}
                        alt={`${tier} badge`}
                        width={190}
                        height={190}
                        priority
                        className="relative object-contain drop-shadow-[0_24px_40px_rgba(0,0,0,0.35)]"
                      />
                    </div>
                  </div>

                  <div className="mt-5 rounded-[26px] bg-white px-5 py-4 text-slate-950 shadow-xl dark:bg-slate-950 dark:text-white">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Badge Active</p>
                    <p className="mt-2 text-2xl font-black tracking-[-0.04em]">{tier}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Assigned to {memberName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[32px] border border-slate-200/80 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Level Progress</p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
                    {nextTier ? `${nextTier} is next` : 'Highest tier reached'}
                  </h2>
                </div>
                <div className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-white dark:bg-white dark:text-slate-950">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-60">Rank</p>
                  <p className="text-2xl font-black">{Math.max(1, Math.min(5, effectiveRank))}</p>
                </div>
              </div>

              <div className="mt-7 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 via-sky-500 to-amber-400"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="mt-5 grid grid-cols-5 gap-2">
                {TIER_ORDER.map((tierName, index) => {
                  const isActive = index <= tierIndex;

                  return (
                    <div key={tierName} className="text-center">
                      <div className={`mx-auto h-3 w-3 rounded-full ${isActive ? 'bg-slate-950 dark:bg-white' : 'bg-slate-300 dark:bg-white/20'}`} />
                      <p className={`mt-2 hidden text-[10px] font-bold uppercase tracking-[0.12em] sm:block ${isActive ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                        {index + 1}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-[32px] border border-slate-200/80 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">What Changed</p>
                <h3 className="mt-3 text-xl font-black tracking-[-0.04em]">Your profile now shows the new badge.</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Rank-based visuals, qualification checks, and level display now use your updated account rank.
                </p>
              </div>

              <div className="rounded-[32px] border border-slate-200/80 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Keep Moving</p>
                <h3 className="mt-3 text-xl font-black tracking-[-0.04em]">Build volume and strengthen your network.</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Continue growing posted PV and direct referrals to move toward the next milestone.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 rounded-[30px] border border-slate-200/80 bg-white/75 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
            <div className="px-2">
              <p className="text-sm font-bold text-slate-800 dark:text-white">Ready to continue?</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Review your profile or check your AF Voucher progress.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={profileBasePath}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-center text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Back to Profile
              </Link>
              <Link
                href={`${profileBasePath}?tab=pv`}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-100 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
              >
                View AF Voucher
              </Link>
            </div>
          </div>
        </div>
      </section>

      {partnerStorefront ? (
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <p>
              Orders from <span className="font-semibold text-slate-800">{partnerStorefront.displayName}</span> are still processed through AF Home.
            </p>
            {partnerStorefront.notificationEmail ? <p>Partner notifications: {partnerStorefront.notificationEmail}</p> : null}
          </div>
        </footer>
      ) : (
        <Footer />
      )}
    </main>
  );
}
