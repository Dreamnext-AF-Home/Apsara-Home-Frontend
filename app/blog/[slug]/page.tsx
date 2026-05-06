import { buildPageMetadata } from '@/app/seo'
import { getBlogsContent } from '@/lib/blogs-cms'
import { notFound } from 'next/navigation'

type BlogPageProps = {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: BlogPageProps) {
  const blogs = await getBlogsContent()
  const blog = blogs.find(b => b.slug === params.slug)

  if (!blog) {
    return {
      title: 'Blog Post Not Found',
    }
  }

  return buildPageMetadata({
    title: blog.title,
    description: blog.subtitle || blog.body || '',
    path: `/blog/${params.slug}`,
  })
}

export default async function BlogPage({ params }: BlogPageProps) {
  const blogs = await getBlogsContent()
  const blog = blogs.find(b => b.slug === params.slug)

  if (!blog) {
    notFound()
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8">
        <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-cyan-300/30 blur-2xl" />
        <div className="absolute -left-10 -bottom-12 h-48 w-48 rounded-full bg-orange-300/20 blur-3xl" />
        
        <div className="relative mx-auto max-w-4xl">
          {blog.category && (
            <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-cyan-100">
              {blog.category}
            </span>
          )}
          <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            {blog.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-300">
            {blog.date && <span>{blog.date}</span>}
            {blog.readTime && <span>· {blog.readTime}</span>}
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {blog.image_url && (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="-mt-8 overflow-hidden rounded-3xl shadow-2xl">
            <img src={blog.image_url} alt={blog.title} className="h-auto w-full object-cover" />
          </div>
        </div>
      )}

      {/* Content */}
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {blog.subtitle && (
          <p className="text-xl font-medium leading-relaxed text-slate-700 dark:text-slate-300">
            {blog.subtitle}
          </p>
        )}
        
        {blog.body && (
          <div className="prose prose-lg mt-8 prose-slate dark:prose-invert max-w-none">
            {blog.body.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4 leading-relaxed text-slate-600 dark:text-slate-400">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </article>

      {/* Back to Blogs */}
      <section className="mx-auto max-w-4xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
        <a
          href="/blog"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          ← Back to all posts
        </a>
      </section>
    </>
  )
}
