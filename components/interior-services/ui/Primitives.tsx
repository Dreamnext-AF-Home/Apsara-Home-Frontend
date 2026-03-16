// ─────────────────────────────────────────────────────────────────────────────
// ui/Primitives.tsx — Reusable UI atoms
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";

// ── Section eyebrow label ──────────────────────────────────────────────────
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px w-8 bg-[#d4a514]" />
      <span className="text-[0.65rem] tracking-[0.22em] uppercase text-[#9c7420] font-medium">
        {children}
      </span>
    </div>
  );
}

// ── Form field wrapper ─────────────────────────────────────────────────────
export function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[0.68rem] tracking-[0.14em] uppercase text-slate-500 font-medium">
        {label}
        {required && <span className="text-[#d4a514] ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Text input ─────────────────────────────────────────────────────────────
export function InputField({
  type = "text",
  placeholder,
  value,
  onChange,
  name,
}: {
  type?: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  name?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="w-full bg-white text-slate-800 placeholder:text-slate-300 text-sm px-4 py-3 rounded-[4px] outline-none transition-all duration-300"
      style={{
        border: focused
          ? "1px solid rgba(212,165,20,0.7)"
          : "1px solid rgba(15,23,42,0.12)",
        boxShadow: focused ? "0 0 0 3px rgba(212,165,20,0.12)" : "none",
      }}
    />
  );
}

// ── Select field ───────────────────────────────────────────────────────────
export function SelectField({
  options,
  placeholder,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full bg-white text-sm px-4 py-3 rounded-[4px] outline-none appearance-none transition-all duration-300 cursor-pointer"
        style={{
          color: value ? "#1e293b" : "#94a3b8",
        border: focused
            ? "1px solid rgba(212,165,20,0.7)"
            : "1px solid rgba(15,23,42,0.12)",
          boxShadow: focused ? "0 0 0 3px rgba(212,165,20,0.12)" : "none",
        }}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-white text-slate-800">
            {o.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
        ▾
      </div>
    </div>
  );
}

// ── Textarea field ─────────────────────────────────────────────────────────
export function TextareaField({
  placeholder,
  value,
  onChange,
  rows = 5,
}: {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      rows={rows}
      className="w-full bg-white text-slate-800 placeholder:text-slate-300 text-sm px-4 py-3 rounded-[4px] outline-none resize-none transition-all duration-300"
      style={{
        border: focused
          ? "1px solid rgba(212,165,20,0.7)"
          : "1px solid rgba(15,23,42,0.12)",
        boxShadow: focused ? "0 0 0 3px rgba(212,165,20,0.12)" : "none",
      }}
    />
  );
}

// ── Primary CTA button ─────────────────────────────────────────────────────
export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="group relative overflow-hidden bg-[#111111] text-white text-[0.72rem] tracking-[0.14em] uppercase font-semibold px-7 py-3.5 rounded-[4px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(17,17,17,0.28)] disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-[#d4a514] to-[#c9891b] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
}

// ── Ghost button ───────────────────────────────────────────────────────────
export function GhostButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-[0.72rem] tracking-[0.14em] uppercase text-slate-400 hover:text-[#9c7420] transition-colors duration-300 flex items-center gap-2"
    >
      {children}
    </button>
  );
}
