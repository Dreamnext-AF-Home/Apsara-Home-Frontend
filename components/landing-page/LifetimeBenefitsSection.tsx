import { motion } from 'framer-motion';
import { CheckCircle2, Tag, Home, Coins } from 'lucide-react';

export default function LifetimeBenefitsSection() {
  const benefits = [
    {
      icon: Tag,
      text: "Exclusive member pricing",
      desc: "Get special rates on our entire catalog"
    },
    {
      icon: CheckCircle2,
      text: "Use discounts anytime",
      desc: "Valid 24/7, all year round"
    },
    {
      icon: Home,
      text: "Perfect for renovations",
      desc: "Save big on home upgrades"
    },
    {
      icon: Coins,
      text: "Maximize your margins",
      desc: "Buy low, sell at market price"
    }
  ];

  return (
    <section id="benefits" className="py-24 bg-af-cream relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Text Content */}
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 font-semibold text-sm mb-6"
            >
              <Tag size={14} />
              LIFETIME DISCOUNTS & PERSONAL BENEFITS
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Save for Life, <br />
              <span className="text-orange-600">Not Just Once.</span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 mb-10 leading-relaxed"
            >
              As an AF Home Affiliate, you enjoy lifetime member discounts on products—whether you’re buying for yourself, your family, or your projects.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="grid sm:grid-cols-2 gap-6"
            >
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 mt-1">
                    <benefit.icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">{benefit.text}</h4>
                    <p className="text-sm text-gray-500">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Visual Content - Price Comparison */}
          <div className="order-1 lg:order-2 relative perspective-1000">
             <motion.div
                initial={{ opacity: 0, rotateY: 10, x: 20 }}
                whileInView={{ opacity: 1, rotateY: 0, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 max-w-md mx-auto"
             >
                 {/* Product Image */}
                 <div className="h-56 bg-gray-100 rounded-2xl mb-6 relative overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=2070" 
                      alt="Modern Sofa" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        MEMBER EXCLUSIVE
                    </div>
                 </div>
                 
                 <div className="mb-6">
                   <p className="text-sm text-gray-500 mb-1">Living Room Collection</p>
                   <h3 className="text-2xl font-bold text-gray-900">Modern Sectional Sofa</h3>
                 </div>
                 
                 <div className="space-y-3">
                    {/* Regular Price Row */}
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                        <span className="text-gray-500 font-medium">Regular Price</span>
                        <span className="text-gray-400 font-medium text-lg line-through decoration-red-400">₱25,000</span>
                    </div>
                    
                    {/* Member Price Row - Highlighted */}
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border-2 border-green-100 relative overflow-hidden">
                        <div className="relative z-10 flex items-center gap-2">
                            <div className="bg-green-200 p-1.5 rounded-full text-green-700">
                                <Tag size={16} />
                            </div>
                            <span className="text-green-800 font-bold">Your Price</span>
                        </div>
                        <span className="relative z-10 text-green-700 font-bold text-2xl">₱20,000</span>
                        
                        {/* Shimmer Effect */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-50 -skew-x-12 translate-x-[-200%] animate-shimmer" />
                    </div>
                 </div>
                 
                 <div className="mt-6 pt-5 border-t border-gray-100 flex justify-between items-end">
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Savings</p>
                        <p className="text-xs text-gray-400">Instant discount applied</p>
                    </div>
                    <div className="text-right">
                        <span className="block text-3xl font-bold text-red-500">₱5,000</span>
                    </div>
                 </div>
             </motion.div>

             {/* Background Blob */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-orange-100/50 via-yellow-50/50 to-transparent rounded-full filter blur-3xl -z-10" />
          </div>

        </div>
      </div>
    </section>
  );
}

