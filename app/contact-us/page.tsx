import Link from 'next/link';
import { MapPin, Phone, Mail } from 'lucide-react';
import { buildPageMetadata } from '@/app/seo';
import Header from '@/components/landing-page/Header';
import Footer from '@/components/landing-page/Footer';
import ContactForm from './ContactForm';

export const metadata = buildPageMetadata({
  title: 'Contact Us',
  description: 'Get in touch with AF Home. Reach out for product inquiries, order support, or general questions.',
  path: '/contact-us',
});

const branches = [
  {
    name: 'AF Home Head Office, Meycuayan, Bulacan',
    label: 'Meycauayan - Main Office',
    address: '50 altoveros St., Corner Bagbaguin Road, Meycauayan, Bulacan',
    phone: '0917 638 8535',
  },
  {
    name: 'AF Home Factory Outlet, Antipolo',
    address: '9023 Joyous Heights Subd New York Street Hinapao Barangay San Jose Antipolo City.',
    phone: '0967 055 0854',
  },
  {
    name: 'AF Home SM City North Edsa, Quezon City',
    address: 'Interior Zone, SM City North EDSA, Bagong Pag-asa, Quezon City, Metro Manila',
    phone: '09171281921',
  },
  {
    name: 'AF Home Factory Outlet, San Pedro, Laguna',
    address: 'KM 29 MMG Fojas Compound Brgy. San Antonio, San Pedro, Philippines',
    phone: '09171281921',
  },
  {
    name: 'AF Home Store, SM Dasmarinas',
    address: 'KM 29 MMG Fojas Compound Brgy. San Antonio, San Pedro, Philippines',
    phone: '09171281921',
  },
  {
    name: 'AF Home La Loma, Quezon City',
    address: 'KM 29 MMG Fojas Compound Brgy. San Antonio, San Pedro, Philippines',
    phone: '09171281921',
  },
];

export default function ContactUsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header cartCount={0} />

      {/* Page header band */}
      <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 pt-24 md:pt-28 pb-8">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-4">
            <Link href="/shop" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300">Contact Us</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            We&apos;re here to help.
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl">
            Share your questions, project ideas, or concerns and our team will get back to you as soon as possible.
          </p>
        </div>
      </div>

      {/* Main content */}
      <main className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10 xl:gap-16">

            {/* Left — form */}
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Get in Touch</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Tell us what you need. Send a quick message and we&apos;ll reply with the best next step. For urgent concerns, call a branch directly.
              </p>
              <ContactForm />
            </div>

            {/* Right — branches + support */}
            <div className="space-y-4">
              {branches.map((branch) => (
                <div
                  key={branch.name}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4"
                >
                  <p className="text-sm font-semibold text-slate-800 dark:text-white mb-0.5">{branch.name}</p>
                  {branch.label && (
                    <p className="text-xs text-sky-600 dark:text-sky-400 font-medium mb-1.5">{branch.label}</p>
                  )}
                  <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-400" />
                    <span>{branch.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <a href={`tel:${branch.phone.replace(/\s/g, '')}`} className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                      {branch.phone}
                    </a>
                  </div>
                </div>
              ))}

              {/* Support contacts */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white mb-1">General Support</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <a href="mailto:afhome.team@gmail.com" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                      afhome.team@gmail.com
                    </a>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">We typically respond within 24 hours.</p>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white mb-1">Interior Projects &amp; Business</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <a href="mailto:corpsol.apsara@gmail.com" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                      corpsol.apsara@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <a href="tel:09171623056" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">0917 162 3056</a>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <a href="tel:09171282559" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">0917 128 2559</a>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
