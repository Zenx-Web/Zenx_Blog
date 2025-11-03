import { supabaseAdmin } from './supabase'
import type { TablesInsert, TablesUpdate } from '@/types/database.types'

/**
 * Automatically subscribe a user to email notifications when they sign up/login
 * This ensures all registered users receive new post notifications
 */
export async function autoSubscribeUser(userEmail: string): Promise<{
  success: boolean
  error?: string
  alreadySubscribed?: boolean
}> {
  try {
    if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      return { success: false, error: 'Invalid email address' }
    }

    const normalizedEmail = userEmail.toLowerCase()

    // Check if already subscribed
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('email_subscriptions')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (fetchError && fetchError.code !== 'PGRST116' && fetchError.code !== 'PGRST301') {
      console.error('[AutoSubscribe] Lookup error:', fetchError)
      return { success: false, error: 'Database lookup failed' }
    }

    // If already subscribed and verified, do nothing
    if (existing?.is_verified && !existing.unsubscribed_at) {
      console.log(`[AutoSubscribe] User ${normalizedEmail} already subscribed`)
      return { success: true, alreadySubscribed: true }
    }

    // If subscription exists but not verified or unsubscribed, reactivate it
    if (existing) {
      const updatePayload: TablesUpdate<'email_subscriptions'> = {
        is_verified: true,
        verified_at: new Date().toISOString(),
        unsubscribed_at: null,
        verification_token: null
      }

      const { error: updateError } = await supabaseAdmin
        .from('email_subscriptions')
        .update(updatePayload)
        .eq('email', normalizedEmail)

      if (updateError) {
        console.error('[AutoSubscribe] Update error:', updateError)
        return { success: false, error: 'Failed to update subscription' }
      }

      console.log(`[AutoSubscribe] Reactivated subscription for ${normalizedEmail}`)
      return { success: true }
    }

    // Create new subscription (auto-verified for logged-in users)
    const insertPayload: TablesInsert<'email_subscriptions'> = {
      email: normalizedEmail,
      is_verified: true,
      verified_at: new Date().toISOString(),
      preferences: {
        newPosts: true,
        weekly: false,
        monthly: false
      }
    }

    const { error: insertError } = await supabaseAdmin
      .from('email_subscriptions')
      .insert(insertPayload)

    if (insertError) {
      console.error('[AutoSubscribe] Insert error:', insertError)
      return { success: false, error: 'Failed to create subscription' }
    }

    console.log(`[AutoSubscribe] Created new subscription for ${normalizedEmail}`)
    return { success: true }
  } catch (error) {
    console.error('[AutoSubscribe] Unexpected error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
