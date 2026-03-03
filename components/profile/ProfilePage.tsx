'use client';

import { useMeQuery, useUpdateProfileMutation } from '@/store/api/userApi';
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

// ─── Types ────────────────────────────────────────────────────────────────────

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

type Tab = 'profile' | 'security' | 'preferences' | 'wallet' | 'encashment' | 'activity';

type AlertMsg = { type: 'success' | 'error'; text: string };

const ProfilePage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { data } = useMeQuery();
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
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const hasChanges = useMemo(
    () =>
      form.name !== (data?.name ?? session?.user?.name ?? '') ||
      form.phone !== (data?.phone ?? '') ||
      form.username !== (data?.username ?? ''),
    [data, form.name, form.phone, form.username, session?.user?.name],
  );

  const completion = useMemo(() => {
    const checks = [
      Boolean(form.name.trim()),
      Boolean(form.email.trim()),
      Boolean(form.phone.trim()),
      Boolean(form.username.trim()),
      Boolean(bio.trim()),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [bio, form]);

  const onChange = (field: keyof ProfileFormState) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const togglePref = (field: keyof PreferencesState) =>
    setPrefs((prev) => (typeof prev[field] === 'boolean' ? { ...prev, [field]: !prev[field] } : prev));

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
    { key: 'wallet', label: 'Wallet', Icon: Icon.Activity },
    { key: 'encashment', label: 'Encashment', Icon: Icon.Bag },
    { key: 'activity', label: 'Activity', Icon: Icon.Activity },
  ];

  const initials = (form.name || session?.user?.name || 'A')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  const pwStrength = getPasswordStrength(security.newPassword);


  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden bg-gradient-to-b from-orange-50/60 via-white to-white min-h-screen"
    >
      {/* Background blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl" />
      <div className="pointer-events-none absolute top-0 right-0 h-56 w-56 rounded-full bg-amber-200/25 blur-3xl" />

      <div className="container mx-auto px-4 py-8 md:py-10">
        {/* Header */}
        <div className="mb-7">
          <p className="text-xs font-semibold tracking-[0.22em] text-orange-500 uppercase">Account Center</p>
          <h1 className="mt-1.5 text-2xl md:text-3xl font-extrabold text-gray-900">My Profile</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your personal info, security, and preferences.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <aside className="xl:col-span-4 space-y-4">
            {/* Avatar card */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="rounded-2xl border border-orange-100 bg-white shadow-[0_10px_40px_-18px_rgba(249,115,22,0.5)] p-5"
            >
              <div className="flex flex-col items-center text-center gap-3">
                {/* Avatar */}
                <div className="relative group">
                  <div className="h-20 w-20 rounded-full bg-linear-to-br from-orange-400 to-amber-500 text-white text-2xl font-extrabold flex items-center justify-center shadow-lg ring-4 ring-orange-100">
                    {initials}
                  </div>
                  <button
                    type="button"
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Change photo"
                  >
                    <Icon.Camera className="h-5 w-5 text-white" />
                  </button>
                </div>

                <div>
                  <h2 className="text-base font-bold text-gray-900 leading-tight">
                    {form.name || 'AF Home User'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">{form.email || '—'}</p>
                  {form.username && (
                    <span className="mt-1.5 inline-block text-xs px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 font-medium">
                      @{form.username}
                    </span>
                  )}
                </div>

                {/* Loyalty badge */}
                <TierBadge tier={loyaltyTier} className="px-3 py-1" />
              </div>

              {/* Profile completion */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>Profile Completion</span>
                  <span className="font-semibold text-gray-700">{completion}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <motion.div
                    className="h-full bg-linear-to-r from-orange-400 to-amber-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${completion}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                {completion < 100 && (
                  <p className="mt-1.5 text-[11px] text-gray-400">
                    {completion < 60 ? 'Fill in your details to unlock all features.' : 'Almost there — just a few fields left.'}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Account stats */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="rounded-2xl border border-gray-200 bg-white p-5"
            >
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Account Snapshot</h3>
              <div className="grid grid-cols-2 gap-2">
                {accountStats.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className="group rounded-xl border border-gray-100 bg-gray-50 hover:border-orange-200 hover:bg-orange-50 px-3 py-3 text-left transition-colors"
                  >
                    <item.Icon className="h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    <p className="text-lg font-bold text-gray-800 mt-1.5 leading-none">{item.value}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{item.label}</p>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Tab navigation */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="rounded-2xl border border-gray-200 bg-white p-3"
            >
              <nav className="space-y-1">
                {TABS.map(({ key, label, Icon: TabIcon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === key
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <TabIcon className="h-4 w-4" />
                      {label}
                    </span>
                    <Icon.ChevronRight className={`h-3.5 w-3.5 transition-opacity ${activeTab === key ? 'opacity-60' : 'opacity-0'}`} />
                  </button>
                ))}
              </nav>
            </motion.div>

            {/* Quick actions */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="rounded-2xl border border-gray-200 bg-white p-5"
            >
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Quick Actions</h3>
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
                    className="group w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-orange-50 hover:text-orange-600 text-sm font-medium text-gray-700 transition-colors"
                  >
                    <item.Icon className="h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </aside>

          {/* ── Main content ─────────────────────────────────────────────── */}
          <div className="xl:col-span-8 space-y-5">
            <AnimatePresence mode="wait">
              {/* ── Profile tab ── */}
              {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-5">

                  {/* Personal info form */}
                  <form onSubmit={handleSaveProfile} className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">Personal Information</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Update your name, username, and contact details.</p>
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
                        { field: 'email' as const, label: 'Email Address', type: 'email', placeholder: 'Email', disabled: true },
                        { field: 'phone' as const, label: 'Phone Number', type: 'tel', placeholder: '09XXXXXXXXX', disabled: false },
                      ].map(({ field, label, type, placeholder, disabled }) => (
                        <div key={field} className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                            {label}
                            {disabled && (
                              <span className="normal-case tracking-normal font-normal text-[11px] text-gray-400 ml-1">(cannot change)</span>
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
                                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                : 'border-gray-200 text-gray-800 bg-white hover:border-gray-300'
                            }`}
                          />
                        </div>
                      ))}

                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bio</label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={3}
                          maxLength={200}
                          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 resize-none"
                          placeholder="Tell us something about your style, home setup, or shopping preferences"
                        />
                        <p className="text-[11px] text-gray-400 text-right">{bio.length}/200</p>
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
                          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
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
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">Saved Addresses</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Your shipping and billing locations.</p>
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
                        <div key={addr.id} className="group relative rounded-xl border border-gray-100 bg-gray-50 hover:border-orange-200 hover:bg-orange-50/30 p-4 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">{addr.label}</p>
                              {addr.isDefault && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium">Default</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button type="button" className="p-1 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-100 transition-colors">
                                <Icon.Edit className="h-3.5 w-3.5" />
                              </button>
                              <button type="button" className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                <Icon.Trash className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="mt-2.5 text-sm font-semibold text-gray-900">{addr.recipient}</p>
                          <p className="text-xs text-gray-500">{addr.phone}</p>
                          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{addr.full}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Security tab ── */}
              {activeTab === 'security' && (
                <motion.div key="security" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-5">

                  <form onSubmit={handleChangePassword} className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
                    <div className="mb-5">
                      <h3 className="text-base font-bold text-gray-900">Change Password</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Use a strong, unique password for your account.</p>
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
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Password</label>
                        <PasswordInput
                          value={security.currentPassword}
                          onChange={(e) => setSecurity((p) => ({ ...p, currentPassword: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New Password</label>
                        <PasswordInput
                          value={security.newPassword}
                          onChange={(e) => setSecurity((p) => ({ ...p, newPassword: e.target.value }))}
                          placeholder="Min. 8 characters"
                        />
                        {/* Password strength bar */}
                        {pwStrength && (
                          <div className="mt-2 space-y-1">
                            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${pwStrength.color}`}
                                initial={{ width: 0 }}
                                animate={{ width: pwStrength.pct }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                            <p className="text-[11px] text-gray-500">
                              Strength: <span className="font-semibold text-gray-700">{pwStrength.label}</span>
                              {' — '}Use uppercase, numbers &amp; symbols for a stronger password.
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Confirm New Password</label>
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
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
                    <h3 className="text-base font-bold text-gray-900 mb-4">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center ${prefs.twoFactorEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                          <Icon.Shield className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Authenticator App</p>
                          <p className="text-xs text-gray-500 mt-0.5">
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
                    <p className="text-xs text-gray-500 mb-4">These actions are irreversible. Please be certain before proceeding.</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Sign Out</p>
                          <p className="text-xs text-gray-500">Sign out from your account on this device.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => signOut({ callbackUrl: '/login' })}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
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

              {/* ── Preferences tab ── */}
              {activeTab === 'preferences' && (
                <motion.div key="preferences" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-5">

                  <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
                    <div className="mb-5">
                      <h3 className="text-base font-bold text-gray-900">Notifications</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Choose how you&apos;d like to be updated.</p>
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
                          className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 px-4 py-3.5 hover:border-gray-200 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                          </div>
                          <Toggle
                            checked={prefs[item.key] as boolean}
                            onChange={() => togglePref(item.key)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
                    <div className="mb-5">
                      <h3 className="text-base font-bold text-gray-900">Display & Regional</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Customize your language and currency experience.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Language</label>
                        <select
                          value={prefs.language}
                          onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value as 'en' | 'fil' }))}
                          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                        >
                          <option value="en">🌐 English</option>
                          <option value="fil">🇵🇭 Filipino</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Currency</label>
                        <select
                          value={prefs.currency}
                          onChange={(e) => setPrefs((p) => ({ ...p, currency: e.target.value as 'PHP' | 'USD' }))}
                          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                        >
                          <option value="PHP">₱ Philippine Peso (PHP)</option>
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

              {/* ── Activity tab ── */}
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

              {activeTab === 'activity' && (
                <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-5">
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
                    <div className="mb-5">
                      <h3 className="text-base font-bold text-gray-900">Recent Activity</h3>
                      <p className="text-xs text-gray-500 mt-0.5">A log of your recent account actions.</p>
                    </div>
                    <div className="space-y-2">
                      {recentActivity.map((item, i) => (
                        <motion.div
                          key={item.title}
                          variants={fadeUp}
                          initial="hidden"
                          animate="visible"
                          custom={i}
                          className="flex items-start gap-3.5 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3.5 hover:border-gray-200 transition-colors"
                        >
                          <div className="mt-0.5 h-7 w-7 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
                            {getActivityIcon(item.title)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Login sessions (placeholder) */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-gray-900">Active Sessions</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Devices currently logged into your account.</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-500 flex items-center justify-center">
                          <Icon.Shield className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Current Device</p>
                          <p className="text-xs text-gray-500">Windows · Chrome · Manila, PH</p>
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
    </motion.section>
  );
};

export default ProfilePage;
