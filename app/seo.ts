import type { Metadata } from 'next';

const RAW_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://afhome.ph';
const SITE_URL = RAW_SITE_URL.startsWith('http') ? RAW_SITE_URL : `https://${RAW_SITE_URL}`;

export function buildPageMetadata(input: {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  siteName?: string;
}): Metadata {
  const siteName = (input.siteName ?? 'AF Home').trim() || 'AF Home';
  const fullTitle = siteName ? `${input.title} | ${siteName}` : input.title;
  const canonicalPath = input.path || '/';
  const canonicalUrl = canonicalPath.startsWith('http')
    ? canonicalPath
    : `${SITE_URL}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;

  const imageUrl = input.image?.startsWith('http')
    ? input.image
    : input.image
    ? `${SITE_URL}${input.image.startsWith('/') ? input.image : `/${input.image}`}`
    : `${SITE_URL}/Images/af_home_logo.png`;

  return {
    title: fullTitle,
    description: input.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: fullTitle,
      description: input.description,
      url: canonicalUrl,
      siteName,
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: input.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: input.description,
      images: [imageUrl],
    },
    robots: input.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
