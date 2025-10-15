import { NextRequest, NextResponse } from 'next/server'
import { ensureAdminApiAccess } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

interface UpdateProfilePayload {
  userId?: string
  displayName?: string | null
  bio?: string | null
  avatarUrl?: string | null
  preferences?: Database['public']['Tables']['user_profiles']['Row']['preferences'] | null
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await ensureAdminApiAccess()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as UpdateProfilePayload
    const { userId, displayName, bio, avatarUrl, preferences } = body

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const payload: Database['public']['Tables']['user_profiles']['Insert'] = {
      id: userId,
      display_name: displayName ?? null,
      bio: bio ?? null,
      avatar_url: avatarUrl ?? null,
      preferences: preferences ?? null,
    }

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      console.error('Failed to update user profile:', error)
      return NextResponse.json({ error: 'Unable to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: data })
  } catch (error) {
    console.error('Admin update profile failure:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
