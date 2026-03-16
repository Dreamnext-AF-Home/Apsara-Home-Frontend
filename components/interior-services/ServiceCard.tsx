'use client';

import { staggerItem } from "./animation";
import { ServiceItem } from "./types";
import { AnimatePresence, motion } from "framer-motion";

interface ServiceCardProps {
    service: ServiceItem;
    isActive: boolean;
    onClick: () => void;
    index: number;
}

const ServiceCard = ({ service, isActive, onClick, index}: ServiceCardProps) => {
  return (
        <motion.div
      variants={staggerItem}
      onClick={onClick}
      className="group relative cursor-pointer rounded-[6px] overflow-hidden"
      style={{
        border: isActive
          ? `1px solid ${service.accentColor}60`
          : "1px solid rgba(99,102,241,0.1)",
        background: isActive
          ? `linear-gradient(135deg, ${service.accentColor}08 0%, rgba(255,255,255,0.95) 100%)`
          : "rgba(255,255,255,0.9)",
        boxShadow: isActive
          ? `0 8px 32px ${service.accentColor}18`
          : "0 2px 12px rgba(79,70,229,0.04)",
      }}
      whileHover={{ y: -6, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
      animate={{
        boxShadow: isActive
          ? `0 20px 60px ${service.accentColor}18, 0 0 0 1px ${service.accentColor}30`
          : "0 2px 12px rgba(79,70,229,0.04)",
      }}
      transition={{ duration: 0.4 }}
    >
      {/* Hover shimmer */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${service.accentColor}06 0%, transparent 60%)`,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Active indicator dot */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute top-4 right-4 w-2 h-2 rounded-full"
            style={{ background: service.accentColor }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: service.accentColor }}
              animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-7">
        {/* Icon */}
        <motion.div
          className="text-2xl mb-4 transition-transform duration-300"
          style={{ color: service.accentColor }}
          animate={{ rotate: isActive ? [0, -5, 5, 0] : 0 }}
          transition={{ duration: 0.5 }}
        >
          {service.icon}
        </motion.div>

        {/* Index number */}
        <div
          className="font-['Cormorant_Garamond'] text-[2.8rem] font-light leading-none mb-3 select-none"
          style={{ color: `${service.accentColor}25` }}
        >
          {String(index + 1).padStart(2, "0")}
        </div>

        <h3 className="font-['Cormorant_Garamond'] text-xl font-medium text-slate-800 mb-1 tracking-wide">
          {service.title}
        </h3>
        <p
          className="text-[0.7rem] tracking-[0.12em] uppercase mb-4"
          style={{ color: service.accentColor }}
        >
          {service.tagline}
        </p>
        <p className="text-[0.82rem] text-slate-500 leading-relaxed mb-5">
          {service.description}
        </p>

        {/* Features */}
        <div className="flex flex-col gap-2">
          {service.features.map((feature) => (
            <div key={feature} className="flex items-center gap-2.5">
              <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: service.accentColor }} />
              <span className="text-[0.75rem] text-slate-500">{feature}</span>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-6 flex items-center gap-2 text-[0.68rem] tracking-[0.14em] uppercase"
          style={{ color: service.accentColor }}
          animate={{ opacity: isActive ? 1 : 0.5 }}
        >
          <span>Learn more</span>
          <motion.div
            className="h-px bg-current"
            animate={{ width: isActive ? "24px" : "12px" }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}

export default ServiceCard
