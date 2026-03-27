import { SendHorizonal } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function AiSupportFooter({ value, onChange, onSend, disabled }: Props) {
  return (
    <div className="flex-shrink-0 border-t border-slate-100 bg-white px-3 py-2.5 flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder="Type your question..."
        autoComplete="off"
        className="flex-1 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-xl px-3.5 py-2.5 text-[13.5px] text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-150"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-200 hover:scale-105 hover:shadow-lg hover:shadow-indigo-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-150 cursor-pointer"
      >
        <SendHorizonal size={16} strokeWidth={2.2} />
      </button>
    </div>
  );
}
