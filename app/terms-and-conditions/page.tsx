import LegalPageShell from '@/components/legal/LegalPageShell'

const TERMS_TITLE = 'Terms and Conditions'

const TERMS_SECTIONS = [
  {
    title: '1. Independent Distributor Agreement',
    body: 'By becoming a distributor of our company, you agree to be bound by the terms and conditions outlined in this agreement. You acknowledge that you are an independent contractor and not an employee, partner, or agent of the company.',
  },
  {
    title: '2. Distributor Obligations',
    body: 'As a distributor, you agree to adhere to all applicable laws, regulations, and ethical guidelines in promoting and selling our products and services, represent the company honestly and accurately, maintain a positive and professional image, and attend company-provided training and development programs.',
  },
  {
    title: '3. Compensation Plan',
    body: 'Our company uses a compensation plan that rewards distributors for sales and building a network. The details of the compensation plan, including commission structure, bonus eligibility, and qualification criteria, are outlined in a separate document, which is an integral part of these terms and conditions.',
  },
  {
    title: '4. Product Purchase Requirements',
    body: 'To remain an active distributor and qualify for commissions and bonuses, you are required to meet monthly or quarterly product purchase requirements. These requirements may include personal consumption and or retail sales requirements. Failure to meet these requirements may result in the loss of commissions and bonuses.',
  },
  {
    title: '5. Downline Structure',
    body: 'You may build and manage a network of distributors, commonly referred to as your downline. You understand that your commissions and bonuses may be based on the sales performance and activities of your downline. However, you are responsible for training, supporting, and motivating your downline members.',
  },
  {
    title: '6. Termination and Resignation',
    body: 'Either party may terminate this agreement at any time with written notice. You understand that in the event of termination or resignation, you will no longer be eligible to receive commissions, bonuses, or other benefits associated with the MLM business.',
  },
  {
    title: '7. Intellectual Property',
    body: 'All trademarks, logos, copyrighted materials, and other intellectual property owned by the company are protected and may not be used without written permission. Any unauthorized use of company intellectual property may result in legal action.',
  },
  {
    title: '8. Non-Disparagement',
    body: 'During and after the term of this agreement, you agree not to make any disparaging or defamatory statements about the company, its products, or other distributors. Violation of this clause may result in termination and legal consequences.',
  },
  {
    title: '9. Product Returns and Refunds',
    body: 'Our company has a product return policy that allows customers to request refunds or exchanges within a specified time frame. You understand that you are responsible for handling customer returns and refunds, and any costs associated with the process.',
  },
  {
    title: '10. Governing Law and Jurisdiction',
    body: 'This agreement shall be governed by and construed in accordance with the laws of the Philippines. Any disputes arising from this agreement shall be subject to the exclusive jurisdiction of the courts of the Philippines.',
  },
]

export default function TermsAndConditionsPage() {

  return (
    <LegalPageShell
      title={TERMS_TITLE}
      subtitle="Please review the guidelines that apply when using our website and services."
    >
      <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <div className="space-y-6">
          {TERMS_SECTIONS.map((section) => (
            <section key={section.title} className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{section.title}</h2>
              <p className="whitespace-pre-line text-slate-700 dark:text-slate-300">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </LegalPageShell>
  )
}
