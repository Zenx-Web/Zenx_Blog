'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import type { Database, Json, UserPreferences as StoredUserPreferences } from '@/types/database.types'

export interface UserProfile {
  id: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  preferences: {
    emailNotifications?: boolean
    theme?: 'light' | 'dark' | string
  } | null
  created_at: string | null
  updated_at: string | null
}

type UserProfileRow = Database['public']['Tables']['user_profiles']['Row']

function normalizePreferences(
  preferences: StoredUserPreferences | Json | null
): UserProfile['preferences'] {
  if (typeof preferences !== 'object' || preferences === null || Array.isArray(preferences)) {
    return null
  }

  const record = preferences as Record<string, unknown>

  return {
    emailNotifications:
      typeof record.emailNotifications === 'boolean' ? record.emailNotifications : undefined,
    theme: typeof record.theme === 'string' ? record.theme : undefined
  }
}

export function useUserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      const normalizedProfile: UserProfile = {
        ...data as UserProfileRow,
        preferences: normalizePreferences((data as UserProfileRow).preferences)
      }

      setProfile(normalizedProfile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    fetchProfile()
  }, [user, fetchProfile])

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'Not authenticated' }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error
      await fetchProfile()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update profile' }
    }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile: fetchProfile,
  }
}
