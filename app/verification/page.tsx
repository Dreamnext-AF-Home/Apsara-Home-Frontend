import { buildPageMetadata } from '@/app/seo';
import VerificationOverviewPage from '@/components/verification/VerificationOverviewPage';

export const metadata = buildPageMetadata({
  title: 'Encashment Verification',
  description: 'Learn what is needed before submitting your AF Home encashment verification and payout request.',
  path: '/verification',
  noIndex: true,
});

export default function Page() {
  return <VerificationOverviewPage />;
}
