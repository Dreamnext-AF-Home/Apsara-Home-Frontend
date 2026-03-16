'use client';

import { AnimatePresence, motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { BookingFormData, FORM_STEPS, FormStep, INITIAL_FORM_DATA } from "../types";
import { GhostButton, PrimaryButton, SectionLabel } from "../ui/Primitives";
import { fadeUp, slideLeft, stepFade } from "../animation";
import StepIndicator from "../StepIndicator";
import SuccessState from "../SuccessState";
import StepService from "../StepService";
import StepSchedule from "../StepSchedule";
import StepContact from "../StepContact";
import StepReview from "../StepReview";

const BookingSection = ({ id }: { id?: string }) => {
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [form, setForm] = useState<BookingFormData>(INITIAL_FORM_DATA);
  const [submitted, setSubmitted] = useState(false);
  const [stepError, setStepError] = useState('');

  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const handleChange = (field: keyof BookingFormData, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setStepError('');
  };

  const validateStep = (step: FormStep) => {
    if (step === 1 && !form.serviceType.trim()) {
      return 'Please choose a service type before continuing.';
    }

    if (step === 1 && !form.projectType.trim()) {
      return 'Please choose a project type before continuing.';
    }

    if (step === 2) {
      if (!form.preferredDate.trim()) return 'Please select your preferred consultation date.';
      if (!form.preferredTime.trim()) return 'Please choose a preferred consultation time.';
    }

    if (step === 3) {
      if (!form.firstName.trim()) return 'Please enter your first name.';
      if (!form.lastName.trim()) return 'Please enter your last name.';
      if (!form.email.trim()) return 'Please enter your email address.';

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(form.email.trim())) return 'Please enter a valid email address.';
    }

    return '';
  };

  const handleNext = () => {
    const validationMessage = validateStep(currentStep);
    if (validationMessage) {
      setStepError(validationMessage);
      return;
    }

    setStepError('');

    if (currentStep < 4) {
      setCurrentStep((s) => (s + 1) as FormStep);
      return;
    }

    try {
      const existingRequests = JSON.parse(window.localStorage.getItem('afhome-interior-bookings') ?? '[]') as BookingFormData[];
      window.localStorage.setItem(
        'afhome-interior-bookings',
        JSON.stringify([...existingRequests, { ...form }]),
      );
    } catch {
      // Ignore storage failures for now.
    }

    setSubmitted(true);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => (s - 1) as FormStep);
      setStepError('');
    }
  };

  const stepLabels = ["Service & Scope", "Date & Time", "Contact Info", "Notes & Review"];
  const ctaLabels = ["Continue →", "Continue →", "Continue →", "Submit Enquiry"];

  return (
    <section
      id={id}
      ref={ref}
      className="relative overflow-hidden py-32"
      style={{
        background: "linear-gradient(180deg, #EEF2FF 0%, #F5F7FF 50%, #EEF2FF 100%)",
      }}
    >
      {/* Futuristic glow orb */}
      <div
        className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full opacity-60 pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)",
          transform: "translate(30%, -30%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full opacity-40 pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 65%)",
          transform: "translate(-30%, 30%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1100px] px-8">
        <div className="grid items-start gap-16 lg:grid-cols-[1fr_1.1fr]">
          <div className="lg:sticky lg:top-24">
            <motion.div
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={slideLeft}
              custom={0}
            >
              <SectionLabel>Book a Consultation</SectionLabel>
              <h2 className="mb-5 font-['Cormorant_Garamond'] text-[clamp(2.4rem,4vw,3.8rem)] font-light leading-[1.08] text-slate-900">
                Begin Your
                <br />
                <em style={{ fontStyle: "italic" }}>Project</em>
              </h2>
            </motion.div>

            <motion.p
              className="mb-10 max-w-sm text-[0.87rem] leading-relaxed text-slate-500"
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={fadeUp}
              custom={0.2}
            >
              Fill in the form and our team will reach out within 24 hours to
              discuss your vision, answer questions, and outline next steps with
              no commitment required.
            </motion.p>

            <motion.div
              className="flex flex-col gap-5"
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={fadeUp}
              custom={0.35}
            >
              {[
                { icon: "◈", title: "Free Initial Consultation", desc: "No cost and no pressure, just a conversation about your project." },
                { icon: "◉", title: "Dedicated Design Lead", desc: "One point of contact from enquiry through to completion." },
                { icon: "◻", title: "Transparent Pricing", desc: "Clear proposals before any work begins with no surprise costs." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="mt-0.5 shrink-0 text-lg text-indigo-500">
                    {item.icon}
                  </div>
                  <div>
                    <div className="mb-1 text-[0.82rem] font-medium text-slate-700">{item.title}</div>
                    <div className="text-[0.75rem] leading-relaxed text-slate-400">{item.desc}</div>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              className="mt-12 border-t border-slate-200 pt-8"
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={fadeUp}
              custom={0.5}
            >
              <p className="mb-2 text-[0.7rem] uppercase tracking-[0.1em] text-slate-400">
                Prefer to call?
              </p>
              <p className="text-[0.9rem] text-slate-700">+63 912 345 6789</p>
              <p className="mt-1 text-[0.75rem] text-slate-400">Mon – Sat, 9am – 6pm PHT</p>
            </motion.div>
          </div>

          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0.15}
          >
            <div
              className="overflow-hidden rounded-[8px]"
              style={{
                border: "1px solid rgba(99,102,241,0.15)",
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(16px)",
                boxShadow: "0 4px 40px rgba(79,70,229,0.06), 0 1px 0 rgba(255,255,255,0.8) inset",
              }}
            >
              {submitted ? (
                <SuccessState firstName={form.firstName} />
              ) : (
                <div className="p-8">
                  <StepIndicator currentStep={currentStep} onStepClick={(step) => setCurrentStep(step)} />

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`title-${currentStep}`}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mb-6"
                    >
                      <h3 className="font-['Cormorant_Garamond'] text-[1.4rem] font-light leading-tight text-slate-900">
                        {stepLabels[currentStep - 1]}
                      </h3>
                      <div className="mt-2 h-px w-8 bg-indigo-500/60" />
                    </motion.div>
                  </AnimatePresence>

                  <AnimatePresence>
                    {stepError && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="mb-5 rounded-[4px] border border-red-300/60 bg-red-50 px-4 py-3 text-[0.74rem] text-red-600"
                      >
                        {stepError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`step-${currentStep}`}
                      variants={stepFade}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      {currentStep === 1 && <StepService form={form} onChange={handleChange} />}
                      {currentStep === 2 && <StepSchedule form={form} onChange={handleChange} />}
                      {currentStep === 3 && <StepContact form={form} onChange={handleChange} />}
                      {currentStep === 4 && <StepReview form={form} onChange={handleChange} />}
                    </motion.div>
                  </AnimatePresence>

                  <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                    <div>
                      {currentStep > 1 && <GhostButton onClick={handleBack}>← Back</GhostButton>}
                    </div>
                    <PrimaryButton onClick={handleNext}>{ctaLabels[currentStep - 1]}</PrimaryButton>
                  </div>

                  <div className="mt-4 text-center">
                    <span className="text-[0.65rem] tracking-[0.1em] text-slate-400">
                      Step {currentStep} of {FORM_STEPS.length}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BookingSection;
