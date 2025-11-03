import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizeEmailPreferences } from '@/lib/preferences'
import { sendNewPostNotification } from '@/lib/email'

/**
 * API endpoint to send email notifications when a new post is published
 * Call this from your admin panel after publishing a post
 */
export async function POST(request: NextRequest) {
  try {
    const { postId, sendToSubscribers = true } = await request.json()

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Get the post details
    const { data: post, error: postError } = await supabaseAdmin
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (!sendToSubscribers) {
      return NextResponse.json({
        message: 'Notifications disabled for this post',
      })
    }

    // Get verified subscribers
    // NOTE: With Resend test domain (onboarding@resend.dev), emails only work 
    // when sent to the Resend account owner email. Once imzenx.in domain is 
    // verified, all subscriber emails will work.
    const { data: subscribers, error: subsError } = await supabaseAdmin
      .from('email_subscriptions')
      .select('email, preferences')
      .eq('is_verified', true)
      .is('unsubscribed_at', null)

    if (subsError) {
      console.error('Failed to fetch subscribers:', subsError)
      return NextResponse.json(
        { error: 'Failed to fetch subscribers' },
        { status: 500 }
      )
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({
        message: 'No subscribers to notify',
        count: 0,
      })
    }

    // Filter subscribers who want new post notifications
    const activeSubscribers = subscribers.filter((sub) => {
      const preferences = normalizeEmailPreferences(sub.preferences)
      return preferences.newPosts !== false
    })

    // Send emails in batches to avoid rate limits
    const BATCH_SIZE = 10
    let successCount = 0
    let failureCount = 0

    for (let i = 0; i < activeSubscribers.length; i += BATCH_SIZE) {
      const batch = activeSubscribers.slice(i, i + BATCH_SIZE)
      
      const promises = batch.map(async (subscriber) => {
        try {
          const result = await sendNewPostNotification(subscriber.email, {
            title: post.title,
            excerpt: post.excerpt,
            slug: post.slug,
            category: post.category,
            featured_image: post.featured_image || undefined,
          })

          if (result.success) {
            successCount++
          } else {
            failureCount++
          }
        } catch (error) {
          console.error(`Failed to send to ${subscriber.email}:`, error)
          failureCount++
        }
      })

      await Promise.all(promises)

      // Add delay between batches to respect rate limits
      if (i + BATCH_SIZE < activeSubscribers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return NextResponse.json({
      message: 'Notifications sent',
      totalSubscribers: activeSubscribers.length,
      successCount,
      failureCount,
    })
  } catch (error) {
    console.error('Notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
