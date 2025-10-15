'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (!user) {
      setHistory([])
      setLoading(false)
      return
    }

    fetchHistory()
  }, [user])

  const fetchHistory = async () => {
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
  }

  const trackReading = async (postId: string, progress: number, readTimeSeconds: number) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('user_reading_history')
        .upsert({
          user_id: user.id,
          post_id: postId,
          progress,
          completed: progress >= 90,
          read_time_seconds: readTimeSeconds,
          last_read_at: new Date().toISOString(),
        })

      if (error) throw error
      await fetchHistory()
    } catch (err) {
      console.error('Failed to track reading:', err)
    }
  }

  const clearHistory = async () => {
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
  }

  return {
    history,
    loading,
    trackReading,
    clearHistory,
    refreshHistory: fetchHistory,
  }
}
