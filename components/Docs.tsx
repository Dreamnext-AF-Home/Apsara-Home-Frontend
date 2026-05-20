'use client';

import { useState, useEffect, useRef, useId, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Server, Zap, Code2, Layout,
  CheckSquare, FolderOpen, Bot, Download, Copy, Check,
  Search, ChevronDown, X, Menu,
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
    id: 'overview', label: 'Project Overview', icon: BookOpen,
    sub: [
      { id: 'overview-apps', label: 'Connected Apps' },
      { id: 'overview-frontend', label: 'Frontend' },
      { id: 'overview-backend', label: 'Backend' },
      { id: 'overview-commands', label: 'Commands & Env' },
    ],
  },
  {
    id: 'architecture', label: 'Architecture', icon: Server,
    sub: [
      { id: 'arch-system', label: 'System Shape' },
      { id: 'arch-bounded', label: 'Bounded Areas' },
      { id: 'arch-frontend', label: 'Frontend Architecture' },
      { id: 'arch-providers', label: 'Provider Stack' },
      { id: 'arch-api', label: 'API Request Flow' },
      { id: 'arch-session', label: 'Session Route Selection' },
      { id: 'arch-auth', label: 'Auth Architecture' },
      { id: 'arch-backend', label: 'Backend Architecture' },
      { id: 'arch-db', label: 'Database Groups' },
      { id: 'arch-security', label: 'Security Controls' },
      { id: 'arch-risks', label: 'Known Risks' },
      { id: 'arch-scale', label: 'Scalability Direction' },
    ],
  },
  { id: 'integrations', label: 'Integrations', icon: Zap },
  {
    id: 'code-standards', label: 'Code Standards', icon: Code2,
    sub: [
      { id: 'cs-frontend', label: 'Frontend' },
      { id: 'cs-backend', label: 'Backend' },
      { id: 'cs-database', label: 'Database' },
      { id: 'cs-testing', label: 'Testing' },
      { id: 'cs-secrets', label: 'Secrets' },
    ],
  },
  {
    id: 'ui-context', label: 'UI Context', icon: Layout,
    sub: [
      { id: 'ui-tokens', label: 'Design Tokens' },
      { id: 'ui-routes', label: 'Route Areas' },
      { id: 'ui-components', label: 'Components' },
    ],
  },
  {
    id: 'progress', label: 'Progress Tracker', icon: CheckSquare,
    sub: [
      { id: 'progress-docs', label: 'Doc Status' },
      { id: 'progress-remediation', label: 'Remediation Tasks' },
      { id: 'progress-risks', label: 'Known Risks Register' },
    ],
  },
  {
    id: 'folder-structure', label: 'Folder Structure', icon: FolderOpen,
    sub: [
      { id: 'fs-frontend', label: 'Frontend' },
      { id: 'fs-backend', label: 'Backend' },
    ],
  },
  {
    id: 'ai-rules', label: 'AI Workflow Rules', icon: Bot,
    sub: [
      { id: 'ai-grounding', label: 'Grounding Rules' },
      { id: 'ai-frontend', label: 'Frontend Rules' },
      { id: 'ai-backend', label: 'Backend Rules' },
      { id: 'ai-security', label: 'Security Rules' },
      { id: 'ai-highrisk', label: 'High-Risk Areas' },
    ],
  },
];

// ── Diagram Lightbox — viewBox-based zoom (always crisp, no pixel scaling) ────
type VB = { x: number; y: number; w: number; h: number };

function DiagramLightbox({ svg, onClose }: { svg: string; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Parse original viewBox from Mermaid SVG output
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
  // Keep ref in sync so the wheel handler never has a stale closure
  const vbRef = useRef<VB>(origVB);
  useEffect(() => { vbRef.current = vb; }, [vb]);

  // Scale derived from how much the viewBox shrank relative to original
  const scale = origVB.w / vb.w;

  // Rebuild SVG string: fill the container, override the viewBox
  const displaySvg = useMemo(() => {
    let s = svg;
    // Strip fixed dimensions and make responsive
    s = s.replace(/(<svg\b[^>]*?)\s+width="[^"]*"/i, '$1');
    s = s.replace(/(<svg\b[^>]*?)\s+height="[^"]*"/i, '$1');
    s = s.replace(/style="([^"]*?)max-width:[^;";]*(;?)([^"]*)"/gi, 'style="$1$3"');
    // Inject responsive size + display:block directly on the svg tag
    s = s.replace('<svg', '<svg width="100%" height="100%" style="display:block"');
    // Update viewBox
    if (s.includes('viewBox=')) {
      s = s.replace(/viewBox="[^"]*"/, `viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}"`);
    } else {
      s = s.replace('<svg', `<svg viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}"`);
    }
    return s;
  }, [svg, vb]);

  // Convert screen coords → SVG coordinate space
  const screenToSvg = useCallback((sx: number, sy: number, currentVb: VB) => {
    const el = containerRef.current;
    if (!el) return { x: currentVb.x + currentVb.w / 2, y: currentVb.y + currentVb.h / 2 };
    const r = el.getBoundingClientRect();
    return {
      x: currentVb.x + ((sx - r.left) / r.width) * currentVb.w,
      y: currentVb.y + ((sy - r.top) / r.height) * currentVb.h,
    };
  }, []);

  // Zoom: shrink/expand the viewBox around a pivot point
  const zoomAt = useCallback((factor: number, pivotX?: number, pivotY?: number) => {
    setVb(prev => {
      const px = pivotX ?? prev.x + prev.w / 2;
      const py = pivotY ?? prev.y + prev.h / 2;
      const newW = Math.min(Math.max(prev.w * factor, origVB.w * 0.08), origVB.w * 6);
      const newH = prev.h * (newW / prev.w);
      return {
        x: px - (px - prev.x) * (newW / prev.w),
        y: py - (py - prev.y) * (newH / prev.h),
        w: newW, h: newH,
      };
    });
  }, [origVB]);

  // Escape to close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Wheel zoom — uses vbRef to avoid stale closure
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const h = (e: WheelEvent) => {
      e.preventDefault();
      const pivot = screenToSvg(e.clientX, e.clientY, vbRef.current);
      zoomAt(e.deltaY < 0 ? 0.88 : 1.14, pivot.x, pivot.y);
    };
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
  }, [screenToSvg, zoomAt]);

  // Clamp pan: at least 20% of the viewport must overlap the diagram
  const clampPan = useCallback((v: VB): VB => {
    const slack = 0.8;
    return {
      ...v,
      x: Math.max(origVB.x - v.w * slack, Math.min(origVB.x + origVB.w - v.w * (1 - slack), v.x)),
      y: Math.max(origVB.y - v.h * slack, Math.min(origVB.y + origVB.h - v.h * (1 - slack), v.y)),
    };
  }, [origVB]);

  // Mouse drag = pan viewBox origin
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true; setIsDragging(true);
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };
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

  // Touch drag & pinch
  const lastTouches = useRef<{ x: number; y: number; dist?: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      lastTouches.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouches.current = { x: 0, y: 0, dist: Math.hypot(dx, dy) };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!lastTouches.current) return;
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
      {/* toolbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#161b22] border-b border-[#30363d] shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#8b949e] font-mono">
            {Math.round(scale * 100)}% · scroll to zoom · drag to pan
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => zoomAt(0.83)} className="px-2 py-1 rounded text-xs text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors font-mono">+</button>
            <button onClick={() => zoomAt(1.2)} className="px-2 py-1 rounded text-xs text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors font-mono">−</button>
            <button onClick={reset} className="px-2 py-1 rounded text-xs text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors">Reset</button>
          </div>
        </div>
        <button onClick={onClose} className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-white transition-colors px-2 py-1 rounded hover:bg-[#21262d]">
          <X size={14} />Close
        </button>
      </div>

      {/* canvas — SVG fills the container, viewBox controls what's visible */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden select-none bg-[#0d1117]"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => { lastTouches.current = null; }}
        onDoubleClick={reset}
        dangerouslySetInnerHTML={{ __html: displaySvg }}
      />

      <div className="px-5 py-2 bg-[#161b22] border-t border-[#30363d] text-center text-[11px] text-[#8b949e] shrink-0">
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
    setLoading(true);
    setSvg('');
    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        fontFamily: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
        fontSize: 13,
        flowchart: { curve: 'basis', useMaxWidth: true, padding: 20 },
        sequence: { useMaxWidth: true },
        themeVariables: {
          primaryColor: '#2c5f4f',
          primaryTextColor: '#e2e8f0',
          primaryBorderColor: '#3d7a65',
          lineColor: '#4a5568',
          secondaryColor: '#1e293b',
          tertiaryColor: '#0f172a',
          background: '#0d1117',
          mainBkg: '#161b22',
          nodeBorder: '#30363d',
          clusterBkg: '#1c2128',
          titleColor: '#e2e8f0',
          edgeLabelBackground: '#161b22',
        },
      });
      mermaid.render(`mmd-${uid}`, code)
        .then(({ svg: rendered }) => {
          if (!cancelled) { setSvg(rendered); setLoading(false); }
        })
        .catch(() => { if (!cancelled) setLoading(false); });
    });
    return () => { cancelled = true; };
  }, [code, uid]);

  return (
    <>
      {open && svg && <DiagramLightbox svg={svg} onClose={() => setOpen(false)} />}

      <div
        className="my-6 rounded-xl overflow-hidden border border-[#21262d] bg-[#0d1117] group cursor-zoom-in"
        onClick={() => !loading && svg && setOpen(true)}
        title="Click to expand"
      >
        {/* titlebar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#21262d] bg-[#161b22]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f85149]/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#3fb950]/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#d29922]/80" />
            <span className="ml-2 text-[11px] text-[#8b949e] font-mono tracking-wide">diagram</span>
          </div>
          {!loading && svg && (
            <span className="text-[10px] text-[#8b949e] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              Click to expand
            </span>
          )}
        </div>

        {/* content */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-[#8b949e] text-sm">
            <div className="w-4 h-4 border-2 border-[#30363d] border-t-[#3d7a65] rounded-full animate-spin" />
            Rendering diagram…
          </div>
        ) : (
          <div
            className="p-5 overflow-hidden [&_svg]:max-w-full [&_svg]:h-auto pointer-events-none"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </div>
    </>
  );
}

// ── Helper Components ──────────────────────────────────────────────────────────
function Badge({ label, color = 'green' }: { label: string; color?: 'green' | 'amber' | 'blue' | 'red' | 'purple' | 'gray' }) {
  const map = { green: 'bg-emerald-100 text-emerald-700', amber: 'bg-amber-100 text-amber-700', blue: 'bg-blue-100 text-blue-700', red: 'bg-red-100 text-red-700', purple: 'bg-purple-100 text-purple-700', gray: 'bg-gray-100 text-gray-600' };
  return <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${map[color]}`}>{label}</span>;
}

function Note({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'warning' | 'danger' }) {
  const map = { info: 'border-blue-400 bg-blue-50 text-blue-900', warning: 'border-amber-400 bg-amber-50 text-amber-900', danger: 'border-red-400 bg-red-50 text-red-900' };
  const icon = { info: '💡', warning: '⚠️', danger: '🔴' };
  return (
    <div className={`flex gap-3 border-l-[3px] ${map[type]} rounded-r-lg px-4 py-3 mb-5 text-sm`}>
      <span className="shrink-0 mt-0.5">{icon[type]}</span>
      <div>{children}</div>
    </div>
  );
}

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden border border-[#21262d] mb-5 text-sm">
      <div className="flex items-center justify-between bg-[#161b22] px-4 py-2 border-b border-[#21262d]">
        <span className="text-[11px] text-[#8b949e] font-mono">{lang}</span>
        <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center gap-1.5 text-[11px] text-[#8b949e] hover:text-white transition-colors">
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="bg-[#0d1117] text-[#e6edf3] p-4 overflow-x-auto leading-relaxed whitespace-pre font-mono text-[13px]">{code}</pre>
    </div>
  );
}

function InfoTable({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 mb-6 text-sm">
      <table className="w-full">
        <thead>
          <tr className="bg-[#2c5f4f]">
            {headers.map((h, i) => <th key={i} className="px-4 py-3 text-left text-white font-semibold text-xs uppercase tracking-wider">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
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
      <span className="block w-1 h-5 rounded-full bg-[#2c5f4f] shrink-0" />
      {children}
    </h3>
  );
}

function Divider() { return <hr className="border-gray-100 my-10" />; }

function Pill({ children, color = 'gray' }: { children: React.ReactNode; color?: string }) {
  const map: Record<string, string> = { gray: 'bg-gray-100 text-gray-600', green: 'bg-emerald-100 text-emerald-700', red: 'bg-red-100 text-red-700', blue: 'bg-blue-100 text-blue-700' };
  return <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${map[color] ?? map.gray}`}>{children}</span>;
}

function SectionTag({ color, icon, children }: { color: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${color}`}>
      {icon}{children}
    </div>
  );
}

// ── Mermaid diagram strings ────────────────────────────────────────────────────
const D = {
  systemShape: `flowchart TD
  Browser[Browser] --> Next[Next.js Frontend :3000]
  subgraph NextApp[Next.js App]
    Pages[App Router pages]
    NextAuth[NextAuth route handlers per actor]
    NextApi[Next.js API routes]
    RTK[RTK Query — store/api/*]
  end
  subgraph LaravelApp[Laravel API :8000]
    Routes[routes/api.php]
    Middleware[Sanctum · actor · role · rate limit]
    Controllers[API Controllers]
    Services[Services — app/Services]
    Models[Eloquent Models]
  end
  subgraph External[External Systems]
    DB[(PostgreSQL / Neon)]
    Storage[Cloudinary]
    Payments[PayMongo]
    Shipping[J&T / XDE]
    AI[Gemini / OpenAI]
    Pusher[Pusher — realtime]
    GS[AF HOME GLOBAL SUPPLIER — product sync]
  end
  Next --> Pages
  Pages --> RTK
  Pages --> NextAuth
  Pages --> NextApi
  RTK --> Routes
  NextApi --> Routes
  Routes --> Middleware
  Middleware --> Controllers
  Controllers --> Services
  Controllers --> Models
  Services --> Models
  Models --> DB
  Services --> Storage
  Services --> Payments
  Services --> Shipping
  Services --> AI
  Services --> Pusher
  Services --> GS`,

  boundedAreas: `flowchart LR
  App[AF Home] --> A[Public Storefront]
  App --> B[Customer Account]
  App --> C[Admin Console]
  App --> D[Supplier Console]
  App --> E[Partner Storefront]
  App --> F[Checkout & Payment]
  App --> G[Shipping & Logistics]
  App --> H[Content & CMS]
  App --> I[AI Customer Support]
  A --> A1[Catalog: products, categories, brands, search]
  B --> B1[Profile, auth, wishlist, cart, orders, referrals]
  C --> C1[Members, products, orders, finance, suppliers, chat]
  D --> D1[Products, orders, categories, users, reports]
  E --> E1[Dashboard, webpages, branded storefront]
  F --> F1[Cart, PayMongo, webhooks, order history]
  G --> G1[Rates, J&T labels, XDE sync]
  H --> H1[Webpage CMS, ads, system settings]
  I --> I1[Conversations, AI proxy, Pusher realtime]`,

  frontendArch: `flowchart TD
  Frontend[Next.js Frontend] --> AppDir[app/ — Route segments]
  Frontend --> Components[components/ — UI]
  Frontend --> Store[store/ — Redux & RTK Query]
  Frontend --> Context[context/ — Cart & Wishlist]
  Frontend --> Libs[libs/ — Auth helpers]
  Frontend --> Types[types/ — TypeScript shapes]
  AppDir --> PublicRoutes[Public storefront routes]
  AppDir --> CustomerRoutes[Customer account routes]
  AppDir --> AdminRoutes[admin/* & super_admin/*]
  AppDir --> SupplierRoutes[supplier/* routes]
  AppDir --> PartnerRoutes[partner/* & storefront]
  AppDir --> ApiHandlers[API route handlers]
  Store --> BaseApi[store/api/baseApi.ts]
  Store --> Endpoints[store/api/*.ts — domain modules]
  Store --> CartSlice[store/slices/cartSlice.ts]`,

  providerStack: `flowchart TD
  RootLayout[app/layout.tsx] --> Providers[components/Providers.tsx]
  Providers --> Session[SessionProvider — NextAuth]
  Providers --> Redux[Redux store Provider]
  Providers --> Cart[CartProvider]
  Providers --> Wishlist[WishlistProvider]
  Providers --> Guard[Customer session guard]
  Providers --> Banned[Banned account overlay]
  Providers --> Deleted[Deleted account overlay]
  Providers --> CartDrawer[Global cart drawer]
  Providers --> WishlistDrawer[Global wishlist drawer]
  Providers --> Toast[Toast — react-hot-toast]
  Guard --> Me[RTK Query: GET /api/auth/me]`,

  apiFlow: `sequenceDiagram
  participant User as Browser
  participant Page as Next.js Page
  participant RTK as RTK Query baseApi
  participant Session as NextAuth Session
  participant API as Laravel API
  participant MW as Middleware
  participant Ctrl as Controller
  participant Svc as Service/Model
  participant DB as PostgreSQL
  User->>Page: User interaction
  Page->>RTK: Dispatch RTK Query hook
  RTK->>Session: Get session by route prefix
  Session-->>RTK: Returns accessToken
  RTK->>API: HTTP + Authorization: Bearer token
  API->>MW: auth:sanctum, actor, role, rate limit
  MW-->>API: Pass or 401/403/429
  API->>Ctrl: Route to controller method
  Ctrl->>Svc: Call service for domain logic
  Svc->>DB: Eloquent read/write
  DB-->>Svc: Result
  Svc-->>Ctrl: Domain result
  Ctrl-->>API: JSON + status code
  API-->>RTK: HTTP response
  RTK-->>Page: Cached data or error
  Page-->>User: Re-render UI`,

  sessionRoute: `flowchart TD
  Req[Frontend API request] --> Check{window.location.pathname}
  Check -->|/admin or /super_admin| AS[/api/admin/auth/session]
  Check -->|/partner| PS[/api/partner/auth/session]
  Check -->|/supplier| SS[/api/supplier/auth/session]
  Check -->|other| CS[/api/auth/session]
  AS --> AT[Admin Sanctum token]
  PS --> PT[Partner admin token]
  SS --> ST[Supplier Sanctum token]
  CS --> CT[Customer Sanctum token]
  AT --> Bearer[Authorization: Bearer token]
  PT --> Bearer
  ST --> Bearer
  CT --> Bearer
  Bearer --> Laravel[Laravel API — auth:sanctum]`,

  authArch: `flowchart LR
  subgraph Routes[NextAuth Route Handlers]
    CR[app/api/auth/...]
    AR[app/api/admin/auth/...]
    SR[app/api/supplier/auth/...]
    PR[app/api/partner/auth/...]
  end
  subgraph Configs[NextAuth Configurations]
    CC[libs/auth.ts]
    AC[libs/adminAuth.ts]
    SC[libs/supplierAuth.ts]
    PC[libs/partnerAuth.ts]
  end
  subgraph Sanctum[Laravel Sanctum]
    CM[tbl_customer]
    AM[tbl_admin]
    SM[tbl_supplier_user]
    MW[actor & role middleware]
  end
  CR --> CC --> CM
  AR --> AC --> AM
  SR --> SC --> SM
  PR --> PC --> AM
  CM --> MW
  AM --> MW
  SM --> MW`,

  backendArch: `flowchart TD
  API[Laravel API] --> Routes[routes/api.php]
  Routes --> MW[Middleware stack]
  MW --> Ctrl[Controllers — per domain]
  Ctrl --> Req[Form Request validation]
  Ctrl --> Svc[Services — business logic]
  Ctrl --> Models[Eloquent Models]
  Models --> DB[(PostgreSQL)]
  API --> Jobs[app/Jobs — async]
  API --> Events[Events & Listeners]
  Svc --> Cloudinary[CloudinaryService]
  Svc --> Chat[ConversationService]
  Svc --> AI[GeminiService]
  Svc --> Pay[PayMongoService]
  Svc --> JT[JTShippingService]
  Svc --> XDE[XDEShippingService]
  Svc --> GS[Global Supplier Sync Service]`,

  dbGroups: `flowchart LR
  DB[(Database)] --> Infra[Infrastructure]
  DB --> Cust[Customer & Member]
  DB --> Cat[Product Catalog]
  DB --> Com[Commerce & Orders]
  DB --> Fin[Affiliate & Finance]
  DB --> Adm[Admin & Supplier]
  DB --> Con[Content & Config]
  DB --> Sup[Support & Ops]
  Infra --> IT[users · sessions · cache · jobs · personal_access_tokens]
  Cust --> CT[tbl_customer · tbl_customer_address · tbl_customer_passkey]
  Cat --> CaT[tbl_product · tbl_product_variant · tbl_brand · tbl_category]
  Com --> CoT[tbl_checkout_history · tbl_cart · tbl_wishlist]
  Fin --> FT[tbl_encashment · tbl_wallet · tbl_referral · tbl_member_tier]
  Adm --> AT[tbl_admin · tbl_supplier · tbl_supplier_user]
  Con --> ConT[tbl_webpage_content · tbl_ads_content · tbl_system_setting]
  Sup --> ST[tbl_conversation · tbl_message · tbl_interior_request]`,

  security: `flowchart TD
  Sec[Security Controls] --> Sanctum[Sanctum bearer tokens — all protected endpoints]
  Sec --> Cookies[HTTP-only NextAuth cookies — one per actor]
  Sec --> Role[admin.role middleware — narrowest viable role per route]
  Sec --> Abuse[Request abuse guard middleware]
  Sec --> Headers[Security headers on all responses]
  Sec --> Rate[Named rate limiters]
  Sec --> Turnstile[Turnstile CAPTCHA on public auth flows]
  Sec --> Upload[File type · size · role validation on uploads]
  Sec --> Guards[Banned & deleted account overlays on frontend]
  Rate --> R1[Login — member and admin]
  Rate --> R2[OTP and general auth]
  Rate --> R3[Checkout initiation]
  Rate --> R4[Webhook receivers]
  Rate --> R5[Public catalog reads]
  Rate --> R6[Admin write endpoints]`,

  knownRisks: `flowchart TD
  Risks[Known Risks] --> R1[CRITICAL: Real OpenAI key in .env.example\nRotate immediately — treat as compromised]
  Risks --> R2[HIGH: Hardcoded localhost URLs in chat proxy\nReplace with process.env.LARAVEL_API_URL]
  Risks --> R3[HIGH: typescript.ignoreBuildErrors true\nFix type errors and remove bypass]
  Risks --> R4[MEDIUM: Cloudinary signing endpoints\nVerify all require session and role checks]
  Risks --> R5[MEDIUM: PayMongo webhook handlers\nConfirm signature validation enforced]`,

  scalability: `flowchart TD
  Scale[Scalability Path] --> S1[Short-term: RTK Query consolidation]
  Scale --> S2[Short-term: Thin controllers, logic in services]
  Scale --> S3[Medium-term: HTTP Resources for stable API contracts]
  Scale --> S4[Medium-term: Split routes/api.php by bounded domain]
  Scale --> S5[Ongoing: Additive migrations only]
  Scale --> S6[Ongoing: Expand test coverage]
  Scale --> S7[Long-term: app/Domains/* domain structure]
  Scale --> S8[Long-term: Extract stateless services]
  S8 --> E1[1. Media service]
  S8 --> E2[2. Notification service]
  S8 --> E3[3. Payment service]
  S8 --> E4[4. Shipping service]
  S8 --> E5[5. Catalog search]
  S8 --> E6[6. Reporting service]`,
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Docs() {
  const [activeSection, setActiveSection] = useState('overview');
  const [activeId, setActiveId] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ overview: true });
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
    <nav className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#2c5f4f] flex items-center justify-center shrink-0">
            <BookOpen size={14} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 leading-tight">AF Home</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest">Documentation</div>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <Search size={13} className="text-gray-400 shrink-0" />
          <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none" />
          {search && <button onClick={() => setSearch('')}><X size={12} className="text-gray-400 hover:text-gray-600" /></button>}
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
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${isActive ? 'bg-[#f0f7f4] text-[#2c5f4f] font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <Icon size={15} className="shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {hasSubs && <ChevronDown size={13} className={`transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />}
              </button>
              {hasSubs && isOpen && (
                <div className="ml-7 mt-0.5 space-y-0.5">
                  {item.sub!.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => { scrollTo(sub.id); setActiveSection(item.id); }}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-all ${activeId === sub.id ? 'text-[#2c5f4f] font-semibold bg-[#f0f7f4]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
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

      <div className="px-4 py-3 border-t border-gray-100">
        <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-800 py-2 rounded-lg hover:bg-gray-50 transition-colors">
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
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="text-gray-500"><Menu size={20} /></button>
          <span className="text-sm font-semibold text-gray-800">AF Home Docs</span>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-10 pb-24 space-y-0">

          {/* ── Project Overview ─────────────────────────────────── */}
          <section id="overview" data-section>
            <SectionTag color="text-[#2c5f4f] bg-[#f0f7f4]" icon={<BookOpen size={11} />}>System Overview</SectionTag>
            <SectionHeading>Project Overview</SectionHeading>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-6">AF Home (Apsara Furniture Home) is a full-stack e-commerce and membership platform for furniture and home products, serving public shoppers, registered members, admin operators, suppliers, and partner storefronts through a single unified system built with Next.js and Laravel.</p>
            <Note type="info">The platform targets the Philippine market, uses PayMongo for payments, J&T and XDE for shipping, and includes a referral/affiliate commission system, member tier rewards, and an AI-powered customer support layer.</Note>
          </section>

          <section id="overview-apps" data-section className="pt-2">
            <SubHeading id="overview-apps">Connected Applications</SubHeading>
            <InfoTable headers={['Application', 'Domain', 'Role', 'Auth Strategy']} rows={[
              ['Apsara Home (Frontend)', 'app.afhome.com', 'Main e-commerce platform', 'NextAuth + Sanctum (4 actors)'],
              ['Dreambuild Landing Page', 'dreambuild.afhome.com', 'Brand / portfolio entry point', 'Redirects to Apsara Home login'],
              ['AF Nexus (Planned)', 'nexus.afhome.com', 'Community + chat + learning', 'Validates via GET /api/customer/me'],
            ]} />
            <Note type="info">All three apps share the <strong>.afhome.com</strong> cookie domain — the NextAuth session cookie from Apsara Home is accessible on every subdomain, no second login required.</Note>
          </section>

          <section id="overview-frontend" data-section className="pt-2">
            <SubHeading id="overview-frontend">Frontend Summary</SubHeading>
            <InfoTable headers={['Layer', 'Technology']} rows={[
              ['Framework', 'Next.js App Router — React 19, TypeScript strict mode'],
              ['Auth', 'NextAuth v4 — 4 separate session configs (customer, admin, supplier, partner)'],
              ['State / API', 'Redux Toolkit + RTK Query for all Laravel API communication'],
              ['Styling', 'Tailwind CSS v4 + HeroUI component styles'],
              ['Animation', 'Framer Motion'],
              ['Charts', 'Recharts (admin / supplier dashboards)'],
              ['Rich Text', 'Tiptap editor'],
              ['Media', 'Cloudinary via protected Next.js API routes'],
              ['Realtime', 'Pusher-js + Socket.io-client'],
              ['PWA', 'Serwist service worker'],
              ['Icons', 'Lucide React'],
            ]} />
            <InfoTable headers={['Route Area', 'Routes']} rows={[
              ['Public Storefront', '/, /shop, /product/[slug], /category, /by-room, /by-brand, /search'],
              ['Customer / Member', '/login, /verification, /mfa-approval, /profile, /orders, /wishlist, /checkout'],
              ['Admin Console', '/admin/*, /super_admin/* — dashboard, members, products, orders, finance, chat'],
              ['Supplier Console', '/supplier/* — login, dashboard, products, orders, categories, users, reports'],
              ['Partner Storefront', '/partner/*, /shop/[partner], /[partner]'],
              ['Content / Info', '/about, /faq, /blog, /shipping, /returns, /privacy, /terms, /branches'],
            ]} />
          </section>

          <section id="overview-backend" data-section className="pt-2">
            <SubHeading id="overview-backend">Backend Summary</SubHeading>
            <InfoTable headers={['Layer', 'Technology']} rows={[
              ['Framework', 'Laravel 12 (PHP) — API-first, no frontend rendering'],
              ['Auth', 'Laravel Sanctum — bearer tokens per actor type'],
              ['Database', 'PostgreSQL (Neon) for production, SQLite for local dev'],
              ['Payments', 'PayMongo — checkout sessions, webhooks, mobile payment'],
              ['Shipping', 'J&T Express + XDE Logistics — waybills, rates, tracking'],
              ['Media', 'Cloudinary — image upload and CDN'],
              ['AI', 'Gemini + OpenAI — support, vision, embeddings, recommendations'],
              ['Realtime', 'Pusher — customer-admin chat events'],
              ['External Sync', 'AF HOME GLOBAL SUPPLIER — product and order data synchronization'],
            ]} />
          </section>

          <section id="overview-commands" data-section className="pt-2">
            <SubHeading id="overview-commands">Runtime Commands</SubHeading>
            <CodeBlock lang="bash — Frontend" code={`cd Apsara-Home-Frontend
pnpm install        # Install dependencies
pnpm dev            # Dev server (localhost:3000)
pnpm build          # Production build
pnpm lint           # Run ESLint
pnpm test           # Run Vitest`} />
            <CodeBlock lang="bash — Backend" code={`cd Apsara-Home-Backend
composer install    # Install PHP dependencies
php artisan migrate # Run migrations
php artisan serve   # Dev server (localhost:8000)
php artisan test    # Run PHPUnit
composer dev        # Full dev: server + queue + logs + Vite`} />
          </section>

          <Divider />

          {/* ── Architecture ──────────────────────────────────────── */}
          <section id="architecture" data-section>
            <SectionTag color="text-violet-700 bg-violet-50" icon={<Server size={11} />}>Architecture</SectionTag>
            <SectionHeading>Architecture</SectionHeading>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-6">Diagram-first reference. Use this as a quick map before editing any bounded area. Each section shows the visual diagram with key points.</p>
          </section>

          <section id="arch-system" data-section className="pt-2">
            <SubHeading id="arch-system">System Shape</SubHeading>
            <p className="text-sm text-gray-600 mb-1">The browser communicates only with Next.js. Authenticated API calls go through RTK Query → NextAuth → Laravel. The browser never calls Laravel directly for protected resources.</p>
            <MermaidDiagram code={D.systemShape} />
          </section>

          <section id="arch-bounded" data-section className="pt-2">
            <SubHeading id="arch-bounded">Bounded Areas</SubHeading>
            <p className="text-sm text-gray-600 mb-1">Nine logical areas, each with its own frontend routes, RTK Query endpoints, Laravel controllers, services, and models.</p>
            <MermaidDiagram code={D.boundedAreas} />
          </section>

          <section id="arch-frontend" data-section className="pt-2">
            <SubHeading id="arch-frontend">Frontend Architecture</SubHeading>
            <p className="text-sm text-gray-600 mb-1"><Pill>app/</Pill> contains route segments; everything else supports routes through shared UI, state, helpers, and types.</p>
            <MermaidDiagram code={D.frontendArch} />
          </section>

          <section id="arch-providers" data-section className="pt-2">
            <SubHeading id="arch-providers">Provider Stack</SubHeading>
            <p className="text-sm text-gray-600 mb-1"><Pill>components/Providers.tsx</Pill> wraps the entire application. Session, Redux, cart, wishlist, drawers, and toast are always available — do not re-mount them inside features.</p>
            <MermaidDiagram code={D.providerStack} />
          </section>

          <section id="arch-api" data-section className="pt-2">
            <SubHeading id="arch-api">API Request Flow</SubHeading>
            <p className="text-sm text-gray-600 mb-1">Complete sequence from user interaction to database and back. Bearer tokens come from HTTP-only NextAuth cookies — never from localStorage.</p>
            <MermaidDiagram code={D.apiFlow} />
          </section>

          <section id="arch-session" data-section className="pt-2">
            <SubHeading id="arch-session">Session Route Selection</SubHeading>
            <p className="text-sm text-gray-600 mb-1">RTK Query&apos;s <Pill>baseApi</Pill> inspects the current URL prefix to pick the correct NextAuth session — one API client serves all four actor types.</p>
            <MermaidDiagram code={D.sessionRoute} />
            <InfoTable headers={['Route Prefix', 'NextAuth Config', 'Session Route']} rows={[
              ['/admin/*, /super_admin/*', 'libs/adminAuth.ts', '/api/admin/auth/session'],
              ['/supplier/*', 'libs/supplierAuth.ts', '/api/supplier/auth/session'],
              ['/partner/*', 'libs/partnerAuth.ts', '/api/partner/auth/session'],
              ['All other routes', 'libs/auth.ts', '/api/auth/session'],
            ]} />
          </section>

          <section id="arch-auth" data-section className="pt-2">
            <SubHeading id="arch-auth">Auth Architecture</SubHeading>
            <p className="text-sm text-gray-600 mb-1">Four separate NextAuth configurations manage four actor types. Partners use the admin model — <Pill>partner.actor</Pill> middleware differentiates them from full admins.</p>
            <MermaidDiagram code={D.authArch} />
          </section>

          <section id="arch-backend" data-section className="pt-2">
            <SubHeading id="arch-backend">Backend Architecture</SubHeading>
            <p className="text-sm text-gray-600 mb-1">Strict layered flow: routes → middleware → controllers → services → models. Controllers stay thin; domain logic lives in services.</p>
            <MermaidDiagram code={D.backendArch} />
          </section>

          <section id="arch-db" data-section className="pt-2">
            <SubHeading id="arch-db">Database Groups</SubHeading>
            <p className="text-sm text-gray-600 mb-1">Mixes standard Laravel infrastructure tables with legacy <Pill>tbl_*</Pill> domain tables. Do not rename legacy tables without a full migration + model + contract update plan.</p>
            <MermaidDiagram code={D.dbGroups} />
            <InfoTable headers={['Table', 'Primary Key']} rows={[
              ['tbl_product', 'pd_id'],
              ['tbl_customer', 'c_userid'],
              ['tbl_supplier', 's_id'],
              ['tbl_supplier_user', 'su_id'],
              ['tbl_admin', 'id'],
              ['tbl_checkout_history', 'ch_id (internal) · ch_checkout_id (PayMongo ref)'],
            ]} />
          </section>

          <section id="arch-security" data-section className="pt-2">
            <SubHeading id="arch-security">Security Controls</SubHeading>
            <MermaidDiagram code={D.security} />
            <InfoTable headers={['Principle', 'Detail']} rows={[
              ['Token isolation', 'Each actor has its own Sanctum token — a customer token cannot auth an admin request'],
              ['Cookie isolation', 'Each actor has its own NextAuth cookie — logout one actor, others unaffected'],
              ['Role narrowing', 'Admin routes require admin.token.validation AND admin.role:* for that route group'],
              ['No NEXT_PUBLIC_ secrets', 'Payment keys, AI keys, OAuth secrets must stay server-only'],
              ['Upload gates', 'All Cloudinary signing endpoints behind protected Next.js API routes with role checks'],
              ['Webhook validation', 'PayMongo webhooks use signature verification — not open POST'],
            ]} />
          </section>

          <section id="arch-risks" data-section className="pt-2">
            <SubHeading id="arch-risks">Known Risks</SubHeading>
            <Note type="danger">These are active issues requiring remediation before production hardening.</Note>
            <MermaidDiagram code={D.knownRisks} />
          </section>

          <section id="arch-scale" data-section className="pt-2">
            <SubHeading id="arch-scale">Scalability Direction</SubHeading>
            <p className="text-sm text-gray-600 mb-1">The current architecture is a modular monolith. Scaling should happen progressively — consolidate RTK Query first, then domain structure, then extract services only when needed.</p>
            <MermaidDiagram code={D.scalability} />
          </section>

          <Divider />

          {/* ── Integrations ─────────────────────────────────────── */}
          <section id="integrations" data-section>
            <SectionTag color="text-amber-700 bg-amber-50" icon={<Zap size={11} />}>Integrations</SectionTag>
            <SectionHeading>Integrations</SectionHeading>
            <InfoTable headers={['Service', 'Purpose', 'Actor']} rows={[
              ['PayMongo', 'Checkout sessions, mobile payments, webhooks', 'Customer checkout'],
              ['J&T Express', 'Shipping rates, waybills, tracking', 'Admin / shipping'],
              ['XDE Logistics', 'Alternative shipping provider', 'Admin / shipping'],
              ['Cloudinary', 'Image / media upload and CDN delivery', 'All'],
              ['Google Drive', 'File storage for exports and imports', 'Admin'],
              ['Google Sheets', 'Product import / export workflow', 'Admin'],
              ['Google OAuth', 'Social login', 'Customer'],
              ['Facebook OAuth', 'Social login', 'Customer'],
              ['Gemini AI', 'AI support, content generation, vision', 'Admin / customer support'],
              ['OpenAI', 'AI-assisted features, embeddings', 'Backend services'],
              ['Pusher', 'Realtime websocket events (chat)', 'Customer / Admin'],
              ['AF HOME GLOBAL SUPPLIER', 'External product / order data synchronization', 'Admin'],
              ['Turnstile', 'CAPTCHA / bot protection', 'Public auth flows'],
              ['Serwist', 'Service worker / PWA', 'Frontend production'],
              ['Neon', 'Serverless PostgreSQL hosting', 'Backend production'],
            ]} />
          </section>

          <Divider />

          {/* ── Code Standards ─────────────────────────────────────── */}
          <section id="code-standards" data-section>
            <SectionTag color="text-blue-700 bg-blue-50" icon={<Code2 size={11} />}>Code Standards</SectionTag>
            <SectionHeading>Code Standards</SectionHeading>
            <ul className="space-y-2 text-sm text-gray-700 mb-6">
              {['Base all changes on the existing Next.js / Laravel split — no shared modules.',
                'Prefer small, domain-scoped changes over broad rewrites.',
                'Keep actor behavior separated — customer, admin, supplier, and partner have separate auth, session, middleware, and UI layers.',
                'Do not casually rename legacy database columns or tables.',
                'Do not commit secrets — .env.example must contain placeholder values only.',
                'Write the minimum code required — no premature abstractions.',
                'Default to writing no comments — only comment when the WHY is non-obvious.',
              ].map((t, i) => <li key={i} className="flex gap-2"><span className="text-[#2c5f4f] font-bold">→</span>{t}</li>)}
            </ul>
          </section>

          <section id="cs-frontend" data-section className="pt-2">
            <SubHeading id="cs-frontend">Frontend Standards</SubHeading>
            <InfoTable headers={['Technology', 'Usage']} rows={[
              ['Next.js App Router', 'All routing, layouts, server components, route handlers'],
              ['TypeScript (strict: true)', 'All files — no any unless unavoidable and documented'],
              ['RTK Query (store/api/*)', 'All reusable Laravel API calls'],
              ['NextAuth', 'All session management — no manual token storage'],
              ['Tailwind CSS v4', 'All styling — utility classes first'],
              ['HeroUI', 'Pre-built component library layered on Tailwind'],
            ]} />
            <Note type="info"><strong>Data fetching:</strong> Use RTK Query for all reusable Laravel calls. Use direct <code>fetch</code> only for Next.js route handlers (server-side: auth callbacks, upload proxies, Sheets, Cloudinary signing).</Note>
            <CodeBlock lang="typescript" code={`// Always include in Laravel API calls
headers: {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Authorization': \`Bearer \${token}\`,
}`} />
          </section>

          <section id="cs-backend" data-section className="pt-2">
            <SubHeading id="cs-backend">Backend Standards</SubHeading>
            <InfoTable headers={['Middleware Alias', 'Purpose']} rows={[
              ['auth:sanctum', 'Validates bearer token; rejects unauthenticated requests'],
              ['customer.actor', 'Confirms token belongs to a customer/member model'],
              ['admin.token.validation', 'Validates admin-specific token type and ban status'],
              ['admin.role:*', 'Checks admin has a specific named role'],
              ['supplier.actor', 'Confirms token belongs to a supplier user model'],
              ['request.abuse.guard', 'Guards against request abuse patterns'],
            ]} />
            <Note type="warning">Controllers must do exactly 4 things: validate (via Form Request), call a service or model, format the response, return. Business logic, external calls, and DB queries belong in service classes.</Note>
          </section>

          <section id="cs-database" data-section className="pt-2">
            <SubHeading id="cs-database">Database Standards</SubHeading>
            <InfoTable headers={['Convention', 'Rule']} rows={[
              ['Legacy tables', 'Use tbl_* prefix — do not rename without full migration + model + contract update'],
              ['Column prefixes', 'pd_ · ch_ · c_ · su_ — preserve these across all queries and responses'],
              ['New tables', 'Standard Laravel snake_case (no tbl_ prefix)'],
              ['Migrations', 'Always additive — never destructive column renames on legacy tables in production'],
              ['Indexes', 'Add for all foreign keys and columns used in WHERE or ORDER BY'],
            ]} />
          </section>

          <section id="cs-testing" data-section className="pt-2">
            <SubHeading id="cs-testing">Testing Standards</SubHeading>
            <ul className="space-y-1 text-sm text-gray-700">
              {['Auth flows — login, registration, OTP, OAuth, passkeys, MFA',
                'Checkout and payment — session creation, webhook handling, order state transitions',
                'Shipping — rate calculation, waybill creation, tracking callbacks',
                'Wallet and encashment — balance checks, credit/debit, payout approval',
                'Referral and commission — PV tracking, tier promotion, bonus calculation',
                'Member tiers — activation gates, tier eligibility, downgrade logic',
                'Upload endpoints — file type, size, role validation',
              ].map((t, i) => <li key={i} className="flex gap-2"><span className="text-[#2c5f4f] font-bold">→</span>{t}</li>)}
            </ul>
          </section>

          <section id="cs-secrets" data-section className="pt-2">
            <SubHeading id="cs-secrets">Secrets & Environment</SubHeading>
            <Note type="danger">Never put real secrets in <Pill color="red">.env.example</Pill>. Never move payment keys, AI keys, or OAuth secrets to <Pill color="red">NEXT_PUBLIC_*</Pill> — these are exposed to the browser.</Note>
            <InfoTable headers={['Variable', 'Rule']} rows={[
              ['LARAVEL_API_URL', 'Server-side Laravel API URL'],
              ['NEXT_PUBLIC_API_URL', 'Only for non-sensitive public values'],
              ['PAYMONGO_SECRET_KEY', 'Server-only — never NEXT_PUBLIC_'],
              ['CLOUDINARY_API_SECRET', 'Server-only — never NEXT_PUBLIC_'],
              ['GOOGLE_CLIENT_SECRET, FACEBOOK_CLIENT_SECRET', 'Server-only — never NEXT_PUBLIC_'],
              ['GEMINI_API_KEY, OPENAI_API_KEY', 'Server-only — never NEXT_PUBLIC_'],
            ]} />
          </section>

          <Divider />

          {/* ── UI Context ──────────────────────────────────────────── */}
          <section id="ui-context" data-section>
            <SectionTag color="text-rose-700 bg-rose-50" icon={<Layout size={11} />}>UI Context</SectionTag>
            <SectionHeading>UI Context</SectionHeading>
          </section>

          <section id="ui-tokens" data-section className="pt-2">
            <SubHeading id="ui-tokens">Design Tokens</SubHeading>
            <InfoTable headers={['Token', 'Value', 'Usage']} rows={[
              ['--color-cream', '#faf8f5', 'Page backgrounds, section fills'],
              ['--color-forest', '#2c5f4f', 'Primary brand color, CTAs, active states'],
              ['--color-brass', '#b8952a', 'Accent, highlight, badge'],
              ['--color-charcoal', '#1a1a1a', 'Primary text, headings'],
              ['--color-mist', '#e8e4dd', 'Borders, dividers, subtle backgrounds'],
            ]} />
            <InfoTable headers={['Font Class', 'Usage']} rows={[
              ['font-sans', 'Body text — Plus Jakarta Sans'],
              ['font-display', 'Headings — Plus Jakarta Sans semibold/bold'],
              ['font-mono', 'Code, IDs, technical labels'],
            ]} />
          </section>

          <section id="ui-routes" data-section className="pt-2">
            <SubHeading id="ui-routes">Route Areas by Actor</SubHeading>
            <InfoTable headers={['Actor', 'Entry', 'Key Pages']} rows={[
              ['Public', '/', 'Home, shop, product, category, by-room, by-brand, search, blog, about, faq'],
              ['Customer / Member', '/login', 'Profile, orders, wishlist, checkout, rewards, referrals, interior'],
              ['Admin', '/admin', 'Dashboard, members, products, orders, finance, encashment, CMS, chat, settings, reports'],
              ['Super Admin', '/super_admin', 'Extended admin controls'],
              ['Supplier', '/supplier/login', 'Dashboard, products, orders, categories, users, company, reports'],
              ['Partner', '/partner/login', 'Dashboard, webpages, branded storefront at /shop/[partner]'],
            ]} />
          </section>

          <section id="ui-components" data-section className="pt-2">
            <SubHeading id="ui-components">Component Directory</SubHeading>
            <InfoTable headers={['Directory', 'Contents']} rows={[
              ['components/layout/', 'Navbar, footer, mobile nav, drawers'],
              ['components/ui/', 'Shared buttons, inputs, modals, cards, badges'],
              ['components/product/', 'Product listing cards, detail, gallery, reviews'],
              ['components/checkout/', 'Cart, checkout steps, payment form, confirmation'],
              ['components/admin/', 'Admin dashboard, tables, forms for all admin features'],
              ['components/supplier/', 'Supplier-specific UI components'],
              ['components/profile/', 'Profile settings, KYC, passkey management'],
              ['components/ai-support/', 'AI chat widget, conversation UI'],
            ]} />
          </section>

          <Divider />

          {/* ── Progress Tracker ────────────────────────────────────── */}
          <section id="progress" data-section>
            <SectionTag color="text-emerald-700 bg-emerald-50" icon={<CheckSquare size={11} />}>Progress Tracker</SectionTag>
            <SectionHeading>Progress Tracker</SectionHeading>
          </section>

          <section id="progress-docs" data-section className="pt-2">
            <SubHeading id="progress-docs">Documentation Status</SubHeading>
            <InfoTable headers={['Document', 'Status', 'Last Reviewed']} rows={[
              ['project-overview.md', <Badge label="Complete" color="green" />, '2026-05-11'],
              ['architecture.md', <Badge label="Complete" color="green" />, '2026-05-11'],
              ['code-standards.md', <Badge label="Complete" color="green" />, '2026-05-11'],
              ['ai-workflow-rules.md', <Badge label="Complete" color="green" />, '2026-05-11'],
              ['ui-context.md', <Badge label="Complete" color="green" />, '2026-05-11'],
              ['recommended-folder-structure.md', <Badge label="Complete" color="green" />, '2026-05-11'],
              ['progress-tracker.md', <Badge label="Current" color="blue" />, '2026-05-11'],
              ['api-reference.md', <Badge label="Not started" color="gray" />, '—'],
              ['database-map.md', <Badge label="Not started" color="gray" />, '—'],
              ['deployment.md', <Badge label="Not started" color="gray" />, '—'],
              ['security.md', <Badge label="Not started" color="gray" />, '—'],
              ['testing.md', <Badge label="Not started" color="gray" />, '—'],
            ]} />
          </section>

          <section id="progress-remediation" data-section className="pt-2">
            <SubHeading id="progress-remediation">Remediation Tasks</SubHeading>
            <Note type="danger"><strong>Critical:</strong> Rotate the OpenAI API key in <Pill color="red">Apsara-Home-Backend/.env.example</Pill>. Treat it as compromised. Rotate in the OpenAI dashboard, then replace with placeholder <code>sk-your-openai-api-key</code>.</Note>
            <InfoTable headers={['Priority', 'Task', 'Area', 'Status']} rows={[
              [<Badge label="High" color="amber" />, 'Remove hardcoded local backend URLs from frontend route handlers', 'Frontend', 'Not started'],
              [<Badge label="High" color="amber" />, 'Decide on typescript.ignoreBuildErrors: true in next.config.ts', 'Frontend', 'Not started'],
              [<Badge label="High" color="amber" />, 'Document production PostgreSQL / Neon environment variables', 'DevOps', 'Not started'],
              [<Badge label="Medium" color="blue" />, 'Normalize remaining fetch calls to RTK Query endpoints', 'Frontend', 'Not started'],
              [<Badge label="Medium" color="blue" />, 'Expand backend tests — payment, auth, role gates, order state', 'Backend', 'Not started'],
              [<Badge label="Medium" color="blue" />, 'Audit all Cloudinary upload handlers for session + role checks', 'Backend', 'Not started'],
              [<Badge label="Medium" color="blue" />, 'Confirm PayMongo webhook signature validation in all handlers', 'Backend', 'Not started'],
              [<Badge label="Low" color="gray" />, 'Add database indexes to high-traffic query columns', 'Database', 'Not started'],
              [<Badge label="Low" color="gray" />, 'Split routes/api.php by bounded domain', 'Backend', 'Not started'],
            ]} />
          </section>

          <section id="progress-risks" data-section className="pt-2">
            <SubHeading id="progress-risks">Known Risks Register</SubHeading>
            <InfoTable headers={['Risk', 'Severity', 'Status', 'Mitigation']} rows={[
              ['Real OpenAI key in .env.example', <Badge label="Critical" color="red" />, 'Open', 'Rotate key immediately'],
              ['Hardcoded localhost URLs in chat proxy', <Badge label="High" color="amber" />, 'Open', 'Replace with LARAVEL_API_URL env var'],
              ['TypeScript build bypass enabled', <Badge label="High" color="amber" />, 'Open', 'Fix type errors, remove ignoreBuildErrors'],
              ['Upload endpoints without role gate', <Badge label="Medium" color="blue" />, 'Open', 'Audit all Cloudinary signing handlers'],
              ['PayMongo webhooks without signature check', <Badge label="Medium" color="blue" />, 'Open', 'Add signature verification to all handlers'],
              ['Missing DB indexes on high-traffic columns', <Badge label="Low" color="gray" />, 'Open', 'Add indexes per query analysis'],
            ]} />
          </section>

          <Divider />

          {/* ── Folder Structure ────────────────────────────────────── */}
          <section id="folder-structure" data-section>
            <SectionTag color="text-gray-600 bg-gray-100" icon={<FolderOpen size={11} />}>Structure</SectionTag>
            <SectionHeading>Folder Structure</SectionHeading>
          </section>

          <section id="fs-frontend" data-section className="pt-2">
            <SubHeading id="fs-frontend">Frontend</SubHeading>
            <CodeBlock lang="Apsara-Home-Frontend/" code={`app/
├── (public routes)/       # Home, shop, product, category, etc.
├── admin/                 # Admin console pages
├── super_admin/           # Super admin pages
├── supplier/              # Supplier console pages
├── [partner]/             # Partner storefront landing
├── shop/[partner]/        # Partner-branded shop
└── api/
    ├── auth/              # Customer NextAuth routes
    ├── admin/auth/        # Admin NextAuth routes
    ├── supplier/auth/     # Supplier NextAuth routes
    └── partner/auth/      # Partner NextAuth routes
components/
├── layout/                # Navbar, footer, drawers
├── ui/                    # Shared primitives
├── product/               # Product UI
├── checkout/              # Cart and checkout
├── admin/                 # Admin panel components
├── supplier/              # Supplier UI
├── profile/               # Profile components
└── ai-support/            # AI chat widget
store/
├── api/
│   ├── baseApi.ts         # RTK Query base with token resolver
│   └── *.ts               # Domain endpoint modules
└── slices/                # Redux slices (cart, etc.)
context/
├── CartProvider.tsx
└── WishlistProvider.tsx
libs/
├── auth.ts                # Customer NextAuth config
├── adminAuth.ts           # Admin NextAuth config
├── supplierAuth.ts        # Supplier NextAuth config
└── partnerAuth.ts         # Partner NextAuth config`} />
          </section>

          <section id="fs-backend" data-section className="pt-2">
            <SubHeading id="fs-backend">Backend</SubHeading>
            <CodeBlock lang="Apsara-Home-Backend/" code={`app/
├── Http/
│   ├── Controllers/Api/   # Request handling per domain (~46 controllers)
│   ├── Middleware/        # Custom middleware aliases
│   └── Requests/          # Form request validation classes
├── Models/                # Eloquent models (~48 models)
├── Services/              # Business and integration logic
├── Events/                # Domain events
└── Jobs/                  # Async queue jobs
routes/
└── api.php                # All API routes (150+ routes)
database/
├── migrations/            # Schema history (additive only)
└── seeders/               # Test and reference data
tests/
├── Feature/Auth/          # Auth feature tests
├── Feature/               # Other feature tests
└── Unit/                  # Unit tests`} />
          </section>

          <Divider />

          {/* ── AI Workflow Rules ───────────────────────────────────── */}
          <section id="ai-rules" data-section>
            <SectionTag color="text-purple-700 bg-purple-50" icon={<Bot size={11} />}>AI Workflow Rules</SectionTag>
            <SectionHeading>AI Workflow Rules</SectionHeading>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-4">Rules for AI-assisted development on this codebase. These apply to any AI tool (Claude, Cursor, Copilot, etc.) generating or modifying code here.</p>
          </section>

          <section id="ai-grounding" data-section className="pt-2">
            <SubHeading id="ai-grounding">Grounding Rules</SubHeading>
            <ul className="space-y-2 text-sm text-gray-700">
              {['Read before writing — identify the bounded area and read existing files before generating any code.',
                'Keep frontend and backend changes separate — do not generate code that crosses the HTTP boundary.',
                'Do not invent endpoints, table names, or column names — derive from routes/api.php, migrations, and models.',
                'Preserve actor boundaries — do not mix customer, admin, supplier, and partner auth or session logic.',
                'Preserve legacy naming — tbl_* table names and prefixed columns (pd_, ch_, c_, su_) must remain unchanged.',
                'Call out uncertainty — if information cannot be derived from the codebase, say so instead of guessing.',
                'Distinguish observed vs. recommended — label recommendations clearly.',
              ].map((r, i) => <li key={i} className="flex gap-2"><span className="text-[#2c5f4f] font-bold shrink-0">→</span>{r}</li>)}
            </ul>
          </section>

          <section id="ai-frontend" data-section className="pt-2">
            <SubHeading id="ai-frontend">Frontend Rules</SubHeading>
            <ul className="space-y-2 text-sm text-gray-700">
              {['Use RTK Query (store/api/*) for all reusable Laravel API calls — inject into baseApi.',
                'Use the correct NextAuth authOptions for the actor — never mix auth configs across actors.',
                'Never read tokens from localStorage, sessionStorage, or cookies directly.',
                'All Cloudinary uploads must go through a protected Next.js API route handler.',
                'Use existing HeroUI and Tailwind primitives — do not introduce new UI libraries without discussion.',
                'TypeScript strict mode is enabled — do not use any unless documented.',
              ].map((r, i) => <li key={i} className="flex gap-2"><span className="text-[#2c5f4f] font-bold shrink-0">→</span>{r}</li>)}
            </ul>
          </section>

          <section id="ai-backend" data-section className="pt-2">
            <SubHeading id="ai-backend">Backend Rules</SubHeading>
            <ul className="space-y-2 text-sm text-gray-700">
              {['Use the narrowest correct middleware — customer.actor for customer routes, admin.role:* for admin routes.',
                'Controllers must: validate, call service/model, format response, return. Nothing else.',
                'Business logic and external API calls belong in service classes under app/Services/',
                'Migrations must be additive — never destructive column renames on legacy tables in production.',
                'Add indexes for all new foreign keys and columns used in WHERE or ORDER BY clauses.',
              ].map((r, i) => <li key={i} className="flex gap-2"><span className="text-[#2c5f4f] font-bold shrink-0">→</span>{r}</li>)}
            </ul>
          </section>

          <section id="ai-security" data-section className="pt-2">
            <SubHeading id="ai-security">Security Rules</SubHeading>
            <Note type="danger">Never echo secrets in docs, comments, or output. Never move secrets to NEXT_PUBLIC_* variables. Never weaken security controls without explicit instruction.</Note>
            <ul className="space-y-2 text-sm text-gray-700">
              {['If a committed secret is found in .env.example, report it as critical — do not use or distribute it.',
                'Do not generate code that weakens rate limiting, role gates, or webhook signature verification.',
                'Do not suggest moving payment keys, AI keys, or OAuth secrets to NEXT_PUBLIC_* variables.',
                'Generated documentation must use env var names (e.g. OPENAI_API_KEY) — never real values.',
              ].map((r, i) => <li key={i} className="flex gap-2"><span className="text-[#2c5f4f] font-bold shrink-0">→</span>{r}</li>)}
            </ul>
          </section>

          <section id="ai-highrisk" data-section className="pt-2">
            <SubHeading id="ai-highrisk">High-Risk Areas</SubHeading>
            <InfoTable headers={['Area', 'Why High Risk', 'Rule']} rows={[
              ['PayMongo checkout & webhooks', 'Real money, complex state machine', 'Read existing flow end-to-end before changing anything'],
              ['Order status transitions', 'Tied to shipping, wallet, commission, notifications', 'Map all side effects before touching order state'],
              ['Encashment requests', 'Affects wallet balances and real payouts', 'Never approve or modify without balance validation'],
              ['Referral commissions', 'Multi-level, complex calculation rules', 'Test against known calculation fixtures'],
              ['Role and actor middleware', 'If weakened, all access controls fail', 'Never remove or comment out middleware'],
              ['MFA and passkeys', 'Auth bypass risk if broken', 'Test full flow — do not skip verification steps'],
              ['Cloudinary upload endpoints', 'Unauthorized upload or signed URL abuse', 'Always verify session + role before signing'],
              ['Migrations on legacy tables', 'Breaking change risk to production data', 'Always additive — never destructive renames'],
            ]} />
            <Note type="warning">
              <strong>Suggested AI work loop:</strong> (1) Identify the bounded area. (2) Read frontend surface: routes, components, RTK Query endpoints. (3) Read backend surface: routes, middleware, controller, service, model. (4) Make the smallest change that achieves the goal. (5) Verify correctness. (6) Update docs.
            </Note>
          </section>

        </div>
      </div>
    </div>
  );
}
