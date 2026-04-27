import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import MembersPageMain from "@/components/superAdmin/members/MembersPageMain";
import { buildPageMetadata } from '@/app/seo';
import { adminAuthOptions } from "@/libs/adminAuth";
import type { MembersResponse, MembersStatsResponse } from "@/store/api/membersApi";

export const metadata = buildPageMetadata({ title: 'Admin Members', description: 'Browse the Admin Members page on AF Home.', path: '/admin/members', noIndex: true });
export const dynamic = 'force-dynamic';

async function fetchAdminJson<T>(path: string, accessToken: string): Promise<T | null> {
  const baseUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL;
  if (!baseUrl || !accessToken) {
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export default async function AdminMembersPage() {
  const session = await getServerSession(adminAuthOptions);

  if (!session?.user) {
    redirect("/admin/login");
  }

  const accessToken = String(session.user.accessToken ?? '');

  const [initialData, initialStats] = accessToken
    ? await Promise.all([
        fetchAdminJson<MembersResponse>('/api/admin/members?page=1&per_page=7', accessToken),
        fetchAdminJson<MembersStatsResponse>('/api/admin/members/stats?period=7d', accessToken),
      ])
    : [null, null];

  return <MembersPageMain initialData={initialData} initialStats={initialStats} />;
}
