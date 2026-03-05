import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Check, Sparkles } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setEmail('');
      }, 4000);
    }
  };

  return (
    <section className="py-24 md:py-32 bg-af-cream relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, #2C5F4F 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10 lg:px-20">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.2,
                ease: [0.34, 1.56, 0.64, 1] as const,
              }}
              className="w-16 h-16 mx-auto mb-6 bg-af-forest/10 rounded-full flex items-center justify-center"
            >
              <Sparkles size={28} className="text-orange-500" />
            </motion.div>

            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-af-text font-semibold mb-4">
              Join Our Community
            </h2>
            <p className="text-af-text-secondary text-lg mb-8">
              Subscribe for exclusive offers, design inspiration, and first
              access to new collections.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="relative"
          >
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative"
                >
                  <div
                    className={`relative bg-white rounded-full p-2 shadow-soft transition-all duration-500 ${
                      isFocused ? 'shadow-soft-lg ring-2 ring-af-forest/20' : ''
                    }`}
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="Enter your email address"
                      className="w-full bg-transparent px-6 py-4 text-af-text placeholder-af-text-secondary focus:outline-none font-body pr-36"
                      required
                    />
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-500 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-[#c4955f] transition-colors"
                    >
                      Subscribe
                      <Send size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-green-500 text-white rounded-full py-6 px-8 flex items-center justify-center gap-3"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Check size={24} />
                  </motion.div>
                  <span className="font-semibold text-lg">
                    Welcome to AFhome! Check your inbox.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-af-text-secondary text-sm mt-4"
          >
            By subscribing, you agree to our Privacy Policy. Unsubscribe
            anytime.
          </motion.p>
        </div>
      </div>
    </section>
  );
}

