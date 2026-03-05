import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Facebook,
  Instagram,
  MapPin,
  Phone,
  Mail,
  Youtube,
} from 'lucide-react';

const footerLinks = {
  shop: [
    { name: 'Living Room', href: '#' },
    { name: 'Bedroom', href: '#' },
    { name: 'Dining', href: '#' },
    { name: 'Home Office', href: '#' },
    { name: 'Outdoor', href: '#' },
  ],
  company: [
    { name: 'Home', href: '/' },
    { name: 'Ecosystem', href: '#ecosystem' },
    { name: 'Earnings', href: '#earnings' },
    { name: 'Benefits', href: '#benefits' },
    { name: 'Team', href: '#team' },
    { name: 'Training', href: '#training' },
  ],
  support: [
    { name: 'Contact Us', href: '#contact' },
    { name: 'FAQs', href: '#' },
    { name: 'Shipping Info', href: '#' },
    { name: 'Returns', href: '#' },
    { name: 'Track Order', href: '#' },
  ],
};

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'Youtube' },
];

export default function Footer() {
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
    <footer id="contact" className="bg-af-text text-white">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-20 py-16 md:py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 md:gap-8"
        >
          {/* Brand Column */}
          <motion.div variants={itemVariants} className="col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block mb-6">
              {/* Logo Image */}
                <img
                  src="/af_home_logo.png"
                alt="AFhome Logo"
                className="w-32 h-auto" // Adjust the width/height as needed
              />
            </Link>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              AF Home is not just a store. It’s a home ecosystem built to grow with you.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-af-brass transition-colors"
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Shop Links */}
          <motion.div variants={itemVariants}>
            <h4 className="font-display font-semibold text-lg mb-6">Shop</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-white/70 hover:text-af-brass transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company Links */}
          <motion.div variants={itemVariants}>
            <h4 className="font-display font-semibold text-lg mb-6">Navigation</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-white/70 hover:text-af-brass transition-colors text-sm"
                  >
                    {link.name}
                  </a>
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
                  <a
                    href={link.href}
                    className="text-white/70 hover:text-af-brass transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div variants={itemVariants} className="col-span-2 md:col-span-1">
            <h4 className="font-display font-semibold text-lg mb-6">
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-orange-500 flex-shrink-0 mt-1" />
                <span className="text-white/70 text-sm">
                  Quezon City Philippines
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-orange-500 flex-shrink-0" />
                <a
                  href="tel:+02-840 0290"
                  className="text-white/70 hover:text-af-brass transition-colors text-sm"
                >

                  02-840 0290


                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-orange-500 flex-shrink-0" />
                <a
                  href="mailto:info@afhome.biz"
                  className="text-white/70 hover:text-af-brass transition-colors text-sm"
                >

                  info@afhome.biz
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
          className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} AFhome. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-white/50 hover:text-white text-sm transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-white/50 hover:text-white text-sm transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="text-white/50 hover:text-white text-sm transition-colors"
            >
              Cookies
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

