'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useMeQuery } from '@/store/api/userApi';
import { setStoredReferralCode } from '@/libs/referral';

type ReferralLandingPageProps = {
  referralCode: string;
};

const ReferralLandingPage = ({ referralCode }: ReferralLandingPageProps) => {
  const normalizedCode = useMemo(() => referralCode.trim(), [referralCode]);
  const { data: me } = useMeQuery();

  const isLoggedIn = Boolean(me);
  const isOwnLink = isLoggedIn && me?.username?.toLowerCase() === normalizedCode.toLowerCase();

  useEffect(() => {
    if (!normalizedCode || isLoggedIn) return;
    setStoredReferralCode(normalizedCode);
  }, [isLoggedIn, normalizedCode]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffdf8_0%,#f7f1e7_100%)] px-6 py-20 text-slate-900">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-[#e6d9c4] bg-white shadow-[0_20px_80px_rgba(56,39,17,0.08)]">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <section className="px-8 py-12 md:px-12 md:py-16">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b58a45]">
              AF Home Referral
            </p>
            <h1 className="max-w-xl font-['Cormorant_Garamond'] text-5xl leading-none text-[#2b2116] md:text-6xl">
              You were invited by <span className="italic">@{normalizedCode}</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600">
              Browse AF Home through your affiliate referral and keep the invite attached to your visit.
              When you are ready to create an account or check out, your referral will already be applied.
            </p>

            {!isLoggedIn && (
              <div className="mt-8 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-900">
                <p className="font-semibold">Referral recognized.</p>
                <p className="mt-1 text-emerald-800">
                  Your affiliate referral from <span className="font-semibold">@{normalizedCode}</span> has been saved in this browser.
                  You can keep browsing now, then sign up or check out later without losing the referral.
                </p>
              </div>
            )}

            {isLoggedIn && !isOwnLink && (
              <div className="mt-8 rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
                <p className="font-semibold">You are already signed in.</p>
                <p className="mt-1 text-amber-800">
                  This referral link will not replace your current account referral. If you want to register under
                  <span className="font-semibold"> @{normalizedCode}</span>, please sign out first or use another browser.
                </p>
              </div>
            )}

            {isOwnLink && (
              <div className="mt-8 rounded-[24px] border border-sky-200 bg-sky-50 px-5 py-4 text-sm leading-6 text-sky-900">
                <p className="font-semibold">This is your own affiliate link.</p>
                <p className="mt-1 text-sky-800">
                  Share this page with new visitors so they can browse, sign up, and purchase under your referral.
                </p>
              </div>
            )}

            <div className="mt-10 flex flex-wrap gap-3">
              {!isLoggedIn && (
                <>
                  <Link
                    href={`/login?ref=${encodeURIComponent(normalizedCode)}`}
                    className="rounded-full bg-[#ef7f1a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#d96f10]"
                  >
                    Sign Up With Referral
                  </Link>
                  <Link
                    href="/shop"
                    className="rounded-full border border-[#d8c7ac] px-6 py-3 text-sm font-semibold text-[#5b4630] transition hover:bg-[#f6efe4]"
                  >
                    Continue Shopping
                  </Link>
                </>
              )}

              {isLoggedIn && !isOwnLink && (
                <Link
                  href="/shop"
                  className="rounded-full bg-[#ef7f1a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#d96f10]"
                >
                  Continue Shopping
                </Link>
              )}

              {isOwnLink && (
                <Link
                  href="/profile"
                  className="rounded-full bg-[#ef7f1a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#d96f10]"
                >
                  Back to Profile
                </Link>
              )}
            </div>
          </section>

          <aside className="border-t border-[#efe4d2] bg-[#fbf7ef] px-8 py-12 md:px-10 lg:border-l lg:border-t-0">
            <div className="rounded-[24px] border border-[#eadbc2] bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a4793a]">
                What happens next?
              </h2>
              <ul className="mt-6 space-y-4 text-sm leading-6 text-slate-600">
                <li>1. Your referral code is saved for this browser session.</li>
                <li>2. You can browse products before signing up.</li>
                <li>3. When you register or check out, the referral can be applied automatically.</li>
              </ul>
            </div>

            <div className="mt-6 rounded-[24px] border border-[#eadbc2] bg-[#fffaf2] p-6 text-sm leading-6 text-slate-600">
              {isOwnLink && (
                <p>
                  This is your own affiliate link. Share this page with new visitors so they can sign up or shop under your referral.
                </p>
              )}
              {!isLoggedIn && (
                <p>
                  Not ready to sign up yet? That&apos;s fine. Your saved referral can still follow you to sign up or guest checkout later in this browser.
                </p>
              )}
              {isLoggedIn && !isOwnLink && (
                <p>
                  You are already signed in. Your current account will stay active, and this referral link will not overwrite your existing account relationship.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default ReferralLandingPage;
