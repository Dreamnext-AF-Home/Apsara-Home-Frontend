import { motion } from "framer-motion";
import { UserPlus, Share2, Wallet } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: UserPlus,
    title: "Register for Free",
    description:
      "Sign up as an AF Home affiliate in minutes. No fees, no inventory, no capital required.",
    color: "bg-blue-100 text-blue-600",
    border: "border-blue-200",
  },
  {
    step: "02",
    icon: Share2,
    title: "Share Products",
    description:
      "Get your unique affiliate link. Share AF Home products to your family, friends, and social media followers.",
    color: "bg-orange-100 text-orange-600",
    border: "border-orange-200",
  },
  {
    step: "03",
    icon: Wallet,
    title: "Earn & Enjoy",
    description:
      "Collect commissions on every successful sale. Plus, enjoy lifetime discounts on all AF Home products for yourself.",
    color: "bg-green-100 text-green-600",
    border: "border-green-200",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-white overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 font-semibold text-sm mb-4">
            SIMPLE PROCESS
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Start earning in 3 easy steps - no experience needed.
          </p>
        </motion.div>

        <div className="relative grid md:grid-cols-3 gap-8 md:gap-6">
          <div className="hidden md:block absolute top-14 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-0.5 bg-gradient-to-r from-blue-200 via-orange-200 to-green-200 z-0" />

          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              className="relative z-10 flex flex-col items-center text-center"
            >
              <div
                className={`w-28 h-28 rounded-full ${step.color} border-4 ${step.border} flex flex-col items-center justify-center mb-6 shadow-md bg-white`}
              >
                <step.icon size={36} className={step.color.split(" ")[1]} />
                <span className="text-xs font-bold text-gray-400 mt-1">
                  {step.step}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-500 leading-relaxed max-w-xs">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16"
        >
          <a
            href="/login"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-4 rounded-full text-lg transition-all duration-300 shadow-lg hover:shadow-orange-200 hover:shadow-xl"
          >
            Get Started - It&apos;s Free
          </a>
        </motion.div>
      </div>
    </section>
  );
}

