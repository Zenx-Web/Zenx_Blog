import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendWeeklyDigest } from '@/lib/email'
import { normalizeEmailPreferences } from '@/lib/preferences'

/**
 * API endpoint to send weekly digest emails
 * Set up a cron job to call this endpoint weekly (e.g., every Monday at 9 AM)
 * 
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/admin/send-weekly-digest",
 *     "schedule": "0 9 * * 1"
 *   }]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get top 5 posts from the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: topPosts, error: postsError } = await supabaseAdmin
      .from('blog_posts')
      .select('title, excerpt, slug, category, featured_image, views')
      .eq('is_published', true)
      .gte('published_at', sevenDaysAgo.toISOString())
      .order('views', { ascending: false })
      .limit(5)

    if (postsError || !topPosts || topPosts.length === 0) {
      return NextResponse.json({
        message: 'No posts to send',
      })
    }

    // Get subscribers who want weekly digests
    const { data: subscribers, error: subsError } = await supabaseAdmin
      .from('email_subscriptions')
      .select('email, preferences')
      .eq('is_verified', true)
      .is('unsubscribed_at', null)

    if (subsError || !subscribers || subscribers.length === 0) {
      return NextResponse.json({
        message: 'No subscribers',
      })
    }

    // Filter for weekly digest subscribers
    const weeklySubscribers = subscribers.filter((sub) => {
      const preferences = normalizeEmailPreferences(sub.preferences)
      return preferences.weekly === true
    })

    let successCount = 0
    let failureCount = 0

    const digestPosts = topPosts.map((post) => ({
      title: post.title,
      excerpt: post.excerpt,
      slug: post.slug,
      category: post.category,
      featured_image: post.featured_image ?? undefined,
      views: post.views ?? 0
    }))

    // Send in batches
    const BATCH_SIZE = 10
    for (let i = 0; i < weeklySubscribers.length; i += BATCH_SIZE) {
      const batch = weeklySubscribers.slice(i, i + BATCH_SIZE)
      
      const promises = batch.map(async (subscriber) => {
        try {
          const result = await sendWeeklyDigest(subscriber.email, digestPosts)
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

      // Delay between batches
      if (i + BATCH_SIZE < weeklySubscribers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return NextResponse.json({
      message: 'Weekly digest sent',
      totalSubscribers: weeklySubscribers.length,
      successCount,
      failureCount,
      postCount: topPosts.length,
    })
  } catch (error) {
    console.error('Weekly digest error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
