import { motion } from "framer-motion";
import { Armchair, Box, Home, Hammer, Star } from "lucide-react";

const categories = [
  {
    icon: Armchair,
    title: "Furniture",
    description: "Sofas, Beds, Cabinets",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Box,
    title: "Space-Saving Solutions",
    description: "Multifunctional & Compact",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: Home,
    title: "Home & Lifestyle",
    description: "Essentials & Decor",
    color: "bg-orange-100 text-orange-600",
  },
  {
    icon: Hammer,
    title: "Interior Services",
    description: "Fit-out & Renovation",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Star,
    title: "Partner Brands",
    description: "Exclusive Collections",
    color: "bg-yellow-100 text-yellow-600",
  },
];

const brands = [
  { name: "Afforda Home", logo: "/Images/landing/affordahome.png" },
  { name: "Astro Foam", logo: "/Images/landing/astro-foam.png" },
  { name: "Hyundai Home", logo: "/Images/landing/hyundai-home.png" },
  { name: "Sunnyware", logo: "/Images/landing/sunnyware.png" },
  { name: "Turtle Wax", logo: "/Images/landing/turtle-wax.png" },
  { name: "Xiaomi", logo: "/Images/landing/xiaomi.png" },
  { name: "Zooey", logo: "/Images/landing/zooey.png" },
  { name: "Mr. Chuck", logo: "/Images/landing/mrchuck.png" },
  { name: "Easy Space", logo: "/Images/landing/easy-space.png" },
  { name: "Furnigo", logo: "/Images/landing/furnigo.png" },
  { name: "Beanio", logo: "/Images/landing/beani-mnl.png" },
  { name: "Pica Pillow", logo: "/Images/landing/pica-pillow.png" },
  { name: "AirPro", logo: "/Images/landing/airpro.png" },
];

export default function ProductsBrandsSection() {
  return (
    <section id="ecosystem" className="py-24 bg-white overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 font-semibold text-sm mb-4"
          >
            PRODUCTS & BRANDS ECOSYSTEM
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            One Ecosystem. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
              Many Trusted Home Brands.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 leading-relaxed"
          >
            AF Home brings together furniture, home essentials, and interior
            solutions under one affiliate-friendly platform, giving you more
            ways to earn.
          </motion.p>
        </div>

        <div className="mb-20">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-8"
          >
            Trusted by Top Brands
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center">
            {brands.map((brand, index) => (
              <motion.div
                key={brand.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="h-16 w-32 md:w-36"
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="h-full w-full object-contain"
                />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-20">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="h-full rounded-2xl bg-gray-50/50 p-6 flex flex-col items-center text-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div
                className={`p-4 rounded-2xl mb-4 ${cat.color} group-hover:scale-110 transition-transform duration-300`}
              >
                <cat.icon size={32} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{cat.title}</h3>
              <p className="text-sm text-gray-500">{cat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

