// ─────────────────────────────────────────────────────────────────────────────
// types.ts — Shared types & constants for Interior Services
// ─────────────────────────────────────────────────────────────────────────────

export interface ServiceItem {
  id: string;
  icon: string;
  image: string;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  accentColor: string;
  bgGradient: string;
}

export interface BookingFormData {
  // Service
  serviceType: string;
  projectType: string;
  propertyType: string;
  projectScope: string;
  budget: string;
  stylePreference: string;
  // Schedule
  preferredDate: string;
  preferredTime: string;
  flexibility: string;
  targetTimeline: string;
  // Contact
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Notes
  notes: string;
  referral: string;
  inspirationFiles: string[];
}

export type FormStep = 1 | 2 | 3 | 4;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const SERVICES: ServiceItem[] = [
  {
    id: "residential",
    icon: "◈",
    image: "/Images/FeaturedSection/home_living.jpg",
    title: "Residential Design",
    tagline: "Your home, elevated",
    description:
      "A home should feel like an exhale — effortless, personal, and entirely yours. We design living spaces that carry your story in every material choice.",
    features: [
      "Full-space concept & planning",
      "Furniture & material curation",
      "Lighting design system",
      "3D visualization & walkthroughs",
    ],
    accentColor: "#d4a514",
    bgGradient: "from-amber-100/60 to-transparent",
  },
  {
    id: "commercial",
    icon: "◻",
    image: "/Images/HeroSection/Dinning_table.jpg",
    title: "Commercial Spaces",
    tagline: "Environments that perform",
    description:
      "Workplaces and retail environments shaped to leave impressions. We align brand identity with spatial intelligence to create spaces that convert.",
    features: [
      "Brand-aligned spatial strategy",
      "Ergonomic flow planning",
      "Acoustic & lighting solutions",
      "Phased delivery management",
    ],
    accentColor: "#c9891b",
    bgGradient: "from-yellow-100/60 to-transparent",
  },
  {
    id: "renovation",
    icon: "⌘",
    image: "/Images/HeroSection/sofas.jpg",
    title: "Renovation & Refresh",
    tagline: "Honor what exists",
    description:
      "Not every space needs to be torn apart. We find the hidden potential in existing architecture and coax it into something extraordinary.",
    features: [
      "Structural assessment & planning",
      "Material sourcing & specification",
      "Contractor coordination",
      "Budget & timeline oversight",
    ],
    accentColor: "#9c7420",
    bgGradient: "from-amber-50/70 to-transparent",
  },
  {
    id: "styling",
    icon: "◉",
    image: "/Images/HeroSection/chairs_stools.jpg",
    title: "Interior Styling",
    tagline: "The finishing layer",
    description:
      "The objects, textiles, and art that make a space breathe. We style interiors that feel collected over time, never assembled overnight.",
    features: [
      "Art & object curation",
      "Textile & soft furnishing",
      "Plant & biophilic design",
      "Photography-ready staging",
    ],
    accentColor: "#1f2937",
    bgGradient: "from-stone-100/70 to-transparent",
  },
];

export const TIME_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];

export const FORM_STEPS = [
  { step: 1 as FormStep, label: "Service" },
  { step: 2 as FormStep, label: "Schedule" },
  { step: 3 as FormStep, label: "Contact" },
  { step: 4 as FormStep, label: "Review" },
];

export const INITIAL_FORM_DATA: BookingFormData = {
  serviceType: "",
  projectType: "",
  propertyType: "",
  projectScope: "",
  budget: "",
  stylePreference: "",
  preferredDate: "",
  preferredTime: "",
  flexibility: "",
  targetTimeline: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  notes: "",
  referral: "",
  inspirationFiles: [],
};
