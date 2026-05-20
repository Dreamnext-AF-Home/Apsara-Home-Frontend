'use client';

import VideoBackground from "@/components/VideoBackground";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AuthTabs from "@/components/AuthTabs";
import LoginForm from "@/components/LoginForm";
import SignUpForm from "@/components/SignUpForm";
import ForcedPasswordChangeForm from "@/components/auth/ForcedPasswordChangeForm";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/landing-page/Header";
import Footer from "@/components/landing-page/Footer";

type Mode = 'login' | 'signup' | 'force-password-change'
const LOGIN_REDIRECT_GUARD_KEY = 'afhome-skip-login-redirect'

function resolveCallbackPath(value: string | null | undefined): string {
  const normalized = String(value ?? '').trim();
  if (!normalized.startsWith('/')) return '/shop';
  if (normalized.startsWith('//')) return '/shop';
  return normalized;
}

interface LoginPageClientProps {
  turnstileSiteKey?: string;
  signupTurnstileSiteKey?: string;
  defaultCallbackPath?: string;
  accountLabel?: string;
  headerLogoUrl?: string;
  headerLogoAlt?: string;
  hideHeaderNavLinks?: boolean;
  headerLogoHref?: string;
  headerShopHref?: string;
  usePartnerFooter?: boolean;
  partnerFooterName?: string;
  partnerFooterLogoUrl?: string;
  partnerFooterLogoAlt?: string;
  partnerFooterHomeHref?: string;
  backgroundVideoUrl?: string;
  signupInitialReferralCode?: string;
  signupPartnerSlug?: string;
  otpSenderName?: string;
}

export default function LoginPageClient({
  turnstileSiteKey = '',
  signupTurnstileSiteKey = '',
  defaultCallbackPath = '/shop',
  accountLabel = 'AF Home',
  headerLogoUrl = '/Images/af_home_logo.png',
  headerLogoAlt = 'AFhome Logo',
  hideHeaderNavLinks = false,
  headerLogoHref = '/',
  headerShopHref = '/shop',
  usePartnerFooter = false,
  partnerFooterName = '',
  partnerFooterLogoUrl = '',
  partnerFooterLogoAlt = 'Partner logo',
  partnerFooterHomeHref = '/',
  backgroundVideoUrl = '/loginpageVideo/home-login.mp4',
  signupInitialReferralCode = '',
  signupPartnerSlug = '',
  otpSenderName = '',
}: LoginPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, data: session } = useSession();
  const forcePasswordChange = searchParams.get('force-password-change') === '1';
  const switchAccount = searchParams.get('switch') === '1';
  const justLoggedOut = searchParams.get('logged_out') === '1';
  const passwordChangeRequired = Boolean(session?.user?.passwordChangeRequired);
  const hasReferral = Boolean(searchParams.get('ref') || searchParams.get('referred_by'));
  const requestedMode = searchParams.get('mode');
  const callbackPath = resolveCallbackPath(searchParams.get('callback') || searchParams.get('callbackUrl') || defaultCallbackPath);
  const [manualMode, setManualMode] = useState<'login' | 'signup' | null>(null);

  useEffect(() => {
    if (requestedMode === 'signup') {
      setManualMode('signup');
      return;
    }
    if (requestedMode === 'login') {
      setManualMode('login');
    }
  }, [requestedMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const shouldSkipRedirect = window.sessionStorage.getItem(LOGIN_REDIRECT_GUARD_KEY) === '1';
    if (!shouldSkipRedirect) return;

    window.sessionStorage.removeItem(LOGIN_REDIRECT_GUARD_KEY);
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (justLoggedOut) return;
    if (forcePasswordChange || passwordChangeRequired) return;
    if (switchAccount) return;

    router.replace(callbackPath);
  }, [
    status,
    justLoggedOut,
    forcePasswordChange,
    passwordChangeRequired,
    switchAccount,
    router,
    callbackPath,
  ]);

  const mode: Mode = passwordChangeRequired || forcePasswordChange
    ? 'force-password-change'
    : (manualMode ?? (hasReferral ? 'signup' : 'login'));
  const handleTabChange = (nextMode: 'login' | 'signup') => setManualMode(nextMode);

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto flex flex-col">
      <VideoBackground videoSrc={backgroundVideoUrl} />
      <div className="absolute inset-0 bg-black/25 dark:bg-black/55 backdrop-blur-[2px]" />

      <div className="relative z-20">
        <Header
          cartCount={0}
          hideNavLinks={hideHeaderNavLinks}
          logoUrl={headerLogoUrl}
          logoAlt={headerLogoAlt}
          logoHref={headerLogoHref}
          shopHref={headerShopHref}
        />
      </div>

      <div className={`relative z-10 flex justify-center w-full px-4 ${mode === 'signup' ? 'items-start pt-28 pb-10 sm:pt-32' : 'min-h-[100dvh] items-center py-8'}`}>
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1]}}
          className={`w-full transition-all duration-300 ${mode === 'signup' ? 'max-w-4xl' : 'max-w-md'}`}
        >
          <div className={`rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-800 ${mode === 'signup' ? 'p-5 sm:p-9 md:p-10' : 'p-5 sm:p-8'}`}>
            {mode !== 'force-password-change' && (
              <AuthTabs mode={mode as 'login' | 'signup'} setMode={handleTabChange} />
            )}
            <AnimatePresence
              mode="wait"
              initial={false}
            >
              {mode === 'login' ? (
                <LoginForm
                  key="login"
                  onSwitchToSignUp={() => setManualMode('signup')}
                  onRequirePasswordChange={() => setManualMode('login')}
                  turnstileSiteKey={turnstileSiteKey}
                  accountLabel={accountLabel}
                  defaultCallbackPath={defaultCallbackPath}
                />
              ) : mode === 'signup' ? (
                <SignUpForm
                  key="signup"
                  onSwitchToLogin={() => setManualMode('login')}
                  turnstileSiteKey={signupTurnstileSiteKey}
                  initialReferralCode={signupInitialReferralCode}
                  partnerSlug={signupPartnerSlug}
                  otpSenderName={otpSenderName}
                />
              ) : (
                <ForcedPasswordChangeForm key="force-password-change" />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <div className="relative z-10">
        {usePartnerFooter ? (
          <footer className="border-t border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-slate-600 sm:flex-row">
              <div className="flex items-center gap-3">
                {partnerFooterLogoUrl ? (
                  <img
                    src={partnerFooterLogoUrl}
                    alt={partnerFooterLogoAlt}
                    className="h-8 w-auto object-contain"
                  />
                ) : null}
                <p className="font-medium text-slate-700">{partnerFooterName || 'Partner Storefront'}</p>
              </div>
              <a href={partnerFooterHomeHref} className="text-sky-600 hover:text-sky-500">
                Back to storefront
              </a>
            </div>
          </footer>
        ) : (
          <Footer />
        )}
      </div>
    </div>
  )
}
