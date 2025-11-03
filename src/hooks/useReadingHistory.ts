'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

export interface ReadingHistoryItem {
  id: string
  user_id: string
  post_id: string
  progress: number | null
  completed: boolean | null
  read_time_seconds: number | null
  first_read_at: string | null
  last_read_at: string | null
  post?: {
    id: string
    title: string
    slug: string
    excerpt: string
    featured_image: string | null
    category: string
    read_time: number | null
  }
}

export function useReadingHistory() {
  const { user } = useAuth()
  const [history, setHistory] = useState<ReadingHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_reading_history')
        .select(`
          *,
          post:blog_posts (
            id,
            title,
            slug,
            excerpt,
            featured_image,
            category,
            read_time
          )
        `)
        .eq('user_id', user.id)
        .order('last_read_at', { ascending: false })

      if (error) throw error
      setHistory(data || [])
    } catch (err) {
      console.error('Failed to fetch reading history:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setHistory([])
      setLoading(false)
      return
    }

    fetchHistory()
  }, [user, fetchHistory])

  const trackReading = useCallback(async (postId: string, progress: number, readTimeSeconds: number) => {
    if (!user) return

    const existingEntry = history.find((entry) => entry.post_id === postId)
    const existingProgress = existingEntry?.progress ?? null
    const maxProgress = Math.max(existingProgress ?? 0, progress)
    const existingReadTime = existingEntry?.read_time_seconds ?? null
    const maxReadTime = Math.max(existingReadTime ?? 0, readTimeSeconds)

    try {
      const payload = {
        user_id: user.id,
        post_id: postId,
        progress: maxProgress,
        completed: maxProgress >= 90,
        read_time_seconds: maxReadTime,
        last_read_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('user_reading_history')
        .upsert(payload, { onConflict: 'user_id,post_id' })

      if (error) throw error
      await fetchHistory()
    } catch (err) {
      console.error('Failed to track reading:', err)
    }
  }, [user, history, fetchHistory])

  const clearHistory = useCallback(async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('user_reading_history')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error
      setHistory([])
    } catch (err) {
      console.error('Failed to clear history:', err)
    }
  }, [user])

  return {
    history,
    loading,
    trackReading,
    clearHistory,
    refreshHistory: fetchHistory,
  }
}
