import { motion } from 'framer-motion';
import { Users, UserPlus, Share2, TrendingUp, User, Video, Briefcase, ShoppingBag } from 'lucide-react';

export default function TeamSection() {
  const keyPoints = [
    {
      icon: UserPlus,
      text: "Refer friends & professionals",
      desc: "Invite creators, sellers, and experts"
    },
    {
      icon: Users,
      text: "Grow together",
      desc: "Support your team and unlock opportunities"
    },
    {
      icon: TrendingUp,
      text: "Scalable income",
      desc: "Ideal for OFWs, freelancers & entrepreneurs"
    }
  ];

  // Network nodes data
  const networkNodes = [
    { icon: Video, label: "Creators", color: "bg-pink-100 text-pink-600", position: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" },
    { icon: Briefcase, label: "Pros", color: "bg-blue-100 text-blue-600", position: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2" },
    { icon: ShoppingBag, label: "Sellers", color: "bg-purple-100 text-purple-600", position: "top-1/2 right-0 translate-x-1/2 -translate-y-1/2" },
    { icon: User, label: "Friends", color: "bg-orange-100 text-orange-600", position: "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2" },
  ];

  return (
    <section id="team" className="py-24 bg-gray-50 overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Visual Content - Network Diagram */}
          <div className="order-2 lg:order-1 flex justify-center">
            <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px]">
              
              {/* Connecting Lines (SVG) */}
              <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                <motion.g
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  {/* Lines radiating from center */}
                  <line x1="50%" y1="50%" x2="50%" y2="10%" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 6" />
                  <line x1="50%" y1="50%" x2="50%" y2="90%" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 6" />
                  <line x1="50%" y1="50%" x2="90%" y2="50%" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 6" />
                  <line x1="50%" y1="50%" x2="10%" y2="50%" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 6" />
                  
                  {/* Outer Circle Ring */}
                  <circle cx="50%" cy="50%" r="40%" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                </motion.g>
              </svg>

              {/* Center Node (YOU) */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
              >
                <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-green-100 relative">
                   <div className="absolute inset-0 rounded-full bg-green-50 animate-ping opacity-20" />
                   <img 
                     src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100" 
                     alt="You" 
                     className="w-full h-full rounded-full object-cover p-1"
                   />
                   <div className="absolute -bottom-2 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                     YOU
                   </div>
                </div>
              </motion.div>

              {/* Surrounding Nodes */}
              {networkNodes.map((node, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + (index * 0.1), type: "spring" }}
                  className={`absolute ${node.position} z-10 flex flex-col items-center`}
                >
                  <div className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center ${node.color} bg-white mb-2`}>
                    <node.icon size={24} />
                  </div>
                  <span className="text-sm font-semibold text-gray-600 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm">
                    {node.label}
                  </span>
                </motion.div>
              ))}

              {/* Floating "Invite Share Grow" badges */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 right-1/4 bg-white p-2 rounded-lg shadow-md flex items-center gap-2 z-0 opacity-80"
              >
                <Share2 size={14} className="text-blue-500" />
                <span className="text-xs font-bold text-gray-500">Share</span>
              </motion.div>
              
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-1/4 left-1/4 bg-white p-2 rounded-lg shadow-md flex items-center gap-2 z-0 opacity-80"
              >
                <TrendingUp size={14} className="text-green-500" />
                <span className="text-xs font-bold text-gray-500">Grow</span>
              </motion.div>

            </div>
          </div>

          {/* Text Content */}
          <div className="order-1 lg:order-2 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm mb-6"
            >
              <Users size={14} />
              BUILD A TEAM & REFERRAL SYSTEM
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Build a Team. <br />
              <span className="text-blue-600">Grow Together.</span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 mb-8 leading-relaxed"
            >
              Invite others to become affiliates and build your own network. 
              The more your community grows, the more opportunities you unlock.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              {keyPoints.map((point, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <point.icon size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-gray-900">{point.text}</h4>
                    <p className="text-sm text-gray-500">{point.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>

          </div>

        </div>
      </div>
    </section>
  );
}

