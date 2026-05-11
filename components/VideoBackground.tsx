'use client'

import { useState } from 'react'

type VideoBackgroundProps = {
  videoSrc?: string
}

const VideoBackground = ({ videoSrc = '/loginpageVideo/home-login.mp4' }: VideoBackgroundProps) => {
  const [isReady, setIsReady] = useState(false)

  return (
    <div className="absolute inset-0">
      {/* Fallback layer para hindi gray/blank habang naglo-load ang video */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onCanPlay={() => setIsReady(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
    </div>
  )
}

export default VideoBackground
