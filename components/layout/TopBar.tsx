'use client'

export type TopBarConfig = {
  phone?: string
  email?: string
  messages?: string[]
  hideMarquee?: boolean
  facebookLabel?: string
  facebookUrl?: string
  instagramLabel?: string
  instagramUrl?: string
  tiktokLabel?: string
  tiktokUrl?: string
}

function FacebookIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
    </svg>
  )
}

const defaultMessages = [
  'Free Shipping on orders over PHP 5,000',
  'Summer Sale - Up to 50% off selected items',
  'New arrivals every week',
  'Nationwide delivery to all major cities',
  'Installment available via GCash & Maya',
]

export default function TopBar({
  phone = '+63 912 345 6789',
  email = 'hello@afhome.ph',
  messages = defaultMessages,
  hideMarquee = false,
  facebookLabel = 'Facebook',
  facebookUrl = 'https://www.facebook.com/AFHomePH/',
  instagramLabel = 'Instagram',
  instagramUrl = 'https://www.instagram.com/afhome.ph/',
  tiktokLabel = 'TikTok',
  tiktokUrl = 'https://www.tiktok.com/@afhomeph',
}: TopBarConfig = {}) {
  const socialLinks = [
    { icon: FacebookIcon, href: facebookUrl, label: facebookLabel },
    { icon: InstagramIcon, href: instagramUrl, label: instagramLabel },
    { icon: TikTokIcon, href: tiktokUrl, label: tiktokLabel },
  ].filter((social) => Boolean(social.href?.trim()))

  return (
    <div className="sticky top-0 z-[51] bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 text-xs py-2 overflow-hidden">
      <div className="container mx-auto px-4 flex items-center">
        <div className="hidden md:flex items-center gap-5 shrink-0">
          <a href={`tel:${phone.replace(/\s+/g, '')}`} className="flex items-center gap-1.5 hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            {phone}
          </a>
          <a href={`mailto:${email}`} className="flex items-center gap-1.5 hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,12 2,6" /></svg>
            {email}
          </a>
        </div>

        <div className="flex-1 overflow-hidden mx-4">
          <div className={`flex w-max whitespace-nowrap ${hideMarquee ? '' : 'animate-marquee'}`}>
            {(hideMarquee ? [] : [...messages, ...messages]).map((message, index) => (
              <span key={index} className="mx-10">{message}</span>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 shrink-0 text-gray-500 dark:text-gray-500">
          {socialLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
            >
              <social.icon />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
