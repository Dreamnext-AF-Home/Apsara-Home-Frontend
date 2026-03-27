import type { TextMessage as TextMessageType } from '../types';

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
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center text-[11px] text-white flex-shrink-0 shadow-sm">
          ✦
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
