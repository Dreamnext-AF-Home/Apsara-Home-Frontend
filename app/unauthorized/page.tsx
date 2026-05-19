import type { Metadata } from 'next'
import Link from 'next/link'
import { Ban, Info, Lock, Mail } from 'lucide-react'

type UnauthorizedPageProps = {
  searchParams?: Record<string, string | string[] | undefined>
}

const normalizeStoreName = (value: string | string[] | undefined): string | null => {
  const raw = Array.isArray(value) ? value[0] : value
  const normalized = String(raw ?? '').trim()
  return normalized ? normalized : null
}

export async function generateMetadata({ searchParams }: UnauthorizedPageProps): Promise<Metadata> {
  const resolved = searchParams ?? {}
  const storeName = normalizeStoreName(resolved.store)
  const pageTitle = storeName ? `Unauthorized Access | ${storeName}` : 'Unauthorized Access'

  return {
    title: pageTitle,
    description: 'You do not have permission to access this resource.',
    robots: { index: false, follow: false },
    alternates: { canonical: '/unauthorized' },
    icons: {
      icon: '/unauthorized/icon.svg',
      shortcut: '/unauthorized/icon.svg',
      apple: '/unauthorized/icon.svg',
    },
    openGraph: {
      title: pageTitle,
      description: 'You do not have permission to access this resource.',
      url: '/unauthorized',
      type: 'website',
      siteName: storeName ?? 'Unauthorized Access',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: 'You do not have permission to access this resource.',
    },
  }
}

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#eaf1ff_0%,#f6f9ff_30%,#ffffff_75%)] px-3 py-4 sm:px-4 sm:py-6">
      <div className="mx-auto w-full max-w-6xl rounded-[28px] border border-[#dfe8ff] bg-white/85 px-4 py-6 shadow-[0_20px_60px_rgba(40,88,190,0.12)] backdrop-blur-sm sm:px-8 sm:py-8">
        <section className="mx-auto max-w-3xl text-center">
          <div className="relative mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-[linear-gradient(145deg,#edf3ff,#e6efff)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:mb-5 sm:h-36 sm:w-36">
            <Lock className="h-14 w-14 text-[#1f66ff] sm:h-16 sm:w-16" strokeWidth={1.8} />
            <span className="absolute bottom-6 right-4 rounded-full bg-white p-1 shadow-sm ring-2 ring-[#2d74ff]">
              <Ban className="h-7 w-7 text-[#2d74ff] sm:h-8 sm:w-8" strokeWidth={2} />
            </span>
            <span className="absolute -left-7 top-1/2 h-2.5 w-2.5 rounded-full border-2 border-[#8eb1ff]" />
            <span className="absolute -right-7 top-1/2 h-2.5 w-2.5 rounded-full border-2 border-[#8eb1ff]" />
            <span className="absolute -left-2 top-3 text-2xl font-bold text-[#86aaf9]">×</span>
            <span className="absolute -right-2 top-3 text-2xl font-bold text-[#86aaf9]">×</span>
            <span className="absolute -left-2 bottom-3 text-2xl font-bold text-[#86aaf9]">×</span>
          </div>

          <h1 className="bg-gradient-to-b from-[#2f79ff] to-[#1456e4] bg-clip-text text-6xl font-extrabold leading-none text-transparent drop-shadow-[0_6px_18px_rgba(28,96,255,0.25)] sm:text-7xl">403</h1>
          <p className="mt-1 text-4xl font-bold tracking-tight text-[#0f2348] sm:mt-2 sm:text-5xl">Forbidden</p>

          <div className="mx-auto mt-3 flex max-w-sm items-center gap-3 sm:mt-4">
            <span className="h-px flex-1 bg-[#cfe0ff]" />
            <span className="h-2 w-2 rounded-full bg-[#8cb0ff]" />
            <span className="h-px flex-1 bg-[#cfe0ff]" />
          </div>

          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[#4a638f] sm:mt-5 sm:text-2xl">
            You don&apos;t have permission to access this resource.
            <br />
            If you believe this is a mistake, please contact the administrator.
          </p>

          <div className="mx-auto mt-5 max-w-4xl rounded-2xl border border-[#d7e4ff] bg-[linear-gradient(160deg,#f6f9ff,#eff5ff)] p-4 text-left shadow-[0_8px_30px_rgba(35,90,210,0.08)] sm:mt-6 sm:p-5">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-full bg-[#dfeaff] p-3">
                <Info className="h-6 w-6 text-[#2d74ff]" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-[#1f66ff] sm:text-3xl">Need help?</h2>
                <p className="mt-1 text-base text-[#4a638f] sm:text-lg">
                  If you need assistance, please contact our support team.
                </p>
                <a
                  href="mailto:mgmt.afhomebiz@gmail.com"
                  className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-[#1f66ff] hover:underline sm:text-lg"
                >
                  <Mail className="h-5 w-5" />
                  mgmt.afhomebiz@gmail.com
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
