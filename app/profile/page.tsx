import { buildPageMetadata } from '@/app/seo';
import ProfilePage from "@/components/profile/ProfilePage";
import { authOptions } from '@/libs/auth';
import type { MeResponse } from '@/store/api/userApi';
import { getServerSession } from 'next-auth';
import { getNavbarCategories } from '@/libs/serverStorefront';
import { redirect } from 'next/navigation';

export const metadata = buildPageMetadata({ title: 'Profile', description: 'Browse the Profile page on AF Home.', path: '/profile', noIndex: true });
export const dynamic = 'force-dynamic';

function buildProfileCallback(params: Record<string, string | string[] | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => search.append(key, entry));
    } else if (value) {
      search.set(key, value);
    }
  });

  const query = search.toString();
  return `/profile${query ? `?${query}` : ''}`;
}

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

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  const role = String((session?.user as { role?: string } | undefined)?.role ?? '').toLowerCase();
  const isCustomer = role === 'customer' || role === '';
  const params = (await searchParams) ?? {};

  if (!accessToken || !isCustomer) {
    redirect(`/login?callback=${encodeURIComponent(buildProfileCallback(params))}`);
  }

  const initialProfile = await getInitialProfile();
  const initialCategories = await getNavbarCategories();

  return <ProfilePage initialProfile={initialProfile} initialCategories={initialCategories} />
}
