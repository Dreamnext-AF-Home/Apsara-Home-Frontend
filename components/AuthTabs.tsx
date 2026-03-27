'use client';

import { motion} from "framer-motion";

type Mode = 'login' | 'signup';

interface AuthTabsProps {
    mode: Mode
    setMode: (mode: Mode) => void;
}
const AuthTabs = ({ mode, setMode }: AuthTabsProps) => {
  return (
    <div className="flex gap-1 mb-8 bg-white/10 rounded-xl p-1 w-fit mx-auto">
      {(['login', 'signup'] as const).map(tab => (
        <button
            key={tab}
            type="button"
            onClick={() => setMode(tab)}
            className={`relative px-6 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 whitespace-nowrap ${
                mode === tab ? 'text-white' : 'text-white/60 hover:text-white/90'
            }`}
        >
            {mode === tab && (
                <motion.span
                    layoutId="auto-tab"
                    className="absolute inset-0 bg-orange-500 rounded-lg shadow-lg"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
            )}
            <span className="relative z-10">
                {tab === 'login' ? 'Sign In' : 'Sign Up'}
            </span>
        </button>
      ))}
    </div>
  )
}

export default AuthTabs
