import { buildPageMetadata } from '@/app/seo';
import GuestTrackOrderPage from '@/components/orders/GuestTrackOrderPage';

export const metadata = buildPageMetadata({
  title: 'Track Order',
  description: 'Track your AF Home guest order using your order number and checkout contact details.',
  path: '/track-order',
});

export default function TrackOrderPage() {
  return <GuestTrackOrderPage />;
}
