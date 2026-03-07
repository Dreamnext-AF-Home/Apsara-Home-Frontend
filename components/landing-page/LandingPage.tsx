"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import Header from "@/components/landing-page/Header";
import HeroSection from "@/components/landing-page/HeroSection";
import ExperienceSection from "@/components/landing-page/ExperienceSection";
import QuickViewModal from "@/components/landing-page/QuickViewModal";
import Testimonials from "@/components/landing-page/Testimonials";
import Newsletter from "@/components/landing-page/Newsletter";
import Footer from "@/components/landing-page/Footer";
import ProductsBrandsSection from "@/components/landing-page/ProductsBrandsSection";
import CommissionSection from "@/components/landing-page/CommissionSection";
import LifetimeBenefitsSection from "@/components/landing-page/LifetimeBenefitsSection";
import TeamSection from "@/components/landing-page/TeamSection";
import TrainingSupportSection from "@/components/landing-page/TrainingSupportSection";
import TargetAudienceSection from "@/components/landing-page/TargetAudienceSection";
import CTASection from "@/components/landing-page/CTASection";
import HowItWorksSection from "@/components/landing-page/HowItWorksSection";
import ScrollToTop from "@/components/landing-page/ScrollToTop";
import type { Product } from "@/components/landing-page/ProductCard";

export default function LandingPage() {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const handleCloseQuickView = () => {
    setIsQuickViewOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  const handleAddToCart = (_product: Product, quantity: number) => {
    setCartCount((prev) => prev + quantity);
  };

  const handleCartClick = () => {
    router.push("/shop");
  };

  return (
    <div className="min-h-screen bg-af-cream">
      <div className="fixed inset-0 noise-overlay pointer-events-none z-[100]" />

      <Header cartCount={cartCount} onCartClick={handleCartClick} />

      <main>
        <HeroSection />
        <ExperienceSection />
        <HowItWorksSection />
        <ProductsBrandsSection />
        <CommissionSection />
        <LifetimeBenefitsSection />
        <TeamSection />
        <TrainingSupportSection />
        <TargetAudienceSection />
        <CTASection />
        <Testimonials />
        <Newsletter />
      </main>

      <Footer />
      <ScrollToTop />

      <AnimatePresence>
        <QuickViewModal
          product={selectedProduct}
          isOpen={isQuickViewOpen}
          onClose={handleCloseQuickView}
          onAddToCart={handleAddToCart}
        />
      </AnimatePresence>
    </div>
  );
}

