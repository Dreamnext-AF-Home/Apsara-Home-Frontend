'use client';

import { motion } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClick: () => void;
  robotSrc: string;
  logoSrc: string;
}

export function AiSupportToggle({ isOpen, onClick, robotSrc, logoSrc }: Props) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? 'Close AI Support' : 'Open AI Support'}
      className="fixed left-5 bottom-[26px] z-[9999] w-[90px] h-[90px] border-0 bg-transparent p-0 cursor-pointer max-[576px]:left-2.5 max-[576px]:bottom-5"
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <motion.img
          src={robotSrc}
          alt="AI Support"
          className="w-[70px] h-[82px] object-contain block relative z-10"
          animate={{ rotate: [0, -13, 12, -10, 8, 0, 0, 0] }}
          transition={{
            duration: 1.9,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.7, 1],
          }}
          style={{ transformOrigin: '60% 78%' }}
        />

        {/* logo bubble */}
        <div className="absolute -right-1.5 -top-2.5 z-20">
          <div className="relative bg-white border-2 border-indigo-200 rounded-2xl shadow-lg shadow-indigo-100 px-1.5 py-1 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="AF" className="w-7 h-5 object-contain" />
            {/* speech bubble tail */}
            <div className="absolute left-2.5 -bottom-[7px] w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-indigo-200 rotate-45" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}
