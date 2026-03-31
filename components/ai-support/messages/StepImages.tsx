import type { StepImagesMessage } from '../types';

export function StepImages({ message }: { message: StepImagesMessage }) {
  return (
    <div className="w-full space-y-3">
      {message.images.map((img, i) => (
        <div key={i} className="bg-white border border-slate-100 rounded-xl p-2 shadow-sm">
          <img src={img.url} alt={img.caption ?? `Step ${i + 1}`} className="w-full rounded-lg" />
          {img.caption && (
            <p className="mt-2 text-[12px] text-slate-600">{img.caption}</p>
          )}
        </div>
      ))}
    </div>
  );
}
