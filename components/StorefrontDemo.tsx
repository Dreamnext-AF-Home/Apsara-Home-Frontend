'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Palette, Package, Bell,
  BadgeDollarSign, ArrowRight, Sparkles, ShoppingBag,
  CheckCircle2, Zap, Users, TrendingUp, ChevronRight,
  ArrowRightLeft, Tag, Layers,
} from 'lucide-react';

/* ─── Data ──────────────────────────────────────────────────── */
const AF_PRODUCTS = [
  { name: 'Minimalist Sofa', price: '₱12,499', category: 'Living Room' },
  { name: 'Oak Coffee Table', price: '₱5,299', category: 'Living Room' },
  { name: 'Linen Curtains', price: '₱1,899', category: 'Bedroom' },
  { name: 'Velvet Armchair', price: '₱8,799', category: 'Living Room' },
  { name: 'Marble Lamp', price: '₱3,499', category: 'Lighting' },
  { name: 'Geometric Rug', price: '₱6,999', category: 'Decor' },
];

const STOREFRONTS = [
  {
    name: 'LivingCo',
    slug: 'livingco',
    tagline: 'Modern Living, Delivered.',
    theme: '#0d9488',
    accent: '#f97316',
    glow: 'rgba(13,148,136,0.3)',
    initial: 'LC',
    badge: 'Home & Living',
    pickedProducts: [0, 1, 3],
    stats: { orders: '1,240', members: '380', revenue: '₱248K' },
  },
  {
    name: 'NestHaus',
    slug: 'nesthaus',
    tagline: 'Your Home, Your Style.',
    theme: '#7c3aed',
    accent: '#fbbf24',
    glow: 'rgba(124,58,237,0.3)',
    initial: 'NH',
    badge: 'Premium Interiors',
    pickedProducts: [3, 4, 5],
    stats: { orders: '890', members: '220', revenue: '₱178K' },
  },
  {
    name: 'CasaBlanca',
    slug: 'casablanca',
    tagline: 'Elegance for Every Room.',
    theme: '#be123c',
    accent: '#0ea5e9',
    glow: 'rgba(190,18,60,0.3)',
    initial: 'CB',
    badge: 'Luxury Spaces',
    pickedProducts: [1, 2, 4],
    stats: { orders: '560', members: '145', revenue: '₱112K' },
  },
];

const BENEFITS = [
  { icon: Layers, label: 'AF Homes Catalog', desc: 'All products sourced and managed by AF Homes' },
  { icon: Palette, label: 'Custom Branding', desc: 'Your logo, colors, and store name' },
  { icon: Package, label: 'Product Curation', desc: 'Pick which AF Homes products appear in your store' },
  { icon: Bell, label: 'Instant Notifications', desc: 'Get notified on every order instantly' },
  { icon: BadgeDollarSign, label: 'Commission Earnings', desc: 'Earn on every delivered order' },
  { icon: Zap, label: 'Zero Inventory', desc: 'No stock management — AF Homes handles it all' },
];

const STEPS = [
  { n: '01', label: 'Apply as Partner', desc: 'Sign up and get approved as an Apsara Home partner.' },
  { n: '02', label: 'Curate Your Products', desc: 'Choose which AF Homes products appear in your store.' },
  { n: '03', label: 'Brand Your Store', desc: 'Set your logo, colors, and store name — fully yours.' },
  { n: '04', label: 'Your Store Goes Live', desc: 'Customers shop under your brand at your unique link.' },
  { n: '05', label: 'You Earn', desc: 'Commission credited to your wallet on every delivered order.' },
];

const EARNINGS_FEED = [
  { store: 'LivingCo', product: 'Minimalist Sofa', amount: '₱624', time: 'Just now' },
  { store: 'NestHaus', product: 'Velvet Armchair', amount: '₱440', time: '2 min ago' },
  { store: 'CasaBlanca', product: 'Marble Lamp', amount: '₱175', time: '5 min ago' },
  { store: 'LivingCo', product: 'Linen Curtains', amount: '₱95', time: '8 min ago' },
  { store: 'NestHaus', product: 'Geometric Rug', amount: '₱350', time: '12 min ago' },
];

const SCENES = ['intro', 'problem', 'highlight', 'concept', 'showcase', 'earnings', 'benefits', 'howItWorks', 'cta'] as const;
type Scene = typeof SCENES[number];
const DURATIONS: Record<Scene, number> = {
  intro: 3500,
  problem: 4500,
  highlight: 6000,
  concept: 7000,
  showcase: 12000,
  earnings: 8000,
  benefits: 9000,
  howItWorks: 11000,
  cta: 99999,
};

/* ─── Highlight Scene ───────────────────────────────────────── */
const HIGHLIGHT_CARDS = [
  {
    rotate: -8, x: -320, y: -80, delay: 0.3,
    content: (
      <div className="bg-[#111115] border border-white/10 rounded-2xl p-4 w-48 shadow-2xl">
        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">New Order</p>
        <p className="text-white font-bold text-sm">Minimalist Sofa</p>
        <p className="text-emerald-400 font-black text-xl mt-1">+₱624</p>
        <p className="text-white/25 text-[10px] mt-1">LivingCo Store · Just now</p>
      </div>
    ),
  },
  {
    rotate: 6, x: 300, y: -100, delay: 0.5,
    content: (
      <div className="bg-[#111115] border border-white/10 rounded-2xl p-4 w-44 shadow-2xl">
        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">This Month</p>
        <p className="text-emerald-400 font-black text-2xl">₱48,200</p>
        <p className="text-white/25 text-[10px] mt-1">Commission earned</p>
        <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full w-3/4 bg-emerald-400 rounded-full" />
        </div>
      </div>
    ),
  },
  {
    rotate: -5, x: -280, y: 100, delay: 0.7,
    content: (
      <div className="bg-[#111115] border border-white/10 rounded-2xl p-4 w-44 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-[10px] font-bold text-white">LC</div>
          <div>
            <p className="text-white text-xs font-semibold">LivingCo</p>
            <p className="text-white/30 text-[9px]">Your Storefront</p>
          </div>
        </div>
        <div className="space-y-1.5">
          {['Sofa', 'Table', 'Curtains'].map(p => (
            <div key={p} className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              <span className="text-white/50 text-[10px]">{p}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    rotate: 7, x: 290, y: 90, delay: 0.9,
    content: (
      <div className="bg-[#111115] border border-white/10 rounded-2xl p-4 w-44 shadow-2xl">
        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Active Stores</p>
        <div className="flex gap-1.5 flex-wrap">
          {['LC', 'NH', 'CB', 'FG', 'NK'].map((s, i) => (
            <div key={s} className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold text-white"
              style={{ backgroundColor: ['#0d9488','#7c3aed','#be123c','#ca8a04','#0891b2'][i] }}>
              {s}
            </div>
          ))}
        </div>
        <p className="text-white/25 text-[10px] mt-2">5 storefronts live</p>
      </div>
    ),
  },
];

function HighlightScene() {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.7 }}
      className="relative flex items-center justify-center w-full max-w-4xl min-h-[500px]"
    >
      {/* Floating cards */}
      {HIGHLIGHT_CARDS.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8, x: card.x * 0.5, y: card.y * 0.5 }}
          animate={{ opacity: 1, scale: 1, x: card.x, y: card.y, rotate: card.rotate }}
          transition={{ delay: card.delay, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ position: 'absolute' }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
          >
            {card.content}
          </motion.div>
        </motion.div>
      ))}

      {/* Center typography */}
      <div className="relative z-10 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-amber-400 text-xs font-semibold tracking-[0.2em] uppercase mb-5"
        >
          Partner Storefront
        </motion.p>

        <div className="overflow-hidden">
          <motion.h1
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-6xl font-black leading-none bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent"
          >
            No inventory.
          </motion.h1>
        </div>
        <div className="overflow-hidden">
          <motion.h1
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-6xl font-black leading-none bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent"
          >
            No warehouse.
          </motion.h1>
        </div>
        <div className="overflow-hidden mt-1">
          <motion.h1
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-6xl font-black leading-none text-amber-400"
          >
            Just your brand.
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="text-white/30 text-base mt-5 max-w-xs mx-auto leading-relaxed"
        >
          Sell thousands of AF Homes products under your own brand — zero logistics, zero stock.
        </motion.p>
      </div>
    </motion.div>
  );
}

/* ─── Orbs ──────────────────────────────────────────────────── */
function Orbs({ color }: { color: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full blur-[130px] opacity-25"
        style={{ backgroundColor: color }}
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full blur-[130px] opacity-15"
        style={{ backgroundColor: color }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#050508_100%)]" />
    </div>
  );
}

/* ─── Product Card ──────────────────────────────────────────── */
function ProductCard({
  product, highlighted, brandColor, delay = 0,
}: {
  product: typeof AF_PRODUCTS[0]; highlighted?: boolean; brandColor?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-xl border overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: highlighted ? `${brandColor}15` : 'rgba(255,255,255,0.03)',
        borderColor: highlighted ? `${brandColor}40` : 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="h-16 flex items-center justify-center"
        style={{ background: highlighted ? `linear-gradient(135deg,${brandColor}20,${brandColor}05)` : 'rgba(255,255,255,0.02)' }}>
        <Package size={20} className={highlighted ? 'text-white/40' : 'text-white/15'} />
      </div>
      <div className="p-3">
        <p className="text-white text-[11px] font-medium truncate">{product.name}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-white/35 text-[10px]">{product.price}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/25">{product.category}</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Browser Mockup ────────────────────────────────────────── */
function BrowserMockup({ sf }: { sf: typeof STOREFRONTS[0] }) {
  const products = sf.pickedProducts.map(i => AF_PRODUCTS[i]);
  return (
    <motion.div
      key={sf.name}
      initial={{ opacity: 0, y: 24, rotateX: 6 }}
      animate={{ opacity: 1, y: 0, rotateX: 2 }}
      exit={{ opacity: 0, y: -16, rotateX: -4 }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ perspective: 1200 }}
      className="w-full max-w-[600px] rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.7)] border border-white/10"
    >
      {/* Chrome */}
      <div className="bg-[#1a1a1d] px-4 py-3 flex items-center gap-3 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <div className="flex-1 bg-white/5 rounded-md px-3 py-1.5 text-xs text-white/30 font-mono flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400/60" />
          apsarahome.com/shop/{sf.slug}
        </div>
      </div>

      {/* Store */}
      <div className="bg-[#0c0c0f] relative overflow-hidden">
        <div className="absolute inset-0 opacity-15"
          style={{ background: `radial-gradient(ellipse at 50% -10%, ${sf.theme} 0%, transparent 65%)` }} />

        {/* Nav */}
        <div className="relative flex items-center justify-between px-5 py-3.5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: sf.theme }}>
              {sf.initial}
            </div>
            <span className="text-white font-semibold text-sm">{sf.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${sf.accent}20`, color: sf.accent }}>
              {sf.badge}
            </span>
          </div>
          <div className="flex items-center gap-4 text-white/30 text-xs">
            <span>Shop</span><span>About</span>
            <div className="relative">
              <ShoppingBag size={15} className="text-white/50" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full text-[8px] flex items-center justify-center font-bold text-white"
                style={{ backgroundColor: sf.accent }}>2</div>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="relative px-5 py-6">
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: sf.accent }}>
            Featured Collection
          </p>
          <h2 className="text-xl font-bold text-white mb-1">{sf.tagline}</h2>
          <p className="text-white/35 text-xs mb-4">Curated products available exclusively at {sf.name}.</p>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: sf.theme }}>
            Shop Now <ArrowRight size={11} />
          </button>
        </div>

        {/* Products */}
        <div className="px-5 pb-5 grid grid-cols-3 gap-3">
          {products.map((p, i) => (
            <ProductCard key={p.name} product={p} highlighted brandColor={sf.theme} delay={0.3 + i * 0.1} />
          ))}
        </div>

        {/* Powered by tag */}
        <div className="px-5 pb-4 flex justify-end">
          <span className="text-[9px] text-white/15 flex items-center gap-1">
            <Store size={9} /> Powered by Apsara Home
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Concept Scene ─────────────────────────────────────────── */
function ConceptScene() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const steps = [0, 1, 2];
    let i = 0;
    const t = setInterval(() => {
      i++;
      if (i < steps.length) setStep(i);
      else clearInterval(t);
    }, 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-4xl"
    >
      <div className="text-center mb-10">
        <p className="text-amber-400 text-xs font-semibold tracking-widest uppercase mb-3">The Concept</p>
        <h2 className="text-5xl font-black bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
          One Catalog. Many Brands.
        </h2>
        <p className="text-white/35 text-sm mt-3">
          AF Homes manages all products. Partners just choose what to show — under their own brand.
        </p>
      </div>

      <div className="flex items-stretch gap-4">

        {/* AF Homes catalog */}
        <motion.div
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center">
              <Store size={16} className="text-black" />
            </div>
            <div>
              <p className="text-white text-sm font-bold">AF Homes</p>
              <p className="text-white/30 text-[10px]">Master Product Catalog</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {AF_PRODUCTS.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2"
              >
                <Package size={12} className="text-amber-400 shrink-0" />
                <span className="text-white text-[11px] flex-1 truncate">{p.name}</span>
                <span className="text-white/30 text-[10px]">{p.price}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Arrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
          className="flex flex-col items-center justify-center gap-3 px-2"
        >
          <div className="flex flex-col items-center gap-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: step >= 0 ? [0.3, 1, 0.3] : 0 }}
                transition={{ delay: i * 0.3, duration: 1.5, repeat: Infinity }}
                className="w-1 h-1 rounded-full bg-amber-400"
              />
            ))}
          </div>
          <div className="bg-amber-400/10 border border-amber-400/30 rounded-full p-2">
            <ArrowRightLeft size={16} className="text-amber-400" />
          </div>
          <p className="text-amber-400/60 text-[9px] text-center font-medium tracking-wide uppercase">
            Partner<br />Curates
          </p>
        </motion.div>

        {/* Partner stores */}
        <motion.div
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
          className="flex-1 flex flex-col gap-3"
        >
          {STOREFRONTS.map((sf, i) => (
            <motion.div
              key={sf.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.15 }}
              className="flex-1 rounded-2xl border p-4 relative overflow-hidden"
              style={{ borderColor: `${sf.theme}30`, backgroundColor: `${sf.theme}08` }}
            >
              <div className="absolute inset-0 opacity-10"
                style={{ background: `radial-gradient(ellipse at top right, ${sf.theme}, transparent 70%)` }} />
              <div className="relative flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: sf.theme }}>
                  {sf.initial}
                </div>
                <div>
                  <p className="text-white text-xs font-bold">{sf.name}</p>
                  <p className="text-white/30 text-[9px]">apsarahome.com/shop/{sf.slug}</p>
                </div>
              </div>
              <div className="relative flex gap-1.5">
                {sf.pickedProducts.map(pi => (
                  <div key={pi}
                    className="flex-1 rounded-lg px-2 py-1.5 text-[9px] text-white/60 border text-center truncate"
                    style={{ borderColor: `${sf.theme}30`, backgroundColor: `${sf.theme}15` }}>
                    {AF_PRODUCTS[pi].name.split(' ')[0]}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
        className="mt-6 flex items-center justify-center gap-2 text-white/25 text-xs"
      >
        <Tag size={11} className="text-amber-400/50" />
        Same AF Homes products — displayed under each partner&apos;s unique brand identity
      </motion.div>
    </motion.div>
  );
}

/* ─── Stat card ─────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, delay = 0 }: {
  icon: React.ElementType; label: string; value: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-white/5 backdrop-blur border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3"
    >
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
        <Icon size={14} className="text-amber-400" />
      </div>
      <div>
        <p className="text-white font-bold text-sm">{value}</p>
        <p className="text-white/35 text-[10px]">{label}</p>
      </div>
    </motion.div>
  );
}

/* ─── Nav dots ──────────────────────────────────────────────── */
function SceneNav({ scene, goTo }: { scene: Scene; goTo: (s: Scene) => void }) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
      {SCENES.map(s => (
        <button key={s} onClick={() => goTo(s)}
          className={`rounded-full transition-all duration-300 ${scene === s ? 'w-5 h-2 bg-amber-400' : 'w-2 h-2 bg-white/20 hover:bg-white/50'}`}
        />
      ))}
    </div>
  );
}

/* ─── Main ──────────────────────────────────────────────────── */
export default function StorefrontDemo() {
  const [scene, setScene] = useState<Scene>('intro');
  const [sfIdx, setSfIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sceneIdx = SCENES.indexOf(scene);
  const sf = STOREFRONTS[sfIdx];

  const goTo = (s: Scene) => {
    if (timer.current) clearTimeout(timer.current);
    setScene(s);
    setPlaying(true);
  };

  // Spacebar to pause/play
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setPlaying(p => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!playing) return;
    timer.current = setTimeout(() => {
      const next = SCENES[sceneIdx + 1];
      if (next) setScene(next);
    }, DURATIONS[scene]);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [scene, playing, sceneIdx]);

  useEffect(() => {
    if (scene !== 'showcase') return;
    const t = setInterval(() => setSfIdx(i => (i + 1) % STOREFRONTS.length), 4000);
    return () => clearInterval(t);
  }, [scene]);

  const orbColor = scene === 'showcase' ? sf.glow : '#b8952a33';

  return (
    <div className="relative min-h-screen bg-[#050508] text-white overflow-hidden">
      <Orbs color={orbColor} />

      {/* Grid */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{ backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

      <SceneNav scene={scene} goTo={goTo} />

      {!playing && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed top-6 right-6 z-50 text-[11px] text-white/40 bg-white/5 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Paused — press Space
        </motion.div>
      )}

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-24">
        <AnimatePresence mode="wait">

          {/* Intro */}
          {scene === 'intro' && (
            <motion.div key="intro"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.7 }} className="text-center max-w-2xl"
            >
              <motion.div
                initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_60px_rgba(251,191,36,0.35)]"
              >
                <Store size={38} className="text-white" />
              </motion.div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-400/80">
                Apsara Home
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="text-6xl font-black mt-3 mb-4 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent leading-tight"
              >
                Partner Storefront
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                className="text-white/40 text-xl">
                Your brand. Your store. Powered by Apsara Home.
              </motion.p>
              <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: 0.6 }}
                className="mt-8 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
            </motion.div>
          )}

          {/* Problem */}
          {scene === 'problem' && (
            <motion.div key="problem"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.7 }} className="text-center max-w-3xl"
            >
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-6">The Challenge</motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="text-5xl font-black leading-tight mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent"
              >
                Want to sell online<br />under your own brand?
              </motion.h2>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                className="text-white/40 text-lg mb-8">
                Building your own store takes months and costs a fortune.<br />There&apos;s a better way.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1 }}
                className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-full px-5 py-2.5 text-amber-300 text-sm font-medium"
              >
                <Sparkles size={14} /> Apsara Home Partner Storefront solves this
              </motion.div>
            </motion.div>
          )}

          {/* Highlight */}
          {scene === 'highlight' && <HighlightScene key="highlight" />}

          {/* Concept */}
          {scene === 'concept' && <ConceptScene key="concept" />}

          {/* Showcase */}
          {scene === 'showcase' && (
            <motion.div key="showcase"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center gap-8 w-full max-w-4xl"
            >
              <div className="text-center">
                <p className="text-amber-400 text-xs font-semibold tracking-widest uppercase mb-3">Live Storefronts</p>
                <h2 className="text-4xl font-black bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                  Same Products. Different Brands.
                </h2>
                <p className="text-white/30 text-sm mt-2">AF Homes catalog — displayed under each partner&apos;s identity.</p>
              </div>

              <div className="flex gap-2">
                {STOREFRONTS.map((s, i) => (
                  <button key={s.name} onClick={() => setSfIdx(i)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-300"
                    style={sfIdx === i
                      ? { backgroundColor: s.theme, borderColor: s.theme, color: 'white' }
                      : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }
                    }
                  >
                    <span className="w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center"
                      style={{ backgroundColor: sfIdx === i ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)' }}>
                      {s.initial}
                    </span>
                    {s.name}
                  </button>
                ))}
              </div>

              <div className="flex gap-6 items-start w-full">
                <AnimatePresence mode="wait">
                  <BrowserMockup key={sfIdx} sf={sf} />
                </AnimatePresence>
                <motion.div
                  key={sfIdx + 'stats'}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="flex flex-col gap-3 min-w-[160px]"
                >
                  <p className="text-white/25 text-[10px] uppercase tracking-widest font-medium">Partner Stats</p>
                  <StatCard icon={ShoppingBag} label="Total Orders" value={sf.stats.orders} delay={0.1} />
                  <StatCard icon={Users} label="Members" value={sf.stats.members} delay={0.2} />
                  <StatCard icon={TrendingUp} label="Revenue" value={sf.stats.revenue} delay={0.3} />
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Earnings */}
          {scene === 'earnings' && (
            <motion.div key="earnings"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }} className="w-full max-w-3xl"
            >
              <div className="text-center mb-10">
                <p className="text-amber-400 text-xs font-semibold tracking-widest uppercase mb-3">Partner Earnings</p>
                <h2 className="text-5xl font-black bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                  Earn on Every Sale
                </h2>
                <p className="text-white/35 text-sm mt-3">
                  Every order delivered from your store earns you a commission — automatically credited to your wallet.
                </p>
              </div>

              <div className="flex gap-6 items-start">
                {/* Live feed */}
                <div className="flex-1 flex flex-col gap-3">
                  <p className="text-white/25 text-[10px] uppercase tracking-widest font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Live Commission Feed
                  </p>
                  {EARNINGS_FEED.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.18, duration: 0.4 }}
                      className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center shrink-0">
                        <BadgeDollarSign size={15} className="text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{item.product}</p>
                        <p className="text-white/30 text-[10px]">{item.store} · {item.time}</p>
                      </div>
                      <motion.span
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.18 + 0.3, type: 'spring', stiffness: 200 }}
                        className="text-emerald-400 font-bold text-sm shrink-0"
                      >
                        +{item.amount}
                      </motion.span>
                    </motion.div>
                  ))}
                </div>

                {/* Summary card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                  className="min-w-[180px] flex flex-col gap-3"
                >
                  <p className="text-white/25 text-[10px] uppercase tracking-widest font-medium">This Month</p>
                  <div className="bg-gradient-to-br from-emerald-400/10 to-emerald-600/5 border border-emerald-400/20 rounded-2xl p-5">
                    <p className="text-white/40 text-xs mb-1">Total Earned</p>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                      className="text-3xl font-black text-emerald-400"
                    >
                      ₱12,480
                    </motion.p>
                    <p className="text-white/25 text-[10px] mt-1">248 delivered orders</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                    <p className="text-white/40 text-xs mb-2">Commission Rate</p>
                    <p className="text-white font-bold text-lg">Per Order</p>
                    <p className="text-white/30 text-[11px] mt-1">Based on delivered orders from your storefront</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                    <p className="text-white/40 text-xs mb-2">Payout Schedule</p>
                    <p className="text-white font-bold text-sm">Weekly</p>
                    <p className="text-white/30 text-[11px] mt-1">Every Friday to your registered bank account</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Benefits */}
          {scene === 'benefits' && (
            <motion.div key="benefits"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }} className="w-full max-w-3xl"
            >
              <div className="text-center mb-12">
                <p className="text-amber-400 text-xs font-semibold tracking-widest uppercase mb-3">Why Partner With Us</p>
                <h2 className="text-5xl font-black bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                  Everything Included
                </h2>
                <p className="text-white/30 text-sm mt-3">Focus on selling. We handle the rest.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {BENEFITS.map((b, i) => (
                  <motion.div key={b.label}
                    initial={{ opacity: 0, y: 24, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/10 rounded-2xl p-5 transition-all duration-300"
                  >
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'radial-gradient(ellipse at top left,rgba(251,191,36,0.05) 0%,transparent 60%)' }} />
                    <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-4">
                      <b.icon size={18} className="text-amber-400" />
                    </div>
                    <p className="font-semibold text-sm text-white mb-1">{b.label}</p>
                    <p className="text-white/35 text-xs leading-relaxed">{b.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* How It Works */}
          {scene === 'howItWorks' && (
            <motion.div key="how"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }} className="w-full max-w-2xl"
            >
              <div className="text-center mb-12">
                <p className="text-amber-400 text-xs font-semibold tracking-widest uppercase mb-3">Simple Process</p>
                <h2 className="text-5xl font-black bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                  How It Works
                </h2>
              </div>
              <div className="relative">
                <div className="absolute left-[23px] top-6 bottom-6 w-px bg-gradient-to-b from-amber-400/50 via-amber-400/20 to-transparent" />
                <div className="flex flex-col gap-4">
                  {STEPS.map((s, i) => (
                    <motion.div key={s.n}
                      initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.18, duration: 0.5 }}
                      className="flex gap-5 items-start"
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black text-black shrink-0 z-10 shadow-[0_0_20px_rgba(251,191,36,0.25)]"
                        style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)' }}>
                        {s.n}
                      </div>
                      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-4 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm text-white">{s.label}</p>
                          {i < STEPS.length - 1
                            ? <ChevronRight size={12} className="text-white/20" />
                            : <CheckCircle2 size={12} className="text-emerald-400" />}
                        </div>
                        <p className="text-white/35 text-xs leading-relaxed">{s.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* CTA */}
          {scene === 'cta' && (
            <motion.div key="cta"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }} className="text-center max-w-2xl"
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 14 }}
                className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-400/20 flex items-center justify-center shadow-[0_0_80px_rgba(251,191,36,0.2)]"
              >
                <Sparkles size={40} className="text-amber-400" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="text-6xl font-black bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent mb-4 leading-tight"
              >
                Start Selling<br />Under Your Brand
              </motion.h2>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="text-white/40 text-lg mb-10">
                Join Apsara Home and launch your branded storefront — no inventory, no hassle.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                className="flex items-center justify-center gap-4 flex-wrap"
              >
                <button className="group px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold rounded-2xl flex items-center gap-2 transition-all shadow-[0_0_40px_rgba(251,191,36,0.3)] hover:shadow-[0_0_60px_rgba(251,191,36,0.5)]">
                  Become a Partner <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => goTo('intro')}
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold rounded-2xl transition-all">
                  Watch Again
                </button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
                className="mt-10 flex items-center justify-center gap-6 text-white/25 text-xs"
              >
                <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-400/60" /> No inventory needed</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-400/60" /> Launch in days</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-400/60" /> Full support included</span>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="h-px bg-white/5">
          <motion.div key={scene} className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
            initial={{ width: '0%' }} animate={{ width: '100%' }}
            transition={{ duration: DURATIONS[scene] / 1000, ease: 'linear' }}
          />
        </div>
        <div className="pb-3 pt-2 flex justify-center">
          <span className="text-white/15 text-[10px] tracking-[0.2em] uppercase">
            {scene === 'intro' && 'Introduction'}
            {scene === 'problem' && 'The Challenge'}
            {scene === 'highlight' && 'No Inventory. No Hassle.'}
            {scene === 'concept' && 'The Concept'}
            {scene === 'showcase' && 'Live Showcase'}
            {scene === 'earnings' && 'Partner Earnings'}
            {scene === 'benefits' && 'Benefits'}
            {scene === 'howItWorks' && 'How It Works'}
            {scene === 'cta' && 'Get Started'}
          </span>
        </div>
      </div>
    </div>
  );
}
