import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/app/seo';
import CustomerCheckoutMain from '@/components/checkout/customer/CustomerCheckoutMain';
import { getNavbarCategories } from '@/libs/serverStorefront';
import { getPartnerStorefrontConfig } from '@/libs/partnerStorefront';
import { getPartnerStorefrontBySlug } from '@/libs/partnerStorefrontServer';
import { normalizeReferralCode } from '@/libs/referral';
import type { WebPageItem } from '@/store/api/webPagesApi';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ partner: string }>
}

type PublicWebPageItemsResponse = {
  items?: WebPageItem[]
}
const BLANK_FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"

async function getStorefrontReferralCode(partnerSlug: string): Promise<string> {
  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL;
  if (!apiUrl) return '';

  try {
    const response = await fetch(`${apiUrl}/api/web-pages/partner-storefronts`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) return '';

    const json = (await response.json()) as PublicWebPageItemsResponse;
    const storefront = (json.items ?? []).find((item) => {
      const config = getPartnerStorefrontConfig(item);
      return config?.slug === partnerSlug;
    });
    const config = getPartnerStorefrontConfig(storefront);
    return normalizeReferralCode(config?.domainLink ?? config?.referralLink ?? '');
  } catch {
    return '';
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { partner } = await params;
  const normalizedPartner = partner.trim().toLowerCase();
  const storefront = await getPartnerStorefrontBySlug(normalizedPartner);

  const metadata = buildPageMetadata({
    title: 'Checkout',
    description: storefront?.displayName
      ? `Complete your checkout for ${storefront.displayName} orders.`
      : 'Complete your checkout.',
    path: `/${normalizedPartner}/checkout/customer`,
    noIndex: true,
    siteName: storefront?.displayName || 'AF Home',
  });

  return {
    ...metadata,
    icons: storefront?.tabLogoUrl || storefront?.logoUrl
      ? {
        icon: [{ url: storefront.tabLogoUrl || storefront.logoUrl || '', type: 'image/png' }],
        apple: storefront.tabLogoUrl || storefront.logoUrl || '',
      }
      : {
        icon: [{ url: BLANK_FAVICON, type: 'image/svg+xml' }],
        apple: BLANK_FAVICON,
      },
  };
}

export default async function PartnerCustomerCheckoutPage({ params }: PageProps) {
  const { partner } = await params;
  const normalizedPartner = partner.trim().toLowerCase();

  const storefront = await getPartnerStorefrontBySlug(normalizedPartner);
  if (!storefront) {
    notFound();
  }

  const [navbarCategories, storefrontReferralCode] = await Promise.all([
    getNavbarCategories(),
    getStorefrontReferralCode(normalizedPartner),
  ]);

  return (
    <CustomerCheckoutMain
      initialCategories={navbarCategories}
      storefrontPartner={normalizedPartner}
      storefrontReferralCode={storefrontReferralCode}
      storefrontDisplayName={storefront.displayName}
      storefrontLogoUrl={storefront.logoUrl || undefined}
      storefrontTabLogoUrl={storefront.tabLogoUrl || undefined}
    />
  );
}
