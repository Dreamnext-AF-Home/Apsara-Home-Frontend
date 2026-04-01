'use client';

import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, ApiResponse } from '../types';

const STORAGE_KEY = 'af_ai_support_history_v1';

const STARTER_QUESTIONS = [
  'What products match a minimalist style?',
  'Suggest items under PHP 5,000.',
  'What is best for office setup at home?',
  'What is the highest-rated product?',
  'What items are low in stock?',
  'Show me trending home decor.',
  'What if I received the wrong item?',
  'Do you accept GCash or online banking?',
  'How can I track my order?',
  'What happens if my item arrives damaged?',
  'What courier do you use?',
  'Can you recommend a sofa for small spaces?',
  'What are your best-selling living room products?',
  'Do you have items on sale right now?',
];

function apiEndpoint(path: string) {
  const base = (
    (typeof window !== 'undefined'
      ? (window as Window & { afAiApiBase?: string }).afAiApiBase
      : undefined) ??
    process.env.NEXT_PUBLIC_AI_API_BASE ??
    ''
  ).replace(/\/+$/, '');
  return base ? base + path : path;
}

interface UiState {
  messages: ChatMessage[];
  quickReplies: string[];
}

function persist(state: UiState) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function loadState(): UiState | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UiState;
    if (!parsed || !Array.isArray(parsed.messages)) return null;
    return {
      messages: parsed.messages,
      quickReplies: Array.isArray(parsed.quickReplies) ? parsed.quickReplies : [],
    };
  } catch {
    return null;
  }
}

export function useAiSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [imageDataUrls, setImageDataUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const initialized = useRef(false);

  const open = useCallback(() => {
    setIsOpen(true);
    if (initialized.current) return;
    initialized.current = true;

    const saved = loadState();
    if (saved && saved.messages.length > 0) {
      setMessages(saved.messages);
      setQuickReplies(saved.quickReplies);
    } else {
      const welcome: ChatMessage = { kind: 'text', role: 'bot', text: 'Hi! How can we help?' };
      setMessages([welcome]);
      setQuickReplies(STARTER_QUESTIONS);
      persist({ messages: [welcome], quickReplies: STARTER_QUESTIONS });
    }
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const toggle = useCallback(() => {
    setIsOpen(prev => {
      if (!prev) open();
      return !prev;
    });
  }, [open]);

  const send = useCallback(
    async (text: string) => {
      const msg = text.trim();
      if ((!msg && imageDataUrls.length === 0) || isLoading) return;

      setInputValue('');

      setMessages(prev => {
        const next: ChatMessage[] = [...prev];
        if (imageDataUrls.length > 0) {
          imageDataUrls.forEach((url) => {
            next.push({ kind: 'image', role: 'user', url });
          });
        }
        if (msg) {
          next.push({ kind: 'text', role: 'user', text: msg });
        }
        persist({ messages: next, quickReplies });
        return next;
      });

      setIsLoading(true);

      try {
        const res = await fetch(apiEndpoint('/api/ai-support'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: msg,
            images: imageDataUrls,
          }),
        });
        const data = (await res.json()) as ApiResponse;
        const newQRs = data.quick_replies?.slice(0, 14) ?? [];

        setMessages(prev => {
          const next: ChatMessage[] = [...prev];
          if (data.status === 'ok') {
            if (data.reply) next.push({ kind: 'text', role: 'bot', text: data.reply });
            if (data.product_cards?.length)
              next.push({ kind: 'cards', cards: data.product_cards.slice(0, 10) });
            if (data.brand_cards?.length)
              next.push({
                kind: 'brand_cards',
                cards: data.brand_cards.slice(0, 10),
                viewAllUrl: data.brand_view_all_url ?? '',
              });
            if (data.category_cards?.length)
              next.push({ kind: 'category_cards', cards: data.category_cards.slice(0, 10) });
            if (data.step_images?.length)
              next.push({ kind: 'step_images', images: data.step_images.slice(0, 10) });
          } else {
            next.push({ kind: 'text', role: 'bot', text: 'I could not process your request right now.' });
          }
          persist({ messages: next, quickReplies: newQRs });
          return next;
        });
        setQuickReplies(newQRs);
      } catch {
        setMessages(prev => {
          const next: ChatMessage[] = [
            ...prev,
            { kind: 'text', role: 'bot', text: 'Support is temporarily unavailable. Please try again.' },
          ];
          persist({ messages: next, quickReplies });
          return next;
        });
      } finally {
        setIsLoading(false);
        if (imageDataUrls.length > 0) {
          setImageDataUrls([]);
        }
      }
    },
    [imageDataUrls, isLoading, quickReplies],
  );

  return {
    isOpen,
    open,
    close,
    toggle,
    messages,
    quickReplies,
    inputValue,
    setInputValue,
    imageDataUrls,
    setImageDataUrls,
    send,
    isLoading,
  };
}
