import Link from 'next/link';
import type { ReactNode } from 'react';
import Header from '@/components/landing-page/Header';
import Footer from '@/components/landing-page/Footer';

type LegalPageShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function LegalPageShell({ title, subtitle, children }: LegalPageShellProps) {
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
            <span className="text-slate-600 dark:text-slate-300">{title}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            {title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="py-12">
        <div className="container mx-auto px-4">
          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-h2:text-xl prose-h2:font-semibold prose-h2:tracking-tight prose-p:leading-7 prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-li:leading-6 prose-li:text-slate-600 dark:prose-li:text-slate-300 prose-a:text-sky-600 hover:prose-a:text-sky-500 prose-strong:text-slate-800 dark:prose-strong:text-slate-100">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
