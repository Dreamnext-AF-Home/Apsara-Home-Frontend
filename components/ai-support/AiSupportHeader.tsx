import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
  logoSrc: string;
}

export function AiSupportHeader({ onClose, logoSrc }: Props) {
  return (
    <div className="relative flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-500 overflow-hidden flex-shrink-0">
      {/* decorative blobs */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/[.07] pointer-events-none" />
      <div className="absolute -bottom-6 left-10 w-16 h-16 rounded-full bg-white/[.05] pointer-events-none" />

      <div className="relative flex items-center gap-3 min-w-0 z-10">
        <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-lg flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="AF" className="w-6 h-6 object-contain rounded-md" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold leading-tight tracking-tight text-white">
            <span className="text-amber-300">A</span>
            <span className="text-cyan-300">F</span>
            Shop AI
          </span>
          <span className="flex items-center gap-1.5 text-[10.5px] text-white/75 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online now
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close chat"
        className="relative z-10 w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white transition-colors duration-150 cursor-pointer"
      >
        <X size={15} strokeWidth={2.5} />
      </button>
    </div>
  );
}
