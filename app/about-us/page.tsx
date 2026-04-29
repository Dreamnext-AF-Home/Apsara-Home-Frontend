import Image from 'next/image';
import LegalPageShell from '@/components/legal/LegalPageShell';

// Modern, responsive layout for the About page
const stats = [
  { value: '12+ years', label: 'Designing homes with purpose' },
  { value: '100k+', label: 'Happy customers nationwide' },
  { value: '4.9/5', label: 'Average customer satisfaction' },
];

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
];

export default function AboutUsPage() {
  return (
    <LegalPageShell
      title="About Us"
      subtitle="Crafted living – modern design, timeless quality."
    >
      {/* Hero section with background image */}
      <section className="relative w-full mb-12 overflow-hidden rounded-xl shadow-lg animate-fadeIn">
        <Image
          src="/Images/abs.png"
          alt="AF Home crafted living showcase"
          width={1600}
          height={900}
          className="w-full h-[60vh] object-cover transition-transform duration-500 hover:scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent flex items-center justify-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg text-center max-w-2xl px-4">
            Designing Spaces for Everyday Joy
          </h1>
        </div>
      </section>

      {/* Intro paragraph */}
      <section className="max-w-4xl mx-auto text-center mb-10 animate-fadeUp">
        <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          We create furniture and home essentials that balance form, comfort, and lasting quality. Thoughtful details,
          honest materials, and a service mindset you can feel.
        </p>
      </section>

      {/* About text – split into two‑column responsive grid */}
      <section className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
        <div className="space-y-4 text-gray-800 dark:text-gray-200">
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">About AF Home</h2>
          <p>
            Welcome to AF Home – your ultimate destination for quality furniture made in the Philippines. Our mission
            is to bring unmatched comfort and style to every living space.
          </p>
          <p>
            Your home is a sanctuary. We curate a diverse range of pieces—from cozy sofas to sturdy dining tables—to
            match every taste and lifestyle.
          </p>
          <p>
            Each item is crafted with precision using premium materials, ensuring durability and a timeless look that
            becomes part of your story.
          </p>
        </div>
        <div className="space-y-4 text-gray-800 dark:text-gray-200">
          <p>
            Beyond furniture, we offer a curated selection of home appliances to simplify daily life. Our friendly team
            is always ready to help you find the perfect fit for your vision.
          </p>
          <p>
            Join the AF Home family and transform your house into a place you’ll love coming home to.
          </p>
        </div>
      </section>

      {/* Statistics – responsive cards */}
      <section className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
        {stats.map((item) => (
          <div
            key={item.value}
            className="p-6 text-center rounded-xl bg-gradient-to-b from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-900 border border-primary-200 dark:border-primary-700 transition-shadow hover:shadow-lg hover:-translate-y-1 transition-transform"
          >
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{item.value}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{item.label}</p>
          </div>
        ))}
      </section>

      {/* Values – card grid with subtle hover effect */}
      <section className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-semibold text-center mb-8 text-gray-900 dark:text-white">Our Values</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {values.map((item) => (
            <div
              key={item.title}
              className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors hover:scale-105 transform transition-transform duration-300 animate-fadeIn"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">{item.subtitle}</h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </LegalPageShell>
  );
}
