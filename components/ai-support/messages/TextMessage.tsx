import type { TextMessage as TextMessageType } from '../types';

const API_BASE = (process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? '').replace(/\/+$/, '');
const ROBOT_SRC = `${API_BASE}/Image/sir.png`;

function Linkify({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-cyan-300 break-all"
          >
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function TextMessage({ message }: { message: TextMessageType }) {
  const isBot = message.role === 'bot';
  return (
    <div className={`flex items-end gap-2 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && (
        <div className="w-10 h-10 overflow-hidden flex-shrink-0 rounded-none">
          <img src={ROBOT_SRC} alt="AI" className="w-full h-full object-contain" />
        </div>
      )}
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-[18px] text-[13.5px] leading-relaxed break-words ${
          isBot
            ? 'bg-gradient-to-br from-indigo-600 to-indigo-500 text-white rounded-bl-[5px] shadow-md shadow-indigo-100'
            : 'bg-white text-slate-800 border border-slate-200 rounded-br-[5px] shadow-sm'
        }`}
      >
        <Linkify text={message.text} />
      </div>
    </div>
  );
}


