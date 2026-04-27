'use client'

type Props = {
  title: string
  description?: string
}

export default function UnderMaintenancePage({
  title,
  description = 'This section is still being built. Please check back later.',
}: Props) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Under Maintenance
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h1>

        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">
          {description}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Status</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Feature setup in progress</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Access</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Page is available but not yet finalized</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Next</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">UI and workflow will be added soon</p>
          </div>
        </div>
      </div>
    </section>
  )
}
