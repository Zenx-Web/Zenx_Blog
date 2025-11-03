'use client'

import { useEffect } from 'react'
import type { CSSProperties } from 'react'

const ADSENSE_CLIENT_ID = 'ca-pub-2681687429819093'

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>
  }
}

interface AdSlotProps {
  slotId: string
  format?: string
  layoutKey?: string
  layout?: string
  responsive?: boolean
  variant?: 'panel' | 'minimal' | 'bare'
  className?: string
  slotStyle?: CSSProperties
  title?: string
  showLabel?: boolean
}

export default function AdSlot({
  slotId,
  format = 'auto',
  layoutKey,
  layout,
  responsive = true,
  variant = 'panel',
  className,
  slotStyle,
  title,
  showLabel
}: AdSlotProps) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.adsbygoogle = window.adsbygoogle || []
      window.adsbygoogle.push({})
    } catch (error) {
      console.error('AdSense slot render failed', error)
    }
  }, [slotId])

  const label = title ?? 'Advertisement'
  const shouldShowLabel = showLabel ?? variant !== 'bare'
  const computedSlotStyle: CSSProperties = {
    display: 'block',
    width: '100%',
    ...slotStyle
  }

  const renderAd = () => (
    <ins
      className="adsbygoogle"
      style={computedSlotStyle}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={slotId}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : undefined}
      data-ad-layout-key={layoutKey ?? undefined}
      data-ad-layout={layout ?? undefined}
    />
  )

  if (variant === 'minimal') {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm ${className ?? ''}`}>
        {shouldShowLabel && (
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
        )}
  {renderAd()}
      </div>
    )
  }

  if (variant === 'bare') {
    return (
      <div className={`w-full ${className ?? ''}`}>
        {shouldShowLabel && (
          <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
            {label}
          </div>
        )}
        {renderAd()}
      </div>
    )
  }

  return (
    <div className={`rounded-3xl bg-slate-50 p-6 text-center text-slate-500 shadow-inner ${className ?? ''}`}>
      <div className="flex h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-2">
        {shouldShowLabel && <span className="text-sm font-medium text-slate-500">{label}</span>}
  {renderAd()}
      </div>
    </div>
  )
}
