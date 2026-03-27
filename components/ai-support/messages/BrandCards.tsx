import type { BrandCardsMessage } from '../types';

export function BrandCards({ message }: { message: BrandCardsMessage }) {
  return (
    <div className="w-full space-y-2">
      {message.cards.map((card, i) => (
        <a
          key={i}
          href={card.url}
          className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 shadow-sm hover:shadow-md hover:-translate-y-px transition-all duration-150 no-underline"
        >
          <span className="text-xs font-semibold text-slate-900">{card.name}</span>
          {card.count > 0 && (
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full ml-2 whitespace-nowrap">
              {card.count} products
            </span>
          )}
        </a>
      ))}
      {message.viewAllUrl && (
        <a
          href={message.viewAllUrl}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline mt-1 no-underline"
        >
          View all brands →
        </a>
      )}
    </div>
  );
}
