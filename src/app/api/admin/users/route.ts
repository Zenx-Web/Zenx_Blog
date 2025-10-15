import { NextRequest, NextResponse } from 'next/server'
import { ensureAdminApiAccess } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizeEmailPreferences } from '@/lib/preferences'
import type { Database } from '@/types/database.types'

const MAX_PER_PAGE = 100

type UserProfileRow = Database['public']['Tables']['user_profiles']['Row']

export async function GET(request: NextRequest) {
  try {
    const session = await ensureAdminApiAccess()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const perPageParam = Math.max(1, parseInt(searchParams.get('perPage') || '25', 10))
    const perPage = Math.min(MAX_PER_PAGE, perPageParam)
    const query = searchParams.get('query')?.toLowerCase().trim() || ''
    const status = (searchParams.get('status') || 'all') as 'all' | 'active' | 'deactivated'

    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) {
      console.error('Failed to list Supabase users:', error)
      return NextResponse.json({ error: 'Unable to load users' }, { status: 500 })
    }

    const users = data?.users ?? []

    let filteredUsers = users
    if (query) {
      filteredUsers = filteredUsers.filter((user) => {
        const email = user.email?.toLowerCase() || ''
        const name = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.toLowerCase() : ''
        return email.includes(query) || name.includes(query)
      })
    }

    if (status === 'active') {
      filteredUsers = filteredUsers.filter((user) => {
        const bannedUntil = (user as { banned_until?: string | null }).banned_until
        return !bannedUntil
      })
    } else if (status === 'deactivated') {
      filteredUsers = filteredUsers.filter((user) => {
        const bannedUntil = (user as { banned_until?: string | null }).banned_until
        return Boolean(bannedUntil)
      })
    }

    const userIds = filteredUsers.map((user) => user.id)
  let profiles: UserProfileRow[] = []

    if (userIds.length > 0) {
      const { data: profileRows, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .in('id', userIds)

      if (profileError) {
        console.warn('Failed to load user profiles:', profileError)
      } else if (profileRows) {
        profiles = profileRows
      }
    }

    const profileMap = new Map<string, UserProfileRow>(
      profiles.map((row) => [String(row.id), row])
    )

    const results = filteredUsers.map((user) => {
      const profile = profileMap.get(user.id)
      const bannedUntil = (user as { banned_until?: string | null }).banned_until ?? null
      return {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
      bannedUntil,
        factors: Array.isArray(user.factors) ? user.factors.length : 0,
        profile: profile
          ? {
              display_name: profile.display_name ?? null,
              avatar_url: profile.avatar_url ?? null,
              bio: profile.bio ?? null,
              preferences: normalizeEmailPreferences(profile.preferences ?? null),
              updated_at: profile.updated_at ?? null,
            }
          : null,
      }
    })

    return NextResponse.json({
      users: results,
      pagination: {
        page,
        perPage,
        count: results.length,
        hasMore: Boolean(data?.next_page),
      },
    })
  } catch (error) {
    console.error('Admin users endpoint failure:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
