'use client';

import { useState, useEffect, useRef, useId, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Users, Award, Zap, Gift, Star, BarChart3,
  BookOpen, Download, Search, ChevronDown, X, Menu, Copy, Check,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
type NavSub = { id: string; label: string };
type NavItem = {
  id: string; label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  sub?: NavSub[];
};

// ── Nav Config ─────────────────────────────────────────────────────────────────
const NAV: NavItem[] = [
  {
    id: 'pv', label: 'Performance Value (PV)', icon: TrendingUp,
    sub: [
      { id: 'pv-intro', label: 'What Is PV' },
      { id: 'pv-distribution', label: 'How PV Is Distributed' },
    ],
  },
  {
    id: 'activation', label: 'Monthly Activation', icon: Zap,
    sub: [
      { id: 'activation-windows', label: 'Activation Windows' },
      { id: 'activation-effects', label: 'What Activation Affects' },
    ],
  },
  {
    id: 'ranks', label: 'Member Ranks & Tiers', icon: Award,
    sub: [
      { id: 'ranks-requirements', label: 'Tier Requirements' },
      { id: 'ranks-unilevel', label: 'Rank & Unilevel Depth' },
    ],
  },
  {
    id: 'referral', label: 'Direct Referral Commission', icon: Users,
    sub: [
      { id: 'referral-how', label: 'How It Works' },
      { id: 'referral-rules', label: 'Rules' },
    ],
  },
  {
    id: 'unilevel', label: 'Group Purchase Bonus', icon: BarChart3,
    sub: [
      { id: 'unilevel-rate', label: 'The Rate' },
      { id: 'unilevel-compression', label: 'Compression (Skipping)' },
    ],
  },
  {
    id: 'affiliate', label: 'Affiliate Performance Bonus', icon: Star,
    sub: [
      { id: 'affiliate-how', label: 'How It Works' },
      { id: 'affiliate-milestones', label: 'Milestone Table' },
    ],
  },
  { id: 'cashback', label: 'Personal Cashback (e-GC)', icon: Gift },
  { id: 'global', label: 'Yearly Global Bonus', icon: TrendingUp },
  { id: 'rules', label: 'Key Business Rules', icon: BookOpen },
  {
    id: 'diagrams', label: 'Flow Diagrams', icon: BarChart3,
    sub: [
      { id: 'diagram-order', label: 'Order → Bonus Distribution' },
      { id: 'diagram-activation', label: 'Monthly Activation Flow' },
      { id: 'diagram-rank', label: 'Rank Determination' },
    ],
  },
];

// ── Mermaid diagram strings ────────────────────────────────────────────────────
const D = {
  orderBonus: `flowchart TD
  Order([Member Places Order]) --> Delivered{Order Successfully\nDelivered?}
  Delivered -->|No — Cancelled / Pending| NoEarn[No PV Earned\nNo Bonus Distributed]
  Delivered -->|Yes| PV[PV Credited to Member]
  PV --> C1["4% → Personal e-GC Cashback\nAutomatically issued · Valid 60 days\nAll members · No activation needed"]
  PV --> C2["6% → Group Purchase Bonus\nDistributed to up to 10 active uplines\n0.6% per active level · Inactive = skipped"]
  PV --> C3["2.9% → Affiliate Performance Meter\nAdded to sponsor's cumulative total\nEvery 50,000 PV = ₱5,000 bonus\nSponsor must be active that month"]
  PV --> C4["1% → Yearly Global Bonus Pool\nAll members contribute annually\nTop 10 earners split at year-end"]`,

  activation: `flowchart TD
  Start([New Month Begins]) --> Window{Is today\nDays 1 – 7?}
  Window -->|Yes — Early Window| Early[Need 100 PV\nthis month]
  Window -->|No — Late Window| Late[Need 200 PV\ntotal this month]
  Early --> Check{PV target\nreached?}
  Late --> Check
  Check -->|Yes| Active([ACTIVE this month])
  Check -->|No| Inactive([INACTIVE this month])
  Active --> Earn[Receives Unilevel bonuses\nReceives Affiliate Performance\nBonus when milestone is hit]
  Inactive --> Skip[Skipped in upline chain\nBonuses pass to next\nactive upline above]`,

  rankDetermination: `flowchart TD
  Update([Member PV is Updated]) --> Sys[System checks ALL rank criteria\nsimultaneously]
  Sys --> P{"Personal PV\nsufficient?"}
  Sys --> D{"Enough direct\nmembers?"}
  Sys --> G{"Group PV\nof full network?"}
  Sys --> Q{"Qualifying\ndirects met?"}
  P & D & G & Q --> All{All criteria\nmet together?}
  All -->|Yes| Promote[Assigned highest\nqualifying rank]
  All -->|No| Stay[Stays at current\nor lower rank]
  Promote --> Profile[Rank recorded on\nmember profile]
  Profile --> Note[Rank is for tier promotion only —\nall active members earn from\nall 10 unilevel levels]`,
};

// ── Lightbox (viewBox-based zoom — always crisp) ──────────────────────────────
type VB = { x: number; y: number; w: number; h: number };

function DiagramLightbox({ svg, onClose }: { svg: string; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const origVB = useMemo<VB>(() => {
    const m = svg.match(/viewBox="([\d\s.-]+)"/);
    if (m) {
      const [x, y, w, h] = m[1].trim().split(/\s+/).map(Number);
      return { x, y, w, h };
    }
    const wm = svg.match(/\bwidth="([\d.]+)"/);
    const hm = svg.match(/\bheight="([\d.]+)"/);
    return { x: 0, y: 0, w: wm ? +wm[1] : 800, h: hm ? +hm[1] : 600 };
  }, [svg]);

  const [vb, setVb] = useState<VB>(() => origVB);
  const vbRef = useRef<VB>(origVB);
  useEffect(() => { vbRef.current = vb; }, [vb]);

  const scale = origVB.w / vb.w;

  const displaySvg = useMemo(() => {
    let s = svg;
    s = s.replace(/(<svg\b[^>]*?)\s+width="[^"]*"/i, '$1');
    s = s.replace(/(<svg\b[^>]*?)\s+height="[^"]*"/i, '$1');
    s = s.replace(/style="([^"]*?)max-width:[^;";]*(;?)([^"]*)"/gi, 'style="$1$3"');
    s = s.replace('<svg', '<svg width="100%" height="100%" style="display:block"');
    s = s.includes('viewBox=')
      ? s.replace(/viewBox="[^"]*"/, `viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}"`)
      : s.replace('<svg', `<svg viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}"`);
    return s;
  }, [svg, vb]);

  const screenToSvg = useCallback((sx: number, sy: number, cv: VB) => {
    const el = containerRef.current;
    if (!el) return { x: cv.x + cv.w / 2, y: cv.y + cv.h / 2 };
    const r = el.getBoundingClientRect();
    return { x: cv.x + ((sx - r.left) / r.width) * cv.w, y: cv.y + ((sy - r.top) / r.height) * cv.h };
  }, []);

  const zoomAt = useCallback((factor: number, px?: number, py?: number) => {
    setVb(prev => {
      const cx = px ?? prev.x + prev.w / 2;
      const cy = py ?? prev.y + prev.h / 2;
      const nw = Math.min(Math.max(prev.w * factor, origVB.w * 0.08), origVB.w * 6);
      const nh = prev.h * (nw / prev.w);
      return { x: cx - (cx - prev.x) * (nw / prev.w), y: cy - (cy - prev.y) * (nh / prev.h), w: nw, h: nh };
    });
  }, [origVB]);

  const clampPan = useCallback((v: VB): VB => {
    const s = 0.8;
    return {
      ...v,
      x: Math.max(origVB.x - v.w * s, Math.min(origVB.x + origVB.w - v.w * (1 - s), v.x)),
      y: Math.max(origVB.y - v.h * s, Math.min(origVB.y + origVB.h - v.h * (1 - s), v.y)),
    };
  }, [origVB]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const h = (e: WheelEvent) => {
      e.preventDefault();
      const pivot = screenToSvg(e.clientX, e.clientY, vbRef.current);
      zoomAt(e.deltaY < 0 ? 0.88 : 1.14, pivot.x, pivot.y);
    };
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
  }, [screenToSvg, zoomAt]);

  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const onMouseDown = (e: React.MouseEvent) => { dragging.current = true; setIsDragging(true); lastMouse.current = { x: e.clientX, y: e.clientY }; };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const el = containerRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = ((e.clientX - lastMouse.current.x) / r.width) * vbRef.current.w;
    const dy = ((e.clientY - lastMouse.current.y) / r.height) * vbRef.current.h;
    setVb(prev => clampPan({ ...prev, x: prev.x - dx, y: prev.y - dy }));
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseUp = () => { dragging.current = false; setIsDragging(false); };

  const lastTouches = useRef<{ x: number; y: number; dist?: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) lastTouches.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouches.current = { x: 0, y: 0, dist: Math.hypot(dx, dy) };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); if (!lastTouches.current) return;
    const el = containerRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    if (e.touches.length === 1) {
      const dx = ((e.touches[0].clientX - lastTouches.current.x) / r.width) * vbRef.current.w;
      const dy = ((e.touches[0].clientY - lastTouches.current.y) / r.height) * vbRef.current.h;
      setVb(prev => clampPan({ ...prev, x: prev.x - dx, y: prev.y - dy }));
      lastTouches.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && lastTouches.current.dist != null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      zoomAt(lastTouches.current.dist / dist);
      lastTouches.current = { ...lastTouches.current, dist };
    }
  };

  const reset = () => setVb(origVB);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-5 py-3 bg-[#1a1205] border-b border-[#3d2e0a] shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#a07830] font-mono">{Math.round(scale * 100)}% · scroll to zoom · drag to pan</span>
          <div className="flex items-center gap-1">
            <button onClick={() => zoomAt(0.83)} className="px-2 py-1 rounded text-xs text-[#a07830] hover:text-white hover:bg-[#2a1f05] transition-colors font-mono">+</button>
            <button onClick={() => zoomAt(1.2)} className="px-2 py-1 rounded text-xs text-[#a07830] hover:text-white hover:bg-[#2a1f05] transition-colors font-mono">−</button>
            <button onClick={reset} className="px-2 py-1 rounded text-xs text-[#a07830] hover:text-white hover:bg-[#2a1f05] transition-colors">Reset</button>
          </div>
        </div>
        <button onClick={onClose} className="flex items-center gap-1.5 text-xs text-[#a07830] hover:text-white transition-colors px-2 py-1 rounded hover:bg-[#2a1f05]">
          <X size={14} />Close
        </button>
      </div>
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden select-none bg-[#0d0a04]"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={() => { lastTouches.current = null; }}
        onDoubleClick={reset}
        dangerouslySetInnerHTML={{ __html: displaySvg }}
      />
      <div className="px-5 py-2 bg-[#1a1205] border-t border-[#3d2e0a] text-center text-[11px] text-[#a07830] shrink-0">
        Double-click to reset · Pinch to zoom on mobile · Press Esc to close
      </div>
    </div>
  );
}

// ── Mermaid Diagram ────────────────────────────────────────────────────────────
function MermaidDiagram({ code }: { code: string }) {
  const [svg, setSvg] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const uid = useId().replace(/:/g, '');

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setSvg('');
    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        fontFamily: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
        fontSize: 13,
        flowchart: { curve: 'basis', useMaxWidth: true, padding: 20 },
        themeVariables: {
          primaryColor: '#5c3d0a',
          primaryTextColor: '#fef3c7',
          primaryBorderColor: '#b8952a',
          lineColor: '#6b5a2e',
          secondaryColor: '#1c1505',
          tertiaryColor: '#0d0a04',
          background: '#0d0a04',
          mainBkg: '#1a1205',
          nodeBorder: '#3d2e0a',
          clusterBkg: '#1c1505',
          titleColor: '#fef3c7',
          edgeLabelBackground: '#1a1205',
        },
      });
      mermaid.render(`mmd-${uid}`, code)
        .then(({ svg: rendered }) => { if (!cancelled) { setSvg(rendered); setLoading(false); } })
        .catch(() => { if (!cancelled) setLoading(false); });
    });
    return () => { cancelled = true; };
  }, [code, uid]);

  return (
    <>
      {open && svg && <DiagramLightbox svg={svg} onClose={() => setOpen(false)} />}
      <div
        className="my-6 rounded-xl overflow-hidden border border-[#3d2e0a] bg-[#0d0a04] group cursor-zoom-in"
        onClick={() => !loading && svg && setOpen(true)}
        title="Click to expand"
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#3d2e0a] bg-[#1a1205]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f85149]/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#3fb950]/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#d29922]/80" />
            <span className="ml-2 text-[11px] text-[#a07830] font-mono tracking-wide">diagram</span>
          </div>
          {!loading && svg && (
            <span className="text-[10px] text-[#a07830] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
              Click to expand
            </span>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-[#a07830] text-sm">
            <div className="w-4 h-4 border-2 border-[#3d2e0a] border-t-[#b8952a] rounded-full animate-spin" />
            Rendering diagram…
          </div>
        ) : (
          <div className="p-5 overflow-hidden [&_svg]:max-w-full [&_svg]:h-auto pointer-events-none" dangerouslySetInnerHTML={{ __html: svg }} />
        )}
      </div>
    </>
  );
}

// ── Helper Components ──────────────────────────────────────────────────────────
function Badge({ label, color = 'amber' }: { label: string; color?: 'amber' | 'green' | 'blue' | 'red' | 'gray' }) {
  const map = { amber: 'bg-amber-100 text-amber-800', green: 'bg-emerald-100 text-emerald-700', blue: 'bg-blue-100 text-blue-700', red: 'bg-red-100 text-red-700', gray: 'bg-gray-100 text-gray-600' };
  return <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${map[color]}`}>{label}</span>;
}

function Note({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'warning' | 'tip' }) {
  const map = { info: 'border-amber-400 bg-amber-50 text-amber-900', warning: 'border-orange-400 bg-orange-50 text-orange-900', tip: 'border-emerald-400 bg-emerald-50 text-emerald-900' };
  const icon = { info: '💡', warning: '⚠️', tip: '✅' };
  return (
    <div className={`flex gap-3 border-l-[3px] ${map[type]} rounded-r-lg px-4 py-3 mb-5 text-sm`}>
      <span className="shrink-0 mt-0.5">{icon[type]}</span>
      <div>{children}</div>
    </div>
  );
}

function InfoTable({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-amber-200 mb-6 text-sm">
      <table className="w-full">
        <thead>
          <tr className="bg-[#b8952a]">
            {headers.map((h, i) => <th key={i} className="px-4 py-3 text-left text-white font-semibold text-xs uppercase tracking-wider">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-amber-100">
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-amber-50/40'}>
              {row.map((cell, j) => <td key={j} className="px-4 py-3 text-gray-700">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionHeading({ id, children }: { id?: string; children: React.ReactNode }) {
  return <h2 id={id} className="text-2xl font-bold text-gray-900 mt-2 mb-3 scroll-mt-24">{children}</h2>;
}

function SubHeading({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="flex items-center gap-2 text-lg font-semibold text-gray-800 mt-10 mb-3 scroll-mt-24">
      <span className="block w-1 h-5 rounded-full bg-[#b8952a] shrink-0" />
      {children}
    </h3>
  );
}

function Divider() { return <hr className="border-amber-100 my-10" />; }

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">{children}</span>;
}

function SectionTag({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-3 text-amber-800 bg-amber-100">
      {icon}{children}
    </div>
  );
}

function FormulaBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 mb-5 font-mono text-sm text-amber-900 whitespace-pre leading-relaxed">
      {children}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function CommissionDocs() {
  const [activeSection, setActiveSection] = useState('pv');
  const [activeId, setActiveId] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ pv: true });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length) {
          const id = visible[0].target.id;
          setActiveId(id);
          const parent = NAV.find(n => n.sub?.some(s => s.id === id) || n.id === id);
          if (parent) setActiveSection(parent.id);
        }
      },
      { rootMargin: '-15% 0% -75% 0%', threshold: 0 }
    );
    document.querySelectorAll('[data-section]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const toggleSection = (id: string) => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileOpen(false);
  }, []);

  const filteredNav = search
    ? NAV.map(item => ({ ...item, sub: item.sub?.filter(s => s.label.toLowerCase().includes(search.toLowerCase())) }))
        .filter(item => item.label.toLowerCase().includes(search.toLowerCase()) || (item.sub && item.sub.length > 0))
    : NAV;

  const SidebarContent = (
    <nav className="h-full flex flex-col bg-white border-r border-amber-100">
      <div className="px-5 py-5 border-b border-amber-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#b8952a] flex items-center justify-center shrink-0">
            <TrendingUp size={14} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 leading-tight">AF Home</div>
            <div className="text-[10px] text-amber-600 uppercase tracking-widest">Commission System</div>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 border-b border-amber-100">
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <Search size={13} className="text-amber-400 shrink-0" />
          <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-xs text-gray-700 placeholder-amber-300 outline-none" />
          {search && <button onClick={() => setSearch('')}><X size={12} className="text-amber-400 hover:text-amber-600" /></button>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2">
        {filteredNav.map(item => {
          const Icon = item.icon;
          const isOpen = !!openSections[item.id];
          const hasSubs = item.sub && item.sub.length > 0;
          const isActive = activeSection === item.id;
          return (
            <div key={item.id} className="mb-0.5">
              <button
                onClick={() => { toggleSection(item.id); scrollTo(item.id); setActiveSection(item.id); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${isActive ? 'bg-amber-50 text-amber-800 font-semibold' : 'text-gray-600 hover:bg-amber-50/60 hover:text-gray-900'}`}
              >
                <Icon size={15} className="shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {hasSubs && <ChevronDown size={13} className={`transition-transform text-amber-400 ${isOpen ? 'rotate-180' : ''}`} />}
              </button>
              {hasSubs && isOpen && (
                <div className="ml-7 mt-0.5 space-y-0.5">
                  {item.sub!.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => { scrollTo(sub.id); setActiveSection(item.id); }}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-all ${activeId === sub.id ? 'text-amber-800 font-semibold bg-amber-50' : 'text-gray-500 hover:text-gray-800 hover:bg-amber-50/60'}`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-amber-100">
        <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-800 py-2 rounded-lg hover:bg-amber-50 transition-colors">
          <Download size={13} />Export as PDF
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <div className="hidden lg:block w-64 shrink-0 h-full">{SidebarContent}</div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed left-0 top-0 bottom-0 z-50 w-72 lg:hidden">
              {SidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 h-full overflow-y-auto">
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-amber-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="text-amber-600"><Menu size={20} /></button>
          <span className="text-sm font-semibold text-gray-800">Commission System Docs</span>
        </div>

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#b8952a] via-[#9a7a22] to-[#7a6018] text-white px-6 py-10">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 text-amber-200 text-xs font-semibold uppercase tracking-widest mb-3">
              <TrendingUp size={13} />Apsara Home — Business Rules
            </div>
            <h1 className="text-3xl font-bold mb-2">Commission & Bonus System</h1>
            <p className="text-amber-100 text-[15px] leading-relaxed max-w-xl">
              Complete guide to how earnings work — from Performance Value (PV) to all bonus types. For business stakeholders, administrators, and team members.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              {['PV-based', 'Network Earning', 'Activation-gated', 'Compression', 'Milestone Bonuses'].map(tag => (
                <span key={tag} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/15 text-amber-100">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-10 pb-24 space-y-0">

          {/* ── PV ───────────────────────────────────────────── */}
          <section id="pv" data-section>
            <SectionTag icon={<TrendingUp size={11} />}>Performance Value</SectionTag>
            <SectionHeading>Performance Value (PV)</SectionHeading>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-5">
              <strong>Performance Value (PV)</strong> is the core unit used to measure a member's purchasing activity. Each product carries a set PV value. PV is only credited <strong>after an order has been delivered</strong> — never on payment alone.
            </p>
            <Note type="info">PV is only earned on delivery. This prevents PV from being granted for orders that are cancelled, returned, or never received.</Note>
          </section>

          <section id="pv-intro" data-section className="pt-2">
            <SubHeading id="pv-intro">How PV Is Calculated</SubHeading>
            <FormulaBlock>{`Order PV = PV value per product × quantity ordered
           (summed for all items in the order)`}</FormulaBlock>
            <InfoTable
              headers={['Product', 'PV per Unit', 'Qty', 'PV Earned']}
              rows={[
                ['Product A', '100 PV', '2 pcs', '200 PV'],
                ['Product B', '50 PV', '1 pc', '50 PV'],
                ['', '', <strong key="t">Total</strong>, <strong key="v">250 PV</strong>],
              ]}
            />
          </section>

          <section id="pv-distribution" data-section className="pt-2">
            <SubHeading id="pv-distribution">How PV Is Distributed</SubHeading>
            <p className="text-sm text-gray-600 mb-4">Every time a member earns PV, that PV is automatically split across different bonus pools. The full 100% is always accounted for.</p>
            <InfoTable
              headers={['Bonus Pool', 'Allocation', 'What It Funds']}
              rows={[
                [<span key="a" className="font-semibold text-amber-700">Personal Cashback</span>, <Badge label="4%" />, 'e-GC (gift certificate) given back to the buyer'],
                [<span key="b" className="font-semibold text-amber-700">Group Purchase Bonus</span>, <Badge label="6%" />, 'Distributed to up to 10 levels of uplines'],
                [<span key="c" className="font-semibold text-amber-700">Affiliate Performance</span>, <Badge label="2.9%" />, "Funds milestone bonuses for the buyer's direct sponsor"],
                [<span key="d" className="font-semibold text-amber-700">Yearly Global Bonus</span>, <Badge label="1%" />, 'Year-end reward for top PV earners'],
                [<span key="e" className="font-semibold text-amber-700">Product Purchase Points</span>, <Badge label="86.1%" color="gray" />, 'Points credited to the buyer'],
              ]}
            />
            <Note type="tip">The full 100% of PV is always accounted for — nothing is lost or unallocated.</Note>
          </section>

          <Divider />

          {/* ── Activation ──────────────────────────────────── */}
          <section id="activation" data-section>
            <SectionTag icon={<Zap size={11} />}>Monthly Activation</SectionTag>
            <SectionHeading>Monthly Activation</SectionHeading>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-5">
              Activation is a monthly status that determines whether a member can <strong>receive</strong> unilevel and affiliate performance bonuses from their network. It does <strong>not</strong> affect a member's own cashback or direct referral commission.
            </p>
          </section>

          <section id="activation-windows" data-section className="pt-2">
            <SubHeading id="activation-windows">Activation Windows</SubHeading>
            <InfoTable
              headers={['Window', 'When', 'PV Required']}
              rows={[
                [<span key="e" className="font-semibold text-emerald-700">Early Window</span>, 'Days 1–7 of the month', '100 PV'],
                [<span key="l" className="font-semibold text-orange-700">Late Window</span>, 'Days 8 onwards', '200 PV (total for the month)'],
              ]}
            />
            <Note type="info">Purchasing early requires <strong>less PV (100 PV)</strong> to stay active. Purchasing late requires <strong>more effort (200 PV total)</strong> to qualify.</Note>
          </section>

          <section id="activation-effects" data-section className="pt-2">
            <SubHeading id="activation-effects">What Activation Affects</SubHeading>
            <InfoTable
              headers={['Bonus', 'Activated Member', 'Inactive Member']}
              rows={[
                ['Unilevel (Group Purchase Bonus)', <Badge key="a" label="Receives their share" color="green" />, <Badge key="b" label="Skipped — bonus passes up" color="gray" />],
                ['Affiliate Performance Bonus', <Badge key="c" label="Eligible on milestone" color="green" />, <Badge key="d" label="Does not receive" color="gray" />],
                ['Personal Cashback (e-GC)', <Badge key="e" label="Always received" color="green" />, <Badge key="f" label="Always received" color="green" />],
                ['Direct Referral Commission', <Badge key="g" label="Always received" color="green" />, <Badge key="h" label="Always received" color="green" />],
              ]}
            />
            <Note type="warning">If a member is inactive, they are "invisible" in the unilevel chain that month. Their downline's PV still flows upward, but the bonus goes to the next active person above them.</Note>
          </section>

          <Divider />

          {/* ── Ranks ───────────────────────────────────────── */}
          <section id="ranks" data-section>
            <SectionTag icon={<Award size={11} />}>Member Ranks</SectionTag>
            <SectionHeading>Member Rank / Tier System</SectionHeading>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-5">
              Members progress through 5 tiers based on performance. Rank reflects network leadership — it does <strong>not</strong> restrict unilevel access. <strong>All criteria must be met at the same time</strong> to hold a rank.
            </p>
          </section>

          <section id="ranks-requirements" data-section className="pt-2">
            <SubHeading id="ranks-requirements">Tier Requirements</SubHeading>
            <InfoTable
              headers={['Rank', 'Title', 'Personal PV', 'Directs', 'Group PV', 'Additional']}
              rows={[
                ['1', 'Home Starter', '—', '—', '—', 'Default rank (no requirements)'],
                ['2', <span key="hb" className="font-semibold">Home Builder</span>, '300', '2', '—', '—'],
                ['3', <span key="hs" className="font-semibold text-amber-700">Home Stylist</span>, '1,000', '5', '—', '2 active directs (≥300 PV each)'],
                ['4', <span key="lc" className="font-semibold text-amber-700">Lifestyle Consultant</span>, '3,000', '10', '10,000', '5 direct Home Builders or higher'],
                ['5', <span key="le" className="font-bold text-amber-800">Lifestyle Elite</span>, '8,000', '20', '30,000', '10 direct Home Stylists or higher'],
              ]}
            />
            <InfoTable
              headers={['Term', 'Definition']}
              rows={[
                ['Personal PV', "PV from the member's own purchases only — not from their downline"],
                ['Directs', 'Members the person personally sponsored/referred'],
                ['Group PV', "Total PV of the member's entire network (all levels, all downlines combined)"],
                ['Active Directs', 'Direct members who have at least 300 PV themselves'],
              ]}
            />
          </section>

          <section id="ranks-unilevel" data-section className="pt-2">
            <SubHeading id="ranks-unilevel">Rank & Unilevel</SubHeading>
            <p className="text-sm text-gray-600 mb-4">
              Rank reflects network leadership and tier progression — it does <strong>not</strong> restrict unilevel access.
              As long as a member is <strong>monthly-active</strong> and has at least one direct downline with a delivered order,
              they receive unilevel bonuses regardless of rank.
            </p>
            <Note type="tip">Rank is used for tier promotion requirements (Personal PV, directs count, Group PV) — not as a gate for unilevel earnings.</Note>
          </section>

          <Divider />

          {/* ── Referral ─────────────────────────────────────── */}
          <section id="referral" data-section>
            <SectionTag icon={<Users size={11} />}>Direct Referral</SectionTag>
            <SectionHeading>Direct Referral Commission</SectionHeading>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-5">
              When a <strong>new member makes their first SRP purchase</strong> through a member's referral link, that member earns a <strong>Direct Referral Commission</strong> — on the first purchase only.
            </p>
          </section>

          <section id="referral-how" data-section className="pt-2">
            <SubHeading id="referral-how">How It Works</SubHeading>
            <p className="text-sm text-gray-600 mb-4">
              The commission is computed from the product's commission-eligible amount and split equally between cash and e-GC.
              Both portions are held pending on payment and released once the order is delivered.
            </p>
            <InfoTable
              headers={['Portion', 'Wallet', 'Amount']}
              rows={[
                [<span key="c" className="font-semibold text-amber-700">Cash</span>, 'Cash Wallet', '50% of commission'],
                [<span key="e" className="font-semibold text-emerald-700">e-GC</span>, 'Gift Certificate Wallet', '50% of commission'],
              ]}
            />
            <FormulaBlock>{`Order Paid     → Commission held (Pending) — 50% cash + 50% e-GC
        ↓
Order Delivered → Both portions released (Available)`}</FormulaBlock>
          </section>

          <section id="referral-rules" data-section className="pt-2">
            <SubHeading id="referral-rules">Rules</SubHeading>
            <InfoTable
              headers={['Rule', 'Detail']}
              rows={[
                ['First purchase only', 'Only the referred member\'s very first order triggers this bonus — repeat orders do not'],
                ['Self-referral not allowed', 'A member cannot earn commission from their own purchases'],
                ['No activation required', 'This bonus is always earned as long as the first order completes — activation status does not matter'],
                ['Cancelled orders', 'Pending commission is cancelled if the order is cancelled'],
              ]}
            />
          </section>

          <Divider />

          {/* ── Unilevel ─────────────────────────────────────── */}
          <section id="unilevel" data-section>
            <SectionTag icon={<BarChart3 size={11} />}>Group Purchase Bonus</SectionTag>
            <SectionHeading>Unilevel — Group Purchase Bonus</SectionHeading>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-5">
              The <strong>Group Purchase Bonus</strong> is the main network earning. Every time any member in a person's network receives a delivered order, that purchase generates a bonus that flows <strong>upward</strong> through the sponsor chain.
            </p>
          </section>

          <section id="unilevel-rate" data-section className="pt-2">
            <SubHeading id="unilevel-rate">The Rate</SubHeading>
            <InfoTable
              headers={['Metric', 'Value']}
              rows={[
                ['Total pool per order', '6% of the order\'s PV value'],
                ['Split across', 'Up to 10 active uplines in the chain'],
                ['Per active upline', '0.6% per level'],
              ]}
            />
            <Note type="tip">
              Levels are counted <strong>from the buyer upward</strong> — Level 1 is the buyer&apos;s direct sponsor, Level 2 is the sponsor&apos;s sponsor, and so on up the chain. The deeper you are above a buyer, the higher your level number.
            </Note>
            <p className="text-sm text-gray-600 mb-3 font-medium mt-4">Example — Buyer&apos;s order worth 1,000 PV (levels counted from buyer upward):</p>
            <InfoTable
              headers={['Level (from buyer)', 'Who Earns', 'Bonus (0.6%)']}
              rows={[
                ['Level 1', 'Direct sponsor of the buyer', '₱6.00'],
                ['Level 2', "Sponsor's sponsor", '₱6.00'],
                ['Level 3', 'One level further up', '₱6.00'],
                ['Levels 4–10', 'Each upline continuing up the chain', '₱6.00 each'],
                [<strong key="t">Total</strong>, '', <strong key="v">₱60.00 (6% of ₱1,000)</strong>],
              ]}
            />
            <Note type="info">All monthly-active members receive unilevel bonuses regardless of rank — as long as they have at least one direct downline with a delivered order.</Note>
          </section>

          <section id="unilevel-compression" data-section className="pt-2">
            <SubHeading id="unilevel-compression">Compression — Skipping Inactive Uplines</SubHeading>
            <p className="text-sm text-gray-600 mb-4">If an upline is <strong>inactive</strong> for that month, they are skipped and the next <strong>active</strong> upline takes their position. The total of 10 paid positions is maintained.</p>
            <FormulaBlock>{`Buyer → Sponsor A (inactive, SKIPPED) → Sponsor B (active → earns Level 1 share) → ...`}</FormulaBlock>
            <Note type="warning">Inactive members are skipped — not permanently removed. They return to their position next month if they reactivate.</Note>
          </section>

          <Divider />

          {/* ── Affiliate ─────────────────────────────────────── */}
          <section id="affiliate" data-section>
            <SectionTag icon={<Star size={11} />}>Affiliate Performance</SectionTag>
            <SectionHeading>Direct Affiliate Performance Bonus</SectionHeading>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-5">
              A <strong>milestone-based bonus</strong> rewarding sponsors when the combined PV of their directly referred members reaches certain thresholds. The sponsor must be <strong>active</strong> in the month the milestone is crossed.
            </p>
          </section>

          <section id="affiliate-how" data-section className="pt-2">
            <SubHeading id="affiliate-how">How It Works</SubHeading>
            <FormulaBlock>{`Every 50,000 PV from direct referrals within the month
→ Sponsor earns ₱5,000

Resets to 0 every 1st of the month — earnable again each month.`}</FormulaBlock>
            <Note type="warning">The PV counter resets every 1st of the month. Only the current month's direct PV counts toward milestones — previous months do not carry over.</Note>
          </section>

          <section id="affiliate-milestones" data-section className="pt-2">
            <SubHeading id="affiliate-milestones">Milestone Table (per month)</SubHeading>
            <InfoTable
              headers={['Monthly Direct PV', 'Milestones This Month', 'Bonus This Month']}
              rows={[
                ['30,000', '0', '₱0'],
                ['50,000', <Badge key="1" label="1st milestone" />, '₱5,000'],
                ['80,000', '1st milestone', '₱5,000'],
                ['100,000', <Badge key="2" label="2nd milestone" />, '₱10,000'],
                ['150,000', <Badge key="3" label="3rd milestone" />, '₱15,000'],
                ['200,000', <Badge key="4" label="4th milestone" />, '₱20,000'],
              ]}
            />
            <Note type="info">Next month starts fresh at 0 — a sponsor who hit ₱20,000 in bonuses last month can earn ₱20,000 again if their directs reach the same PV.</Note>
          </section>

          <Divider />

          {/* ── Cashback ─────────────────────────────────────── */}
          <section id="cashback" data-section>
            <SectionTag icon={<Gift size={11} />}>Personal Cashback</SectionTag>
            <SectionHeading>Personal Purchase Cashback (e-GC)</SectionHeading>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-5">
              Every member receives <strong>4% cashback</strong> on their own purchases in the form of an <strong>electronic Gift Certificate (e-GC)</strong>, usable for future purchases.
            </p>
            <InfoTable
              headers={['Detail', 'Value']}
              rows={[
                ['Cashback rate', '4% of order PV value'],
                ['When issued', 'Automatically on order delivery'],
                ['Validity', '60 days from date of issuance'],
                ['Who gets it', 'All members — no activation required'],
              ]}
            />
            <InfoTable
              headers={['Order PV Value', 'Cashback (4%)', 'Validity']}
              rows={[
                ['₱500', '₱20 e-GC', '60 days'],
                ['₱1,000', '₱40 e-GC', '60 days'],
                ['₱3,000', '₱120 e-GC', '60 days'],
              ]}
            />
          </section>

          <Divider />

          {/* ── Global ─────────────────────────────────────────── */}
          <section id="global" data-section>
            <SectionTag icon={<TrendingUp size={11} />}>Yearly Global Bonus</SectionTag>
            <SectionHeading>Yearly Global Purchase Bonus</SectionHeading>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-5">
              At the end of each year, the <strong>Top 10 highest PV earners</strong> in the entire network receive a special year-end bonus based on 1% of their total yearly PV.
            </p>
            <InfoTable
              headers={['Step', 'Detail']}
              rows={[
                ['1', 'All members are ranked by total PV earned within that calendar year'],
                ['2', 'The top 10 members each receive 1% of their yearly PV total as a cash bonus'],
                ['3', 'In case of a tie, the member who joined earlier takes the higher spot'],
                ['4', 'This bonus is awarded once per year by the administration'],
              ]}
            />
            <InfoTable
              headers={['Ranking', 'Yearly PV Earned', 'Year-End Bonus (1%)']}
              rows={[
                [<Badge key="1" label="1st" color="amber" />, '500,000 PV', '₱5,000'],
                [<Badge key="2" label="2nd" color="amber" />, '400,000 PV', '₱4,000'],
                [<Badge key="3" label="3rd" color="amber" />, '350,000 PV', '₱3,500'],
                ['...', '...', '...'],
              ]}
            />
            <Note type="warning">Members not in the top 10 do not receive this bonus for that year.</Note>
          </section>

          <Divider />

          {/* ── Rules ─────────────────────────────────────────── */}
          <section id="rules" data-section>
            <SectionTag icon={<BookOpen size={11} />}>Key Rules</SectionTag>
            <SectionHeading>Key Business Rules at a Glance</SectionHeading>
            <InfoTable
              headers={['Rule', 'How It Works']}
              rows={[
                [<span key="r1" className="font-medium">PV credited on delivery only</span>, 'No PV is earned for undelivered, cancelled, or pending orders'],
                [<span key="r2" className="font-medium">Monthly activation for unilevel</span>, 'Must meet the monthly PV threshold to receive group purchase bonuses'],
                [<span key="r3" className="font-medium">Inactive uplines are skipped — not removed</span>, 'Their position is filled by the next active upline above them'],
                [<span key="r4" className="font-medium">Cashback is always earned</span>, 'e-GC is given for every delivered order, no activation needed'],
                [<span key="r5" className="font-medium">Rank does not restrict unilevel</span>, 'Any active member earns from all 10 levels — rank is for tier promotion only'],
                [<span key="r6" className="font-medium">All rank criteria must be met together</span>, 'Meeting only some requirements does not qualify a member for that rank'],
                [<span key="r7" className="font-medium">Group PV includes the full downline</span>, 'Not just directs — the entire network tree counts toward Group PV'],
                [<span key="r8" className="font-medium">Performance bonus milestones repeat</span>, 'Every 50,000 direct PV = another ₱5,000 — no cap'],
                [<span key="r9" className="font-medium">Self-referral not allowed</span>, 'A member cannot earn referral commission from their own purchases'],
                [<span key="r10" className="font-medium">No double-posting of bonuses</span>, 'The system ensures each bonus is only awarded once per qualifying event'],
              ]}
            />
          </section>

          <Divider />

          {/* ── Diagrams ──────────────────────────────────────── */}
          <section id="diagrams" data-section>
            <SectionTag icon={<BarChart3 size={11} />}>Flow Diagrams</SectionTag>
            <SectionHeading>Flow Diagrams</SectionHeading>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-6">Visual reference for the three core flows. Click any diagram to open the full-screen viewer with zoom and pan.</p>
          </section>

          <section id="diagram-order" data-section className="pt-2">
            <SubHeading id="diagram-order">Order → Bonus Distribution</SubHeading>
            <p className="text-sm text-gray-600 mb-1">How a single delivered order triggers PV credit and distributes bonuses across all pools.</p>
            <MermaidDiagram code={D.orderBonus} />
          </section>

          <section id="diagram-activation" data-section className="pt-2">
            <SubHeading id="diagram-activation">Monthly Activation Flow</SubHeading>
            <p className="text-sm text-gray-600 mb-1">How the system determines whether a member is active or inactive each month and what changes as a result.</p>
            <MermaidDiagram code={D.activation} />
          </section>

          <section id="diagram-rank" data-section className="pt-2">
            <SubHeading id="diagram-rank">Rank Determination</SubHeading>
            <p className="text-sm text-gray-600 mb-1">How the system evaluates all rank criteria simultaneously to assign or maintain a member's tier.</p>
            <MermaidDiagram code={D.rankDetermination} />
          </section>

          <div className="pt-10 pb-4 text-center text-xs text-gray-400">
            Last updated: 2026-05-11 · Apsara Home Commission & Bonus System
          </div>

        </div>
      </div>
    </div>
  );
}
