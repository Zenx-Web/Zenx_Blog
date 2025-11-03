'use client'

import { useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import InlineAd from './InlineAd'

interface InlineAdInjectorProps {
  articleElementId: string
  clientId: string
  primarySlot: string
  secondarySlot: string
}

export default function InlineAdInjector({
  articleElementId,
  clientId,
  primarySlot,
  secondarySlot,
}: InlineAdInjectorProps) {
  useEffect(() => {
    const article = document.getElementById(articleElementId)
    if (!article) return

    const placeholders = Array.from(
      article.querySelectorAll<HTMLDivElement>('[data-slot][data-inline-ad]')
    )

    if (placeholders.length === 0) return

    const roots: Root[] = []

    placeholders.forEach((placeholder) => {
      const slot = placeholder.dataset.slot
      if (!slot) return

      const root = createRoot(placeholder)
      roots.push(root)

      const slotId = slot === 'primary' ? primarySlot : secondarySlot
      const label = slot === 'primary' ? 'Sponsored Read' : 'Recommended Partner'

      root.render(
        <InlineAd
          slotId={slotId}
          clientId={clientId}
          format="fluid"
          label={label}
        />
      )
    })

    return () => {
      roots.forEach((root) => root.unmount())
    }
  }, [articleElementId, clientId, primarySlot, secondarySlot])

  return null
}
