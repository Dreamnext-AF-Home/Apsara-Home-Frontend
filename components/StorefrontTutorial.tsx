'use client';

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Upload, CheckCircle2, Eye, ArrowRight, ShoppingBag, Play, Pause, Maximize2, Minimize2 } from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────── */
type Step = 'intro' | 'step1' | 'step2' | 'step3' | 'step4' | 'step5' | 'preview' | 'ending';
const STEPS: Step[] = ['intro', 'step1', 'step2', 'step3', 'step4', 'step5', 'preview', 'ending'];
const DURATIONS: Record<Step, number> = {
  intro: 3500, step1: 15000, step2: 10000, step3: 9000,
  step4: 9000, step5: 5500, preview: 13000, ending: 99999,
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
    setDisplayed('');
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
      [2200, () => onSaved()],
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

/* ─── Preview Products ───────────────────────────────────────── */
const PREVIEW_PRODUCTS = [
  { brand: 'LIVING LUXE',  name: 'Ceramic Vase Collection',      price: '₱1,299', orig: '₱1,500', disc: 13, bg: 'linear-gradient(135deg,#fef9c3,#fde68a)',   emoji: '🏺' },
  { brand: 'NORDIC HOME',  name: 'Minimalist Wall Art Set',       price: '₱2,499', orig: '₱2,800', disc: 11, bg: 'linear-gradient(135deg,#dbeafe,#bfdbfe)',   emoji: '🖼️' },
  { brand: 'RATTAN CO.',   name: 'Rattan Display Shelf 3-Tier',  price: '₱3,850', orig: '₱4,200', disc:  8, bg: 'linear-gradient(135deg,#f5f0e8,#e8dcc8)',   emoji: '📚' },
  { brand: 'COZY HOME',    name: 'Scented Candle Set of 6',      price: '₱899',   orig: '₱999',   disc: 10, bg: 'linear-gradient(135deg,#fce7f3,#fbcfe8)',   emoji: '🕯️' },
  { brand: 'VINTAGE CO.',  name: 'Macramé Wall Hanging',          price: '₱1,599', orig: '₱1,800', disc: 11, bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',   emoji: '🧶' },
  { brand: 'LIVING LUXE',  name: 'Boho Throw Pillow Set',         price: '₱1,199', orig: '₱1,399', disc: 14, bg: 'linear-gradient(135deg,#fef3c7,#fde68a)',   emoji: '🛋️' },
  { brand: 'NORDIC HOME',  name: 'Bamboo Plant Stand',            price: '₱2,199', orig: '₱2,500', disc: 12, bg: 'linear-gradient(135deg,#d1fae5,#a7f3d0)',   emoji: '🪴' },
  { brand: 'ARTISAN',      name: 'Handwoven Basket Set',          price: '₱1,599', orig: '₱1,800', disc: 11, bg: 'linear-gradient(135deg,#fff7ed,#fed7aa)',   emoji: '🧺' },
];

/* ─── Preview: Live partner store ────────────────────────────── */
function PreviewScreen({ playing }: { playing: boolean }) {
  const [curPos, setCurPos] = useState({ x: -300, y: -300 });
  const [clicking, setClicking] = useState(false);
  const [callout, setCallout] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const [showListing, setShowListing] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const click = (cb: () => void) => { setClicking(true); setTimeout(() => { setClicking(false); cb(); }, 220); };

    // Scroll storefront hero out of view to reveal category grid
    const scrollFrames: [number, () => void][] = Array.from({ length: 20 }, (_, i) => [
      1800 + i * 25,
      () => setScrollY(y => Math.min(y + 8, 160)),
    ] as [number, () => void]);

    const seq: [number, () => void][] = [
      [800,  () => setCallout('Your live partner storefront — exactly what customers see')],
      [2500, () => setCallout('')],
      [2800, () => setCurPos({ x: 270, y: 190 })],
      [3600, () => click(() => { setShowListing(true); setCallout('Click a category to see all its products'); })],
      [4200, () => setCurPos({ x: 590, y: 165 })],
      [6500, () => setCallout('')],
      [8000, () => setCallout('Customers can add to cart and checkout on AF Home')],
      [10500, () => setCallout('')],
    ];

    const allTimers = [...seq, ...scrollFrames].map(([t, fn]) => setTimeout(fn as () => void, t as number));
    return () => allTimers.forEach(clearTimeout);
  }, [playing]);

  const themeColor = '#1d4ed8';
  const accentColor = '#7c3aed';

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
          /* ── Storefront homepage ── */
          <motion.div key="storefront" className="absolute inset-0" exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.35 }}>
            <div style={{ transform: `translateY(-${scrollY}px)`, willChange: 'transform' }}>
              {/* Hero */}
              <div style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${accentColor} 100%)` }}>
                <div className="mx-auto max-w-5xl px-6 py-5">
                  <div className="flex gap-4 rounded-[24px] bg-white/93 p-5 shadow-sm items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="h-20 w-24 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center text-sm font-black text-slate-600">LC</div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Partner Store</p>
                        <h1 className="text-2xl font-bold tracking-tight" style={{ color: themeColor }}>Modern Living, Delivered.</h1>
                        <p className="mt-1 text-sm text-slate-500">Curated home products for every Filipino home.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button className="rounded-full px-5 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: themeColor }}>Login</button>
                      <button className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700">LivingCo Products</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category grid */}
              <div className="mx-auto max-w-5xl px-6 py-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1 text-center" style={{ color: accentColor }}>Shop by Category</p>
                <h2 className="text-xl font-bold text-slate-900 mb-5 text-center">Find Your Perfect Home Product</h2>
                <div className="grid grid-cols-4 gap-3">
                  {(['Home Decor', 'Home Essentials', 'Appliances', 'Home & Living'] as const).map((cat, i) => (
                    <div key={cat} className="relative rounded-2xl overflow-hidden aspect-[4/3] flex flex-col justify-end p-3"
                      style={{ background: `linear-gradient(160deg, ${['#e2e8f0','#dbeafe','#fef9c3','#dcfce7'][i]} 0%, #cbd5e1 100%)` }}>
                      <p className="text-sm font-bold text-slate-800">{cat}</p>
                      <p className="text-[10px] text-slate-500">{[47, 27, 142, 1894][i]} Products</p>
                      <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: accentColor }}>
                        Shop Now <ArrowRight size={8} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Featured products */}
              <div className="mx-auto max-w-5xl px-6 pb-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: accentColor }}>Featured Products</p>
                <h2 className="text-xl font-bold text-slate-900 mb-5">Top Picks This Week</h2>
                <div className="grid grid-cols-4 gap-3">
                  {PREVIEW_PRODUCTS.slice(0, 4).map((p) => (
                    <div key={p.name} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                      <div className="h-28 flex flex-col items-center justify-center gap-1" style={{ background: p.bg }}>
                        <span style={{ fontSize: 36, lineHeight: 1 }}>{p.emoji}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(30,30,80,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>AF HOME</span>
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-semibold text-slate-800 line-clamp-2 mb-1">{p.name}</p>
                        <p className="text-sm font-bold" style={{ color: themeColor }}>{p.price}</p>
                        <button className="mt-2 w-full rounded-lg py-1.5 text-[10px] font-bold text-white" style={{ backgroundColor: accentColor }}>Add to Cart</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 bg-white px-6 py-4">
                <div className="mx-auto max-w-5xl flex items-center justify-between text-xs text-slate-500">
                  <p>Orders from <span className="font-semibold text-slate-800">LivingCo Philippines</span> are still processed through AF Home.</p>
                  <p>Partner notifications: partner@livingco.ph</p>
                </div>
              </div>
            </div>
            <Cursor x={curPos.x} y={curPos.y} clicking={clicking} />
          </motion.div>
        ) : (
          /* ── Product listing page ── */
          <motion.div key="listing" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.38 }}
            className="absolute inset-0 flex flex-col bg-[#f8f9fa]">
            {/* Breadcrumb */}
            <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '7px 20px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
              <span>Home</span><span style={{ color: '#cbd5e1' }}>›</span>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>Home Decor</span>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Filters sidebar */}
              <div style={{ width: 196, borderRight: '1px solid #e2e8f0', background: '#fff', padding: '14px 12px', flexShrink: 0, overflowY: 'auto' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>Filters</p>

                <p style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Shop Category</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                  {['All Category', 'Mobile & Accessories', 'Home Decor', 'Home Essentials', 'Appliances', 'Auto Care & Detailing', 'Home & Living', 'AF Properties'].map(cat => (
                    <div key={cat} style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 10,
                      background: cat === 'Home Decor' ? themeColor : '#f1f5f9',
                      color: cat === 'Home Decor' ? '#fff' : '#64748b',
                      fontWeight: cat === 'Home Decor' ? 600 : 400,
                    }}>{cat}</div>
                  ))}
                </div>

                <p style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Price Range</p>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  {['Min: 0', 'Max: 10000'].map(v => (
                    <div key={v} style={{ flex: 1, background: '#f1f5f9', borderRadius: 8, padding: '4px 8px', fontSize: 10, color: '#64748b' }}>{v}</div>
                  ))}
                </div>
                {['Under ₱1,000', '₱1,000 – ₱5,000', '₱5,000 – ₱10,000', 'Over ₱10,000'].map(r => (
                  <div key={r} style={{ fontSize: 10, color: '#64748b', padding: '3px 6px', marginBottom: 2 }}>{r}</div>
                ))}

                <p style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '10px 0 6px' }}>Sort By Name</p>
                {['Default', 'A to Z', 'Z to A'].map(s => (
                  <div key={s} style={{
                    padding: '4px 10px', borderRadius: 8, fontSize: 10, marginBottom: 3,
                    background: s === 'Default' ? themeColor : 'transparent',
                    color: s === 'Default' ? '#fff' : '#64748b',
                    fontWeight: s === 'Default' ? 600 : 400,
                  }}>{s}</div>
                ))}
              </div>

              {/* Product grid */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ fontSize: 11, color: '#64748b' }}>Showing <strong>16</strong> of <strong>47</strong> products</p>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[true, false].map((active) => (
                      <div key={String(active)} style={{ width: 26, height: 26, borderRadius: 7, background: active ? themeColor : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {active
                          ? <svg width="12" height="12" viewBox="0 0 12 12" fill="white"><rect x="0" y="0" width="5" height="5"/><rect x="7" y="0" width="5" height="5"/><rect x="0" y="7" width="5" height="5"/><rect x="7" y="7" width="5" height="5"/></svg>
                          : <svg width="12" height="12" viewBox="0 0 12 12" fill="#94a3b8"><rect x="0" y="1" width="12" height="2"/><rect x="0" y="5" width="12" height="2"/><rect x="0" y="9" width="12" height="2"/></svg>
                        }
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                  {PREVIEW_PRODUCTS.map((p, idx) => (
                    <motion.div key={p.name}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}
                    >
                      <div style={{ position: 'relative', height: 96, background: p.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                        <div style={{ position: 'absolute', top: 6, left: 6, background: '#ef4444', color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 10 }}>
                          Enjoy {p.disc}% off
                        </div>
                        <span style={{ fontSize: 30, lineHeight: 1 }}>{p.emoji}</span>
                        <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(30,30,80,0.28)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>AF HOME</span>
                      </div>
                      <div style={{ padding: '8px 9px' }}>
                        <p style={{ fontSize: 8, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 2, textTransform: 'uppercase' }}>{p.brand}</p>
                        <p style={{ fontSize: 10, fontWeight: 600, color: '#1e293b', lineHeight: 1.3, marginBottom: 5 }}>{p.name}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: themeColor }}>{p.price}</span>
                          <span style={{ fontSize: 9, color: '#94a3b8', textDecoration: 'line-through' }}>{p.orig}</span>
                        </div>
                        <div style={{ background: accentColor, borderRadius: 7, padding: '4px 0', textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>
                          Add to Cart
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            <Cursor x={curPos.x} y={curPos.y} clicking={clicking} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Scale constants ────────────────────────────────────────── */
const BEZEL_W = 1308; // 1280 screen + 14px padding × 2
const BEZEL_H = 734;  // 14px top padding + 720px screen (controls are outside the scale)

/* ─── Main ───────────────────────────────────────────────────── */
export default function StorefrontTutorial() {
  const [step, setStep] = useState<Step>('intro');
  const [playing, setPlaying] = useState(true);
  const [stepRestartKey, setStepRestartKey] = useState(0);
  const [urlBar, setUrlBar] = useState('admin.afhome.ph/partner-storefronts');
  const [scale, setScale] = useState(1);
  const [viewportWidth, setViewportWidth] = useState(BEZEL_W + 16);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const isDragging = useRef(false);
  const justSeeked = useRef(false);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepIdx = STEPS.indexOf(step);

  const goTo = (s: Step) => { if (timer.current) clearTimeout(timer.current); setStep(s); };

  const handleTogglePlay = () => {
    if (!playing) {
      // Resuming: remount step component so animations restart cleanly.
      // Elapsed is intentionally NOT reset — scrubber stays at the pause position.
      setStepRestartKey(k => k + 1);
    }
    setPlaying(p => !p);
  };
  const togglePlayRef = useRef(handleTogglePlay);
  togglePlayRef.current = handleTogglePlay;

  const handleSaved = useCallback(() => {
    setUrlBar('afhome.ph/shop/livingco');
    setTimeout(() => {
      if (timer.current) clearTimeout(timer.current);
      setStep('preview');
    }, 400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // stable ref — setUrlBar/setStep are stable, timer is a ref

  useEffect(() => {
    if (step !== 'preview') setUrlBar('admin.afhome.ph/partner-storefronts');
  }, [step]);

  useEffect(() => {
    if (!playing) return;
    if (step === 'step5') return; // step5 advances via onSaved
    timer.current = setTimeout(() => {
      const next = STEPS[stepIdx + 1];
      if (next) setStep(next);
    }, DURATIONS[step]);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [step, stepIdx, playing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); togglePlayRef.current(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const update = () => {
      setViewportWidth(window.innerWidth);
      const sw = (window.innerWidth - 24) / BEZEL_W;
      const sh = (window.innerHeight - 24 - 68) / BEZEL_H; // 68px reserved for controls bar
      setScale(Math.min(1, sw, sh));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      try { await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape'); } catch { /* desktop ignores */ }
    } else {
      await document.exitFullscreen();
      try { screen.orientation.unlock(); } catch { /* ignore */ }
    }
  };

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
    const clamped = Math.max(0, Math.min(ms, TOTAL_DURATION - 1));
    let acc = 0;
    for (const s of SCRUB_STEPS) {
      if (clamped < acc + DURATIONS[s]) {
        justSeeked.current = true;
        elapsedRef.current = clamped;
        setElapsed(clamped);
        goTo(s);
        setPlaying(true);
        return;
      }
      acc += DURATIONS[s];
    }
  };

  const handleScrubInteract = (clientX: number) => {
    if (!scrubberRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    seekToMs(frac * TOTAL_DURATION);
  };

  const handleScrubMouseDown = (_e: React.MouseEvent) => {
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

  return (
    <div ref={containerRef} style={{
      minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 30%, #2a2a2a 0%, #0f0f0f 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', padding: '12px 0',
    }}>
      {/* Scale wrapper — only wraps the bezel, controls are outside */}
      <div style={{ position: 'relative', width: BEZEL_W * scale, height: BEZEL_H * scale, flexShrink: 0 }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: BEZEL_W,
          transform: `scale(${scale})`, transformOrigin: 'top left',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
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
                <motion.div key={urlBar}
                  initial={{ opacity: 0.6 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 bg-[#f0f0f0] rounded-lg px-3 h-7 border border-[#d0d0d0]" style={{ width: 480 }}>
                  <svg width="10" height="11" viewBox="0 0 12 14" fill="none" className="shrink-0">
                    <path d="M6 0C3.24 0 1 2.24 1 5c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5z" fill="#10b981"/>
                  </svg>
                  <span className="text-[11.5px] text-[#444] flex-1 text-center" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                    {urlBar}
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

        </div>{/* end screen viewport */}
      </div>{/* end MacBook bezel */}

        </div>{/* end scale content */}
      </div>{/* end scale wrapper */}

      {/* ── Controls bar — native size, NOT inside scale transform ── */}
      <div style={{ width: Math.min(BEZEL_W * scale, viewportWidth - 16), flexShrink: 0, padding: '0 4px', boxSizing: 'border-box' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(16px)',
          borderRadius: 16, padding: '8px 12px',
        }}>

          {/* Play / Pause — 44px touch target */}
          <button
            onClick={handleTogglePlay}
            style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.13)', color: '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
          >
            {playing ? <Pause size={17} /> : <Play size={17} />}
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
            {SCRUB_STEPS.slice(1).map(s => {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            {SCRUB_STEPS.map(s => {
              const active = step === s;
              const passed = (elapsed >= (STEP_STARTS[s] ?? 0)) && !active;
              return (
                <button key={s} onClick={() => goTo(s)} title={SCRUB_LABELS[s] ?? s}
                  style={{
                    width: active ? 22 : 8, height: 8, borderRadius: 4,
                    background: active ? '#10b981' : passed ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.18)',
                    border: 'none', cursor: 'pointer', padding: 0,
                    transition: 'width 0.3s',
                  }} />
              );
            })}
          </div>

          {/* Fullscreen — 44px touch target */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.7)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
          >
            {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
        </div>
      </div>

    </div>
  );
}
