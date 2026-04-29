import { buildPageMetadata } from '@/app/seo';
import FaqPageClient from '@/components/faq/FaqPageClient';

export const metadata = buildPageMetadata({
  title: 'FAQ',
  description: 'Frequently Asked Questions about AF Home - Orders, payments, shipping, returns, and more.',
  path: '/faq',
});

export default function FaqPage() {
  return <FaqPageClient />;
}