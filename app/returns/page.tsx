import Link from 'next/link';
import { buildPageMetadata } from '@/app/seo';
import LegalPageShell from '@/components/legal/LegalPageShell';

export const metadata = buildPageMetadata({
  title: 'Return & Refund',
  description: 'Learn about the AF Home return and refund policy — eligibility, process, and timelines.',
  path: '/returns',
});

export default function ReturnsPage() {
  return (
    <LegalPageShell
      title="Return & Refund"
      subtitle="We want you to feel confident about your purchase. This policy explains how returns and refunds work."
    >
      <section className="space-y-10">

        <p>
          At AF Home, we are committed to providing our customers with high-quality products and exceptional
          service. We understand that sometimes a purchase may not meet your expectations. This Return and
          Refund Policy outlines the terms and conditions under which returns and refunds are accepted.
        </p>

        <div>
          <h2>1. Return Eligibility</h2>
          <p>To be eligible for a return, the following conditions must be met:</p>
          <ul>
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
        </div>

        <div>
          <h2>2. Return Process</h2>
          <p>To initiate a return, please follow these steps:</p>
          <ol>
            <li>
              <strong>Contact Us:</strong> Reach out to our customer service team at{' '}
              <a href="mailto:info@afhome.biz">info@afhome.biz</a> or call{' '}
              <a href="tel:028400290">02-840 0290</a> to request a Return Merchandise Authorization (RMA)
              number. Please provide your order number and the reason for the return.
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
        </div>

        <div>
          <h2>3. Refund Process</h2>
          <ol>
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
        </div>

        <div>
          <h2>4. Exchanges</h2>
          <p>
            If you wish to exchange an item for a different size, color, or model, please contact our
            customer service team. Exchanges are subject to availability, and you may need to return the
            original item before the new item is shipped.
          </p>
        </div>

        <div>
          <h2>5. Non-Returnable Items</h2>
          <p>Certain items are non-returnable, including but not limited to:</p>
          <ul>
            <li>Gift cards</li>
            <li>Downloadable software products</li>
            <li>Personal care items (e.g., cosmetics, hygiene products)</li>
            <li>Items marked as final sale</li>
          </ul>
        </div>

        <div>
          <h2>6. Damaged or Defective Items</h2>
          <p>
            If you receive a damaged or defective item, please contact us within <strong>7 days</strong>{' '}
            of receipt. We will provide instructions for returning the item and will cover the return
            shipping costs for defective items.
          </p>
        </div>

        <div>
          <h2>7. Customer Service</h2>
          <p>
            For any questions or concerns regarding our Return and Refund Policy, please contact our
            customer service team at <a href="mailto:info@afhome.biz">info@afhome.biz</a> or call{' '}
            <a href="tel:028400290">02-840 0290</a>. We are here to assist you and ensure your
            satisfaction.
          </p>
          <p>Thank you for choosing AF Home. We appreciate your business!</p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
          Need help with a return? Reach us anytime through the{' '}
          <Link href="/contact-us" className="text-sky-600 hover:text-sky-500 font-medium">
            Contact Us
          </Link>{' '}
          page.
        </div>

      </section>
    </LegalPageShell>
  );
}
