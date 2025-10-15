import { NextRequest, NextResponse } from 'next/server'
import { ensureAdminApiAccess } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { sendPasswordResetEmail } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://imzenx.in'

interface ActionPayload {
  action: 'reset_password' | 'deactivate' | 'activate' | 'delete'
  userId?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await ensureAdminApiAccess()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as ActionPayload
    const { action, userId } = body

    if (!action || !userId) {
      return NextResponse.json({ error: 'Missing action or userId' }, { status: 400 })
    }

    switch (action) {
      case 'reset_password': {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
        if (userError || !userData?.user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const email = userData.user.email
        if (!email) {
          return NextResponse.json({ error: 'User does not have an email address' }, { status: 400 })
        }

        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: {
            redirectTo: `${SITE_URL}/auth/reset`,
          },
        })

        const actionLink = (linkData as { action_link?: string })?.action_link

        if (linkError || !actionLink) {
          console.error('Failed to generate password reset link:', linkError)
          return NextResponse.json({ error: 'Unable to generate reset link' }, { status: 500 })
        }

        const emailResult = await sendPasswordResetEmail(email, actionLink)
        if (!emailResult.success) {
          return NextResponse.json({ error: emailResult.error || 'Unable to send password reset email' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Password reset email sent.' })
      }

      case 'deactivate': {
        const fiveYearBanHours = 24 * 365 * 5

        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: `${fiveYearBanHours}h`,
        })

        if (error) {
          console.error('Failed to deactivate user:', error)
          return NextResponse.json({ error: 'Unable to deactivate user' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'User deactivated.' })
      }

      case 'activate': {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: 'none',
        })

        if (error) {
          console.error('Failed to reactivate user:', error)
          return NextResponse.json({ error: 'Unable to reactivate user' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'User reactivated.' })
      }

      case 'delete': {
        const { data: userData, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId)
        if (fetchError) {
          console.error('Failed to fetch user before deletion:', fetchError)
          return NextResponse.json({ error: 'Unable to delete user' }, { status: 500 })
        }

        const email = userData?.user?.email?.toLowerCase() || null

        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (error) {
          console.error('Failed to delete auth user:', error)
          return NextResponse.json({ error: 'Unable to delete user' }, { status: 500 })
        }

        const cleanupTasks: Array<Promise<void>> = [
          Promise.resolve(
            supabaseAdmin.from('user_profiles').delete().eq('id', userId)
          ).then(() => undefined),
          Promise.resolve(
            supabaseAdmin.from('user_saved_posts').delete().eq('user_id', userId)
          ).then(() => undefined),
          Promise.resolve(
            supabaseAdmin.from('user_reading_history').delete().eq('user_id', userId)
          ).then(() => undefined),
        ]

        if (email) {
          cleanupTasks.push(
            Promise.resolve(
              supabaseAdmin.from('email_subscriptions').delete().eq('email', email)
            ).then(() => undefined)
          )
        }

        await Promise.allSettled(cleanupTasks)

        return NextResponse.json({ success: true, message: 'User deleted.' })
      }

      default:
        return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin user action failure:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
