'use client';

import { useState, useEffect, useRef } from 'react';

export default function AppPromoBar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = currentScrollY - lastScrollYRef.current;

      if (scrollDifference > 50) {
        // Scrolling down - hide banner
        setIsVisible(false);
      } else if (scrollDifference < -30) {
        // Scrolling up - show banner
        setIsVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isOpen) return null;

  const handleOpenApp = () => {
    if (typeof window === 'undefined') return;

    const appScheme = 'apsarahome://home';
    const appStoreLink = 'https://apps.apple.com/ph/app/afhome/id1234567890';
    const playStoreLink = 'https://play.google.com/store/apps/details?id=com.afhome.mobile';

    console.log('[AppPromoBar] Attempting to open app');
    window.location.href = appScheme;

    const fallbackTimeout = setTimeout(() => {
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        window.location.href = appStoreLink;
      } else if (userAgent.includes('android')) {
        window.location.href = playStoreLink;
      }
    }, 2000);

    return () => clearTimeout(fallbackTimeout);
  };

  return (
    <div
      className="sticky top-0 z-10 md:hidden bg-gradient-to-r from-[#ef7f1a] to-[#d96f10] text-white px-4 py-2 transition-all duration-300 ease-in-out overflow-hidden"
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <path d="M6 19v-3m0-6v6m4-10v10m4-6v6m0-4v4" />
          </svg>
          <p className="text-xs font-medium truncate">Get a better experience with our mobile app</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleOpenApp}
            className="bg-white text-[#ef7f1a] px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            Open App
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20 p-1 rounded transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
