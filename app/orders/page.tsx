import { buildPageMetadata } from '@/app/seo';
import OrdersPageMain from "@/components/orders/OrdersPageMain";
import { authOptions } from '@/libs/auth';
import { getNavbarCategories } from '@/libs/serverStorefront';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export const metadata = buildPageMetadata({ title: 'Orders', description: 'Browse the Orders page on AF Home.', path: '/orders', noIndex: true });
export const dynamic = 'force-dynamic';

async function Page() {
  const session = await getServerSession(authOptions);
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  const role = String((session?.user as { role?: string } | undefined)?.role ?? '').toLowerCase();
  const isCustomer = role === 'customer' || role === '';

  if (!accessToken || !isCustomer) {
    redirect(`/login?callback=${encodeURIComponent('/orders')}`);
  }

  const initialCategories = await getNavbarCategories();
  return <OrdersPageMain initialCategories={initialCategories} />
}

export default Page
