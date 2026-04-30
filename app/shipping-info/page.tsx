import { buildPageMetadata } from '@/app/seo';
import LegalPageShell from '@/components/legal/LegalPageShell';

export const metadata = buildPageMetadata({
  title: 'Shipping Info',
  description: 'Learn about AF Home shipping options, delivery times, and coverage areas across the Philippines.',
  path: '/shipping-info',
});

export default function ShippingInfoPage() {
  return (
    <LegalPageShell
      title="Shipping Info"
      subtitle="Everything you need to know about how we deliver your order."
    >
      <section className="space-y-8">
        <div>
          <h2>Delivery Coverage</h2>
          <p>
            AF Home delivers nationwide across the Philippines. Delivery timeframes vary by location:
          </p>
          <ul>
            <li><strong>Metro Manila</strong> — 3 to 5 business days</li>
            <li><strong>Luzon (outside Metro Manila)</strong> — 5 to 7 business days</li>
            <li><strong>Visayas &amp; Mindanao</strong> — 7 to 14 business days</li>
            <li><strong>Remote areas</strong> — may take longer; our team will contact you to confirm</li>
          </ul>
          <p>
            Business days are Monday through Saturday, excluding public holidays.
          </p>
        </div>

        <div>
          <h2>Shipping Fees</h2>
          <p>
            Shipping fees are calculated at checkout based on the delivery address and the total weight or dimensions of
            your order. We partner with trusted couriers to ensure your items arrive safely and on time.
          </p>
          <p>
            Free shipping promotions may be available during special sale events. Watch our announcements for updates.
          </p>
        </div>

        <div>
          <h2>Order Processing</h2>
          <p>
            Orders are processed within <strong>1 to 2 business days</strong> after payment confirmation. You will
            receive a confirmation email with your order details once processing begins.
          </p>
          <p>
            Orders placed on weekends or public holidays will be processed on the next business day.
          </p>
        </div>

        <div>
          <h2>Tracking Your Order</h2>
          <p>
            Once your order has been shipped, you will receive a tracking number via email or SMS. You can use this
            number to monitor your delivery status through our{' '}
            <a href="/track-order">Track Order</a> page or directly on the courier&apos;s website.
          </p>
        </div>

        <div>
          <h2>Large Item Delivery</h2>
          <p>
            For bulky furniture and appliances, delivery is handled by our in-house logistics team or specialized
            freight partners. Our team will coordinate a delivery schedule with you after your order is confirmed.
          </p>
          <p>
            Please ensure someone is available at the delivery address to receive and inspect the items upon arrival.
          </p>
        </div>

        <div>
          <h2>Damaged or Lost Shipments</h2>
          <p>
            If your order arrives damaged or does not arrive within the expected timeframe, please contact us
            immediately at{' '}
            <a href="mailto:info@afhome.biz">info@afhome.biz</a> or call{' '}
            <a href="tel:028400290">02-840 0290</a>. We will coordinate with the courier and resolve the issue as
            quickly as possible.
          </p>
        </div>
      </section>
    </LegalPageShell>
  );
}
