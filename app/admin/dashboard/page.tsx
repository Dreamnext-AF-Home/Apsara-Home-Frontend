import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import AdminDashboardHome from "@/components/superAdmin/dashboard/AdminDashboardHome";
import SupplierDashboardHome from "@/components/superAdmin/dashboard/SupplierDashboardHome";
import type { StatsGridInitialData } from "@/components/superAdmin/dashboard/statsGridTypes";
import { buildPageMetadata } from '@/app/seo';
import { adminAuthOptions } from "@/libs/adminAuth";
import type { AdminOrdersResponse } from "@/store/api/adminOrdersApi";
import type { AdminPaymentsOverviewResponse } from "@/store/api/adminPaymentsApi";
import type { ExpensesSummaryResponse } from "@/store/api/expensesApi";
import type { MembersStatsResponse } from "@/store/api/membersApi";
import type { SupplierStatsResponse } from "@/store/api/suppliersApi";

export const metadata = buildPageMetadata({ title: 'Admin Dashboard', description: 'Browse the Admin Dashboard page on AF Home.', path: '/admin/dashboard', noIndex: true });
export const dynamic = 'force-dynamic';

const dateKey = (value: Date) => {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const monthRange = (offsetMonths: number) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offsetMonths + 1, 0);
  return { from: dateKey(start), to: dateKey(end) };
};

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

async function loadInitialStatsData(accessToken: string): Promise<StatsGridInitialData> {
  const currentMonth = monthRange(0);
  const lastMonth = monthRange(-1);

  const [
    ordersData,
    membersStats,
    paymentsOverview,
    supplierStats,
    currentExpenses,
    lastExpenses,
  ] = await Promise.all([
    fetchAdminJson<AdminOrdersResponse>('/api/admin/orders?filter=all&page=1&per_page=1', accessToken),
    fetchAdminJson<MembersStatsResponse>('/api/admin/members/stats?period=7d', accessToken),
    fetchAdminJson<AdminPaymentsOverviewResponse>('/api/admin/payments/overview', accessToken),
    fetchAdminJson<SupplierStatsResponse>('/api/admin/suppliers/stats', accessToken),
    fetchAdminJson<ExpensesSummaryResponse>(`/api/admin/expenses/summary?from=${currentMonth.from}&to=${currentMonth.to}&status=1`, accessToken),
    fetchAdminJson<ExpensesSummaryResponse>(`/api/admin/expenses/summary?from=${lastMonth.from}&to=${lastMonth.to}&status=1`, accessToken),
  ]);

  return {
    ordersData,
    membersStats,
    paymentsOverview,
    supplierStats,
    currentExpenses,
    lastExpenses,
  };
}

const AdminDashboardPage = async () => {
  const session = await getServerSession(adminAuthOptions);

  if (!session?.user) {
    redirect("/admin/login");
  }

  const role = String(session.user.role ?? '').toLowerCase();
  const userLevelId = Number(session.user.userLevelId ?? 0);
  const isSupplierAdmin = role === 'supplier_admin' || userLevelId === 8;

  if (isSupplierAdmin) {
    return <SupplierDashboardHome />;
  }

  const accessToken = String(session.user.accessToken ?? '');
  const initialStatsData = accessToken ? await loadInitialStatsData(accessToken) : undefined;

  return <AdminDashboardHome initialStatsData={initialStatsData} />;
};

export default AdminDashboardPage;
