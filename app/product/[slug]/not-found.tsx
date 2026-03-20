import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getNavbarCategories } from '@/libs/serverStorefront'

export default async function ProductNotFound() {
  const navbarCategories = await getNavbarCategories()
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar />
      <Navbar initialCategories={navbarCategories} />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12">
            <p className="text-sm font-semibold tracking-wide text-orange-600">PRODUCT NOT FOUND</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">This product is unavailable</h1>
            <p className="mt-3 text-slate-600">
              The item may be inactive, removed, or the link is incorrect.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href="/category"
                className="inline-flex items-center rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
              >
                Browse Products
              </Link>
              <Link
                href="/"
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
