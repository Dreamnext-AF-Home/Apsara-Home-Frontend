import LegalPageShell from '@/components/legal/LegalPageShell'

function SectionCard({
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
          <span className="text-sm font-bold">{icon}</span>
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">{title}</h2>
          <div className="mt-2 text-slate-700 dark:text-slate-300">{children}</div>
        </div>
      </div>
    </section>
  )
}

export default function TermsAndConditionsPage() {
  return (
    <LegalPageShell
      title="Terms and Conditions"
      subtitle="Clear terms help everyone. Please review the guidelines that apply when using our website and services."
    >
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-cyan-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-200 dark:ring-cyan-900/40">
            <span className="text-sm font-bold">✓</span>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Latest Terms and Conditions of AF Home</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">The following are the latest Terms and Conditions of AF Home.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <SectionCard icon="🤝" title="1. Independent Distributor Agreement">
          <p>
            By becoming a distributor of our company, you agree to be bound by the terms and conditions outlined in this
            agreement. You acknowledge that you are an independent contractor and not an employee, partner, or agent of
            the company.
          </p>
        </SectionCard>

        <SectionCard icon="📋" title="2. Distributor Obligations">
          <p>As a distributor, you agree to perform the following obligations:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              Adhere to all applicable laws, regulations, and ethical guidelines in promoting and selling our
              products/services.
            </li>
            <li>Represent the company and its products/services honestly and accurately.</li>
            <li>
              Maintain a positive and professional image and avoid any activities that may damage the reputation of the
              company.
            </li>
            <li>Attend and participate in training and development programs provided by the company.</li>
          </ul>
        </SectionCard>

        <SectionCard icon="💼" title="3. Compensation Plan">
          <p>
            Our company uses a compensation plan that rewards distributors for sales and building a network. The details
            of the compensation plan, including commission structure, bonus eligibility, and qualification criteria, are
            outlined in a separate document, which is an integral part of these terms and conditions.
          </p>
        </SectionCard>

        <SectionCard icon="🧾" title="4. Product Purchase Requirements">
          <p>
            To remain an active distributor and qualify for commissions and bonuses, you are required to meet monthly or
            quarterly product purchase requirements. These requirements may include personal consumption and/or retail
            sales requirements. Failure to meet these requirements may result in the loss of commissions and bonuses.
          </p>
        </SectionCard>

        <SectionCard icon="🧑‍🤝‍🧑" title="5. Downline Structure">
          <p>
            You may build and manage a network of distributors, commonly referred to as your "downline." You
            understand that your commissions and bonuses may be based on the sales performance and activities of your
            downline. However, you are responsible for training, supporting, and motivating your downline members.
          </p>
        </SectionCard>

        <SectionCard icon="⏹️" title="6. Termination and Resignation">
          <p>
            Either party may terminate this agreement at any time with written notice. You understand that in the event
            of termination or resignation, you will no longer be eligible to receive commissions, bonuses, or other
            benefits associated with the MLM business.
          </p>
        </SectionCard>

        <SectionCard icon="🔐" title="7. Intellectual Property">
          <p>
            All trademarks, logos, copyrighted materials, and other intellectual property owned by the company are
            protected and may not be used without written permission. Any unauthorized use of company intellectual
            property may result in legal action.
          </p>
        </SectionCard>

        <SectionCard icon="🛡️" title="8. Non-Disparagement">
          <p>
            During and after the term of this agreement, you agree not to make any disparaging or defamatory statements
            about the company, its products, or other distributors. Violation of this clause may result in termination
            and legal consequences.
          </p>
        </SectionCard>

        <SectionCard icon="↩️" title="9. Product Returns and Refunds">
          <p>
            Our company has a product return policy that allows customers to request refunds or exchanges within a
            specified time frame. You understand that you are responsible for handling customer returns and refunds, and
            any costs associated with the process.
          </p>
        </SectionCard>

        <SectionCard icon="⚖️" title="10. Governing Law and Jurisdiction">
          <p>
            This agreement shall be governed by and construed in accordance with the laws of the Philippines. Any
            disputes arising from this agreement shall be subject to the exclusive jurisdiction of the courts of the
            Philippines.
          </p>
        </SectionCard>

        <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <p>
            By signing below or by accepting these terms and conditions electronically, you acknowledge that you have read,
            understood, and agreed to abide by the terms and conditions of AF Home.
          </p>

          <p className="mt-4 font-medium text-slate-900 dark:text-slate-50">
            Need clarification? Reach us anytime through the Contact Us page.
          </p>
        </div>
      </div>
    </LegalPageShell>
  )
}
