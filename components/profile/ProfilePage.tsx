'use client';

import { MeResponse, ReferralTreeNode, AccountSnapshot, useChangePasswordMutation, useMeQuery, useAccountSnapshotQuery, useReferralTreeQuery, useUpdateProfileMutation, useUploadAvatarMutation, useSendUsernameChangeOtpMutation, useSubmitUsernameChangeRequestMutation, useUsernameChangeLatestQuery, useMemberActivityQuery, useMemberSessionsQuery, useRevokeMemberSessionMutation, useLinkedAccountsQuery, useLinkGoogleAccountMutation, useUnlinkGoogleAccountMutation, useLinkFacebookAccountMutation, useUnlinkFacebookAccountMutation, LinkedAccount, useSetupTotpMutation, useEnableTotpMutation, useDisableTotpMutation, SetupTotpResponse } from '@/store/api/userApi';
import { signOut, useSession } from 'next-auth/react';
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Loading from '../Loading';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { MemberTier } from '@/types/members/types';
import TopBar from '@/components/layout/TopBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/landing-page/Footer';
import { showErrorToast, showSuccessToast } from '@/libs/toast';

const TIER_BADGE_IMAGE: Record<MemberTier, string> = {
  'Home Starter': '/Badge/homeStarter.png',
  'Home Builder': '/Badge/homeBuilder.png',
  'Home Stylist': '/Badge/homeStylist.png',
  'Lifestyle Consultant': '/Badge/lifestyleConsultant.png',
  'Lifestyle Elite': '/Badge/lifestyleElite.png',
};

const TIER_COVER: Record<MemberTier, { gradient: string; glow: string; pill: string }> = {
  'Home Starter':         { gradient: 'from-sky-400 to-sky-500',           glow: 'rgba(251,146,60,0.5)',   pill: 'bg-white/80 text-sky-700 border-sky-200' },
  'Home Builder':         { gradient: 'from-emerald-400 to-teal-500',           glow: 'rgba(52,211,153,0.5)',   pill: 'bg-white/80 text-emerald-700 border-emerald-200' },
  'Home Stylist':         { gradient: 'from-sky-400 to-blue-500',               glow: 'rgba(56,189,248,0.5)',   pill: 'bg-white/80 text-sky-700 border-sky-200' },
  'Lifestyle Consultant': { gradient: 'from-violet-500 to-purple-600',          glow: 'rgba(167,139,250,0.5)',  pill: 'bg-white/80 text-violet-700 border-violet-200' },
  'Lifestyle Elite':      { gradient: 'from-sky-400 via-sky-400 to-rose-400', glow: 'rgba(251,191,36,0.6)', pill: 'bg-white/80 text-sky-700 border-sky-300' },
};

const rankToTier = (rank: number): MemberTier => {
  if (rank >= 5) return 'Lifestyle Elite';
  if (rank === 4) return 'Lifestyle Consultant';
  if (rank === 3) return 'Home Stylist';
  if (rank === 2) return 'Home Builder';
  return 'Home Starter';
};

type TierReq = { pv: number; referrals: number; activeMembers?: number; activeBuilders?: number; activeLeaders?: number };
const NEXT_TIER_REQUIREMENTS: Record<number, TierReq> = {
  1: { pv: 300,  referrals: 2  },
  2: { pv: 1000, referrals: 5,  activeMembers: 2 },
  3: { pv: 3000, referrals: 10, activeBuilders: 5 },
  4: { pv: 8000, referrals: 20, activeLeaders: 10 },
};
import Icon from './Icons';
import getPasswordStrength from './GetPasswordStrength';
import fadeUp from './FadeUp';
import PasswordInput from './PasswordInput';
import Toggle from './Toggle';
import getActivityIcon from './GetActivityIcon';
import EncashmentTab from './EncashmentTab';
import WalletTab from './WalletTab';
import InteriorRequestsTab from './InteriorRequestsTab';
import LevelsTab from './LevelsTab';
import { usePhAddress } from '@/hooks/usePhAddress';
import { containsBlockedWord } from '@/libs/badWords';
import { getProfileCompletion } from '@/libs/profileCompletion';

const hasRealPhoneNumber = (value?: string | null) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length >= 10;
};

const base64UrlToUint8Array = (value: string): Uint8Array<ArrayBuffer> => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const uint8ArrayToBase64Url = (input: ArrayBuffer | Uint8Array): string => {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

// Google OAuth popup handler
type GoogleAuthResult = {
  success: true;
  provider_id: string;
  token: string;
  email: string;
  name: string;
} | {
  success: false;
  error: string;
};

const openGoogleAuthPopup = (systemEmail: string): Promise<GoogleAuthResult> => {
  return new Promise((resolve) => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      resolve({ success: false, error: 'Google Client ID not configured' });
      return;
    }

    const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/auth/google/callback` : '';
    const scope = encodeURIComponent('openid email profile');
    
    // Encode system email in state parameter (format: random_string|email)
    const randomState = Math.random().toString(36).substring(2, 15);
    const state = `${randomState}|${encodeURIComponent(systemEmail)}`;

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${scope}` +
      `&state=${state}` +
      `&prompt=consent`;

    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'googleAuth',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
    );

    if (!popup) {
      resolve({ success: false, error: 'Popup blocked. Please allow popups for this site.' });
      return;
    }

    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'GOOGLE_AUTH_CALLBACK') return;

      window.removeEventListener('message', messageHandler);
      clearInterval(checkClosed);

      const { error, access_token, provider_id, email, name } = event.data;

      if (error) {
        resolve({ success: false, error });
      } else if (access_token && provider_id && email) {
        resolve({
          success: true,
          token: access_token,
          provider_id,
          email,
          name: name || email.split('@')[0],
        });
      } else {
        resolve({ success: false, error: 'Failed to get Google credentials' });
      }
    };

    window.addEventListener('message', messageHandler);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        resolve({ success: false, error: 'Authentication cancelled' });
      }
    }, 500);
  });
};

// Facebook OAuth popup handler
type FacebookAuthResult = {
  success: true;
  provider_id: string;
  token: string;
  email: string;
  name: string;
} | {
  success: false;
  error: string;
};

const openFacebookAuthPopup = (): Promise<FacebookAuthResult> => {
  return new Promise((resolve) => {
    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    if (!clientId) {
      resolve({ success: false, error: 'Facebook App ID not configured' });
      return;
    }

    const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/auth/facebook/callback` : '';
    const state = Math.random().toString(36).substring(2, 15);

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=email,public_profile` +
      `&state=${state}`;

    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'facebookAuth',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
    );

    if (!popup) {
      resolve({ success: false, error: 'Popup blocked. Please allow popups for this site.' });
      return;
    }

    const broadcast = new BroadcastChannel('facebook_auth');

    const cleanup = () => {
      broadcast.close();
      clearInterval(checkClosed);
      window.removeEventListener('message', legacyMessageHandler);
    };

    const handleResult = (data: Record<string, unknown>) => {
      cleanup();
      const { error, access_token, provider_id, email, name } = data as Record<string, string>;
      if (error) {
        resolve({ success: false, error });
      } else if (access_token && provider_id && email) {
        resolve({
          success: true,
          token: access_token,
          provider_id,
          email,
          name: name || email.split('@')[0],
        });
      } else {
        resolve({ success: false, error: 'Failed to get Facebook credentials' });
      }
    };

    broadcast.onmessage = (event) => handleResult(event.data);

    // fallback: window.opener.postMessage for browsers that still support it
    const legacyMessageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'FACEBOOK_AUTH_CALLBACK') return;
      handleResult(event.data);
    };
    window.addEventListener('message', legacyMessageHandler);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        cleanup();
        resolve({ success: false, error: 'Authentication cancelled' });
      }
    }, 500);
  });
};

type PasskeyListItem = {
  id: number;
  name: string;
  credential_id: string;
  sign_count: number;
  last_used_at?: string | null;
  created_at?: string | null;
};

type PasskeyCredentialDescriptor = {
  id: string;
  transports?: AuthenticatorTransport[];
};


type ProfileFormState = {
  name: string;
  email: string;
  phone: string;
  username: string;
  middle_name: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other' | '';
  occupation: string;
  work_location: 'local' | 'overseas';
  country: string;
};

type AddressFormState = {
  address: string;
  zipCode: string;
};

type PreferencesState = {
  marketingEmails: boolean;
  smsUpdates: boolean;
  orderUpdates: boolean;
  pushNotifications: boolean;
  twoFactorEnabled: boolean;
  language: 'en' | 'fil';
  currency: 'PHP' | 'USD';
};

type Tab = 'profile' | 'security' | 'preferences' | 'wallet' | 'pv' | 'encashment' | 'interior-requests' | 'activity' | 'change-username' | 'referrals' | 'levels';

type AlertMsg = { type: 'success' | 'error'; text: string };
type TreeStatusFilter = 'all' | 'verified' | 'pending_review' | 'not_verified' | 'blocked';

type ProfilePageProps = {
  initialProfile?: MeResponse | null;
  initialCategories?: any[];
};

const QrSkeleton = ({ sizeClass }: { sizeClass: string }) => (
  <div className={`relative overflow-hidden rounded-xl border border-purple-200 dark:border-purple-800 dark:bg-gray-800 ${sizeClass}`}>
    <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-purple-100 dark:from-purple-900/20 via-white dark:via-gray-800 to-indigo-100 dark:to-indigo-900/20" />
    <div className="absolute inset-[18%] rounded-lg border border-dashed border-purple-200/80 dark:border-purple-700/50" />
    <div className="absolute inset-x-[24%] top-[24%] h-2 rounded-full bg-purple-200/70 dark:bg-purple-700/50" />
    <div className="absolute inset-x-[18%] top-[40%] h-2 rounded-full bg-purple-100/90 dark:bg-purple-800/40" />
    <div className="absolute inset-x-[28%] top-[56%] h-2 rounded-full bg-indigo-100/90 dark:bg-indigo-800/40" />
  </div>
);

type ReferralShareCardProps = {
  title: string;
  description: string;
  badge: string;
  link: string;
  qrUrl: string;
  onCopy: () => void;
  onShare: () => void;
  message: AlertMsg | null;
  emptyText: string;
  linkLabel: string;
  qrAlt: string;
  compact?: boolean;
};

const ReferralShareCard = ({
  title,
  description,
  badge,
  link,
  qrUrl,
  onCopy,
  onShare,
  message,
  emptyText,
  linkLabel,
  qrAlt,
  compact = false,
}: ReferralShareCardProps) => {
  const [qrStatus, setQrStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    if (!qrUrl) {
      setQrStatus('idle');
      return;
    }

    let isCancelled = false;
    setQrStatus('loading');

    const preloadImage = new window.Image();
    preloadImage.decoding = 'async';
    preloadImage.src = qrUrl;

    if (preloadImage.complete) {
      setQrStatus('ready');
      return;
    }

    preloadImage.onload = () => {
      if (!isCancelled) setQrStatus('ready');
    };

    preloadImage.onerror = () => {
      if (!isCancelled) setQrStatus('error');
    };

    return () => {
      isCancelled = true;
      preloadImage.onload = null;
      preloadImage.onerror = null;
    };
  }, [qrUrl]);

  const qrWrapperClass = compact ? 'h-24 w-24' : 'h-36 w-36';
  const qrImageClass = compact
    ? 'h-24 w-24 rounded-xl border border-sky-200 dark:border-sky-800 dark:bg-gray-800 p-1.5'
    : 'h-36 w-36 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-gray-800 p-2';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-gray-800 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-slate-700 dark:text-gray-300">{title}</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-gray-400">{description}</p>
        </div>
        <span className="rounded-full bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-700 px-2.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-300">{badge}</span>
      </div>

      {link ? (
        <>
          <div className={`my-3 flex ${compact ? 'items-start gap-4' : 'justify-center'}`}>
            <div className={`relative ${qrWrapperClass} shrink-0`}>
              {qrStatus !== 'ready' && <QrSkeleton sizeClass={`${qrWrapperClass} ${compact ? 'p-1.5 shadow-sm' : 'p-2'}`} />}
              {qrStatus === 'error' ? (
                <div className={`flex ${qrWrapperClass} items-center justify-center rounded-xl border border-sky-200 dark:border-sky-800 dark:bg-sky-900/30 p-3 text-center`}>
                  <p className={`font-medium leading-snug text-sky-700 ${compact ? 'text-[9px]' : 'text-[11px]'}`}>QR is still loading.</p>
                </div>
              ) : (
                <img
                  src={qrUrl}
                  alt={qrAlt}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className={`${qrImageClass} transition-opacity duration-300 ${qrStatus === 'ready' ? 'opacity-100' : 'opacity-0'}`}
                />
              )}
            </div>

            {compact && (
              <div className="min-w-0 flex-1">
                <div className="mb-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-gray-800 px-3 py-2">
                  <p className="text-[10px] font-medium text-slate-400 dark:text-gray-500 mb-0.5">{linkLabel}</p>
                  <p className="text-[11px] text-slate-600 dark:text-gray-300 break-all leading-snug">{link}</p>
                </div>
                {message && (
                  <p className={`mb-2 text-xs font-medium ${message.type === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {message.text}
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <button type="button" onClick={onCopy} className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-gray-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                    Copy Link
                  </button>
                  <button type="button" onClick={onShare} className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-600 dark:hover:bg-sky-700 transition-colors">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                    </svg>
                    Share
                  </button>
                </div>
              </div>
            )}
          </div>

          {!compact && (
            <>
              <div className="mb-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-gray-800 px-3 py-2">
                <p className="text-[10px] font-medium text-slate-400 dark:text-gray-500 mb-0.5">{linkLabel}</p>
                <p className="text-[11px] text-slate-600 dark:text-gray-300 font-medium break-all leading-snug">{link}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={onShare} className="flex items-center justify-center gap-1.5 rounded-xl bg-sky-500 px-2 py-2 text-xs font-semibold text-white hover:bg-sky-600 dark:hover:bg-sky-700 transition-colors">
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                  </svg>
                  Share
                </button>
                <button type="button" onClick={onCopy} className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-gray-800 px-2 py-2 text-xs font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  Copy Link
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        <p className="py-2 text-xs text-[#2c5f4f]/70">{emptyText}</p>
      )}
    </div>
  );
};

const ProfilePage = ({ initialProfile = null, initialCategories = [] }: ProfilePageProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update: updateSession } = useSession();
  const role = String(session?.user?.role ?? '').toLowerCase();
  const accessToken = String((session?.user as { accessToken?: string } | undefined)?.accessToken ?? '');
  const apiBaseUrl = (process.env.NEXT_PUBLIC_LARAVEL_API_URL || '').trim();
  const passkeySupported = typeof window !== 'undefined' && !!window.PublicKeyCredential && !!navigator.credentials;
  const isCustomerSession = status === 'authenticated' && (role === 'customer' || role === '');
  const { data, refetch: refetchMe } = useMeQuery(undefined, {
    skip: !isCustomerSession,
  });
  const { data: accountSnapshot, refetch: refetchAccountSnapshot } = useAccountSnapshotQuery(undefined, {
    skip: !isCustomerSession,
  });
  const { data: referralTree, isLoading: isReferralTreeLoading, refetch: refetchReferralTree } = useReferralTreeQuery(undefined, {
    skip: !isCustomerSession,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 15000,
  });
  const { data: usernameChangeLatest, refetch: refetchUsernameChangeLatest } = useUsernameChangeLatestQuery(undefined, {
    skip: !isCustomerSession,
  });
  const { data: activityData, isLoading: isActivityLoading } = useMemberActivityQuery(undefined, {
    skip: !isCustomerSession,
  });
  const { data: sessionsData, isLoading: isSessionsLoading } = useMemberSessionsQuery(undefined, {
    skip: !isCustomerSession,
  });
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [uploadAvatar] = useUploadAvatarMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [sendUsernameChangeOtp, { isLoading: isSendingUsernameOtp }] = useSendUsernameChangeOtpMutation();
  const [submitUsernameChangeRequest, { isLoading: isSubmittingUsernameChange }] = useSubmitUsernameChangeRequestMutation();
  const [revokeMemberSession, { isLoading: isRevokingSession }] = useRevokeMemberSessionMutation();
  const { data: linkedAccountsData, refetch: refetchLinkedAccounts } = useLinkedAccountsQuery(undefined, {
    skip: !isCustomerSession,
  });
  const [linkGoogleAccount, { isLoading: isLinkingGoogle }] = useLinkGoogleAccountMutation();
  const [unlinkGoogleAccount, { isLoading: isUnlinkingGoogle }] = useUnlinkGoogleAccountMutation();
  const [linkFacebookAccount, { isLoading: isLinkingFacebook }] = useLinkFacebookAccountMutation();
  const [unlinkFacebookAccount, { isLoading: isUnlinkingFacebook }] = useUnlinkFacebookAccountMutation();
  const [setupTotp] = useSetupTotpMutation();
  const [enableTotp] = useEnableTotpMutation();
  const [disableTotp] = useDisableTotpMutation();

  const isGoogleLinked = useMemo(() => {
    return linkedAccountsData?.accounts?.some((account: LinkedAccount) => account.provider === 'google') ?? false;
  }, [linkedAccountsData]);

  const isFacebookLinked = useMemo(() => {
    return linkedAccountsData?.accounts?.some((account: LinkedAccount) => account.provider === 'facebook') ?? false;
  }, [linkedAccountsData]);

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [googleLinkSuccess, setGoogleLinkSuccess] = useState(false);
  const [facebookLinkSuccess, setFacebookLinkSuccess] = useState(false);
  const profileDraftDirtyRef = useRef(false);
  const slideDir = useRef(1);
  const [isMobile, setIsMobile] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  const [form, setForm] = useState<ProfileFormState>({
    name: '',
    email: '',
    phone: '',
    username: '',
    middle_name: '',
    birth_date: '',
    gender: '',
    occupation: '',
    work_location: 'local',
    country: 'Philippines',
  });
  const [usernameRequest, setUsernameRequest] = useState('');
  const [usernameOtp, setUsernameOtp] = useState('');
  const [usernameOtpToken, setUsernameOtpToken] = useState<string | null>(null);
  const [usernameOtpSentTo, setUsernameOtpSentTo] = useState<string | null>(null);
  const [isUsernamePendingLocal, setIsUsernamePendingLocal] = useState(false);
  const [bio, setBio] = useState('');

  const [security, setSecurity] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [passkeys, setPasskeys] = useState<PasskeyListItem[]>([]);
  const [passkeyName, setPasskeyName] = useState('');
  const [isLoadingPasskeys, setIsLoadingPasskeys] = useState(false);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [removingPasskeyId, setRemovingPasskeyId] = useState<number | null>(null);

  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpStep, setTotpStep] = useState<'idle' | 'confirm-disable'>('idle');
  const [totpSetupData, setTotpSetupData] = useState<SetupTotpResponse | null>(null);
  const [totpModalOpen, setTotpModalOpen] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError, setTotpError] = useState<string | null>(null);

  const [prefs, setPrefs] = useState<PreferencesState>({
    marketingEmails: true,
    smsUpdates: false,
    orderUpdates: true,
    pushNotifications: true,
    twoFactorEnabled: false,
    language: 'en',
    currency: 'PHP',
  });
  const [isUpdatingTwoFactor, setIsUpdatingTwoFactor] = useState(false);

  const [profileMsg, setProfileMsg] = useState<AlertMsg | null>(null);
  const [usernameMsg, setUsernameMsg] = useState<AlertMsg | null>(null);
  const [referralMsg, setReferralMsg] = useState<AlertMsg | null>(null);
  const [expandedTreeNodes, setExpandedTreeNodes] = useState<Record<number, boolean>>({});
  const [treeSearchQuery, setTreeSearchQuery] = useState('');
  const [treeStatusFilter, setTreeStatusFilter] = useState<TreeStatusFilter>('all');
  const [referralPage, setReferralPage] = useState(1);
  const REFERRAL_PAGE_SIZE = 10;
  const ACTIVITY_PAGE_SIZE = 6;
  const [activityPage, setActivityPage] = useState(1);
  const [sessionPage, setSessionPage] = useState(1);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [revokingTokenId, setRevokingTokenId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormState>({ address: '', zipCode: '' });
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usernameMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const referralMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mainContentRef = useRef<HTMLDivElement | null>(null);
  const completeInformationRef = useRef<HTMLDivElement | null>(null);
  const phAddress = usePhAddress();
  const profileData = data ?? initialProfile;
  const effectiveAvatarUrl = avatarPreviewUrl || profileData?.avatar_url || '';
  const effectiveRank = profileData?.rank ?? accountSnapshot?.loyalty?.rank ?? 0;
  const loyaltyTier: MemberTier = rankToTier(effectiveRank);
  const referralSummary = useMemo(() => {
    const countNodes = (nodes: ReferralTreeNode[]): number =>
      nodes.reduce((acc, node) => acc + 1 + countNodes(node.children ?? []), 0);

    const countSecondLevel = (nodes: ReferralTreeNode[]): number =>
      nodes.reduce((acc, node) => acc + (node.children?.length ?? 0), 0);

    const snapshotDirectReferrals = accountSnapshot?.loyalty?.direct_referrals ?? [];
    const referralTreeChildren = referralTree?.children ?? [];
    const referralTreeCount = countNodes(referralTreeChildren);
    const snapshotTreeCount = countNodes(snapshotDirectReferrals);

    const directCount = Math.max(
      referralTree?.summary?.direct_count ?? 0,
      accountSnapshot?.loyalty?.referral_count ?? 0,
      snapshotDirectReferrals.length,
    );
    const secondLevelCount = Math.max(
      referralTree?.summary?.second_level_count ?? 0,
      countSecondLevel(referralTreeChildren),
      countSecondLevel(snapshotDirectReferrals),
    );
    const totalNetwork = Math.max(
      referralTree?.summary?.total_network ?? 0,
      directCount + secondLevelCount,
      referralTreeCount,
      snapshotTreeCount,
    );
    const networkPv = (referralTree?.summary as { total_pv?: number } | undefined)?.total_pv ?? 0;
    const personalPv = accountSnapshot?.loyalty?.personal_pv ?? 0;
    const totalPv = personalPv + networkPv;

    return {
      directCount,
      secondLevelCount,
      totalNetwork,
      totalPv,
    };
  }, [
    accountSnapshot?.loyalty?.direct_referrals,
    accountSnapshot?.loyalty?.personal_pv,
    accountSnapshot?.loyalty?.referral_count,
    referralTree?.summary,
    referralTree?.children,
  ]);
  const referralChildren = useMemo(() => {
    const treeChildren = referralTree?.children ?? [];
    if (treeChildren.length > 0) return treeChildren;

    return accountSnapshot?.loyalty?.direct_referrals ?? [];
  }, [
    accountSnapshot?.loyalty?.direct_referrals,
    referralTree?.children,
  ]);
  const celebrateLevelUp = searchParams.get('celebrate') === 'level-up';
  const celebrateRank = Number(searchParams.get('rank') ?? effectiveRank ?? 0);
  const celebrateTier: MemberTier = rankToTier(Number.isFinite(celebrateRank) ? celebrateRank : effectiveRank);

  const setPasskeyError = useCallback((text: string) => {
    setProfileMsg({ type: 'error', text });
    showErrorToast(text);
  }, []);

  const setPasskeySuccess = useCallback((text: string) => {
    setProfileMsg({ type: 'success', text });
    showSuccessToast(text);
  }, []);

  const buildProfileFormState = useCallback((): ProfileFormState => ({
    name: profileData?.name ?? session?.user?.name ?? '',
    email: profileData?.email ?? session?.user?.email ?? '',
    phone: profileData?.phone ?? '',
    username: profileData?.username ?? '',
    middle_name: profileData?.middle_name ?? '',
    birth_date: profileData?.birth_date ?? '',
    gender: (profileData?.gender as ProfileFormState['gender']) ?? '',
    occupation: profileData?.occupation ?? '',
    work_location: (profileData?.work_location as ProfileFormState['work_location']) ?? 'local',
    country: profileData?.country ?? 'Philippines',
  }), [profileData, session]);

  useEffect(() => {
    if (!celebrateLevelUp) return;

    const rankParam = searchParams.get('rank');
    const nextParams = new URLSearchParams();
    if (rankParam) {
      nextParams.set('rank', rankParam);
    }
    router.replace(`/profile/level-up${nextParams.toString() ? `?${nextParams.toString()}` : ''}`, { scroll: false });
  }, [celebrateLevelUp, router, searchParams]);

  useEffect(() => {
    if (!profileData && !session) return;
    if (!profileDraftDirtyRef.current) {
      setForm(buildProfileFormState());
    }
    setUsernameRequest(profileData?.username ?? '');
  }, [buildProfileFormState, profileData, session]);

  useEffect(() => {
    if (!profileData) return;
    setPrefs((prev) => ({ ...prev, twoFactorEnabled: Boolean(profileData.two_factor_enabled) }));
    setTotpEnabled(Boolean(profileData.totp_enabled));
  }, [profileData?.two_factor_enabled, profileData?.totp_enabled, profileData]);

  useEffect(() => {
    if (!isAddressModalOpen) return;
    setAddressForm({
      address: profileData?.address ?? '',
      zipCode: profileData?.zip_code ?? '',
    });
  }, [profileData?.address, profileData?.zip_code, isAddressModalOpen]);

  useEffect(() => {
    if (!isAddressModalOpen || !profileData?.region || phAddress.regions.length === 0 || phAddress.regionCode) return;
    const region = phAddress.regions.find((item) => item.name === profileData.region);
    if (region) {
      phAddress.setRegion(region.code, region.name);
    }
  }, [profileData?.region, isAddressModalOpen, phAddress, phAddress.regions, phAddress.regionCode]);

  useEffect(() => {
    if (
      !isAddressModalOpen ||
      !profileData?.province ||
      phAddress.noProvince ||
      phAddress.provinces.length === 0 ||
      phAddress.provinceCode
    ) return;
    const province = phAddress.provinces.find((item) => item.name === profileData.province);
    if (province) {
      phAddress.setProvince(province.code, province.name);
    }
  }, [profileData?.province, isAddressModalOpen, phAddress, phAddress.provinces, phAddress.provinceCode, phAddress.noProvince]);

  useEffect(() => {
    if (!isAddressModalOpen || !profileData?.city || phAddress.cities.length === 0 || phAddress.cityCode) return;
    const city = phAddress.cities.find((item) => item.name === profileData.city);
    if (city) {
      phAddress.setCity(city.code, city.name);
    }
  }, [profileData?.city, isAddressModalOpen, phAddress, phAddress.cities, phAddress.cityCode]);

  useEffect(() => {
    if (!isAddressModalOpen || !profileData?.barangay || phAddress.address.barangay) return;
    const barangay = phAddress.barangays.find((item) => item.name === profileData.barangay);
    if (barangay) {
      phAddress.setBarangay(barangay.name);
    }
  }, [profileData?.barangay, isAddressModalOpen, phAddress, phAddress.barangays, phAddress.address.barangay]);

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    const allowedTabs: Tab[] = ['profile', 'security', 'preferences', 'wallet', 'encashment', 'interior-requests', 'activity', 'change-username', 'referrals', 'levels'];

    if (requestedTab && allowedTabs.includes(requestedTab as Tab)) {
      setActiveTab(requestedTab as Tab);
    }
  }, [searchParams]);

  const passwordChangeRequired = Boolean(session?.user?.passwordChangeRequired || profileData?.password_change_required);
  const passwordChangeRequiredFromQuery = searchParams.get('password-change-required') === '1';

  // Auto-dismiss alert messages
  useEffect(() => {
    if (!profileMsg) return;
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setProfileMsg(null), 5000);
    return () => { if (msgTimer.current) clearTimeout(msgTimer.current); };
  }, [profileMsg]);

  useEffect(() => {
    if (!usernameMsg) return;
    if (usernameMsgTimer.current) clearTimeout(usernameMsgTimer.current);
    usernameMsgTimer.current = setTimeout(() => setUsernameMsg(null), 5000);
    return () => { if (usernameMsgTimer.current) clearTimeout(usernameMsgTimer.current); };
  }, [usernameMsg]);

  useEffect(() => {
    if (!isAvatarPreviewOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setIsAvatarPreviewOpen(false); setAvatarZoom(1); }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isAvatarPreviewOpen]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    if (!referralMsg) return;
    if (referralMsgTimer.current) clearTimeout(referralMsgTimer.current);
    referralMsgTimer.current = setTimeout(() => setReferralMsg(null), 3500);
    return () => { if (referralMsgTimer.current) clearTimeout(referralMsgTimer.current); };
  }, [referralMsg]);

  useEffect(() => {
    const directChildren = referralChildren;
    if (!directChildren.length) return;
    const next: Record<number, boolean> = {};
    directChildren.forEach((node) => {
      next[node.id] = true;
    });
    setExpandedTreeNodes(next);
  }, [referralChildren]);

  const hasChanges = useMemo(
    () =>
      form.name !== (profileData?.name ?? session?.user?.name ?? '') ||
      form.phone !== (profileData?.phone ?? '') ||
      form.middle_name !== (profileData?.middle_name ?? '') ||
      form.birth_date !== (profileData?.birth_date ?? '') ||
      form.gender !== ((profileData?.gender as ProfileFormState['gender']) ?? '') ||
      form.occupation !== (profileData?.occupation ?? '') ||
      form.work_location !== ((profileData?.work_location as ProfileFormState['work_location']) ?? 'local') ||
      form.country !== (profileData?.country ?? 'Philippines'),
    [
      profileData?.birth_date,
      profileData?.country,
      profileData?.gender,
      profileData?.middle_name,
      profileData?.name,
      profileData?.occupation,
      profileData?.phone,
      profileData?.work_location,
      form.birth_date,
      form.country,
      form.gender,
      form.middle_name,
      form.name,
      form.occupation,
      form.phone,
      form.work_location,
      session?.user?.name,
    ],
  );

  const verificationStatus = profileData?.verification_status ?? 'not_verified';
  const isVerified = verificationStatus === 'verified' || profileData?.account_status === 1;
  const configuredAppUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim().replace(/\/+$/, '');
  const runtimeOrigin = (typeof window !== 'undefined' ? window.location.origin : '').trim().replace(/\/+$/, '');
  const siteOrigin = configuredAppUrl || runtimeOrigin || 'http://localhost:3000';
  const referralCode = ((profileData?.username ?? form.username) || '').trim();
  const memberReferralLink = referralCode
    ? `${siteOrigin}/ref/${encodeURIComponent(referralCode)}`
    : '';
  const shoppingReferralLink = referralCode
    ? `${siteOrigin}/shop?ref=${encodeURIComponent(referralCode)}`
    : '';
  const memberReferralQrUrl = useMemo(
    () => (memberReferralLink
      ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(memberReferralLink)}`
      : ''),
    [memberReferralLink],
  );
  const shoppingReferralQrUrl = useMemo(
    () => (shoppingReferralLink
      ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shoppingReferralLink)}`
      : ''),
    [shoppingReferralLink],
  );
  const profileActionStatus = isUploadingAvatar
    ? 'Uploading profile photo...'
    : isSaving
      ? 'Saving profile changes...'
      : isChangingPassword
        ? 'Updating password...'
        : isUpdatingTwoFactor
          ? 'Updating security settings...'
          : isSendingUsernameOtp
            ? 'Sending username OTP...'
            : isSubmittingUsernameChange
              ? 'Submitting username request...'
              : isRevokingSession
                ? 'Signing out session...'
                : null;
  const isProfileActionPending = Boolean(profileActionStatus);
  const verificationBadgeClass = (status?: string) => {
    if (status === 'verified') return 'bg-emerald-100 text-emerald-700';
    if (status === 'pending_review') return 'bg-sky-100 text-sky-700';
    if (status === 'blocked') return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-600';
  };

  const completion = useMemo(() => {
    if (isVerified) return 100;

    return getProfileCompletion(profileData ?? {
      ...form,
      email: form.email,
      username: form.username,
      phone: form.phone,
      gender: form.gender || null,
    }).percentage;
  }, [form, isVerified, profileData]);

  const completionItems = useMemo(() => ([
    {
      label: 'Full Name',
      done: Boolean(form.name.trim()),
      hint: 'Shown on your account and address records.',
    },
    {
      label: 'Username',
      done: Boolean((profileData?.username ?? form.username).trim()),
      hint: 'Used for your referral links and account identity.',
    },
    {
      label: 'Email Address',
      done: Boolean(form.email.trim()),
      hint: 'This comes from your account registration.',
    },
    {
      label: 'Phone Number',
      done: hasRealPhoneNumber(form.phone),
      hint: 'Used for shipping and contact updates.',
    },
    {
      label: 'Address',
      done: Boolean(
        profileData?.address?.trim()
        && profileData?.city?.trim()
        && profileData?.province?.trim()
        && profileData?.region?.trim()
        && profileData?.zip_code?.trim(),
      ),
      hint: 'Street, region, city, barangay, and ZIP code.',
    },
    {
      label: 'Personal Details',
      done: Boolean(
        form.birth_date.trim()
        && form.gender
        && form.occupation.trim()
        && form.work_location
        && (form.work_location === 'local' || form.country.trim()),
      ),
      hint: 'Birth date, gender, occupation, work location, and country.',
    },
  ]), [
    form.birth_date,
    form.country,
    form.email,
    form.gender,
    form.middle_name,
    form.name,
    form.occupation,
    form.phone,
    form.username,
    form.work_location,
    profileData?.address,
    profileData?.city,
    profileData?.province,
    profileData?.region,
    profileData?.zip_code,
    profileData?.username,
  ]);

  const onChange = (field: keyof ProfileFormState) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => {
      profileDraftDirtyRef.current = true;
      return { ...prev, [field]: e.target.value };
    });

  const onOptionalChange = (field: keyof ProfileFormState) => (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm((prev) => {
    profileDraftDirtyRef.current = true;
    return { ...prev, [field]: e.target.value as ProfileFormState[typeof field] };
  });

  const togglePref = (field: keyof PreferencesState) =>
    setPrefs((prev) => (typeof prev[field] === 'boolean' ? { ...prev, [field]: !prev[field] } : prev));

  const handleToggleTwoFactor = async () => {
    const nextEnabled = !prefs.twoFactorEnabled;
    const previousEnabled = prefs.twoFactorEnabled;
    setPrefs((prev) => ({ ...prev, twoFactorEnabled: nextEnabled }));
    setIsUpdatingTwoFactor(true);
    setProfileMsg(null);

    try {
      await updateProfile({
        name: form.name.trim() || profileData?.name || session?.user?.name || 'AF Home User',
        phone: form.phone.trim() || undefined,
        two_factor_enabled: nextEnabled,
      }).unwrap();

      setProfileMsg({
        type: 'success',
        text: `Two-factor authentication ${nextEnabled ? 'enabled' : 'disabled'} successfully.`,
      });
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      setPrefs((prev) => ({ ...prev, twoFactorEnabled: previousEnabled }));
      setProfileMsg({
        type: 'error',
        text: apiError?.data?.message || 'Failed to update two-factor authentication.',
      });
    } finally {
      setIsUpdatingTwoFactor(false);
    }
  };

  const handleInitiateTotpSetup = async () => {
    setTotpError(null);
    setTotpLoading(true);
    try {
      const data = await setupTotp().unwrap();
      setTotpSetupData(data);
      setTotpCode('');
      setTotpModalOpen(true);
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      setTotpError(apiError?.data?.message || 'Failed to initiate authenticator setup.');
    } finally {
      setTotpLoading(false);
    }
  };

  const handleVerifyTotp = async () => {
    if (totpCode.length !== 6) {
      setTotpError('Please enter the 6-digit code from your authenticator app.');
      return;
    }
    setTotpError(null);
    setTotpLoading(true);
    try {
      await enableTotp({ code: totpCode }).unwrap();
      setTotpEnabled(true);
      setTotpModalOpen(false);
      setTotpSetupData(null);
      setTotpCode('');
      showSuccessToast('Authenticator app enabled successfully.');
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      setTotpError(apiError?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setTotpLoading(false);
    }
  };

  const handleDisableTotp = async () => {
    if (totpCode.length !== 6) {
      setTotpError('Please enter the 6-digit code from your authenticator app.');
      return;
    }
    setTotpError(null);
    setTotpLoading(true);
    try {
      await disableTotp({ code: totpCode }).unwrap();
      setTotpEnabled(false);
      setTotpStep('idle');
      setTotpCode('');
      showSuccessToast('Authenticator app removed successfully.');
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      setTotpError(apiError?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setTotpLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    setProfileMsg(null);
    const result = await openGoogleAuthPopup(form.email.toLowerCase().trim());

    if (!result.success) {
      setProfileMsg({ type: 'error', text: result.error });
      return;
    }

    try {
      await linkGoogleAccount({
        provider_id: result.provider_id,
        token: result.token,
        email: result.email,
        name: result.name,
      }).unwrap();

      await refetchLinkedAccounts();
      setGoogleLinkSuccess(true);
      setTimeout(() => setGoogleLinkSuccess(false), 3000);
      setProfileMsg({ type: 'success', text: 'Google account linked successfully. You can now log in with Google.' });
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string }; status?: number };
      if (apiError?.status === 409) {
        setProfileMsg({ type: 'error', text: 'This Google account is already linked to another user.' });
      } else {
        setProfileMsg({ type: 'error', text: apiError?.data?.message || 'Failed to link Google account.' });
      }
    }
  };

  const handleUnlinkGoogle = async () => {
    setProfileMsg(null);
    try {
      await unlinkGoogleAccount().unwrap();
      await refetchLinkedAccounts();
      setProfileMsg({ type: 'success', text: 'Google account unlinked successfully.' });
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      setProfileMsg({ type: 'error', text: apiError?.data?.message || 'Failed to unlink Google account.' });
    }
  };

  const handleConnectFacebook = async () => {
    setProfileMsg(null);
    const result = await openFacebookAuthPopup();

    if (!result.success) {
      setProfileMsg({ type: 'error', text: result.error });
      return;
    }

    try {
      await linkFacebookAccount({
        provider_id: result.provider_id,
        token: result.token,
        email: result.email,
        name: result.name,
      }).unwrap();

      await refetchLinkedAccounts();
      setFacebookLinkSuccess(true);
      setTimeout(() => setFacebookLinkSuccess(false), 3000);
      setProfileMsg({ type: 'success', text: 'Facebook account linked successfully. You can now log in with Facebook.' });
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string }; status?: number };
      if (apiError?.status === 409) {
        setProfileMsg({ type: 'error', text: 'This Facebook account is already linked to another user.' });
      } else {
        setProfileMsg({ type: 'error', text: apiError?.data?.message || 'Failed to link Facebook account.' });
      }
    }
  };

  const handleUnlinkFacebook = async () => {
    setProfileMsg(null);
    try {
      await unlinkFacebookAccount().unwrap();
      await refetchLinkedAccounts();
      setProfileMsg({ type: 'success', text: 'Facebook account unlinked successfully.' });
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      setProfileMsg({ type: 'error', text: apiError?.data?.message || 'Failed to unlink Facebook account.' });
    }
  };

  const handleCopyReferralLink = async (type: 'member' | 'shopping') => {
    const link = type === 'member' ? memberReferralLink : shoppingReferralLink;
    if (!link) {
      setReferralMsg({ type: 'error', text: 'Referral link is unavailable. Set your username first.' });
      return;
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = link;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        const copied = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (!copied) {
          throw new Error('Copy command failed');
        }
      } else {
        throw new Error('Clipboard unavailable');
      }

      setReferralMsg({ type: 'success', text: type === 'member' ? 'Signup referral link copied.' : 'Shopping referral link copied.' });
    } catch {
      setReferralMsg({ type: 'error', text: 'Failed to copy referral link.' });
    }
  };

  const handleShareReferralLink = async (type: 'member' | 'shopping') => {
    const link = type === 'member' ? memberReferralLink : shoppingReferralLink;
    if (!link) {
      setReferralMsg({ type: 'error', text: 'Referral link is unavailable. Set your username first.' });
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: type === 'member' ? 'Join AF Home' : 'Shop with my AF Home referral link',
          text: type === 'member'
            ? 'Register using my affiliate referral link.'
            : 'Use my shopping referral link so your checkout already carries my affiliate code.',
          url: link,
        });
        return;
      } catch {
        // no-op; fallback to copy
      }
    }

    await handleCopyReferralLink(type);
  };

  const toggleTreeNode = (id: number) => {
    setExpandedTreeNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatJoinedAt = (value?: string) => {
    if (!value) return 'Joined date unavailable';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Joined date unavailable';
    return `Joined ${date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const collectTreeNodeIds = (nodes: ReferralTreeNode[]): number[] => {
    const ids: number[] = [];
    nodes.forEach((node) => {
      ids.push(node.id);
      if ((node.children?.length ?? 0) > 0) {
        ids.push(...collectTreeNodeIds(node.children ?? []));
      }
    });
    return ids;
  };

  const hasTreeFilters = treeSearchQuery.trim() !== '' || treeStatusFilter !== 'all';

  const filteredReferralChildren = useMemo(() => {
    const sourceNodes = referralChildren;
    const normalizedSearch = treeSearchQuery.trim().toLowerCase();

    const matchesNode = (node: ReferralTreeNode) => {
      const statusMatch = treeStatusFilter === 'all' || node.verification_status === treeStatusFilter;
      if (!statusMatch) return false;
      if (!normalizedSearch) return true;
      const haystack = `${node.name} ${node.username} ${node.email}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    };

    const filterNodes = (nodes: ReferralTreeNode[]): ReferralTreeNode[] => {
      return nodes.reduce<ReferralTreeNode[]>((acc, node) => {
        const filteredChildren = filterNodes(node.children ?? []);
        const selfMatch = matchesNode(node);
        if (!selfMatch && filteredChildren.length === 0) return acc;

        acc.push({
          ...node,
          children: filteredChildren,
          children_count: filteredChildren.length,
        });
        return acc;
      }, []);
    };

    return filterNodes(sourceNodes);
  }, [referralChildren, treeSearchQuery, treeStatusFilter]);

  const handleExpandAllTreeNodes = () => {
    const allIds = collectTreeNodeIds(filteredReferralChildren);
    if (!allIds.length) return;
    const next: Record<number, boolean> = {};
    allIds.forEach((id) => {
      next[id] = true;
    });
    setExpandedTreeNodes(next);
  };

  const handleCollapseAllTreeNodes = () => {
    setExpandedTreeNodes({});
  };

  const renderReferralNode = (node: ReferralTreeNode, level = 0): React.ReactNode => {
    const children = node.children ?? [];
    const hasChildren = children.length > 0;
    const nodePv = node.total_pv ?? node.total_earnings ?? 0;
    const isExpanded = hasTreeFilters ? true : (expandedTreeNodes[node.id] ?? level < 1);
    const levelClass = level === 0 ? 'border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-800' : 'border-purple-100 dark:border-purple-800 bg-slate-50/60 dark:bg-gray-800/60';
    const nameClass = level === 0 ? 'text-slate-800 dark:text-gray-200' : 'text-slate-700 dark:text-gray-300';

    return (
      <div key={`${node.id}-${level}`} className="relative">
        {level > 0 && <span className="pointer-events-none absolute -left-3 top-5 h-px w-3 bg-purple-200" />}
        <div className={`rounded-xl border px-3 py-2.5 ${levelClass}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={`text-xs font-semibold truncate ${nameClass}`}>
                {node.name}
                {node.username ? ` (@${node.username})` : ''}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5 truncate">{node.email || 'No email'}</p>
              <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">{formatJoinedAt(node.joined_at)}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${verificationBadgeClass(node.verification_status)}`}>
                {node.verification_status}
              </span>
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => toggleTreeNode(node.id)}
                  className="inline-flex items-center justify-center h-6 w-6 rounded-md border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                  aria-label={isExpanded ? 'Collapse referral node' : 'Expand referral node'}
                >
                  <Icon.ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 text-[10px]">
            <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 font-semibold text-indigo-700">
              PV {Number(nodePv).toLocaleString()}
            </span>
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600">
              {node.children_count ?? children.length} downline
            </span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="relative mt-2 ml-3 space-y-2 border-l border-purple-200 pl-3">
            {children.map((child) => renderReferralNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const verificationColor = (status?: string) => {
    if (status === 'verified') return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400' };
    if (status === 'pending_review') return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-400' };
    if (status === 'blocked') return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-400' };
    return { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', dot: 'bg-slate-400' };
  };

  const getNodeInitials = (name: string) =>
    name.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('');

  const renderReferralNodeFull = (node: ReferralTreeNode, level = 0): React.ReactNode => {
    const children = node.children ?? [];
    const hasChildren = children.length > 0;
    const nodePv = node.total_pv ?? node.total_earnings ?? 0;
    const isExpanded = hasTreeFilters ? true : (expandedTreeNodes[node.id] ?? level < 1);
    const vc = verificationColor(node.verification_status);
    const nodeInitials = getNodeInitials(node.name || 'AF');
    const avatarUrl = node.avatar_url?.trim();
    const avatarGradients = [
      'from-violet-500 to-purple-600',
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-rose-500 to-pink-600',
    ];
    const avatarGradient = avatarGradients[level % avatarGradients.length];

    const statusLabel =
      node.verification_status === 'pending_review' ? 'Pending'
      : node.verification_status === 'not_verified' ? 'Unverified'
      : node.verification_status === 'verified' ? 'Verified'
      : node.verification_status === 'blocked' ? 'Blocked'
      : 'Unverified';

    return (
      <div key={`full-${node.id}-${level}`} className="relative">
        {level > 0 && (
          <span className="pointer-events-none absolute -left-4 top-7 h-px w-4 bg-purple-200" />
        )}
        <div className={`group rounded-2xl border transition-all duration-200 hover:shadow-md ${level === 0 ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 shadow-sm' : 'border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-gray-800/70'}`}>
          <div className="flex items-center gap-3 p-3.5">
            {/* Avatar */}
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={node.name ? `${node.name} profile photo` : 'Referral profile photo'}
                  className="h-11 w-11 rounded-2xl object-cover shadow-sm"
                />
              ) : (
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-bold text-sm text-white bg-gradient-to-br ${avatarGradient} shadow-sm`}>
                  {nodeInitials}
                </div>
              )}
              <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${vc.dot}`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                    <p className="text-sm font-bold text-slate-800 dark:text-gray-200 truncate">{node.name || 'Unknown'}</p>
                    {node.username && (
                      <span className="text-[11px] text-slate-400 dark:text-gray-500 font-medium shrink-0">@{node.username}</span>
                    )}
                    {level > 0 && (
                      <span className="text-[10px] font-bold text-purple-500 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-full shrink-0">L{level + 1}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-gray-500 truncate mt-0.5">{node.email || 'No email'}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${vc.bg} ${vc.text} ${vc.border}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${vc.dot}`} />
                    {statusLabel}
                  </span>
                  {hasChildren && (
                    <button
                      type="button"
                      onClick={() => toggleTreeNode(node.id)}
                      className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-slate-400 dark:text-gray-500 hover:text-purple-500 dark:hover:text-purple-400 flex items-center justify-center transition-colors"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      <Icon.ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-sky-50 border border-sky-100 text-[11px] font-bold text-sky-700">
                  PV {Number(nodePv).toLocaleString()}
                </span>
                {(node.children_count ?? children.length) > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 border border-purple-100 text-[11px] font-semibold text-purple-600">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    {node.children_count ?? children.length} downline
                  </span>
                )}
                {node.joined_at && (
                  <span className="text-[11px] text-slate-400">
                    {new Date(node.joined_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="relative mt-1.5 ml-6 space-y-1.5 border-l-2 border-purple-100 pl-4 pt-1">
            {children.map((child) => renderReferralNodeFull(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        middle_name: form.middle_name.trim() || undefined,
        birth_date: form.birth_date.trim() || undefined,
        gender: form.gender || undefined,
        occupation: form.occupation.trim() || undefined,
        work_location: form.work_location || undefined,
        country: form.country.trim() || undefined,
      }).unwrap();
      profileDraftDirtyRef.current = false;
      setProfileMsg({ type: 'success', text: 'Profile updated successfully. Your complete information was saved.' });
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      setProfileMsg({ type: 'error', text: apiError?.data?.message || 'Failed to update profile.' });
    }
  };

  const handleOpenAddressModal = () => {
    setProfileMsg(null);
    phAddress.reset();
    setIsAddressModalOpen(true);
  };

  const handleCloseAddressModal = () => {
    phAddress.reset();
    setIsAddressModalOpen(false);
  };

  const handleSaveAddress = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    try {
      await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        middle_name: form.middle_name.trim() || undefined,
        birth_date: form.birth_date.trim() || undefined,
        gender: form.gender || undefined,
        occupation: form.occupation.trim() || undefined,
        work_location: form.work_location || undefined,
        country: form.country.trim() || undefined,
        address: addressForm.address.trim() || undefined,
        barangay: phAddress.address.barangay || undefined,
        city: phAddress.address.city || undefined,
        province: phAddress.noProvince ? (phAddress.address.region || undefined) : (phAddress.address.province || undefined),
        region: phAddress.address.region || undefined,
        zip_code: addressForm.zipCode.trim() || undefined,
      }).unwrap();

      profileDraftDirtyRef.current = false;
      setProfileMsg({ type: 'success', text: 'Address updated successfully. Your profile information was saved too.' });
      phAddress.reset();
      setIsAddressModalOpen(false);
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      setProfileMsg({ type: 'error', text: apiError?.data?.message || 'Failed to update address.' });
    }
  };

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileMsg(null);
    const localPreviewUrl = URL.createObjectURL(file);
    setAvatarPreviewUrl((current) => {
      if (current?.startsWith('blob:')) {
        URL.revokeObjectURL(current);
      }
      return localPreviewUrl;
    });
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadResult = await uploadAvatar(formData).unwrap();

      setAvatarPreviewUrl((current) => {
        if (current?.startsWith('blob:')) {
          URL.revokeObjectURL(current);
        }
        return uploadResult.avatar_url || null;
      });
      await Promise.allSettled([
        refetchMe(),
        refetchAccountSnapshot(),
        refetchReferralTree(),
      ]);
      profileDraftDirtyRef.current = false;
      setProfileMsg({ type: 'success', text: uploadResult.message || 'Profile photo updated successfully.' });
    } catch (err: unknown) {
      setAvatarPreviewUrl((current) => {
        if (current?.startsWith('blob:')) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
      const error = err as { message?: string; data?: { message?: string; errors?: Record<string, string[]> } };
      const firstValidation = error?.data?.errors ? Object.values(error.data.errors)[0]?.[0] : undefined;
      setProfileMsg({
        type: 'error',
        text: firstValidation || error?.data?.message || error?.message || 'Failed to upload profile photo.',
      });
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);
    if (!security.currentPassword) return setPwError('Please enter your current password.');
    if (security.newPassword.length < 8) return setPwError('New password must be at least 8 characters.');
    if (!/[A-Z]/.test(security.newPassword) || !/[a-z]/.test(security.newPassword) || !/[0-9]/.test(security.newPassword) || !/[^A-Za-z0-9]/.test(security.newPassword)) {
      return setPwError('New password must include uppercase, lowercase, number, and special character.');
    }
    if (security.newPassword !== security.confirmPassword) return setPwError('Passwords do not match.');

    try {
      await changePassword({
        current_password: security.currentPassword,
        new_password: security.newPassword,
        new_password_confirmation: security.confirmPassword,
      }).unwrap();

      await updateSession?.({ passwordChangeRequired: false });
      setPwSuccess(true);
      setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });

      if (passwordChangeRequired || passwordChangeRequiredFromQuery) {
        setTimeout(() => {
          setPwSuccess(false);
          router.replace('/shop');
        }, 1200);
        return;
      }

      setTimeout(() => setPwSuccess(false), 5000);
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string; errors?: Record<string, string[]> } };
      const firstFieldError = Object.values(apiError?.data?.errors ?? {})[0]?.[0];
      setPwError(firstFieldError || apiError?.data?.message || 'Failed to update password.');
    }
  };

  const latestUsernameRequest = usernameChangeLatest?.request ?? null;
  const hasPendingUsernameRequest = isUsernamePendingLocal || latestUsernameRequest?.status === 'pending_review';
  const pendingRequestedUsername = latestUsernameRequest?.requested_username || usernameRequest.trim();

  const handleSendUsernameOtp = async () => {
    setUsernameMsg(null);
    const nextUsername = usernameRequest.replace(/\s+/g, '').trim();
    if (nextUsername !== usernameRequest) {
      setUsernameRequest(nextUsername);
    }
    if (!nextUsername) {
      setUsernameMsg({ type: 'error', text: 'Username is required.' });
      return;
    }
    if (!/^[A-Za-z0-9]+$/.test(nextUsername)) {
      setUsernameMsg({ type: 'error', text: 'Username must contain letters and numbers only.' });
      return;
    }
    if (containsBlockedWord(nextUsername)) {
      setUsernameMsg({ type: 'error', text: 'Please choose a different username.' });
      return;
    }

    if (nextUsername === (profileData?.username ?? '').trim()) {
      setUsernameMsg({ type: 'error', text: 'This is already your current username.' });
      return;
    }

    try {
      const response = await sendUsernameChangeOtp({ username: nextUsername }).unwrap();
      setUsernameOtpToken(response.verification_token);
      setUsernameOtpSentTo(response.email);
      setUsernameOtp('');
      setUsernameMsg({ type: 'success', text: 'We sent a 4-digit OTP to your email. Enter it below to submit your request.' });
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      setUsernameMsg({ type: 'error', text: apiError?.data?.message || 'Failed to send OTP.' });
    }
  };

  const handleSubmitUsernameChange = async (e: FormEvent) => {
    e.preventDefault();
    setUsernameMsg(null);
    if (!usernameOtpToken) {
      setUsernameMsg({ type: 'error', text: 'Please request an OTP first.' });
      return;
    }
    if (usernameOtp.trim().length !== 4) {
      setUsernameMsg({ type: 'error', text: 'Enter the 4-digit OTP from your email.' });
      return;
    }

    try {
      await submitUsernameChangeRequest({
        verification_token: usernameOtpToken,
        otp: usernameOtp.trim(),
      }).unwrap();
      setUsernameMsg({ type: 'success', text: 'Request submitted. Please wait for admin approval.' });
      setUsernameOtpToken(null);
      setUsernameOtp('');
      setUsernameOtpSentTo(null);
      setIsUsernamePendingLocal(true);
      setUsernameRequest((prev) => prev.trim());
      refetchUsernameChangeLatest();
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      setUsernameMsg({ type: 'error', text: apiError?.data?.message || 'Failed to submit request.' });
    }
  };

  const accountStats = [
    { label: 'Orders', value: String(accountSnapshot?.orders?.total ?? 0), Icon: Icon.Package, onClick: () => router.push('/orders') },
    { label: 'Wishlist', value: String(accountSnapshot?.wishlist?.total_items ?? 0), Icon: Icon.Heart, onClick: () => router.push('/wishlist') },
    { label: 'Reviews', value: String(accountSnapshot?.reviews?.total ?? 0), Icon: Icon.Activity, onClick: () => {} },
    { label: 'Loyalty', value: loyaltyTier, Icon: Icon.Shield, onClick: () => {} },
  ];

  const addresses = useMemo(() => {
    const fullAddress = [
      profileData?.address,
      profileData?.barangay,
      profileData?.city,
      profileData?.province,
      profileData?.region,
      profileData?.zip_code,
    ]
      .filter(Boolean)
      .join(', ');

    if (!fullAddress) return [];

    return [
      {
        id: 'default',
        label: 'Default Shipping',
        recipient: form.name || 'AF Home User',
        phone: form.phone || 'No phone provided',
        full: fullAddress,
        isDefault: true,
      },
    ];
  }, [profileData?.address, profileData?.barangay, profileData?.city, profileData?.province, profileData?.region, profileData?.zip_code, form.name, form.phone]);

  const formatRelativeTime = (value?: string | null) => {
    if (!value) return 'Unknown time';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown time';
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const recentActivity = (activityData?.items ?? []).map((item) => ({
    title: item.title || 'Account activity',
    time: formatRelativeTime(item.created_at ?? null),
    rawTime: item.created_at ?? null,
  }));

  const sessionItems = sessionsData?.items ?? [];
  const activityTotalPages = Math.max(1, Math.ceil(recentActivity.length / ACTIVITY_PAGE_SIZE));
  const sessionTotalPages = Math.max(1, Math.ceil(sessionItems.length / ACTIVITY_PAGE_SIZE));
  const paginatedRecentActivity = recentActivity.slice(
    (activityPage - 1) * ACTIVITY_PAGE_SIZE,
    activityPage * ACTIVITY_PAGE_SIZE
  );
  const paginatedSessionItems = sessionItems.slice(
    (sessionPage - 1) * ACTIVITY_PAGE_SIZE,
    sessionPage * ACTIVITY_PAGE_SIZE
  );

  useEffect(() => {
    setActivityPage((prev) => Math.min(prev, activityTotalPages));
  }, [activityTotalPages]);

  useEffect(() => {
    setSessionPage((prev) => Math.min(prev, sessionTotalPages));
  }, [sessionTotalPages]);

  const TABS: { key: Tab; label: string; Icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement }[] = [
    { key: 'profile', label: 'Profile', Icon: Icon.User },
    { key: 'security', label: 'Security', Icon: Icon.Shield },
    { key: 'preferences', label: 'Preferences', Icon: Icon.Bell },
    { key: 'wallet', label: 'Wallet', Icon: Icon.Wallet },
    { key: 'pv', label: 'AF Voucher', Icon: Icon.Star },
    { key: 'encashment', label: 'Encashment', Icon: Icon.Bag },
    { key: 'interior-requests', label: 'Interior Requests', Icon: Icon.Package },
    { key: 'activity', label: 'Activity', Icon: Icon.Activity },
    { key: 'change-username', label: 'Change Username', Icon: Icon.Edit },
    { key: 'referrals', label: 'Referrals', Icon: Icon.Network },
    { key: 'levels', label: 'My Level', Icon: Icon.Trophy },
  ];

  const initials = (form.name || session?.user?.name || 'A')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  const pwStrength = getPasswordStrength(security.newPassword);
  const activeTabLabel = TABS.find((item) => item.key === activeTab)?.label ?? 'Profile';

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1280);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isMobile && mobilePanelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, mobilePanelOpen]);

  const tabMotionProps = {
    initial: { opacity: 0, x: slideDir.current * 48 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, transition: { duration: 0.1 } },
    transition: { duration: 0.22, ease: 'easeOut' as const },
  };

  const handleMobileBack = () => {
    setMobilePanelOpen(false);
  };

  const handleTabChange = (tab: Tab, options?: { focus?: string }) => {
    const currentIndex = TABS.findIndex((t) => t.key === activeTab);
    const nextIndex = TABS.findIndex((t) => t.key === tab);
    slideDir.current = nextIndex >= currentIndex ? 1 : -1;
    setActiveTab(tab);
    if (isMobile) setMobilePanelOpen(true);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('tab', tab);
    if (options?.focus) {
      nextParams.set('focus', options.focus);
    } else {
      nextParams.delete('focus');
    }
    router.replace(`/profile?${nextParams.toString()}${options?.focus ? '#verification-form' : ''}`, { scroll: false });
  };

  const dismissLevelUpCelebration = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('celebrate');
    nextParams.delete('rank');
    router.replace(`/profile${nextParams.toString() ? `?${nextParams.toString()}` : ''}`, { scroll: false });
  }, [router, searchParams]);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/');
  };

  const handleRevokeSession = async (tokenId: number, isCurrent: boolean) => {
    if (!tokenId) return;
    setRevokingTokenId(tokenId);
    try {
      const result = await revokeMemberSession(tokenId).unwrap();
      if (isCurrent || result.is_current) {
        await signOut({ callbackUrl: '/login' });
        return;
      }
      setProfileMsg({ type: 'success', text: 'Device signed out successfully.' });
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      setProfileMsg({ type: 'error', text: apiError?.data?.message || 'Failed to sign out this device.' });
    } finally {
      setRevokingTokenId(null);
    }
  };

  const resolveCustomerAccessToken = useCallback(async (): Promise<string> => {
    if (accessToken) return accessToken;

    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });
      const sessionPayload = await response.json().catch(() => null);
      const token = String((sessionPayload?.user as { accessToken?: string } | undefined)?.accessToken ?? '');
      return token;
    } catch {
      return '';
    }
  }, [accessToken]);

  const loadPasskeys = useCallback(async () => {
    if (!isCustomerSession) return;
    if (!apiBaseUrl) {
      setPasskeyError('API URL is not configured for passkeys.');
      return;
    }

    const token = await resolveCustomerAccessToken();
    if (!token) {
      setPasskeyError('Your session token is missing. Please sign in again.');
      return;
    }

    setIsLoadingPasskeys(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/passkeys`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(String(payload?.message || 'Failed to load passkeys.'));
      }
      const rows = Array.isArray(payload?.passkeys) ? payload.passkeys : [];
      setPasskeys(rows);
    } catch (err: unknown) {
      setPasskeys([]);
      setPasskeyError(err instanceof Error ? err.message : 'Failed to load passkeys.');
    } finally {
      setIsLoadingPasskeys(false);
    }
  }, [apiBaseUrl, isCustomerSession, resolveCustomerAccessToken, setPasskeyError]);

  const handleRegisterPasskey = async () => {
    if (!isCustomerSession) {
      setPasskeyError('You need to be signed in to add a passkey.');
      return;
    }
    if (!apiBaseUrl) {
      setPasskeyError('API URL is not configured for passkeys.');
      return;
    }
    const token = await resolveCustomerAccessToken();
    if (!token) {
      setPasskeyError('Your session token is missing. Please sign in again.');
      return;
    }
    if (!passkeySupported) {
      setPasskeyError('Passkeys are not supported on this browser/device.');
      return;
    }
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setPasskeyError('Passkeys require a secure context (HTTPS or localhost).');
      return;
    }

    setIsRegisteringPasskey(true);
    try {
      const startResponse = await fetch(`${apiBaseUrl}/api/auth/passkeys/register/options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: passkeyName.trim() || undefined,
        }),
      });
      const startPayload = await startResponse.json().catch(() => null);
      if (!startResponse.ok) {
        throw new Error(String(startPayload?.message || 'Failed to start passkey registration.'));
      }

      const publicKey = startPayload?.public_key;
      if (!publicKey?.challenge || !publicKey?.user?.id || !publicKey?.rp?.id || !publicKey?.rp?.name) {
        throw new Error('Invalid passkey options from server.');
      }

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: base64UrlToUint8Array(String(publicKey.challenge)),
          rp: {
            id: String(publicKey.rp.id),
            name: String(publicKey.rp.name),
          },
          user: {
            id: base64UrlToUint8Array(String(publicKey.user.id)),
            name: String(publicKey.user.name),
            displayName: String(publicKey.user.displayName),
          },
          pubKeyCredParams: Array.isArray(publicKey.pubKeyCredParams) ? publicKey.pubKeyCredParams : [],
          timeout: Number(publicKey.timeout ?? 60000),
          attestation: 'none',
          authenticatorSelection: publicKey.authenticatorSelection ?? undefined,
          excludeCredentials: Array.isArray(publicKey.excludeCredentials)
            ? (publicKey.excludeCredentials as PasskeyCredentialDescriptor[]).map((item) => ({
                type: 'public-key',
                id: base64UrlToUint8Array(String(item?.id ?? '')),
                transports: Array.isArray(item?.transports) ? item.transports : undefined,
              }))
            : undefined,
        },
      });

      if (!credential || !(credential instanceof PublicKeyCredential)) {
        throw new Error('No passkey credential returned by device.');
      }

      const attestationResponse = credential.response as AuthenticatorAttestationResponse & {
        getPublicKey?: () => ArrayBuffer | null;
        getPublicKeyAlgorithm?: () => number;
        getTransports?: () => string[];
      };
      const publicKeyBuffer = attestationResponse.getPublicKey ? attestationResponse.getPublicKey() : null;
      if (!publicKeyBuffer) {
        throw new Error('This browser does not expose passkey public key bytes. Try latest Chrome/Safari/Edge.');
      }

      const verifyResponse = await fetch(`${apiBaseUrl}/api/auth/passkeys/register/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          challenge_token: String(startPayload.challenge_token || ''),
          name: passkeyName.trim() || undefined,
          credential: {
            id: credential.id,
            rawId: uint8ArrayToBase64Url(credential.rawId),
            type: credential.type,
            response: {
              clientDataJSON: uint8ArrayToBase64Url(attestationResponse.clientDataJSON),
              attestationObject: uint8ArrayToBase64Url(attestationResponse.attestationObject),
              publicKey: uint8ArrayToBase64Url(publicKeyBuffer),
              publicKeyAlgorithm: typeof attestationResponse.getPublicKeyAlgorithm === 'function'
                ? attestationResponse.getPublicKeyAlgorithm()
                : undefined,
              transports: typeof attestationResponse.getTransports === 'function'
                ? attestationResponse.getTransports()
                : undefined,
            },
          },
        }),
      });
      const verifyPayload = await verifyResponse.json().catch(() => null);
      if (!verifyResponse.ok) {
        const errorMessage = String(
          verifyPayload?.message
          || verifyPayload?.errors?.credential?.[0]
          || verifyPayload?.errors?.challenge_token?.[0]
          || 'Failed to register passkey.',
        );
        throw new Error(errorMessage);
      }

      setPasskeyName('');
      setPasskeySuccess(String(verifyPayload?.message || 'Passkey added successfully.'));
      await loadPasskeys();
    } catch (err: unknown) {
      const message = err instanceof DOMException
        ? (err.name === 'NotAllowedError'
            ? 'Passkey registration was cancelled or timed out.'
            : err.name === 'SecurityError'
              ? 'Passkey is unavailable for this website origin/domain.'
              : 'Passkey registration failed.')
        : (err instanceof Error ? err.message : 'Failed to register passkey.');
      setPasskeyError(message);
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  const handleRemovePasskey = async (id: number) => {
    if (!isCustomerSession) {
      setPasskeyError('You need to be signed in to remove a passkey.');
      return;
    }
    if (!apiBaseUrl) {
      setPasskeyError('API URL is not configured for passkeys.');
      return;
    }
    const token = await resolveCustomerAccessToken();
    if (!token) {
      setPasskeyError('Your session token is missing. Please sign in again.');
      return;
    }
    if (!window.confirm('Remove this passkey from your account?')) return;
    setRemovingPasskeyId(id);
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/passkeys/${id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(String(payload?.message || 'Failed to remove passkey.'));
      }
      setPasskeySuccess(String(payload?.message || 'Passkey removed.'));
      await loadPasskeys();
    } catch (err: unknown) {
      setPasskeyError(err instanceof Error ? err.message : 'Failed to remove passkey.');
    } finally {
      setRemovingPasskeyId(null);
    }
  };

  useEffect(() => {
    if (activeTab !== 'security') return;
    void loadPasskeys();
  }, [activeTab, loadPasskeys]);


  return (
    <>
      <TopBar />
      <Navbar initialCategories={initialCategories} />
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative min-h-screen bg-gray-50 dark:bg-gray-900"
      >
        <div className="container mx-auto px-4 py-8 md:py-10 max-w-[1400px]">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-2">
            <span>Account</span>
            <Icon.ChevronRight className="h-3 w-3" />
            <span className="text-gray-600 dark:text-gray-300 font-medium">Profile</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">My Profile</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your personal information, security, and preferences.</p>
        </div>

        <AnimatePresence initial={false}>
          {isProfileActionPending && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="sticky top-16 z-30 -mx-4 mb-4 border-b border-sky-100 bg-white/95 px-4 py-2 backdrop-blur-sm dark:border-sky-900/40 dark:bg-gray-800/95"
            >
              <div className="mx-auto flex max-w-[1400px] items-center gap-3">
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-sky-100 dark:bg-sky-900/40">
                  <motion.div
                    className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-sky-500"
                    animate={{ x: ['-120%', '320%'] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
                <span className="shrink-0 text-xs font-semibold text-sky-600 dark:text-sky-400">
                  {profileActionStatus}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab navigation bar - mobile: 4x2 grid, desktop: horizontal bar */}
        <div className="sticky top-16 z-20 -mx-4 mb-6 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700">
          {/* Mobile/tablet horizontal scroll (hidden on xl+) */}
          <nav className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:hidden px-3 py-1 gap-1 md:justify-center md:gap-2">
            {(() => {
              const shortLabel: Record<Tab, string> = {
                profile: 'Profile',
                security: 'Security',
                preferences: 'Prefs',
                wallet: 'Wallet',
                pv: 'Voucher',
                encashment: 'Encash',
                'interior-requests': 'Requests',
                activity: 'Activity',
                'change-username': 'Username',
                referrals: 'Referrals',
                levels: 'My Level',
              };
              return TABS.map(({ key, Icon: TabIcon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTabChange(key)}
                  className={`shrink-0 flex flex-col items-center gap-1 rounded-xl border px-3 py-2.5 md:px-6 md:py-3 text-[10px] md:text-xs font-medium transition-colors min-w-[60px] md:min-w-[80px] ${
                    activeTab === key
                      ? 'border-sky-500 dark:border-sky-600 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <TabIcon className={`h-5 w-5 md:h-6 md:w-6 ${activeTab === key ? 'text-sky-500 dark:text-sky-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  {shortLabel[key]}
                </button>
              ));
            })()}
          </nav>

          {/* Desktop horizontal bar (hidden below xl) */}
          <nav className="hidden xl:flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4">
            {TABS.map(({ key, label, Icon: TabIcon }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleTabChange(key)}
                className={`shrink-0 inline-flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === key
                    ? 'border-sky-500 dark:border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <TabIcon className={`h-4 w-4 ${activeTab === key ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400 dark:text-gray-500'}`} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {celebrateLevelUp && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br ${TIER_COVER[celebrateTier].gradient} text-white shadow-xl`}
          >
            <div className="relative p-5 md:p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_30%)]" />
              <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl border border-white/35 bg-white/15 p-2.5 backdrop-blur-sm">
                    <img src={TIER_BADGE_IMAGE[celebrateTier]} alt={celebrateTier} className="h-16 w-16 object-contain drop-shadow-lg" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/80">New Level</p>
                    <h3 className="mt-1 text-2xl font-bold">{celebrateTier}</h3>
                    <p className="mt-2 max-w-2xl text-sm text-white/90">
                      Congratulations! Your account has been upgraded and your new badge is now active.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleTabChange('profile')}
                    className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
                  >
                    View My Badge
                  </button>
                  <button
                    type="button"
                    onClick={dismissLevelUpCelebration}
                    className="rounded-2xl border border-white/35 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="xl:col-span-4 space-y-4">
            {/* Profile Card */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-gray-800 overflow-hidden"
            >
              {/* Cover banner - tier-specific gradient */}
              <div className={`h-36 bg-gradient-to-br ${TIER_COVER[loyaltyTier].gradient} relative overflow-hidden`}>
                {/* Shine overlays */}
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 18% 65%, rgba(255,255,255,0.28) 0%, transparent 55%), radial-gradient(circle at 82% 18%, rgba(255,255,255,0.18) 0%, transparent 50%)' }} />
                {/* Decorative blur circles */}
                <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="absolute -top-6 left-1/3 h-24 w-24 rounded-full bg-white/8 blur-xl pointer-events-none" />
                {/* Badge - top right with glass frame */}
                <div className="absolute top-3 right-3 flex flex-col items-center gap-1.5">
                  <div className="rounded-2xl bg-white/25 backdrop-blur-md p-1.5 border border-white/40 shadow-xl">
                    <img
                      src={TIER_BADGE_IMAGE[loyaltyTier]}
                      alt={loyaltyTier}
                      className="h-16 w-16 object-contain drop-shadow-lg"
                    />
                  </div>
                  <span className="text-[9px] font-bold text-white tracking-widest uppercase bg-black/25 backdrop-blur-sm rounded-full px-2.5 py-0.5 border border-white/20">
                    {loyaltyTier.split(' ')[0]}
                  </span>
                </div>
              </div>

              {/* Avatar - centered, floating over banner */}
              <div className="flex flex-col items-center -mt-12 pb-5 px-5">
                <div className="relative mb-3">
                  {/* Spin ring while uploading */}
                  {isUploadingAvatar && (
                    <span className="pointer-events-none absolute -inset-1.5 rounded-full border-[3px] border-transparent border-t-sky-400 border-r-sky-300 animate-spin z-10" />
                  )}

                  {/* Avatar image or initials */}
                  {effectiveAvatarUrl ? (
                    <button
                      type="button"
                      onClick={() => setIsAvatarPreviewOpen(true)}
                      className="group relative cursor-zoom-in"
                      aria-label="View profile photo"
                    >
                      <img
                        src={effectiveAvatarUrl}
                        alt={form.name || 'Profile photo'}
                        className="h-24 w-24 rounded-full object-cover ring-4 ring-white dark:ring-gray-800 shadow-xl"
                      />
                      <div className="absolute inset-0 rounded-full bg-black/0 transition-colors group-hover:bg-black/30 flex items-center justify-center">
                        <svg className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0zm0 0l2 2" />
                        </svg>
                      </div>
                    </button>
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-sky-400 to-sky-500 text-white text-2xl font-bold flex items-center justify-center ring-4 ring-white dark:ring-gray-800 shadow-xl">
                      {initials}
                    </div>
                  )}

                  {/* Edit badge — always visible, bottom-right */}
                  <label
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-sky-500 hover:bg-sky-600 active:bg-sky-700 border-2 border-white dark:border-gray-800 shadow-md transition-colors z-10"
                    title="Change profile photo"
                    aria-label="Change profile photo"
                  >
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <Icon.Camera className="h-4 w-4 text-white" />
                  </label>
                </div>

                {/* Tier pill */}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${TIER_COVER[loyaltyTier].pill} mb-3`}>
                  <img src={TIER_BADGE_IMAGE[loyaltyTier]} alt={loyaltyTier} className="h-4 w-4 object-contain shrink-0" />
                  <span className="text-[11px] font-bold">{loyaltyTier}</span>
                </div>

                {/* User info - centered */}
                <h2 className="text-lg font-bold text-slate-900 dark:text-white text-center leading-tight">
                  {form.name || 'AF Home User'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 text-center">{form.email}</p>
                {form.username && (
                  <span className="inline-block text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 font-mono font-medium mt-1.5 border border-slate-200 dark:border-slate-700">
                    @{form.username}
                  </span>
                )}

                {/* Account stats from snapshot */}
                <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-gray-400">
                  {accountSnapshot?.loyalty?.join_date && (
                    <span>Joined {new Date(accountSnapshot.loyalty.join_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  )}
                  {(accountSnapshot?.loyalty?.referral_count ?? 0) > 0 && (
                    <span>{accountSnapshot?.loyalty?.referral_count ?? 0} referrals</span>
                  )}
                </div>

                {isUploadingAvatar && (
                  <p className="mt-2 text-xs text-sky-500 font-medium animate-pulse">Uploading photo...</p>
                )}
                {effectiveAvatarUrl && !isUploadingAvatar && (
                  <button
                    type="button"
                    onClick={() => setIsAvatarPreviewOpen(true)}
                    className="mt-1.5 text-xs font-semibold text-sky-500 hover:text-sky-600 dark:hover:text-sky-400 hover:underline"
                  >
                    View Photo
                  </button>
                )}

                {/* Profile completion */}
                <div className="mt-4 w-full p-3.5 rounded-xl border border-slate-200 dark:border-sky-800 dark:bg-sky-900/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-gray-400">Profile Completion</span>
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400">{completion}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-sky-100 dark:bg-sky-900/30 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${completion}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400 dark:text-gray-500">
                    {completion >= 100
                      ? 'Fully verified account.'
                      : completion < 60
                      ? 'Fill in your details to unlock all features.'
                      : 'Almost there - just a few fields left.'}
                  </p>
                </div>

                {/* Level Progress Teaser */}
                {(() => {
                  const nextRank  = Math.min(5, effectiveRank + 1);
                  const nextTier  = rankToTier(nextRank);
                  const reqs      = NEXT_TIER_REQUIREMENTS[effectiveRank];
                  const nextCover = TIER_COVER[nextTier];
                  const pvNow     = accountSnapshot?.loyalty?.personal_pv ?? 0;
                  const refsNow   = accountSnapshot?.loyalty?.referral_count ?? 0;
                  const amNow     = accountSnapshot?.loyalty?.active_members_count ?? 0;
                  const abNow     = accountSnapshot?.loyalty?.active_builders_count ?? 0;
                  const alNow     = accountSnapshot?.loyalty?.active_leaders_count ?? 0;

                  const rows = reqs && effectiveRank < 5 ? [
                    { current: pvNow,   target: reqs.pv        },
                    { current: refsNow, target: reqs.referrals },
                    ...(reqs.activeMembers  ? [{ current: amNow, target: reqs.activeMembers  }] : []),
                    ...(reqs.activeBuilders ? [{ current: abNow, target: reqs.activeBuilders }] : []),
                    ...(reqs.activeLeaders  ? [{ current: alNow, target: reqs.activeLeaders  }] : []),
                  ] : [];

                  const overallPct = rows.length > 0
                    ? Math.round(rows.reduce((acc, r) => acc + Math.min(100, r.target > 0 ? (r.current / r.target) * 100 : 100), 0) / rows.length)
                    : 100;

                  const activeCover = effectiveRank >= 5 ? TIER_COVER['Lifestyle Elite'] : nextCover;

                  return (
                    <div className="mt-4 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                      {/* Mini header */}
                      <div className={`bg-gradient-to-r ${activeCover.gradient} px-3.5 py-2 flex items-center gap-2`}>
                        <svg className="h-3 w-3 text-white/90" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                          <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
                        </svg>
                        <span className="text-[11px] font-bold text-white tracking-wide uppercase">Level Progress</span>
                        {effectiveRank >= 5 && (
                          <span className="ml-auto text-[10px] font-black bg-white/25 text-white rounded-full px-2 py-0.5 border border-white/30">MAX</span>
                        )}
                      </div>

                      <div className="p-3.5 bg-white dark:bg-gray-800">
                        {/* Badge comparison */}
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <div className="flex flex-col items-center gap-1">
                            <div className={`rounded-xl bg-gradient-to-br ${TIER_COVER[loyaltyTier].gradient} p-1.5 opacity-70`}>
                              <img src={TIER_BADGE_IMAGE[loyaltyTier]} alt={loyaltyTier} className="h-10 w-10 object-contain" />
                            </div>
                            <p className="text-[9px] text-slate-500 dark:text-gray-400 font-semibold">Rank {effectiveRank}</p>
                          </div>

                          {effectiveRank < 5 && (
                            <>
                              <div
                                className={`h-7 w-7 rounded-full bg-gradient-to-br ${nextCover.gradient} flex items-center justify-center shrink-0 shadow-md`}
                                style={{ boxShadow: `0 3px 10px ${nextCover.glow}` }}
                              >
                                <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                                </svg>
                              </div>
                              <div className="flex flex-col items-center gap-1">
                                <div
                                  className={`rounded-xl bg-gradient-to-br ${nextCover.gradient} p-1.5`}
                                  style={{ boxShadow: `0 4px 12px ${nextCover.glow}` }}
                                >
                                  <img src={TIER_BADGE_IMAGE[nextTier]} alt={nextTier} className="h-10 w-10 object-contain drop-shadow" />
                                </div>
                                <p className="text-[9px] text-slate-500 dark:text-gray-400 font-semibold">Rank {nextRank}</p>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Overall progress bar */}
                        {effectiveRank < 5 && (
                          <>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] font-semibold text-slate-500 dark:text-gray-400">Overall Progress</span>
                              <span className={`text-[11px] font-bold ${overallPct >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-gray-300'}`}>{overallPct}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden mb-3">
                              <motion.div
                                className={`h-full rounded-full ${overallPct >= 100 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : `bg-gradient-to-r ${nextCover.gradient}`}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${overallPct}%` }}
                                transition={{ duration: 0.85, ease: 'easeOut' }}
                              />
                            </div>
                          </>
                        )}

                        {/* View details button */}
                        <button
                          type="button"
                          onClick={() => handleTabChange('levels')}
                          className={`w-full rounded-xl bg-gradient-to-r ${activeCover.gradient} px-3 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5`}
                          style={{ boxShadow: `0 3px 12px ${activeCover.glow}` }}
                        >
                          View My Level Details
                          <svg className="h-3.5 w-3.5 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Referral section */}
              {(
                <div className="px-5 pb-5">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-gray-800 p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center shrink-0">
                          <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                          </svg>
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-gray-300">Affiliate Referral QR</p>
                      </div>
                      <span className="rounded-full bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 px-2.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-400">Ready to Share</span>
                    </div>

                    <div className="space-y-3">
                      <ReferralShareCard
                        title="Invite Members"
                        description="Use this link when someone wants to register as your referral."
                        badge="Signup"
                        link={memberReferralLink}
                        qrUrl={memberReferralQrUrl}
                        onCopy={() => handleCopyReferralLink('member')}
                        onShare={() => handleShareReferralLink('member')}
                        message={referralMsg}
                        emptyText="Set your username first to generate your signup referral link."
                        linkLabel="Member signup link"
                        qrAlt="Signup referral QR code"
                      />
                      <ReferralShareCard
                        title="Share Shopping Link"
                        description="Use this link for non-members who only want to shop. Their checkout will carry your referral automatically."
                        badge="Shopping"
                        link={shoppingReferralLink}
                        qrUrl={shoppingReferralQrUrl}
                        onCopy={() => handleCopyReferralLink('shopping')}
                        onShare={() => handleShareReferralLink('shopping')}
                        message={referralMsg}
                        emptyText="Set your username first to generate your shopping referral link."
                        linkLabel="Shopping referral link"
                        qrAlt="Shopping referral QR code"
                      />
                    </div>

                    {referralMsg && (
                      <p className={`mt-2 text-xs font-medium ${referralMsg.type === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {referralMsg.text}
                      </p>
                    )}

                    {/* Network stats */}
                    <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-3.5">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="text-xs font-bold text-slate-700 dark:text-gray-300">Affiliate Network</p>
                        {!isReferralTreeLoading && (
                          <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-700 px-2 py-0.5 rounded-full">
                            {referralSummary.totalNetwork} members
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-gray-900 px-2 py-2.5 text-center">
                          <p className="text-[10px] text-slate-500 dark:text-gray-400 font-medium mb-0.5">Direct</p>
                          <p className="text-base font-bold text-slate-800 dark:text-gray-200">{referralSummary.directCount}</p>
                        </div>
                        <div className="rounded-xl border border-sky-200 dark:border-sky-800 dark:bg-sky-900/30 px-2 py-2.5 text-center">
                          <p className="text-[10px] text-sky-500 dark:text-sky-400 font-medium mb-0.5">Level 2</p>
                          <p className="text-base font-bold text-sky-700 dark:text-sky-300">{referralSummary.secondLevelCount}</p>
                        </div>
                        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 dark:bg-emerald-900/30 px-2 py-2.5 text-center">
                          <p className="text-[10px] text-emerald-500 dark:text-emerald-400 font-medium mb-0.5">Total</p>
                          <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">{referralSummary.totalNetwork}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTabChange('referrals')}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-3 py-2.5 text-xs font-semibold text-white hover:bg-sky-600 transition-colors shadow-sm"
                      >
                        <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                        View Full Referral Tree
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Account stats */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-gray-800 p-5"
            >
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-3">Account Snapshot</h3>
              <div className="grid grid-cols-2 gap-2">
                {accountStats.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className="group rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-gray-800 hover:border-sky-200 dark:hover:border-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 px-3 py-3 text-left transition-colors"
                  >
                    <item.Icon className="h-4 w-4 text-slate-400 group-hover:text-sky-500 transition-colors" />
                    <p className="text-lg font-bold text-slate-800 dark:text-gray-200 mt-1.5 leading-none">{item.value}</p>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">{item.label}</p>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Quick actions */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-gray-800 p-5"
            >
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-3">Quick Actions</h3>
              <div className="space-y-1.5">
                {[
                  { label: 'View My Orders', Icon: Icon.Bag, href: '/orders' },
                  { label: 'Saved Wishlist', Icon: Icon.Heart, href: '/wishlist' },
                  { label: 'Manage Addresses', Icon: Icon.MapPin, href: '#' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => router.push(item.href)}
                    className="group w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:text-sky-600 dark:hover:text-sky-400 text-sm font-medium text-slate-700 dark:text-gray-300 transition-colors"
                  >
                    <item.Icon className="h-4 w-4 text-slate-400 dark:text-gray-500 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors" />
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </aside>

          {/* --- Main content --- */}
          <motion.div
            ref={mainContentRef}
            className={
              isMobile
                ? 'fixed inset-0 z-[100] flex flex-col bg-white dark:bg-gray-900 overflow-hidden'
                : 'xl:col-span-8 space-y-5'
            }
            initial={false}
            animate={{ x: isMobile && !mobilePanelOpen ? '100%' : 0 }}
            transition={{ type: 'tween', duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Mobile header with back button */}
            {isMobile && (
              <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
                <button
                  type="button"
                  onClick={handleMobileBack}
                  className="flex items-center gap-1.5 rounded-lg p-1 text-sky-600 transition active:bg-sky-50 dark:text-sky-400"
                  aria-label="Back"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 5l-7 7 7 7" />
                  </svg>
                </button>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{activeTabLabel}</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="space-y-5 overflow-x-hidden">
            <AnimatePresence mode="wait">
              {/* --- Profile tab --- */}
              {activeTab === 'profile' && (
                <motion.div key="profile" {...tabMotionProps} className="space-y-5">

                  <div className="rounded-2xl border border-sky-100 bg-sky-50/70 dark:border-sky-900/50 dark:bg-sky-950/20 p-5 md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600 dark:text-sky-400">Profile completion</p>
                        <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">Complete the details below</h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">
                          Fill in the information your account uses for login, contact, and delivery.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-sky-200 bg-white px-4 py-3 text-center dark:border-sky-800 dark:bg-slate-900/60">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-gray-500">Completion</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{completion}%</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {completionItems.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            if (item.label === 'Address') setIsAddressModalOpen(true);
                            if (item.label === 'Username') setActiveTab('change-username');
                            if (item.label === 'Personal Details') {
                              completeInformationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }}
                          className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                            item.done
                              ? 'border-emerald-200 bg-white text-slate-700 dark:border-emerald-900/40 dark:bg-slate-900/60 dark:text-gray-200'
                              : 'border-sky-200 bg-white text-slate-800 hover:border-sky-300 dark:border-sky-900/40 dark:bg-slate-900/60 dark:text-white dark:hover:border-sky-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{item.label}</p>
                              <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">{item.hint}</p>
                            </div>
                            <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                              item.done
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                            }`}>
                              {item.done ? '✓' : '•'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Personal info form */}
                  <form onSubmit={handleSaveProfile} className="rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-gray-800 p-5 md:p-6">
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Personal Information</h3>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Update your name and contact details. Username changes require approval.</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-sky-50 text-sky-600 font-medium border border-sky-100 whitespace-nowrap">
                        Editable
                      </span>
                    </div>

                    <AnimatePresence>
                      {profileMsg && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2 }}
                          className={`mb-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ${
                            profileMsg.type === 'success'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                          }`}
                        >
                          {profileMsg.type === 'success' ? (
                            <Icon.Check className="h-4 w-4 mt-0.5 shrink-0" />
                          ) : (
                            <Icon.Warning className="h-4 w-4 mt-0.5 shrink-0" />
                          )}
                          {profileMsg.text}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { field: 'name' as const, label: 'Full Name', required: true, type: 'text', placeholder: 'Enter your full name', disabled: false },
                        { field: 'username' as const, label: 'Username', type: 'text', placeholder: 'Change in the Username tab', disabled: true },
                        { field: 'email' as const, label: 'Email Address', required: true, type: 'email', placeholder: 'Email', disabled: true, isEmail: true },
                        { field: 'phone' as const, label: 'Phone Number', required: true, type: 'tel', placeholder: '09XXXXXXXXX', disabled: false },
                      ].map(({ field, label, type, placeholder, disabled, isEmail, required }) => (
                        <div key={field} className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                            {label}
                            {required && <span className="text-red-500">*</span>}
                            {isEmail && (
                              profileData?.email_verified
                                ? <span className="normal-case tracking-normal font-semibold text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-full px-1.5 py-0.5 leading-none">&#10003; Verified</span>
                                : <span className="normal-case tracking-normal font-semibold text-[10px] text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 rounded-full px-1.5 py-0.5 leading-none">&#9888; Not Verified</span>
                            )}
                            {disabled && !isEmail && (
                              <span className="normal-case tracking-normal font-normal text-[11px] text-slate-400 dark:text-gray-500 ml-1">(cannot change)</span>
                            )}
                          </label>
                          <input
                            type={type}
                            value={form[field]}
                            onChange={disabled ? undefined : onChange(field)}
                            disabled={disabled}
                            placeholder={placeholder}
                            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800/50 focus:border-sky-300 dark:focus:border-sky-600 ${
                              disabled
                                ? 'border-slate-200 dark:border-slate-700 dark:bg-gray-800 text-slate-400 dark:text-gray-500 cursor-not-allowed'
                                : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-gray-200 dark:bg-gray-900 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          />
                          {field === 'username' && (
                            <p className="text-[11px] text-slate-400 dark:text-gray-500">Go to the Change Username tab to submit a request.</p>
                          )}
                          {field === 'email' && (
                            <p className="text-[11px] text-slate-400 dark:text-gray-500">To link social accounts, go to the Security tab.</p>
                          )}
                        </div>
                      ))}

                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Bio</label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={3}
                          maxLength={200}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-800 dark:text-gray-200 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800/50 focus:border-sky-300 dark:focus:border-sky-600 resize-none"
                          placeholder="Tell us something about your style, home setup, or shopping preferences"
                        />
                        <p className="text-[11px] text-slate-400 dark:text-gray-500 text-right">{bio.length}/200</p>
                      </div>

                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Invited By</label>
                        <div className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-slate-600 dark:text-gray-300 cursor-not-allowed">
                          {profileData?.referrer_id ? (
                            <>
                              {profileData.referrer_name || profileData.referrer_username || '—'}
                              {profileData.referrer_name && profileData.referrer_username && (
                                <span className="text-slate-400 dark:text-gray-500 ml-1.5">(@{profileData.referrer_username})</span>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-500 dark:text-gray-400">
                              Your previous sponsor is no longer available. Please contact support if this needs to be updated.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div ref={completeInformationRef} className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-gray-700/20 p-4 md:p-5">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Complete Information</h4>
                          <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
                            These fields match the older profile layout and help complete your account details.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Middle Name</label>
                          <input
                            type="text"
                            value={form.middle_name}
                            onChange={onOptionalChange('middle_name')}
                            placeholder="Middle name"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-800 dark:text-gray-200 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800/50 focus:border-sky-300 dark:focus:border-sky-600 hover:border-slate-300 dark:hover:border-slate-600"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Birth Date <span className="text-red-500">*</span></label>
                          <input
                            type="date"
                            value={form.birth_date}
                            onChange={onOptionalChange('birth_date')}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-800 dark:text-gray-200 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800/50 focus:border-sky-300 dark:focus:border-sky-600 hover:border-slate-300 dark:hover:border-slate-600"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Gender <span className="text-red-500">*</span></label>
                          <select
                            value={form.gender}
                            onChange={onOptionalChange('gender')}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-800 dark:text-gray-200 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800/50 focus:border-sky-300 dark:focus:border-sky-600 hover:border-slate-300 dark:hover:border-slate-600"
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Occupation <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={form.occupation}
                            onChange={onOptionalChange('occupation')}
                            placeholder="Occupation"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-800 dark:text-gray-200 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800/50 focus:border-sky-300 dark:focus:border-sky-600 hover:border-slate-300 dark:hover:border-slate-600"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Work Location <span className="text-red-500">*</span></label>
                          <select
                            value={form.work_location}
                            onChange={onOptionalChange('work_location')}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-800 dark:text-gray-200 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800/50 focus:border-sky-300 dark:focus:border-sky-600 hover:border-slate-300 dark:hover:border-slate-600"
                          >
                            <option value="local">Local</option>
                            <option value="overseas">Overseas</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Country <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={form.country}
                            onChange={onOptionalChange('country')}
                            disabled={form.work_location === 'local'}
                            placeholder="Country"
                            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800/50 focus:border-sky-300 dark:focus:border-sky-600 ${
                              form.work_location === 'local'
                                ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-800 text-slate-400 dark:text-gray-500 cursor-not-allowed'
                                : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-gray-200 dark:bg-gray-900 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-end gap-3">
                      {hasChanges && (
                        <button
                          type="button"
                          onClick={() => {
                            setForm(buildProfileFormState());
                            profileDraftDirtyRef.current = false;
                          }}
                          className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Discard
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSaving || !hasChanges}
                        className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 dark:hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSaving ? (
                          <>
                            <Loading size={14} className="border border-white/30 border-t-white" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Saved Addresses */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-gray-800 p-5 md:p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Saved Addresses</h3>
                        <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Your shipping and billing locations.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenAddressModal}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-400 dark:text-sky-500 hover:text-sky-300 dark:hover:text-sky-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-sky-500/10 dark:hover:bg-sky-500/20"
                      >
                        {addresses.length ? '+ Edit Address' : '+ Add Address'}
                      </button>
                    </div>

                    {addresses.length ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((addr) => (
                        <div key={addr.id} className="group relative rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-gray-800 hover:border-sky-200 dark:hover:border-sky-600 dark:hover:bg-sky-900/30 p-4 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">{addr.label}</p>
                              {addr.isDefault && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 font-medium">Default</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button type="button" onClick={handleOpenAddressModal} className="p-1 rounded-lg text-slate-400 dark:text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors">
                                <Icon.Edit className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="mt-2.5 text-sm font-semibold text-slate-900 dark:text-white">{addr.recipient}</p>
                          <p className="text-xs text-slate-500 dark:text-gray-400">{addr.phone}</p>
                          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1.5 leading-relaxed">{addr.full}</p>
                        </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-gray-800/70 px-4 py-8 text-center">
                        <p className="text-sm font-semibold text-slate-700 dark:text-gray-300">No saved address yet</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">Add your default shipping address so checkout and verification can be filled faster.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* --- Security tab --- */}
              {activeTab === 'security' && (
                <motion.div key="security" {...tabMotionProps} className="space-y-5">

                  <form onSubmit={handleChangePassword} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-5 md:p-6">
                    <div className="mb-5">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Change Password</h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Use a strong, unique password for your account.</p>
                      {(passwordChangeRequired || passwordChangeRequiredFromQuery) && (
                        <div className="mt-3 rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/30 px-4 py-3 text-sm text-sky-800 dark:text-sky-300">
                          Your account was signed in using a legacy password. Change it now to continue to the shop page.
                        </div>
                      )}
                    </div>

                    <AnimatePresence>
                      {pwError && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800"
                        >
                          <Icon.Warning className="h-4 w-4 shrink-0" />
                          {pwError}
                        </motion.div>
                      )}
                      {pwSuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800"
                        >
                          <Icon.Check className="h-4 w-4 shrink-0" />
                          Password changed successfully.{passwordChangeRequired || passwordChangeRequiredFromQuery ? ' Redirecting you to the shop...' : ''}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Current Password</label>
                        <PasswordInput
                          value={security.currentPassword}
                          onChange={(e) => setSecurity((p) => ({ ...p, currentPassword: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">New Password</label>
                        <PasswordInput
                          value={security.newPassword}
                          onChange={(e) => setSecurity((p) => ({ ...p, newPassword: e.target.value }))}
                          placeholder="Min. 8 characters"
                        />
                        {/* Password strength bar */}
                        {pwStrength && (
                          <div className="mt-2 space-y-1">
                            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-gray-700 overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${pwStrength.color}`}
                                initial={{ width: 0 }}
                                animate={{ width: pwStrength.pct }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-gray-400">
                              Strength: <span className="font-semibold text-slate-700 dark:text-gray-300">{pwStrength.label}</span>
                              {' - '}Use uppercase, numbers &amp; symbols for a stronger password.
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Confirm New Password</label>
                        <PasswordInput
                          value={security.confirmPassword}
                          onChange={(e) => setSecurity((p) => ({ ...p, confirmPassword: e.target.value }))}
                        />
                        {security.confirmPassword && security.newPassword !== security.confirmPassword && (
                          <p className="text-[11px] text-red-500 mt-1">Passwords do not match.</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end">
                      <button
                        type="submit"
                        disabled={!security.currentPassword || !security.newPassword || !security.confirmPassword || isChangingPassword}
                        className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-sky-200"
                      >
                        {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                      </button>
                    </div>
                  </form>

                  {/* 2FA */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-5 md:p-6">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-gray-800 px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center ${prefs.twoFactorEnabled ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-gray-700 text-slate-400 dark:text-gray-500'}`}>
                          <Icon.Shield className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-gray-200">New Device Approval (MFA)</p>
                          <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                            {prefs.twoFactorEnabled
                              ? 'New device logins need email approval: Yes, it is me / No, it is not me.'
                              : 'Require email approval whenever your account signs in from a new device.'}
                          </p>
                          {isUpdatingTwoFactor ? (
                            <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-1">Updating 2FA setting...</p>
                          ) : null}
                        </div>
                      </div>
                      <Toggle checked={prefs.twoFactorEnabled} onChange={handleToggleTwoFactor} disabled={isUpdatingTwoFactor} />
                    </div>
                  </div>

                  {/* Authenticator App (TOTP) */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-5 md:p-6">
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Authenticator App (TOTP)</h3>
                        {/* Info icon inline next to label */}
                        <div className="relative group">
                          <button
                            type="button"
                            aria-label="Learn about TOTP"
                            className="h-5 w-5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-700 flex items-center justify-center text-slate-400 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="16" x2="12" y2="12" />
                              <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                          </button>
                          {/* Tooltip panel */}
                          <div className="pointer-events-none absolute left-0 top-7 z-50 w-72 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 shadow-xl shadow-slate-200/60 dark:shadow-black/40 px-4 py-4 space-y-3">
                              <p className="text-xs font-semibold text-sky-700 dark:text-sky-400">What is a TOTP / Authenticator App?</p>
                              <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
                                A <span className="font-medium text-slate-700 dark:text-gray-300">Time-based One-Time Password (TOTP)</span> is a 6-digit code your app generates every 30 seconds. Because it changes constantly, it cannot be reused or stolen.
                              </p>
                              <div>
                                <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 mb-1.5">Why is it better than SMS?</p>
                                <ul className="text-xs text-slate-600 dark:text-gray-400 space-y-1.5 leading-relaxed">
                                  <li className="flex gap-2"><span className="text-emerald-500 shrink-0">✓</span><span><span className="font-medium text-slate-700 dark:text-gray-300">Works offline</span> — no signal needed.</span></li>
                                  <li className="flex gap-2"><span className="text-emerald-500 shrink-0">✓</span><span><span className="font-medium text-slate-700 dark:text-gray-300">SIM-swap proof</span> — can&apos;t be hijacked via your phone number.</span></li>
                                  <li className="flex gap-2"><span className="text-emerald-500 shrink-0">✓</span><span><span className="font-medium text-slate-700 dark:text-gray-300">No interception</span> — codes never travel over the network.</span></li>
                                  <li className="flex gap-2"><span className="text-emerald-500 shrink-0">✓</span><span><span className="font-medium text-slate-700 dark:text-gray-300">Expires in 30 s</span> — useless moments after it&apos;s seen.</span></li>
                                </ul>
                              </div>
                              <p className="text-[11px] text-slate-400 dark:text-gray-500">Apps: Google Authenticator · Authy · Microsoft Authenticator · 1Password</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                        Use Google Authenticator, Authy, or any TOTP-compatible app to generate sign-in codes.
                      </p>
                    </div>

                    <AnimatePresence mode="wait">
                      {totpError && (
                        <motion.div
                          key="totp-error"
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800"
                        >
                          <Icon.Warning className="h-4 w-4 shrink-0" />
                          {totpError}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {totpStep === 'idle' && !totpEnabled && (
                      <button
                        type="button"
                        onClick={handleInitiateTotpSetup}
                        disabled={totpLoading}
                        className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-sky-200"
                      >
                        {totpLoading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Setting up...
                          </>
                        ) : 'Set Up Authenticator App'}
                      </button>
                    )}


                    {totpStep === 'idle' && totpEnabled && (
                      <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                            <Icon.Shield className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Authenticator App Active</p>
                            <p className="text-xs text-slate-500 dark:text-gray-400">Your account is protected with TOTP codes.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setTotpStep('confirm-disable'); setTotpCode(''); setTotpError(null); }}
                          className="flex-shrink-0 text-xs font-semibold text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {totpStep === 'confirm-disable' && (
                      <motion.div
                        key="totp-disable"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Enter 6-digit code to confirm</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={totpCode}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setTotpCode(v);
                              setTotpError(null);
                            }}
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800/50 focus:border-red-300 dark:focus:border-red-600 transition-colors font-mono tracking-widest"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleDisableTotp}
                            disabled={totpLoading || totpCode.length !== 6}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {totpLoading ? (
                              <>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Removing...
                              </>
                            ) : 'Confirm Remove'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setTotpStep('idle'); setTotpCode(''); setTotpError(null); }}
                            disabled={totpLoading}
                            className="text-sm font-medium text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* TOTP Setup Modal — fixed to top of viewport */}
                  <AnimatePresence>
                    {totpModalOpen && totpSetupData && (
                      <>
                        <motion.div
                          key="totp-modal-backdrop"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm"
                          onClick={() => { if (!totpLoading) { setTotpModalOpen(false); setTotpSetupData(null); setTotpCode(''); setTotpError(null); } }}
                        />
                        <motion.div
                          key="totp-modal-panel"
                          initial={{ opacity: 0, y: -32 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -32 }}
                          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                          className="fixed inset-x-0 top-0 z-[301] mx-auto w-full max-w-lg overflow-y-auto max-h-[92vh] bg-white dark:bg-gray-800 rounded-b-2xl shadow-2xl shadow-slate-900/20"
                        >
                          {/* Modal header */}
                          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-5 py-4">
                            <div>
                              <h3 className="text-base font-bold text-slate-900 dark:text-white">Set Up Authenticator App</h3>
                              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Follow the steps below to link your app.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { if (!totpLoading) { setTotpModalOpen(false); setTotpSetupData(null); setTotpCode(''); setTotpError(null); } }}
                              disabled={totpLoading}
                              className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>

                          {/* Modal body */}
                          <div className="px-5 py-5 space-y-6">
                            {/* Error */}
                            <AnimatePresence>
                              {totpError && (
                                <motion.div
                                  key="totp-modal-error"
                                  initial={{ opacity: 0, y: -6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -6 }}
                                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800"
                                >
                                  <Icon.Warning className="h-4 w-4 shrink-0" />
                                  {totpError}
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Step 1 */}
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Step 1 — Install an authenticator app</p>
                              <p className="text-xs text-slate-500 dark:text-gray-400">Download any of these free apps:</p>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { name: 'Google Authenticator', android: 'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2', ios: 'https://apps.apple.com/app/google-authenticator/id388497605' },
                                  { name: 'Authy', android: 'https://play.google.com/store/apps/details?id=com.authy.authy', ios: 'https://apps.apple.com/app/authy/id494168017' },
                                  { name: 'Microsoft Authenticator', android: 'https://play.google.com/store/apps/details?id=com.azure.authenticator', ios: 'https://apps.apple.com/app/microsoft-authenticator/id983156458' },
                                ].map((app) => (
                                  <div key={app.name} className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-900 px-3 py-1.5">
                                    <span className="text-xs font-medium text-slate-700 dark:text-gray-300">{app.name}</span>
                                    <a href={app.android} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 hover:underline">Android</a>
                                    <span className="text-slate-300 dark:text-slate-600 text-[10px]">·</span>
                                    <a href={app.ios} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 hover:underline">iOS</a>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Step 2 */}
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Step 2 — Scan the QR code</p>
                              <p className="text-xs text-slate-500 dark:text-gray-400">Open your authenticator app and scan the QR code to link your account.</p>
                              <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-4 w-fit">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={totpSetupData.qr_code_url} alt="TOTP QR Code" className="h-40 w-40 object-contain" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Or enter this key manually</label>
                                <div className="flex items-center gap-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-900 px-3.5 py-2.5">
                                  <code className="flex-1 text-sm font-mono text-slate-800 dark:text-gray-200 tracking-widest break-all select-all">{totpSetupData.secret}</code>
                                </div>
                              </div>
                            </div>

                            {/* Step 3 */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Step 3 — Enter the 6-digit code</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={totpCode}
                                onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setTotpCode(v); setTotpError(null); }}
                                placeholder="Enter 6-digit code"
                                maxLength={6}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800/50 focus:border-sky-300 dark:focus:border-sky-600 transition-colors font-mono tracking-widest"
                              />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 pb-1">
                              <button
                                type="button"
                                onClick={handleVerifyTotp}
                                disabled={totpLoading || totpCode.length !== 6}
                                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-sky-200"
                              >
                                {totpLoading ? (
                                  <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Verifying...
                                  </>
                                ) : 'Verify & Enable'}
                              </button>
                              <button
                                type="button"
                                onClick={() => { if (!totpLoading) { setTotpModalOpen(false); setTotpSetupData(null); setTotpCode(''); setTotpError(null); } }}
                                disabled={totpLoading}
                                className="text-sm font-medium text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>

                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-5 md:p-6">
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Passkeys</h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                        Add a passkey to sign in with Face ID, fingerprint, or device PIN.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        value={passkeyName}
                        onChange={(event) => setPasskeyName(event.target.value)}
                        placeholder="Passkey name (optional, e.g. My iPhone)"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800/50 focus:border-sky-300 dark:focus:border-sky-600"
                      />
                      <button
                        type="button"
                        onClick={handleRegisterPasskey}
                        disabled={isRegisteringPasskey}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isRegisteringPasskey ? 'Adding...' : 'Add Passkey'}
                      </button>
                    </div>
                    {!passkeySupported ? (
                      <p className="mt-2 text-xs text-slate-500 dark:text-gray-400">Passkeys are not supported in this browser.</p>
                    ) : null}

                    <div className="mt-4 space-y-2">
                      {isLoadingPasskeys ? (
                        <p className="text-sm text-slate-500 dark:text-gray-400">Loading passkeys...</p>
                      ) : passkeys.length > 0 ? (
                        passkeys.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-800 px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 dark:text-gray-200 truncate">{item.name || 'My Passkey'}</p>
                              <p className="text-xs text-slate-500 dark:text-gray-400 truncate">
                                Last used: {item.last_used_at ? formatRelativeTime(item.last_used_at) : 'Never'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePasskey(item.id)}
                              disabled={removingPasskeyId === item.id}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-600 dark:hover:bg-red-700 hover:text-white transition-colors disabled:opacity-50"
                            >
                              {removingPasskeyId === item.id ? 'Removing...' : 'Remove'}
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-gray-400">No passkeys registered yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Connected Accounts */}
                  {isCustomerSession && (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-5 md:p-6">
                      <div className="mb-4">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Connected Accounts</h3>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Link social accounts to sign in without a password.</p>
                      </div>

                      <div className="space-y-3">
                        {/* Google */}
                        {isGoogleLinked ? (
                          <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
                            <div className="flex items-center gap-3">
                              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                              <div>
                                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Google Connected</p>
                                <p className="text-xs text-slate-500 dark:text-gray-400">You can sign in with your Google account.</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleUnlinkGoogle}
                              disabled={isUnlinkingGoogle}
                              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50 shrink-0"
                            >
                              {isUnlinkingGoogle && (
                                <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                </svg>
                              )}
                              {isUnlinkingGoogle ? 'Unlinking...' : 'Unlink'}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleConnectGoogle}
                            disabled={isLinkingGoogle || googleLinkSuccess}
                            className={`flex items-center justify-center gap-2 w-full rounded-xl border px-4 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                              googleLinkSuccess
                                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-50'
                            }`}
                          >
                            {isLinkingGoogle ? (
                              <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                              </svg>
                            ) : googleLinkSuccess ? (
                              <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                            )}
                            {isLinkingGoogle ? 'Connecting...' : googleLinkSuccess ? 'Google linked successfully!' : 'Link with Google'}
                          </button>
                        )}

                        {/* Facebook */}
                        {isFacebookLinked ? (
                          <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
                            <div className="flex items-center gap-3">
                              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="#1877F2">
                                <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                              </svg>
                              <div>
                                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Facebook Connected</p>
                                <p className="text-xs text-slate-500 dark:text-gray-400">You can sign in with your Facebook account.</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleUnlinkFacebook}
                              disabled={isUnlinkingFacebook}
                              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50 shrink-0"
                            >
                              {isUnlinkingFacebook && (
                                <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                </svg>
                              )}
                              {isUnlinkingFacebook ? 'Unlinking...' : 'Unlink'}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleConnectFacebook}
                            disabled={isLinkingFacebook || facebookLinkSuccess}
                            className={`flex items-center justify-center gap-2 w-full rounded-xl border px-4 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                              facebookLinkSuccess
                                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-50'
                            }`}
                          >
                            {isLinkingFacebook ? (
                              <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                              </svg>
                            ) : facebookLinkSuccess ? (
                              <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="#1877F2">
                                <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                              </svg>
                            )}
                            {isLinkingFacebook ? 'Connecting...' : facebookLinkSuccess ? 'Facebook linked successfully!' : 'Link with Facebook'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Danger zone */}
                  <div className="rounded-2xl border border-red-100 dark:border-red-900/30 bg-white dark:bg-gray-800 p-5 md:p-6">
                    <h3 className="text-base font-bold text-red-600 dark:text-red-400 mb-1 flex items-center gap-2">
                      <Icon.Warning className="h-4 w-4" />
                      Danger Zone
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mb-4">These actions are irreversible. Please be certain before proceeding.</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-700 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-gray-200">Sign Out</p>
                          <p className="text-xs text-slate-500 dark:text-gray-400">Sign out from your account on this device.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              window.sessionStorage.setItem('afhome-skip-login-redirect', '1');
                            }
                            signOut({ callbackUrl: '/login' });
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Icon.LogOut className="h-3.5 w-3.5" />
                          Sign Out
                        </button>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/20 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-red-700 dark:text-red-400">Delete Account</p>
                          <p className="text-xs text-red-400 dark:text-red-500">Permanently remove your account and all data.</p>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-600 dark:hover:bg-red-700 hover:text-white hover:border-red-600 dark:hover:border-red-700 transition-colors"
                        >
                          <Icon.Trash className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* --- Preferences tab --- */}
              {activeTab === 'preferences' && (
                <motion.div key="preferences" {...tabMotionProps} className="space-y-5">

                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-5 md:p-6">
                    <div className="mb-5">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Notifications</h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Choose how you&apos;d like to be updated.</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { key: 'orderUpdates' as const, label: 'Order Status Updates', desc: 'Get notified when your order ships, arrives, or has issues.' },
                        { key: 'marketingEmails' as const, label: 'Marketing Emails', desc: 'Receive newsletters, promotions, and product highlights.' },
                        { key: 'smsUpdates' as const, label: 'SMS Notifications', desc: 'Get text messages for urgent updates and delivery alerts.' },
                        { key: 'pushNotifications' as const, label: 'Push Notifications', desc: 'Browser notifications for real-time activity.' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-800 px-4 py-3">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800 dark:text-gray-200">{item.label}</p>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                          </div>
                          <Toggle checked={prefs[item.key]} onChange={() => togglePref(item.key)} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-5 md:p-6">
                    <div className="mb-5">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Display & Regional</h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Customize your language and currency experience.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Language</label>
                        <select
                          value={prefs.language}
                          onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value as 'en' | 'fil' }))}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800/50 focus:border-sky-300 dark:focus:border-sky-600"
                        >
                          <option value="en">English</option>
                          <option value="fil">Filipino</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Currency</label>
                        <select
                          value={prefs.currency}
                          onChange={(e) => setPrefs((p) => ({ ...p, currency: e.target.value as 'PHP' | 'USD' }))}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800/50 focus:border-sky-300 dark:focus:border-sky-600"
                        >
                          <option value="PHP">Philippine Peso (PHP)</option>
                          <option value="USD">$ US Dollar (USD)</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 dark:hover:bg-sky-700 transition-colors shadow-sm shadow-sky-200 dark:shadow-sky-900/30"
                      >
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* --- Activity tab --- */}
              {activeTab === 'wallet' && (
                <motion.div
                  key="wallet"
                  {...tabMotionProps}
                >
                  <WalletTab isVerified={isVerified} />
                </motion.div>
              )}

              {activeTab === 'pv' && (
                <motion.div
                  key="pv"
                  {...tabMotionProps}
                >
                  <WalletTab isVerified={isVerified} initialWalletType="pv" />
                </motion.div>
              )}

              {activeTab === 'encashment' && (
                <motion.div
                  key="encashment"
                  {...tabMotionProps}
                >
                  <EncashmentTab />
                </motion.div>
              )}

              {activeTab === 'interior-requests' && (
                <motion.div
                  key="interior-requests"
                  {...tabMotionProps}
                >
                  <InteriorRequestsTab />
                </motion.div>
              )}

              {activeTab === 'referrals' && (
                <motion.div
                  key="referrals"
                  {...tabMotionProps}
                  className="space-y-5"
                >
                  {/* Header card */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-5 md:p-6">
                    <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Referral Network</h3>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Your affiliate tree, referral link, and commission overview.</p>
                      </div>
                      {isVerified && (
                        <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 font-semibold whitespace-nowrap">
                          &#10003; Verified Affiliate
                        </span>
                      )}
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                      {[
                        { label: 'Direct Referrals', value: referralSummary.directCount, border: 'border-sky-200 dark:border-sky-800', text: 'text-sky-600 dark:text-sky-400', dbg: 'dark:bg-sky-900/30', val: 'text-sky-800 dark:text-sky-300' },
                        { label: 'Level 2', value: referralSummary.secondLevelCount, border: 'border-sky-200 dark:border-sky-800', text: 'text-sky-600 dark:text-sky-400', dbg: 'dark:bg-sky-900/30', val: 'text-sky-800 dark:text-sky-300' },
                        { label: 'Total Network', value: referralSummary.totalNetwork, border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-600 dark:text-emerald-400', dbg: 'dark:bg-emerald-900/30', val: 'text-emerald-800 dark:text-emerald-300' },
                        { label: 'Total PV Earned', value: referralSummary.totalPv, border: 'border-sky-200 dark:border-sky-800', text: 'text-sky-600 dark:text-sky-400', dbg: 'dark:bg-sky-900/30', val: 'text-sky-800 dark:text-sky-300' },
                      ].map((stat) => (
                        <div key={stat.label} className={`rounded-xl border ${stat.border} ${stat.dbg} px-4 py-3`}>
                          <p className={`text-[11px] font-medium ${stat.text} mb-1`}>{stat.label}</p>
                          <p className={`text-xl font-bold ${stat.val}`}>{stat.value.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-4 mb-5 lg:grid-cols-2">
                      <ReferralShareCard
                        title="Invite Members"
                        description="Best for people who want to sign up under your network."
                        badge="Signup"
                        link={memberReferralLink}
                        qrUrl={memberReferralQrUrl}
                        onCopy={() => handleCopyReferralLink('member')}
                        onShare={() => handleShareReferralLink('member')}
                        message={referralMsg}
                        emptyText="Set your username first to generate your signup referral link."
                        linkLabel="Member signup link"
                        qrAlt="Signup referral QR"
                        compact
                      />
                      <ReferralShareCard
                        title="Share Shopping Link"
                        description="Best for buyers who want a smoother checkout with your referral already attached."
                        badge="Shopping"
                        link={shoppingReferralLink}
                        qrUrl={shoppingReferralQrUrl}
                        onCopy={() => handleCopyReferralLink('shopping')}
                        onShare={() => handleShareReferralLink('shopping')}
                        message={referralMsg}
                        emptyText="Set your username first to generate your shopping referral link."
                        linkLabel="Shopping referral link"
                        qrAlt="Shopping referral QR"
                        compact
                      />
                    </div>

                    {/* Search + filter + controls */}
                    {isReferralTreeLoading ? (
                      <div className="space-y-3 animate-pulse">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-gray-700" />
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col sm:flex-row gap-2 mb-3">
                          <div className="relative flex-1">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            <input
                              type="text"
                              value={treeSearchQuery}
                              onChange={(e) => { setTreeSearchQuery(e.target.value); setReferralPage(1); }}
                              placeholder="Search name, username, email..."
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2c5f4f]/20 dark:focus:ring-[#2c5f4f]/30 focus:border-[#2c5f4f]/40 dark:focus:border-[#2c5f4f]/60 dark:bg-gray-900 dark:text-gray-200 placeholder-slate-400 dark:placeholder-gray-500"
                            />
                          </div>
                          <select
                            value={treeStatusFilter}
                            onChange={(e) => { setTreeStatusFilter(e.target.value as TreeStatusFilter); setReferralPage(1); }}
                            className="rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-gray-900 px-3 py-2.5 text-sm text-slate-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2c5f4f]/20 dark:focus:ring-[#2c5f4f]/30 focus:border-[#2c5f4f]/40 dark:focus:border-[#2c5f4f]/60"
                          >
                            <option value="all">All Status</option>
                            <option value="verified">Verified</option>
                            <option value="pending_review">Pending Review</option>
                            <option value="not_verified">Not Verified</option>
                            <option value="blocked">Blocked</option>
                          </select>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleExpandAllTreeNodes}
                              className="flex-1 sm:flex-none rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm font-semibold text-slate-600 dark:text-gray-300 hover:border-sky-300 hover:text-sky-600 dark:hover:bg-gray-700 transition-colors"
                            >
                              Expand All
                            </button>
                            <button
                              type="button"
                              onClick={handleCollapseAllTreeNodes}
                              className="flex-1 sm:flex-none rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm font-semibold text-slate-600 dark:text-gray-300 hover:border-sky-300 hover:text-sky-600 dark:hover:bg-gray-700 transition-colors"
                            >
                              Collapse
                            </button>
                          </div>
                        </div>

                        {(() => {
                          const totalPages = Math.ceil(filteredReferralChildren.length / REFERRAL_PAGE_SIZE);
                          const pageStart = (referralPage - 1) * REFERRAL_PAGE_SIZE;
                          const pageEnd = pageStart + REFERRAL_PAGE_SIZE;
                          const pageItems = filteredReferralChildren.slice(pageStart, pageEnd);
                          return (
                            <>
                              <div className="flex items-center justify-between mb-4">
                                <p className="text-xs text-slate-500 dark:text-gray-400">
                                  {filteredReferralChildren.length > 0
                                    ? <>Showing <span className="font-semibold text-slate-700 dark:text-gray-300">{pageStart + 1}-{Math.min(pageEnd, filteredReferralChildren.length)}</span> of <span className="font-semibold text-slate-700 dark:text-gray-300">{filteredReferralChildren.length}</span> referral{filteredReferralChildren.length !== 1 ? 's' : ''}</>
                                    : 'No referrals found'
                                  }
                                </p>
                                {(treeSearchQuery || treeStatusFilter !== 'all') && (
                                  <button type="button" onClick={() => { setTreeSearchQuery(''); setTreeStatusFilter('all'); setReferralPage(1); }} className="text-xs text-[#2c5f4f] hover:text-[#234d40] font-medium">
                                    Clear filters
                                  </button>
                                )}
                              </div>

                              {pageItems.length > 0 ? (
                                <>
                                  <div className="space-y-2">
                                    {pageItems.map((node) => renderReferralNodeFull(node))}
                                  </div>

                                  {totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                      <button
                                        type="button"
                                        disabled={referralPage <= 1}
                                        onClick={() => setReferralPage((p) => Math.max(1, p - 1))}
                                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:border-[#2c5f4f]/40 hover:text-[#2c5f4f] dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                      >
                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
                                        Prev
                                      </button>
                                      <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">
                                        Page <span className="text-slate-800 dark:text-gray-300 font-bold">{referralPage}</span> / {totalPages}
                                      </p>
                                      <button
                                        type="button"
                                        disabled={referralPage >= totalPages}
                                        onClick={() => setReferralPage((p) => Math.min(totalPages, p + 1))}
                                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:border-[#2c5f4f]/40 hover:text-[#2c5f4f] dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                      >
                                        Next
                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
                                      </button>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="py-12 text-center">
                                  <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                                    <Icon.Network className="h-6 w-6 text-slate-400 dark:text-gray-500" />
                                  </div>
                                  <p className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                                    {referralChildren.length > 0 ? 'No matches found' : 'No referrals yet'}
                                  </p>
                                  <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
                                    {referralChildren.length > 0 ? 'Try a different search or filter' : 'Share your referral link to start building your network'}
                                  </p>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'activity' && (
                <motion.div key="activity" {...tabMotionProps} className="space-y-5">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-5 md:p-6">
                    <div className="mb-5">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Activity</h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">A log of your recent account actions.</p>
                    </div>
                    <div className="space-y-2">
                      {isActivityLoading ? (
                        <div className="space-y-2 animate-pulse">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-gray-700" />
                          ))}
                        </div>
                      ) : recentActivity.length > 0 ? (
                        paginatedRecentActivity.map((item, i) => (
                          <motion.div
                            key={`${item.title}-${(activityPage - 1) * ACTIVITY_PAGE_SIZE + i}`}
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            custom={i}
                            className="flex items-start gap-3.5 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-800/50 px-4 py-3.5 hover:border-slate-200 dark:hover:border-slate-600 transition-colors"
                          >
                            <div className="mt-0.5 h-7 w-7 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-500 dark:text-sky-400 flex items-center justify-center shrink-0">
                              {getActivityIcon(item.title)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-gray-200 truncate">{item.title}</p>
                              <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">{item.time}</p>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-gray-400">No recent activity yet.</p>
                      )}
                    </div>
                    {recentActivity.length > ACTIVITY_PAGE_SIZE && (
                      <div className="mt-4 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          disabled={activityPage <= 1}
                          onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:border-[#2c5f4f]/40 hover:text-[#2c5f4f] dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
                          Prev
                        </button>
                        <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">
                          Page <span className="text-slate-800 dark:text-gray-300 font-bold">{activityPage}</span> / {activityTotalPages}
                        </p>
                        <button
                          type="button"
                          disabled={activityPage >= activityTotalPages}
                          onClick={() => setActivityPage((p) => Math.min(activityTotalPages, p + 1))}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:border-[#2c5f4f]/40 hover:text-[#2c5f4f] dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Next
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Login sessions */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-5 md:p-6">
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Sessions</h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Devices currently logged into your account.</p>
                    </div>
                    <div className="space-y-2">
                      {isSessionsLoading ? (
                        <div className="space-y-2 animate-pulse">
                          {[1, 2].map((i) => (
                            <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-gray-700" />
                          ))}
                        </div>
                      ) : sessionItems.length > 0 ? (
                        paginatedSessionItems.map((session) => (
                          <div key={session.id} className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-gray-800 px-4 py-3.5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${session.is_current ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-sky-100 dark:bg-sky-900/30 text-sky-500 dark:text-sky-400'}`}>
                                <Icon.Shield className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 dark:text-gray-200 truncate">
                                  {session.is_current ? 'Current Device' : session.device}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-gray-400 truncate">
                                  {session.platform} - {session.browser} - {session.location}
                                </p>
                                <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-0.5">
                                  Last active: {formatRelativeTime(session.last_active_at ?? session.created_at ?? null)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {session.is_current ? (
                                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-700 px-2 py-1 rounded-full whitespace-nowrap">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                                  Active now
                                </span>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => handleRevokeSession(session.token_id, session.is_current)}
                                disabled={isRevokingSession && revokingTokenId === session.token_id}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-600 dark:hover:bg-red-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Icon.LogOut className="h-3.5 w-3.5" />
                                {isRevokingSession && revokingTokenId === session.token_id ? 'Signing out...' : 'Sign out'}
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-gray-400">No active sessions found.</p>
                      )}
                    </div>
                    {sessionItems.length > ACTIVITY_PAGE_SIZE && (
                      <div className="mt-4 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          disabled={sessionPage <= 1}
                          onClick={() => setSessionPage((p) => Math.max(1, p - 1))}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:border-[#2c5f4f]/40 hover:text-[#2c5f4f] dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
                          Prev
                        </button>
                        <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">
                          Page <span className="text-slate-800 dark:text-gray-300 font-bold">{sessionPage}</span> / {sessionTotalPages}
                        </p>
                        <button
                          type="button"
                          disabled={sessionPage >= sessionTotalPages}
                          onClick={() => setSessionPage((p) => Math.min(sessionTotalPages, p + 1))}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:border-[#2c5f4f]/40 hover:text-[#2c5f4f] dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Next
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'change-username' && (
                <motion.div key="change-username" {...tabMotionProps} className="space-y-5">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-5 md:p-6">
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Change Username</h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Update the username used for your profile and referral link.</p>
                    </div>

                    <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-gray-800 px-4 py-3 mb-4">
                      <p className="text-xs text-slate-500 dark:text-gray-400">Current username</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-gray-200 mt-0.5">{profileData?.username ? `@${profileData.username}` : 'Not set'}</p>
                    </div>

                    {usernameMsg && (
                      <div className={`mb-4 rounded-xl px-3.5 py-2.5 text-xs font-semibold ${usernameMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-700' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-700'}`}>
                        {usernameMsg.text}
                      </div>
                    )}

                    {latestUsernameRequest && (
                      <div className="mb-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-gray-700/40 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs text-slate-500 dark:text-gray-400">Latest request</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-gray-200 mt-0.5">
                              @{latestUsernameRequest.requested_username}
                            </p>
                          </div>
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                            latestUsernameRequest.status === 'approved'
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
                              : latestUsernameRequest.status === 'rejected'
                                ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-800'
                                : 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-sky-800'
                          }`}>
                            {latestUsernameRequest.status === 'pending_review' ? 'Pending' : latestUsernameRequest.status}
                          </span>
                        </div>
                        {latestUsernameRequest.review_notes && (
                          <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-2">{latestUsernameRequest.review_notes}</p>
                        )}
                      </div>
                    )}
                    {hasPendingUsernameRequest && (
                      <p className="mb-4 text-xs text-sky-700 dark:text-sky-400">You already have a pending request. Please wait for admin approval before submitting another.</p>
                    )}

                    <form onSubmit={handleSubmitUsernameChange} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">New Username</label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-400 dark:text-gray-500">@</span>
                          <input
                            type="text"
                            value={hasPendingUsernameRequest ? pendingRequestedUsername : usernameRequest}
                            onChange={(e) => {
                              const normalizedUsername = e.target.value.replace(/[^A-Za-z0-9]/g, '');
                              setUsernameRequest(normalizedUsername);
                              if (usernameOtpToken) {
                                setUsernameOtpToken(null);
                                setUsernameOtp('');
                              }
                            }}
                            placeholder="your.username"
                            disabled={hasPendingUsernameRequest}
                            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300 ${
                              hasPendingUsernameRequest
                                ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-700/40 text-slate-400 dark:text-gray-500 cursor-not-allowed'
                                : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white bg-white dark:bg-gray-900'
                            }`}
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-gray-500">Letters only (A-Z). Changing your username will update your referral link after approval.</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={handleSendUsernameOtp}
                          disabled={hasPendingUsernameRequest || isSendingUsernameOtp}
                          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 dark:bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 dark:hover:bg-sky-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isSendingUsernameOtp ? (
                            <>
                              <Loading size={14} className="border border-white/30 border-t-white" />
                              Sending OTP...
                            </>
                          ) : (
                            <>
                              <Icon.Edit className="h-4 w-4" />
                              Send OTP
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUsernameRequest(profileData?.username ?? '');
                            setUsernameOtp('');
                            setUsernameOtpToken(null);
                            setUsernameOtpSentTo(null);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-gray-700 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          Reset
                        </button>
                      </div>

                      {usernameOtpToken && !hasPendingUsernameRequest && (
                        <div className="rounded-xl border border-sky-100 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-900/20 px-4 py-3 space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">Enter OTP</p>
                            <p className="text-[11px] text-sky-600 dark:text-sky-400">
                              {usernameOtpSentTo ? `We sent the code to ${usernameOtpSentTo}.` : 'Check your email for the 4-digit code.'}
                            </p>
                          </div>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={4}
                            value={usernameOtp}
                            onChange={(e) => setUsernameOtp(e.target.value.replace(/\\D/g, ''))}
                            className="w-full rounded-xl border border-sky-200 dark:border-sky-800 dark:bg-gray-900 dark:text-white bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/50 focus:border-sky-300"
                            placeholder="4-digit code"
                          />
                          <button
                            type="submit"
                            disabled={isSubmittingUsernameChange}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {isSubmittingUsernameChange ? (
                              <>
                                <Loading size={14} className="border border-white/30 border-t-white" />
                                Submitting...
                              </>
                            ) : (
                              'Submit Request'
                            )}
                          </button>
                        </div>
                      )}
                    </form>
                  </div>
                </motion.div>
              )}

              {activeTab === 'levels' && (
                <motion.div
                  key="levels"
                  {...tabMotionProps}
                >
                  <LevelsTab
                    effectiveRank={effectiveRank}
                    loyaltyTier={loyaltyTier}
                    snapshot={accountSnapshot}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            </div>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isAddressModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md p-4"
            onClick={handleCloseAddressModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              className="mx-auto mt-8 max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-500">Address</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">Add or Update Address</h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseAddressModal}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Street / House No. <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={addressForm.address}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-800 dark:text-gray-200 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800/50 focus:border-sky-300 dark:focus:border-sky-600"
                    placeholder="House no., street, building, unit"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Region <span className="text-red-500">*</span></label>
                    <select
                      value={phAddress.regionCode}
                      onChange={(e) => {
                        const option = e.target.options[e.target.selectedIndex];
                        phAddress.setRegion(e.target.value, option.text);
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-800 dark:text-gray-200 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800/50 focus:border-sky-300 dark:focus:border-sky-600 disabled:bg-slate-50 dark:disabled:bg-gray-800 disabled:text-slate-400 dark:disabled:text-gray-500"
                    >
                      <option value="">Select Region</option>
                      {phAddress.regions.map((region) => (
                        <option key={region.code} value={region.code}>{region.name}</option>
                      ))}
                    </select>
                  </div>

                  {!phAddress.noProvince ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Province <span className="text-red-500">*</span></label>
                      <select
                        value={phAddress.provinceCode}
                        disabled={!phAddress.regionCode || phAddress.loadingProvinces}
                        onChange={(e) => {
                          const option = e.target.options[e.target.selectedIndex];
                          phAddress.setProvince(e.target.value, option.text);
                        }}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <option value="">{phAddress.loadingProvinces ? 'Loading provinces...' : 'Select Province'}</option>
                        {phAddress.provinces.map((province) => (
                          <option key={province.code} value={province.code}>{province.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Province <span className="text-red-500">*</span></label>
                      <input
                        value={phAddress.address.region}
                        disabled
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-400 dark:text-gray-500 dark:bg-gray-800"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">City / Municipality <span className="text-red-500">*</span></label>
                    <select
                      value={phAddress.cityCode}
                      disabled={phAddress.noProvince ? !phAddress.regionCode : (!phAddress.provinceCode || phAddress.loadingCities)}
                      onChange={(e) => {
                        const option = e.target.options[e.target.selectedIndex];
                        phAddress.setCity(e.target.value, option.text);
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">{phAddress.loadingCities || phAddress.loadingProvinces ? 'Loading cities...' : 'Select City / Municipality'}</option>
                      {phAddress.cities.map((city) => (
                        <option key={city.code} value={city.code}>{city.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Barangay <span className="text-red-500">*</span></label>
                    <select
                      value={phAddress.address.barangay}
                      disabled={!phAddress.cityCode || phAddress.loadingBarangays}
                      onChange={(e) => phAddress.setBarangay(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">{phAddress.loadingBarangays ? 'Loading barangays...' : 'Select Barangay'}</option>
                      {phAddress.barangays.map((barangay) => (
                        <option key={barangay.code} value={barangay.name}>{barangay.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">ZIP Code <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={addressForm.zipCode}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, zipCode: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-800 dark:text-gray-200 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800/50 focus:border-sky-300 dark:focus:border-sky-600 disabled:bg-slate-50 dark:disabled:bg-gray-800 disabled:text-slate-400 dark:disabled:text-gray-500"
                      placeholder="ZIP Code"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseAddressModal}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}


        {isAvatarPreviewOpen && effectiveAvatarUrl && (
          <motion.div
            key="avatar-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md"
            onClick={() => { setIsAvatarPreviewOpen(false); setAvatarZoom(1); }}
          >
            <motion.div
              initial={{ scale: 0.82, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.82, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="relative flex flex-col items-center gap-3"
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => {
                setAvatarZoom((prev) => Math.min(4, Math.max(1, prev - e.deltaY * 0.003)));
              }}
            >
              <img
                src={effectiveAvatarUrl}
                alt={form.name || 'Profile photo'}
                draggable={false}
                onClick={() => setAvatarZoom((prev) => (prev >= 2.5 ? 1 : prev + 0.5))}
                style={{ transform: `scale(${avatarZoom})`, transition: 'transform 0.22s cubic-bezier(0.32,0.72,0,1)' }}
                className="max-h-[72vh] max-w-[80vw] rounded-2xl object-contain shadow-2xl cursor-zoom-in select-none"
              />

              <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setAvatarZoom((prev) => Math.max(1, prev - 0.5))}
                  className="text-white/70 hover:text-white transition-colors text-lg font-bold leading-none"
                  aria-label="Zoom out"
                >−</button>
                <span className="min-w-[3rem] text-center text-sm font-semibold text-white">
                  {Math.round(avatarZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setAvatarZoom((prev) => Math.min(4, prev + 0.5))}
                  className="text-white/70 hover:text-white transition-colors text-lg font-bold leading-none"
                  aria-label="Zoom in"
                >+</button>
                {avatarZoom > 1 && (
                  <button
                    type="button"
                    onClick={() => setAvatarZoom(1)}
                    className="ml-1 text-xs text-white/50 hover:text-white/90 transition-colors"
                  >Reset</button>
                )}
              </div>
            </motion.div>

            <button
              type="button"
              onClick={() => { setIsAvatarPreviewOpen(false); setAvatarZoom(1); }}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/40 select-none">
              Scroll or click to zoom · Click outside to close
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
    <Footer />
    </>
  );
};

export default ProfilePage;

