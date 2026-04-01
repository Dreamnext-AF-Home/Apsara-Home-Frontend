import { Camera, SendHorizonal, X } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previews, setPreviews] = useState<Array<{ url: string; name: string; dataUrl: string }>>([]);
  const imagesRef = useRef<string[]>(images);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [previews]);

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const remainingSlots = Math.max(0, maxImages - previews.length);
    const selected = files.slice(0, remainingSlots);
    if (selected.length === 0) return;

    selected.forEach((file) => {
      const url = URL.createObjectURL(file);
      setPreviews((prev) => [...prev, { url, name: file.name, dataUrl: '' }]);

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        if (!dataUrl) return;

        setPreviews((prev) =>
          prev.map((item) => (item.url === url ? { ...item, dataUrl } : item)),
        );

        const next = [...imagesRef.current, dataUrl].slice(0, maxImages);
        imagesRef.current = next;
        onImageChange(next);
      };
      reader.readAsDataURL(file);
    });
  };

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = () => {
    onSend();
    if (hasImage) {
      clearPreview();
    }
  };

  return (
    <div className="relative flex-shrink-0 border-t border-slate-100 bg-white px-3 py-2.5 flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Type your question..."
        autoComplete="off"
        className="flex-1 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-xl px-3.5 py-2.5 text-[13.5px] text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-150"
      />
      <button
        type="button"
        onClick={handlePickImage}
        aria-label="Attach image"
        className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all duration-150"
      >
        <Camera size={16} strokeWidth={2} />
      </button>
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
