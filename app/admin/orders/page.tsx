import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import AdminOrdersPageMain from "@/components/superAdmin/orders/AdminOrdersPageMain";
import { buildPageMetadata } from '@/app/seo';
import { adminAuthOptions } from "@/libs/adminAuth";
import type { AdminOrdersResponse } from "@/store/api/adminOrdersApi";

export const metadata = buildPageMetadata({ title: 'Admin Orders', description: 'Browse the Admin Orders page on AF Home.', path: '/admin/orders', noIndex: true });
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

export default async function AdminOrdersPage() {
  const session = await getServerSession(adminAuthOptions);

  if (!session?.user) {
    redirect("/admin/login");
  }

  const accessToken = String(session.user.accessToken ?? '');
  const initialData = accessToken
    ? await fetchAdminJson<AdminOrdersResponse>('/api/admin/orders?filter=all&page=1&per_page=20', accessToken)
    : null;

  return <AdminOrdersPageMain initialFilter="all" initialData={initialData} />;
}
