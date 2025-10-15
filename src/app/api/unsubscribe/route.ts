import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { TablesUpdate } from '@/types/database.types'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase()

    const updatePayload: TablesUpdate<'email_subscriptions'> = {
      unsubscribed_at: new Date().toISOString(),
      is_verified: false
    }

    const { error } = await supabaseAdmin
      .from('email_subscriptions')
      .update(updatePayload)
      .eq('email', normalizedEmail)

    if (error) {
      console.error('Unsubscribe error:', error)
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Successfully unsubscribed. We\'re sorry to see you go!',
    })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
