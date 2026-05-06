'use client';

import TopBar from '@/components/layout/TopBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/landing-page/Footer';
import { useBlogsContent } from '@/lib/blogs-cms';

type BlogsProps = {
  initialCategories?: any[];
};

const blogCategories = ['Design Tips', 'Small Space', 'Style Guide', 'Buying Guide', 'Home Care']

const Blogs = ({ initialCategories }: BlogsProps) => {
  const { blogPosts, isLoading } = useBlogsContent()

  return (
    <>
      <TopBar />
      <Navbar initialCategories={initialCategories} />
      <main className="bg-white dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <section className="container mx-auto px-4 pt-10 pb-8 sm:pt-12 sm:pb-10">
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 px-5 py-8 text-white sm:px-10 sm:py-12">
          <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-cyan-300/30 blur-2xl" />
          <div className="absolute -left-10 -bottom-12 h-48 w-48 rounded-full bg-orange-300/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <p className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-cyan-100">
              AF Home Journal
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
              Modern home ideas, made practical for real spaces.
            </h1>
            <p className="mt-3 text-sm text-slate-200 sm:text-base">
              Explore guides on furniture styling, layout planning, and everyday home upgrades that are easy to apply.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-6">
        <div className="flex flex-wrap gap-2">
          {blogCategories.map((category) => (
            <button
              key={category}
              type="button"
              className="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-xs font-medium text-slate-700 dark:text-gray-300 transition-colors hover:border-cyan-500 dark:hover:border-cyan-600 hover:text-cyan-700 dark:hover:text-cyan-400"
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-14">
        {isLoading ? (
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post, index) => (
              <article
                key={post.id}
                className={`group overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800  transition-all hover:-translate-y-0.5  ${index === 0 ? 'md:col-span-2 lg:col-span-2' : ''}`}
              >
                {post.image_url ? (
                  <div className="h-40 w-full sm:h-44">
                    <img src={post.image_url} alt={post.title} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className={`h-40 w-full bg-gradient-to-br ${index % 3 === 0 ? 'from-orange-100 to-rose-100' : index % 3 === 1 ? 'from-cyan-100 to-blue-100' : 'from-emerald-100 to-lime-100'} sm:h-44`} />
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-gray-400">
                    {post.category && <span className="rounded-full bg-slate-100 dark:bg-gray-700 px-2.5 py-1 font-medium text-slate-700 dark:text-gray-300">{post.category}</span>}
                    {post.readTime && <span>{post.readTime}</span>}
                  </div>
                  <h2 className="mt-3 text-lg font-semibold leading-snug text-slate-900 dark:text-white transition-colors group-hover:text-cyan-700 dark:group-hover:text-cyan-400">
                    {post.title}
                  </h2>
                  {(post.subtitle || post.body) && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-gray-400">{post.subtitle || post.body}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-3 text-xs text-slate-500 dark:text-gray-400">
                    {post.date && <span>{post.date}</span>}
                    {post.slug ? (
                      <a href={`/blog/${post.slug}`} className="font-semibold text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300">
                        Read article
                      </a>
                    ) : (
                      <button type="button" className="font-semibold text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300">
                        Read article
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6  sm:flex sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Get fresh ideas every week</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">New blog updates on home styling, shopping tips, and space planning.</p>
          </div>
          <button
            type="button"
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:hover:bg-slate-600 sm:mt-0 sm:w-auto"
          >
            Subscribe
          </button>
        </div>
      </section>
    </main>
    <Footer />
    </>
  )
}

export default Blogs
