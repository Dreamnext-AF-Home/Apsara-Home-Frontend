'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGetPublicGeneralSettingsQuery } from '@/store/api/adminSettingsApi';
import {
  Facebook,
  Instagram,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
    </svg>
  );
}

// Helper function to safely get values, preferring fallbacks if API data is empty
const getSettingValue = (value: string | null | undefined, fallback: string): string => {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return fallback;
  }
  return value;
};

const footerLinks = {
  company: [
    { name: 'About us', href: '/about-us' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Terms and Conditions', href: '/terms-and-conditions' },
    { name: 'Income Disclaimer', href: '/income-disclaimer' },
    { name: 'Cookie Policy', href: '/cookie-policy' },
    { name: 'Rewards and Commissions', href: '/rewards-and-commissions' },
  ],
  support: [
    { name: 'Contact Us', href: '/contact-us' },
    { name: 'Our Branches', href: '/branches' },
    { name: 'FAQs', href: '/faq' },
    { name: 'Shipping Info', href: '/shipping-info' },
    { name: 'Returns', href: '/returns' },
  ],
};

const socialLinks = [
  { icon: Facebook, href: 'https://www.facebook.com/AFHomePH/', label: 'Facebook' },
  { icon: Instagram, href: 'https://www.instagram.com/afhome.ph/', label: 'Instagram' },
  { icon: TikTokIcon, href: 'https://www.tiktok.com/@afhomeph', label: 'TikTok' },
];

const paymentLogos = [
  { name: 'GCash', file: 'gcash.svg' },
  { name: 'Maya', file: 'maya.svg' },
  { name: 'Visa', file: 'visa.svg' },
  { name: 'Mastercard', file: 'mastercard.svg' },
  { name: 'BPI', file: 'bpi.svg' },
  { name: 'BDO', file: 'bdo.svg' },
  { name: 'Landbank', file: 'landbank.svg' },
  { name: 'UnionBank', file: 'unionbank.svg' },
  { name: 'Cash on Delivery', file: 'cod.svg' },
];

export default function Footer() {
  const pathname = usePathname();
  const { data } = useGetPublicGeneralSettingsQuery();
  const settings = data?.settings;

  // Use fallbacks when API returns empty/null values
  const contactNumber = getSettingValue(settings?.contact_number, '02-840 0290');
  const supportEmail = getSettingValue(settings?.support_email, 'info@afhome.biz');
  const address = getSettingValue(settings?.address, '88 Calavite St., Brgy Paang Bundok, La Loma, Quezon City, Philippines');
  const logoUrl = getSettingValue(settings?.logo_url, '/af_home_logo.png');

  // QR code can be null, so handle it separately
  const websiteQrCodeUrl = settings?.website_qr_code_url && settings.website_qr_code_url.trim() ? settings.website_qr_code_url : null;
  const branches = (() => {
    const raw = settings?.branches;
    if (!raw) return [] as { name: string; address: string }[];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item) => ({
          name: typeof item?.name === 'string' ? item.name : '',
          address: typeof item?.address === 'string' ? item.address : '',
        }))
        .filter((item) => item.name.trim() || item.address.trim());
    } catch {
      return [];
    }
  })();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <footer id="contact" className="bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-white">
      <div className="container mx-auto px-4 pt-16 md:pt-20 pb-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 md:gap-8"
        >
          {/* Brand Column */}
          <motion.div variants={itemVariants} className="col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-start gap-5 mb-6">
              {/* Logo Image */}
              <div className="flex-shrink-0">
                <img
                  src={logoUrl}
                  alt="AFhome Logo"
                  className="w-32 h-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/af_home_logo.png';
                  }}
                />
              </div>
              {websiteQrCodeUrl ? (
                <div className="flex-shrink-0">
                  <img
                    src={websiteQrCodeUrl}
                    alt="AF Home website QR code"
                    className="h-20 w-20 rounded-md object-contain border border-gray-300 dark:border-gray-700"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : null}
            </Link>
            <p className="text-gray-600 dark:text-white/70 text-sm leading-relaxed mb-6">
              AF Home is not just a store. It&apos;s a home ecosystem built to grow with you.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-gray-300/60 dark:bg-white/10 rounded-full flex items-center justify-center hover:bg-sky-500 hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Company Links */}
          <motion.div variants={itemVariants}>
            <h4 className="font-display font-semibold text-lg mb-6">Informations</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={`transition-colors text-sm ${
                      pathname === link.href
                        ? 'text-sky-500 dark:text-sky-400 font-semibold'
                        : 'text-gray-600 dark:text-white/70 hover:text-sky-500 dark:hover:text-sky-400'
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support Links */}
          <motion.div variants={itemVariants}>
            <h4 className="font-display font-semibold text-lg mb-6">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  {link.href.startsWith('/') ? (
                    <Link
                      href={link.href}
                      className={`transition-colors text-sm ${
                        pathname === link.href
                          ? 'text-sky-500 dark:text-sky-400 font-semibold'
                          : 'text-gray-600 dark:text-white/70 hover:text-sky-500 dark:hover:text-sky-400'
                      }`}
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-gray-600 dark:text-white/70 hover:text-sky-500 dark:hover:text-sky-400 transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Payments */}
          <motion.div variants={itemVariants} className="col-span-2 md:col-span-1">
            <h4 className="font-display font-semibold text-lg mb-3">Payments</h4>
            <p className="text-gray-600 dark:text-white/70 text-sm mb-4">We accept:</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              {paymentLogos.map((logo) => (
                <img
                  key={logo.name}
                  src={`/payment-logos/${logo.file}`}
                  alt={logo.name}
                  className="h-7 w-auto object-contain"
                  loading="lazy"
                  title={logo.name}
                />
              ))}
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div variants={itemVariants} className="col-span-2 md:col-span-1">
            <h4 className="font-display font-semibold text-lg mb-6">
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-sky-500 flex-shrink-0 mt-1" />
                <span className="text-gray-600 dark:text-white/70 text-sm">
                  {address}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-sky-500 flex-shrink-0" />
                <a
                  href={`tel:${contactNumber}`}
                  className="text-gray-600 dark:text-white/70 hover:text-sky-500 dark:hover:text-sky-400 transition-colors text-sm"
                >
                  {contactNumber}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-sky-500 flex-shrink-0" />
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-gray-600 dark:text-white/70 hover:text-sky-500 dark:hover:text-sky-400 transition-colors text-sm"
                >

                  {supportEmail}
                </a>
              </li>
            </ul>
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}  
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 pt-6 border-t border-gray-300 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-gray-500 dark:text-white/50 text-sm">
            © {new Date().getFullYear()} AFhome. All rights reserved.
          </p>
          <div className="flex gap-6">
            {[
              { label: 'Privacy Policy', href: '/privacy-policy' },
              { label: 'Terms and Conditions', href: '/terms-and-conditions' },
              { label: 'Cookie Policy', href: '/cookie-policy' },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm transition-colors ${
                  pathname === href
                    ? 'text-sky-500 dark:text-sky-400 font-semibold'
                    : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

