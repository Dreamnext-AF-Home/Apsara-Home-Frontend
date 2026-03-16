'use client';

import { staggerItem } from "./animation";
import { ServiceItem } from "./types";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

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
      className="group relative cursor-pointer rounded-3xl overflow-hidden"
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

      {/* Cover image */}
      <div className="relative h-44 w-full overflow-hidden">
        <Image
          src={service.image}
          alt={service.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Gradient overlay so content below reads cleanly */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Active indicator dot — moved here on top of image */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              className="absolute top-3 right-3 w-2 h-2 rounded-full"
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

        {/* Icon badge over image */}
        <div
          className="absolute bottom-3 left-4 text-xl"
          style={{ color: "white", textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}
        >
          {service.icon}
        </div>
      </div>

      <div className="p-6">
        {/* Index number */}
        <div
          className="font-['Cormorant_Garamond'] text-[2.4rem] font-light leading-none mb-2 select-none"
          style={{ color: `${service.accentColor}30` }}
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
              <div className="w-1 h-1 rounded-full shrink-0" style={{ background: service.accentColor }} />
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
