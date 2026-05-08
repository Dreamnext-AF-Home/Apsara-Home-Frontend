import LegalPageShell from '@/components/legal/LegalPageShell'

function DocSection({
  icon,
  title,
  children,
}: {
  icon: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-200 dark:ring-cyan-900/40">
          <span className="text-sm font-bold" aria-hidden="true">
            {icon}
          </span>
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">{title}</h2>
          <div className="mt-2 text-slate-700 dark:text-slate-300">{children}</div>
        </div>
      </div>
    </section>
  )
}

export default function IncomeDisclaimerPage() {
  return (
    <LegalPageShell
      title="Income Disclaimer"
      subtitle="This disclaimer explains how income results may vary and outlines expectations for affiliates and partners."
    >
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-cyan-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-200 dark:ring-cyan-900/40">
            <span className="text-sm font-bold" aria-hidden="true">
              ⚠️
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Know what to expect.</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Transparent expectations before you commit.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <DocSection icon="🧾" title="Overview">
          <p>
            We provide the following income disclaimer to ensure transparency and set realistic expectations for
            individuals considering joining our multi-level marketing opportunity.
          </p>
        </DocSection>

        <DocSection icon="📈" title="Earning Potential Varies">
          <p>
            Earning potential in this business is highly individual and can vary greatly based on factors including, but
            not limited to, effort, dedication, skills, market conditions, and the amount of time invested.
          </p>
        </DocSection>

        <DocSection icon="🎯" title="No Typical or Guaranteed Results">
          <p>
            While some individuals may achieve significant financial success in our Income opportunity, it is important to
            note that these results are not typical or guaranteed. Most participants in MLM businesses do not earn
            substantial incomes and may even experience financial losses.
          </p>
        </DocSection>

        <DocSection icon="🧱" title="Success Requires Work">
          <p>
            It is essential to understand that success in this business requires hard work, persistence, and building a
            strong network of customers and recruits. It is unrealistic to expect immediate or effortless financial gains.
          </p>
        </DocSection>

        <DocSection icon="🛡️" title="Evaluate Risks and Rewards">
          <p>
            We strongly advise individuals to carefully evaluate the risks, expenses, and potential rewards associated with
            MLM businesses before making any financial commitments. Seek advice from reputable financial professionals to
            assess whether an MLM opportunity aligns with your personal goals and circumstances.
          </p>
        </DocSection>

        <DocSection icon="📣" title="No Unofficial Income Claims">
          <p>
            Lastly, we do not endorse any income claims made by our distributors or representatives that deviate from our
            official sales and compensation materials. Such claims are not representative of what the majority of
            participants can expect to achieve.
          </p>
        </DocSection>

        <DocSection icon="✅" title="Your Responsibility">
          <p>
            By joining our AF Home you acknowledge that your results may vary, and you assume full responsibility for your
            financial success or lack thereof.
          </p>
        </DocSection>

        <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <p className="font-medium text-slate-900 dark:text-slate-50">
            Need clarification? Reach us anytime through the Contact Us page.
          </p>
        </div>
      </div>
    </LegalPageShell>
  )
}

