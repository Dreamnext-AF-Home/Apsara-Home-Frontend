import { motion } from 'framer-motion';
import { Check, User, Smartphone, Home, TrendingUp, Heart } from 'lucide-react';

export default function TargetAudienceSection() {
  const criteria = [
    {
      icon: Home,
      text: "You want to earn without stocking products",
      color: "text-blue-600 bg-blue-100"
    },
    {
      icon: Smartphone,
      text: "You create content on social media",
      color: "text-pink-600 bg-pink-100"
    },
    {
      icon: User,
      text: "You help people find home solutions",
      color: "text-orange-600 bg-orange-100"
    },
    {
      icon: TrendingUp,
      text: "You want extra income or a scalable business",
      color: "text-green-600 bg-green-100"
    },
    {
      icon: Heart,
      text: "You believe homes should be better, not more expensive",
      color: "text-red-600 bg-red-100"
    }
  ];

  const personas = [
    {
      image: "/Images/landing/content-creator.png",
      label: "Content Creator",
      position: "h-64 sm:h-auto"
    },
    {
      image: "/Images/landing/young-couple.png",
      label: "Young Couple",
      position: "h-64 sm:h-auto"
    },
    {
      image: "/Images/landing/sales-agent.png",
      label: "Sales Agent / Designer",
      position: "h-64 sm:h-auto"
    },
    {
      image: "/Images/landing/digital-nomad.png",
      label: "OFW / Digital Nomad",
      position: "h-64 sm:h-auto"
    }
  ];

  return (
    <section className="py-24 bg-gray-50 relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Visual Content - Persona Grid */}
          <div className="order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4 h-[600px]">
              {personas.map((persona, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className={`relative rounded-2xl overflow-hidden group ${persona.position}`}
                >
                  <img
                    src={persona.image}
                    alt={persona.label}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="text-white font-bold text-lg">{persona.label}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Text Content */}
          <div className="order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm mb-6"
            >
              <Check size={14} />
              WHO THIS IS FOR
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight"
            >
              This Is for You If...
            </motion.h2>

            <div className="space-y-6">

              {criteria.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + (index * 0.1) }}
                  className="flex items-center gap-4 group"
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${item.color} group-hover:scale-110 duration-300`}>
                    <item.icon size={20} />
                  </div>
                  <span className="text-lg text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                    {item.text}
                  </span>
                </motion.div>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="mt-10 p-6 bg-white rounded-2xl border border-gray-100 shadow-lg"
            >
              <p className="text-gray-600 italic">
                &quot;Whether you&apos;re looking for a side hustle or a full-time career, AF Home gives you the platform to succeed on your own terms.&quot;
              </p>
            </motion.div>

          </div>

        </div>
      </div>
    </section>
  );
}

