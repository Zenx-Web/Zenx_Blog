'use client'

import { useEffect, useRef } from 'react'

interface InlineAdProps {
  slotId: string
  clientId: string
  format?: string
  label?: string
  className?: string
}

export default function InlineAd({
  slotId,
  clientId,
  format = 'fluid',
  label = 'Advertisement',
  className,
}: InlineAdProps) {
  const adRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !adRef.current) return

    try {
      window.adsbygoogle = window.adsbygoogle || []
      window.adsbygoogle.push({})
    } catch (error) {
      console.warn('Inline Ad render failed', error)
    }
  }, [])

  return (
    <div ref={adRef} className={`my-6 flex flex-col items-center ${className ?? ''}`}>
      <span className="mb-2 text-xs uppercase tracking-wide text-gray-400">{label}</span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
