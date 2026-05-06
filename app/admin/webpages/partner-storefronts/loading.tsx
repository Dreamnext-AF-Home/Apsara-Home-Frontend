export default function AdminPartnerStorefrontsLoading() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600 dark:border-cyan-950 dark:border-t-cyan-300" />
      <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Loading partner storefronts...</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Please wait while the storefront workspace opens.</p>
    </div>
  )
}
