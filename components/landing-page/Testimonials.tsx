import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    role: 'Interior Designer',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
    content:
      'The quality of AFhome furniture is exceptional. Every piece I\'ve purchased has exceeded my expectations. Their attention to detail is remarkable.',
    rating: 5,
  },
  {
    id: 2,
    name: 'James Rodriguez',
    role: 'Architect',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    content:
      "I've furnished multiple client projects with AFhome pieces. The blend of modern design and craftsmanship is unmatched in this price range.",
    rating: 5,
  },
  {
    id: 3,
    name: 'Emily Chen',
    role: 'Homeowner',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80',
    content:
      "Our living room was transformed completely. The velvet sofa became the centerpiece of our home. Delivery and setup were seamless.",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-af-text font-semibold mb-4">
            What Our Clients Say
          </h2>
          <p className="text-af-text-secondary text-lg max-w-xl mx-auto">
            Stories from homeowners and designers who chose AFhome
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: index * 0.15,
                ease: [0.16, 1, 0.3, 1] as const,
              }}
              whileHover={{ y: -8 }}
              className="relative bg-af-cream rounded-3xl p-8 shadow-soft hover:shadow-soft-lg transition-all duration-500"
            >
              {/* Quote Icon */}
              <div className="absolute -top-4 right-8 w-12 h-12 bg-af-brass rounded-full flex items-center justify-center shadow-soft">
                <Quote size={20} className="text-white" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className="text-af-brass fill-af-brass"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-af-text leading-relaxed mb-6">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-display font-semibold text-af-text">
                    {testimonial.name}
                  </h4>
                  <span className="text-af-text-secondary text-sm">
                    {testimonial.role}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          {[
            { value: '10K+', label: 'Happy Customers' },
            { value: '98%', label: 'Satisfaction Rate' },
            { value: '500+', label: 'Products' },
            { value: '15+', label: 'Years Experience' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <span className="font-display text-4xl md:text-5xl font-bold text-orange-500">
                {stat.value}
              </span>
              <p className="text-af-text-secondary mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

