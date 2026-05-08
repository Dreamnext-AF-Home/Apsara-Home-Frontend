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

export default function CookiePolicyPage() {
  return (
    <LegalPageShell
      title="Cookie Policy"
      subtitle="This policy explains how cookies help improve your browsing experience and how you can control them."
    >
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-cyan-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-200 dark:ring-cyan-900/40">
            <span className="text-sm font-bold" aria-hidden="true">
              🍪
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Cookie Policy</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              This policy explains how cookies are used on AF Home and how you can control them.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <DocSection icon="❓" title="1. What Are Cookies?">
          <p>
            Cookies are small text files that are used to store small pieces of information. They are stored on your
            device when the website is loaded on your browser. These cookies help us make the website function properly,
            make it more secure, provide better user experience, and understand how the website performs and to analyze
            what works and where it needs improvement.
          </p>
        </DocSection>

        <DocSection icon="⚙️" title="2. How AF Home Uses Cookies">
          <p>When you use and access the Service, we may place a number of cookies files in your web browser.</p>
          <p className="mt-3">We use cookies for the following purposes:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              Essential Cookies: We use cookies to remember information that changes the way the Service behaves or
              looks, such as a user&apos;s language preference on the Service.
            </li>
            <li>
              Account-Related Cookies: We use cookies to manage the signup process and general administration. These
              cookies will usually be deleted when you log out; however, in some cases, they may remain afterward to
              remember your site preferences when logged out.
            </li>
            <li>
              Analytics Cookies: We use cookies to help us analyze how our visitors use the website and to monitor
              website performance. This helps us provide a high-quality experience by customizing our offering and
              quickly identifying and fixing any issues that arise.
            </li>
            <li>
              Advertising Cookies: We may use cookies to deliver advertisements that are relevant to you and your
              interests.
            </li>
          </ul>
        </DocSection>

        <DocSection icon="🌐" title="3. Third-Party Cookies">
          <p>
            In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the
            Service and deliver advertisements on and through the Service. These third-party cookies are governed by the
            respective privacy policies of these third parties.
          </p>
        </DocSection>

        <DocSection icon="🧰" title="4. Your Choices Regarding Cookies">
          <p>
            If you prefer to avoid the use of cookies on the website, you must first disable the use of cookies in your
            browser and then delete the cookies saved in your browser associated with this website. You may use this
            option for preventing the use of cookies at any time.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>
              Browser Settings: Most web browsers allow you to control cookies through their settings preferences. To
              find out more about cookies, including how to see what cookies have been set and how to manage and delete
              them, visit www.allaboutcookies.org or www.youronlinechoices.com.
            </li>
            <li>
              Opt-Out: You can opt-out of targeted advertising by visiting the following links: Network Advertising
              Initiative and Digital Advertising Alliance.
            </li>
          </ul>
        </DocSection>

        <DocSection icon="🗓️" title="5. Changes to This Cookie Policy">
          <p>
            We may update our Cookie Policy from time to time. We will notify you of any changes by posting the new
            Cookie Policy on this page. You are advised to review this Cookie Policy periodically for any changes.
            Changes to this Cookie Policy are effective when they are posted on this page.
          </p>
        </DocSection>

        <DocSection icon="✉️" title="6. Contact Us">
          <p>If you have any questions about our Cookie Policy, please contact us:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Email: info@afhome.biz</li>
            <li>Address: AF Home Head Office, Meycauayan, Bulacan</li>
          </ul>
        </DocSection>

        <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-slate-800 dark:text-slate-100">Thank you for visiting AF Home!</p>
          <p className="mt-3 font-medium text-slate-900 dark:text-slate-50">
            You can update cookie preferences anytime using your browser settings.
          </p>
        </div>
      </div>
    </LegalPageShell>
  )
}

