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

export default function RewardsAndCommissionsPage() {
  return (
    <LegalPageShell
      title="Rewards and Commissions"
      subtitle="Learn how rewards are earned, tracked, and distributed. We keep it transparent so you can plan with confidence."
    >
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-cyan-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-200 dark:ring-cyan-900/40">
            <span className="text-sm font-bold" aria-hidden="true">
              💰
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Disclaimer:</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
              Rewards and Commissions
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <DocSection icon="🧾" title="Transparent expectations">
          <p>
            At AF Home, we understand the importance of transparency and clarity when it comes to network
            marketing rewards and commissions. We want to ensure that all our valued distributors and partners
            have a comprehensive understanding of how our compensation plan works. Therefore, we have
            prepared the following disclaimers to provide you with important information:
          </p>
        </DocSection>

        <DocSection icon="⚠️" title="Earnings Disclaimer">
          <p>
            Earnings Disclaimer: Any statements or examples of earnings mentioned in our marketing materials or
            presentations are not guarantees of income. The success and income potential of each individual
            distributor may vary based on their skills, efforts, and market conditions. We encourage you to set
            realistic expectations and understand that building a successful network marketing business requires
            time, dedication, and hard work.
          </p>
        </DocSection>

        <DocSection icon="🔍" title="No Income Guarantee">
          <p>
            No Income Guarantee: We do not guarantee any level of income or financial success to our distributors.
            The amount of income you can earn will depend on various factors, including your personal efforts,
            the size and productivity of your network, and market conditions. It is important to note that success
            in network marketing is not guaranteed and individual results may vary.
          </p>
        </DocSection>

        <DocSection icon="📜" title="Compliance with Laws and Regulations">
          <p>
            Compliance with Laws and Regulations: As a distributor, it is your responsibility to comply with all
            applicable laws and regulations governing network marketing and direct selling in your country or region.
            This includes but is not limited to adhering to advertising guidelines, accurately representing our products
            and business opportunity, and avoiding any misleading or deceptive practices.
          </p>
        </DocSection>

        <DocSection icon="🎲" title="Investment Risk">
          <p>
            Investment Risk: Participating in network marketing involves certain risks, including the risk of financial
            loss. It is important to carefully evaluate the opportunity and consider your personal financial situation
            before making any investment. We recommend consulting with a financial advisor or professional to assess the
            risks and suitability of network marketing as a business opportunity for you.
          </p>
        </DocSection>

        <DocSection icon="🧩" title="Independent Contractor Status">
          <p>
            Independent Contractor Status: As a distributor, you are an independent contractor and not an employee,
            partner, or franchisee of Value Max. You have the freedom to operate your business according to your own
            schedule and methods, but you are also responsible for your own expenses, taxes, and legal compliance.
          </p>
        </DocSection>

        <DocSection icon="🔄" title="Changes to the Compensation Plan">
          <p>
            Changes to the Compensation Plan: We reserve the right to modify or update our compensation plan at any time
            to ensure its fairness, sustainability, and compliance with legal requirements. Any changes will be
            communicated to our distributors in a timely manner.
          </p>
        </DocSection>

        <DocSection icon="🫶" title="Support & clarity">
          <p>
            Please take the time to read and understand these disclaimers. If you have any questions or concerns regarding
            our network marketing rewards and commissions, please reach out to our support team for further clarification.
            We are here to support you on your journey to success.
          </p>
        </DocSection>

        <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <p className="font-medium text-slate-900 dark:text-slate-50">
            Questions about commissions? Reach us anytime through the Contact Us page.
          </p>
        </div>
      </div>
    </LegalPageShell>
  )
}

