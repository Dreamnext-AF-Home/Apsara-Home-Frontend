import LandingPage from "@/components/landing-page/LandingPage";
import { buildPageMetadata } from '@/app/seo';

export const metadata = buildPageMetadata({
  title: 'Home',
  description: 'Discover premium furniture, appliances, and inspired spaces on AF Home.',
  path: '/',
});

export default function Home() {
  return <LandingPage />;
}
