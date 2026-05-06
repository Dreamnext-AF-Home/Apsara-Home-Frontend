import LegalPageShell from '@/components/legal/LegalPageShell'

function DocSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {title}
      </h2>
      <div className="mt-3 text-slate-700 dark:text-slate-300">{children}</div>
    </section>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      subtitle="We care about how your data is handled. This policy explains what we collect, why we collect it, and how you can manage your information."
    >
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-cyan-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-200 dark:ring-cyan-900/40">
            <span className="text-sm font-bold">i</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Data privacy, made clear.
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              We, AF HOME, value the privacy and security of our customers and distributors. This privacy policy explains
              how we collect, use, and safeguard personal data in the course of our Business.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <DocSection title="1. Personal Information We Collect">
          <p>We may collect the following types of personal information:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Name, contact information (address, email address, phone number)</li>
            <li>Date of birth, gender, and other demographic information</li>
            <li>Payment and financial information</li>
            <li>Social media profiles and online presence information</li>
            <li>Information related to product purchases and order history</li>
            <li>Information you provide during the enrollment or registration process</li>
          </ul>
        </DocSection>

        <DocSection title="2. How We Use Personal Information">
          <p>We use personal information for the following purposes:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>To process product orders, enrollments, and registrations</li>
            <li>
              To communicate with customers and distributors regarding product updates, promotions, and business-related
              matters
            </li>
            <li>To provide customer support and assistance</li>
            <li>To fulfill contractual obligations and administer the compensation plan</li>
            <li>To conduct market research and improve our products and services</li>
            <li>For legal and regulatory compliance purposes</li>
          </ul>
        </DocSection>

        <DocSection title="3. Sharing Personal Information">
          <p>We may share personal information with third parties in the following circumstances:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              With service providers, contractors, and vendors who assist us in delivering our products and services.
              These third parties are bound by confidentiality obligations and are not permitted to use personal
              information for any other purposes.
            </li>
            <li>With our affiliates, subsidiaries, or parent company for business and administrative purposes.</li>
            <li>
              With regulatory authorities, law enforcement agencies, or other governmental bodies to comply with legal
              obligations, and court orders, or enforce our rights and protect the safety, rights, and property of our
              customers and distributors.
            </li>
            <li>
              In the event of a merger, acquisition, or sale of all or a portion of our business, personal information
              may be transferred to the acquiring entity as part of the transaction.
            </li>
          </ul>
        </DocSection>

        <DocSection title="4. Data Security and Retention">
          <p>
            We implement reasonable security measures to protect personal information from unauthorized access, use, or
            disclosure. However, please be aware that no data transmission over the Internet or electronic storage system
            is completely secure. We retain personal information as long as necessary to fulfill the purposes outlined in
            this privacy policy, or as required by applicable laws and regulations.
          </p>
        </DocSection>

        <DocSection title="5. Your Privacy Rights">
          <p>
            You have the right to access, correct, and update your personal information held by us. You may also request
            the deletion or restriction of your personal information, subject to legal obligations and our legitimate
            business interests. To exercise your privacy rights or for any privacy-related inquiries, please contact us
            using the contact information provided below.
          </p>
        </DocSection>

        <DocSection title="6. Changes to the Privacy Policy">
          <p>
            We reserve the right to update and modify this privacy policy at any time. Any changes will be posted on our
            website, and we encourage you to review this policy regularly.
          </p>
        </DocSection>

        <DocSection title="7. Contact Us">
          <p>
            If you have any questions, concerns, or requests regarding this privacy policy or our data practices, please
            contact us at info@afhome.biz
          </p>
        </DocSection>

        <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <p>
            Please note that this sample template is for reference purposes only and should not be considered legal advice.
            It is recommended to consult with a qualified legal professional to customize and ensure compliance with
            applicable privacy laws and regulations.
          </p>

          <p className="mt-4 font-semibold text-slate-900 dark:text-slate-50">
            Questions about privacy? Reach us anytime through the Contact Us page.
          </p>
        </div>
      </div>
    </LegalPageShell>
  )
}
