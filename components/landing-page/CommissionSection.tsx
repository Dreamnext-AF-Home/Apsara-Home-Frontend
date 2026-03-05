import { motion } from 'framer-motion';
import { Share2, User, Wallet, ArrowRight, ArrowDown, ArrowLeft, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function CommissionSection() {
  const steps = [
    {
      icon: User,
      title: "You",
      description: "Join as an affiliate",
      color: "bg-blue-100 text-blue-600",
      arrow: ArrowRight,
      arrowPos: "right"
    },
    {
      icon: Share2,
      title: "Share Link",
      description: "Post on social media",
      color: "bg-purple-100 text-purple-600",
      arrow: ArrowDown,
      arrowPos: "bottom"
    },
    {
      icon: User,
      title: "Customer",
      description: "Buys from your link",
      color: "bg-green-100 text-green-600",
      arrow: ArrowLeft,
      arrowPos: "left"
    },
    {
      icon: Wallet,
      title: "Commission",
      description: "You get paid!",
      color: "bg-orange-100 text-orange-600",
      arrow: null,
      arrowPos: null
    }
  ];

  const benefits = [
    "Earn commissions on every successful order",
    "Track sales and earnings in real time",
    "No limit to how much you can earn",
    "Get paid while helping others upgrade their homes"
  ];

  return (
    <section id="earnings" className="py-24 bg-gray-50 overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-10 right-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-20 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-1.5 rounded-full bg-green-100 text-green-700 font-semibold text-sm mb-6"
            >
              HOW YOU EARN
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Earn Every Time <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                You Share.
              </span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 mb-8 leading-relaxed"
            >
              When someone buys using your affiliate link, you earn commissions—simple as that.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="grid gap-4 mb-10"
            >
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <TrendingUp size={16} />
                  </div>
                  <span className="font-medium text-gray-700">{benefit}</span>
                </div>
              ))}
            </motion.div>

            <motion.p
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.4 }}
               className="text-2xl font-caveat text-orange-600 font-bold rotate-1 inline-block"
            >
              Your content. Your network. Your income.
            </motion.p>
          </div>

          {/* Flow Diagram & Visuals */}
          <div className="relative">
            <div className="relative z-10 grid gap-6">
              {/* Process Flow */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
                {steps.map((step, index) => {
                  // Determine order for snake layout on desktop
                  // 0 -> 1
                  //      |
                  // 3 <- 2
                  const orderClass = 
                    index === 0 ? 'lg:order-1' :
                    index === 1 ? 'lg:order-2' :
                    index === 2 ? 'lg:order-4' : // Customer moves to bottom right
                    'lg:order-3'; // Commission moves to bottom left

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.15 }}
                      className={`relative ${orderClass}`}
                    >
                      <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all duration-300 relative z-10">
                        <CardContent className="p-6 flex flex-col items-center text-center">
                          <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center mb-4`}>
                            <step.icon size={28} />
                          </div>
                          <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                          <p className="text-sm text-gray-500">{step.description}</p>
                        </CardContent>
                      </Card>

                      {/* Connecting Arrows (Desktop Only) */}
                      {step.arrow && (
                        <div className={`absolute z-20 hidden lg:flex items-center justify-center text-gray-300
                          ${step.arrowPos === 'right' ? '-right-5 top-1/2 -translate-y-1/2' : ''}
                          ${step.arrowPos === 'bottom' ? '-bottom-5 left-1/2 -translate-x-1/2' : ''}
                          ${step.arrowPos === 'left' ? '-left-5 top-1/2 -translate-y-1/2' : ''}
                        `}>
                          <step.arrow size={24} strokeWidth={3} />
                        </div>
                      )}
                      
                      {/* Mobile Arrow (Down for all except last) */}
                      {index < steps.length - 1 && (
                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-20 flex lg:hidden text-gray-300">
                           <ArrowDown size={20} />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Dashboard Mockup Snippet */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden mt-6"
              >
                 <div className="p-6">
                   <div className="flex justify-between items-center mb-6">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
                        <h3 className="text-3xl font-bold text-gray-900">₱15,450.00</h3>
                      </div>
                      <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                        <TrendingUp size={12} />
                        +12%
                      </div>
                   </div>
                   
                   {/* Mock Chart Area */}
                   <div className="relative h-24 w-full overflow-hidden">
                      <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d="M0,40 L0,30 C10,25 20,35 30,20 C40,5 50,25 60,15 C70,5 80,10 90,5 L100,0 L100,40 Z" fill="url(#gradient)" />
                        <path d="M0,30 C10,25 20,35 30,20 C40,5 50,25 60,15 C70,5 80,10 90,5 L100,0" fill="none" stroke="#22c55e" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                      </svg>
                   </div>
                   
                   <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-50">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">Clicks</p>
                        <p className="font-semibold text-gray-700">1,240</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">Orders</p>
                        <p className="font-semibold text-gray-700">85</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">Conversion</p>
                        <p className="font-semibold text-gray-700">6.8%</p>
                      </div>
                   </div>
                 </div>
              </motion.div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

