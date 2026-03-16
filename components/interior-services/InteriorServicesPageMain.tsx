'use client'

import Image from "next/image"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import BookingSection from "./sections/BookingSection"
import ServiceSection from "./sections/ServiceSection"
import {
  fadeUp,
  fadeIn,
  slideRight,
  scaleIn,
  staggerSlow,
  staggerItem,
  floatY,
} from "./animation"

const InteriorServicesPageMain = () => {
  const heroRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(heroRef, { once: true, margin: "-60px" })

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,#fffef7_0%,#fff7d6_34%,#fffdf5_100%)]">
      <section className="relative overflow-hidden border-b border-slate-200/70 bg-white/70">
        {/* Background radial glow */}
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at top right, rgba(212,165,20,0.22), transparent 38%), radial-gradient(circle at bottom left, rgba(17,17,17,0.06), transparent 32%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
        />

        <div
          ref={heroRef}
          className="relative mx-auto grid max-w-7xl gap-10 px-6 py-14 md:px-10 lg:grid-cols-[1.05fr_1.15fr] lg:items-center lg:gap-14 lg:py-20"
        >
          {/* ── Left column ── */}
          <div className="max-w-xl">
            {/* Label */}
            <motion.p
              className="mb-4 text-[11px] font-bold uppercase tracking-[0.24em] text-[#9c7420]"
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={fadeUp}
              custom={0}
            >
              Interior Services
            </motion.p>

            {/* Heading */}
            <div className="overflow-hidden">
              <motion.h1
                className="font-['Cormorant_Garamond'] text-[clamp(2.8rem,6vw,5.2rem)] font-light leading-[0.98] text-slate-900"
                initial={{ opacity: 0, y: 60 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
                transition={{ duration: 0.85, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                Dream, Build,
                <br />
                <motion.span
                  className="italic text-[#9c7420]"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ duration: 0.85, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  Refine Every Room
                </motion.span>
              </motion.h1>
            </div>

            {/* Description */}
            <motion.p
              className="mt-5 max-w-lg text-sm leading-7 text-slate-600 md:text-[15px]"
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={fadeUp}
              custom={0.38}
            >
              From tailored residential styling to commercial fit-outs, we turn early ideas into refined,
              functional spaces with a polished end-to-end design experience.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              className="mt-8 flex flex-col gap-3 sm:flex-row"
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={staggerSlow}
            >
              <motion.button
                type="button"
                onClick={() => scrollTo("booking")}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9c7420] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(156,116,32,0.32)] transition hover:bg-[#b8882a] hover:shadow-[0_12px_32px_rgba(156,116,32,0.40)]"
                variants={staggerItem}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Book A Consultation
              </motion.button>
              <motion.button
                type="button"
                onClick={() => scrollTo("services")}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/90 px-7 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-[#d4a514] hover:text-[#9c7420]"
                variants={staggerItem}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Explore Services ↓
              </motion.button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              className="mt-10 flex items-center gap-6 border-t border-slate-100 pt-8"
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={staggerSlow}
            >
              {[
                { value: "4", label: "Design Tracks" },
                { value: "1:1", label: "Personal Lead" },
                { value: "200+", label: "Projects Done" },
              ].map((item, i) => (
                <motion.div key={item.label} className="flex items-center gap-6" variants={staggerItem}>
                  <div>
                    <motion.p
                      className="font-['Cormorant_Garamond'] text-2xl font-semibold text-slate-900"
                      initial={{ opacity: 0, y: 12 }}
                      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                      transition={{ duration: 0.5, delay: 0.65 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {item.value}
                    </motion.p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  </div>
                  {i < 2 && <div className="h-8 w-px bg-slate-200" />}
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* ── Right column — image ── */}
          <motion.div
            className="relative"
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={scaleIn}
            custom={0.2}
          >
            {/* Animated glow blob */}
            <motion.div
              className="absolute -inset-4 rounded-4xl bg-linear-to-br from-amber-200/45 via-yellow-100/30 to-white blur-2xl"
              animate={floatY.animate}
            />

            {/* Image card */}
            <motion.div
              className="relative overflow-hidden rounded-4xl border border-white/80 bg-white shadow-[0_30px_80px_rgba(79,70,229,0.14)]"
              initial={{ opacity: 0, x: 40 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
              transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.015, transition: { duration: 0.4 } }}
            >
              <motion.div
                initial={{ scale: 1.08 }}
                animate={isInView ? { scale: 1 } : { scale: 1.08 }}
                transition={{ duration: 1.2, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                <Image
                  src="/DreambuildBanner.jpg"
                  alt="Interior design services — elegant living space by Apsara Home"
                  width={1600}
                  height={980}
                  className="h-full w-full object-cover"
                  priority
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <ServiceSection id="services" />

      <BookingSection id="booking" />
    </main>
  )
}

export default InteriorServicesPageMain
