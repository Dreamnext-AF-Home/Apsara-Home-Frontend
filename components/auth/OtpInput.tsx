'use client';

import { useEffect, useRef } from "react";

interface OtpInputProps {
    value: string;
    onChange: (value: string) => void;
    length?: number;
    disabled?: boolean;
    autoFocus?: boolean;
}

const OtpInput = ({ value, onChange, length = 4, disabled, autoFocus }:OtpInputProps) => {
  const inputRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) {
        inputRef.current[0]?.focus()
    }
  },[autoFocus])

  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) return;

    const digit = raw[raw.length - 1] 
    const next = digits.map((d, i) => (i === index ? digit : d)).join(''); 
    onChange(next)

    if (index < length - 1) {
        inputRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
        e.preventDefault();
        if (digits[index]) {
            const next = digits.map((d, i) => (i === index ? '' : d)).join('');
            onChange(next);
        } else if (index > 0) {
            const next = digits.map((d, i) => (i === index - 1 ? '' : d)).join('');
            onChange(next)
            inputRef.current[index - 1]?.focus();
        }
    } else if (e.key === 'ArrowLeft' && index > 0) {
        inputRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrownRight' && index < length - 1) {
        inputRef.current[index + 1]?.focus();
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    const filled = pasted.padEnd(length, ' ').slice(0, length).replace(/ /g, '')
    onChange(filled)
    const focusIndex = Math.min(pasted.length, length - 1);
    inputRef.current[focusIndex]?.focus();
  }
  return (
    <div className="flex items-end justify-center gap-4">
      {digits.map((digit, index) => (
        <div key={index} className="flex flex-col items-center gap-2">
            <input 
                ref={el => { inputRef.current[index] = el}}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                disabled={disabled}
                onChange={e => handleChange(index, e)}
                onKeyDown={e => handleKeyDown(index, e)}
                onPaste={handlePaste}
                onFocus={e => e.target.select()}
                className="w-14 h-14 text-center text-2xl font-bold text-white bg-transparent outline-none caret-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className={`h-0.5 w-14 rounded-full transition-all duration-200 ${digit ? 'bg-orange-400' : 'bg-white/30'}`}/>
        </div>
      ))}
    </div>
  )
}

export default OtpInput
