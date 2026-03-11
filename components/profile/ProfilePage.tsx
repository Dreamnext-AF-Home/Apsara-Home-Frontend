'use client';

import { ReferralTreeNode, useMeQuery, useReferralTreeQuery, useUpdateProfileMutation } from '@/store/api/userApi';
import { signOut, useSession } from 'next-auth/react';
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Loading from '../Loading';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import TierBadge from '@/components/ui/TierBadge';
import { MemberTier } from '@/types/members/types';
import Icon from './Icons';
import getPasswordStrength from './GetPasswordStrength';
import fadeUp from './FadeUp';
import PasswordInput from './PasswordInput';
import Toggle from './Toggle';
import getActivityIcon from './GetActivityIcon';
import EncashmentTab from './EncashmentTab';
import WalletTab from './WalletTab';


type ProfileFormState = {
  name: string;
  email: string;
  phone: string;
  username: string;
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

type Tab = 'profile' | 'security' | 'preferences' | 'wallet' | 'encashment' | 'activity' | 'referrals';

type AlertMsg = { type: 'success' | 'error'; text: string };
type TreeStatusFilter = 'all' | 'verified' | 'pending_review' | 'not_verified' | 'blocked';

const ProfilePage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { data } = useMeQuery();
  const { data: referralTree, isLoading: isReferralTreeLoading } = useReferralTreeQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();

  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const [form, setForm] = useState<ProfileFormState>({ name: '', email: '', phone: '', username: '' });
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
  const [referralMsg, setReferralMsg] = useState<AlertMsg | null>(null);
  const [expandedTreeNodes, setExpandedTreeNodes] = useState<Record<number, boolean>>({});
  const [treeSearchQuery, setTreeSearchQuery] = useState('');
  const [treeStatusFilter, setTreeStatusFilter] = useState<TreeStatusFilter>('all');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const referralMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mainContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (data || session) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: data?.name ?? session?.user?.name ?? '',
        email: data?.email ?? session?.user?.email ?? '',
        phone: data?.phone ?? '',
        username: data?.username ?? '',
      });
    }
  }, [data, session]);

  // Auto-dismiss alert messages
  useEffect(() => {
    if (!profileMsg) return;
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setProfileMsg(null), 5000);
    return () => { if (msgTimer.current) clearTimeout(msgTimer.current); };
  }, [profileMsg]);

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
      form.name !== (data?.name ?? session?.user?.name ?? '') ||
      form.phone !== (data?.phone ?? '') ||
      form.username !== (data?.username ?? ''),
    [data, form.name, form.phone, form.username, session?.user?.name],
  );

  const verificationStatus = data?.verification_status ?? 'not_verified';
  const isVerified = verificationStatus === 'verified' || data?.account_status === 1;
  const isPendingVerification = verificationStatus === 'pending_review' || data?.account_status === 2;
  const configuredAppUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim().replace(/\/+$/, '');
  const runtimeOrigin = (typeof window !== 'undefined' ? window.location.origin : '').trim().replace(/\/+$/, '');
  const siteOrigin = configuredAppUrl || runtimeOrigin || 'http://localhost:3000';
  const referralCode = (form.username || data?.username || '').trim();
  const referralLink = referralCode
    ? `${siteOrigin}/login?ref=${encodeURIComponent(referralCode)}`
    : '';
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

  const verificationChecklist = useMemo(() => {
    return [
      {
        label: 'Complete profile basics (name + mobile number)',
        done: Boolean(form.name.trim()) && Boolean(form.phone.trim()),
      },
      {
        label: 'Upload profile photo',
        done: Boolean(data?.avatar_url),
      },
      {
        label: 'Submit KYC documents (ID front/back + selfie)',
        done: isPendingVerification || isVerified,
      },
      {
        label: 'Wait for admin KYC approval',
        done: isVerified,
      },
    ];
  }, [data?.avatar_url, form.name, form.phone, isPendingVerification, isVerified]);

  const onChange = (field: keyof ProfileFormState) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const togglePref = (field: keyof PreferencesState) =>
    setPrefs((prev) => (typeof prev[field] === 'boolean' ? { ...prev, [field]: !prev[field] } : prev));

  const handleCopyReferralLink = async () => {
    if (!referralLink) {
      setReferralMsg({ type: 'error', text: 'Referral link is unavailable. Set your username first.' });
      return;
    }

    try {
      await navigator.clipboard.writeText(referralLink);
      setReferralMsg({ type: 'success', text: 'Referral link copied.' });
    } catch {
      setReferralMsg({ type: 'error', text: 'Failed to copy referral link.' });
    }
  };

  const handleShareReferralLink = async () => {
    if (!referralLink) {
      setReferralMsg({ type: 'error', text: 'Referral link is unavailable. Set your username first.' });
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Join AF Home',
          text: 'Register using my affiliate referral link.',
          url: referralLink,
        });
        return;
      } catch {
        // no-op; fallback to copy
      }
    }

    await handleCopyReferralLink();
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

    return (
      <div key={`full-${node.id}-${level}`} className="relative">
        {level > 0 && (
          <span className="pointer-events-none absolute -left-4 top-6 h-px w-4 bg-orange-200" />
        )}
        <div className={`rounded-2xl border transition-all duration-200 hover:shadow-sm ${level === 0 ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-100 bg-slate-50/60'}`}>
          <div className="flex items-start gap-3.5 p-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm text-white ${level === 0 ? 'bg-gradient-to-br from-orange-400 to-amber-500' : 'bg-gradient-to-br from-slate-300 to-slate-500'}`}>
                {nodeInitials}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${vc.dot}`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {node.name || 'Unknown'}
                    {node.username ? <span className="text-slate-400 font-normal ml-1 text-xs">@{node.username}</span> : null}
                  </p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{node.email || 'No email'}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${vc.bg} ${vc.text} ${vc.border}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${vc.dot}`} />
                    {node.verification_status?.replace('_', ' ') ?? 'not verified'}
                  </span>
                  {hasChildren && (
                    <button
                      type="button"
                      onClick={() => toggleTreeNode(node.id)}
                      className="h-7 w-7 rounded-lg border border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50 text-slate-400 hover:text-orange-500 flex items-center justify-center transition-colors"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      <Icon.ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-50 border border-orange-100 text-[11px] font-bold text-orange-700">
                    PV {Number(node.total_earnings ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600">
                    {node.children_count ?? children.length} downline
                  </span>
                </div>
                {node.joined_at && (
                  <span className="text-[11px] text-slate-400">
                    Joined {new Date(node.joined_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="relative mt-2 ml-6 space-y-2 border-l-2 border-orange-100 pl-4">
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
        username: form.username.trim() || undefined,
        phone: form.phone.trim() || undefined,
      }).unwrap();
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      setProfileMsg({ type: 'error', text: apiError?.data?.message || 'Failed to update profile.' });
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
        name: form.name.trim() || data?.name || session?.user?.name || 'AF Home User',
        username: form.username.trim() || undefined,
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

  const handleChangePassword = (e: FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);
    if (!security.currentPassword) return setPwError('Please enter your current password.');
    if (security.newPassword.length < 8) return setPwError('New password must be at least 8 characters.');
    if (security.newPassword !== security.confirmPassword) return setPwError('Passwords do not match.');
    // TODO: wire to real mutation when available
    setPwSuccess(true);
    setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setPwSuccess(false), 5000);
  };

  // Static data (connect to real API as pages are built)
  const loyaltyTier: MemberTier = 'Home Builder';

  const accountStats = [
    { label: 'Orders', value: '14', Icon: Icon.Package, onClick: () => router.push('/orders') },
    { label: 'Wishlist', value: '27', Icon: Icon.Heart, onClick: () => router.push('/wishlist') },
    { label: 'Reviews', value: '9', Icon: Icon.Activity, onClick: () => {} },
    { label: 'Loyalty', value: loyaltyTier, Icon: Icon.Shield, onClick: () => {} },
  ];

  const addresses = [
    {
      id: 'default',
      label: 'Default Shipping',
      recipient: form.name || 'AF Home User',
      phone: form.phone || 'No phone provided',
      full: 'Unit 12B, Sapphire Residences, Quezon City, Metro Manila',
      isDefault: true,
    },
    {
      id: 'billing',
      label: 'Billing Address',
      recipient: form.name || 'AF Home User',
      phone: form.phone || 'No phone provided',
      full: 'Block 7 Lot 15, Magsaysay St., Cebu City, Cebu',
      isDefault: false,
    },
  ];

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
    { key: 'activity', label: 'Activity', Icon: Icon.Activity },
    { key: 'referrals', label: 'Referrals', Icon: Icon.Network },
  ];

  const initials = (form.name || session?.user?.name || 'A')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  const pwStrength = getPasswordStrength(security.newPassword);
  const activeTabLabel = TABS.find((item) => item.key === activeTab)?.label ?? 'Profile';

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      requestAnimationFrame(() => {
        mainContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
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

        {/* Tab navigation bar */}
        <div className="sticky top-16 z-20 -mx-4 mb-6 bg-white/95 backdrop-blur-sm border-b border-slate-100">
          <nav className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4">
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
              {/* Cover banner */}
              <div className="h-24 bg-gradient-to-br from-orange-400 to-amber-500 relative overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 20% 60%, rgba(255,255,255,0.18) 0%, transparent 45%), radial-gradient(circle at 80% 25%, rgba(255,255,255,0.12) 0%, transparent 45%)',
                  }}
                />
              </div>

              <div className="px-5 pb-5">
                {/* Avatar + tier row */}
                <div className="flex items-start justify-between -mt-8 mb-3">
                  <div className="relative group">
                    {isUploadingAvatar && (
                      <span className="pointer-events-none absolute -inset-1 rounded-full border-2 border-transparent border-t-orange-500 border-r-orange-400 animate-spin z-10" />
                    )}
                    {data?.avatar_url ? (
                      <img
                        src={data.avatar_url}
                        alt={form.name || 'Profile photo'}
                        className="h-16 w-16 rounded-full object-cover ring-4 ring-white shadow-md"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white text-xl font-bold flex items-center justify-center ring-4 ring-white shadow-md">
                        {initials}
                      </div>
                    )}
                    <label
                      className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Change photo"
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
                  <TierBadge tier={loyaltyTier} className="px-2.5 py-1 mt-10" />
                </div>

                {/* User info */}
                <div className="space-y-0.5">
                  <h2 className="text-base font-bold text-slate-900">
                    {form.name || 'AF Home User'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    {form.email}
                    {data?.email_verified
                      ? <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5 leading-none">&#10003; Verified</span>
                      : <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5 leading-none">&#9888; Not Verified</span>
                    }
                  </p>
                  {form.username && (
                    <span className="inline-block text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono font-medium mt-1">
                      @{form.username}
                    </span>
                  )}
                </div>

                {isUploadingAvatar && (
                  <p className="mt-2 text-xs text-orange-600 font-medium">Uploading photo...</p>
                )}
                {data?.avatar_url && (
                  <button
                    type="button"
                    onClick={() => setIsAvatarPreviewOpen(true)}
                    className="mt-2 text-xs font-medium text-orange-500 hover:text-orange-600 hover:underline"
                  >
                    View Photo
                  </button>
                )}

                {/* Profile completion */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600">Profile Completion</span>
                    <span className="text-xs font-bold text-slate-800">{completion}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${completion}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    {completion >= 100
                      ? 'Fully verified account.'
                      : completion < 60
                      ? 'Fill in your details to unlock all features.'
                      : 'Almost there - just a few fields left.'}
                  </p>
                </div>
              </div>

              {/* Referral section */}
              {isVerified && (
                <div className="px-5 pb-5">
                  <div className="rounded-xl border border-purple-100 bg-purple-50 p-3.5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-xs font-bold text-purple-700">Affiliate Referral QR</p>
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">Verified</span>
                    </div>
                    {referralLink ? (
                      <>
                        <div className="flex justify-center my-2">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(referralLink)}`}
                            alt="Referral QR code"
                            className="h-32 w-32 rounded-lg border border-purple-200 bg-white p-2"
                          />
                        </div>
                        <p className="text-[11px] text-purple-600 break-all mb-2">{referralLink}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleShareReferralLink}
                            className="rounded-lg bg-white border border-purple-200 px-2 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors"
                          >
                            Share
                          </button>
                          <button
                            type="button"
                            onClick={handleCopyReferralLink}
                            className="rounded-lg bg-white border border-purple-200 px-2 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors"
                          >
                            Copy Link
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-purple-600">Set your username first to generate your referral link.</p>
                    )}
                    {referralMsg && (
                      <p className={`mt-2 text-xs font-medium ${referralMsg.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
                        {referralMsg.text}
                      </p>
                    )}

                    <div className="mt-4 border-t border-purple-200 pt-3">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="text-xs font-bold text-purple-700">Affiliate Network</p>
                        {!isReferralTreeLoading && (
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                            {referralTree?.summary?.total_network ?? 0} members
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-2 text-center">
                          <p className="text-[10px] text-indigo-500 font-medium">Direct</p>
                          <p className="text-sm font-bold text-indigo-800">{referralTree?.summary?.direct_count ?? 0}</p>
                        </div>
                        <div className="rounded-lg border border-purple-100 bg-purple-50 px-2 py-2 text-center">
                          <p className="text-[10px] text-purple-500 font-medium">Level 2</p>
                          <p className="text-sm font-bold text-purple-800">{referralTree?.summary?.second_level_count ?? 0}</p>
                        </div>
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-2 text-center">
                          <p className="text-[10px] text-emerald-500 font-medium">Total</p>
                          <p className="text-sm font-bold text-emerald-800">{referralTree?.summary?.total_network ?? 0}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTabChange('referrals')}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-white border border-purple-200 px-3 py-2.5 text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <circle cx="18" cy="5" r="3" />
                          <circle cx="6" cy="12" r="3" />
                          <circle cx="18" cy="19" r="3" />
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                        View Full Referral Tree
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification reminder */}
              {!isVerified && (
                <div className="px-5 pb-5">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                    <p className="text-xs font-bold text-amber-800 mb-1">
                      {isPendingVerification ? 'Verification In Review' : 'Verification Required'}
                    </p>
                    <p className="text-xs text-amber-700 mb-2.5">
                      {isPendingVerification
                        ? 'Your KYC is under review. Complete any pending items while waiting.'
                        : 'Submit your KYC documents in the Encashment tab.'}
                    </p>
                    <div className="space-y-2 mb-3">
                      {verificationChecklist.map((item) => (
                        <div key={item.label} className="flex items-start gap-2 text-xs">
                          <span
                            className={`mt-0.5 shrink-0 h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              item.done ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                            }`}
                          >
                            {item.done ? '✓' : '○'}
                          </span>
                          <span className={item.done ? 'text-emerald-700 font-medium' : 'text-amber-800'}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTabChange('encashment')}
                      className="text-xs font-semibold text-amber-700 border border-amber-300 bg-white rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-colors"
                    >
                      Open KYC Form
                    </button>
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
          <div ref={mainContentRef} className="xl:col-span-8 space-y-5">
            <AnimatePresence mode="wait">
              {/* â"€â"€ Profile tab â"€â"€ */}
              {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-5">

                  {/* Personal info form */}
                  <form onSubmit={handleSaveProfile} className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Update your name, username, and contact details.</p>
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
                        { field: 'username' as const, label: 'Username', type: 'text', placeholder: 'e.g. raf_home', disabled: false },
                        { field: 'email' as const, label: 'Email Address', type: 'email', placeholder: 'Email', disabled: true, isEmail: true },
                        { field: 'phone' as const, label: 'Phone Number', type: 'tel', placeholder: '09XXXXXXXXX', disabled: false },
                      ].map(({ field, label, type, placeholder, disabled, isEmail }) => (
                        <div key={field} className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                            {label}
                            {isEmail && (
                              data?.email_verified
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
                              name: data?.name ?? session?.user?.name ?? '',
                              email: data?.email ?? session?.user?.email ?? '',
                              phone: data?.phone ?? '',
                              username: data?.username ?? '',
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
                        <p className="text-xs text-slate-500 mt-0.5">Your shipping and billing locations.</p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-orange-50"
                      >
                        + Add New
                      </button>
                    </div>

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
                              <button type="button" className="p-1 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-100 transition-colors">
                                <Icon.Edit className="h-3.5 w-3.5" />
                              </button>
                              <button type="button" className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                <Icon.Trash className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="mt-2.5 text-sm font-semibold text-slate-900">{addr.recipient}</p>
                          <p className="text-xs text-slate-500">{addr.phone}</p>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{addr.full}</p>
                        </div>
                      ))}
                    </div>
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
                          Password changed successfully.
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
                        disabled={!security.currentPassword || !security.newPassword || !security.confirmPassword}
                        className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-orange-200"
                      >
                        Update Password
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
                  <WalletTab />
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
                        <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-100 whitespace-nowrap">
                          Verified Affiliate
                        </span>
                      )}
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                      {[
                        { label: 'Direct Referrals', value: referralTree?.summary?.direct_count ?? 0, bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', val: 'text-indigo-900' },
                        { label: 'Level 2', value: referralTree?.summary?.second_level_count ?? 0, bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', val: 'text-purple-900' },
                        { label: 'Total Network', value: referralTree?.summary?.total_network ?? 0, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', val: 'text-emerald-900' },
                        { label: 'Total PV Earned', value: (referralTree?.summary as { total_pv?: number } | undefined)?.total_pv ?? 0, bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', val: 'text-orange-900' },
                      ].map((stat) => (
                        <div key={stat.label} className={`rounded-xl border ${stat.border} ${stat.bg} px-4 py-3`}>
                          <p className={`text-[11px] font-medium ${stat.text} mb-1`}>{stat.label}</p>
                          <p className={`text-xl font-bold ${stat.val}`}>{stat.value.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>

                    {/* Referral Link + QR */}
                    {isVerified && referralLink && (
                      <div className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 mb-5">
                        <div className="shrink-0">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(referralLink)}`}
                            alt="Referral QR"
                            className="h-24 w-24 rounded-xl border border-purple-200 bg-white p-1.5 shadow-sm"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-purple-800 mb-1">Your Referral Link</p>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-purple-100 mb-3">
                            <p className="text-[11px] text-purple-600 truncate flex-1">{referralLink}</p>
                          </div>
                          {referralMsg && (
                            <p className={`mb-2 text-xs font-medium ${referralMsg.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
                              {referralMsg.text}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={handleCopyReferralLink}
                              className="flex items-center gap-1.5 rounded-xl bg-white border border-purple-200 px-3.5 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                              Copy Link
                            </button>
                            <button
                              type="button"
                              onClick={handleShareReferralLink}
                              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                              Share
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Not verified notice */}
                    {!isVerified && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100 mb-5">
                        <Icon.Warning className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-amber-800">Verification Required</p>
                          <p className="text-xs text-amber-700 mt-0.5">Complete KYC verification to unlock your referral link and start earning commissions.</p>
                        </div>
                      </div>
                    )}

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
                              onChange={(e) => setTreeSearchQuery(e.target.value)}
                              placeholder="Search name, username, email..."
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 bg-slate-50 text-slate-700 placeholder-slate-400"
                            />
                          </div>
                          <select
                            value={treeStatusFilter}
                            onChange={(e) => setTreeStatusFilter(e.target.value as TreeStatusFilter)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
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

                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs text-slate-500">
                            Showing <span className="font-semibold text-slate-700">{filteredReferralChildren.length}</span> direct referral{filteredReferralChildren.length !== 1 ? 's' : ''}
                          </p>
                          {treeSearchQuery && (
                            <button type="button" onClick={() => setTreeSearchQuery('')} className="text-xs text-orange-500 hover:text-orange-600 font-medium">
                              Clear search
                            </button>
                          )}
                        </div>

                        {filteredReferralChildren.length > 0 ? (
                          <div className="space-y-3">
                            {filteredReferralChildren.map((node) => renderReferralNodeFull(node))}
                          </div>
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
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAvatarPreviewOpen && data?.avatar_url && (
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
                  src={data.avatar_url}
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
