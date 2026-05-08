'use client';

import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClick: () => void;
  robotSrc: string;
  logoSrc: string;
}

const BUTTON_SIZE = 90;
const PEEK_VISIBLE = 26;        // px visible when peeked at edge
const EDGE_SNAP_ZONE = 72;      // px from edge that triggers snap-to-peek

export function AiSupportToggle({ isOpen, onClick, robotSrc, logoSrc }: Props) {
  const prompts = useMemo(
    () => [
      'How can I help you today?',
      "Need help? I'm here!",
      'Ask me anything!',
      'Hi! How can I assist you?',
      'What can I do for you?',
      'Need something? Just ask!',
    ],
    [],
  );
  const [promptIndex, setPromptIndex] = useState(0);
  const [isPeeked, setIsPeeked] = useState(false);
  const [peekSide, setPeekSide] = useState<'left' | 'right'>('left');
  const [pos, setPos] = useState({ x: 20, y: 26 });

  // Keep latest pos in ref so pointer handlers don't go stale
  const posRef = useRef({ x: 20, y: 26 });
  const dragState = useRef({ active: false, moved: false, cx: 0, cy: 0, px: 0, py: 0 });

  const updatePos = useCallback((next: { x: number; y: number }) => {
    posRef.current = next;
    setPos(next);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setPromptIndex((p) => (p + 1) % prompts.length), 20000);
    return () => clearInterval(id);
  }, [prompts.length]);

  // When chat opens, always un-peek
  useEffect(() => {
    if (isOpen && isPeeked) {
      setIsPeeked(false);
      const vw = window.innerWidth;
      updatePos({ x: peekSide === 'left' ? 20 : vw - BUTTON_SIZE - 20, y: posRef.current.y });
    }
  }, [isOpen, isPeeked, peekSide, updatePos]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = posRef.current;
    dragState.current = { active: true, moved: false, cx: e.clientX, cy: e.clientY, px: p.x, py: p.y };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragState.current;
    if (!ds.active) return;
    const dx = e.clientX - ds.cx;
    const dy = e.clientY - ds.cy;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) ds.moved = true;
    if (!ds.moved) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    updatePos({
      x: Math.max(0, Math.min(vw - BUTTON_SIZE, ds.px + dx)),
      y: Math.max(0, Math.min(vh - BUTTON_SIZE, ds.py - dy)),
    });
  }, [updatePos]);

  const handlePointerUp = useCallback(() => {
    const ds = dragState.current;
    if (!ds.active) return;
    ds.active = false;

    if (!ds.moved) {
      // Pure tap → open chat
      onClick();
      return;
    }

    // Snap to peek if dragged near left or right edge
    const vw = window.innerWidth;
    const currentX = posRef.current.x;

    if (currentX < EDGE_SNAP_ZONE) {
      setPeekSide('left');
      setIsPeeked(true);
      updatePos({ ...posRef.current, x: 0 });
    } else if (currentX > vw - BUTTON_SIZE - EDGE_SNAP_ZONE) {
      setPeekSide('right');
      setIsPeeked(true);
      updatePos({ ...posRef.current, x: vw - BUTTON_SIZE });
    }
  }, [onClick, updatePos]);

  const handlePeekTabClick = useCallback(() => {
    const vw = window.innerWidth;
    setIsPeeked(false);
    updatePos({
      x: peekSide === 'left' ? 20 : vw - BUTTON_SIZE - 20,
      y: posRef.current.y,
    });
  }, [peekSide, updatePos]);

  // Offset so widget slides off-screen when peeked, leaving only PEEK_VISIBLE px
  const peekOffset = isPeeked
    ? peekSide === 'left'
      ? -(BUTTON_SIZE - PEEK_VISIBLE)
      : BUTTON_SIZE - PEEK_VISIBLE
    : 0;

  // Flip prompt bubble to left when widget is on right half of screen
  const isOnRightHalf = pos.x + BUTTON_SIZE / 2 > (typeof window !== 'undefined' ? window.innerWidth / 2 : 400);
  const bubbleStyle = isOnRightHalf
    ? 'right-[86px] left-auto'
    : 'left-[86px]';
  const bubbleTailStyle = isOnRightHalf
    ? 'absolute -right-1.5 top-4 w-2.5 h-2.5 bg-white border-r border-t border-indigo-100 rotate-45'
    : 'absolute -left-1.5 top-4 w-2.5 h-2.5 bg-white border-l border-b border-indigo-100 rotate-45';

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        bottom: pos.y,
        zIndex: 9999,
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        transform: `translateX(${peekOffset}px)`,
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      {isPeeked ? (
        /* ── Peeked state: show tab at screen edge ── */
        <button
          onClick={handlePeekTabClick}
          aria-label="Show AI Support"
          className="relative w-full h-full bg-transparent border-0 p-0 cursor-pointer"
        >
          {/* Colored pull tab */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 ${
              peekSide === 'left' ? 'right-0 rounded-r-xl' : 'left-0 rounded-l-xl'
            } bg-gradient-to-b from-sky-500 to-indigo-500 w-6 h-14 flex items-center justify-center shadow-lg`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
            >
              <polyline points={peekSide === 'left' ? '9 18 15 12 9 6' : '15 18 9 12 15 6'} />
            </svg>
          </div>
        </button>
      ) : (
        /* ── Normal / draggable state ── */
        <motion.div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: '100%', height: '100%', cursor: 'grab', touchAction: 'none' }}
          aria-label={isOpen ? 'Close AI Support' : 'Open AI Support'}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Prompt bubble */}
            {!isOpen && (
              <div className={`absolute ${bubbleStyle} bottom-7 max-w-[220px] min-w-[140px] rounded-2xl bg-white border border-indigo-100 shadow-lg shadow-slate-200 px-3 py-2 text-[12.5px] text-slate-700 pointer-events-none`}>
                <span className="block leading-snug whitespace-normal break-words">
                  {prompts[promptIndex]}
                </span>
                <span className={bubbleTailStyle} />
              </div>
            )}

            {/* Robot image */}
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
              style={{ transformOrigin: '60% 78%', pointerEvents: 'none' }}
            />

            {/* Logo bubble */}
            <div className="absolute -right-1.5 -top-2.5 z-20 pointer-events-none">
              <div className="relative bg-white border-2 border-indigo-200 rounded-2xl shadow-lg shadow-indigo-100 px-1.5 py-1 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoSrc} alt="AF" className="w-7 h-5 object-contain" />
                <div className="absolute left-2.5 -bottom-[7px] w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-indigo-200 rotate-45" />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
