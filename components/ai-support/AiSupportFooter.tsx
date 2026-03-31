import { Camera, SendHorizonal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onImageChange: (dataUrl: string) => void;
  hasImage: boolean;
  disabled?: boolean;
}

export function AiSupportFooter({ value, onChange, onSend, onImageChange, hasImage, disabled }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewName, setPreviewName] = useState<string>('');

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
    setPreviewName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      onImageChange(result);
    };
    reader.readAsDataURL(file);
  };

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setPreviewName('');
    onImageChange('');
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
      {previewUrl && (
        <div className="absolute bottom-[64px] left-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-lg">
          <img
            src={previewUrl}
            alt={previewName || 'Selected upload'}
            className="h-10 w-10 rounded-lg object-cover"
          />
          <div className="max-w-[160px] truncate text-[12px] text-slate-600">
            {previewName || 'Selected image'}
          </div>
          <button
            type="button"
            onClick={clearPreview}
            className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Remove image"
          >
            <X size={12} strokeWidth={2.2} />
          </button>
        </div>
      )}
    </div>
  );
}
