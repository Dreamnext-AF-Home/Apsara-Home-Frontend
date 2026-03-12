import { buildPageMetadata } from '@/app/seo';
import ReferralLandingPage from '@/components/referrals/ReferralLandingPage';

type ReferralPageProps = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({ params }: ReferralPageProps) {
  const { code } = await params;

  return buildPageMetadata({
    title: `Referral from ${code}`,
    description: 'Open an AF Home referral link and continue with sign up or shopping.',
    path: `/ref/${code}`,
  });
}

export default async function ReferralPage({ params }: ReferralPageProps) {
  const { code } = await params;

  return <ReferralLandingPage referralCode={decodeURIComponent(code)} />;
}
