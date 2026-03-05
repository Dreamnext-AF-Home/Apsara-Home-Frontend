import { motion } from 'framer-motion';

export default function AboutSection() {
  return (
    <section id="about" className="py-24 md:py-32 bg-white overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image Grid */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl overflow-hidden shadow-soft-lg"
              >
                <img
                  src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=500&q=80"
                  alt="Showroom interior"
                  className="w-full h-48 md:h-64 object-cover"
                />
              </motion.div>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl overflow-hidden shadow-soft-lg mt-8"
              >
                <img
                  src="https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=500&q=80"
                  alt="Craftsmanship detail"
                  className="w-full h-48 md:h-64 object-cover"
                />
              </motion.div>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl overflow-hidden shadow-soft-lg col-span-2"
              >
                <img
                  src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80"
                  alt="Living space showcase"
                  className="w-full h-48 md:h-56 object-cover"
                />
              </motion.div>
            </div>
            {/* Floating Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="absolute -bottom-6 -right-6 bg-af-brass text-white p-6 rounded-2xl shadow-soft-lg hidden md:block"
            >
              <span className="font-display text-4xl font-bold block">15+</span>
              <span className="text-sm">Years of Excellence</span>
            </motion.div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <span className="font-mono text-orange-500 text-sm tracking-widest uppercase mb-4 block">
              Our Story
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-af-text font-semibold mb-6 leading-tight">
              Crafting Spaces,{' '}
              <span className="text-orange-500 italic">Creating Memories</span>
            </h2>
            <div className="space-y-4 text-af-text-secondary leading-relaxed">
              <p>
                AFhome was born from a simple belief: everyone deserves a home
                that reflects their personality and inspires their daily life.
                Founded in 2009, we&apos;ve grown from a small showroom into a
                destination for thoughtfully designed furniture.
              </p>
              <p>
                We partner with skilled artisans and sustainable manufacturers
                worldwide to bring you pieces that combine timeless aesthetics
                with exceptional comfort. Every item in our collection is
                curated with intention—designed to last and meant to be loved.
              </p>
              <p>
                From the first sketch to the final delivery, we&apos;re committed to
                creating an experience that makes turning your house into a home
                both effortless and enjoyable.
              </p>
            </div>

            {/* Values */}
            <div className="grid grid-cols-3 gap-6 mt-10">
              {[
                { value: 'Quality', desc: 'Premium Materials' },
                { value: 'Design', desc: 'Timeless Aesthetics' },
                { value: 'Service', desc: 'White Glove Care' },
              ].map((item, index) => (
                <motion.div
                  key={item.value}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                  className="text-center md:text-left"
                >
                  <h4 className="font-display text-xl font-semibold text-orange-400 mb-1">
                    {item.value}
                  </h4>
                  <p className="text-af-text-secondary text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

