import { motion } from 'framer-motion';
import { Truck, Shield, RotateCcw, Award } from 'lucide-react';

const indicators = [
  {
    icon: Truck,
    title: 'Free Membership Shipping',
    description: 'On orders over 50,000',
  },
  {
    icon: Shield,
    title: '1-Year Warranty',
    description: 'Guaranteed protection',
  },
  {
    icon: RotateCcw,
    title: '30-Day Returns',
    description: 'Hassle-free returns',
  },
  {
    icon: Award,
    title: 'Premium Quality',
    description: 'Handpicked materials',
  },
];

export default function TrustIndicators() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
        >
          {indicators.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.16, 1, 0.3, 1] as const,
              }}
              whileHover={{ y: -4 }}
              className="text-center p-6 rounded-2xl bg-af-cream/50"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: index * 0.5,
                  ease: 'easeInOut',
                }}
                className="w-16 h-16 mx-auto mb-4 bg-af-forest/10 rounded-2xl flex items-center justify-center"
              >
                <item.icon size={28} className="text-orange-500" />
              </motion.div>
              <h3 className="font-display text-lg font-semibold text-af-text mb-1">
                {item.title}
              </h3>
              <p className="text-af-text-secondary text-sm">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

