import { buildPageMetadata } from '@/app/seo';
import LevelUpPage from '@/components/profile/LevelUpPage';
import { authOptions } from '@/libs/auth';
import { getNavbarCategories } from '@/libs/serverStorefront';
import type { MeResponse } from '@/store/api/userApi';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export const metadata = buildPageMetadata({
  title: 'Level Up',
  description: 'Celebrate your new affiliate level on AF Home.',
  path: '/profile/level-up',
  noIndex: true,
});

export const dynamic = 'force-dynamic';

async function getInitialProfile(): Promise<MeResponse | null> {
  const session = await getServerSession(authOptions);
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken;

  if (!accessToken) return null;

  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL;
  if (!apiUrl) return null;

  try {
    const res = await fetch(`${apiUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;

    return (await res.json()) as MeResponse;
  } catch {
    return null;
  }
}

export default async function LevelUpRoute({
  searchParams,
}: {
  searchParams?: Promise<{ rank?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const session = await getServerSession(authOptions);
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  const role = String((session?.user as { role?: string } | undefined)?.role ?? '').toLowerCase();
  const isCustomer = role === 'customer' || role === '';

  if (!accessToken || !isCustomer) {
    const callback = params.rank ? `/profile/level-up?rank=${encodeURIComponent(params.rank)}` : '/profile/level-up';
    redirect(`/login?callback=${encodeURIComponent(callback)}`);
  }

  const initialProfile = await getInitialProfile();
  const initialCategories = await getNavbarCategories();
  const rank = Number(params.rank ?? initialProfile?.rank ?? 1);

  return (
    <LevelUpPage
      initialProfile={initialProfile}
      initialCategories={initialCategories}
      rank={Number.isFinite(rank) ? rank : 1}
    />
  );
}
