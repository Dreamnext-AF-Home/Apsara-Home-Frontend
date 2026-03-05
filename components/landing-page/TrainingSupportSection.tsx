import { motion } from 'framer-motion';
import { GraduationCap, Calendar, Mic, PlayCircle, Video, Users } from 'lucide-react';

export default function TrainingSupportSection() {
  const highlights = [
    {
      icon: GraduationCap,
      text: "Affiliate onboarding sessions",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: Users,
      text: "Product & selling trainings",
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: Video,
      text: "Content and marketing tips",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: Mic,
      text: "Online and in-person events",
      color: "bg-pink-100 text-pink-600"
    }
  ];

  const events = [
    { day: "15", month: "FEB", title: "Affiliate Bootcamp", time: "2:00 PM" },
    { day: "18", month: "FEB", title: "Content Mastery", time: "4:00 PM" },
    { day: "22", month: "FEB", title: "Live Q&A Session", time: "1:00 PM" }
  ];

  const webinars = [
    { 
      title: "Getting Started Guide", 
      image: "/Images/landing/get-started.png",
      duration: "15:00",
      category: "Onboarding"
    },
    { 
      title: "Advanced Sales Tactics", 
      image: "/Images/landing/sales-tactics.png",
      duration: "45:30",
      category: "Sales" 
    },
    { 
      title: "Social Media Algorithms", 
      image: "/Images/landing/social-media-algorithms.png",
      duration: "32:00",
      category: "Social"
    }
  ];

  return (
    <section id="training" className="py-16 md:py-24 bg-white overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 sm:top-20 -left-10 sm:-left-20 w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 bg-orange-50 rounded-full mix-blend-multiply filter blur-3xl opacity-40 sm:opacity-50" />
        <div className="absolute bottom-10 sm:bottom-20 -right-10 sm:-right-20 w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-40 sm:opacity-50" />
      </div>

      <div className="container px-4 mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          
          {/* Text Content */}
          <div className="order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 font-semibold text-sm mb-6"
            >
              <GraduationCap size={14} />
              TRAININGS, EVENTS & SUPPORT
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight"
            >
              You’re Never Doing <br />
              <span className="text-orange-600">This Alone.</span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 mb-10 leading-relaxed"
            >
              AF Home provides ongoing training, tools, and events to help affiliates succeed—whether you’re a beginner or experienced seller.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="grid sm:grid-cols-2 gap-6"
            >
              {highlights.map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                    <item.icon size={22} />
                  </div>
                  <div className="pt-2">
                    <h4 className="font-bold text-gray-900 text-lg leading-none mb-2">{item.text}</h4>
                    <div className="h-1 w-12 bg-gray-100 rounded-full" />
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Visual Content - Calendar & Webinar Library */}
          <div className="order-2 relative perspective-1000">
             
             {/* Main Card - Webinar Grid */}
             <motion.div
                initial={{ opacity: 0, x: 50, rotateY: -5 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative z-10 bg-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-800"
             >
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-white font-bold text-lg flex items-center gap-2">
                      <Video size={20} className="text-orange-500" />
                      Training Library
                   </h3>
                   <span className="text-xs font-medium text-gray-400 bg-gray-800 px-3 py-1 rounded-full">50+ Videos</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {webinars.map((webinar, index) => (
                      <div key={index} className="group cursor-pointer">
                         <div className="relative rounded-xl overflow-hidden mb-2 aspect-video bg-gray-800">
                            <img 
                              src={webinar.image} 
                              alt={webinar.title} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100" 
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                  <PlayCircle size={16} className="text-white fill-white" />
                               </div>
                            </div>
                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                               {webinar.duration}
                            </div>
                         </div>
                         <h4 className="text-white text-sm font-semibold leading-tight mb-1 group-hover:text-orange-400 transition-colors line-clamp-1">{webinar.title}</h4>
                         <p className="text-gray-500 text-xs">{webinar.category}</p>
                      </div>
                   ))}
                </div>
             </motion.div>

             {/* Floating Calendar Card */}
             <motion.div
                initial={{ opacity: 0, y: 50, x: -20 }}
                whileInView={{ opacity: 1, y: 0, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="relative mt-6 sm:absolute sm:mt-0 sm:-bottom-10 sm:-left-10 z-20 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 w-full sm:w-64"
             >
                <div className="flex items-center gap-2 mb-4">
                    <Calendar size={18} className="text-orange-500" />
                    <h4 className="font-bold text-gray-900 text-sm">Upcoming Events</h4>
                </div>
                
                <div className="space-y-3">
                    {events.map((event, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="bg-orange-50 rounded-lg p-2 text-center min-w-[3rem]">
                                <span className="block text-xs font-bold text-orange-600">{event.month}</span>
                                <span className="block text-lg font-bold text-gray-900 leading-none">{event.day}</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900 leading-tight">{event.title}</p>
                                <p className="text-xs text-gray-500">{event.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
             </motion.div>

          </div>

        </div>
      </div>
    </section>
  );
}

