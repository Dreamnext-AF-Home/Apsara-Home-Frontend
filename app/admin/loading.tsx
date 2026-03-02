export default function AdminLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-56 rounded bg-slate-200" />
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <div className="h-10 w-full rounded-xl bg-slate-200" />
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-10 rounded bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  )
}
