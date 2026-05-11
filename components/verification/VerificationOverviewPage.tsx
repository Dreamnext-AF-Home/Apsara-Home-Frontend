'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useMeQuery } from '@/store/api/userApi';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { extractPartnerSlugFromPath } from '@/libs/storefrontRouting';

const requirementItems = [
  'Valid government-issued ID',
  'Clear selfie holding your ID',
  'Accurate personal, contact, and address details',
  'Payout account details for your encashment request',
];

const featureItems = [
  'Confirm that your encashment request belongs to the correct member',
  'Help the admin team verify your identity before releasing funds',
  'Submit verification and payout details in one combined flow',
  'Track your request from pending review until release',
];

const STEPS = [
  {
    title: 'Prepare your details',
    text: 'Review the requirements, then continue to the profile encashment form.',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: 'Submit one request',
    text: 'Your KYC documents and payout details are submitted together.',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  {
    title: 'Wait for admin review',
    text: 'Admin reviews the verification and payout request before release.',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
] as const;

type VerificationStatus = 'verified' | 'pending_review' | 'on_hold' | 'not_verified';

function getStatusInfo(status: VerificationStatus, profileBasePath: string) {
  switch (status) {
    case 'verified':
      return {
        text: 'Your account is already verified.',
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        label: 'Verified',
        ctaLabel: 'Request Encashment',
        ctaHref: `${profileBasePath}?tab=encashment`,
        ctaPrimary: true,
      }
    case 'pending_review':
      return {
        text: 'Your verification request is currently under review.',
        dot: 'bg-amber-400',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        label: 'Pending review',
        ctaLabel: 'Review My Request',
        ctaHref: `${profileBasePath}?tab=encashment&focus=verification#verification-form`,
        ctaPrimary: false,
      }
    case 'on_hold':
      return {
        text: 'Your verification is on hold. Please check for any required updates.',
        dot: 'bg-slate-400',
        badge: 'bg-slate-100 text-slate-600 border-slate-300',
        label: 'On hold',
        ctaLabel: 'View Submission',
        ctaHref: `${profileBasePath}?tab=encashment&focus=verification#verification-form`,
        ctaPrimary: false,
      }
    default:
      return {
        text: 'You are eligible to complete encashment verification.',
        dot: 'bg-orange-400',
        badge: 'bg-orange-50 text-orange-700 border-orange-200',
        label: 'Not verified',
        ctaLabel: 'Continue to Verification & Request',
        ctaHref: `${profileBasePath}?tab=encashment&focus=verification#verification-form`,
        ctaPrimary: true,
      }
  }
}

export default function VerificationOverviewPage() {
  const pathname = usePathname();
  const partnerSlug = useMemo(() => extractPartnerSlugFromPath(pathname), [pathname]);
  const profileBasePath = partnerSlug ? `/${partnerSlug}/profile` : '/profile';
  const { data: session, status: sessionStatus } = useSession();
  const role = String(session?.user?.role ?? '').toLowerCase();
  const isCustomerSession = sessionStatus === 'authenticated' && (role === 'customer' || role === '');
  const { data: me } = useMeQuery(undefined, { skip: !isCustomerSession });

  const rawStatus = me?.verification_status ?? 'not_verified';
  const status: VerificationStatus =
    rawStatus === 'verified' || me?.account_status === 1 ? 'verified'
    : rawStatus === 'pending_review' || me?.account_status === 2 ? 'pending_review'
    : rawStatus === 'on_hold' ? 'on_hold'
    : 'not_verified';

  const { text: statusText, dot: statusDot, badge: statusBadge, label: statusLabel, ctaLabel, ctaHref, ctaPrimary } = getStatusInfo(status, profileBasePath);

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.08),_transparent_28%),linear-gradient(180deg,#fffdf9_0%,#f7f2e9_100%)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:gap-10 sm:py-12 md:px-6 md:py-16">

        {/* ── Hero header ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-[0_25px_80px_rgba(15,23,42,0.08)] sm:rounded-[28px] sm:p-8"
        >
          {/* Logo — centered, prominent */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="rounded-2xl border border-stone-200 bg-white px-8 py-5 shadow-md">
              <Image
                src="/Images/af_home_logo.png"
                alt="AF Home"
                width={220}
                height={72}
                className="h-14 w-auto object-contain sm:h-16"
                priority
              />
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium sm:text-sm ${statusBadge}`}>
              <span className={`h-2 w-2 rounded-full shrink-0 ${statusDot}`} />
              {statusText}
            </div>
          </div>

          {/* Text content — centered on mobile, left on desktop */}
          <div className="mx-auto max-w-3xl text-center lg:text-left">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-teal-700">Encashment Verification</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl md:text-4xl lg:text-5xl">
              You are eligible to submit your encashment verification.
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
              Before AF Home releases your payout, we need to verify your identity and collect your payout details.
              The next step will open your profile encashment form where you can submit KYC documents and the payout request together.
            </p>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">

          {/* ── Main info card ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-[0_22px_70px_rgba(15,23,42,0.06)] sm:rounded-[28px] sm:p-8"
          >
            <div className="grid gap-6 sm:gap-8 sm:grid-cols-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Why this is required</h2>
                <ul className="mt-3 space-y-3 text-sm text-slate-600 sm:mt-4">
                  {featureItems.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900 sm:text-lg">What to prepare</h2>
                <ul className="mt-3 space-y-3 text-sm text-slate-600 sm:mt-4">
                  {requirementItems.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Steps */}
            <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50/70 p-4 sm:mt-8 sm:p-5">
              <h3 className="text-sm font-semibold text-slate-900">What happens next?</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {STEPS.map(({ title, text, icon }, i) => (
                  <div key={title} className="rounded-2xl border border-stone-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white">
                        {icon}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Step {i + 1}</span>
                    </div>
                    <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
                    <p className="mt-1.5 text-xs leading-6 text-slate-500">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Aside card ── */}
          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-3xl border border-stone-200 bg-[#0f172a] p-5 text-white shadow-[0_24px_80px_rgba(15,23,42,0.2)] sm:rounded-[28px] sm:p-8"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-300">Before You Continue</p>
            <h2 className="mt-3 text-xl font-semibold sm:mt-4 sm:text-2xl">This page explains the requirement before opening the form.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300 sm:mt-4">
              Once you continue, you will be sent to your profile Encashment tab. Complete the verification fields,
              enter your payout method, then submit one request for admin review.
            </p>

            <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:mt-8 sm:p-5">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Current account</div>
                <div className="mt-1 text-sm font-medium text-white">{me?.name || me?.username || 'AF Home Member'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Verification status</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${statusDot}`} />
                  <span className="text-sm font-medium text-white">{statusLabel}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:mt-8">
              <Link
                href={ctaHref}
                className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
                  ctaPrimary
                    ? 'bg-orange-500 hover:bg-orange-400'
                    : 'border border-white/15 hover:bg-white/5'
                }`}
              >
                {ctaLabel}
              </Link>
              {ctaHref !== profileBasePath && (
                <Link
                  href={profileBasePath}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/5"
                >
                  Back to Profile
                </Link>
              )}
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
