import { buildPageMetadata } from '@/app/seo';
import { authOptions } from '@/libs/auth';
import { getNavbarCategories } from '@/libs/serverStorefront';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export const metadata = buildPageMetadata({ title: 'Wishlist', description: 'Browse the Wishlist page on AF Home.', path: '/wishlist', noIndex: true });
export const dynamic = 'force-dynamic';

import Wishlist from "@/components/Wishlist"

async function Page() {
  const session = await getServerSession(authOptions);
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  const role = String((session?.user as { role?: string } | undefined)?.role ?? '').toLowerCase();
  const isCustomer = role === 'customer' || role === '';

  if (!accessToken || !isCustomer) {
    redirect(`/login?callback=${encodeURIComponent('/wishlist')}`);
  }

  const initialCategories = await getNavbarCategories();
  return <Wishlist initialCategories={initialCategories} />
}

export default Page
