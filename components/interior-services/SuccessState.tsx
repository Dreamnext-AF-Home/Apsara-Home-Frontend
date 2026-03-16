'use client';

import { motion } from "framer-motion";

const SuccessState = ({ firstName }: { firstName: string }) => {
  return (
    <motion.div
      className="flex flex-col items-center px-8 py-16 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative mb-8">
        <motion.div
          className="flex h-20 w-20 items-center justify-center rounded-full border border-indigo-200"
          style={{ background: "rgba(99,102,241,0.08)" }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 15 }}
        >
          <motion.span
            className="text-2xl text-indigo-500"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            ✓
          </motion.span>
        </motion.div>
        <motion.div
          className="absolute inset-0 rounded-full border border-indigo-300/40"
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <h3 className="mb-3 font-['Cormorant_Garamond'] text-3xl font-light text-slate-900">
          Enquiry Received
        </h3>
        <p className="max-w-sm text-[0.87rem] leading-relaxed text-slate-500">
          Thank you{firstName ? `, ${firstName}` : ""}. Your consultation request
          has been prepared and our design team will be in touch within{" "}
          <span className="text-slate-800 font-medium">24 hours</span> using the details you
          provided.
        </p>
      </motion.div>

      <motion.div
        className="mt-10 flex gap-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {[
          { icon: "✦", label: "Keep your phone nearby" },
          { icon: "◈", label: "Prepare your space photos" },
          { icon: "◉", label: "List your must-haves" },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-2">
            <span className="text-sm text-indigo-500">{item.icon}</span>
            <span className="text-[0.68rem] uppercase tracking-[0.1em] text-slate-400">{item.label}</span>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default SuccessState;
