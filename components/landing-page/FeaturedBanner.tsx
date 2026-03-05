import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function FeaturedBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  return (
    <section
      ref={ref}
      id="collections"
      className="relative py-24 md:py-32 overflow-hidden"
    >
      {/* Background */}
      <motion.div style={{ y }} className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1920&q=85"
          alt="Featured collection"
          className="w-full h-[130%] object-cover"
        />
        <div className="absolute inset-0 bg-blue-500/20" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10 lg:px-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <span className="font-mono text-orange-600 text-sm tracking-widest uppercase mb-4 block">
              Exclusive Collection
            </span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-white font-light leading-tight mb-6">
              The{' '}
              <span className="text-orange-500 font-semibold italic">
                Artisan
              </span>{' '}
              Series
            </h2>
            <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-lg">
              Discover our limited edition collection featuring handcrafted
              pieces from master artisans. Each item tells a story of
              exceptional craftsmanship and timeless design.
            </p>
            <div className="flex flex-wrap gap-4">
              <motion.a
                href="#shop"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-4 rounded-full font-semibold text-base transition-all duration-300 hover:bg-[#c4955f] shadow-soft-lg group"
              >
                Shop Collection
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </motion.a>
              <motion.a
                href="#about"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 text-white px-8 py-4 rounded-full font-semibold text-base border border-white/30 hover:bg-white/10 transition-all duration-300"
              >
                Learn More
              </motion.a>
            </div>
          </motion.div>

          {/* Featured Products Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            className="grid grid-cols-2 gap-4"
          >
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as const }}
              className="bg-white rounded-2xl overflow-hidden shadow-soft-lg"
            >
              <img
                src="https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&q=80"
                alt="Artisan chair"
                className="w-full aspect-square object-cover"
              />
              <div className="p-4">
                <h4 className="font-display font-semibold text-af-text">
                  Artisan Chair
                </h4>
                <span className="font-mono text-sm text-af-forest">$1,299</span>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as const }}
              className="bg-white rounded-2xl overflow-hidden shadow-soft-lg mt-8"
            >
              <img
                src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80"
                alt="Designer sofa"
                className="w-full aspect-square object-cover"
              />
              <div className="p-4">
                <h4 className="font-display font-semibold text-af-text">
                  Designer Sofa
                </h4>
                <span className="font-mono text-sm text-af-forest">$3,499</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

