'use client';

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Upload, CheckCircle2, Eye, ArrowRight, ShoppingBag, Play, Pause, Maximize2, Minimize2, RotateCcw, Download, Link2, Palette, Tags, Rocket, ShoppingCart, CreditCard } from 'lucide-react';
import ProductFilter from '@/components/item/ProductFilter';
import TopFilter from '@/components/item/TopFilter';
import ItemCard from '@/components/item/ItemCard';
import type { Category } from '@/store/api/categoriesApi';

/* ─── Types ─────────────────────────────────────────────────── */
type Step = 'intro' | 'step1' | 'step2' | 'step3' | 'step4' | 'step5' | 'preview' | 'ending';
const STEPS: Step[] = ['intro', 'step1', 'step2', 'step3', 'step4', 'step5', 'preview', 'ending'];
const DURATIONS: Record<Step, number> = {
  intro: 3500, step1: 15000, step2: 10000, step3: 9000,
  step4: 9000, step5: 7000, preview: 30000, ending: 99999,
};
type StepMeta = { label: string; title: string; caption: string };
const STEP_META: Partial<Record<Step, StepMeta>> = {
  step1: {
    label: 'Step 1 of 5', title: 'Set your store identity',
    caption: 'Fill in your slug (store URL), display name, hero title, and notification email — the foundation of your branded storefront.',
  },
  step2: {
    label: 'Step 2 of 5', title: 'Upload logo & add referral link',
    caption: 'Your logo appears in the store header. Your referral link tracks every purchase that comes through your storefront.',
  },
  step3: {
    label: 'Step 3 of 5', title: 'Set brand colors & hero subtitle',
    caption: 'Theme and accent colors style your hero banner and buttons. The hero subtitle appears below your store title on the live page.',
  },
  step4: {
    label: 'Step 4 of 5', title: 'Select product categories',
    caption: 'Choose which categories appear in your store. Enabled categories instantly preview their products below — so you can curate exactly what your customers will see.',
  },
  step5: {
    label: 'Step 5 of 5', title: 'Save and launch',
    caption: 'Click Save Storefront — your branded partner shop goes live instantly. No setup, no deployment, no waiting.',
  },
  preview: {
    label: 'Live Store', title: 'Your store is live',
    caption: 'This is exactly what your customers see when they visit your partner storefront link. Fully branded, ready to sell.',
  },
};
const MAIN_STEPS: Step[] = ['step1', 'step2', 'step3', 'step4', 'step5'];
const VOICE_AUDIO: Partial<Record<Step, string>> = {
  intro: '/voiceover/Intro.wav',
  step1: '/voiceover/step1.mp3',
  step2: '/voiceover/step%202.mp3',
  step3: '/voiceover/step%203.mp3',
  step4: '/voiceover/step%204.mp3',
  step5: '/voiceover/sterp%205.mp3',
  preview: '/voiceover/this%20is%20your%20live%20partner%20store.wav',
  ending: '/voiceover/your%20store%20is%20ready.mp3',
};
const BACKGROUND_MUSIC_URL = '/voiceover/bg-tutorial.wav';
const BACKGROUND_MUSIC_VOLUME = 0.045;
const SECTION_CARDS: Partial<Record<Step, { kicker: string; title: string; detail: string; icon: ReactNode; color: string }>> = {
  step1: {
    kicker: 'Step 1',
    title: 'Set Your Store Identity',
    detail: 'Store URL, display name, hero title, and notifications.',
    icon: <Store size={34} />,
    color: '#10b981',
  },
  step2: {
    kicker: 'Step 2',
    title: 'Upload Logo & Referral Links',
    detail: 'Brand your storefront and track every order.',
    icon: <Link2 size={34} />,
    color: '#38bdf8',
  },
  step3: {
    kicker: 'Step 3',
    title: 'Choose Brand Colors',
    detail: 'Style the storefront with your own look and hero message.',
    icon: <Palette size={34} />,
    color: '#a78bfa',
  },
  step4: {
    kicker: 'Step 4',
    title: 'Select Product Categories',
    detail: 'Curate the products your customers can browse.',
    icon: <Tags size={34} />,
    color: '#f59e0b',
  },
  step5: {
    kicker: 'Step 5',
    title: 'Save and Launch',
    detail: 'Publish your branded partner storefront.',
    icon: <Rocket size={34} />,
    color: '#22c55e',
  },
  preview: {
    kicker: 'Live Store Preview',
    title: 'Your Store Is Live',
    detail: 'Customers can browse, add to cart, and checkout through AF Home.',
    icon: <ShoppingBag size={34} />,
    color: '#14b8a6',
  },
};
const STEP_MOTION_LABELS: Partial<Record<Step, string[]>> = {
  step1: ['Slug', 'Hero title', 'Notification email'],
  step2: ['Logo', 'Referral links', 'Order tracking'],
  step3: ['Theme color', 'Accent color', 'Hero subtitle'],
  step4: ['Categories', 'Product curation', 'Customer view'],
  step5: ['Review', 'Save', 'Launch'],
  preview: ['Live storefront', 'Cart flow', 'Checkout'],
};

/* ─── Timeline ───────────────────────────────────────────────── */
const SCRUB_STEPS: Step[] = ['intro', 'step1', 'step2', 'step3', 'step4', 'step5', 'preview'];
const TOTAL_DURATION = SCRUB_STEPS.reduce((sum, s) => sum + DURATIONS[s], 0);
const STEP_STARTS = SCRUB_STEPS.reduce((acc, s, i) => {
  acc[s] = SCRUB_STEPS.slice(0, i).reduce((sum, prev) => sum + DURATIONS[prev], 0);
  return acc;
}, {} as Partial<Record<Step, number>>);

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const SCRUB_LABELS: Partial<Record<Step, string>> = {
  intro: 'Intro', step1: 'Identity', step2: 'Logo', step3: 'Colors',
  step4: 'Categories', step5: 'Save', preview: 'Live Store',
};

const getStepStart = (step: Step) => STEP_STARTS[step] ?? 0;

const getRemainingStepDuration = (step: Step, elapsed: number) => {
  const offset = Math.max(0, elapsed - getStepStart(step));
  return Math.max(0, DURATIONS[step] - offset);
};


/* ─── Cursor ─────────────────────────────────────────────────── */
function Cursor({ x, y, clicking }: { x: number; y: number; clicking: boolean }) {
  return (
    <motion.div
      animate={{ left: x, top: y }}
      transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
      className="absolute z-[100] pointer-events-none"
      style={{ left: x, top: y }}
    >
      <motion.div animate={{ scale: clicking ? 0.75 : 1 }} transition={{ duration: 0.1 }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M4 2L20 12L12 13.5L8.5 20L4 2Z" fill="white" stroke="#059669" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </motion.div>
      {clicking && (
        <motion.div initial={{ scale: 0, opacity: 0.8 }} animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 0.38 }}
          className="absolute -top-3 -left-3 w-6 h-6 rounded-full border-2 border-emerald-400" />
      )}
    </motion.div>
  );
}

function SectionTitleCard({ step }: { step: Step }) {
  const card = SECTION_CARDS[step];
  if (!card) return null;

  return (
    <motion.div
      key={`${step}-title-card`}
      initial={{ opacity: 0, x: 28, y: -10, scale: 0.96 }}
      animate={{ opacity: [0, 1, 1, 0], x: [28, 0, 0, -18], y: [-10, 0, 0, 0], scale: [0.96, 1, 1, 0.98], pointerEvents: 'none' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.3, times: [0, 0.18, 0.76, 1], ease: 'easeInOut' }}
      className="absolute right-5 top-5 z-[95] overflow-hidden rounded-2xl border border-white/24 bg-slate-950/68 px-4 py-3 text-white shadow-[0_18px_50px_rgba(15,23,42,0.28)] backdrop-blur-md"
    >
      {[0, 1].map((index) => (
        <motion.div
          key={index}
          initial={{ x: -180, opacity: 0 }}
          animate={{ x: 260, opacity: [0, 0.7, 0] }}
          transition={{ duration: 1, delay: index * 0.15, ease: 'easeInOut' }}
          className="absolute h-[1px] w-[180px]"
          style={{
            top: 16 + index * 54,
            background: `linear-gradient(90deg, transparent, ${card.color}, transparent)`,
          }}
        />
      ))}
      <div className="relative flex w-[330px] items-center gap-3">
        <motion.div
          initial={{ scale: 0.85, rotate: -8, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 190, damping: 18, delay: 0.08 }}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: `linear-gradient(135deg, ${card.color}, rgba(255,255,255,0.18))` }}
        >
          {card.icon}
        </motion.div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: card.color }}>{card.kicker}</p>
          <h2 className="mt-0.5 truncate text-base font-black tracking-normal text-white">{card.title}</h2>
          <p className="mt-0.5 truncate text-[11px] font-medium text-white/62">{card.detail}</p>
        </div>
      </div>
    </motion.div>
  );
}

function MotionGraphicsOverlay({ step, playing }: { step: Step; playing: boolean }) {
  const labels = STEP_MOTION_LABELS[step];
  if (!playing || !labels) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <motion.div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.85), rgba(56,189,248,0.85), transparent)' }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-y-0 left-0 w-[2px]"
        style={{ background: 'linear-gradient(180deg, transparent, rgba(168,85,247,0.75), rgba(245,158,11,0.7), transparent)' }}
        animate={{ y: ['-100%', '100%'] }}
        transition={{ duration: 5.6, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute -right-20 top-20 h-32 w-[360px] rotate-[-18deg]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(20,184,166,0.16), transparent)' }}
        animate={{ x: [-80, -560], opacity: [0, 1, 0] }}
        transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-10 left-10 grid grid-cols-3 gap-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 1.1 }}
      >
        {labels.map((label, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12, scale: 0.94 }}
            animate={{ opacity: [0, 1, 0.72, 1], y: 0, scale: 1 }}
            transition={{ duration: 2.4, delay: 1.2 + index * 0.22, repeat: Infinity, repeatDelay: 3.6 }}
            className="rounded-md border border-white/30 bg-slate-950/58 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_12px_30px_rgba(15,23,42,0.22)] backdrop-blur"
          >
            {label}
          </motion.div>
        ))}
      </motion.div>
      <motion.div
        className="absolute right-8 bottom-8 h-20 w-20 rounded-[18px] border border-emerald-300/45"
        animate={{ rotate: [0, 90, 180], scale: [1, 1.08, 1] }}
        transition={{ duration: 7.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

/* ─── Color Picker Popup ─────────────────────────────────────── */
const PICKER_PRESETS = [
  '#fca5a5','#fdba74','#fde047','#86efac','#67e8f9','#93c5fd','#c4b5fd','#f0abfc',
  '#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899',
  '#dc2626','#ea580c','#ca8a04','#16a34a','#0891b2','#1d4ed8','#7c3aed','#db2777',
];

function ColorPickerPopup({ x, y, hoverColor }: { x: number; y: number; hoverColor: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: -6 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      style={{
        position: 'absolute', left: x, top: y, zIndex: 200, width: 212,
        background: '#fff', borderRadius: 12, pointerEvents: 'none',
        boxShadow: '0 8px 32px rgba(0,0,0,0.20), 0 0 0 1px rgba(0,0,0,0.07)',
        padding: 10,
      }}
    >
      {/* Saturation/brightness square */}
      <div style={{
        height: 72, borderRadius: 8, marginBottom: 6, position: 'relative', overflow: 'hidden',
        background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, #000 100%), linear-gradient(to right, #fff 0%, ${hoverColor} 100%)`,
      }}>
        <div style={{
          position: 'absolute', bottom: '28%', right: '22%',
          width: 10, height: 10, borderRadius: '50%',
          border: '2px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.4)', background: hoverColor,
        }} />
      </div>
      {/* Hue slider */}
      <div style={{
        height: 10, borderRadius: 5, marginBottom: 4, position: 'relative',
        background: 'linear-gradient(to right,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)',
      }}>
        <div style={{ position: 'absolute', top: -1, left: '55%', width: 12, height: 12, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.4)', border: '1px solid rgba(0,0,0,0.1)' }} />
      </div>
      {/* Opacity slider */}
      <div style={{
        height: 10, borderRadius: 5, marginBottom: 8, position: 'relative',
        background: `linear-gradient(to right, transparent, ${hoverColor})`,
      }}>
        <div style={{ position: 'absolute', top: -1, right: '12%', width: 12, height: 12, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.4)', border: '1px solid rgba(0,0,0,0.1)' }} />
      </div>
      {/* Preset swatches 8×3 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 3, marginBottom: 8 }}>
        {PICKER_PRESETS.map(c => (
          <div key={c} style={{
            height: 20, borderRadius: 4, background: c,
            border: c === hoverColor ? '2px solid #059669' : '1px solid rgba(0,0,0,0.08)',
            boxShadow: c === hoverColor ? '0 0 0 1px #059669' : 'none',
          }} />
        ))}
      </div>
      {/* Hex row */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: hoverColor, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
        <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontFamily: 'ui-monospace,monospace', color: '#475569' }}>
          {hoverColor}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Callout ────────────────────────────────────────────────── */
function Callout({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 220, damping: 16 }}
      className="absolute z-50 whitespace-nowrap bg-emerald-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
      {text}
    </motion.div>
  );
}

/* ─── File Picker Dialog ─────────────────────────────────────── */
const PICKER_FILES = [
  { name: 'livingco-logo.png', type: 'PNG', size: '24 KB',   bg: 'linear-gradient(135deg,#0d9488,#059669)', label: 'LC',  labelColor: '#fff' },
  { name: 'banner-hero.jpg',   type: 'JPG', size: '1.2 MB',  bg: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', label: '🖼',  labelColor: '#fff' },
  { name: 'product-shot.png',  type: 'PNG', size: '842 KB',  bg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', label: '📷', labelColor: '#fff' },
  { name: 'brand-kit.zip',     type: 'ZIP', size: '3.4 MB',  bg: 'linear-gradient(135deg,#94a3b8,#64748b)', label: '📦', labelColor: '#fff' },
  { name: 'logo-dark.svg',     type: 'SVG', size: '8 KB',    bg: 'linear-gradient(135deg,#1e293b,#334155)', label: 'LC',  labelColor: '#94a3b8' },
  { name: 'storefront-bg.jpg', type: 'JPG', size: '2.1 MB',  bg: 'linear-gradient(135deg,#f97316,#ea580c)', label: '🌄', labelColor: '#fff' },
];
const SIDEBAR_ITEMS = [
  { icon: '☁️', label: 'iCloud Drive' }, { icon: '📡', label: 'AirDrop' },
  { icon: '🕐', label: 'Recents' },      { icon: '🖥️', label: 'Desktop' },
  { icon: '📄', label: 'Documents' },    { icon: '⬇️', label: 'Downloads' },
  { icon: '🖼️', label: 'Pictures' },
];

function FilePickerDialog({ x, y, selectedFile }: { x: number; y: number; selectedFile: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: -10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      style={{
        position: 'absolute', left: x, top: y, zIndex: 300, pointerEvents: 'none',
        width: 640, borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.14)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Title bar */}
      <div style={{ height: 40, background: '#e0e0e0', display: 'flex', alignItems: 'center', padding: '0 14px', flexShrink: 0, borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
        <div style={{ display: 'flex', gap: 6, marginRight: 12 }}>
          {['#FF5F57','#FFBD2E','#28C840'].map(c => <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
        </div>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginRight: 72 }}>Open</span>
      </div>
      {/* Path bar */}
      <div style={{ height: 34, background: '#e8e8e8', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 5, borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
        {['Downloads','Brand Assets'].map((p, i) => (
          <span key={p} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {i > 0 && <span style={{ color: '#999', fontSize: 11 }}>›</span>}
            <span style={{ fontSize: 11, color: '#444', fontWeight: i === 1 ? 600 : 400 }}>{p}</span>
          </span>
        ))}
      </div>
      {/* Body */}
      <div style={{ display: 'flex', background: '#f5f5f5', height: 286 }}>
        {/* Sidebar */}
        <div style={{ width: 160, background: '#dcdcdc', borderRight: '1px solid rgba(0,0,0,0.1)', padding: '8px 0', flexShrink: 0, overflowY: 'auto' }}>
          {SIDEBAR_ITEMS.map((item, i) => (
            <div key={item.label} style={{
              padding: '5px 12px', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6,
              color: i === 5 ? '#0066cc' : '#333',
              background: i === 5 ? 'rgba(0,102,204,0.12)' : 'transparent',
              borderRadius: 6, margin: '0 4px',
            }}>
              <span style={{ fontSize: 13, lineHeight: 1 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
        {/* File grid */}
        <div style={{ flex: 1, padding: 12, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, alignContent: 'start', overflowY: 'auto' }}>
          {PICKER_FILES.map(f => {
            const sel = f.name === selectedFile;
            return (
              <div key={f.name} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '8px 4px', borderRadius: 8,
                background: sel ? 'rgba(0,102,204,0.14)' : 'transparent',
                border: `2px solid ${sel ? 'rgba(0,102,204,0.5)' : 'transparent'}`,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 8, background: f.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: f.label.length <= 2 ? (f.label.length === 2 ? 12 : 22) : 22,
                  fontWeight: 900, color: f.labelColor,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                }}>
                  {f.label}
                </div>
                <span style={{ fontSize: 10, color: '#222', textAlign: 'center', lineHeight: 1.3, wordBreak: 'break-all', maxWidth: 68 }}>{f.name}</span>
                <span style={{ fontSize: 9, color: '#888' }}>{f.size}</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Bottom bar */}
      <div style={{ height: 48, background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 16px', gap: 8, borderTop: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }}>
        {selectedFile && <span style={{ flex: 1, fontSize: 11, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile}</span>}
        <button style={{ padding: '5px 16px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.22)', background: '#fff', fontSize: 12, color: '#333' }}>Cancel</button>
        <button style={{ padding: '5px 16px', borderRadius: 6, border: 'none', background: selectedFile ? '#0066cc' : '#8cb4e8', fontSize: 12, color: '#fff', fontWeight: 600 }}>Open</button>
      </div>
    </motion.div>
  );
}

/* ─── Typing hook ────────────────────────────────────────────── */
function useTyping(fullText: string, speed = 52, startAfter = 0, playing = true) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    if (!playing) return;
    let i = 0;
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        i++;
        setDisplayed(fullText.slice(0, i));
        if (i >= fullText.length) clearInterval(iv);
      }, speed);
      return () => clearInterval(iv);
    }, startAfter);
    return () => clearTimeout(t);
  }, [fullText, speed, startAfter, playing]);
  return displayed;
}

/* ─── Field ──────────────────────────────────────────────────── */
function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</span>
      {children}
    </label>
  );
}
const inp = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none';
const inpActive = 'w-full rounded-xl border-2 border-emerald-400 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none ring-4 ring-emerald-100/60';

/* ─── Sidebar ────────────────────────────────────────────────── */
function Sidebar() {
  return (
    <aside className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col gap-3 p-4 overflow-y-auto">
      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Partner Storefronts</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Storefront Studio</h2>
        <p className="mt-2 text-xs leading-5 text-slate-500">Build and manage branded partner shop pages with curated categories and products.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-700">4 storefronts</span>
          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500">Live editor</span>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-2">
        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Your Storefronts</p>
        <div className="mt-1 rounded-xl border border-emerald-300 bg-emerald-50/60 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">LivingCo Philippines</p>
              <p className="text-xs text-slate-400">/livingco</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Active</span>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400">4 selected categories</p>
        </div>
        {[['AF Axis', '/af-axis', 5], ['HelloWorld', '/hello-world', 8], ['Jujutsu Kaisen', '/jujutsu-kaisen', 3]].map(([name, slug, cats]) => (
          <div key={String(slug)} className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="text-xs font-semibold text-slate-700">{String(name)}</p>
            <p className="text-[10px] text-slate-400">{String(slug)} · {String(cats)} categories</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

/* ─── Step 1: All identity fields ────────────────────────────── */
function Step1Screen({ playing }: { playing: boolean }) {
  const [curPos, setCurPos] = useState({ x: 500, y: 300 });
  const [clicking, setClicking] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [callout, setCallout] = useState<{ text: string; field: string } | null>(null);

  const slug = useTyping('livingco', 90, 1200, playing);
  const displayName = useTyping('LivingCo Philippines', 55, 4800, playing);
  const heroTitle = useTyping('Modern Living, Delivered.', 50, 9000, playing);
  const email = useTyping('partner@livingco.ph', 60, 12500, playing);

  useEffect(() => {
    if (!playing) return;
    const click = (cb: () => void) => { setClicking(true); setTimeout(() => { setClicking(false); cb(); }, 220); };
    // x: col1≈263, col2≈729  |  y: row1 input≈152, row2 input≈224
    const seq: [number, () => void][] = [
      [300,  () => { setCurPos({ x: 263, y: 152 }); setCallout({ text: 'Your store URL slug', field: 'slug' }); }],
      [900,  () => click(() => { setActiveField('slug'); })],
      [3700, () => { setCurPos({ x: 729, y: 152 }); setActiveField(null); setCallout({ text: 'Displayed on your storefront', field: 'displayName' }); }],
      [4400, () => click(() => setActiveField('displayName'))],
      [8300, () => { setCurPos({ x: 263, y: 224 }); setActiveField(null); setCallout({ text: 'Store tagline customers see first', field: 'heroTitle' }); }],
      [8900, () => click(() => setActiveField('heroTitle'))],
      [12000,() => { setCurPos({ x: 729, y: 224 }); setActiveField(null); setCallout({ text: 'Receive order notifications here', field: 'email' }); }],
      [12600,() => click(() => { setActiveField('email'); setCallout(null); })],
    ];
    const timers = seq.map(([t, fn]) => setTimeout(fn, t));
    return () => timers.forEach(clearTimeout);
  }, [playing]);

  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 m-4">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Identity</p>
            <p className="mt-1 text-xs text-slate-500">Configure your storefront identity, hero messaging, brand assets, and partner settings for a polished launch.</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-bold text-emerald-700">
            Live <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Slug */}
          <div className="relative">
            {callout?.field === 'slug' && <div className="absolute -top-7 left-0 z-50"><Callout text={callout.text} /></div>}
            <Field label="Slug">
              <input value={slug} readOnly placeholder="your-shop-name"
                className={activeField === 'slug' ? inpActive : inp} />
            </Field>
          </div>

          {/* Display Name */}
          <div className="relative">
            {callout?.field === 'displayName' && <div className="absolute -top-7 left-0 z-50"><Callout text={callout.text} /></div>}
            <Field label="Display Name">
              <input value={displayName} readOnly placeholder="Your Shop Name"
                className={activeField === 'displayName' ? inpActive : inp} />
            </Field>
          </div>

          {/* Hero Title */}
          <div className="relative">
            {callout?.field === 'heroTitle' && <div className="absolute -top-7 left-0 z-50"><Callout text={callout.text} /></div>}
            <Field label="Hero Title">
              <input value={heroTitle} readOnly placeholder="Shop name Furniture Store"
                className={activeField === 'heroTitle' ? inpActive : inp} />
            </Field>
          </div>

          {/* Email */}
          <div className="relative">
            {callout?.field === 'email' && <div className="absolute -top-7 left-0 z-50"><Callout text={callout.text} /></div>}
            <Field label="Partner Notification Email">
              <input value={email} readOnly placeholder="youremail@gmail.com"
                className={activeField === 'email' ? inpActive : inp} />
            </Field>
          </div>

          {/* Dimmed fields */}
          <Field label="Referral &amp; Shop Link Upload" className="opacity-30 pointer-events-none">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-400">Add referral &amp; shop link</div>
          </Field>
          <Field label="Logo Upload" className="opacity-30 pointer-events-none">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-400">Upload storefront logo</div>
          </Field>
        </div>
      </div>
      <Cursor x={curPos.x} y={curPos.y} clicking={clicking} />
    </div>
  );
}

/* ─── Step 2: Logo + Referral Link ───────────────────────────── */
function Step2Screen({ playing }: { playing: boolean }) {
  const [curPos, setCurPos] = useState({ x: 500, y: 250 });
  const [clicking, setClicking] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [callout, setCallout] = useState('');
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState('');

  // referral/shop typing starts after upload finishes (~5200ms)
  const referralLink = useTyping('https://www.afhome.ph/ref/livingco', 45, 5400, playing);
  const shopUrl = useTyping('https://www.afhome.ph/shop?ref=livingco', 45, 6900, playing);

  useEffect(() => {
    if (!playing) return;
    const click = (cb: () => void) => { setClicking(true); setTimeout(() => { setClicking(false); cb(); }, 220); };
    // Dialog at left=160, top=25 (640×360 inside Step2Screen container)
    // livingco-logo.png: col0,row0 → x=160+160+12+54=386, y=25+40+34+12+52=163
    // Open button: x=160+640-50=750, y=25+40+34+286+24=409
    const seq: [number, () => void][] = [
      [400,  () => { setCurPos({ x: 420, y: 158 }); setCallout('Upload your brand logo'); }],
      [1100, () => click(() => { setCallout(''); setShowFilePicker(true); })],
      [1600, () => setCurPos({ x: 386, y: 163 })],
      [2300, () => click(() => setSelectedFile('livingco-logo.png'))],
      [2900, () => setCurPos({ x: 750, y: 409 })],
      [3500, () => click(() => { setShowFilePicker(false); setSelectedFile(''); setUploading(true); })],
      [5100, () => { setUploading(false); setUploaded(true); }],
      [5400, () => setCurPos({ x: 730, y: 268 })],
      [5800, () => setCallout('Your referral tracking link')],
      [6100, () => click(() => setCallout(''))],
      [7000, () => { setCurPos({ x: 730, y: 336 }); setCallout('Your partner shop URL'); }],
      [7500, () => click(() => setCallout(''))],
    ];
    const timers = seq.map(([t, fn]) => setTimeout(fn, t));
    return () => timers.forEach(clearTimeout);
  }, [playing]);

  return (
    <div className="relative flex-1">
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 m-4">
        <div className="mb-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Identity</p>
          <p className="mt-1 text-xs text-slate-500">Upload your brand assets and add your referral and shop links.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Logo Upload */}
          <div className="relative">
            {callout === 'Upload your brand logo' && <div className="absolute -top-7 right-0 z-50"><Callout text="Upload your brand logo" /></div>}
            <Field label="Logo Upload">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700">Upload storefront logo</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, or WebP</p>
                </div>
                <button className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700">
                  {uploading ? <span className="animate-spin">⟳</span> : <Upload size={12} />}
                  {uploading ? 'Uploading...' : 'Upload Logo'}
                </button>
              </div>
            </Field>
            <AnimatePresence>
              {uploaded && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[9px] font-black text-emerald-700">LC</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800">livingco-logo.png</p>
                    <p className="text-[10px] text-slate-400">Logo uploaded</p>
                  </div>
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Referral & Shop Link */}
          <div className="relative">
            {callout === 'Your referral tracking link' && <div className="absolute -top-7 left-0 z-50"><Callout text="Your referral tracking link" /></div>}
            {callout === 'Your partner shop URL' && <div className="absolute -top-7 left-0 z-50"><Callout text="Your partner shop URL" /></div>}
            <Field label="Referral &amp; Shop Link Upload">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 mb-3">
                <p className="text-xs font-semibold text-slate-700">Add referral &amp; shop link</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Set both links for this storefront in one place.</p>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1">Referral Link</p>
                  <input value={referralLink} readOnly placeholder="https://www.afhome.ph/ref/username"
                    className={`${inp} text-[11px]`} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1">Shop URL</p>
                  <div className="flex gap-2">
                    <input value={shopUrl} readOnly placeholder="https://www.afhome.ph/shop?ref=username"
                      className={`${inp} text-[11px] flex-1`} />
                    <button className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 whitespace-nowrap">Save Link</button>
                  </div>
                </div>
              </div>
            </Field>
          </div>
        </div>
      </div>
      {/* File picker dialog */}
      <AnimatePresence>
        {showFilePicker && <FilePickerDialog x={160} y={25} selectedFile={selectedFile} />}
      </AnimatePresence>

      <Cursor x={curPos.x} y={curPos.y} clicking={clicking} />
    </div>
  );
}

/* ─── Step 3: Colors + Hero Subtitle ─────────────────────────── */
function Step3Screen({ playing }: { playing: boolean }) {
  const [curPos, setCurPos] = useState({ x: 500, y: 250 });
  const [clicking, setClicking] = useState(false);
  const [themeColor, setThemeColor] = useState('#0f766e');
  const [accentColor, setAccentColor] = useState('#f97316');
  const [callout, setCallout] = useState('');
  const [pickerFor, setPickerFor] = useState<'theme' | 'accent' | null>(null);
  const [pickerHover, setPickerHover] = useState('#0f766e');

  // subtitleTyping starts after accent picker closes (~5200ms)
  const subtitle = useTyping('Curated home products for every Filipino home.', 48, 5400, playing);

  useEffect(() => {
    if (!playing) return;
    const click = (cb: () => void) => { setClicking(true); setTimeout(() => { setClicking(false); cb(); }, 220); };
    // Picker popup: theme at left=157,top=190 | accent at left=623,top=190
    // Blue swatch (#1d4ed8) in picker: row2 col5 → x=157+135=292, y=190+176=366
    // Purple swatch (#7c3aed) in picker: row2 col6 → x=623+158=781, y=190+176=366
    const seq: [number, () => void][] = [
      [400,  () => { setCurPos({ x: 263, y: 168 }); setCallout('Pick your primary brand color'); }],
      [1100, () => click(() => { setCallout(''); setPickerFor('theme'); setPickerHover('#0f766e'); })],
      [1550, () => { setCurPos({ x: 292, y: 366 }); setPickerHover('#1d4ed8'); }],
      [2300, () => click(() => { setThemeColor('#1d4ed8'); setPickerFor(null); })],
      [2900, () => { setCurPos({ x: 729, y: 168 }); setCallout('Pick your accent / button color'); }],
      [3600, () => click(() => { setCallout(''); setPickerFor('accent'); setPickerHover('#f97316'); })],
      [4050, () => { setCurPos({ x: 781, y: 366 }); setPickerHover('#7c3aed'); }],
      [4800, () => click(() => { setAccentColor('#7c3aed'); setPickerFor(null); })],
      [5100, () => { setCurPos({ x: 460, y: 420 }); setCallout('Subtitle appears below your hero title'); }],
      [5700, () => click(() => setCallout(''))],
    ];
    const timers = seq.map(([t, fn]) => setTimeout(fn, t));
    return () => timers.forEach(clearTimeout);
  }, [playing]);

  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 m-4">
        <div className="mb-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Identity</p>
          <p className="mt-1 text-xs text-slate-500">Set your brand colors and hero subtitle. These style your live storefront immediately.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="relative">
            {callout === 'Pick your primary brand color' && <div className="absolute -top-7 left-0 z-50"><Callout text="Pick your primary brand color" /></div>}
            <Field label="Theme Color">
              <motion.div animate={{ backgroundColor: themeColor }} transition={{ duration: 0.5 }}
                className="h-14 w-full rounded-2xl border border-slate-200 mb-2" />
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-lg border border-slate-200 shrink-0" style={{ backgroundColor: themeColor }} />
                <span className="text-xs font-mono text-slate-500">{themeColor}</span>
              </div>
            </Field>
          </div>
          <div className="relative">
            {callout === 'Pick your accent / button color' && <div className="absolute -top-7 left-0 z-50"><Callout text="Pick your accent / button color" /></div>}
            <Field label="Accent Color">
              <motion.div animate={{ backgroundColor: accentColor }} transition={{ duration: 0.5 }}
                className="h-14 w-full rounded-2xl border border-slate-200 mb-2" />
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-lg border border-slate-200 shrink-0" style={{ backgroundColor: accentColor }} />
                <span className="text-xs font-mono text-slate-500">{accentColor}</span>
              </div>
            </Field>
          </div>
        </div>

        {/* Live preview */}
        <motion.div animate={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${accentColor} 100%)` }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl h-16 flex items-center px-5 gap-4 mb-4">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-xs">LC</div>
          <div>
            <p className="text-white font-bold text-sm">LivingCo Philippines</p>
            <p className="text-white/70 text-xs">Modern Living, Delivered.</p>
          </div>
          <div className="ml-auto bg-white/20 rounded-full px-3 py-1 text-white text-xs font-semibold">Shop Now</div>
        </motion.div>

        {/* Hero Subtitle */}
        <div className="relative">
          {callout === 'Subtitle appears below your hero title' && <div className="absolute -top-7 left-0 z-50"><Callout text="Subtitle appears below your hero title" /></div>}
          <Field label="Hero Subtitle">
            <textarea value={subtitle} readOnly rows={2}
              className={`${inp} resize-none`}
              placeholder="Curated home furniture for every Filipino home." />
          </Field>
        </div>
      </div>
      {/* Color picker popups */}
      <AnimatePresence>
        {pickerFor === 'theme' && <ColorPickerPopup key="theme-picker" x={157} y={190} hoverColor={pickerHover} />}
        {pickerFor === 'accent' && <ColorPickerPopup key="accent-picker" x={623} y={190} hoverColor={pickerHover} />}
      </AnimatePresence>

      <Cursor x={curPos.x} y={curPos.y} clicking={clicking} />
    </div>
  );
}

/* ─── Step 4: Categories ─────────────────────────────────────── */
const STEP4_PRODUCTS: Record<number, { name: string; price: string; emoji: string }[]> = {
  2: [
    { name: 'Ceramic Vase Set', price: '₱1,299', emoji: '🏺' },
    { name: 'Nordic Wall Art', price: '₱2,499', emoji: '🖼️' },
    { name: 'Rattan Display Shelf', price: '₱3,850', emoji: '📚' },
  ],
  3: [
    { name: 'Bamboo Desk Organizer', price: '₱899', emoji: '🗄️' },
    { name: '600TC Bed Sheet Set', price: '₱2,299', emoji: '🛏️' },
    { name: 'Premium Bath Towels', price: '₱1,199', emoji: '🛁' },
  ],
  4: [
    { name: 'Kolin Aircon 1.5HP', price: '₱29,995', emoji: '❄️' },
    { name: 'Fujidenzo Dispenser', price: '₱9,798', emoji: '💧' },
    { name: 'Stand Fan 16"', price: '₱1,499', emoji: '🌀' },
  ],
  6: [
    { name: 'L-Shape Sofa Set', price: '₱18,500', emoji: '🛋️' },
    { name: 'Dining Set 6-Seater', price: '₱14,999', emoji: '🪑' },
    { name: 'Modern Study Desk', price: '₱6,299', emoji: '🖥️' },
  ],
};
const STEP4_CAT_LABELS: Record<number, string> = { 2: 'Home Decor', 3: 'Home Essentials', 4: 'Appliances', 6: 'Home & Living' };

function Step4Screen({ playing }: { playing: boolean }) {
  const [curPos, setCurPos] = useState({ x: 500, y: 280 });
  const [clicking, setClicking] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [callout, setCallout] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const [hiddenProducts, setHiddenProducts] = useState<string[]>([]);

  const cats = [
    { id: 1, name: 'Mobile & Accessories', count: 32 },
    { id: 2, name: 'Home Decor', count: 47 },
    { id: 3, name: 'Home Essentials', count: 27 },
    { id: 4, name: 'Appliances', count: 142 },
    { id: 5, name: 'Auto Care & Detailing', count: 154 },
    { id: 6, name: 'Home & Living', count: 1894 },
    { id: 7, name: 'Services', count: 1 },
    { id: 8, name: 'AF Properties', count: 2 },
  ];

  useEffect(() => {
    if (!playing) return;
    const click = (cb: () => void) => { setClicking(true); setTimeout(() => { setClicking(false); cb(); }, 220); };

    // Scroll animation: 26 frames × 28ms = ~728ms, scrolls 260px
    // Starts at t=3600. After scroll: products panel visible.
    // Products panel starts at content-y≈390. After scroll 260: visual-y≈130.
    // HD label at content-y≈430, visual-y≈170.
    // HD product rows: each ~32px. HD[2] center ≈ content-y 494→visual-y 234.
    // APP label ≈ content-y 536, APP[0] center ≈ content-y 568→visual-y 308.
    const scrollFrames: [number, () => void][] = Array.from({ length: 26 }, (_, i) => [
      3600 + i * 28,
      () => setScrollY(y => Math.min(y + 10, 260)),
    ] as [number, () => void]);

    const seq: [number, () => void][] = [
      [300,  () => { setCurPos({ x: 728, y: 126 }); setCallout('Click to enable this category'); }],
      [900,  () => click(() => { setSelected([2]); setCallout(''); })],
      [1400, () => { setCurPos({ x: 728, y: 194 }); setCallout('Add another category'); }],
      [2100, () => click(() => { setSelected([2, 4]); setCallout(''); })],
      [2700, () => setCallout('Scroll down — you can also choose which products to show')],
      [3400, () => setCallout('')],
      // [3600–4328] scroll frames merged below
      [4500, () => { setCurPos({ x: 68, y: 234 }); setCallout('Uncheck to hide this product from your store'); }],
      [5300, () => click(() => { setHiddenProducts(p => [...p, '2-2']); setCallout(''); })],
      [5900, () => { setCurPos({ x: 68, y: 308 }); }],
      [6600, () => click(() => { setHiddenProducts(p => [...p, '4-0']); setCallout('Hidden products won\'t appear in your store'); })],
      [8300, () => setCallout('')],
    ];

    const allTimers = [...seq, ...scrollFrames].map(([t, fn]) => setTimeout(fn as () => void, t as number));
    return () => allTimers.forEach(clearTimeout);
  }, [playing]);

  const enabledCount = selected.reduce((s, id) => s + (STEP4_PRODUCTS[id]?.length ?? 0), 0) - hiddenProducts.length;

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Callout floats above scroll */}
      <AnimatePresence>
        {callout && (
          <motion.div key={callout} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-50">
            <Callout text={callout} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrolling content driven by scrollY state */}
      <div style={{ transform: `translateY(-${scrollY}px)`, willChange: 'transform' }}>
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 m-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Allowed Categories</h2>
              <p className="mt-1 text-xs text-slate-500">Enable categories and fine-tune which products appear in your partner store.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{selected.length} selected</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {cats.map((cat) => {
              const active = selected.includes(cat.id);
              return (
                <motion.div key={cat.id}
                  animate={{ borderColor: active ? '#6ee7b7' : '#e2e8f0', backgroundColor: active ? '#f0fdf4' : '#f8fafc' }}
                  className="flex items-center justify-between rounded-2xl border px-4 py-3"
                >
                  <div>
                    <p className={`text-sm font-semibold ${active ? 'text-emerald-900' : 'text-slate-700'}`}>{cat.name}</p>
                    <p className="text-xs text-slate-400">ID {cat.id} · {cat.count} items</p>
                  </div>
                  <motion.div
                    animate={{ borderColor: active ? '#10b981' : '#cbd5e1', backgroundColor: active ? '#10b981' : '#ffffff' }}
                    className="h-4 w-4 rounded-full border-2"
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Product checkbox list — appears after categories selected */}
          <AnimatePresence>
            {selected.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700">Products in your store</p>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                    {enabledCount} showing
                  </span>
                  {hiddenProducts.length > 0 && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                      {hiddenProducts.length} hidden
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {selected.map(catId => {
                    const products = STEP4_PRODUCTS[catId];
                    if (!products) return null;
                    return (
                      <motion.div key={catId} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1.5">
                          {STEP4_CAT_LABELS[catId]}
                        </p>
                        <div className="space-y-0.5">
                          {products.map((p, i) => {
                            const key = `${catId}-${i}`;
                            const enabled = !hiddenProducts.includes(key);
                            return (
                              <motion.div key={key}
                                animate={{ opacity: enabled ? 1 : 0.45 }}
                                className="flex items-center gap-3 rounded-xl py-1.5 px-2"
                                style={{ background: enabled ? 'rgba(255,255,255,0.75)' : 'transparent' }}
                              >
                                <motion.div
                                  animate={{ borderColor: enabled ? '#10b981' : '#cbd5e1', backgroundColor: enabled ? '#10b981' : '#fff' }}
                                  className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0"
                                >
                                  {enabled && (
                                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                      <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </motion.div>
                                <span className="text-sm shrink-0">{p.emoji}</span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-semibold ${enabled ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{p.name}</p>
                                </div>
                                <p className={`text-xs font-bold shrink-0 ${enabled ? 'text-emerald-700' : 'text-slate-300'}`}>{p.price}</p>
                                {!enabled && (
                                  <span className="shrink-0 text-[8px] font-bold uppercase tracking-wide text-slate-400 border border-slate-200 rounded-full px-1.5 py-0.5">Hidden</span>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Cursor x={curPos.x} y={curPos.y} clicking={clicking} />
    </div>
  );
}

/* ─── Step 5: Save ───────────────────────────────────────────── */
function Step5Screen({ onSaved, playing }: { onSaved: () => void; playing: boolean }) {
  const [curPos, setCurPos] = useState({ x: 400, y: 300 });
  const [clicking, setClicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const click = (cb: () => void) => { setClicking(true); setTimeout(() => { setClicking(false); cb(); }, 220); };
    const seq: [number, () => void][] = [
      [100,  () => setCurPos({ x: 120, y: 262 })],
      [550,  () => click(() => setSaving(true))],
      [1450, () => { setSaving(false); setSaved(true); }],
      [6200, () => onSaved()],
    ];
    const timers = seq.map(([t, fn]) => setTimeout(fn, t));
    return () => timers.forEach(clearTimeout);
  }, [onSaved, playing]);

  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 m-4">
        <div className="mb-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Identity</p>
          <p className="mt-1 text-xs text-slate-500">Review your settings and save your storefront to push it live.</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Store URL', value: 'afhome.ph/shop/livingco' },
            { label: 'Display Name', value: 'LivingCo Philippines' },
            { label: 'Hero Title', value: 'Modern Living, Delivered.' },
            { label: 'Theme Color', value: '#1d4ed8', isColor: true },
            { label: 'Accent Color', value: '#7c3aed', isColor: true },
            { label: 'Categories', value: '4 selected' },
          ].map(({ label, value, isColor }) => (
            <div key={label} className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1">{label}</p>
              {isColor ? (
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded-md" style={{ backgroundColor: value }} />
                  <span className="text-xs font-mono text-slate-600">{value}</span>
                </div>
              ) : (
                <p className="text-xs font-semibold text-slate-700 truncate">{value}</p>
              )}
            </div>
          ))}
        </div>

        {/* Save button */}
        <div className="relative flex items-center gap-3">
          <motion.button
            animate={{ backgroundColor: saved ? '#059669' : saving ? '#6ee7b7' : '#059669' }}
            className="inline-flex min-w-[148px] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm"
          >
            {saving && <span className="animate-spin text-base">⟳</span>}
            {saved && <CheckCircle2 size={16} />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Storefront'}
          </motion.button>
          <button className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">Open Preview</button>
        </div>

        <AnimatePresence>
          {saved && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Partner storefront saved.</p>
                <p className="text-xs text-emerald-600 mt-0.5">Opening your live store…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Cursor x={curPos.x} y={curPos.y} clicking={clicking} />
    </div>
  );
}

type TutorialProduct = {
  id: number;
  name: string;
  catid?: number;
  image?: string | null;
  images?: string[] | string | null;
  price?: number | null;
  priceSrp?: number | null;
  priceDp?: number | null;
  priceMember?: number | null;
  originalPrice?: number | null;
  sku?: string | null;
  prodpv?: number | null;
  brand?: string | null;
  bestseller?: boolean;
  salespromo?: boolean;
  musthave?: boolean;
  verified?: boolean;
  qty?: number;
  variants?: [];
};

type ProductsApiResponse = {
  products?: TutorialProduct[];
};

type CategoriesApiResponse = {
  categories?: Category[];
};

const FALLBACK_PREVIEW_PRODUCTS: TutorialProduct[] = [
  { id: 9001, brand: 'AF HOME', name: 'Modern Sofa Set', priceSrp: 12499, priceDp: 12499, image: '/Images/HeroSection/chairs_stools.jpg', qty: 12 },
  { id: 9002, brand: 'AF HOME', name: 'Oak Coffee Table', priceSrp: 5299, priceDp: 5299, image: '/Images/HeroSection/living_room.jpg', qty: 9 },
  { id: 9003, brand: 'AF HOME', name: 'Linen Curtain Set', priceSrp: 1899, priceDp: 1899, image: '/Images/HeroSection/curtains.jpg', qty: 18 },
  { id: 9004, brand: 'AF HOME', name: 'Velvet Accent Chair', priceSrp: 8799, priceDp: 8799, image: '/Images/HeroSection/chairs_stools.jpg', qty: 6 },
];

const resolvePreviewAssetUrl = (rawValue: string | null | undefined, apiUrl?: string) => {
  const value = String(rawValue ?? '').trim();
  if (!value) return '/Images/af_home_logo.png';
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) return value;
  return apiUrl ? `${apiUrl.replace(/\/$/, '')}/${value.replace(/^\/+/, '')}` : `/${value.replace(/^\/+/, '')}`;
};

const normalizePreviewProduct = (product: TutorialProduct, apiUrl?: string): TutorialProduct => ({
  ...product,
  price: Number(product.price ?? product.priceSrp ?? product.priceDp ?? 0),
  priceSrp: Number(product.priceSrp ?? product.price ?? product.priceDp ?? 0),
  priceDp: Number(product.priceDp ?? product.priceSrp ?? product.price ?? 0),
  priceMember: Number(product.priceMember ?? product.priceDp ?? product.priceSrp ?? product.price ?? 0),
  image: resolvePreviewAssetUrl(product.image, apiUrl),
  qty: Number(product.qty ?? 0),
});

/* ─── Preview: Live partner store ────────────────────────────── */
const formatPeso = (value: number | null | undefined) =>
  `PHP ${Number(value ?? 0).toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;

function CheckoutDemoOverlay({ stage, product }: { stage: number; product?: TutorialProduct }) {
  if (stage <= 0 || !product) return null;

  const price = Number(product.priceDp ?? product.priceSrp ?? product.price ?? 0);
  const imageUrl = resolvePreviewAssetUrl(product.image);

  return (
    <div className="pointer-events-none absolute inset-0 z-[70] overflow-hidden">
      <AnimatePresence>
        {stage === 1 && (
          <motion.div
            key="fly-to-cart"
            initial={{ opacity: 0, x: 590, y: 285, scale: 0.78 }}
            animate={{ opacity: [0, 1, 1, 0], x: [590, 650, 970, 1040], y: [285, 240, 90, 62], scale: [0.78, 0.82, 0.42, 0.18] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute h-28 w-28 overflow-hidden rounded-2xl border border-white bg-white shadow-[0_22px_60px_rgba(15,23,42,0.32)]"
          >
            <Image src={imageUrl} alt="" fill sizes="112px" className="object-cover" unoptimized />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -14, scale: 0.96 }}
        animate={{ opacity: stage >= 1 ? 1 : 0, y: 0, scale: 1 }}
        className="absolute right-8 top-5 flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-[0_12px_34px_rgba(15,23,42,0.18)]"
      >
        <ShoppingCart size={16} />
        <span>Cart</span>
        <motion.span
          key={stage >= 2 ? 'cart-1' : 'cart-0'}
          initial={{ scale: 0.5 }}
          animate={{ scale: [0.5, 1.25, 1] }}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] text-white"
        >
          1
        </motion.span>
      </motion.div>

      <AnimatePresence>
        {stage === 2 && (
          <motion.div
            key="cart-drawer"
            initial={{ x: 390, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 390, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 190, damping: 24 }}
            className="absolute right-0 top-0 h-full w-[360px] border-l border-slate-200 bg-white shadow-[-28px_0_80px_rgba(15,23,42,0.18)]"
          >
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">Cart Summary</p>
              <h3 className="mt-1 text-lg font-black text-slate-900">Ready for checkout</h3>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                  <Image src={imageUrl} alt="" fill sizes="80px" className="object-cover" unoptimized />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{product.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{product.brand || 'AF HOME'}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-600">Qty 1</span>
                    <span className="text-sm font-black text-emerald-700">{formatPeso(price)}</span>
                  </div>
                </div>
              </div>

              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-center text-sm font-bold text-white shadow-sm">
                Proceed to Checkout
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {stage >= 3 && stage <= 5 && (
          <motion.div
            key="checkout-page"
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 bg-slate-50 text-slate-900"
          >
            <div className="border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100">
                    <CreditCard size={19} className="text-slate-700" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">LivingCo Secure Checkout</p>
                    <h2 className="text-lg font-black text-slate-900">Guest Checkout</h2>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                  /livingco/checkout/customer
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-5 p-6">
              <div className="col-span-2 space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-xs text-white">1</span>
                    Contact information
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['Full Name', stage >= 3 ? 'Maria Santos' : ''],
                      ['Email', stage >= 3 ? 'maria@email.com' : ''],
                      ['Phone Number', stage >= 3 ? '0917 555 0198' : ''],
                      ['Referred By', stage >= 3 ? '@livingco' : ''],
                    ].map(([label, value], index) => (
                      <div key={label}>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</label>
                        <div className="h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 + index * 0.18 }}>
                            {value}
                          </motion.span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: stage >= 4 ? 1 : 0.45, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-xs text-white">2</span>
                    Delivery address
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['Province', 'Metro Manila'],
                      ['City', 'Makati City'],
                      ['Barangay', 'Poblacion'],
                      ['Street Address', 'Unit 8B, Home Tower'],
                    ].map(([label, value], index) => (
                      <div key={label} className={label === 'Street Address' ? 'col-span-2' : ''}>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</label>
                        <div className="h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                          {stage >= 4 && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.14 }}>
                              {value}
                            </motion.span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: stage >= 4 ? 1 : 0.45, y: 0 }}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-xs text-white">3</span>
                    Payment method
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {['GCash', 'Card', 'Online Banking'].map((method, index) => (
                      <motion.div
                        key={method}
                        animate={{
                          borderColor: stage >= 4 && index === 0 ? '#0ea5e9' : '#e2e8f0',
                          backgroundColor: stage >= 4 && index === 0 ? '#f0f9ff' : '#ffffff',
                        }}
                        className="rounded-xl border px-3 py-3 text-center text-xs font-bold text-slate-700"
                      >
                        {method}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Order Summary</p>
                <div className="mt-4 flex gap-3 rounded-2xl bg-slate-50 p-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <Image src={imageUrl} alt="" fill sizes="64px" className="object-cover" unoptimized />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{product.name}</p>
                    <p className="mt-1 text-xs text-slate-500">Qty 1</p>
                    <p className="mt-2 text-sm font-black text-emerald-700">{formatPeso(price)}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
                  <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatPeso(price)}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Shipping</span><span>PHP 180</span></div>
                  <div className="flex justify-between text-base font-black text-slate-900"><span>Total</span><span>{formatPeso(price + 180)}</span></div>
                </div>
                <motion.div
                  animate={{
                    backgroundColor: stage >= 5 ? '#059669' : '#0ea5e9',
                    scale: stage === 5 ? [1, 0.97, 1] : 1,
                  }}
                  className="relative mt-5 overflow-hidden rounded-xl px-4 py-3 text-center text-sm font-bold text-white"
                >
                  {stage === 5 && (
                    <motion.span
                      initial={{ x: '-120%' }}
                      animate={{ x: '120%' }}
                      transition={{ duration: 0.95, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-y-0 left-0 w-1/2 bg-white/20"
                    />
                  )}
                  <span className="relative">{stage === 5 ? 'Creating checkout session...' : 'Place Order'}</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {stage >= 6 && (
          <motion.div
            key="success-page"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white"
          >
            <div className="border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">Checkout Success</p>
                  <h2 className="text-lg font-black text-slate-900">/livingco/checkout/success</h2>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Paid</span>
              </div>
            </div>
            <div className="flex h-[calc(100%-73px)] items-center justify-center bg-white">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="border-b border-gray-100 px-8 py-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 220, delay: 0.1 }}
                    className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500 bg-emerald-500"
                  >
                    <CheckCircle2 size={40} className="text-white" />
                  </motion.div>
                  <h1 className="mt-4 text-2xl font-black text-green-700">Payment Successful!</h1>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">Your order is confirmed and is now being prepared.</p>
                </div>
                <div className="space-y-4 px-6 py-6">
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100">
                    {[
                      ['Checkout ID', 'AFH-2408'],
                      ['Status', 'paid'],
                      ['Payment Intent', 'pi_afhome_demo'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between px-4 py-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</span>
                        <span className="max-w-[190px] truncate text-xs font-semibold text-gray-700">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="mb-3 text-xs font-bold text-emerald-700">What happens next?</p>
                    {['Order confirmation will be sent to your email', 'Our team will prepare your items for delivery', 'You will receive a shipping update soon'].map((line) => (
                      <div key={line} className="mt-2 flex items-start gap-2.5">
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500">
                          <CheckCircle2 size={10} className="text-white" />
                        </div>
                        <p className="text-xs leading-relaxed text-emerald-700">{line}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl border border-slate-200 bg-white py-3 text-center text-sm font-semibold text-slate-700">Track This Order</div>
                    <div className="rounded-xl bg-sky-500 py-3 text-center text-sm font-semibold text-white">Back to Home</div>
                  </div>
                  <p className="text-center text-[11px] text-gray-400">Secured by PayMongo · AF Home</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PreviewScreen({ playing }: { playing: boolean }) {
  const [curPos, setCurPos] = useState({ x: -300, y: -300 });
  const [clicking, setClicking] = useState(false);
  const [callout, setCallout] = useState('');
  const [showListing, setShowListing] = useState(false);
  const [storeScrolled, setStoreScrolled] = useState(false);
  const [listingScrolled, setListingScrolled] = useState(false);
  const [highlightAddCart, setHighlightAddCart] = useState(false);
  const [checkoutStage, setCheckoutStage] = useState(0);
  const [products, setProducts] = useState<TutorialProduct[]>(FALLBACK_PREVIEW_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(() => Boolean(process.env.NEXT_PUBLIC_LARAVEL_API_URL));
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const visibleProducts = products.slice(0, 8);

  useEffect(() => {
    let cancelled = false;
    const apiUrl = process.env.NEXT_PUBLIC_LARAVEL_API_URL;
    const baseUrl = apiUrl?.replace(/\/$/, '');

    if (!baseUrl) {
      return;
    }

    const loadPreviewData = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch(`${baseUrl}/api/products?page=1&per_page=24&status=1`, { headers: { Accept: 'application/json' } }),
          fetch(`${baseUrl}/api/categories?used_only=1&per_page=100`, { headers: { Accept: 'application/json' } }),
        ]);

        const productsJson = productsResponse.ok ? ((await productsResponse.json()) as ProductsApiResponse) : { products: [] };
        const categoriesJson = categoriesResponse.ok ? ((await categoriesResponse.json()) as CategoriesApiResponse) : { categories: [] };
        const nextProducts = (productsJson.products ?? []).map((product) => normalizePreviewProduct(product, baseUrl));

        if (!cancelled) {
          setProducts(nextProducts.length > 0 ? nextProducts : FALLBACK_PREVIEW_PRODUCTS);
          setCategories(categoriesJson.categories ?? []);
          setIsLoadingData(false);
        }
      } catch {
        if (!cancelled) setIsLoadingData(false);
      }
    };

    void loadPreviewData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const click = (cb: () => void) => { setClicking(true); setTimeout(() => { setClicking(false); cb(); }, 220); };

    const seq: [number, () => void][] = [
      [100,  () => { setCheckoutStage(0); setStoreScrolled(false); setListingScrolled(false); setHighlightAddCart(false); }],
      [800,  () => setCallout('Your live partner storefront, loaded from the real system')],
      [2500, () => setCallout('')],
      [2800, () => setCallout('Scroll through the storefront to browse featured products')],
      [3100, () => setStoreScrolled(true)],
      [4300, () => setCurPos({ x: 1088, y: 138 })],
      [5100, () => click(() => { setShowListing(true); setCallout('Products, images, filters, and cards come from backend data'); })],
      [6200, () => setCurPos({ x: 610, y: 245 })],
      [7000, () => { setListingScrolled(true); setCallout('The customer scrolls the product list to view more items'); }],
      [8100, () => setHighlightAddCart(true)],
      [8500, () => setCallout('The product card hover reveals the Add to Cart button')],
      [8900, () => setCurPos({ x: 612, y: 413 })],
      [9600, () => click(() => { setHighlightAddCart(false); setCheckoutStage(1); })],
      [10800, () => setCheckoutStage(2)],
      [11700, () => setCallout('The cart opens, then continues to the secure checkout page')],
      [12500, () => click(() => setCheckoutStage(3))],
      [13600, () => setCallout('Checkout captures customer contact information and referral source')],
      [14800, () => setCheckoutStage(4)],
      [16100, () => setCallout('Delivery address and payment method are selected before placing the order')],
      [17600, () => setCurPos({ x: 1008, y: 430 })],
      [18400, () => click(() => setCheckoutStage(5))],
      [19100, () => setCallout('Place Order creates the checkout session and processes payment securely')],
      [21400, () => setCheckoutStage(6)],
      [22700, () => setCallout('Success page confirms payment and shows the next steps')],
      [28200, () => setCallout('')],
    ];

    const allTimers = seq.map(([t, fn]) => setTimeout(fn as () => void, t as number));
    return () => allTimers.forEach(clearTimeout);
  }, [playing]);

  const noopFilterChange = () => undefined;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#f8f9fa]">
      {/* Callout overlay — always above both views */}
      <AnimatePresence>
        {callout && (
          <motion.div key={callout} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
            <Callout text={callout} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!showListing ? (
          <motion.div
            key="storefront"
            className="absolute inset-0 bg-slate-50"
            animate={{ y: storeScrolled ? -145 : 0 }}
            exit={{ opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <section className="border-b border-slate-200" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #2563eb 100%)' }}>
              <div className="mx-auto max-w-7xl px-6 py-5">
                <div className="flex items-center justify-between gap-5 rounded-[28px] bg-white/92 p-6 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-5">
                    <div className="flex h-24 w-28 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <span className="text-xl font-bold text-teal-700">LC</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Partner Store</p>
                      <h1 className="text-3xl font-bold tracking-tight text-teal-700">Modern Living, Delivered.</h1>
                      <p className="mt-1 max-w-2xl text-sm text-slate-600">Curated home products for every Filipino home.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm">Login</button>
                    <button className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700">LivingCo Products</button>
                  </div>
                </div>
              </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-8">
              <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-blue-600">Featured Products</p>
              <h2 className="mb-5 text-center text-2xl font-bold text-slate-900">Loaded From Backend</h2>
              <div className="grid grid-cols-4 gap-4">
                {visibleProducts.slice(0, 4).map((product, index) => (
                  <motion.div key={product.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                    <ItemCard
                      product={product}
                      brandName={product.brand || ''}
                      allowGuestAddToCart
                      allowGuestWishlist
                    />
                  </motion.div>
                ))}
              </div>
            </section>

            <footer className="border-t border-slate-200 bg-white px-6 py-4">
              <div className="mx-auto flex max-w-7xl items-center justify-between text-xs text-slate-500">
                <p>Orders from <span className="font-semibold text-slate-800">LivingCo Philippines</span> are still processed through AF Home.</p>
                <p>{isLoadingData ? 'Loading live products...' : `${products.length} backend products available`}</p>
              </div>
            </footer>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: storeScrolled ? 1 : 0, y: storeScrolled ? 0 : 14 }}
              className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/70 bg-white/90 px-4 py-2 text-xs font-bold text-teal-700 shadow-[0_14px_40px_rgba(15,23,42,0.18)] backdrop-blur"
            >
              Featured products in view
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="listing" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.38 }}
            className="absolute inset-0 flex flex-col bg-[#faf8f5]">
            <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
              <div className="flex items-center justify-between">
                <h1 className="text-base font-bold text-slate-800">All Products</h1>
                <nav className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="font-medium">Home</span>
                  <span>›</span>
                  <span className="font-semibold text-slate-600">All Products</span>
                </nav>
              </div>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden px-6 py-6">
              <aside className="w-80 shrink-0 overflow-y-auto">
                <ProductFilter
                  onFilterChange={noopFilterChange}
                  categories={categories}
                  currentCategory="All Products"
                  maxPrice={100000}
                />
              </aside>

              <main className="relative min-w-0 flex-1 overflow-hidden">
                <TopFilter
                  onViewTypeChange={setViewType}
                  viewType={viewType}
                  showNumber={12}
                  showPageSizeControl={false}
                  className="mb-4"
                />
                <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Showing <span className="font-semibold text-slate-700">{visibleProducts.length}</span> of{' '}
                    <span className="font-semibold text-slate-700">{products.length}</span> products
                  </span>
                  {isLoadingData ? <span className="text-xs font-medium text-sky-500">Loading live data...</span> : null}
                </div>
                <motion.div
                  animate={{ y: listingScrolled ? -96 : 0 }}
                  transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className={viewType === 'grid' ? 'grid grid-cols-4 gap-4' : 'flex flex-col gap-3'}
                >
                  {visibleProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: highlightAddCart && index === 0 ? 1.035 : 1,
                      }}
                      transition={{ duration: 0.22, delay: index * 0.02 }}
                      className={highlightAddCart && index === 0 ? 'relative z-[60] rounded-lg ring-2 ring-sky-400 ring-offset-2 ring-offset-[#faf8f5]' : ''}
                    >
                      <ItemCard
                        product={product}
                        brandName={product.brand || ''}
                        allowGuestAddToCart
                        allowGuestWishlist
                      />
                      {highlightAddCart && index === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                          className="pointer-events-none absolute bottom-[145px] right-3 z-[70] flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-bold text-white shadow-lg"
                        >
                          <ShoppingCart size={17} />
                          Add to Cart
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              </main>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <CheckoutDemoOverlay stage={checkoutStage} product={visibleProducts[0]} />
      <Cursor x={curPos.x} y={curPos.y} clicking={clicking} />
    </div>
  );
}

/* ─── Scale constants ────────────────────────────────────────── */
const BEZEL_W = 1308; // 1280 screen + 14px padding × 2
const BEZEL_H = 734;  // 14px top padding + 720px screen (controls are outside the scale)
const TUTORIAL_VIDEO_DOWNLOAD_URL = '/videos/storefront-tutorial.mp4';

/* ─── Main ───────────────────────────────────────────────────── */
export default function StorefrontTutorial() {
  const [step, setStep] = useState<Step>('intro');
  const [playing, setPlaying] = useState(false);
  const [stepRestartKey, setStepRestartKey] = useState(0);
  const [timelineVersion, setTimelineVersion] = useState(0);
  const [urlBar, setUrlBar] = useState('admin.afhome.ph/partner-storefronts');
  const [scale, setScale] = useState(1);
  const [viewportWidth, setViewportWidth] = useState(BEZEL_W + 16);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isDevicePortrait, setIsDevicePortrait] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileTheater, setMobileTheater] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const isDragging = useRef(false);
  const justSeeked = useRef(false);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const spokenStepRef = useRef<Step | null>(null);
  const stepIdx = STEPS.indexOf(step);

  const goTo = (s: Step) => { if (timer.current) clearTimeout(timer.current); setStep(s); };

  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioContextRef.current) {
      const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return null;
      audioContextRef.current = new AudioContextCtor();
    }
    if (audioContextRef.current.state === 'suspended') {
      void audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((kind: 'play' | 'pause' | 'step' | 'success' | 'replay') => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    const frequencies: Record<typeof kind, [number, number]> = {
      play: [420, 680],
      pause: [300, 180],
      step: [520, 760],
      success: [520, 920],
      replay: [360, 720],
    };
    const [startFreq, endFreq] = frequencies[kind];
    const duration = kind === 'success' ? 0.42 : 0.16;

    osc.type = kind === 'pause' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === 'success' ? 0.08 : 0.045, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }, [getAudioContext]);

  const startMusic = useCallback((restart = false) => {
    if (typeof window === 'undefined') return;

    if (!musicAudioRef.current) {
      const audio = new Audio(BACKGROUND_MUSIC_URL);
      audio.loop = true;
      audio.volume = BACKGROUND_MUSIC_VOLUME;
      musicAudioRef.current = audio;
    }

    const audio = musicAudioRef.current;
    if (restart) audio.currentTime = 0;
    audio.volume = BACKGROUND_MUSIC_VOLUME;
    void audio.play().catch(() => {
      // Browser autoplay rules can reject until the user's play click unlocks audio.
    });
  }, []);

  const stopMusic = useCallback((reset = false) => {
    const audio = musicAudioRef.current;
    if (!audio) return;
    audio.pause();
    if (reset) audio.currentTime = 0;
  }, []);

  const stopVoiceOver = useCallback(() => {
    const audio = voiceAudioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  const playVoiceOver = useCallback((targetStep: Step) => {
    if (typeof window === 'undefined') return;
    const src = VOICE_AUDIO[targetStep];
    if (!src) return;

    const currentAudio = voiceAudioRef.current;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const audio = new Audio(src);
    audio.volume = 0.95;
    voiceAudioRef.current = audio;
    void audio.play().catch(() => {
      if (voiceAudioRef.current === audio) {
        voiceAudioRef.current = null;
      }
    });
  }, []);

  const handleReplay = () => {
    if (timer.current) clearTimeout(timer.current);
    if (controlsHideTimer.current) clearTimeout(controlsHideTimer.current);

    stopVoiceOver();
    spokenStepRef.current = null;
    startMusic(true);
    playSound('replay');
    justSeeked.current = true;
    elapsedRef.current = 0;
    setElapsed(0);
    setStep('intro');
    setStepRestartKey(k => k + 1);
    setTimelineVersion(v => v + 1);
    setPlaying(true);
    setControlsVisible(true);
  };

  const handleTogglePlay = () => {
    if (step === 'ending' || elapsedRef.current >= TOTAL_DURATION - 100) {
      handleReplay();
      return;
    }

    if (!playing) {
      startMusic();
      playSound('play');
      // Resuming: remount step component so animations restart cleanly.
      // Elapsed is intentionally NOT reset — scrubber stays at the pause position.
      setStepRestartKey(k => k + 1);
    } else {
      stopMusic();
      stopVoiceOver();
      playSound('pause');
    }
    setControlsVisible(true);
    setPlaying(p => !p);
  };
  const togglePlayRef = useRef(handleTogglePlay);
  useEffect(() => {
    togglePlayRef.current = handleTogglePlay;
  });

  useEffect(() => {
    if (!playing || step === 'intro') return;
    playSound(step === 'ending' ? 'success' : 'step');
    if (step === 'ending') stopMusic(true);
  }, [step, playing, playSound, stopMusic]);

  useEffect(() => {
    if (!playing) {
      stopVoiceOver();
      return;
    }
    if (spokenStepRef.current === step) return;
    spokenStepRef.current = step;
    playVoiceOver(step);
  }, [step, playing, playVoiceOver, stopVoiceOver]);

  useEffect(() => () => {
    stopVoiceOver();
    stopMusic(true);
  }, [stopMusic, stopVoiceOver]);

  const handleSaved = useCallback(() => {
    playSound('success');
    setUrlBar('afhome.ph/shop/livingco');
    setTimeout(() => {
      if (timer.current) clearTimeout(timer.current);
      setStep('preview');
    }, 700);
  }, [playSound]); // stable ref — setUrlBar/setStep are stable, timer is a ref

  useEffect(() => {
    if (!playing) return;
    if (step === 'step5') return; // step5 advances via onSaved
    const remaining = getRemainingStepDuration(step, elapsedRef.current);
    timer.current = setTimeout(() => {
      const next = STEPS[stepIdx + 1];
      if (next) setStep(next);
    }, remaining);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [step, stepIdx, playing, timelineVersion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); togglePlayRef.current(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const update = () => {
      const rawWidth = window.innerWidth;
      const rawHeight = window.innerHeight;
      const devicePortrait = rawWidth < rawHeight;
      const fullscreenLayout = mobileTheater || isFullscreen;
      const effectiveWidth = mobileTheater ? Math.max(rawWidth, rawHeight) : rawWidth;
      const effectiveHeight = mobileTheater ? Math.min(rawWidth, rawHeight) : rawHeight;
      const outerGap = fullscreenLayout ? 0 : 24;
      const controlsGap = fullscreenLayout ? 0 : 68;

      setViewportWidth(effectiveWidth);
      setIsMobileViewport(rawWidth < 768);
      setIsDevicePortrait(devicePortrait);

      const sw = (effectiveWidth - outerGap) / BEZEL_W;
      const sh = (effectiveHeight - outerGap - controlsGap) / BEZEL_H;
      const nextScale = Math.min(sw, sh);
      setScale(fullscreenLayout ? nextScale : Math.min(1, nextScale));
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [mobileTheater, isFullscreen]);

  useEffect(() => {
    const onFSChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active) {
        setMobileTheater(false);
        setControlsVisible(true);
      }
    };
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  useEffect(() => {
    if (!mobileTheater) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileTheater]);

  const toggleFullscreen = async () => {
    if (document.fullscreenElement || mobileTheater) {
      setMobileTheater(false);
      setControlsVisible(true);
      if (document.fullscreenElement) await document.exitFullscreen();
      try { screen.orientation.unlock(); } catch { /* ignore */ }
      return;
    }

    try {
      setControlsVisible(false);
      if (isMobileViewport) setMobileTheater(true);
      if (document.fullscreenEnabled && containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else if (!isMobileViewport) {
        setMobileTheater(true);
      }
      try { await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape'); } catch { /* iOS ignores */ }
    } catch {
      setMobileTheater(true);
    }
  };

  const handleDownloadVideo = async () => {
    playSound('step');

    try {
      const response = await fetch(TUTORIAL_VIDEO_DOWNLOAD_URL, { method: 'HEAD' });
      if (!response.ok) {
        window.alert('Downloadable tutorial video is not available yet. Add storefront-tutorial.mp4 in public/videos first.');
        return;
      }

      const link = document.createElement('a');
      link.href = TUTORIAL_VIDEO_DOWNLOAD_URL;
      link.download = 'storefront-tutorial.mp4';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      window.alert('Downloadable tutorial video is not available yet.');
    }
  };

  const revealFullscreenControls = useCallback(() => {
    const active = isFullscreen || mobileTheater;
    if (!active) return;

    setControlsVisible(true);
    if (controlsHideTimer.current) clearTimeout(controlsHideTimer.current);
    controlsHideTimer.current = setTimeout(() => {
      if (playing && elapsedRef.current < TOTAL_DURATION - 100) {
        setControlsVisible(false);
      }
    }, 2200);
  }, [isFullscreen, mobileTheater, playing]);

  useEffect(() => () => {
    if (controlsHideTimer.current) clearTimeout(controlsHideTimer.current);
  }, []);

  // Sync scrubber position when step changes naturally (not from a seek)
  useEffect(() => {
    if (isDragging.current) return;
    if (justSeeked.current) { justSeeked.current = false; return; }
    const start = step === 'ending' ? TOTAL_DURATION : (STEP_STARTS[step] ?? 0);
    elapsedRef.current = start;
    setElapsed(start);
  }, [step]);

  // Tick elapsed while playing
  useEffect(() => {
    if (!playing || step === 'ending') return;
    const iv = setInterval(() => {
      if (!isDragging.current) {
        const next = Math.min(elapsedRef.current + 50, TOTAL_DURATION);
        elapsedRef.current = next;
        setElapsed(next);
      }
    }, 50);
    return () => clearInterval(iv);
  }, [playing, step]);

  const seekToMs = (ms: number) => {
    if (timer.current) clearTimeout(timer.current);

    const clamped = Math.max(0, Math.min(ms, TOTAL_DURATION - 1));
    let acc = 0;
    for (const s of SCRUB_STEPS) {
      if (clamped < acc + DURATIONS[s]) {
        justSeeked.current = true;
        elapsedRef.current = clamped;
        setElapsed(clamped);
        goTo(s);
        setStepRestartKey(k => k + 1);
        setTimelineVersion(v => v + 1);
        setPlaying(true);
        return;
      }
      acc += DURATIONS[s];
    }
  };

  const jumpToStep = (targetStep: Step) => {
    if (timer.current) clearTimeout(timer.current);

    const start = targetStep === 'ending' ? TOTAL_DURATION : getStepStart(targetStep);
    justSeeked.current = true;
    elapsedRef.current = start;
    setElapsed(start);
    setStep(targetStep);
    setStepRestartKey(k => k + 1);
    setTimelineVersion(v => v + 1);
  };

  const handleScrubInteract = (clientX: number) => {
    if (!scrubberRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    seekToMs(frac * TOTAL_DURATION);
  };

  const handleScrubMouseDown = () => {
    isDragging.current = true;
    const el = scrubberRef.current;
    if (!el) return;
    const onMove = (ev: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      elapsedRef.current = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width)) * TOTAL_DURATION;
      setElapsed(elapsedRef.current);
    };
    const onUp = (ev: MouseEvent) => {
      isDragging.current = false;
      handleScrubInteract(ev.clientX);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleScrubTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    isDragging.current = true;
    const el = scrubberRef.current;
    if (!el) return;
    const getX = (ev: TouchEvent) => ev.touches[0]?.clientX ?? ev.changedTouches[0]?.clientX ?? 0;
    const update = (clientX: number) => {
      const rect = el.getBoundingClientRect();
      elapsedRef.current = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * TOTAL_DURATION;
      setElapsed(elapsedRef.current);
    };
    update(e.touches[0].clientX);
    const onMove = (ev: TouchEvent) => update(getX(ev));
    const onEnd = (ev: TouchEvent) => {
      isDragging.current = false;
      handleScrubInteract(ev.changedTouches[0]?.clientX ?? elapsedRef.current);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  const meta = STEP_META[step];
  const showInitialPlayButton = !playing && step === 'intro' && elapsed === 0;
  const shouldRotateMobileTheater = mobileTheater && isDevicePortrait;
  const fullscreenActive = isFullscreen || mobileTheater;
  const isTimelineComplete = step === 'ending' || elapsed >= TOTAL_DURATION - 100;
  const showControls = !fullscreenActive || controlsVisible || !playing || isTimelineComplete;
  const currentUrlBar = step === 'preview' ? urlBar : 'admin.afhome.ph/partner-storefronts';
  const rootStyle = {
    minHeight: fullscreenActive ? '100dvh' : '100vh',
    width: fullscreenActive ? '100dvw' : '100%',
    background: 'radial-gradient(ellipse at 50% 30%, #2a2a2a 0%, #0f0f0f 100%)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: fullscreenActive ? 0 : '12px 0',
    position: mobileTheater ? 'fixed' as const : 'relative' as const,
    inset: mobileTheater ? 0 : undefined,
    zIndex: mobileTheater ? 9999 : undefined,
    transition: 'padding 260ms ease, background 260ms ease',
  };
  const playerShellStyle = {
    width: shouldRotateMobileTheater ? '100dvh' : '100%',
    height: shouldRotateMobileTheater ? '100dvw' : 'auto',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    transform: shouldRotateMobileTheater ? 'rotate(90deg)' : 'rotate(0deg)',
    transformOrigin: 'center center',
    transition: 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1), width 420ms cubic-bezier(0.22, 1, 0.36, 1), height 420ms cubic-bezier(0.22, 1, 0.36, 1)',
    willChange: 'transform, width, height',
  };

  return (
    <div
      ref={containerRef}
      style={rootStyle}
      onMouseMove={revealFullscreenControls}
      onTouchStart={revealFullscreenControls}
    >
      <div style={playerShellStyle}>
      {/* Scale wrapper — only wraps the bezel, controls are outside */}
      <div style={{ position: 'relative', width: BEZEL_W * scale, height: BEZEL_H * scale, flexShrink: 0, transition: 'width 420ms cubic-bezier(0.22, 1, 0.36, 1), height 420ms cubic-bezier(0.22, 1, 0.36, 1)' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: BEZEL_W,
          transform: `scale(${scale})`, transformOrigin: 'top left',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          transition: 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform',
        }}>

      {/* MacBook bezel */}
      <div style={{
        position: 'relative', padding: '14px 14px 0',
        background: 'linear-gradient(180deg, #c8c8c8 0%, #a8a8a8 100%)',
        borderRadius: '22px 22px 0 0',
        boxShadow: '0 50px 140px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.55), 0 0 0 1px rgba(0,0,0,0.4)',
        flexShrink: 0,
      }}>
        {/* Camera dot */}
        <div style={{ position: 'absolute', top: 5, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: '#555', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6)' }} />

        {/* Screen viewport */}
        <div className="relative" style={{ width: 1280, height: 720, borderRadius: '10px 10px 0 0', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15)' }}>

          {/* Safari chrome */}
          <div className="shrink-0 flex flex-col" style={{ background: '#f0f0f0', borderBottom: '1px solid #c8c8c8' }}>
            {/* Tab bar */}
            <div className="flex items-end px-4 pt-2" style={{ height: 36 }}>
              <div className="flex items-center gap-2 bg-white rounded-t-lg px-4 h-8 border border-[#d0d0d0] text-[11px] text-slate-600 font-medium shadow-sm" style={{ borderBottom: 'none', marginBottom: -1 }}>
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                {step === 'preview' ? 'LivingCo Philippines — Partner Store' : 'Partner Storefronts — AF Home Admin'}
              </div>
            </div>
            {/* Toolbar */}
            <div className="flex items-center px-4 gap-3 bg-white" style={{ height: 44, borderTop: '1px solid #d8d8d8' }}>
              <div className="flex gap-1.5 items-center mr-1">
                <div className="w-3 h-3 rounded-full" style={{ background: '#FF5F57', border: '0.5px solid rgba(0,0,0,0.12)' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E', border: '0.5px solid rgba(0,0,0,0.12)' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#28C840', border: '0.5px solid rgba(0,0,0,0.12)' }} />
              </div>
              <div className="flex gap-0 text-[#aaa] select-none" style={{ fontSize: 20, lineHeight: 1 }}>
                <span className="px-1">‹</span>
                <span className="px-1 opacity-40">›</span>
              </div>
              <div className="flex flex-1 justify-center">
                <motion.div key={currentUrlBar}
                  initial={{ opacity: 0.6 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 bg-[#f0f0f0] rounded-lg px-3 h-7 border border-[#d0d0d0]" style={{ width: 480 }}>
                  <svg width="10" height="11" viewBox="0 0 12 14" fill="none" className="shrink-0">
                    <path d="M6 0C3.24 0 1 2.24 1 5c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5z" fill="#10b981"/>
                  </svg>
                  <span className="text-[11.5px] text-[#444] flex-1 text-center" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                    {currentUrlBar}
                  </span>
                </motion.div>
              </div>
              <div className="flex gap-2 text-[#999] select-none text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              </div>
            </div>
          </div>

          {/* Admin / Store body */}
          <div className="flex bg-slate-50 relative" style={{ height: 'calc(100% - 80px)' }}>

            {/* Intro */}
            <AnimatePresence>
              {step === 'intro' && (
                <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 z-20 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #064e3b 0%, #1e3a5f 50%, #0f172a 100%)' }}>
                  <div className="text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 180, damping: 14 }}
                      className="mx-auto mb-6 w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.4)]">
                      <Store size={36} className="text-white" />
                    </motion.div>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                      className="text-emerald-400 text-sm font-bold tracking-widest uppercase mb-3">AF Home</motion.p>
                    <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                      className="text-white text-5xl font-black tracking-tight">Partner Storefront</motion.h1>
                    <motion.h2 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                      className="text-white text-5xl font-black tracking-tight">Studio</motion.h2>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                      className="text-white/40 text-lg mt-4">How to set up your branded partner shop — step by step</motion.p>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
                      className="mt-4 flex items-center justify-center gap-2 text-white/25 text-sm">
                      <Eye size={14} /> 5 steps · ends with your live store
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ending */}
            <AnimatePresence>
              {step === 'ending' && (
                <motion.div key="ending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #064e3b 0%, #1e3a5f 50%, #0f172a 100%)' }}>
                  <div className="text-center max-w-2xl">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 180, damping: 14 }}
                      className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)]">
                      <ShoppingBag size={28} className="text-white" />
                    </motion.div>
                    {['Your brand.', 'Your curated products.', 'Powered by AF Home.'].map((line, i) => (
                      <div key={line} className="overflow-hidden">
                        <motion.p initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2 + i * 0.2, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                          className={`font-black text-5xl leading-tight ${i === 2 ? 'text-emerald-400' : 'text-white'}`}
                        >{line}</motion.p>
                      </div>
                    ))}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                      className="mt-10 flex items-center justify-center gap-3">
                      <button className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-3.5 rounded-2xl text-sm flex items-center gap-2 transition">
                        Create Your Storefront <ArrowRight size={16} />
                      </button>
                      <button onClick={() => goTo('intro')}
                        className="border border-white/20 text-white/60 font-medium px-6 py-3.5 rounded-2xl text-sm transition hover:bg-white/5">
                        Watch Again
                      </button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sidebar */}
            {step !== 'intro' && step !== 'ending' && step !== 'preview' && <Sidebar />}

            {/* Step / Preview content */}
            <AnimatePresence mode="wait">
              {step !== 'intro' && step !== 'ending' && (
                <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }} className="flex-1 flex flex-col">

                  {/* Step header bar (progress only, not shown during preview) */}
                  {step !== 'preview' && meta && (
                    <div className="shrink-0 border-b border-slate-200 bg-white px-5">
                      <div className="flex items-center gap-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">{meta.label}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-700">{meta.title}</h3>
                        <div className="ml-auto flex gap-1.5">
                          {MAIN_STEPS.map((s) => (
                            <div key={s} className="h-1.5 rounded-full transition-all duration-500"
                              style={{ width: step === s ? 20 : 6, backgroundColor: STEPS.indexOf(step) >= STEPS.indexOf(s) ? '#10b981' : '#e2e8f0' }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Screen */}
                  <div className="flex-1 relative overflow-hidden">
                    {step === 'step1' && <Step1Screen key={stepRestartKey} playing={playing} />}
                    {step === 'step2' && <Step2Screen key={stepRestartKey} playing={playing} />}
                    {step === 'step3' && <Step3Screen key={stepRestartKey} playing={playing} />}
                    {step === 'step4' && <Step4Screen key={stepRestartKey} playing={playing} />}
                    {step === 'step5' && <Step5Screen key={stepRestartKey} onSaved={handleSaved} playing={playing} />}
                    {step === 'preview' && <PreviewScreen key={stepRestartKey} playing={playing} />}
                    <MotionGraphicsOverlay step={step} playing={playing} />
                    {playing && <SectionTitleCard step={step} />}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Movie-style subtitle */}
          <AnimatePresence mode="wait">
            {meta?.caption && step !== 'intro' && step !== 'ending' && (
              <motion.div
                key={step + '-caption'}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute z-40 left-0 right-0 flex justify-center"
                style={{ bottom: 22 }}
              >
                <div style={{
                  background: 'rgba(0,0,0,0.72)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 10,
                  padding: '8px 20px',
                  maxWidth: 760,
                  textAlign: 'center',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <p style={{ color: '#f0f0f0', fontSize: 13.5, fontWeight: 500, lineHeight: 1.55, letterSpacing: 0.1 }}>
                    {meta.caption}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {(showInitialPlayButton || (!playing && step !== 'ending')) && (
              <motion.button
                key="pause-play-overlay"
                type="button"
                onClick={handleTogglePlay}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.22 }}
                className="absolute inset-0 z-[120] flex items-center justify-center bg-black/20 backdrop-blur-[1px]"
                aria-label={showInitialPlayButton ? 'Play storefront tutorial' : 'Resume storefront tutorial'}
              >
                <span className="flex h-24 w-24 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white shadow-[0_18px_70px_rgba(0,0,0,0.55)] transition hover:scale-105 hover:bg-black/65">
                  <Play size={38} fill="currentColor" className="ml-1" />
                </span>
              </motion.button>
            )}
          </AnimatePresence>

        </div>{/* end screen viewport */}
      </div>{/* end MacBook bezel */}

        </div>{/* end scale content */}
      </div>{/* end scale wrapper */}

      {/* ── Controls bar — native size, NOT inside scale transform ── */}
      <div style={{
        width: Math.min(BEZEL_W * scale, viewportWidth - (fullscreenActive ? 0 : 16)),
        flexShrink: 0,
        padding: fullscreenActive ? '0 16px 16px' : '0 4px',
        boxSizing: 'border-box',
        position: fullscreenActive ? 'absolute' as const : 'relative' as const,
        left: fullscreenActive ? '50%' : undefined,
        bottom: fullscreenActive ? 0 : undefined,
        zIndex: fullscreenActive ? 200 : undefined,
        transform: fullscreenActive ? `translate(-50%, ${showControls ? '0' : '22px'})` : 'none',
        opacity: showControls ? 1 : 0,
        pointerEvents: showControls ? 'auto' as const : 'none' as const,
        transition: 'width 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease, transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(15,23,42,0.78)',
          border: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(18px)',
          boxShadow: '0 18px 60px rgba(0,0,0,0.32)',
          borderRadius: 16, padding: '8px 12px',
        }}>

          {/* Play / Pause — 44px touch target */}
          <button
            onClick={isTimelineComplete ? handleReplay : handleTogglePlay}
            title={isTimelineComplete ? 'Replay' : playing ? 'Pause' : 'Play'}
            style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.13)', color: '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
          >
            {isTimelineComplete ? <RotateCcw size={17} /> : playing ? <Pause size={17} /> : <Play size={17} />}
          </button>

          {/* Current time */}
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: 'ui-monospace, monospace', minWidth: 32, textAlign: 'right', flexShrink: 0 }}>
            {formatTime(elapsed)}
          </span>

          {/* Scrubber — 44px touch target height */}
          <div
            ref={scrubberRef}
            style={{ flex: 1, position: 'relative', height: 44, display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none', touchAction: 'none' }}
            onMouseDown={handleScrubMouseDown}
            onTouchStart={handleScrubTouchStart}
          >
            {/* Track */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.14)', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 2, background: '#10b981', width: `${Math.min(100, (elapsed / TOTAL_DURATION) * 100)}%` }} />
              </div>
            </div>

            {/* Step boundary markers + labels */}
            {!isMobileViewport && SCRUB_STEPS.slice(1).map(s => {
              const pct = ((STEP_STARTS[s] ?? 0) / TOTAL_DURATION) * 100;
              const isActive = step === s;
              return (
                <div key={s} style={{ position: 'absolute', top: '50%', left: `${pct}%`, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
                  <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.28)' }} />
                  <span style={{
                    position: 'absolute', top: 10, fontSize: 9, whiteSpace: 'nowrap',
                    color: isActive ? '#10b981' : 'rgba(255,255,255,0.3)',
                    fontWeight: isActive ? 700 : 400,
                    transform: 'translateX(-50%)',
                    transition: 'color 0.3s',
                  }}>{SCRUB_LABELS[s]}</span>
                </div>
              );
            })}

            {/* Thumb */}
            <div style={{
              position: 'absolute', top: '50%', left: `${Math.min(100, (elapsed / TOTAL_DURATION) * 100)}%`,
              transform: 'translate(-50%, -50%)',
              width: 16, height: 16, borderRadius: '50%',
              background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.55)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Total time */}
          <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 12, fontFamily: 'ui-monospace, monospace', minWidth: 32, flexShrink: 0 }}>
            {formatTime(TOTAL_DURATION)}
          </span>

          {/* Step chips */}
          {!isMobileViewport && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              {SCRUB_STEPS.map(s => {
                const active = step === s;
                const passed = (elapsed >= (STEP_STARTS[s] ?? 0)) && !active;
                return (
                  <button key={s} onClick={() => jumpToStep(s)} title={SCRUB_LABELS[s] ?? s}
                    style={{
                      width: active ? 22 : 8, height: 8, borderRadius: 4,
                      background: active ? '#10b981' : passed ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.18)',
                      border: 'none', cursor: 'pointer', padding: 0,
                      transition: 'width 0.3s',
                    }} />
                );
              })}
            </div>
          )}

          {/* Download video */}
          <button
            onClick={handleDownloadVideo}
            title="Download tutorial video"
            style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.78)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
          >
            <Download size={17} />
          </button>

          {/* Fullscreen — 44px touch target */}
          <button
            onClick={toggleFullscreen}
            title={fullscreenActive ? 'Exit fullscreen' : 'Fullscreen'}
            style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.7)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
          >
            {fullscreenActive ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
        </div>
      </div>

      </div>
    </div>
  );
}
