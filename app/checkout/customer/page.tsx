import { buildPageMetadata } from '@/app/seo';
import CustomerCheckoutMain from "@/components/checkout/customer/CustomerCheckoutMain";
import { getNavbarCategories } from '@/libs/serverStorefront';

export const metadata = buildPageMetadata({ title: 'Checkout Customer', description: 'Browse the Checkout Customer page on AF Home.', path: '/checkout/customer', noIndex: true });

const CustomerPage = async () => {
  const navbarCategories = await getNavbarCategories();
  return (
    <CustomerCheckoutMain initialCategories={navbarCategories} />
  )
}

export default CustomerPage;
