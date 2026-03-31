'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAiSupport } from './hooks/useAiSupport';
import { AiSupportPanel } from './AiSupportPanel';
import { AiSupportToggle } from './AiSupportToggle';

const API_BASE = (process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? '').replace(/\/+$/, '');
const LOGO_SRC = `${API_BASE}/Image/af.png`;
const ROBOT_SRC = `${API_BASE}/Image/sir.png`;

const DISABLED_PREFIXES = [
  '/admin',
  '/supplier',
  '/loading',
  '/interior-services',
  '/login',
  '/checkout',
  '/orders',
  '/track-order',
  '/verification',
];

function useIsAllowed() {
  const pathname = usePathname();
  if (pathname === '/') return false;
  return !DISABLED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
}

function useIsLoadingScreenVisible() {
  const [isLoadingScreenVisible, setIsLoadingScreenVisible] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsLoadingScreenVisible(Boolean(document.getElementById('af-loading-screen')));
    };

    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return isLoadingScreenVisible;
}

export function AiSupport() {
  const allowed = useIsAllowed();
  const isLoadingScreenVisible = useIsLoadingScreenVisible();
  const {
    isOpen,
    close,
    toggle,
    messages,
    quickReplies,
    inputValue,
    setInputValue,
    imageDataUrl,
    setImageDataUrl,
    send,
    isLoading,
  } =
    useAiSupport();

  if (!allowed || isLoadingScreenVisible) return null;

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
        onImageChange={setImageDataUrl}
        hasImage={Boolean(imageDataUrl)}
      />
    </>
  );
}
