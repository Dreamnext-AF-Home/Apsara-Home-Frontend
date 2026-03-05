import { motion } from 'framer-motion';

const experiences = [
  {
    title: 'Comfort',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80',
    description: 'Living room setup'
  },
  {
    title: 'Function',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80',
    description: 'Small condo space'
  },
  {
    title: 'Everyday Living',
    image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
    description: 'Bedroom setup'
  },
  {
    title: 'Gathering',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80',
    description: 'Dining room setup'
  }
];

const highlights = [
  'Products designed for real Filipino homes',
  'Styles for condos, houses, offices, and families',
  'Quality materials at factory-direct prices',
  'Solutions people actually use every day'
];

export default function ExperienceSection() {
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-20">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 lg:max-w-xl"
          >
            <span className="text-orange-500 font-mono tracking-widest text-sm uppercase mb-4 block">
              Experience
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-medium text-af-black mb-6 leading-tight">
              More Than Products.{' '}
              <span className="text-blue-600 italic">
                A Better Home Experience.
              </span>
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              As an AF Home Affiliate, you don’t just promote furniture. 
              You help people create better living spaces—homes that feel comfortable, functional, and inspiring.
            </p>
            
            <ul className="space-y-4">
              {highlights.map((highlight, index) => (
                <motion.li 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center gap-3 text-af-black font-medium"
                >
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  {highlight}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Image Grid */}
          <div className="flex-1 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-auto md:h-[600px]">
              {experiences.map((exp, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className={`relative rounded-3xl overflow-hidden group h-64 md:h-full`}
                >
                  <img 
                    src={exp.image} 
                    alt={exp.description}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                  <div className="absolute bottom-6 left-6">
                    <span className="text-white text-lg font-display tracking-wide backdrop-blur-md bg-white/10 px-4 py-2 rounded-full border border-white/20">
                      {exp.title}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

