'use client';

import { motion} from "framer-motion";

type Mode = 'login' | 'signup';

interface AuthTabsProps {
    mode: Mode
    setMode: (mode: Mode) => void;
}
const AuthTabs = ({ mode, setMode }: AuthTabsProps) => {
  const tabs: Array<{ id: Mode; label: string }> = [
    { id: 'login', label: 'Sign In' },
    { id: 'signup', label: 'Sign Up' },
  ];

  return (
    <div className="flex w-full gap-1 mb-8 bg-black/10 dark:bg-white/10 rounded-xl p-1">
      {tabs.map(tab => (
        <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            className={`relative flex-1 px-6 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 whitespace-nowrap cursor-pointer ${
                mode === tab.id ? 'text-white' : 'text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white/90'
            }`}
        >
            {mode === tab.id && (
                <motion.span
                    layoutId="auto-tab"
                    className="absolute inset-0 bg-sky-500 rounded-lg shadow-lg"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
            )}
            <span className="relative z-10">
                {tab.label}
            </span>
        </button>
      ))}
    </div>
  )
}

export default AuthTabs
