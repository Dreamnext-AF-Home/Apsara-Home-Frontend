'use client';

import { MeResponse, ReferralTreeNode, useChangePasswordMutation, useMeQuery, useReferralTreeQuery, useUpdateProfileMutation, useSendUsernameChangeOtpMutation, useSubmitUsernameChangeRequestMutation, useUsernameChangeLatestQuery } from '@/store/api/userApi';
import { signOut, useSession } from 'next-auth/react';
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Loading from '../Loading';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { MemberTier } from '@/types/members/types';

const TIER_BADGE_IMAGE: Record<MemberTier, string> = {
  'Home Starter': '/Badge/homeStarter.png',
  'Home Builder': '/Badge/homeBuilder.png',
  'Home Stylist': '/Badge/homeStylist.png',
  'Lifestyle Consultant': '/Badge/lifestyleConsultant.png',
  'Lifestyle Elite': '/Badge/lifestyleElite.png',
};

const TIER_COVER: Record<MemberTier, { gradient: string; glow: string; pill: string }> = {
  'Home Starter':         { gradient: 'from-orange-400 to-amber-500',           glow: 'rgba(251,146,60,0.5)',   pill: 'bg-white/80 text-orange-700 border-orange-200' },
  'Home Builder':         { gradient: 'from-emerald-400 to-teal-500',           glow: 'rgba(52,211,153,0.5)',   pill: 'bg-white/80 text-emerald-700 border-emerald-200' },
  'Home Stylist':         { gradient: 'from-sky-400 to-blue-500',               glow: 'rgba(56,189,248,0.5)',   pill: 'bg-white/80 text-sky-700 border-sky-200' },
  'Lifestyle Consultant': { gradient: 'from-violet-500 to-purple-600',          glow: 'rgba(167,139,250,0.5)',  pill: 'bg-white/80 text-violet-700 border-violet-200' },
  'Lifestyle Elite':      { gradient: 'from-amber-400 via-orange-400 to-rose-400', glow: 'rgba(251,191,36,0.6)', pill: 'bg-white/80 text-amber-700 border-amber-300' },
};

const rankToTier = (rank: number): MemberTier => {
  if (rank >= 5) return 'Lifestyle Elite';
  if (rank === 4) return 'Lifestyle Consultant';
  if (rank === 3) return 'Home Stylist';
  if (rank === 2) return 'Home Builder';
  return 'Home Starter';
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
import { usePhAddress } from '@/hooks/usePhAddress';
import { containsBlockedWord } from '@/libs/badWords';


type ProfileFormState = {
  name: string;
  email: string;
  phone: string;
  username: string;
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

type Tab = 'profile' | 'security' | 'preferences' | 'wallet' | 'encashment' | 'interior-requests' | 'activity' | 'change-username' | 'referrals';

type AlertMsg = { type: 'success' | 'error'; text: string };
type TreeStatusFilter = 'all' | 'verified' | 'pending_review' | 'not_verified' | 'blocked';

type ProfilePageProps = {
  initialProfile?: MeResponse | null;
};

const QrSkeleton = ({ sizeClass }: { sizeClass: string }) => (
  <div className={`relative overflow-hidden rounded-xl border border-purple-200 bg-white ${sizeClass}`}>
    <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-purple-100 via-white to-indigo-100" />
    <div className="absolute inset-[18%] rounded-lg border border-dashed border-purple-200/80" />
    <div className="absolute inset-x-[24%] top-[24%] h-2 rounded-full bg-purple-200/70" />
    <div className="absolute inset-x-[18%] top-[40%] h-2 rounded-full bg-purple-100/90" />
    <div className="absolute inset-x-[28%] top-[56%] h-2 rounded-full bg-indigo-100/90" />
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
    ? 'h-24 w-24 rounded-xl border border-orange-200 bg-white p-1.5 shadow-sm'
    : 'h-36 w-36 rounded-xl border border-slate-200 bg-white p-2 shadow-sm';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-slate-700">{title}</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">{description}</p>
        </div>
        <span className="rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-[10px] font-semibold text-sky-700">{badge}</span>
      </div>

      {link ? (
        <>
          <div className={`my-3 flex ${compact ? 'items-start gap-4' : 'justify-center'}`}>
            <div className={`relative ${qrWrapperClass} shrink-0`}>
              {qrStatus !== 'ready' && <QrSkeleton sizeClass={`${qrWrapperClass} ${compact ? 'p-1.5 shadow-sm' : 'p-2'}`} />}
              {qrStatus === 'error' ? (
                <div className={`flex ${qrWrapperClass} items-center justify-center rounded-xl border border-amber-200 bg-amber-50 p-3 text-center shadow-sm`}>
                  <p className={`font-medium leading-snug text-amber-700 ${compact ? 'text-[9px]' : 'text-[11px]'}`}>QR is still loading.</p>
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
                <div className="mb-3 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                  <p className="text-[10px] font-medium text-slate-400 mb-0.5">{linkLabel}</p>
                  <p className="text-[11px] text-slate-600 break-all leading-snug">{link}</p>
                </div>
                {message && (
                  <p className={`mb-2 text-xs font-medium ${message.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
                    {message.text}
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <button type="button" onClick={onCopy} className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                    Copy Link
                  </button>
                  <button type="button" onClick={onShare} className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition-colors shadow-sm">
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
              <div className="mb-3 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                <p className="text-[10px] font-medium text-slate-400 mb-0.5">{linkLabel}</p>
                <p className="text-[11px] text-slate-600 font-medium break-all leading-snug">{link}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={onShare} className="flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-2 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition-colors shadow-sm">
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                  </svg>
                  Share
                </button>
                <button type="button" onClick={onCopy} className="flex items-center justify-center gap-1.5 rounded-xl bg-white border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
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

const ProfilePage = ({ initialProfile = null }: ProfilePageProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update: updateSession } = useSession();
  const { data } = useMeQuery();
  const { data: referralTree, isLoading: isReferralTreeLoading } = useReferralTreeQuery(data?.id, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 15000,
  });
  const { data: usernameChangeLatest, refetch: refetchUsernameChangeLatest } = useUsernameChangeLatestQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [sendUsernameChangeOtp, { isLoading: isSendingUsernameOtp }] = useSendUsernameChangeOtpMutation();
  const [submitUsernameChangeRequest, { isLoading: isSubmittingUsernameChange }] = useSubmitUsernameChangeRequestMutation();

  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const [form, setForm] = useState<ProfileFormState>({ name: '', email: '', phone: '', username: '' });
  const [usernameRequest, setUsernameRequest] = useState('');
  const [usernameOtp, setUsernameOtp] = useState('');
  const [usernameOtpToken, setUsernameOtpToken] = useState<string | null>(null);
  const [usernameOtpSentTo, setUsernameOtpSentTo] = useState<string | null>(null);
  const [isUsernamePendingLocal, setIsUsernamePendingLocal] = useState(false);
  const [bio, setBio] = useState('');

  const [security, setSecurity] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const [prefs, setPrefs] = useState<PreferencesState>({
    marketingEmails: true,
    smsUpdates: false,
    orderUpdates: true,
    pushNotifications: true,
    twoFactorEnabled: false,
    language: 'en',
    currency: 'PHP',
  });

  const [profileMsg, setProfileMsg] = useState<AlertMsg | null>(null);
  const [usernameMsg, setUsernameMsg] = useState<AlertMsg | null>(null);
  const [referralMsg, setReferralMsg] = useState<AlertMsg | null>(null);
  const [expandedTreeNodes, setExpandedTreeNodes] = useState<Record<number, boolean>>({});
  const [treeSearchQuery, setTreeSearchQuery] = useState('');
  const [treeStatusFilter, setTreeStatusFilter] = useState<TreeStatusFilter>('all');
  const [referralPage, setReferralPage] = useState(1);
  const REFERRAL_PAGE_SIZE = 10;
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isMobileReferralTreeOpen, setIsMobileReferralTreeOpen] = useState(false);
  const [isMobileViewOpen, setIsMobileViewOpen] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressFormState>({ address: '', zipCode: '' });
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usernameMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const referralMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mainContentRef = useRef<HTMLDivElement | null>(null);
  const phAddress = usePhAddress();
  const profileData = data ?? initialProfile;

  useEffect(() => {
    if (profileData || session) {
      setForm({
        name: profileData?.name ?? session?.user?.name ?? '',
        email: profileData?.email ?? session?.user?.email ?? '',
        phone: profileData?.phone ?? '',
        username: profileData?.username ?? '',
      });
      setUsernameRequest(profileData?.username ?? '');
    }
  }, [profileData, session]);

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
    const allowedTabs: Tab[] = ['profile', 'security', 'preferences', 'wallet', 'encashment', 'interior-requests', 'activity', 'change-username', 'referrals'];

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
      if (event.key === 'Escape') setIsAvatarPreviewOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isAvatarPreviewOpen]);

  useEffect(() => {
    if (!referralMsg) return;
    if (referralMsgTimer.current) clearTimeout(referralMsgTimer.current);
    referralMsgTimer.current = setTimeout(() => setReferralMsg(null), 3500);
    return () => { if (referralMsgTimer.current) clearTimeout(referralMsgTimer.current); };
  }, [referralMsg]);

  useEffect(() => {
    const directChildren = referralTree?.children ?? [];
    if (!directChildren.length) return;
    const next: Record<number, boolean> = {};
    directChildren.forEach((node) => {
      next[node.id] = true;
    });
    setExpandedTreeNodes(next);
  }, [referralTree?.children]);

  const hasChanges = useMemo(
    () =>
      form.name !== (profileData?.name ?? session?.user?.name ?? '') ||
      form.phone !== (profileData?.phone ?? ''),
    [profileData?.name, profileData?.phone, form.name, form.phone, session?.user?.name],
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
  const verificationBadgeClass = (status?: string) => {
    if (status === 'verified') return 'bg-emerald-100 text-emerald-700';
    if (status === 'pending_review') return 'bg-amber-100 text-amber-700';
    if (status === 'blocked') return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-600';
  };

  const completion = useMemo(() => {
    if (isVerified) return 100;

    const checks = [
      Boolean(form.name.trim()),
      Boolean(form.email.trim()),
      Boolean(form.phone.trim()),
      Boolean(form.username.trim()),
      Boolean(bio.trim()),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [bio, form, isVerified]);

  const onChange = (field: keyof ProfileFormState) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const togglePref = (field: keyof PreferencesState) =>
    setPrefs((prev) => (typeof prev[field] === 'boolean' ? { ...prev, [field]: !prev[field] } : prev));

  const handleCopyReferralLink = async (type: 'member' | 'shopping') => {
    const link = type === 'member' ? memberReferralLink : shoppingReferralLink;
    if (!link) {
      setReferralMsg({ type: 'error', text: 'Referral link is unavailable. Set your username first.' });
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
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
    const sourceNodes = referralTree?.children ?? [];
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
  }, [referralTree?.children, treeSearchQuery, treeStatusFilter]);

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
    const isExpanded = hasTreeFilters ? true : (expandedTreeNodes[node.id] ?? level < 1);
    const levelClass = level === 0 ? 'border-indigo-200 bg-white' : 'border-purple-100 bg-slate-50/60';
    const nameClass = level === 0 ? 'text-slate-800' : 'text-slate-700';

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
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{node.email || 'No email'}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{formatJoinedAt(node.joined_at)}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${verificationBadgeClass(node.verification_status)}`}>
                {node.verification_status}
              </span>
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => toggleTreeNode(node.id)}
                  className="inline-flex items-center justify-center h-6 w-6 rounded-md border border-purple-200 bg-white text-purple-600 hover:bg-purple-50 transition-colors"
                  aria-label={isExpanded ? 'Collapse referral node' : 'Expand referral node'}
                >
                  <Icon.ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 text-[10px]">
            <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 font-semibold text-indigo-700">
              PV {Number(node.total_earnings ?? 0).toLocaleString()}
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
    if (status === 'pending_review') return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' };
    if (status === 'blocked') return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-400' };
    return { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', dot: 'bg-slate-400' };
  };

  const getNodeInitials = (name: string) =>
    name.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('');

  const renderReferralNodeFull = (node: ReferralTreeNode, level = 0): React.ReactNode => {
    const children = node.children ?? [];
    const hasChildren = children.length > 0;
    const isExpanded = hasTreeFilters ? true : (expandedTreeNodes[node.id] ?? level < 1);
    const vc = verificationColor(node.verification_status);
    const nodeInitials = getNodeInitials(node.name || 'AF');
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
        <div className={`group rounded-2xl border transition-all duration-200 hover:shadow-md ${level === 0 ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-100 bg-slate-50/70'}`}>
          <div className="flex items-center gap-3 p-3.5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-bold text-sm text-white bg-gradient-to-br ${avatarGradient} shadow-sm`}>
                {nodeInitials}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${vc.dot}`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                    <p className="text-sm font-bold text-slate-800 truncate">{node.name || 'Unknown'}</p>
                    {node.username && (
                      <span className="text-[11px] text-slate-400 font-medium shrink-0">@{node.username}</span>
                    )}
                    {level > 0 && (
                      <span className="text-[10px] font-bold text-purple-500 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-full shrink-0">L{level + 1}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{node.email || 'No email'}</p>
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
                      className="h-7 w-7 rounded-lg border border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50 text-slate-400 hover:text-purple-500 flex items-center justify-center transition-colors"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      <Icon.ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 border border-amber-100 text-[11px] font-bold text-amber-700">
                  PV {Number(node.total_earnings ?? 0).toLocaleString()}
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
      }).unwrap();
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
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
        address: addressForm.address.trim() || undefined,
        barangay: phAddress.address.barangay || undefined,
        city: phAddress.address.city || undefined,
        province: phAddress.noProvince ? (phAddress.address.region || undefined) : (phAddress.address.province || undefined),
        region: phAddress.address.region || undefined,
        zip_code: addressForm.zipCode.trim() || undefined,
      }).unwrap();

      setProfileMsg({ type: 'success', text: 'Address updated successfully.' });
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
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'profile');

      const uploadResponse = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadResult = (await uploadResponse.json()) as { url?: string; error?: string };
      if (!uploadResponse.ok || !uploadResult?.url) {
        throw new Error(uploadResult?.error || 'Failed to upload profile photo.');
      }

      await updateProfile({
        name: form.name.trim() || profileData?.name || session?.user?.name || 'AF Home User',
        phone: form.phone.trim() || undefined,
        avatar_url: uploadResult.url,
      }).unwrap();

      setProfileMsg({ type: 'success', text: 'Profile photo updated successfully.' });
    } catch (err: unknown) {
      const error = err as { message?: string; data?: { message?: string } };
      setProfileMsg({
        type: 'error',
        text: error?.data?.message || error?.message || 'Failed to upload profile photo.',
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
    if (!/^[A-Za-z]+$/.test(nextUsername)) {
      setUsernameMsg({ type: 'error', text: 'Username must contain letters only (A–Z).' });
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

  const loyaltyTier: MemberTier = rankToTier(profileData?.rank ?? 0);

  const accountStats = [
    { label: 'Orders', value: '14', Icon: Icon.Package, onClick: () => router.push('/orders') },
    { label: 'Wishlist', value: '27', Icon: Icon.Heart, onClick: () => router.push('/wishlist') },
    { label: 'Reviews', value: '9', Icon: Icon.Activity, onClick: () => {} },
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

  const recentActivity = [
    { title: 'Updated profile details', time: '2 hours ago' },
    { title: 'Placed order #AF-19341', time: 'Yesterday' },
    { title: 'Added 3 items to wishlist', time: '2 days ago' },
    { title: 'Changed account password', time: '1 week ago' },
    { title: 'Added billing address', time: '2 weeks ago' },
  ];

  const TABS: { key: Tab; label: string; Icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement }[] = [
    { key: 'profile', label: 'Profile', Icon: Icon.User },
    { key: 'security', label: 'Security', Icon: Icon.Shield },
    { key: 'preferences', label: 'Preferences', Icon: Icon.Bell },
    { key: 'wallet', label: 'Wallet', Icon: Icon.Wallet },
    { key: 'encashment', label: 'Encashment', Icon: Icon.Bag },
    { key: 'interior-requests', label: 'Interior Requests', Icon: Icon.Package },
    { key: 'activity', label: 'Activity', Icon: Icon.Activity },
    { key: 'change-username', label: 'Change Username', Icon: Icon.Edit },
    { key: 'referrals', label: 'Referrals', Icon: Icon.Network },
  ];

  const initials = (form.name || session?.user?.name || 'A')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  const pwStrength = getPasswordStrength(security.newPassword);
  const activeTabLabel = TABS.find((item) => item.key === activeTab)?.label ?? 'Profile';

  const handleTabChange = (tab: Tab, options?: { focus?: string }) => {
    setActiveTab(tab);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('tab', tab);
    if (options?.focus) {
      nextParams.set('focus', options.focus);
    } else {
      nextParams.delete('focus');
    }
    router.replace(`/profile?${nextParams.toString()}${options?.focus ? '#verification-form' : ''}`, { scroll: false });
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setIsMobileViewOpen(true);
    }
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/');
  };


  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative min-h-screen bg-slate-50"
    >
      <div className="container mx-auto px-4 py-8 md:py-10 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={handleBack}
            className="mb-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
            aria-label="Go back"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
            <span>Account</span>
            <Icon.ChevronRight className="h-3 w-3" />
            <span className="text-slate-600 font-medium">Profile</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">My Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your personal information, security, and preferences.</p>
        </div>

        {/* Tab navigation bar — mobile: 4×2 grid, desktop: horizontal bar */}
        <div className="sticky top-16 z-20 -mx-4 mb-6 bg-white/95 backdrop-blur-sm border-b border-slate-100">
          {/* Mobile/tablet horizontal scroll (hidden on xl+) */}
          <nav className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:hidden px-3 py-1 gap-1 md:justify-center md:gap-2">
            {(() => {
              const shortLabel: Record<Tab, string> = {
                profile: 'Profile',
                security: 'Security',
                preferences: 'Prefs',
                wallet: 'Wallet',
                encashment: 'Encash',
                'interior-requests': 'Requests',
                activity: 'Activity',
                'change-username': 'Username',
                referrals: 'Referrals',
              };
              return TABS.map(({ key, Icon: TabIcon }) => {
                const isProfileHome = key === 'profile';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { if (!isProfileHome) handleTabChange(key); }}
                    disabled={isProfileHome}
                    className={`shrink-0 flex flex-col items-center gap-1 rounded-xl px-3 py-2.5 md:px-6 md:py-3 text-[10px] md:text-xs font-medium transition-colors min-w-[60px] md:min-w-[80px] ${
                      isProfileHome
                        ? 'text-slate-400 cursor-default opacity-50'
                        : activeTab === key
                          ? 'bg-orange-50 text-orange-600'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <TabIcon className={`h-5 w-5 md:h-6 md:w-6 ${activeTab === key && !isProfileHome ? 'text-orange-500' : 'text-slate-400'}`} />
                    {shortLabel[key]}
                  </button>
                );
              });
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
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
                }`}
              >
                <TabIcon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="xl:col-span-4 space-y-4">
            {/* Profile Card */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              {/* Cover banner — tier-specific gradient */}
              <div className={`h-36 bg-gradient-to-br ${TIER_COVER[loyaltyTier].gradient} relative overflow-hidden`}>
                {/* Shine overlays */}
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 18% 65%, rgba(255,255,255,0.28) 0%, transparent 55%), radial-gradient(circle at 82% 18%, rgba(255,255,255,0.18) 0%, transparent 50%)' }} />
                {/* Decorative blur circles */}
                <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="absolute -top-6 left-1/3 h-24 w-24 rounded-full bg-white/8 blur-xl pointer-events-none" />
                {/* Badge — top right with glass frame */}
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

              {/* Avatar — centered, floating over banner */}
              <div className="flex flex-col items-center -mt-12 pb-5 px-5">
                <div className="relative group mb-3">
                  {isUploadingAvatar && (
                    <span className="pointer-events-none absolute -inset-1.5 rounded-full border-[3px] border-transparent border-t-orange-400 border-r-amber-300 animate-spin z-10" />
                  )}
                  {profileData?.avatar_url ? (
                    <img
                      src={profileData.avatar_url}
                      alt={form.name || 'Profile photo'}
                      className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-xl"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 text-white text-2xl font-bold flex items-center justify-center ring-4 ring-white shadow-xl">
                      {initials}
                    </div>
                  )}
                  <label
                    className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Change photo"
                  >
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <Icon.Camera className="h-5 w-5 text-white" />
                  </label>
                  {/* Online dot */}
                  <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
                </div>

                {/* Tier pill */}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${TIER_COVER[loyaltyTier].pill} mb-3`}>
                  <img src={TIER_BADGE_IMAGE[loyaltyTier]} alt={loyaltyTier} className="h-4 w-4 object-contain shrink-0" />
                  <span className="text-[11px] font-bold">{loyaltyTier}</span>
                </div>

                {/* User info — centered */}
                <h2 className="text-lg font-bold text-slate-900 text-center leading-tight">
                  {form.name || 'AF Home User'}
                </h2>
                <p className="text-xs text-slate-500 mt-1 text-center">{form.email}</p>
                {form.username && (
                  <span className="inline-block text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-medium mt-1.5 border border-slate-200">
                    @{form.username}
                  </span>
                )}

                {isUploadingAvatar && (
                  <p className="mt-2 text-xs text-orange-500 font-medium">Uploading photo...</p>
                )}
                {profileData?.avatar_url && (
                  <button
                    type="button"
                    onClick={() => setIsAvatarPreviewOpen(true)}
                    className="mt-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 hover:underline"
                  >
                    View Photo
                  </button>
                )}

                {/* Profile completion */}
                <div className="mt-4 w-full p-3.5 rounded-xl bg-orange-50/60 border border-orange-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600">Profile Completion</span>
                    <span className="text-xs font-bold text-orange-600">{completion}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-orange-100 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${completion}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    {completion >= 100
                      ? 'Fully verified account.'
                      : completion < 60
                      ? 'Fill in your details to unlock all features.'
                      : 'Almost there — just a few fields left.'}
                  </p>
                </div>
              </div>

              {/* Referral section */}
              {(
                <div className="px-5 pb-5">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                          <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                          </svg>
                        </div>
                        <p className="text-xs font-bold text-slate-700">Affiliate Referral QR</p>
                      </div>
                      <span className="rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-[10px] font-semibold text-sky-700">Ready to Share</span>
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
                      <p className={`mt-2 text-xs font-medium ${referralMsg.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
                        {referralMsg.text}
                      </p>
                    )}

                    {/* Network stats */}
                    <div className="mt-4 border-t border-slate-100 pt-3.5">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="text-xs font-bold text-slate-700">Affiliate Network</p>
                        {!isReferralTreeLoading && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            {referralTree?.summary?.total_network ?? 0} members
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2.5 text-center">
                          <p className="text-[10px] text-slate-500 font-medium mb-0.5">Direct</p>
                          <p className="text-base font-bold text-slate-800">{referralTree?.summary?.direct_count ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-orange-100 bg-orange-50 px-2 py-2.5 text-center">
                          <p className="text-[10px] text-orange-500 font-medium mb-0.5">Level 2</p>
                          <p className="text-base font-bold text-orange-700">{referralTree?.summary?.second_level_count ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-2 py-2.5 text-center">
                          <p className="text-[10px] text-emerald-500 font-medium mb-0.5">Total</p>
                          <p className="text-base font-bold text-emerald-700">{referralTree?.summary?.total_network ?? 0}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== 'undefined' && window.innerWidth < 1280) {
                            setIsMobileReferralTreeOpen(true);
                          } else {
                            handleTabChange('referrals');
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 py-2.5 text-xs font-semibold text-white hover:bg-orange-600 transition-colors shadow-sm"
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
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Account Snapshot</h3>
              <div className="grid grid-cols-2 gap-2">
                {accountStats.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className="group rounded-xl border border-slate-100 bg-slate-50 hover:border-orange-200 hover:bg-orange-50 px-3 py-3 text-left transition-colors"
                  >
                    <item.Icon className="h-4 w-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
                    <p className="text-lg font-bold text-slate-800 mt-1.5 leading-none">{item.value}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.label}</p>
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
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Quick Actions</h3>
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
                    className="group w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-orange-50 hover:text-orange-600 text-sm font-medium text-slate-700 transition-colors"
                  >
                    <item.Icon className="h-4 w-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </aside>

          {/* â"€â"€ Main content â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
          <div
            ref={mainContentRef}
            className={`
              xl:col-span-8 space-y-5
              fixed inset-0 z-50 bg-slate-50 overflow-y-auto
              transition-transform duration-300 ease-in-out
              ${isMobileViewOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}
              xl:relative xl:inset-auto xl:z-auto xl:bg-transparent xl:overflow-visible
              xl:translate-x-0 xl:pointer-events-auto xl:transition-none xl:block
            `}
          >
            {/* Mobile back header — only shown in mobile full-screen view */}
            {isMobileViewOpen && (
              <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 xl:hidden">
                <button
                  type="button"
                  onClick={() => { setIsMobileViewOpen(false); setActiveTab('profile'); }}
                  className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <h2 className="text-base font-bold text-slate-900">{activeTabLabel}</h2>
              </div>
            )}
            <div className={isMobileViewOpen ? 'px-4 py-4 pb-8 space-y-5 xl:px-0 xl:py-0 xl:space-y-0' : ''}>
            <AnimatePresence mode="wait">
              {/* â"€â"€ Profile tab â"€â"€ */}
              {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-5">

                  {/* Personal info form */}
                  <form onSubmit={handleSaveProfile} className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Update your name and contact details. Username changes require approval.</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 font-medium border border-orange-100 whitespace-nowrap">
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
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-red-50 text-red-700 border border-red-100'
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
                        { field: 'name' as const, label: 'Full Name', type: 'text', placeholder: 'Enter your full name', disabled: false },
                        { field: 'username' as const, label: 'Username', type: 'text', placeholder: 'Change in the Username tab', disabled: true },
                        { field: 'email' as const, label: 'Email Address', type: 'email', placeholder: 'Email', disabled: true, isEmail: true },
                        { field: 'phone' as const, label: 'Phone Number', type: 'tel', placeholder: '09XXXXXXXXX', disabled: false },
                      ].map(({ field, label, type, placeholder, disabled, isEmail }) => (
                        <div key={field} className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                            {label}
                            {isEmail && (
                              profileData?.email_verified
                                ? <span className="normal-case tracking-normal font-semibold text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5 leading-none">&#10003; Verified</span>
                                : <span className="normal-case tracking-normal font-semibold text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5 leading-none">&#9888; Not Verified</span>
                            )}
                            {disabled && !isEmail && (
                              <span className="normal-case tracking-normal font-normal text-[11px] text-slate-400 ml-1">(cannot change)</span>
                            )}
                          </label>
                          <input
                            type={type}
                            value={form[field]}
                            onChange={disabled ? undefined : onChange(field)}
                            disabled={disabled}
                            placeholder={placeholder}
                            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 ${
                              disabled
                                ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                                : 'border-slate-200 text-slate-800 bg-white hover:border-slate-300'
                            }`}
                          />
                          {field === 'username' && (
                            <p className="text-[11px] text-slate-400">Go to the Change Username tab to submit a request.</p>
                          )}
                        </div>
                      ))}

                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bio</label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={3}
                          maxLength={200}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 resize-none"
                          placeholder="Tell us something about your style, home setup, or shopping preferences"
                        />
                        <p className="text-[11px] text-slate-400 text-right">{bio.length}/200</p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-end gap-3">
                      {hasChanges && (
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              name: profileData?.name ?? session?.user?.name ?? '',
                              email: profileData?.email ?? session?.user?.email ?? '',
                              phone: profileData?.phone ?? '',
                              username: profileData?.username ?? '',
                            })
                          }
                          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          Discard
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSaving || !hasChanges}
                        className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-orange-200"
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
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Saved Addresses</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Your shipping and billing locations.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenAddressModal}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-orange-500/10"
                      >
                        {addresses.length ? '+ Edit Address' : '+ Add Address'}
                      </button>
                    </div>

                    {addresses.length ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((addr) => (
                        <div key={addr.id} className="group relative rounded-xl border border-slate-100 bg-slate-50 hover:border-orange-200 hover:bg-orange-50/30 p-4 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">{addr.label}</p>
                              {addr.isDefault && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium">Default</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button type="button" onClick={handleOpenAddressModal} className="p-1 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-100 transition-colors">
                                <Icon.Edit className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="mt-2.5 text-sm font-semibold text-slate-900">{addr.recipient}</p>
                          <p className="text-xs text-slate-500">{addr.phone}</p>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{addr.full}</p>
                        </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
                        <p className="text-sm font-semibold text-slate-700">No saved address yet</p>
                        <p className="mt-1 text-xs text-slate-500">Add your default shipping address so checkout and verification can be filled faster.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* â"€â"€ Security tab â"€â"€ */}
              {activeTab === 'security' && (
                <motion.div key="security" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-5">

                  <form onSubmit={handleChangePassword} className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                    <div className="mb-5">
                      <h3 className="text-base font-bold text-slate-900">Change Password</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Use a strong, unique password for your account.</p>
                      {(passwordChangeRequired || passwordChangeRequiredFromQuery) && (
                        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
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
                          className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm bg-red-50 text-red-700 border border-red-100"
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
                          className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm bg-emerald-50 text-emerald-700 border border-emerald-100"
                        >
                          <Icon.Check className="h-4 w-4 shrink-0" />
                          Password changed successfully.{passwordChangeRequired || passwordChangeRequiredFromQuery ? ' Redirecting you to the shop...' : ''}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Current Password</label>
                        <PasswordInput
                          value={security.currentPassword}
                          onChange={(e) => setSecurity((p) => ({ ...p, currentPassword: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">New Password</label>
                        <PasswordInput
                          value={security.newPassword}
                          onChange={(e) => setSecurity((p) => ({ ...p, newPassword: e.target.value }))}
                          placeholder="Min. 8 characters"
                        />
                        {/* Password strength bar */}
                        {pwStrength && (
                          <div className="mt-2 space-y-1">
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${pwStrength.color}`}
                                initial={{ width: 0 }}
                                animate={{ width: pwStrength.pct }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Strength: <span className="font-semibold text-slate-700">{pwStrength.label}</span>
                              {' - '}Use uppercase, numbers &amp; symbols for a stronger password.
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Confirm New Password</label>
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
                        className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-orange-200"
                      >
                        {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                      </button>
                    </div>
                  </form>

                  {/* 2FA */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                    <h3 className="text-base font-bold text-slate-900 mb-4">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center ${prefs.twoFactorEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          <Icon.Shield className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Authenticator App</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {prefs.twoFactorEnabled
                              ? 'Your account is protected with 2FA.'
                              : 'Add an extra layer of security by enabling 2FA.'}
                          </p>
                        </div>
                      </div>
                      <Toggle checked={prefs.twoFactorEnabled} onChange={() => togglePref('twoFactorEnabled')} />
                    </div>
                  </div>

                  {/* Danger zone */}
                  <div className="rounded-2xl border border-red-100 bg-white p-5 md:p-6">
                    <h3 className="text-base font-bold text-red-600 mb-1 flex items-center gap-2">
                      <Icon.Warning className="h-4 w-4" />
                      Danger Zone
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">These actions are irreversible. Please be certain before proceeding.</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Sign Out</p>
                          <p className="text-xs text-slate-500">Sign out from your account on this device.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => signOut({ callbackUrl: '/login' })}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Icon.LogOut className="h-3.5 w-3.5" />
                          Sign Out
                        </button>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50/50 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-red-700">Delete Account</p>
                          <p className="text-xs text-red-400">Permanently remove your account and all data.</p>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
                        >
                          <Icon.Trash className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* â"€â"€ Preferences tab â"€â"€ */}
              {activeTab === 'preferences' && (
                <motion.div key="preferences" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-5">

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                    <div className="mb-5">
                      <h3 className="text-base font-bold text-slate-900">Notifications</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Choose how you&apos;d like to be updated.</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { key: 'orderUpdates' as const, label: 'Order Status Updates', desc: 'Get notified when your order ships, arrives, or has issues.' },
                        { key: 'marketingEmails' as const, label: 'Marketing Emails', desc: 'Receive newsletters, promotions, and product highlights.' },
                        { key: 'smsUpdates' as const, label: 'SMS Notifications', desc: 'Get text messages for urgent updates and delivery alerts.' },
                        { key: 'pushNotifications' as const, label: 'Push Notifications', desc: 'Browser notifications for real-time activity.' },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3.5 hover:border-slate-200 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                          </div>
                          <Toggle
                            checked={prefs[item.key] as boolean}
                            onChange={() => togglePref(item.key)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                    <div className="mb-5">
                      <h3 className="text-base font-bold text-slate-900">Display & Regional</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Customize your language and currency experience.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Language</label>
                        <select
                          value={prefs.language}
                          onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value as 'en' | 'fil' }))}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                        >
                          <option value="en">ðŸŒ English</option>
                          <option value="fil">ðŸ‡µðŸ‡­ Filipino</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Currency</label>
                        <select
                          value={prefs.currency}
                          onChange={(e) => setPrefs((p) => ({ ...p, currency: e.target.value as 'PHP' | 'USD' }))}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                        >
                          <option value="PHP">â‚± Philippine Peso (PHP)</option>
                          <option value="USD">$ US Dollar (USD)</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200"
                      >
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* â"€â"€ Activity tab â"€â"€ */}
              {activeTab === 'wallet' && (
                <motion.div
                  key="wallet"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <WalletTab isVerified={isVerified} />
                </motion.div>
              )}

              {activeTab === 'encashment' && (
                <motion.div
                  key="encashment"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <EncashmentTab />
                </motion.div>
              )}

              {activeTab === 'interior-requests' && (
                <motion.div
                  key="interior-requests"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <InteriorRequestsTab />
                </motion.div>
              )}

              {activeTab === 'referrals' && (
                <motion.div
                  key="referrals"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {/* Header card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                    <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Referral Network</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Your affiliate tree, referral link, and commission overview.</p>
                      </div>
                      {isVerified && (
                        <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold whitespace-nowrap">
                          &#10003; Verified Affiliate
                        </span>
                      )}
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                      {[
                        { label: 'Direct Referrals', value: referralTree?.summary?.direct_count ?? 0, bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100', val: 'text-sky-800' },
                        { label: 'Level 2', value: referralTree?.summary?.second_level_count ?? 0, bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', val: 'text-orange-800' },
                        { label: 'Total Network', value: referralTree?.summary?.total_network ?? 0, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', val: 'text-emerald-800' },
                        { label: 'Total PV Earned', value: (referralTree?.summary as { total_pv?: number } | undefined)?.total_pv ?? 0, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', val: 'text-amber-800' },
                      ].map((stat) => (
                        <div key={stat.label} className={`rounded-xl border ${stat.border} ${stat.bg} px-4 py-3`}>
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
                          <div key={i} className="h-20 rounded-2xl bg-slate-100" />
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col sm:flex-row gap-2 mb-3">
                          <div className="relative flex-1">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            <input
                              type="text"
                              value={treeSearchQuery}
                              onChange={(e) => { setTreeSearchQuery(e.target.value); setReferralPage(1); }}
                              placeholder="Search name, username, email..."
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2c5f4f]/20 focus:border-[#2c5f4f]/40 bg-slate-50 text-slate-700 placeholder-slate-400"
                            />
                          </div>
                          <select
                            value={treeStatusFilter}
                            onChange={(e) => { setTreeStatusFilter(e.target.value as TreeStatusFilter); setReferralPage(1); }}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2c5f4f]/20 focus:border-[#2c5f4f]/40"
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
                              className="flex-1 sm:flex-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 hover:border-orange-300 hover:text-orange-600 transition-colors"
                            >
                              Expand All
                            </button>
                            <button
                              type="button"
                              onClick={handleCollapseAllTreeNodes}
                              className="flex-1 sm:flex-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 hover:border-orange-300 hover:text-orange-600 transition-colors"
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
                                <p className="text-xs text-slate-500">
                                  {filteredReferralChildren.length > 0
                                    ? <>Showing <span className="font-semibold text-slate-700">{pageStart + 1}–{Math.min(pageEnd, filteredReferralChildren.length)}</span> of <span className="font-semibold text-slate-700">{filteredReferralChildren.length}</span> referral{filteredReferralChildren.length !== 1 ? 's' : ''}</>
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
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                      <button
                                        type="button"
                                        disabled={referralPage <= 1}
                                        onClick={() => setReferralPage((p) => Math.max(1, p - 1))}
                                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:border-[#2c5f4f]/40 hover:text-[#2c5f4f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                      >
                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
                                        Prev
                                      </button>
                                      <p className="text-xs text-slate-500 font-medium">
                                        Page <span className="text-slate-800 font-bold">{referralPage}</span> / {totalPages}
                                      </p>
                                      <button
                                        type="button"
                                        disabled={referralPage >= totalPages}
                                        onClick={() => setReferralPage((p) => Math.min(totalPages, p + 1))}
                                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:border-[#2c5f4f]/40 hover:text-[#2c5f4f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                      >
                                        Next
                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
                                      </button>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="py-12 text-center">
                                  <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                    <Icon.Network className="h-6 w-6 text-slate-400" />
                                  </div>
                                  <p className="text-sm font-semibold text-slate-700">
                                    {(referralTree?.children?.length ?? 0) > 0 ? 'No matches found' : 'No referrals yet'}
                                  </p>
                                  <p className="text-xs text-slate-400 mt-1">
                                    {(referralTree?.children?.length ?? 0) > 0 ? 'Try a different search or filter' : 'Share your referral link to start building your network'}
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
                <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                    <div className="mb-5">
                      <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
                      <p className="text-xs text-slate-500 mt-0.5">A log of your recent account actions.</p>
                    </div>
                    <div className="space-y-2">
                      {recentActivity.map((item, i) => (
                        <motion.div
                          key={item.title}
                          variants={fadeUp}
                          initial="hidden"
                          animate="visible"
                          custom={i}
                          className="flex items-start gap-3.5 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3.5 hover:border-slate-200 transition-colors"
                        >
                          <div className="mt-0.5 h-7 w-7 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
                            {getActivityIcon(item.title)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Login sessions (placeholder) */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-slate-900">Active Sessions</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Devices currently logged into your account.</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-500 flex items-center justify-center">
                          <Icon.Shield className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Current Device</p>
                          <p className="text-xs text-slate-500">Windows Â· Chrome Â· Manila, PH</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                        Active now
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'change-username' && (
                <motion.div key="change-username" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-slate-900">Change Username</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Update the username used for your profile and referral link.</p>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 mb-4">
                      <p className="text-xs text-slate-500">Current username</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">{profileData?.username ? `@${profileData.username}` : 'Not set'}</p>
                    </div>

                    {usernameMsg && (
                      <div className={`mb-4 rounded-xl px-3.5 py-2.5 text-xs font-semibold ${usernameMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                        {usernameMsg.text}
                      </div>
                    )}

                    {latestUsernameRequest && (
                      <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs text-slate-500">Latest request</p>
                            <p className="text-sm font-semibold text-slate-800 mt-0.5">
                              @{latestUsernameRequest.requested_username}
                            </p>
                          </div>
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                            latestUsernameRequest.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : latestUsernameRequest.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {latestUsernameRequest.status === 'pending_review' ? 'Pending' : latestUsernameRequest.status}
                          </span>
                        </div>
                        {latestUsernameRequest.review_notes && (
                          <p className="text-[11px] text-slate-500 mt-2">{latestUsernameRequest.review_notes}</p>
                        )}
                      </div>
                    )}
                    {hasPendingUsernameRequest && (
                      <p className="mb-4 text-xs text-amber-700">You already have a pending request. Please wait for admin approval before submitting another.</p>
                    )}

                    <form onSubmit={handleSubmitUsernameChange} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">New Username</label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-400">@</span>
                          <input
                            type="text"
                            value={hasPendingUsernameRequest ? pendingRequestedUsername : usernameRequest}
                            onChange={(e) => {
                              const onlyLetters = e.target.value.replace(/[^A-Za-z]/g, '');
                              setUsernameRequest(onlyLetters);
                              if (usernameOtpToken) {
                                setUsernameOtpToken(null);
                                setUsernameOtp('');
                              }
                            }}
                            placeholder="your.username"
                            disabled={hasPendingUsernameRequest}
                            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 ${
                              hasPendingUsernameRequest
                                ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                                : 'border-slate-200 text-slate-800 bg-white'
                            }`}
                          />
                        </div>
                        <p className="text-[11px] text-slate-400">Letters only (A–Z). Changing your username will update your referral link after approval.</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={handleSendUsernameOtp}
                          disabled={hasPendingUsernameRequest || isSendingUsernameOtp}
                          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200 disabled:opacity-60 disabled:cursor-not-allowed"
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
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          Reset
                        </button>
                      </div>

                      {usernameOtpToken && !hasPendingUsernameRequest && (
                        <div className="rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3 space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-orange-700">Enter OTP</p>
                            <p className="text-[11px] text-orange-600">
                              {usernameOtpSentTo ? `We sent the code to ${usernameOtpSentTo}.` : 'Check your email for the 4-digit code.'}
                            </p>
                          </div>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={4}
                            value={usernameOtp}
                            onChange={(e) => setUsernameOtp(e.target.value.replace(/\\D/g, ''))}
                            className="w-full rounded-xl border border-orange-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                            placeholder="4-digit code"
                          />
                          <button
                            type="submit"
                            disabled={isSubmittingUsernameChange}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
            </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAddressModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm p-4"
            onClick={handleCloseAddressModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              className="mx-auto mt-8 max-w-3xl rounded-2xl bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">Address</p>
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
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Street / House No.</label>
                  <input
                    type="text"
                    value={addressForm.address}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                    placeholder="House no., street, building, unit"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Region</label>
                    <select
                      value={phAddress.regionCode}
                      onChange={(e) => {
                        const option = e.target.options[e.target.selectedIndex];
                        phAddress.setRegion(e.target.value, option.text);
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                    >
                      <option value="">Select Region</option>
                      {phAddress.regions.map((region) => (
                        <option key={region.code} value={region.code}>{region.name}</option>
                      ))}
                    </select>
                  </div>

                  {!phAddress.noProvince ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Province</label>
                      <select
                        value={phAddress.provinceCode}
                        disabled={!phAddress.regionCode || phAddress.loadingProvinces}
                        onChange={(e) => {
                          const option = e.target.options[e.target.selectedIndex];
                          phAddress.setProvince(e.target.value, option.text);
                        }}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <option value="">{phAddress.loadingProvinces ? 'Loading provinces...' : 'Select Province'}</option>
                        {phAddress.provinces.map((province) => (
                          <option key={province.code} value={province.code}>{province.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Province</label>
                      <input
                        value={phAddress.address.region}
                        disabled
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-400 bg-slate-50"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">City / Municipality</label>
                    <select
                      value={phAddress.cityCode}
                      disabled={phAddress.noProvince ? !phAddress.regionCode : (!phAddress.provinceCode || phAddress.loadingCities)}
                      onChange={(e) => {
                        const option = e.target.options[e.target.selectedIndex];
                        phAddress.setCity(e.target.value, option.text);
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">{phAddress.loadingCities || phAddress.loadingProvinces ? 'Loading cities...' : 'Select City / Municipality'}</option>
                      {phAddress.cities.map((city) => (
                        <option key={city.code} value={city.code}>{city.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Barangay</label>
                    <select
                      value={phAddress.address.barangay}
                      disabled={!phAddress.cityCode || phAddress.loadingBarangays}
                      onChange={(e) => phAddress.setBarangay(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">{phAddress.loadingBarangays ? 'Loading barangays...' : 'Select Barangay'}</option>
                      {phAddress.barangays.map((barangay) => (
                        <option key={barangay.code} value={barangay.name}>{barangay.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">ZIP Code</label>
                    <input
                      type="text"
                      value={addressForm.zipCode}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, zipCode: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
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
                    className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {isMobileReferralTreeOpen && (
          <motion.div
            key="mobile-referral-tree"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 z-[70] bg-slate-50 flex flex-col xl:hidden"
          >
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileReferralTreeOpen(false)}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                aria-label="Close referral tree"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <div className="flex-1">
                <h2 className="text-base font-bold text-slate-900">Referral Tree</h2>
              </div>
              {isVerified && (
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                  ✓ Verified
                </span>
              )}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Direct Referrals', value: referralTree?.summary?.direct_count ?? 0, bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100', val: 'text-sky-800' },
                  { label: 'Level 2', value: referralTree?.summary?.second_level_count ?? 0, bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', val: 'text-orange-800' },
                  { label: 'Total Network', value: referralTree?.summary?.total_network ?? 0, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', val: 'text-emerald-800' },
                  { label: 'Total PV Earned', value: (referralTree?.summary as { total_pv?: number } | undefined)?.total_pv ?? 0, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', val: 'text-amber-800' },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-xl border ${stat.border} ${stat.bg} px-4 py-3`}>
                    <p className={`text-[11px] font-medium ${stat.text} mb-1`}>{stat.label}</p>
                    <p className={`text-xl font-bold ${stat.val}`}>{stat.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <ReferralShareCard
                  title="Invite Members"
                  description="For people who want to register as your referral."
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
                  description="For non-members who only want to buy. Checkout will carry your referral automatically."
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

              {/* Tree search + filter + list */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                {isReferralTreeLoading ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 rounded-2xl bg-slate-100" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2 mb-3">
                      <div className="relative flex-1">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input
                          type="text"
                          value={treeSearchQuery}
                          onChange={(e) => { setTreeSearchQuery(e.target.value); setReferralPage(1); }}
                          placeholder="Search name, username, email..."
                          className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2c5f4f]/20 focus:border-[#2c5f4f]/40 bg-slate-50 text-slate-700 placeholder-slate-400"
                        />
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={treeStatusFilter}
                          onChange={(e) => { setTreeStatusFilter(e.target.value as TreeStatusFilter); setReferralPage(1); }}
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2c5f4f]/20 focus:border-[#2c5f4f]/40"
                        >
                          <option value="all">All Status</option>
                          <option value="verified">Verified</option>
                          <option value="pending_review">Pending Review</option>
                          <option value="not_verified">Not Verified</option>
                          <option value="blocked">Blocked</option>
                        </select>
                        <button
                          type="button"
                          onClick={handleExpandAllTreeNodes}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 hover:border-orange-300 hover:text-orange-600 transition-colors"
                        >
                          Expand
                        </button>
                        <button
                          type="button"
                          onClick={handleCollapseAllTreeNodes}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 hover:border-orange-300 hover:text-orange-600 transition-colors"
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
                            <p className="text-xs text-slate-500">
                              {filteredReferralChildren.length > 0
                                ? <>Showing <span className="font-semibold text-slate-700">{pageStart + 1}–{Math.min(pageEnd, filteredReferralChildren.length)}</span> of <span className="font-semibold text-slate-700">{filteredReferralChildren.length}</span> referral{filteredReferralChildren.length !== 1 ? 's' : ''}</>
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
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                  <button
                                    type="button"
                                    disabled={referralPage <= 1}
                                    onClick={() => setReferralPage((p) => Math.max(1, p - 1))}
                                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:border-[#2c5f4f]/40 hover:text-[#2c5f4f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
                                    Prev
                                  </button>
                                  <p className="text-xs text-slate-500 font-medium">
                                    Page <span className="text-slate-800 font-bold">{referralPage}</span> / {totalPages}
                                  </p>
                                  <button
                                    type="button"
                                    disabled={referralPage >= totalPages}
                                    onClick={() => setReferralPage((p) => Math.min(totalPages, p + 1))}
                                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:border-[#2c5f4f]/40 hover:text-[#2c5f4f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    Next
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
                                  </button>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="py-12 text-center">
                              <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                <Icon.Network className="h-6 w-6 text-slate-400" />
                              </div>
                              <p className="text-sm font-semibold text-slate-700">
                                {(referralTree?.children?.length ?? 0) > 0 ? 'No matches found' : 'No referrals yet'}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {(referralTree?.children?.length ?? 0) > 0 ? 'Try a different search or filter' : 'Share your referral link to start building your network'}
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {isAvatarPreviewOpen && profileData?.avatar_url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setIsAvatarPreviewOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              className="mx-auto mt-12 max-w-xl rounded-2xl bg-white p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">Profile Photo Preview</p>
                <button
                  type="button"
                  onClick={() => setIsAvatarPreviewOpen(false)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
              <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                <img
                  src={profileData.avatar_url}
                  alt={form.name || 'Profile photo preview'}
                  className="h-full w-full object-cover"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export default ProfilePage;
