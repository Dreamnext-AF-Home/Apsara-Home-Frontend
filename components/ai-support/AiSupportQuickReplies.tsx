interface Props {
  items: string[];
  onSelect: (item: string) => void;
}

export function AiSupportQuickReplies({ items, onSelect }: Props) {
  if (!items.length) return null;
  return (
    <div className="flex-shrink-0 border-t border-slate-100 bg-white px-3 py-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
      {items.map((item, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(item)}
          className="text-[11.5px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-300 rounded-full px-3 py-1.5 transition-colors duration-150 whitespace-nowrap cursor-pointer"
        >
          {item}
        </button>
      ))}
    </div>
  );
}
