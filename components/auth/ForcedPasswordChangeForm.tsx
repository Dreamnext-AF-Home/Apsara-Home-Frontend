'use client';

import { useMemo, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useChangePasswordMutation } from '@/store/api/userApi';
import Loading from '@/components/Loading';

function getPasswordChecks(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-white/80">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-11 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-400/25 dark:border-white/20 dark:bg-white/12 dark:text-white dark:placeholder:text-white/50 dark:focus:border-sky-400/70 dark:focus:bg-white/18"
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 transition-colors hover:text-gray-700 dark:text-white/60 dark:hover:text-white/85"
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}

export default function ForcedPasswordChangeForm() {
  const router = useRouter();
  const { update: updateSession, data: session } = useSession();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const checks = useMemo(() => getPasswordChecks(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!Object.values(checks).every(Boolean)) {
      setError('Password must include uppercase, lowercase, number, and special character.');
      return;
    }

    try {
      await changePassword({
        current_password: '',
        new_password: password,
        new_password_confirmation: confirmPassword,
      }).unwrap();

      await updateSession?.({ passwordChangeRequired: false });
      setSuccess('Password updated successfully. Redirecting to shop...');
      setTimeout(() => router.replace('/shop'), 900);
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string; errors?: Record<string, string[]> } };
      const firstFieldError = Object.values(apiError?.data?.errors ?? {})[0]?.[0];
      setError(firstFieldError || apiError?.data?.message || 'Unable to update password.');
    }
  };

  return (
    <div>
      <h2 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Update Password</h2>
      <p className="mb-6 text-sm text-gray-500 dark:text-white/70">
        {session?.user?.email ? `Hi ${session.user.email}, ` : ''}
        set a new password first before entering the shop.
      </p>

      <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-800 shadow-sm dark:border-amber-300/35 dark:bg-amber-400/10 dark:text-amber-100 dark:shadow-[0_0_30px_rgba(251,191,36,0.08)]">
        Your old migrated password was accepted once. Create a new secure password to continue.
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="New Password"
          value={password}
          onChange={setPassword}
          placeholder="Create your new password"
        />

        <Field
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Confirm your new password"
        />

        <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4 shadow-inner shadow-slate-200/40 dark:border-white/10 dark:bg-white/[0.07] dark:shadow-white/[0.02]">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Password requirements</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-500 dark:text-white/70">
            <li className={checks.length ? 'text-emerald-600 dark:text-emerald-300' : ''}>At least 8 characters</li>
            <li className={checks.uppercase ? 'text-emerald-600 dark:text-emerald-300' : ''}>At least one uppercase letter</li>
            <li className={checks.lowercase ? 'text-emerald-600 dark:text-emerald-300' : ''}>At least one lowercase letter</li>
            <li className={checks.number ? 'text-emerald-600 dark:text-emerald-300' : ''}>At least one number</li>
            <li className={checks.special ? 'text-emerald-600 dark:text-emerald-300' : ''}>At least one special character</li>
          </ul>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 shadow-sm dark:border-red-400/20 dark:bg-red-500/20 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/20 dark:text-emerald-200">
            {success}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-bold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loading size={14} />
              <span>Updating password...</span>
            </>
          ) : (
            <span>Continue To Shop</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.sessionStorage.setItem('afhome-skip-login-redirect', '1');
            }
            signOut({ callbackUrl: '/login' });
          }}
          className="w-full text-sm font-semibold text-gray-500 transition hover:text-gray-900 dark:text-white/70 dark:hover:text-white"
        >
          Use a different account
        </button>
      </form>
    </div>
  );
}
