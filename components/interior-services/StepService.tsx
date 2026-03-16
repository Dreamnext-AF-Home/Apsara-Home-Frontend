'use client';

import { staggerContainer, staggerItem } from './animation';
import { BookingFormData, SERVICES } from './types';
import { motion } from 'framer-motion';
import { FormField, SelectField } from './ui/Primitives';

interface StepServiceProps {
  form: BookingFormData;
  onChange: (field: keyof BookingFormData, value: string | string[]) => void;
}

const PROJECT_SCOPE_OPTIONS = [
  { value: 'studio', label: 'Studio / Apartment (< 60 sqm)' },
  { value: 'small', label: 'Small Home (60–120 sqm)' },
  { value: 'medium', label: 'Medium Home (120–250 sqm)' },
  { value: 'large', label: 'Large Home (250 sqm+)' },
  { value: 'commercial', label: 'Commercial Space' },
];

const PROJECT_TYPE_OPTIONS = [
  { value: 'new-build', label: 'New Build / Bare Turnover' },
  { value: 'fit-out', label: 'Fit-out / Furnishing' },
  { value: 'renovation', label: 'Renovation / Refresh' },
  { value: 'styling', label: 'Styling / Finishing Touches' },
];

const PROPERTY_TYPE_OPTIONS = [
  { value: 'condo', label: 'Condominium' },
  { value: 'house', label: 'House & Lot' },
  { value: 'office', label: 'Office / Studio' },
  { value: 'retail', label: 'Retail / Showroom' },
  { value: 'other', label: 'Other' },
];

const BUDGET_OPTIONS = [
  { value: 'below-250k', label: 'Below PHP 250,000' },
  { value: '250k-750k', label: 'PHP 250,000 – PHP 750,000' },
  { value: '750k-1.5m', label: 'PHP 750,000 – PHP 1,500,000' },
  { value: '1.5m+', label: 'PHP 1,500,000+' },
  { value: 'unsure', label: 'Not sure yet' },
];

const STYLE_OPTIONS = [
  { value: 'modern-luxe', label: 'Modern Luxe' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'scandinavian', label: 'Scandinavian' },
  { value: 'contemporary', label: 'Contemporary' },
  { value: 'classic', label: 'Classic / Elegant' },
  { value: 'tropical', label: 'Tropical / Resort' },
];

const StepService = ({ form, onChange }: StepServiceProps) => {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-8"
    >
      <motion.div variants={staggerItem}>
        <FormField label="Service Type" required>
          <div className="mt-1 grid grid-cols-2 gap-3">
            {SERVICES.map((service) => {
              const isSelected = form.serviceType === service.id;
              return (
                <motion.button
                  key={service.id}
                  type="button"
                  onClick={() => onChange('serviceType', service.id)}
                  className="relative overflow-hidden rounded-[4px] p-4 text-left transition-all duration-300"
                  style={{
                    border: isSelected
                      ? `1px solid ${service.accentColor}70`
                      : '1px solid rgba(99,102,241,0.12)',
                    background: isSelected
                      ? `linear-gradient(135deg, ${service.accentColor}10 0%, rgba(255,255,255,0.9) 100%)`
                      : 'rgba(255,255,255,0.7)',
                    boxShadow: isSelected ? `0 4px 16px ${service.accentColor}15` : 'none',
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-1.5 flex items-center gap-3">
                    <span className="text-base" style={{ color: service.accentColor }}>
                      {service.icon}
                    </span>
                    <span
                      className="text-[0.82rem] font-medium"
                      style={{ color: isSelected ? '#1e293b' : '#94a3b8' }}
                    >
                      {service.title}
                    </span>
                  </div>
                  <p
                    className="text-[0.7rem] leading-relaxed"
                    style={{ color: isSelected ? '#475569' : '#cbd5e1' }}
                  >
                    {service.tagline}
                  </p>

                  {isSelected && (
                    <motion.div
                      className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full"
                      style={{ background: service.accentColor }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <span className="text-[9px] font-bold text-white">✓</span>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </FormField>
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-4">
        <FormField label="Project Type" required>
          <SelectField
            options={PROJECT_TYPE_OPTIONS}
            placeholder="Select project type"
            value={form.projectType}
            onChange={(v) => onChange('projectType', v)}
          />
        </FormField>
        <FormField label="Property Type">
          <SelectField
            options={PROPERTY_TYPE_OPTIONS}
            placeholder="Select property type"
            value={form.propertyType}
            onChange={(v) => onChange('propertyType', v)}
          />
        </FormField>
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-4">
        <FormField label="Project Scope">
          <SelectField
            options={PROJECT_SCOPE_OPTIONS}
            placeholder="Select size"
            value={form.projectScope}
            onChange={(v) => onChange('projectScope', v)}
          />
        </FormField>
        <FormField label="Budget Range">
          <SelectField
            options={BUDGET_OPTIONS}
            placeholder="Select range"
            value={form.budget}
            onChange={(v) => onChange('budget', v)}
          />
        </FormField>
      </motion.div>

      <motion.div variants={staggerItem}>
        <FormField label="Preferred Style Direction">
          <div className="mt-1 flex flex-wrap gap-2">
            {STYLE_OPTIONS.map((style) => {
              const isSelected = form.stylePreference === style.value;
              return (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => onChange('stylePreference', style.value)}
                  className="rounded-full px-3.5 py-2 text-[0.68rem] tracking-[0.08em] uppercase transition-all duration-200"
                  style={{
                    border: isSelected
                      ? '1px solid rgba(99,102,241,0.6)'
                      : '1px solid rgba(99,102,241,0.12)',
                    background: isSelected ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.7)',
                    color: isSelected ? '#4338ca' : '#94a3b8',
                  }}
                >
                  {style.label}
                </button>
              );
            })}
          </div>
        </FormField>
      </motion.div>
    </motion.div>
  );
};

export default StepService;
