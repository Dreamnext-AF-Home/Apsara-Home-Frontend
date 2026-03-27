import type { ProductCardsMessage } from '../types';

function normalizePrice(price: string) {
  return price.replace(/(\d[\d,]*)\.00\b/g, '$1');
}

export function ProductCards({ message }: { message: ProductCardsMessage }) {
  return (
    <div className="w-full space-y-2">
      {message.cards.map((card, i) => (
        <a
          key={i}
          href={card.url}
          className="flex gap-3 items-start bg-white border border-slate-100 rounded-xl p-2.5 shadow-sm hover:shadow-md hover:-translate-y-px transition-all duration-150 no-underline"
        >
          {card.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.image}
              alt={card.name}
              className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-slate-900 leading-snug">{card.name}</span>
            {card.description && (
              <span className="text-[11px] text-slate-500 leading-snug line-clamp-2">{card.description}</span>
            )}
            {card.price && (
              <span className="text-xs font-bold text-indigo-600">₱{normalizePrice(card.price)}</span>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}
