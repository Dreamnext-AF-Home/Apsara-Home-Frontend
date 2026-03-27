'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAiSupport } from './hooks/useAiSupport';
import { AiSupportPanel } from './AiSupportPanel';
import { AiSupportToggle } from './AiSupportToggle';

const API_BASE = (process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? '').replace(/\/+$/, '');
const LOGO_SRC = `${API_BASE}/Image/af.png`;
const ROBOT_SRC = `${API_BASE}/Image/sir.png`;

// Hide AI support on these pages only
const BLOCKED_PATHS = [
  '/',
  '/landing-page',
  '/admin',
  '/admin-setup',
  '/super_admin',
  '/supplier',
  '/supplier-setup',
  '/login',
];

function useIsAllowed() {
  const pathname = usePathname();
  if (BLOCKED_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'))) return false;
  return true;
}

export function AiSupport() {
  const allowed = useIsAllowed();
  const { status } = useSession();
  const { isOpen, close, toggle, messages, quickReplies, inputValue, setInputValue, send, isLoading } =
    useAiSupport();

  if (!allowed || status === 'loading') return null;

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
