import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendNewsletterWelcomeEmail } from '@/lib/email'
import type { TablesInsert, TablesUpdate } from '@/types/database.types'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')

    // Check if email already exists
    const normalizedEmail = email.toLowerCase()

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('email_subscriptions')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (fetchError && fetchError.code !== 'PGRST116' && fetchError.code !== 'PGRST301') {
      console.error('Subscription lookup error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to check subscription status' },
        { status: 500 }
      )
    }

    const shouldSendWelcomeEmail =
      !existing || !existing.is_verified || existing.unsubscribed_at !== null

    if (existing) {
      if (existing.is_verified) {
        return NextResponse.json(
          { message: 'You are already subscribed!' },
          { status: 200 }
        )
      } else {
        // Resend verification
        const updatePayload: TablesUpdate<'email_subscriptions'> = {
          verification_token: verificationToken,
          unsubscribed_at: null
        }

        await supabaseAdmin
          .from('email_subscriptions')
          .update(updatePayload)
          .eq('email', normalizedEmail)
      }
    } else {
      // Create new subscription
      const insertPayload: TablesInsert<'email_subscriptions'> = {
        email: normalizedEmail,
        verification_token: verificationToken
      }

      const { error } = await supabaseAdmin
        .from('email_subscriptions')
        .insert(insertPayload)

      if (error) {
        console.error('Subscription error:', error)
        return NextResponse.json(
          { error: 'Failed to subscribe' },
          { status: 500 }
        )
      }
    }

    // TODO: Send verification email
    // For now, we'll auto-verify (implement email sending with Resend later)
    const verificationUpdate: TablesUpdate<'email_subscriptions'> = {
      is_verified: true,
      verified_at: new Date().toISOString(),
      unsubscribed_at: null
    }

    await supabaseAdmin
      .from('email_subscriptions')
      .update(verificationUpdate)
      .eq('email', normalizedEmail)

    if (shouldSendWelcomeEmail) {
      const emailResult = await sendNewsletterWelcomeEmail(normalizedEmail)

      if (!emailResult.success) {
        console.error('Failed to send newsletter welcome email:', emailResult.error)
      }
    }

    return NextResponse.json({
      message: 'Successfully subscribed! Welcome to Zenx Blog newsletter.',
    })
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
