'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessage } from './types';

const API_BASE = (process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? '').replace(/\/+$/, '');
const ROBOT_SRC = `${API_BASE}/Image/sir.png`;
import { TextMessage } from './messages/TextMessage';
import { ImageMessage } from './messages/ImageMessage';
import { ProductCards } from './messages/ProductCards';
import { BrandCards } from './messages/BrandCards';
import { CategoryCards } from './messages/CategoryCards';
import { StepImages } from './messages/StepImages';

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function AiSupportBody({ messages, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-3 bg-slate-50">
      {messages.map((msg, i) => {
        if (msg.kind === 'text') return <TextMessage key={i} message={msg} />;
        if (msg.kind === 'image') return <ImageMessage key={i} message={msg} />;
        if (msg.kind === 'cards') return <ProductCards key={i} message={msg} />;
        if (msg.kind === 'brand_cards') return <BrandCards key={i} message={msg} />;
        if (msg.kind === 'category_cards') return <CategoryCards key={i} message={msg} />;
        if (msg.kind === 'step_images') return <StepImages key={i} message={msg} />;
        return null;
      })}

      {isLoading && (
        <div className="flex items-end gap-2">
          <div className="w-10 h-10 overflow-hidden flex-shrink-0 rounded-none">
            <img src={ROBOT_SRC} alt="AI" className="w-full h-full object-contain" />
          </div>
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-[18px] rounded-bl-[5px] px-4 py-3 shadow-md shadow-indigo-100">
            <div className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}


