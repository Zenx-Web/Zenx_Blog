'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

export interface SavedPost {
  id: string
  user_id: string
  post_id: string
  saved_at: string | null
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

export function useSavedPosts() {
  const { user } = useAuth()
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setSavedPosts([])
      setLoading(false)
      return
    }

    fetchSavedPosts()
  }, [user])

  const fetchSavedPosts = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_saved_posts')
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
        .order('saved_at', { ascending: false })

      if (error) throw error
      setSavedPosts(data || [])
    } catch (err) {
      console.error('Failed to fetch saved posts:', err)
    } finally {
      setLoading(false)
    }
  }

  const savePost = async (postId: string) => {
    if (!user) return { error: 'Not authenticated' }

    try {
      const { error } = await supabase
        .from('user_saved_posts')
        .insert({
          user_id: user.id,
          post_id: postId,
        })

      if (error) throw error
      await fetchSavedPosts()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to save post' }
    }
  }

  const unsavePost = async (postId: string) => {
    if (!user) return { error: 'Not authenticated' }

    try {
      const { error } = await supabase
        .from('user_saved_posts')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId)

      if (error) throw error
      await fetchSavedPosts()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to unsave post' }
    }
  }

  const isPostSaved = (postId: string) => {
    return savedPosts.some(sp => sp.post_id === postId)
  }

  return {
    savedPosts,
    loading,
    savePost,
    unsavePost,
    isPostSaved,
    refreshSavedPosts: fetchSavedPosts,
  }
}
