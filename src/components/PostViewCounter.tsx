'use client'

import { useEffect, useState } from 'react'

interface StoredViewRecord {
  timestamp: number
  views?: number
}

interface PostViewCounterProps {
  postId: string
  slug: string
  initialViews: number
  className?: string
}

const VIEW_TTL_MS = 6 * 60 * 60 * 1000 // limits increments to once every 6 hours per device

function parseStoredRecord(raw: string | null): StoredViewRecord | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as StoredViewRecord
    if (typeof parsed.timestamp !== 'number') return null
    return parsed
  } catch (error) {
    console.warn('Failed to parse stored view record', error)
    return null
  }
}

export default function PostViewCounter({ postId, slug, initialViews, className }: PostViewCounterProps) {
  const [views, setViews] = useState(initialViews)

  useEffect(() => {
    if (!postId || !slug || typeof window === 'undefined') {
      return
    }

    let cancelled = false
    const storageKey = `zenx:viewed:${postId}`
    const now = Date.now()

    const existingRecord = parseStoredRecord(localStorage.getItem(storageKey))
    if (existingRecord && now - existingRecord.timestamp < VIEW_TTL_MS) {
      if (typeof existingRecord.views === 'number') {
        setViews(existingRecord.views)
      }
      return
    }

    const recordView = async () => {
      try {
        const response = await fetch(`/api/posts/${encodeURIComponent(slug)}/view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to record view: ${response.status}`)
        }

        const data = (await response.json()) as { views?: number }
        const nextViews = typeof data.views === 'number' ? data.views : initialViews + 1

        if (!cancelled) {
          setViews(nextViews)
        }

        localStorage.setItem(
          storageKey,
          JSON.stringify({ timestamp: Date.now(), views: nextViews })
        )
      } catch (error) {
        console.warn('Unable to record blog post view', error)
      }
    }

    void recordView()

    return () => {
      cancelled = true
    }
  }, [postId, slug, initialViews])

  return <span className={className}>{views.toLocaleString()} views</span>
}
