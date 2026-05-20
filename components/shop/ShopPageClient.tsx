'use client';

import { useEffect } from 'react';
import TopBar from '@/components/layout/TopBar';
import Navbar from '@/components/layout/Navbar';
import TrustBar from '@/components/layout/TrustBar';
import ShopBuilderSections, { type ShopBuilderApiResponse } from '@/components/sections/ShopBuilderSections';
import Footer from '@/components/landing-page/Footer';
import ScrollToTop from '@/components/landing-page/ScrollToTop';
import type { TopBarConfig } from '@/components/layout/TopBar';
import type { TrustBarConfig } from '@/components/layout/TrustBar';

type ShopPageClientProps = {
  shopData: ShopBuilderApiResponse | null;
  navbarCategories: any[];
  topBarConfig: TopBarConfig;
  trustBarConfig: TrustBarConfig;
};

const ShopPageClient = ({ shopData, navbarCategories, topBarConfig, trustBarConfig }: ShopPageClientProps) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const searchParams = new URLSearchParams(window.location.search);
    const refParam = searchParams.get('ref');

    if (!refParam) return;

    const appScheme = `apsarahome://shop?ref=${encodeURIComponent(refParam)}`;

    // Set a timeout to check if app doesn't open
    const appOpenTimeout = setTimeout(() => {
      console.log('[ShopPage] App not detected, staying on web');
    }, 500);

    // Try to open the app
    console.log('[ShopPage] Attempting to open app with scheme:', appScheme);
    window.location.href = appScheme;

    // Cleanup timeout
    return () => clearTimeout(appOpenTimeout);
  }, []);

  return (
    <div>
      <TopBar {...topBarConfig} />
      <Navbar initialCategories={navbarCategories} />
      <TrustBar {...trustBarConfig} />
      <ShopBuilderSections data={shopData} />
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default ShopPageClient;
