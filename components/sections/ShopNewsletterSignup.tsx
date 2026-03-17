'use client'

import { useState } from 'react'

export default function ShopNewsletterSignup({
  badge,
  heading,
  description,
  button,
}: {
  badge: string
  heading: string
  description: string
  button: string
}) {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (email.trim()) setSubscribed(true)
  }

  return (
    <section className="bg-slate-900 py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-4 py-1.5 text-sm font-semibold text-orange-400">
            {badge}
          </div>
          <h2 className="mb-3 text-3xl font-bold text-white">{heading}</h2>
          <p className="mb-8 text-white/50">{description}</p>

          {subscribed ? (
            <div className="rounded-2xl bg-green-500/15 px-6 py-4 font-medium text-green-300">
              Subscription received. Watch your inbox for AF Home updates.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mx-auto flex max-w-md gap-3">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email address"
                className="flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/40"
              />
              <button type="submit" className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white">
                {button}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
