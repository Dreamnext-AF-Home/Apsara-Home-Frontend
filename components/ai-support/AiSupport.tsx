'use client';

import { usePathname } from 'next/navigation';
import { useAiSupport } from './hooks/useAiSupport';
import { AiSupportPanel } from './AiSupportPanel';
import { AiSupportToggle } from './AiSupportToggle';

const API_BASE = (process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? '').replace(/\/+$/, '');
const LOGO_SRC = `${API_BASE}/Image/af.png`;
const ROBOT_SRC = `${API_BASE}/Image/sir.png`;

// Add paths here kung gusto mong lumabas ang AI support
const ALLOWED_PATHS = ['/shop', '/product', '/category', '/by-brand', '/by-room'];

function useIsAllowed() {
  const pathname = usePathname();
  return ALLOWED_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'));
}

export function AiSupport() {
  const allowed = useIsAllowed();
  const { isOpen, close, toggle, messages, quickReplies, inputValue, setInputValue, send, isLoading } =
    useAiSupport();

  if (!allowed) return null;

  return (
    <>
      <AiSupportToggle onClick={toggle} isOpen={isOpen} robotSrc={ROBOT_SRC} logoSrc={LOGO_SRC} />
      <AiSupportPanel
        isOpen={isOpen}
        messages={messages}
        quickReplies={quickReplies}
        inputValue={inputValue}
        isLoading={isLoading}
        logoSrc={LOGO_SRC}
        onClose={close}
        onInputChange={setInputValue}
        onSend={send}
      />
    </>
  );
}
