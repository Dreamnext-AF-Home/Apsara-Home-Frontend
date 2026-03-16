'use client';

import { motion } from "framer-motion";
import { BookingFormData } from "./types";
import { staggerContainer, staggerItem } from "./animation";
import { FormField, InputField, SelectField } from "./ui/Primitives";

interface StepContactProps {
  form: BookingFormData;
  onChange: (field: keyof BookingFormData, value: string | string[]) => void;
}

const REFERRAL_OPTIONS = [
  { value: "search", label: "Google / Search engine" },
  { value: "instagram", label: "Instagram" },
  { value: "pinterest", label: "Pinterest" },
  { value: "referral", label: "Friend / Colleague referral" },
  { value: "press", label: "Magazine / Press feature" },
  { value: "other", label: "Other" },
];

const StepContact = ({ form, onChange }: StepContactProps) => {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-4">
        <FormField label="First Name" required>
          <InputField
            placeholder="e.g. Maria"
            value={form.firstName}
            onChange={(v) => onChange("firstName", v)}
          />
        </FormField>
        <FormField label="Last Name" required>
          <InputField
            placeholder="e.g. Santos"
            value={form.lastName}
            onChange={(v) => onChange("lastName", v)}
          />
        </FormField>
      </motion.div>

      <motion.div variants={staggerItem}>
        <FormField label="Email Address" required>
          <InputField
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(v) => onChange("email", v)}
          />
        </FormField>
      </motion.div>

      <motion.div variants={staggerItem}>
        <FormField label="Phone Number">
          <InputField
            type="tel"
            placeholder="+63 912 345 6789"
            value={form.phone}
            onChange={(v) => onChange("phone", v)}
          />
        </FormField>
      </motion.div>

      <motion.div variants={staggerItem}>
        <FormField label="How Did You Hear About Us?">
          <SelectField
            options={REFERRAL_OPTIONS}
            placeholder="Select an option"
            value={form.referral}
            onChange={(v) => onChange("referral", v)}
          />
        </FormField>
      </motion.div>

      <motion.div variants={staggerItem} className="flex items-start gap-3 pt-2">
        <div
          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border border-indigo-300"
          style={{ background: "rgba(99,102,241,0.08)" }}
        >
          <span className="text-[9px] text-indigo-500">✓</span>
        </div>
        <p className="text-[0.72rem] leading-relaxed text-slate-400">
          I agree that AF Home may contact me regarding my enquiry. My information
          will never be shared with third parties. Read our{" "}
          <span className="cursor-pointer text-indigo-500 hover:underline">Privacy Policy</span>.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default StepContact;
