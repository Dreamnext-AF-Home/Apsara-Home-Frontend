'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { ChatMessage } from './types';
import { AiSupportHeader } from './AiSupportHeader';
import { AiSupportBody } from './AiSupportBody';
import { AiSupportQuickReplies } from './AiSupportQuickReplies';
import { AiSupportFooter } from './AiSupportFooter';

interface Props {
  isOpen: boolean;
  messages: ChatMessage[];
  quickReplies: string[];
  inputValue: string;
  isLoading: boolean;
  logoSrc: string;
  onClose: () => void;
  onInputChange: (v: string) => void;
  onSend: (text: string) => void;
}

export function AiSupportPanel({
  isOpen,
  messages,
  quickReplies,
  inputValue,
  isLoading,
  logoSrc,
  onClose,
  onInputChange,
  onSend,
}: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={[
            'fixed z-[9999] flex flex-col overflow-hidden',
            'bg-white border border-indigo-100/60 rounded-3xl',
            'shadow-2xl shadow-slate-200/60',
            /* desktop */
            'left-[18px] bottom-[126px] w-[370px] h-[580px] max-h-[74vh]',
            /* mobile */
            'max-[576px]:left-2.5 max-[576px]:right-2.5 max-[576px]:bottom-[106px] max-[576px]:w-auto max-[576px]:h-[70vh]',
            'max-w-[calc(100vw-20px)]',
          ].join(' ')}
          style={{ fontFamily: '"Inter", system-ui, -apple-system, sans-serif' }}
        >
          <AiSupportHeader onClose={onClose} logoSrc={logoSrc} />
          <AiSupportBody messages={messages} isLoading={isLoading} />
          <AiSupportQuickReplies items={quickReplies} onSelect={onSend} />
          <AiSupportFooter
            value={inputValue}
            onChange={onInputChange}
            onSend={() => onSend(inputValue)}
            disabled={isLoading}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
