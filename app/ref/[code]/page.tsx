import { buildPageMetadata } from '@/app/seo';
import ReferralLandingPage from '@/components/referrals/ReferralLandingPage';

type ReferralPageProps = {
  params: Promise<{ code: string }>;
};

async function fetchReferrerProfile(username: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_LARAVEL_API_URL || process.env.LARAVEL_API_URL;
    if (!apiUrl) return null;

    const response = await fetch(`${apiUrl}/api/public/profile/${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('[ReferralPage] Failed to fetch referrer profile:', error);
    return null;
  }
}

function normalizeAvatarUrl(value?: string | null): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const unquoted = raw.replace(/^['"]|['"]$/g, '');
  const unescaped = unquoted
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
    .trim();

  if (!unescaped) return '';

  if (unescaped.startsWith('http://')) {
    return `https://${unescaped.slice('http://'.length)}`;
  }

  return unescaped;
}

export async function generateMetadata({ params }: ReferralPageProps) {
  const { code } = await params;
  const normalizedCode = decodeURIComponent(code).trim();

  let profileImage: string | undefined;
  try {
    const profile = await fetchReferrerProfile(normalizedCode);
    if (profile?.avatar_url) {
      profileImage = normalizeAvatarUrl(profile.avatar_url);
    }
  } catch (error) {
    console.error('[ReferralPage] Error fetching profile image:', error);
  }

  return buildPageMetadata({
    title: `Referral from ${normalizedCode}`,
    description: 'Open an AF Home referral link and continue with sign up or shopping.',
    path: `/ref/${code}`,
    image: profileImage,
  });
}

export default async function ReferralPage({ params }: ReferralPageProps) {
  const { code } = await params;

  return <ReferralLandingPage referralCode={decodeURIComponent(code)} />;
}
