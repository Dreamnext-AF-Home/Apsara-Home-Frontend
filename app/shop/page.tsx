import { buildPageMetadata } from '@/app/seo';

export const metadata = buildPageMetadata({ title: 'Shop', description: 'Browse the Shop page on AF Home.', path: '/shop' });

import TawkToWidget from "@/components/integrations/TawkToWidget"
import Footer from "@/components/layout/Footer"
import Navbar from "@/components/layout/Navbar"
import TopBar from "@/components/layout/TopBar"
import TrustBar from "@/components/layout/TrustBar"
import DynamicWebContent from "@/components/sections/DynamicWebContent"
import FeaturedSections from "@/components/sections/FeaturedSections"
import HeroSection from "@/components/sections/HeroSection"
import NewsLetter from "@/components/sections/NewsLetter"
import PromoBenners from "@/components/sections/PromoBenners"

const ShopPage = () => {
  return (
    <div>
      <TopBar />
      <Navbar />
      <TrustBar />
      <DynamicWebContent />
      <HeroSection />
      <FeaturedSections />
      <PromoBenners />
      <NewsLetter />
      <Footer />
      <TawkToWidget />
    </div>
  )
}

export default ShopPage
