'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useMeQuery } from '@/store/api/userApi';

const requirementItems = [
  'Valid government-issued ID',
  'Clear selfie holding your ID',
  'Accurate personal and contact details',
  'Current address and supporting information',
];

const featureItems = [
  'Unlock affiliate referral features',
  'Qualify for verified affiliate activity',
  'Build trust with customers and your network',
  'Prepare your account for commission-related workflows',
];

export default function VerificationOverviewPage() {
  const { data: me } = useMeQuery();
  const verificationStatus = me?.verification_status ?? 'not_verified';
  const isVerified = verificationStatus === 'verified' || me?.account_status === 1;
  const isPending = verificationStatus === 'pending_review' || me?.account_status === 2;

  const statusText = isVerified
    ? 'Your account is already verified.'
    : isPending
      ? 'Your verification request is currently under review.'
      : 'Verify your account to unlock affiliate-only features.';

  const statusClass = isVerified
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : isPending
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-orange-50 text-orange-700 border-orange-200';

  const ctaLabel = isVerified ? 'View Profile' : isPending ? 'Review My Submission' : 'Start Verification';
  const ctaHref = '/profile?tab=encashment';

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.08),_transparent_28%),linear-gradient(180deg,#fffdf9_0%,#f7f2e9_100%)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 md:px-6 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-[28px] border border-stone-200 bg-white/90 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.08)]"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-teal-700">Affiliate Verification</p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                Verify your AF Home account before you start earning with confidence.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Complete your verification to unlock the affiliate-side features of AF Home. This helps us protect your
                account, validate your identity, and keep referrals and commissions tied to legitimate members only.
              </p>
            </div>

            <div className="flex flex-col items-start gap-4 lg:items-end">
              <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
                <Image
                  src="/Images/af_home_logo.png"
                  alt="AF Home"
                  width={132}
                  height={44}
                  className="h-9 w-auto object-contain"
                  priority
                />
              </div>
              <div className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium ${statusClass}`}>
                {statusText}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="rounded-[28px] border border-stone-200 bg-white/90 p-8 shadow-[0_22px_70px_rgba(15,23,42,0.06)]"
          >
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Why get verified?</h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {featureItems.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-teal-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">What you need</h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {requirementItems.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-stone-200 bg-stone-50/70 p-5">
              <h3 className="text-sm font-semibold text-slate-900">What happens next?</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  ['1', 'Submit your details', 'Fill out the verification form and upload the required files.'],
                  ['2', 'Admin reviews your request', 'Our team checks the submitted information and documents.'],
                  ['3', 'Receive your status update', 'You will get a notification once your verification is approved or rejected.'],
                ].map(([step, title, text]) => (
                  <div key={step} className="rounded-2xl border border-stone-200 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Step {step}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{title}</div>
                    <p className="mt-2 text-xs leading-6 text-slate-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-[28px] border border-stone-200 bg-[#0f172a] p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-300">Verification Reminder</p>
            <h2 className="mt-4 text-2xl font-semibold">Only unverified accounts need to complete this step.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              If you are already verified, you can return to your profile anytime. If your request is pending, you may
              review your submission details and wait for the admin decision.
            </p>

            <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Current account</div>
                <div className="mt-1 text-sm font-medium text-white">{me?.name || me?.username || 'AF Home Member'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Verification status</div>
                <div className="mt-1 text-sm font-medium text-white">
                  {isVerified ? 'Verified' : isPending ? 'Pending review' : 'Not verified'}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                href={ctaHref}
                className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
              >
                {ctaLabel}
              </Link>
              <Link
                href="/profile"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/5"
              >
                Back to Profile
              </Link>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
