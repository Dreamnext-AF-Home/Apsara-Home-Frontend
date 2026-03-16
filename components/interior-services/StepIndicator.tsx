'use client';

import { FORM_STEPS, FormStep } from "./types";
import { motion } from "framer-motion";

interface StepIndicatorProps {
    currentStep: FormStep;
    onStepClick: (step: FormStep) => void;
}

const StepIndicator = ({ currentStep, onStepClick }: StepIndicatorProps) => {
  return (
     <div className="flex items-center gap-0 mb-10">
      {FORM_STEPS.map((item, i) => {
        const isCompleted = currentStep > item.step;
        const isActive = currentStep === item.step;
        return (
          <div key={item.step} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => isCompleted && onStepClick(item.step)}
              className="flex flex-col items-center gap-1.5 group"
              style={{ cursor: isCompleted ? "pointer" : "default" }}
            >
              <motion.div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[0.72rem] font-medium transition-all duration-300"
                animate={{
                  background: isActive
                    ? "#111111"
                    : isCompleted
                    ? "rgba(212,165,20,0.18)"
                    : "rgba(15,23,42,0.05)",
                  border: isActive
                    ? "1px solid #111111"
                    : isCompleted
                    ? "1px solid rgba(212,165,20,0.45)"
                    : "1px solid rgba(15,23,42,0.12)",
                  color: isActive
                    ? "#ffffff"
                    : isCompleted
                    ? "#9c7420"
                    : "#94a3b8",
                }}
                transition={{ duration: 0.35 }}
              >
                {isCompleted ? "✓" : item.step}
              </motion.div>
              <span
                className="text-[0.6rem] tracking-[0.1em] uppercase transition-colors duration-300"
                style={{
                  color: isActive ? "#111111" : isCompleted ? "#9c7420" : "#cbd5e1",
                }}
              >
                {item.label}
              </span>
            </button>

            {/* Connector */}
            {i < FORM_STEPS.length - 1 && (
              <div className="flex-1 mx-3 h-px relative overflow-hidden mb-5">
                <div className="absolute inset-0 bg-amber-100/80" />
                <motion.div
                  className="absolute inset-0 bg-[#d4a514] origin-left"
                  animate={{ scaleX: isCompleted ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  )
}

export default StepIndicator
