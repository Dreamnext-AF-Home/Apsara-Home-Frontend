import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Home, Coins, Users, Armchair, Award } from 'lucide-react';

const FloatingIcon = ({ children, delay, x, y, className = "" }: { children: React.ReactNode; delay: number; x: string; y: string; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0.4, 0.8, 0.4], 
      y: [0, -20, 0],
      scale: [1, 1.1, 1]
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className={`absolute ${x} ${y} z-10 text-white/30 ${className}`}
  >
    {children}
  </motion.div>
);

export default function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative h-screen min-h-[600px] overflow-hidden"
    >
      {/* Background Image with Parallax */}
      <motion.div
        style={{ y: backgroundY }}
        className="absolute inset-0 w-full h-[120%]"
      >
        <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10" />
        <img
          src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=85"
          alt="Modern living room with elegant furniture"
          className="w-full h-full object-cover object-center"
        />
      </motion.div>

      {/* Floating Icons */}
      <FloatingIcon delay={0} x="right-[5%] md:right-[15%]" y="top-[15%] md:top-[20%]" className="hidden sm:block">
        <div className="bg-white/10 backdrop-blur-md p-3 md:p-4 rounded-2xl border border-white/20">
          <Coins className="text-yellow-400 w-8 h-8 md:w-10 md:h-10" />
        </div>
      </FloatingIcon>
      
      <FloatingIcon delay={1} x="right-[5%] md:right-[25%]" y="bottom-[20%] md:bottom-[30%]" className="hidden sm:block">
        <div className="bg-white/10 backdrop-blur-md p-3 md:p-4 rounded-2xl border border-white/20">
          <Home className="text-blue-400 w-6 h-6 md:w-8 md:h-8" />
        </div>
      </FloatingIcon>

      <FloatingIcon delay={2} x="right-[10%]" y="top-[50%]" className="hidden lg:block">
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
          <Users size={36} className="text-green-400" />
        </div>
      </FloatingIcon>

      <FloatingIcon delay={1.5} x="left-[45%]" y="bottom-[20%]" className="hidden lg:block">
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
          <Armchair size={28} className="text-orange-400" />
        </div>
      </FloatingIcon>

      <FloatingIcon delay={2.5} x="right-[35%]" y="top-[30%]" className="hidden lg:block">
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
          <Award size={30} className="text-purple-400" />
        </div>
      </FloatingIcon>

      <FloatingIcon delay={3} x="right-[5%] md:right-[5%]" y="bottom-[40%]" className="hidden md:block">
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-full border border-white/20 w-16 h-16 flex items-center justify-center">
          <span className="text-3xl font-bold text-white">₱</span>
        </div>
      </FloatingIcon>

      {/* Dotted Grid Overlay */}
      <div
        className="absolute inset-0 z-10 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle, #1A1A1A 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* Content */}
      <motion.div
        style={{ y: textY, opacity }}
        className="relative z-20 h-full flex items-center pt-28 md:pt-0"
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-20 w-full">
          <div className="max-w-4xl mx-auto md:mx-0 text-left">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
              className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-white font-medium leading-tight mb-6 md:mb-8 tracking-tight"
            >
              Earn From Home.{' '}
              <span className="block md:inline">Build a Team.</span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 font-bold italic block md:inline">
                Upgrade Lives.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
              className="text-white/90 text-base sm:text-lg md:text-2xl font-body mb-8 leading-relaxed max-w-2xl md:mx-0"
            >
              AF Home is a home and lifestyle affiliate ecosystem where you earn commissions, enjoy lifetime discounts, and grow with a community.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] as const }}
              className="inline-block text-white font-medium text-base md:text-xl mb-10 bg-white/5 backdrop-blur-sm px-6 py-2 rounded-full border border-white/10"
            >
              No inventory. No capital. Just real products, real earnings.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
              className="flex flex-col sm:flex-row gap-4 w-auto justify-start items-start"
            >
              <motion.a
                href="/login"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center gap-2 bg-orange-500 text-white px-6 py-3 md:px-10 md:py-5 rounded-full font-bold text-base md:text-lg transition-all duration-300 hover:bg-orange-600 shadow-[0_0_20px_rgba(249,115,22,0.4)] group min-w-[160px] md:min-w-[200px]"
              >
                Join as an Affiliate — It’s Free
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </motion.a>
              <motion.a
                href="#how-it-works"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md text-white px-6 py-3 md:px-10 md:py-5 rounded-full font-bold text-base md:text-lg border border-white/30 hover:bg-white/20 transition-all duration-300 min-w-[160px] md:min-w-[200px]"
              >
                See How It Works
              </motion.a>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1.5 h-3 bg-white rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

