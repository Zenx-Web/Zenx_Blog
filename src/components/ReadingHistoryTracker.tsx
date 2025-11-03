'use client'

import { useEffect, useRef } from 'react'
import { useReadingHistory } from '@/hooks/useReadingHistory'

interface ReadingHistoryTrackerProps {
  postId: string
  articleElementId?: string
}

const DEFAULT_ARTICLE_ID = 'zenx-article-content'

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, value))
}

export default function ReadingHistoryTracker({
  postId,
  articleElementId = DEFAULT_ARTICLE_ID,
}: ReadingHistoryTrackerProps) {
  const { trackReading } = useReadingHistory()
  const startTimeRef = useRef<number | null>(null)
  const lastRecordedProgressRef = useRef(0)
  const intervalIdRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!postId) {
      return undefined
    }

    startTimeRef.current = Date.now()

    const getProgress = () => {
      const article = document.getElementById(articleElementId)
      if (!article) {
        return 0
      }

      const rect = article.getBoundingClientRect()
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
      const articleTop = rect.top + scrollTop
      const articleHeight = article.offsetHeight
      const viewportBottom = scrollTop + window.innerHeight

      if (articleHeight <= 0) {
        return 0
      }

      const pixelsRead = viewportBottom - articleTop
      const progress = (pixelsRead / articleHeight) * 100
      return clampProgress(progress)
    }

    const sendProgress = async (force = false) => {
      const progress = Math.round(getProgress())
      const lastProgress = lastRecordedProgressRef.current
      const progressGain = progress - lastProgress
      const reachedCompletion = progress >= 95 && lastProgress < 95
      const elapsedSeconds = startTimeRef.current
        ? Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000))
        : 0

      if (!force && progressGain < 10 && !reachedCompletion) {
        return
      }

      lastRecordedProgressRef.current = Math.max(lastProgress, progress)
      await trackReading(postId, progress, elapsedSeconds)
    }

    const scheduleProgressUpdate = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        void sendProgress(false)
      })
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void sendProgress(true)
      }
    }

    const handleBeforeUnload = () => {
      void sendProgress(true)
    }

    window.addEventListener('scroll', scheduleProgressUpdate, { passive: true })
    window.addEventListener('resize', scheduleProgressUpdate)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    intervalIdRef.current = window.setInterval(() => {
      void sendProgress(false)
    }, 20000)

    void sendProgress(true)

    return () => {
      if (intervalIdRef.current !== null) {
        window.clearInterval(intervalIdRef.current)
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      window.removeEventListener('scroll', scheduleProgressUpdate)
      window.removeEventListener('resize', scheduleProgressUpdate)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      void sendProgress(true)
    }
  }, [articleElementId, postId, trackReading])

  return null
}
