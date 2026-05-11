'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Menu, X, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ui/buttons/ThemeToggle';

interface HeaderProps {
  cartCount: number;
  hideNavLinks?: boolean;
  logoUrl?: string;
  logoAlt?: string;
  logoHref?: string;
  shopHref?: string;
}

export default function Header({
  cartCount,
  hideNavLinks = false,
  logoUrl = '/Images/af_home_logo.png',
  logoAlt = 'AFhome Logo',
  logoHref = '/',
  shopHref = '/shop',
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const { status } = useSession();
  const pathname = usePathname();
  const isHome = pathname === '/';
  const userHref = status === 'authenticated' ? '/profile' : '/login';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isHome) return;
    const sectionIds = ['ecosystem', 'earnings', 'benefits', 'team', 'training'];
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
            history.replaceState(null, '', `#${id}`);
          }
        },
        { threshold: 0.3 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    const handleScroll = () => {
      if (window.scrollY < 100) {
        setActiveSection('');
        history.replaceState(null, '', '/');
      }
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      observers.forEach((o) => o.disconnect());
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHome]);

  const rawNavLinks = [
    { name: 'Home', href: '/' },
    { name: 'Ecosystem', href: '#ecosystem' },
    { name: 'Earnings', href: '#earnings' },
    { name: 'Benefits', href: '#benefits' },
    { name: 'Team', href: '#team' },
    { name: 'Training', href: '#training' },
  ];

  const navLinks = rawNavLinks.map((link) => ({
    ...link,
    href: !isHome && link.href.startsWith('#') ? `/${link.href}` : link.href,
  }));

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
        ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-soft'
        : 'bg-transparent'
        }`}
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-20 px-4">
          {/* Logo */}
          <motion.a
            href={logoHref}
            className="flex items-center shrink-0"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <img
              src={logoUrl}
              alt={logoAlt}
              className="h-10 w-auto object-contain"
            />
          </motion.a>

          {/* Desktop Navigation - Centered */}
          <nav className={`${hideNavLinks ? 'hidden' : 'hidden md:flex'} items-center gap-8 absolute left-1/2 -translate-x-1/2`}>
            {navLinks.map((link, index) => {
              const sectionId = link.href.replace(/^\/?#/, '');
              const isActive = link.href === '/'
                ? isHome && activeSection === ''
                : isHome && activeSection === sectionId;

              return (
                <motion.a
                  key={link.name}
                  href={link.href}
                  className={`font-medium text-[15px] relative group transition-all duration-300
                    ${isActive
                      ? 'text-amber-500'
                      : (isScrolled || !isHome)
                        ? 'text-black dark:text-white hover:text-amber-500'
                        : 'text-white hover:text-amber-400'
                    }`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  whileHover={{ y: -2 }}
                >
                  {link.name}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-amber-500 transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                </motion.a>
              );
            })}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-4 shrink-0">
            {/* User Icon with href */}
            <div className="relative group">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 transition-colors ${(isScrolled || !isHome) ? 'text-black dark:text-white' : 'text-white'}`}
              >
                <Link href={userHref} aria-label="User account">
                  <User size={20} />
                </Link>
              </motion.div>
              <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap rounded-lg bg-gray-900/90 px-2.5 py-1 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                {status === 'authenticated' ? 'My Account' : 'Login'}
              </span>
            </div>

            {/* Shopping Bag Icon with href */}
            <div className="relative group">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`relative p-2 transition-colors ${(isScrolled || !isHome) ? 'text-black dark:text-white' : 'text-white'}`}
              >
                <Link href={shopHref} aria-label="Browse shop" className="block">
                  <ShoppingBag size={20} />
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-af-brass text-white text-xs font-bold rounded-full flex items-center justify-center"
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
              <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap rounded-lg bg-gray-900/90 px-2.5 py-1 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                Browse Shop
              </span>
            </div>

            {/* Divider */}
            <span className={`h-5 w-px ${(isScrolled || !isHome) ? 'bg-gray-300 dark:bg-gray-600' : 'bg-white/30'}`} />

            {/* Dark mode toggle */}
            <ThemeToggle isScrolled={isScrolled} isHome={isHome} />

            {/* Hamburger Menu - Visible only on mobile */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden p-2 transition-colors ${(isScrolled || !isHome) ? 'text-black dark:text-white' : 'text-white'}`}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && !hideNavLinks && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-af-cream dark:border-gray-700"
          >
            <nav className="flex flex-col p-6 gap-4">
              {navLinks.map((link, index) => {
                const sectionId = link.href.replace(/^\/?#/, '');
                const isActive = link.href === '/'
                  ? isHome && activeSection === ''
                  : isHome && activeSection === sectionId;

                return (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`font-medium text-lg py-2 transition-colors duration-200 ${isActive ? 'text-amber-500' : 'text-af-text dark:text-gray-100 hover:text-amber-500'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </motion.a>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

