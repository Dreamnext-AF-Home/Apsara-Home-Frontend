'use client';

import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { SectionLabel } from "../ui/Primitives";
import { fadeUp, slideLeft, staggerContainer, staggerItem } from "../animation";
import { motion } from "framer-motion";
import { SERVICES } from "../types";
import ServiceCard from "../ServiceCard";

const PROCESS_STEPS = [
    { num: "01", title: "Discovery", desc: "Deep consultation to understand your lifestyle, vision, and the story your space should tell." },
    { num: "02", title: "Concept", desc: "Mood boards, spatial planning, and material palettes presented as a cohesive design direction." },
    { num: "03", title: "Design", desc: "Refined technical drawings, 3D visualizations, and complete specification packages." },
    { num: "04", title: "Realisation", desc: "On-site oversight of every contractor, delivery, and installation detail — to perfection." },
];

const ServiceSection = ({ id }: { id?: string }) => {
    const [activeService, setActiveService] = useState<string>("residential");
    const ref = useRef<HTMLElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section
            id={id}
            ref={ref}
            className="relative py-32 overflow-hidden"
            style={{ background: "linear-gradient(180deg, #fffdf4 0%, #fff8de 52%, #fffdf7 100%)" }}
        >
            {/* Subtle dot grid texture */}
            <div
                className="absolute inset-0 opacity-[0.4]"
                style={{
                    backgroundImage: `radial-gradient(circle, rgba(212,165,20,0.12) 1px, transparent 1px)`,
                    backgroundSize: "28px 28px",
                }}
            />

            <div className="relative z-10 px-8 max-w-[1180px] mx-auto">
                {/* Header */}
                <div className="flex items-end justify-between mb-16">
                    <motion.div
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                        variants={slideLeft}
                        custom={0}
                    >
                        <SectionLabel>Our Services</SectionLabel>
                        <h2 className="font-['Cormorant_Garamond'] text-[clamp(2.4rem,4.5vw,4rem)] font-light text-slate-900 leading-[1.08]">
                            Crafted for Every<br />
                            <em style={{ fontStyle: "italic" }}>Space & Vision</em>
                        </h2>
                    </motion.div>
                    <motion.p
                        className="max-w-[280px] text-[0.82rem] text-slate-500 leading-relaxed hidden lg:block"
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                        variants={fadeUp}
                        custom={0.3}
                    >
                        From the first sketch to the final accessory placement, we guide every step of the design journey.
                    </motion.p>
                </div>

                {/* Service cards grid */}
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-24"
                    variants={staggerContainer}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >
                    {SERVICES.map((service, i) => (
                        <ServiceCard
                            key={service.id}
                            service={service}
                            isActive={activeService === service.id}
                            onClick={() => setActiveService(service.id)}
                            index={i}
                        />
                    ))}
                </motion.div>

                {/* Process section */}
                <motion.div
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                    variants={fadeUp}
                    custom={0.5}
                >
                    <div className="border-t border-slate-200 pt-16">
                        <SectionLabel>How We Work</SectionLabel>
                        <h2 className="font-['Cormorant_Garamond'] text-3xl font-light text-slate-900 mb-12">
                            The Design Process
                        </h2>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0">
                            {PROCESS_STEPS.map((step, i) => (
                                <motion.div
                                    key={step.num}
                                    className="relative pr-8 pb-8"
                                    variants={staggerItem}
                                    initial="hidden"
                                    animate={isInView ? "visible" : "hidden"}
                                    transition={{ delay: i * 0.1 + 0.6 }}
                                >
                                    {/* Connector line */}
                                    {i < 3 && (
                                        <motion.div
                                            className="absolute top-5 right-0 h-px hidden lg:block"
                                            style={{
                                                left: "calc(3rem + 8px)",
                                                background: "linear-gradient(to right, rgba(212,165,20,0.42), rgba(17,17,17,0.06))",
                                            }}
                                            initial={{ scaleX: 0, originX: 0 }}
                                            animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                                            transition={{ delay: i * 0.15 + 0.9, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                        />
                                    )}

                                    <div className="font-['Cormorant_Garamond'] text-[2.5rem] font-light text-indigo-600/20 leading-none mb-3 select-none">
                                        {step.num}
                                    </div>
                                    <div className="font-['Cormorant_Garamond'] text-lg text-slate-800 mb-2">
                                        {step.title}
                                    </div>
                                    <p className="text-[0.78rem] text-slate-500 leading-relaxed">{step.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default ServiceSection
