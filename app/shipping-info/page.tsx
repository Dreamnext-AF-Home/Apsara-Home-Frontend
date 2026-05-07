import { buildPageMetadata } from '@/app/seo'
import LegalPageShell from '@/components/legal/LegalPageShell'

export const metadata = buildPageMetadata({
  title: 'Shipping Info',
  description: 'Learn about AF Home shipping options, delivery times, and coverage areas across the Philippines.',
  path: '/shipping-info',
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

export default function ShippingInfoPage() {
  return (
    <LegalPageShell
      title="Shipping Info"
      subtitle="Everything you need to know about how we deliver your order."
    >
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-cyan-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-200 dark:ring-cyan-900/40">
            <span className="text-sm font-bold" aria-hidden="true">
              🚚
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Shipping, explained</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Delivery coverage, fees, processing time, tracking, and what to do if something goes wrong.
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <DocCard icon="📍" title="Delivery Coverage">
          <p>
            AF Home delivers nationwide across the Philippines. Delivery timeframes vary by location:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>Metro Manila</strong> — 3 to 5 business days
            </li>
            <li>
              <strong>Luzon (outside Metro Manila)</strong> — 5 to 7 business days
            </li>
            <li>
              <strong>Visayas &amp; Mindanao</strong> — 7 to 14 business days
            </li>
            <li>
              <strong>Remote areas</strong> — may take longer; our team will contact you to confirm
            </li>
          </ul>
          <p className="mt-3">Business days are Monday through Saturday, excluding public holidays.</p>
        </DocCard>

        <DocCard icon="🧾" title="Shipping Fees">
          <p>
            Shipping fees are calculated at checkout based on the delivery address and the total weight or
            dimensions of your order. We partner with trusted couriers to ensure your items arrive safely and on time.
          </p>
          <p className="mt-3">
            Free shipping promotions may be available during special sale events. Watch our announcements for updates.
          </p>
        </DocCard>

        <DocCard icon="⏱️" title="Order Processing">
          <p>
            Orders are processed within <strong>1 to 2 business days</strong> after payment confirmation. You will
            receive a confirmation email with your order details once processing begins.
          </p>
          <p className="mt-3">Orders placed on weekends or public holidays will be processed on the next business day.</p>
        </DocCard>

        <DocCard icon="📦" title="Tracking Your Order">
          <p>
            Once your order has been shipped, you will receive a tracking number via email or SMS. You can use this
            number to monitor your delivery status through our{' '}
            <a className="font-semibold text-cyan-700 underline underline-offset-2 hover:text-cyan-800 dark:text-cyan-200" href="/track-order">
              Track Order
            </a>{' '}
            page or directly on the courier&apos;s website.
          </p>
        </DocCard>

        <DocCard icon="🛠️" title="Large Item Delivery">
          <p>
            For bulky furniture and appliances, delivery is handled by our in-house logistics team or specialized
            freight partners. Our team will coordinate a delivery schedule with you after your order is confirmed.
          </p>
          <p className="mt-3">
            Please ensure someone is available at the delivery address to receive and inspect the items upon arrival.
          </p>
        </DocCard>

        <DocCard icon="🚨" title="Damaged or Lost Shipments">
          <p>
            If your order arrives damaged or does not arrive within the expected timeframe, please contact us
            immediately at{' '}
            <a className="font-semibold text-cyan-700 underline underline-offset-2 hover:text-cyan-800 dark:text-cyan-200" href="mailto:info@afhome.biz">
              info@afhome.biz
            </a>{' '}
            or call{' '}
            <a className="font-semibold text-cyan-700 underline underline-offset-2 hover:text-cyan-800 dark:text-cyan-200" href="tel:028400290">
              02-840 0290
            </a>
            . We will coordinate with the courier and resolve the issue as quickly as possible.
          </p>
        </DocCard>
      </section>
    </LegalPageShell>
  )
}

