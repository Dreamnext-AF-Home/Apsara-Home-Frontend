import Link from 'next/link'
import { buildPageMetadata } from '@/app/seo'
import LegalPageShell from '@/components/legal/LegalPageShell'

export const metadata = buildPageMetadata({
  title: 'Return & Refund',
  description: 'Learn about the AF Home return and refund policy — eligibility, process, and timelines.',
  path: '/returns',
})

function DocCard({
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

export default function ReturnsPage() {
  return (
    <LegalPageShell
      title="Return & Refund"
      subtitle="We want you to feel confident about your purchase. This policy explains how returns and refunds work."
    >
      <div className="space-y-6">
        <DocCard icon="📦" title="Overview">
          <p>
            At AF Home, we are committed to providing our customers with high-quality products and exceptional
            service. We understand that sometimes a purchase may not meet your expectations. This Return and
            Refund Policy outlines the terms and conditions under which returns and refunds are accepted.
          </p>
        </DocCard>

        <DocCard icon="✅" title="1. Return Eligibility">
          <p>To be eligible for a return, the following conditions must be met:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>Timeframe:</strong> You have <strong>7 days</strong> from the date of purchase to
              initiate a return.
            </li>
            <li>
              <strong>Condition:</strong> Items must be unused, in their original packaging, and in the same
              condition as received. All tags and labels must be intact.
            </li>
            <li>
              <strong>Proof of Purchase:</strong> A receipt or proof of purchase is required to process
              your return.
            </li>
          </ul>
        </DocCard>

        <DocCard icon="🧾" title="2. Return Process">
          <p>To initiate a return, please follow these steps:</p>
          <ol className="mt-2 list-decimal space-y-2 pl-6">
            <li>
              <strong>Contact Us:</strong> Reach out to our customer service team at{' '}
              <a className="font-semibold text-cyan-700 underline underline-offset-2 hover:text-cyan-800 dark:text-cyan-200" href="mailto:info@afhome.biz">
                info@afhome.biz
              </a>{' '} or call{' '}
              <a className="font-semibold text-cyan-700 underline underline-offset-2 hover:text-cyan-800 dark:text-cyan-200" href="tel:028400290">
                02-840 0290
              </a>{' '} to request a Return Merchandise Authorization (RMA) number. Please provide your order number and the reason for the return.
            </li>
            <li>
              <strong>Packaging:</strong> Securely package the item(s) you wish to return, including all
              original packaging materials, accessories, and documentation.
            </li>
            <li>
              <strong>Shipping:</strong> Ship the item(s) to the address provided by our customer service
              team. You are responsible for the return shipping costs unless the return is due to a defective
              or incorrect item.
            </li>
          </ol>
        </DocCard>

        <DocCard icon="💳" title="3. Refund Process">
          <ol className="mt-2 list-decimal space-y-2 pl-6">
            <li>
              <strong>Inspection:</strong> Upon receiving your returned item, we will inspect it to ensure
              it meets our return criteria.
            </li>
            <li>
              <strong>Refund Approval:</strong> If your return is approved, we will process your refund
              within <strong>7 to 10 business days</strong>. The refund will be issued to the original
              payment method used at the time of purchase.
            </li>
            <li>
              <strong>Notification:</strong> You will receive an email notification confirming the status
              of your refund.
            </li>
          </ol>
        </DocCard>

        <DocCard icon="🔁" title="4. Exchanges">
          <p>
            If you wish to exchange an item for a different size, color, or model, please contact our
            customer service team. Exchanges are subject to availability, and you may need to return the
            original item before the new item is shipped.
          </p>
        </DocCard>

        <DocCard icon="⛔" title="5. Non-Returnable Items">
          <p>Certain items are non-returnable, including but not limited to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Gift cards</li>
            <li>Downloadable software products</li>
            <li>Personal care items (e.g., cosmetics, hygiene products)</li>
            <li>Items marked as final sale</li>
          </ul>
        </DocCard>

        <DocCard icon="🩹" title="6. Damaged or Defective Items">
          <p>
            If you receive a damaged or defective item, please contact us within <strong>7 days</strong> of receipt. We will provide instructions for returning the item and will cover the return shipping costs for defective items.
          </p>
        </DocCard>

        <DocCard icon="📞" title="7. Customer Service">
          <p>
            For any questions or concerns regarding our Return and Refund Policy, please contact our
            customer service team at{' '}
            <a className="font-semibold text-cyan-700 underline underline-offset-2 hover:text-cyan-800 dark:text-cyan-200" href="mailto:info@afhome.biz">
              info@afhome.biz
            </a>{' '} or call{' '}
            <a className="font-semibold text-cyan-700 underline underline-offset-2 hover:text-cyan-800 dark:text-cyan-200" href="tel:028400290">
              02-840 0290
            </a>. We are here to assist you and ensure your satisfaction.
          </p>
          <p className="mt-3">Thank you for choosing AF Home. We appreciate your business!</p>
        </DocCard>

        <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Need help with a return? Reach us anytime through the{' '}
            <Link href="/contact-us" className="font-semibold text-cyan-700 hover:text-cyan-800 dark:text-cyan-200">
              Contact Us
            </Link>{' '}page.
          </p>
        </div>
      </div>
    </LegalPageShell>
  )
}

