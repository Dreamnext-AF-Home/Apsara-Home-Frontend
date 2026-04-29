import { SendHorizonal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  images: string[];
  onImageChange: (dataUrls: string[]) => void;
  hasImage: boolean;
  maxImages?: number;
  disabled?: boolean;
}

export function AiSupportFooter({
  value,
  onChange,
  onSend,
  images,
  onImageChange,
  hasImage,
  maxImages = 4,
  disabled,
}: Props) {
  const [previews, setPreviews] = useState<Array<{ url: string; name: string; dataUrl: string }>>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
  }, [value]);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [previews]);

  const clearPreview = (index?: number) => {
    if (typeof index === 'number') {
      setPreviews((prev) => {
        const target = prev[index];
        if (target?.url) {
          URL.revokeObjectURL(target.url);
        }
        const next = prev.filter((_, i) => i !== index);
        onImageChange(next.map((item) => item.dataUrl));
        return next;
      });
      return;
    }
    previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    setPreviews([]);
    onImageChange([]);
  };

  const handleSend = () => {
    onSend();
    if (hasImage) {
      clearPreview();
    }
  };

  return (
    <div className="relative flex-shrink-0 border-t border-slate-100 bg-white px-3 py-2.5 flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Type your question..."
        autoComplete="off"
        rows={1}
        className="flex-1 resize-none overflow-y-auto max-h-[140px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-xl px-3.5 py-2.5 text-[13.5px] text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-150"
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || (!value.trim() && !hasImage)}
        aria-label="Send message"
        className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-200 hover:scale-105 hover:shadow-lg hover:shadow-indigo-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-150 cursor-pointer"
      >
        <SendHorizonal size={16} strokeWidth={2.2} />
      </button>
      {previews.length > 0 && (
        <div className="absolute bottom-[64px] left-3 max-w-[300px] rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-lg">
          <div className="flex flex-wrap gap-2">
            {previews.map((preview, idx) => (
              <div key={`${preview.url}-${idx}`} className="relative">
                <img
                  src={preview.url}
                  alt={preview.name || 'Selected upload'}
                  className="h-10 w-10 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => clearPreview(idx)}
                  className="absolute -top-2 -right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-600 shadow hover:bg-slate-100"
                  aria-label="Remove image"
                >
                  <X size={10} strokeWidth={2.2} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {previews.length} image{previews.length > 1 ? 's' : ''} attached
          </div>
        </div>
      )}
    </div>
  );
}
