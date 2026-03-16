'use client';

import { staggerContainer, staggerItem } from "./animation";
import { BookingFormData, SERVICES } from "./types";
import { motion } from "framer-motion";
import { FormField, TextareaField } from "./ui/Primitives";
import SummaryRow from "./SummaryRow";

interface StepReviewProps {
    form: BookingFormData;
    onChange: (field: keyof BookingFormData, value: string | string[]) => void;
}
const StepReview = ({ form, onChange }: StepReviewProps) => {
  const selectedService = SERVICES.find((s) => s.id === form.serviceType);
  const handleFileChange = (files: FileList | null) => {
    const names = files ? Array.from(files).map((file) => file.name) : [];
    onChange("inspirationFiles", names);
  };

  const uploadedFiles = Array.isArray(form.inspirationFiles)
    ? form.inspirationFiles
    : [];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-7"
    >
      {/* Notes / message textarea */}
      <motion.div variants={staggerItem}>
        <FormField label="Project Notes & Message">
          <TextareaField
            placeholder="Tell us about your space, your style influences, what you hope to feel when you walk through the door, any inspiration images, specific requirements, or anything else you'd like us to know..."
            value={form.notes}
            onChange={(v) => onChange("notes", v)}
            rows={5}
          />
        </FormField>
        <p className="text-[0.68rem] text-slate-400 mt-2">
          The more detail you share, the better we can prepare for your consultation.
        </p>
      </motion.div>

      <motion.div variants={staggerItem}>
        <FormField label="Upload Inspiration Photos or Floor Plan">
          <label
            className="flex cursor-pointer flex-col items-center justify-center rounded-[4px] px-5 py-7 text-center transition-colors"
            style={{
              border: "1.5px dashed rgba(99,102,241,0.3)",
              background: "rgba(99,102,241,0.02)",
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)")}
          >
            <span className="mb-2 text-xl text-indigo-500">+</span>
            <span className="text-[0.78rem] text-slate-600">Choose up to a few reference files</span>
            <span className="mt-1 text-[0.68rem] text-slate-400">JPG, PNG, PDF, moodboard screenshots</span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              multiple
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files)}
            />
          </label>
          {uploadedFiles.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {uploadedFiles.map((fileName) => (
                <span
                  key={fileName}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[0.68rem] text-indigo-600"
                >
                  {fileName}
                </span>
              ))}
            </div>
          )}
        </FormField>
      </motion.div>

      {/* Review summary card */}
      <motion.div
        variants={staggerItem}
        className="rounded-[6px] overflow-hidden"
        style={{
          border: "1px solid rgba(99,102,241,0.15)",
          background: "linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(255,255,255,0.9) 100%)",
        }}
      >
        <div
          className="px-5 py-3.5 border-b flex items-center justify-between"
          style={{ borderColor: "rgba(99,102,241,0.1)" }}
        >
          <span className="text-[0.68rem] tracking-[0.18em] uppercase text-indigo-600">
            Booking Summary
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[0.6rem] text-indigo-400">Ready to submit</span>
          </div>
        </div>

        <div className="px-5">
          <SummaryRow
            label="Service"
            value={selectedService?.title ?? form.serviceType}
          />
          <SummaryRow label="Project Type" value={form.projectType} />
          <SummaryRow label="Property Type" value={form.propertyType} />
          <SummaryRow label="Project Scope" value={form.projectScope} />
          <SummaryRow label="Budget" value={form.budget} />
          <SummaryRow label="Style Direction" value={form.stylePreference} />
          <SummaryRow
            label="Date"
            value={
              form.preferredDate
                ? new Date(form.preferredDate + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : ""
            }
          />
          <SummaryRow label="Time" value={form.preferredTime} />
          <SummaryRow label="Timeline" value={form.targetTimeline} />
          <SummaryRow
            label="Contact"
            value={
              [form.firstName, form.lastName].filter(Boolean).join(" ") ||
              form.email
            }
          />
          <SummaryRow label="Email" value={form.email} />
          <SummaryRow
            label="Uploads"
            value={uploadedFiles.length ? `${uploadedFiles.length} file(s) attached` : "No files attached"}
          />
        </div>
      </motion.div>

      {/* Commitment note */}
      <motion.div
        variants={staggerItem}
        className="flex items-start gap-3 p-4 rounded-[4px]"
        style={{
          background: "rgba(99,102,241,0.03)",
          border: "1px solid rgba(99,102,241,0.1)",
        }}
      >
        <span className="text-indigo-500 text-sm mt-0.5">✦</span>
        <p className="text-[0.75rem] text-slate-500 leading-relaxed">
          By submitting this form you're not committing to any contract. This is simply a consultation request — our team will reach out within{" "}
          <span className="text-slate-700">24 hours</span> to discuss your project.
        </p>
      </motion.div>
    </motion.div>
  )
}

export default StepReview
