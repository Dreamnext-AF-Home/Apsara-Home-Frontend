import Image from 'next/image'
import LegalPageShell from '@/components/legal/LegalPageShell'

const stats = [
  { value: '12+ years', label: 'Designing homes with purpose' },
  { value: '100k+', label: 'Happy customers nationwide' },
  { value: '4.9/5', label: 'Average customer satisfaction' },
]

const values = [
  {
    title: 'QUALITY',
    subtitle: 'Materials that last',
    text: 'Solid construction, reliable finishes, and testing standards that keep your home looking great over time.',
  },
  {
    title: 'DESIGN',
    subtitle: 'Modern, warm, livable',
    text: 'Balanced silhouettes and curated tones that elevate the space without overwhelming it.',
  },
  {
    title: 'CARE',
    subtitle: 'People‑first service',
    text: 'From choosing the right piece to post‑delivery support, we’re here to help you feel at home.',
  },
]

function AccentPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-cyan-200/60 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800 dark:border-cyan-900/40 dark:bg-cyan-950/30 dark:text-cyan-200">
      {children}
    </span>
  )
}

export default function AboutUsPage() {
  return (
    <LegalPageShell title="About Us" subtitle="Crafted living – modern design, timeless quality.">
      {/* Hero */}
      <section className="relative w-full overflow-hidden rounded-2xl shadow-sm shadow-slate-900/5">
        <Image
          src="/Images/abs.png"
          alt="AF Home crafted living showcase"
          width={1600}
          height={900}
          className="h-[60vh] w-full object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="w-full px-4 pb-10 sm:px-8 sm:pb-12">
            <div className="mx-auto max-w-5xl">
              <div className="mb-4">
                <AccentPill>AF Home • Crafted living</AccentPill>
              </div>
              <h1 className="text-center text-4xl font-bold leading-tight text-white sm:text-5xl">
                Designing Spaces for Everyday Joy
              </h1>
              <p className="mx-auto mt-4 max-w-3xl text-center text-base text-white/90 sm:text-lg">
                Furniture and home essentials built for comfort, honest materials, and lasting quality—so your home stays beautiful for
                years!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="mx-auto mt-10 max-w-4xl text-center">
        <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
          We create furniture and home essentials that balance form, comfort, and lasting quality. Thoughtful details,
          reliable construction, and a service mindset you can feel.
        </p>
      </section>

      {/* About */}
      <section className="mx-auto mt-12 grid gap-8 md:grid-cols-2 max-w-6xl">
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">About AF Home</h2>
          <p className="text-slate-700 dark:text-slate-300">
            Welcome to AF Home—your destination for quality furniture made in the Philippines. Our mission is simple:
            deliver comfort and style to every living space.
          </p>
          <p className="text-slate-700 dark:text-slate-300">
            Your home is a sanctuary. We curate a diverse range of pieces—from cozy sofas to sturdy dining tables—to
            match every taste and lifestyle.
          </p>
          <p className="text-slate-700 dark:text-slate-300">
            Each item is crafted with precision using premium materials, ensuring durability and a timeless look that
            becomes part of your story.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Beyond furniture</h3>
            <p className="mt-2 text-slate-700 dark:text-slate-300">
              We also offer a curated selection of home appliances to simplify daily life. Our team is always ready to
              help you find the perfect fit for your vision.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <AccentPill>Curated selection</AccentPill>
              <AccentPill>Trusted materials</AccentPill>
              <AccentPill>Friendly support</AccentPill>
            </div>
          </div>

          <p className="text-slate-700 dark:text-slate-300">
            Join the AF Home family and transform your house into a place you’ll love coming home to.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto mt-12 max-w-6xl">
        <div className="grid gap-6 sm:grid-cols-3">
          {stats.map((item) => (
            <div
              key={item.value}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40"
            >
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{item.value}</div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto mt-12 max-w-6xl pb-6">
        <h2 className="text-center text-3xl font-semibold text-slate-900 dark:text-white">Our Values</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600 dark:text-slate-300">
          The principles behind every product we design, craft, and deliver.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {values.map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-cyan-900/60"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-bold tracking-wider text-cyan-700 dark:text-cyan-300">{item.title}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{item.subtitle}</div>
                </div>
                <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-200">
                  <span className="text-xs font-bold">AF</span>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{item.text}</p>

              <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent opacity-0 transition group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </section>
    </LegalPageShell>
  )
}
