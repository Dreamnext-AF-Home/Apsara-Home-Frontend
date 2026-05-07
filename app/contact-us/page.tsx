import Link from 'next/link'
import { MapPin, Phone, Mail } from 'lucide-react'
import { buildPageMetadata } from '@/app/seo'
import Header from '@/components/landing-page/Header'
import Footer from '@/components/landing-page/Footer'
import ContactForm from './ContactForm'

export const metadata = buildPageMetadata({
  title: 'Contact Us',
  description: 'Get in touch with AF Home. Reach out for product inquiries, order support, or general questions.',
  path: '/contact-us',
})

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
    address:
      'Interior Zone, SM City North EDSA, Bagong Pag-asa, Quezon City, Metro Manila',
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
]

export default function ContactUsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header cartCount={0} />

      {/* Page header band */}
      <div className="border-b border-slate-200 bg-slate-100/80 dark:border-slate-800 dark:bg-slate-900/40 pt-24 md:pt-28 pb-8">
        <div className="container mx-auto px-4">
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <Link href="/shop" className="transition-colors hover:text-slate-600 dark:hover:text-slate-300">
              Home
            </Link>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300">Contact Us</span>
          </nav>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">We&apos;re here to help.</h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 md:text-base">
                Share your questions, project ideas, or concerns and our team will get back to you as soon as possible.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-200 dark:ring-cyan-900/40">
                ✉️
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Response time</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Within 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 xl:gap-16 lg:grid-cols-2">
            {/* Left — form */}
            <div>
              <div className="mb-4 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                <div className="mb-1 flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-200 dark:ring-cyan-900/40">
                    💬
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Get in Touch</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Tell us what you need. Send a quick message and we&apos;ll reply with the best next step. For urgent concerns, call a branch directly.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                <ContactForm />
              </div>
            </div>

            {/* Right — branches + support */}
            <div className="space-y-4">
              {branches.map((branch) => (
                <div
                  key={branch.name}
                  className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-cyan-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{branch.name}</p>
                      {branch.label ? (
                        <p className="mt-1 text-xs font-medium text-sky-600 dark:text-sky-400">{branch.label}</p>
                      ) : null}
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-200 dark:ring-cyan-900/40">
                      📍
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>{branch.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <a
                        href={`tel:${branch.phone.replace(/\s/g, '')}`}
                        className="transition-colors hover:text-sky-600 dark:hover:text-sky-400"
                      >
                        {branch.phone}
                      </a>
                    </div>
                  </div>
                </div>
              ))}

              {/* Support contacts */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-200 dark:ring-cyan-900/40">
                    🛟
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Support Contacts</p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Pick the right contact for faster help.</p>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white mb-1">General Support</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <a
                        href="mailto:afhome.team@gmail.com"
                        className="transition-colors hover:text-sky-600 dark:hover:text-sky-400"
                      >
                        afhome.team@gmail.com
                      </a>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                      We typically respond within 24 hours.
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white mb-1">
                      Interior Projects &amp; Business
                    </p>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <a
                        href="mailto:corpsol.apsara@gmail.com"
                        className="transition-colors hover:text-sky-600 dark:hover:text-sky-400"
                      >
                        corpsol.apsara@gmail.com
                      </a>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <a
                        href="tel:09171623056"
                        className="transition-colors hover:text-sky-600 dark:hover:text-sky-400"
                      >
                        0917 162 3056
                      </a>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <a
                        href="tel:09171282559"
                        className="transition-colors hover:text-sky-600 dark:hover:text-sky-400"
                      >
                        0917 128 2559
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

