'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Server, Shield, Database, Zap, Code2, Layout,
  CheckSquare, FolderOpen, Bot, Download, Copy, Check,
  Search, ChevronDown, ChevronRight, Globe, Lock,
  CreditCard, MessageSquare, AlertTriangle, Package,
  GitBranch, Users, ArrowDown, ArrowRight, Layers,
  Settings, Terminal, X,
} from 'lucide-react';

// ─── types ───────────────────────────────────────────────────────────────────

type NavSub = { id: string; label: string };
type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  sub?: NavSub[];
};

// ─── navigation config ───────────────────────────────────────────────────────

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
      { id: 'arch-system', label: 'System Overview' },
      { id: 'arch-auth', label: 'Auth Architecture' },
      { id: 'arch-api', label: 'API Request Flow' },
      { id: 'arch-middleware', label: 'Middleware Chain' },
      { id: 'arch-payment', label: 'Payment Flow' },
      { id: 'arch-realtime', label: 'Real-time / Pusher' },
      { id: 'arch-queue', label: 'Queue & Jobs' },
      { id: 'arch-db', label: 'Database Groups' },
      { id: 'arch-security', label: 'Security Controls' },
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
      { id: 'ui-stack', label: 'UI Stack' },
      { id: 'ui-routes', label: 'Route Areas' },
      { id: 'ui-components', label: 'Components' },
    ],
  },
  {
    id: 'progress', label: 'Progress Tracker', icon: CheckSquare,
    sub: [
      { id: 'progress-remediation', label: 'Remediation Tasks' },
      { id: 'progress-integration', label: 'Integration Tasks' },
      { id: 'progress-next-docs', label: 'Next Docs' },
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
      { id: 'ai-security', label: 'Security Rules' },
      { id: 'ai-highrisk', label: 'High-Risk Areas' },
    ],
  },
];

// ─── small helpers ────────────────────────────────────────────────────────────

function Badge({ label, color = 'green' }: { label: string; color?: 'green' | 'amber' | 'blue' | 'red' | 'purple' | 'gray' }) {
  const map = {
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700',
    gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${map[color]}`}>
      {label}
    </span>
  );
}

function SectionTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="font-display text-3xl font-bold text-[#1a1a1a] mb-2 scroll-mt-20"
    >
      {children}
    </h2>
  );
}

function SubTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3
      id={id}
      className="font-display text-xl font-semibold text-[#1a1a1a] mt-10 mb-3 scroll-mt-20"
    >
      {children}
    </h3>
  );
}

function Divider() {
  return <hr className="border-gray-200 my-10" />;
}

function InfoTable({
  headers, rows,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 mb-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#2c5f4f]">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left text-white font-semibold text-xs uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#faf8f5]'}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-gray-700 border-t border-gray-100">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeBlock({ code, lang = 'bash', id }: { code: string; lang?: string; id?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-800 mb-4 group">
      <div className="flex items-center justify-between bg-[#1a1a1a] px-4 py-2 border-b border-gray-800">
        <span className="text-xs text-gray-500 font-mono">{lang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="bg-[#0f0f0f] text-gray-300 text-sm font-mono p-4 overflow-x-auto leading-relaxed whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

function Note({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'warning' | 'danger' }) {
  const map = {
    info: 'bg-blue-50 border-blue-300 text-blue-800',
    warning: 'bg-amber-50 border-amber-300 text-amber-800',
    danger: 'bg-red-50 border-red-300 text-red-800',
  };
  return (
    <div className={`border-l-4 px-4 py-3 rounded-r-lg mb-4 text-sm ${map[type]}`}>
      {children}
    </div>
  );
}

// ─── diagram components ────────────────────────────────────────────────────────

function DiagramNode({
  label, sub, color = 'gray', wide = false, small = false,
}: {
  label: string; sub?: string; color?: string; wide?: boolean; small?: boolean;
}) {
  const palette: Record<string, string> = {
    amber: 'border-amber-400/50 bg-amber-400/10 text-amber-300',
    green: 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300',
    blue: 'border-blue-400/50 bg-blue-400/10 text-blue-300',
    red: 'border-red-400/50 bg-red-400/10 text-red-300',
    purple: 'border-purple-400/50 bg-purple-400/10 text-purple-300',
    orange: 'border-orange-400/50 bg-orange-400/10 text-orange-300',
    pink: 'border-pink-400/50 bg-pink-400/10 text-pink-300',
    yellow: 'border-yellow-400/50 bg-yellow-400/10 text-yellow-300',
    cyan: 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300',
    gray: 'border-gray-500/50 bg-gray-500/10 text-gray-300',
  };
  return (
    <div
      className={`border rounded-xl px-4 py-2.5 text-center font-mono ${palette[color] || palette.gray} ${
        wide ? 'min-w-[220px]' : small ? 'min-w-[110px]' : 'min-w-[150px]'
      }`}
    >
      <div className="font-semibold text-sm">{label}</div>
      {sub && <div className="text-xs opacity-60 mt-0.5">{sub}</div>}
    </div>
  );
}

function Arrow({ dir = 'down', label }: { dir?: 'down' | 'right'; label?: string }) {
  if (dir === 'right') {
    return (
      <div className="flex items-center gap-1 text-gray-500 mx-2">
        {label && <span className="text-xs">{label}</span>}
        <ArrowRight size={16} />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-0.5 text-gray-500 my-1">
      {label && <span className="text-xs">{label}</span>}
      <ArrowDown size={16} />
    </div>
  );
}

function DiagramBox({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0f1117] rounded-2xl p-5 overflow-x-auto ${className}`}>
      {title && (
        <div className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-4 text-center">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// System overview diagram
function SystemOverviewDiagram() {
  return (
    <DiagramBox title="full system shape" className="mb-6">
      {/* Entry points */}
      <div className="mb-1 text-center text-xs text-gray-600 font-mono">Entry Points</div>
      <div className="flex gap-3 mb-1 justify-center flex-wrap">
        <DiagramNode label="Dreambuild" sub="dreambuild.afhome.com" color="amber" />
        <DiagramNode label="Apsara Home" sub="app.afhome.com" color="green" />
        <DiagramNode label="AF Nexus" sub="nexus.afhome.com" color="blue" />
      </div>

      {/* Arrow */}
      <Arrow label="HTTP + Bearer token" />

      {/* Laravel API */}
      <div className="flex justify-center mb-1">
        <DiagramNode label="Laravel API" sub="api.afhome.com" color="red" wide />
      </div>
      <div className="flex justify-center mb-1">
        <div className="text-xs font-mono text-gray-600 bg-gray-800/50 px-3 py-1 rounded-full">
          Sanctum · Actor middleware · Rate limits · Abuse guard
        </div>
      </div>

      {/* Arrow */}
      <Arrow />

      {/* Data and external */}
      <div className="mb-1 text-center text-xs text-gray-600 font-mono">Data + External Services</div>
      <div className="flex gap-2 justify-center flex-wrap">
        <DiagramNode label="PostgreSQL" sub="Neon" color="purple" small />
        <DiagramNode label="Redis" sub="Cache" color="orange" small />
        <DiagramNode label="Pusher" sub="Real-time" color="pink" small />
        <DiagramNode label="PayMongo" sub="Payments" color="yellow" small />
        <DiagramNode label="Cloudinary" sub="Media" color="cyan" small />
        <DiagramNode label="Gemini / AI" sub="Support" color="green" small />
        <DiagramNode label="J&T / XDE" sub="Shipping" color="blue" small />
      </div>
    </DiagramBox>
  );
}

// Auth architecture diagram
function AuthDiagram() {
  const actors = [
    { route: 'app/api/auth/[...nextauth]', config: 'libs/auth.ts', model: 'tbl_customer', color: 'green' as const },
    { route: 'app/api/admin/auth/[...nextauth]', config: 'libs/adminAuth.ts', model: 'tbl_admin', color: 'red' as const },
    { route: 'app/api/supplier/auth/[...nextauth]', config: 'libs/supplierAuth.ts', model: 'tbl_supplier_user', color: 'blue' as const },
    { route: 'app/api/partner/auth/[...nextauth]', config: 'libs/partnerAuth.ts', model: 'tbl_admin', color: 'amber' as const },
  ];
  return (
    <DiagramBox title="authentication architecture" className="mb-6">
      <div className="grid grid-cols-3 gap-4 text-xs font-mono text-center mb-3">
        <div className="text-gray-500">NextAuth Route</div>
        <div className="text-gray-500">Auth Config</div>
        <div className="text-gray-500">Laravel Model (Sanctum)</div>
      </div>
      {actors.map((a, i) => (
        <div key={i} className="grid grid-cols-3 gap-2 items-center mb-2">
          <div className="border border-gray-700 bg-gray-800/50 rounded-lg px-3 py-2 text-gray-300 text-xs font-mono truncate">
            {a.route}
          </div>
          <div className={`rounded-lg px-3 py-2 text-xs font-mono text-center ${
            a.color === 'green' ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300' :
            a.color === 'red' ? 'border border-red-500/40 bg-red-500/10 text-red-300' :
            a.color === 'blue' ? 'border border-blue-500/40 bg-blue-500/10 text-blue-300' :
            'border border-amber-500/40 bg-amber-500/10 text-amber-300'
          }`}>
            {a.config}
          </div>
          <div className="border border-purple-500/40 bg-purple-500/10 rounded-lg px-3 py-2 text-purple-300 text-xs font-mono text-center">
            {a.model} <span className="opacity-60">HasApiTokens</span>
          </div>
        </div>
      ))}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-gray-400 bg-gray-800/50 px-4 py-2 rounded-full">
          <Lock size={12} />
          All tokens validated by Sanctum · personal_access_tokens table
        </div>
      </div>
    </DiagramBox>
  );
}

// Middleware chain diagram
function MiddlewareDiagram() {
  const steps = [
    { label: 'Security Headers', sub: 'HSTS, CSP, X-Frame' },
    { label: 'Abuse Guard', sub: 'Blocks suspicious patterns' },
    { label: 'Rate Limiter', sub: 'auth · otp · checkout · reads · writes · uploads' },
    { label: 'Turnstile', sub: 'Bot protection (auth + contact routes)' },
    { label: 'auth:sanctum', sub: 'Validates bearer token in personal_access_tokens' },
    { label: 'Actor Middleware', sub: 'customer.actor · admin.token.validation · supplier.actor' },
    { label: 'Role Middleware', sub: 'admin.role:* — narrowest viable set' },
    { label: 'Controller Method', sub: 'Authorized request' },
  ];
  return (
    <DiagramBox title="middleware chain — every API request" className="mb-6">
      <div className="flex flex-col items-center gap-0">
        {steps.map((s, i) => (
          <div key={i} className="flex flex-col items-center w-full max-w-sm">
            <div className={`w-full border rounded-xl px-4 py-2.5 text-center ${
              i < 4 ? 'border-gray-600/50 bg-gray-700/20 text-gray-300' :
              i === 4 ? 'border-blue-500/50 bg-blue-500/10 text-blue-300' :
              i === 5 ? 'border-amber-500/50 bg-amber-500/10 text-amber-300' :
              i === 6 ? 'border-red-500/50 bg-red-500/10 text-red-300' :
              'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
            }`}>
              <div className="font-mono text-sm font-semibold">{s.label}</div>
              <div className="text-xs opacity-60 mt-0.5">{s.sub}</div>
            </div>
            {i < steps.length - 1 && <Arrow />}
          </div>
        ))}
      </div>
    </DiagramBox>
  );
}

// Payment flow diagram
function PaymentFlowDiagram() {
  const steps = [
    { actor: 'Customer', action: 'Proceeds to checkout', color: 'green' },
    { actor: 'Next.js', action: 'POST /api/checkout/create — cart, shipping, address', color: 'blue' },
    { actor: 'Laravel', action: 'Creates PayMongo payment session', color: 'orange' },
    { actor: 'PayMongo', action: 'Returns session URL + session ID', color: 'yellow' },
    { actor: 'Next.js', action: 'Redirects customer to PayMongo hosted page', color: 'blue' },
    { actor: 'Customer', action: 'Completes payment on PayMongo page', color: 'green' },
    { actor: 'PayMongo', action: 'POST payment.paid webhook → /webhook/paymongo', color: 'yellow' },
    { actor: 'Laravel', action: 'Validate signature → update order → trigger shipping → issue voucher', color: 'orange' },
  ];
  return (
    <DiagramBox title="paymongo payment flow" className="mb-6">
      <div className="space-y-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`shrink-0 w-20 text-right text-xs font-mono py-2 ${
              s.color === 'green' ? 'text-emerald-400' :
              s.color === 'blue' ? 'text-blue-400' :
              s.color === 'orange' ? 'text-orange-400' :
              'text-yellow-400'
            }`}>
              {s.actor}
            </div>
            <div className="w-px bg-gray-700 mt-2 shrink-0" style={{ height: 'auto', minHeight: '28px' }} />
            <div className="flex-1 border border-gray-700/50 bg-gray-800/30 rounded-lg px-3 py-2 text-gray-300 text-xs font-mono">
              {s.action}
            </div>
          </div>
        ))}
      </div>
    </DiagramBox>
  );
}

// Database groups diagram
function DBGroupsDiagram() {
  const groups = [
    { label: 'Infrastructure', tables: ['users', 'sessions', 'cache', 'jobs', 'personal_access_tokens'], color: 'gray' },
    { label: 'Customer / Member', tables: ['tbl_customer', 'addresses', 'passkeys', 'socials', 'verification'], color: 'green' },
    { label: 'Catalog', tables: ['tbl_product', 'variants', 'photos', 'brands', 'categories', 'reviews'], color: 'blue' },
    { label: 'Commerce', tables: ['tbl_checkout_history', 'cart', 'wishlist', 'shipping_rates'], color: 'purple' },
    { label: 'Finance / Affiliate', tables: ['encashment', 'wallet', 'referral', 'vouchers', 'tiers', 'bonuses'], color: 'amber' },
    { label: 'Admin / Supplier', tables: ['tbl_admin', 'tbl_supplier', 'tbl_supplier_user', 'access'], color: 'red' },
    { label: 'Content / Config', tables: ['web_page_content', 'ads_content', 'system_settings'], color: 'cyan' },
    { label: 'Support / Ops', tables: ['conversations', 'messages', 'interior_requests', 'leads'], color: 'pink' },
  ];
  const palette: Record<string, string> = {
    gray: 'border-gray-500/40 bg-gray-500/10',
    green: 'border-emerald-500/40 bg-emerald-500/10',
    blue: 'border-blue-500/40 bg-blue-500/10',
    purple: 'border-purple-500/40 bg-purple-500/10',
    amber: 'border-amber-500/40 bg-amber-500/10',
    red: 'border-red-500/40 bg-red-500/10',
    cyan: 'border-cyan-500/40 bg-cyan-500/10',
    pink: 'border-pink-500/40 bg-pink-500/10',
  };
  const textPalette: Record<string, string> = {
    gray: 'text-gray-300', green: 'text-emerald-300', blue: 'text-blue-300',
    purple: 'text-purple-300', amber: 'text-amber-300', red: 'text-red-300',
    cyan: 'text-cyan-300', pink: 'text-pink-300',
  };
  return (
    <DiagramBox title="database schema groups — postgresql" className="mb-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {groups.map((g, i) => (
          <div key={i} className={`border rounded-xl p-3 ${palette[g.color]}`}>
            <div className={`text-xs font-semibold font-mono mb-2 ${textPalette[g.color]}`}>{g.label}</div>
            <div className="space-y-1">
              {g.tables.map((t, j) => (
                <div key={j} className="text-xs text-gray-400 font-mono truncate">{t}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DiagramBox>
  );
}

// Queue/job diagram
function QueueDiagram() {
  const jobs = [
    { category: 'Payment', items: ['PayMongo reconciliation', 'webhook retry', 'order status sync'], color: 'yellow' },
    { category: 'Shipping', items: ['J&T / XDE waybill', 'tracking sync', 'status update'], color: 'blue' },
    { category: 'AI & Search', items: ['Gemini embedding', 'vision analysis', 'product vectors'], color: 'green' },
    { category: 'Import / Export', items: ['Bulk product import', 'Sheets sync', 'image processing'], color: 'cyan' },
    { category: 'Finance', items: ['Encashment processing', 'commission calc', 'bonus award'], color: 'amber' },
    { category: 'Notifications', items: ['Customer email', 'admin alerts', 'push notifications'], color: 'pink' },
  ];
  const palette: Record<string, string> = {
    yellow: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
    blue: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
    green: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    cyan: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
    amber: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    pink: 'border-pink-500/40 bg-pink-500/10 text-pink-300',
  };
  return (
    <DiagramBox title="queue / job system" className="mb-6">
      <div className="flex justify-center mb-3">
        <div className="border border-gray-600 bg-gray-700/30 rounded-xl px-6 py-2 text-gray-300 text-sm font-mono">
          Queue Driver (Redis / DB)
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {jobs.map((j, i) => (
          <div key={i} className={`border rounded-xl p-3 ${palette[j.color]}`}>
            <div className="font-semibold text-xs font-mono mb-1.5">{j.category}</div>
            {j.items.map((item, k) => (
              <div key={k} className="text-xs text-gray-400 font-mono truncate">· {item}</div>
            ))}
          </div>
        ))}
      </div>
    </DiagramBox>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export default function Docs() {
  const [active, setActive] = useState('overview');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(NAV.map(n => n.id)));
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Active section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const top = NAV.find(n => n.id === id || n.sub?.some(s => s.id === id));
            if (top) setActive(id);
          }
        });
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    );
    document.querySelectorAll('[data-doc-section]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileOpen(false);
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleExport = () => window.print();

  const filteredNav = search.trim()
    ? NAV.filter(n =>
        n.label.toLowerCase().includes(search.toLowerCase()) ||
        n.sub?.some(s => s.label.toLowerCase().includes(search.toLowerCase()))
      )
    : NAV;

  // ── sidebar ──────────────────────────────────────────────────────────────

  const Sidebar = (
    <div className="flex flex-col h-full bg-[#1b3d31] text-white overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 bg-[#d4a574] rounded-lg flex items-center justify-center shrink-0">
            <BookOpen size={16} className="text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-base leading-tight">AF Home</div>
            <div className="text-[10px] text-white/50 uppercase tracking-widest">Documentation</div>
          </div>
        </div>
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sections…"
            className="w-full bg-white/10 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 outline-none focus:border-[#d4a574]/60 transition-colors"
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10">
        {filteredNav.map(item => {
          const Icon = item.icon;
          const isExpanded = expanded.has(item.id);
          const isActive = active === item.id || item.sub?.some(s => s.id === active);
          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  scrollTo(item.id);
                  if (item.sub) toggleExpand(item.id);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-sm group ${
                  isActive
                    ? 'bg-[#d4a574]/20 text-[#d4a574]'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={14} className="shrink-0" />
                <span className="flex-1 text-xs font-medium">{item.label}</span>
                {item.sub && (
                  <span className="shrink-0 text-white/30">
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </span>
                )}
              </button>

              {/* Sub-items */}
              <AnimatePresence initial={false}>
                {item.sub && isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-5 border-l border-white/10 pl-3 py-1 space-y-0.5">
                      {item.sub.map(s => (
                        <button
                          key={s.id}
                          onClick={() => scrollTo(s.id)}
                          className={`block w-full text-left text-xs px-2 py-1.5 rounded-md transition-colors ${
                            active === s.id
                              ? 'text-[#d4a574] bg-[#d4a574]/10'
                              : 'text-white/50 hover:text-white/80'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Export button */}
      <div className="px-4 pb-5 pt-3 border-t border-white/10 shrink-0">
        <button
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 bg-[#d4a574] hover:bg-[#c4956a] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors print:hidden"
        >
          <Download size={15} />
          Export as PDF
        </button>
        <p className="text-center text-white/30 text-[10px] mt-2">
          Use browser print dialog → Save as PDF
        </p>
      </div>
    </div>
  );

  // ── content ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .doc-sidebar { display: none !important; }
          .doc-mobile-bar { display: none !important; }
          .doc-main { margin-left: 0 !important; }
          .print\\:hidden { display: none !important; }
          [data-doc-section] { break-before: page; }
          [data-doc-section]:first-child { break-before: avoid; }
        }
      `}</style>

      <div className="flex min-h-screen bg-[#faf8f5]">
        {/* Desktop sidebar */}
        <aside className="doc-sidebar fixed top-0 left-0 w-[265px] h-screen z-40 hidden lg:block print:hidden">
          {Sidebar}
        </aside>

        {/* Mobile top bar */}
        <div className="doc-mobile-bar lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#1b3d31] px-4 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#d4a574] rounded-lg flex items-center justify-center">
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="font-display font-bold text-white text-sm">AF Home Docs</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="text-white p-1">
            <Search size={18} />
          </button>
        </div>

        {/* Mobile sidebar drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              />
              <motion.aside
                initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed top-0 left-0 w-[265px] h-screen z-50 lg:hidden"
              >
                {Sidebar}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main
          ref={contentRef}
          className="doc-main flex-1 lg:ml-[265px] pt-16 lg:pt-0 min-h-screen"
        >
          <div className="max-w-4xl mx-auto px-6 py-12 space-y-0">

            {/* ── 1. PROJECT OVERVIEW ───────────────────────────────────────── */}
            <section id="overview" data-doc-section className="mb-12">
              <div className="mb-6">
                <Badge label="System Overview" color="green" />
                <SectionTitle id="overview">Project Overview</SectionTitle>
                <p className="text-gray-600 leading-relaxed">
                  AF Home is a full-stack e-commerce and member platform for furniture and home products,
                  built with Next.js and Laravel. The system spans three connected applications sharing a
                  single authentication backend.
                </p>
              </div>

              <div id="overview-apps" data-doc-section className="scroll-mt-20">
                <SubTitle>Connected Applications</SubTitle>
                <InfoTable
                  headers={['Application', 'Domain', 'Role', 'Auth Strategy']}
                  rows={[
                    ['Apsara Home (Frontend)', 'app.afhome.com', 'Main e-commerce platform', 'NextAuth + Sanctum (4 actors)'],
                    ['Dreambuild Landing Page', 'dreambuild.afhome.com', 'Brand / portfolio entry point', 'Redirects to Apsara Home login'],
                    ['AF Nexus (Planned)', 'nexus.afhome.com', 'Community + chat + learning', 'Validates via GET /api/customer/me'],
                  ]}
                />
                <Note type="info">
                  All three apps share the <strong>.afhome.com</strong> cookie domain so the NextAuth session
                  cookie issued by Apsara Home is accessible on every subdomain — no second login required.
                </Note>
              </div>

              <div id="overview-frontend" data-doc-section className="scroll-mt-20 mt-8">
                <SubTitle>Frontend Summary</SubTitle>
                <InfoTable
                  headers={['Layer', 'Technology']}
                  rows={[
                    ['Framework', 'Next.js App Router — React 19, TypeScript strict mode'],
                    ['Auth', 'NextAuth v4 — 4 separate session configs (customer, admin, supplier, partner)'],
                    ['State / API', 'Redux Toolkit + RTK Query for all Laravel API communication'],
                    ['Styling', 'Tailwind CSS v4 + HeroUI component styles'],
                    ['Animation', 'Framer Motion'],
                    ['Icons', 'Lucide React'],
                    ['Charts', 'Recharts (admin dashboard)'],
                    ['Rich Text', 'Tiptap (CMS content editor)'],
                    ['Uploads', 'Cloudinary via protected Next.js API route handlers'],
                    ['Real-time', 'Laravel Echo + Pusher (customer/admin chat)'],
                    ['PWA', 'Serwist service worker integration'],
                  ]}
                />
                <SubTitle>NextAuth Actor Sessions</SubTitle>
                <InfoTable
                  headers={['Actor', 'Config File', 'Session Route', 'Cookie Scope']}
                  rows={[
                    ['Customer', 'libs/auth.ts', '/api/auth/session', 'Global (/)'],
                    ['Admin', 'libs/adminAuth.ts', '/api/admin/auth/session', '/admin'],
                    ['Supplier', 'libs/supplierAuth.ts', '/api/supplier/auth/session', '/supplier'],
                    ['Partner', 'libs/partnerAuth.ts', '/api/partner/auth/session', '/partner'],
                  ]}
                />
              </div>

              <div id="overview-backend" data-doc-section className="scroll-mt-20 mt-8">
                <SubTitle>Backend Summary</SubTitle>
                <InfoTable
                  headers={['Layer', 'Technology']}
                  rows={[
                    ['Framework', 'Laravel 12 — API-first (routes/web.php returns only welcome view)'],
                    ['Auth', 'Sanctum bearer tokens — one token type per actor per device'],
                    ['Database', 'PostgreSQL (Neon) — legacy tbl_* table naming preserved'],
                    ['Real-time', 'Pusher — broadcasting auth at /broadcasting/auth'],
                    ['Payments', 'PayMongo — checkout sessions + inbound webhook validation'],
                    ['Shipping', 'J&T Express + XDE Logistics — waybill + tracking'],
                    ['Media', 'Cloudinary — image/file upload and storage'],
                    ['AI', 'Gemini + OpenAI — support chat, vision embeddings, product assistant'],
                    ['Queue', 'Redis-backed queue — payment, shipping, AI, import, finance jobs'],
                    ['Bot protection', 'Cloudflare Turnstile — auth and contact endpoints'],
                  ]}
                />
                <SubTitle>Backend Route Audiences</SubTitle>
                <InfoTable
                  headers={['Audience', 'Middleware Required']}
                  rows={[
                    ['Public reads', 'Rate limit (reads) only'],
                    ['Customer', 'auth:sanctum · customer.actor'],
                    ['Admin', 'auth:sanctum · admin.token.validation · admin.role:<role>'],
                    ['Supplier', 'auth:sanctum · supplier.actor'],
                    ['Partner', 'auth:sanctum · admin.token.validation'],
                    ['Webhooks', 'Webhook signature validation (no Sanctum)'],
                  ]}
                />
              </div>

              <div id="overview-commands" data-doc-section className="scroll-mt-20 mt-8">
                <SubTitle>Runtime Commands</SubTitle>
                <CodeBlock lang="bash" code={`# Frontend
cd Apsara-Home-Frontend
pnpm install
pnpm dev        # development server
pnpm build      # production build
pnpm lint       # ESLint
pnpm test       # Vitest

# Backend
cd Apsara-Home-Backend
composer install
php artisan migrate
php artisan serve
php artisan test

# Production — additional workers needed
php artisan queue:work --queue=high,default,low
php artisan schedule:run   # via cron every minute`} />
                <SubTitle>Key Environment Variables</SubTitle>
                <CodeBlock lang="env" code={`# Frontend (.env.local)
NEXTAUTH_URL=https://app.afhome.com
NEXTAUTH_SECRET=<secret — same across all apps sharing .afhome.com>
LARAVEL_API_URL=https://api.afhome.com
NEXT_PUBLIC_LARAVEL_API_URL=https://api.afhome.com
NEXT_PUBLIC_PUSHER_APP_KEY=<key>
NEXT_PUBLIC_PUSHER_CLUSTER=<cluster>
CLOUDINARY_CLOUD_NAME=<name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>

# Backend (.env)
APP_URL=https://api.afhome.com
DATABASE_URL=postgresql://...
SANCTUM_STATEFUL_DOMAINS=app.afhome.com,nexus.afhome.com,dreambuild.afhome.com
PUSHER_APP_ID=<id>
PUSHER_APP_KEY=<key>
PUSHER_APP_SECRET=<secret>
PAYMONGO_SECRET_KEY=<key>
PAYMONGO_PUBLIC_KEY=<key>
CLOUDINARY_URL=cloudinary://...
OPENAI_API_KEY=<key>
GEMINI_API_KEY=<key>`} />
              </div>
            </section>

            <Divider />

            {/* ── 2. ARCHITECTURE ───────────────────────────────────────────── */}
            <section id="architecture" data-doc-section className="mb-12">
              <div className="mb-6">
                <Badge label="Architecture" color="blue" />
                <SectionTitle id="architecture">Architecture</SectionTitle>
                <p className="text-gray-600 leading-relaxed">
                  System is split into a Next.js frontend and a Laravel API backend.
                  RTK Query resolves the correct actor session and attaches bearer tokens to all API requests.
                  External services are orchestrated through Laravel service classes and queued jobs.
                </p>
              </div>

              <div id="arch-system" data-doc-section className="scroll-mt-20">
                <SubTitle>System Overview</SubTitle>
                <SystemOverviewDiagram />
              </div>

              <div id="arch-auth" data-doc-section className="scroll-mt-20">
                <SubTitle>Auth Architecture</SubTitle>
                <AuthDiagram />
                <SubTitle>Auth Capabilities per Actor</SubTitle>
                <InfoTable
                  headers={['Actor', 'Login Methods', 'Session Data']}
                  rows={[
                    ['Customer', 'Credentials · OTP · MFA · Passkey · Google · Facebook', 'Profile · passkeys · TOTP · socials · sessions · snapshot'],
                    ['Admin', 'Credentials · OTP · logout · me', 'Role · permissions · storefronts · supplier ID · ban status · timeout'],
                    ['Supplier', 'Credentials · OTP · logout · me', 'Company · accessible products · orders · categories'],
                    ['Partner', 'Via admin middleware', 'Storefront slug · role · allowed webpages'],
                  ]}
                />
              </div>

              <div id="arch-api" data-doc-section className="scroll-mt-20">
                <SubTitle>API Request Flow</SubTitle>
                <DiagramBox title="api request sequence" className="mb-4">
                  {[
                    ['Browser', 'Interacts with UI'],
                    ['Next.js page', 'RTK Query starts API request'],
                    ['NextAuth session route', 'Resolve actor session → return accessToken'],
                    ['RTK Query', 'HTTP JSON with Authorization: Bearer <token>'],
                    ['Middleware chain', 'Sanctum → actor → role → rate limit'],
                    ['Controller', 'Request parsed · validated · service called'],
                    ['Service → Model', 'Domain logic → Eloquent → PostgreSQL'],
                    ['Response', 'JSON → RTK cache → UI update'],
                  ].map(([actor, action], i) => (
                    <div key={i} className="flex items-center gap-3 mb-1.5">
                      <div className="w-36 text-right text-xs font-mono text-[#d4a574] shrink-0">{actor}</div>
                      <ArrowRight size={14} className="text-gray-600 shrink-0" />
                      <div className="flex-1 text-xs text-gray-300 font-mono bg-gray-800/30 px-3 py-1.5 rounded-lg">{action}</div>
                    </div>
                  ))}
                </DiagramBox>
              </div>

              <div id="arch-middleware" data-doc-section className="scroll-mt-20">
                <SubTitle>Middleware Chain</SubTitle>
                <MiddlewareDiagram />
              </div>

              <div id="arch-payment" data-doc-section className="scroll-mt-20">
                <SubTitle>Payment Flow (PayMongo)</SubTitle>
                <PaymentFlowDiagram />
                <Note type="warning">
                  Always validate the PayMongo webhook signature before processing a payment event.
                  Never update order status without signature verification.
                </Note>
              </div>

              <div id="arch-realtime" data-doc-section className="scroll-mt-20">
                <SubTitle>Real-time Chat (Pusher)</SubTitle>
                <DiagramBox title="pusher real-time flow" className="mb-4">
                  {[
                    ['Customer browser', 'Opens support chat → subscribes to private-conversation.<id>'],
                    ['Pusher', 'POST /broadcasting/auth with Sanctum token → Laravel authorizes channel'],
                    ['Customer', 'POST /api/conversations/message'],
                    ['Laravel', 'Trigger new-message event on Pusher channel'],
                    ['Admin browser', 'Receives new-message event in real-time'],
                    ['Admin', 'POST /api/admin/conversations/reply'],
                    ['Laravel', 'Trigger new-message event → Customer browser receives reply'],
                  ].map(([actor, action], i) => (
                    <div key={i} className="flex items-start gap-3 mb-1.5">
                      <div className="w-36 text-right text-xs font-mono text-pink-400 shrink-0 pt-1.5">{actor}</div>
                      <ArrowRight size={14} className="text-gray-600 shrink-0 mt-1.5" />
                      <div className="flex-1 text-xs text-gray-300 font-mono bg-gray-800/30 px-3 py-1.5 rounded-lg">{action}</div>
                    </div>
                  ))}
                </DiagramBox>
              </div>

              <div id="arch-queue" data-doc-section className="scroll-mt-20">
                <SubTitle>Queue &amp; Job System</SubTitle>
                <QueueDiagram />
              </div>

              <div id="arch-db" data-doc-section className="scroll-mt-20">
                <SubTitle>Database Groups</SubTitle>
                <DBGroupsDiagram />
                <SubTitle>Legacy Primary Keys</SubTitle>
                <InfoTable
                  headers={['Table', 'Primary Key', 'Column Prefix']}
                  rows={[
                    ['tbl_customer', 'c_userid', 'c_'],
                    ['tbl_product', 'pd_id', 'pd_'],
                    ['tbl_checkout_history', 'ch_id + ch_checkout_id', 'ch_'],
                    ['tbl_supplier', 's_id', 's_'],
                    ['tbl_supplier_user', 'su_id', 'su_'],
                    ['tbl_admin', 'id', 'none'],
                    ['personal_access_tokens', 'Laravel default', 'Sanctum tokens for all actors'],
                  ]}
                />
                <Note type="warning">
                  Never rename legacy <code className="bg-gray-100 px-1 rounded text-sm">tbl_*</code> columns
                  casually. Add new columns via additive migrations only.
                </Note>
              </div>

              <div id="arch-security" data-doc-section className="scroll-mt-20">
                <SubTitle>Security Controls</SubTitle>
                <InfoTable
                  headers={['Control', 'Implementation']}
                  rows={[
                    ['Bearer tokens', 'Sanctum — one token per actor per device, stored in personal_access_tokens'],
                    ['Session cookies', 'HTTP-only NextAuth cookies — separate per actor (customer/admin/supplier/partner)'],
                    ['Role enforcement', 'admin.role:* middleware — narrowest viable role set per route'],
                    ['Rate limits', 'Per endpoint type: auth · OTP · checkout · webhooks · reads · writes · uploads'],
                    ['Bot protection', 'Cloudflare Turnstile on auth and contact routes'],
                    ['Upload validation', 'File type + size check in Next.js route handlers before Cloudinary upload'],
                    ['Webhook validation', 'PayMongo signature verified before any order state change'],
                    ['Account guards', 'Banned/deleted check on session middleware + frontend overlay'],
                    ['Abuse guard', 'Custom middleware blocks suspicious request patterns'],
                  ]}
                />
              </div>
            </section>

            <Divider />

            {/* ── 3. INTEGRATIONS ───────────────────────────────────────────── */}
            <section id="integrations" data-doc-section className="mb-12">
              <div className="mb-6">
                <Badge label="External Services" color="purple" />
                <SectionTitle id="integrations">Integrations</SectionTitle>
              </div>
              <InfoTable
                headers={['Integration', 'Purpose', 'Key Env Variable']}
                rows={[
                  ['PayMongo', 'Checkout session creation · webhook processing · payment reconciliation', 'PAYMONGO_SECRET_KEY'],
                  ['J&T Express', 'Waybill generation · shipment tracking', 'JNT_API_KEY'],
                  ['XDE Logistics', 'Waybill generation · shipment tracking', 'XDE_API_KEY'],
                  ['Cloudinary', 'Image and file upload / storage / transformations', 'CLOUDINARY_URL'],
                  ['Pusher', 'Real-time customer/admin chat channels · broadcasting', 'PUSHER_APP_SECRET'],
                  ['Google Drive', 'Product import/export file backup', 'GOOGLE_DRIVE_CREDENTIALS'],
                  ['Google Sheets', 'Product data import/export pipelines', 'Via Drive credentials'],
                  ['Gemini', 'AI support · vision embeddings · product search assistant', 'GEMINI_API_KEY'],
                  ['OpenAI', 'Supplementary AI features', 'OPENAI_API_KEY ⚠ rotate'],
                  ['ZQ Sync', 'External product and order synchronization service', 'ZQ_API_KEY'],
                  ['Cloudflare Turnstile', 'Bot protection on auth and contact endpoints', 'TURNSTILE_SECRET'],
                  ['Neon (PostgreSQL)', 'Production database with connection pooling', 'DATABASE_URL'],
                ]}
              />
              <Note type="danger">
                <strong>Action required:</strong> The <code>OPENAI_API_KEY</code> value in
                <code> Apsara-Home-Backend/.env.example</code> appears to be a real key.
                Rotate it immediately and replace with a placeholder.
              </Note>
            </section>

            <Divider />

            {/* ── 4. CODE STANDARDS ─────────────────────────────────────────── */}
            <section id="code-standards" data-doc-section className="mb-12">
              <div className="mb-6">
                <Badge label="Standards" color="amber" />
                <SectionTitle id="code-standards">Code Standards</SectionTitle>
              </div>

              <div id="cs-frontend" data-doc-section className="scroll-mt-20">
                <SubTitle>Frontend Standards</SubTitle>
                <InfoTable
                  headers={['Rule', 'Detail']}
                  rows={[
                    ['Imports', 'Absolute via @/* — never relative across feature boundaries'],
                    ['API calls', 'RTK Query endpoint modules in store/api/*.ts — direct fetch only for server components'],
                    ['Auth', 'Always read session via NextAuth useSession() — never localStorage or cookies directly'],
                    ['Bearer token', 'Attached via prepareHeaders in RTK Query baseApi — never manually'],
                    ['Uploads', 'Must go through protected /api/*/upload route handlers with role + type + size check'],
                    ['Route files', 'Keep app/ files thin — delegate to features/'],
                    ['Global state', 'Redux slices for UI state only — API data lives in RTK Query cache'],
                    ['New providers', 'Only add to Providers.tsx if state is genuinely app-wide'],
                  ]}
                />
              </div>

              <div id="cs-backend" data-doc-section className="scroll-mt-20">
                <SubTitle>Backend Standards</SubTitle>
                <InfoTable
                  headers={['Layer', 'Responsibility']}
                  rows={[
                    ['Controllers', 'Request parsing · Form Request validation · service call · response formatting'],
                    ['Services', 'Business logic · external integrations · complex workflows'],
                    ['Models', 'Eloquent relationships · casts · scopes — no raw queries in controllers'],
                    ['Form Requests', 'All write endpoint validation — never validate in controller directly'],
                    ['Resources', 'Stable API response contracts — use for public-facing endpoints'],
                    ['Jobs', 'All slow/external operations — payments, shipping, AI, notifications, finance'],
                    ['Middleware', 'Apply narrowest viable middleware set per route group'],
                  ]}
                />
                <Note type="warning">
                  Never bypass <code className="bg-amber-50 px-1 rounded">admin.token.validation</code> middleware.
                  Never weaken rate limits to make a feature work.
                </Note>
              </div>

              <div id="cs-database" data-doc-section className="scroll-mt-20">
                <SubTitle>Database Standards</SubTitle>
                <InfoTable
                  headers={['Rule', 'Detail']}
                  rows={[
                    ['Legacy naming', 'Never rename tbl_* tables or prefixed columns — additive migrations only'],
                    ['New tables', 'Match surrounding context naming — define explicit foreign keys'],
                    ['Indexes', 'Add for all common filters · joins · status dashboards · search endpoints'],
                    ['Model casts', 'Cast JSON · boolean · money/decimal · datetime fields in the model'],
                    ['New columns', 'Always via new migration file — never edit a committed migration'],
                  ]}
                />
              </div>

              <div id="cs-testing" data-doc-section className="scroll-mt-20">
                <SubTitle>Testing Standards</SubTitle>
                <p className="text-gray-600 text-sm mb-4">
                  Always add or update tests when changing these critical areas:
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    'Auth and role middleware',
                    'Checkout and payment flow',
                    'PayMongo webhooks',
                    'Shipping and order status',
                    'Wallet / encashment / finance',
                    'Customer data deletion/bans',
                    'MFA / OTP / passkeys',
                    'Product import/export/sync',
                    'RTK Query shared endpoints',
                    'Admin role gates',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2">
                      <CheckSquare size={13} className="text-[#2c5f4f] shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <CodeBlock lang="bash" code={`# Run before merging
cd Apsara-Home-Frontend && pnpm lint && pnpm test
cd Apsara-Home-Backend && php artisan test

# Before production deploy
cd Apsara-Home-Frontend && pnpm build`} />
              </div>

              <div id="cs-secrets" data-doc-section className="scroll-mt-20">
                <SubTitle>Environment &amp; Secrets</SubTitle>
                <InfoTable
                  headers={['Rule']}
                  rows={[
                    ['.env.example files must contain placeholder values only — never real keys'],
                    ['NEXTAUTH_SECRET must be identical across all apps sharing the .afhome.com cookie domain'],
                    ['SANCTUM_STATEFUL_DOMAINS must include app, dreambuild, and nexus subdomains'],
                    ['Only expose browser-safe values via NEXT_PUBLIC_ prefix'],
                    ['LARAVEL_API_URL is server-only — NEXT_PUBLIC_LARAVEL_API_URL for browser calls'],
                    ['Rotate any key that has appeared in source control immediately'],
                  ]}
                />
              </div>
            </section>

            <Divider />

            {/* ── 5. UI CONTEXT ─────────────────────────────────────────────── */}
            <section id="ui-context" data-doc-section className="mb-12">
              <div className="mb-6">
                <Badge label="UI" color="blue" />
                <SectionTitle id="ui-context">UI Context</SectionTitle>
              </div>

              <div id="ui-tokens" data-doc-section className="scroll-mt-20">
                <SubTitle>Design Tokens</SubTitle>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {[
                    { name: '--af-cream', value: '#faf8f5', label: 'Cream (bg)' },
                    { name: '--af-forest', value: '#2c5f4f', label: 'Forest (primary)' },
                    { name: '--af-brass', value: '#d4a574', label: 'Brass (accent)' },
                    { name: '--af-text', value: '#1a1a1a', label: 'Text (dark)' },
                    { name: '--af-text-secondary', value: '#6b6b6b', label: 'Text (muted)' },
                  ].map(token => (
                    <div key={token.name} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="h-10" style={{ backgroundColor: token.value }} />
                      <div className="p-2.5">
                        <div className="text-xs font-semibold text-gray-800">{token.label}</div>
                        <div className="text-xs font-mono text-gray-500">{token.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <InfoTable
                  headers={['Class', 'Font', 'Usage']}
                  rows={[
                    ['.font-display', 'Fraunces', 'Editorial headings · product names · hero sections'],
                    ['.font-body', 'Manrope', 'Body text · descriptions'],
                    ['default', 'Plus Jakarta Sans', 'All UI text · configured via --font-poppins'],
                  ]}
                />
              </div>

              <div id="ui-stack" data-doc-section className="scroll-mt-20">
                <SubTitle>UI Stack</SubTitle>
                <InfoTable
                  headers={['Library', 'Purpose']}
                  rows={[
                    ['HeroUI (@heroui/react)', 'Primary component system — buttons, inputs, modals, etc.'],
                    ['Tailwind CSS v4', 'Utility-first styling with @tailwindcss/typography'],
                    ['Framer Motion', 'Page transitions · animated states · carousels · hover effects'],
                    ['Lucide React', 'Icon set — consistent across all pages'],
                    ['Recharts', 'Dashboard charts in admin/supplier console'],
                    ['Tiptap', 'Rich text editor for CMS content management'],
                    ['react-hot-toast', 'Global toast notifications'],
                  ]}
                />
              </div>

              <div id="ui-routes" data-doc-section className="scroll-mt-20">
                <SubTitle>Route Areas</SubTitle>
                <InfoTable
                  headers={['Route', 'Area', 'Purpose']}
                  rows={[
                    ['/', 'Public', 'Home — hero, featured products, promotions'],
                    ['/shop', 'Public', 'Product catalog with filter/sort'],
                    ['/product/[slug]', 'Public', 'Product detail — variants, reviews, add to cart'],
                    ['/login', 'Customer', 'Login — credentials · OTP · social · passkey'],
                    ['/profile', 'Customer', 'Profile · passkeys · sessions · TOTP'],
                    ['/orders', 'Customer', 'Order history and tracking'],
                    ['/checkout', 'Customer', 'Checkout flow — address, shipping, payment'],
                    ['/admin/dashboard', 'Admin', 'Sales and operations overview'],
                    ['/admin/products', 'Admin', 'Product catalog management'],
                    ['/admin/orders', 'Admin', 'Order management and approval'],
                    ['/admin/payments', 'Admin', 'Payment records and PayMongo sync'],
                    ['/admin/finance', 'Admin', 'Encashment, wallet, commissions'],
                    ['/admin/chat', 'Admin', 'Customer support chat (Pusher)'],
                    ['/supplier/*', 'Supplier', 'Supplier products · orders · reports'],
                    ['/partner/*', 'Partner', 'Partner storefront admin + content editor'],
                  ]}
                />
              </div>

              <div id="ui-components" data-doc-section className="scroll-mt-20">
                <SubTitle>Component Organization</SubTitle>
                <InfoTable
                  headers={['Directory', 'Contents']}
                  rows={[
                    ['components/layout/', 'Header · footer · navigation · sidebar'],
                    ['components/ui/', 'Generic primitives — HeroUI wrappers · modals · cards'],
                    ['components/ui/buttons/', 'Button variants (primary · ghost · icon)'],
                    ['components/product/', 'Product cards · gallery · variant selectors · reviews'],
                    ['components/checkout/', 'Checkout steps · address form · payment section'],
                    ['components/admin/', 'Admin console feature components'],
                    ['components/superAdmin/', 'Super admin components'],
                    ['components/supplier/', 'Supplier console feature components'],
                    ['components/profile/', 'Customer profile sections'],
                    ['components/ai-support/', 'AI support chat widget'],
                  ]}
                />
              </div>
            </section>

            <Divider />

            {/* ── 6. PROGRESS TRACKER ───────────────────────────────────────── */}
            <section id="progress" data-doc-section className="mb-12">
              <div className="mb-6">
                <Badge label="Progress" color="amber" />
                <SectionTitle id="progress">Progress Tracker</SectionTitle>
              </div>

              <div id="progress-remediation" data-doc-section className="scroll-mt-20">
                <SubTitle>Immediate Remediation Tasks</SubTitle>
                <InfoTable
                  headers={['Priority', 'Task', 'Status']}
                  rows={[
                    [<Badge key="c" label="Critical" color="red" />, 'Rotate OpenAI key in .env.example and replace with placeholder', 'Not started'],
                    [<Badge key="h1" label="High" color="amber" />, 'Remove hardcoded local API URLs from production route handlers', 'Not started'],
                    [<Badge key="h2" label="High" color="amber" />, 'Decide on typescript.ignoreBuildErrors: true — fix type errors and disable', 'Not started'],
                    [<Badge key="h3" label="High" color="amber" />, 'Verify PayMongo webhook signature validation is active', 'Not started'],
                    [<Badge key="m1" label="Medium" color="blue" />, 'Normalize repeated direct fetch calls into RTK Query endpoints', 'Not started'],
                    [<Badge key="m2" label="Medium" color="blue" />, 'Expand backend tests: payment · shipping · order status · role gates', 'Not started'],
                    [<Badge key="m3" label="Medium" color="blue" />, 'Document production PostgreSQL/Neon env variables', 'Not started'],
                    [<Badge key="m4" label="Medium" color="blue" />, 'Confirm all upload endpoints verify session + role before accepting files', 'Not started'],
                  ]}
                />
              </div>

              <div id="progress-integration" data-doc-section className="scroll-mt-20">
                <SubTitle>Planned Integration Tasks</SubTitle>
                <p className="text-sm text-gray-600 font-semibold mb-2">Dreambuild → Apsara Home</p>
                <InfoTable
                  headers={['Task', 'Status']}
                  rows={[
                    ['Add ?redirect=<url> support to /login page', 'Not started'],
                    ['Add interior design lead endpoint: POST /api/interior-service-leads', 'Not started'],
                    ['Set SANCTUM_STATEFUL_DOMAINS to include dreambuild.afhome.com', 'Not started'],
                    ['Set NextAuth cookie domain to .afhome.com for cross-subdomain session sharing', 'Not started'],
                  ]}
                />
                <p className="text-sm text-gray-600 font-semibold mb-2 mt-4">AF Nexus Auth Bridge</p>
                <InfoTable
                  headers={['Task', 'Status']}
                  rows={[
                    ['Verify GET /api/customer/me returns id, name, email, tier, status', 'Not started'],
                    ['Add nexus.afhome.com to SANCTUM_STATEFUL_DOMAINS', 'Not started'],
                    ['Confirm banned/deleted status is included in /api/customer/me response', 'Not started'],
                    ['Rate limit /api/customer/me for external consumers', 'Not started'],
                  ]}
                />
              </div>

              <div id="progress-next-docs" data-doc-section className="scroll-mt-20">
                <SubTitle>Suggested Next Documentation</SubTitle>
                <InfoTable
                  headers={['Document', 'Purpose']}
                  rows={[
                    ['api-reference.md', 'All routes from routes/api.php grouped by public/customer/admin/supplier'],
                    ['database-map.md', 'Table-by-table schema notes from migrations — legacy key mapping'],
                    ['payments.md', 'PayMongo checkout flow · webhook handling · order states · reconciliation'],
                    ['shipping.md', 'J&T and XDE integration · waybill · tracking sync · rate calculation'],
                    ['security.md', 'Auth flows · rate limits · role gates · secret handling · incident response'],
                    ['affiliate.md', 'Referral · wallet · encashment · member tiers · bonus awards'],
                    ['deployment.md', 'Env vars · build/start commands · queues · cache · third-party setup'],
                  ]}
                />
              </div>
            </section>

            <Divider />

            {/* ── 7. FOLDER STRUCTURE ───────────────────────────────────────── */}
            <section id="folder-structure" data-doc-section className="mb-12">
              <div className="mb-6">
                <Badge label="Structure" color="green" />
                <SectionTitle id="folder-structure">Folder Structure</SectionTitle>
              </div>

              <div id="fs-frontend" data-doc-section className="scroll-mt-20">
                <SubTitle>Frontend (Apsara-Home-Frontend)</SubTitle>
                <CodeBlock lang="text" code={`Apsara-Home-Frontend/
├── app/
│   ├── (public)/           ← unauthenticated storefront routes
│   ├── (customer)/         ← authenticated customer routes
│   ├── admin/              ← admin console routes
│   ├── supplier/           ← supplier console routes
│   ├── partner/            ← partner storefront routes
│   └── api/
│       ├── auth/           ← NextAuth customer session
│       ├── admin/auth/     ← NextAuth admin session
│       ├── supplier/auth/  ← NextAuth supplier session
│       ├── partner/auth/   ← NextAuth partner session
│       ├── upload/         ← Cloudinary protected upload handlers
│       └── revalidate/     ← Cache revalidation handlers
├── features/
│   ├── auth/               ← session helpers, redirect logic
│   ├── catalog/            ← product, category, brand, search
│   ├── checkout/           ← cart, checkout steps, payment
│   ├── orders/             ← order history, tracking
│   ├── profile/            ← profile, passkeys, sessions, TOTP
│   ├── affiliate/          ← referral, wallet, encashment
│   └── ai-support/         ← AI chat widget
├── components/
│   ├── layout/             ← header, footer, navigation
│   ├── ui/                 ← generic primitives
│   │   └── buttons/        ← button variants
│   └── shared/             ← cross-feature shared components
├── store/
│   ├── api/                ← RTK Query endpoint modules per domain
│   ├── slices/             ← Redux Toolkit UI slices (non-API state)
│   └── store.ts            ← store setup
├── libs/
│   ├── auth.ts             ← customer NextAuth config
│   ├── adminAuth.ts        ← admin NextAuth config
│   ├── supplierAuth.ts     ← supplier NextAuth config
│   └── partnerAuth.ts      ← partner NextAuth config
├── hooks/                  ← shared custom React hooks
├── context/                ← CartProvider, WishlistProvider
├── types/                  ← shared TypeScript types
└── public/                 ← images, PWA assets, icons`} />
              </div>

              <div id="fs-backend" data-doc-section className="scroll-mt-20">
                <SubTitle>Backend (Apsara-Home-Backend)</SubTitle>
                <CodeBlock lang="text" code={`Apsara-Home-Backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/    ← API controllers grouped by actor
│   │   ├── Middleware/     ← all custom middleware
│   │   ├── Requests/       ← Form Request validation classes
│   │   └── Resources/      ← API Resource response classes
│   ├── Models/             ← Eloquent models (tbl_* naming preserved)
│   ├── Services/           ← integration and business logic services
│   ├── Jobs/               ← queued background jobs
│   ├── Events/             ← Laravel events
│   └── Listeners/          ← event listeners
├── routes/
│   └── api.php             ← all API routes (split by domain when large)
├── database/
│   ├── migrations/         ← additive only — never edit committed migrations
│   ├── seeders/            ← dev seed data
│   └── factories/          ← model factories for testing
└── tests/
    ├── Feature/            ← feature tests per domain
    └── Unit/               ← unit tests for services and helpers`} />
              </div>
            </section>

            <Divider />

            {/* ── 8. AI WORKFLOW RULES ──────────────────────────────────────── */}
            <section id="ai-rules" data-doc-section className="mb-16">
              <div className="mb-6">
                <Badge label="AI Rules" color="gray" />
                <SectionTitle id="ai-rules">AI Workflow Rules</SectionTitle>
                <p className="text-gray-600 leading-relaxed">
                  Rules for AI-assisted development on this codebase. Follow these to avoid
                  inventing features, breaking auth boundaries, or flattening the project into a generic template.
                </p>
              </div>

              <div id="ai-grounding" data-doc-section className="scroll-mt-20">
                <SubTitle>Grounding Rules</SubTitle>
                <div className="space-y-3 mb-6">
                  {[
                    ['Inspect first', 'Read the relevant files before proposing any architecture change or code.'],
                    ['No invention', 'Do not invent database tables, API routes, roles, or UI flows. If planned but not implemented, label as planned.'],
                    ['Preserve actor boundaries', 'Keep customer/admin/supplier/partner behavior separated — no cross-actor shortcuts.'],
                    ['Preserve legacy naming', 'Do not rename tbl_* columns or tables — add new columns via migrations only.'],
                    ['Dreambuild is read-only', 'Dreambuild does not own auth or data. Do not add login UI or API auth logic to it.'],
                    ['AF Nexus is an auth consumer', 'AF Nexus validates via /api/customer/me only. Do not issue new token types for it.'],
                    ['Call out uncertainty', 'If a route, model, or component is inferred (not confirmed by reading), say so.'],
                  ].map(([title, desc], i) => (
                    <div key={i} className="flex gap-3 bg-white border border-gray-200 rounded-xl p-4">
                      <div className="w-2 h-2 rounded-full bg-[#2c5f4f] mt-1.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-sm text-gray-900">{title} — </span>
                        <span className="text-sm text-gray-600">{desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div id="ai-security" data-doc-section className="scroll-mt-20">
                <SubTitle>Security Rules</SubTitle>
                <div className="space-y-2">
                  {[
                    'Never echo or preserve real secrets from env files in generated output.',
                    'If a committed secret is found, report it as a rotation task — do not work around it.',
                    'Do not weaken rate limits or middleware to make a feature work.',
                    'Do not bypass admin.token.validation for any admin endpoint.',
                    'Do not move Cloudinary, PayMongo, Google, or AI keys into NEXT_PUBLIC_* env vars.',
                    'Always validate PayMongo webhook signatures before processing payment events.',
                    'Keep upload endpoints behind session and role checks — never allow unauthenticated uploads.',
                  ].map((rule, i) => (
                    <div key={i} className="flex gap-2 items-start text-sm text-gray-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                      <Lock size={13} className="text-red-500 mt-0.5 shrink-0" />
                      {rule}
                    </div>
                  ))}
                </div>
              </div>

              <div id="ai-highrisk" data-doc-section className="scroll-mt-20">
                <SubTitle>High-Risk Areas</SubTitle>
                <Note type="danger">
                  Read ALL related files before editing any of the areas below. Mistakes here can cause
                  financial errors, auth bypasses, or data loss in production.
                </Note>
                <InfoTable
                  headers={['Area', 'Risk']}
                  rows={[
                    ['PayMongo checkout + webhooks', 'Order state corruption · double-processing · missed payments'],
                    ['Order approval + status transitions', 'Irreversible state changes affecting shipping and finance'],
                    ['ZQ product/order sync', 'External system data drift · duplicate records'],
                    ['Encashment · wallet · referral · bonuses', 'Financial calculation errors · incorrect payouts'],
                    ['Admin role + permission changes', 'Privilege escalation'],
                    ['Customer MFA · OTP · TOTP · passkeys · session revoke', 'Auth bypass · account takeover'],
                    ['Upload endpoints and media handling', 'Unauthorized file access · type confusion attacks'],
                    ['Migrations: tbl_customer · tbl_product · tbl_checkout_history · personal_access_tokens', 'Data loss · broken foreign key references'],
                  ]}
                />
                <SubTitle>Suggested Work Loop</SubTitle>
                <div className="flex flex-col gap-1">
                  {[
                    'Identify the bounded area (public storefront · customer · admin · supplier · checkout · shipping · finance · support)',
                    'Read frontend route/component + RTK Query endpoint files for that area',
                    'Read Laravel route · controller · service · model · migration files for the same area',
                    'Make the smallest coherent change that achieves the goal',
                    'Run: pnpm lint && pnpm test + php artisan test',
                    'Update progress-tracker.md if a tracked task was completed',
                  ].map((step, i) => (
                    <div key={i} className="flex gap-3 items-start text-sm bg-white border border-gray-200 rounded-xl px-4 py-3">
                      <div className="w-5 h-5 rounded-full bg-[#2c5f4f] text-white text-xs flex items-center justify-center font-semibold shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <span className="text-gray-700">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-8 pb-16 text-center">
              <p className="text-xs text-gray-400">
                AF Home System Documentation · Last updated from docs2/ ·{' '}
                <button onClick={handleExport} className="underline hover:text-gray-600 print:hidden">
                  Export as PDF
                </button>
              </p>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}
