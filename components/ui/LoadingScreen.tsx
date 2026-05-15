
'use client'

type LoadingScreenProps = {
  logoSrc?: string | null
  logoAlt?: string
  brandText?: string
  tagline?: string
  useDefaultLogoFallback?: boolean
}

export default function LoadingScreen({
  logoSrc = '/Images/af_home_logo.png',
  logoAlt = 'AF Home Logo',
  brandText = 'AF HOME',
  tagline = 'Your Trusted Home Partner',
  useDefaultLogoFallback = true,
}: LoadingScreenProps) {
  const resolvedLogoSrc = logoSrc || (useDefaultLogoFallback ? '/Images/af_home_logo.png' : '')
  const [firstWord, ...rest] = brandText.trim().split(/\s+/)
  const highlightWord = rest.join(' ')


  return (
    <div
      id="af-loading-screen"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#faf8f5] transition-colors dark:bg-[#07111f]"
    >
      <div className="absolute -top-24 -right-24 h-80 w-80 animate-blob rounded-full bg-[#2c5f4f]/10 blur-3xl dark:bg-sky-500/12" />
      <div className="absolute -bottom-20 -left-20 h-72 w-72 animate-blob rounded-full bg-[#d4a574]/15 blur-3xl animation-delay-2000 dark:bg-cyan-400/10" />
      <div className="absolute top-1/3 -left-16 h-48 w-48 animate-blob rounded-full bg-[#2c5f4f]/8 blur-2xl animation-delay-4000 dark:bg-emerald-400/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(45,212,191,0.12),transparent_24%)] opacity-0 transition-opacity dark:opacity-100" />

      <div className="relative mb-8 flex items-center justify-center">
        <span
          className="absolute inline-flex animate-ping rounded-full bg-[#d4a574]/20 dark:bg-cyan-400/15"
          style={{ width: 180, height: 180, animationDuration: '2.4s', animationDelay: '0.3s' }}
        />
        <span
          className="absolute inline-flex animate-ping rounded-full bg-[#2c5f4f]/25 dark:bg-sky-400/20"
          style={{ width: 148, height: 148, animationDuration: '2s' }}
        />

        <span className="absolute h-32 w-32 rounded-full bg-[#2c5f4f]/10 blur-md dark:bg-sky-400/15" />

        <div className="relative z-10">
          <div className="animate-logo-enter" style={{ animationDelay: '80ms' }}>

            {resolvedLogoSrc ? (
              <img
                src={resolvedLogoSrc}
                alt={logoAlt}
                width={110}
                height={110}
                loading="eager"
                decoding="async"
                className="h-[110px] w-[110px] object-contain drop-shadow-xl mix-blend-multiply dark:mix-blend-normal dark:drop-shadow-[0_0_32px_rgba(56,189,248,0.22)]"
              />
            ) : (
              <span className="block h-[110px] w-[110px]" />
            )}
          </div>
        </div>
      </div>


      <div className="mb-10 flex flex-col items-center gap-1.5 animate-fade-up-in" style={{ animationDelay: '0.4s', opacity: 0 }}>
        <p className="font-display text-2xl font-semibold tracking-[0.18em] text-[#1a1a1a] dark:text-slate-100">
          {firstWord}
          {highlightWord ? <span className="text-[#d4a574] dark:text-cyan-300"> {highlightWord}</span> : null}
        </p>
        <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-[#6b6b6b] dark:text-slate-400">{tagline}</p>
      </div>

      <div className="flex items-center gap-2 animate-fade-up-in" style={{ animationDelay: '0.65s', opacity: 0 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="loading-dot h-2 w-2 rounded-full bg-[#2c5f4f] dark:bg-cyan-300"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>

      <div className="absolute bottom-0 left-0 h-[3px] w-full overflow-hidden bg-[#2c5f4f]/10 dark:bg-slate-800">
        <div className="absolute inset-y-0 w-1/3 animate-loading-sweep bg-gradient-to-r from-transparent via-[#2c5f4f] to-transparent dark:via-cyan-300" />
      </div>
    </div>
  )
}

