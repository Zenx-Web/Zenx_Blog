import { NextRequest, NextResponse } from 'next/server'
import { 
  sendWelcomeEmail,
  sendVerificationEmail,
  sendNewPostNotification,
  sendWeeklyDigest,
  sendPasswordResetEmail
} from '@/lib/email'

/**
 * Test email templates
 * Visit: http://localhost:3000/api/test-emails?type=welcome&email=your@email.com
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter required. Usage: ?type=welcome&email=test@example.com' },
      { status: 400 }
    )
  }

  try {
    let result

    switch (type) {
      case 'welcome':
        result = await sendWelcomeEmail(email, 'Test User')
        break

      case 'verification':
        result = await sendVerificationEmail(email, 'test-token-123')
        break

      case 'new-post':
        result = await sendNewPostNotification(email, {
          title: 'The Future of AI: What You Need to Know in 2025',
          excerpt: 'Artificial intelligence is transforming our world at an unprecedented pace. From ChatGPT to self-driving cars, AI is becoming an integral part of our daily lives. Here\'s what you need to know about the latest developments.',
          slug: 'future-of-ai-2025',
          category: 'Technology',
          featured_image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800'
        })
        break

      case 'weekly-digest':
        result = await sendWeeklyDigest(email, [
          {
            title: 'Top 10 Trending Tech Gadgets This Week',
            excerpt: 'From the latest smartphones to innovative wearables, these are the gadgets everyone is talking about.',
            slug: 'top-tech-gadgets',
            category: 'Technology',
            featured_image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400',
            views: 15420
          },
          {
            title: 'Hollywood\'s Biggest Surprises at the Awards',
            excerpt: 'Unexpected wins and emotional speeches dominated this year\'s ceremony.',
            slug: 'hollywood-awards-surprises',
            category: 'Entertainment',
            featured_image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400',
            views: 12380
          },
          {
            title: 'Stock Market Reaches All-Time High',
            excerpt: 'Investors celebrate as major indices hit record levels amid economic optimism.',
            slug: 'stock-market-record',
            category: 'Business',
            views: 9850
          },
          {
            title: '5 Lifestyle Changes for Better Health',
            excerpt: 'Simple daily habits that can transform your wellbeing.',
            slug: 'lifestyle-health-tips',
            category: 'Lifestyle',
            featured_image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
            views: 7230
          },
          {
            title: 'Championship Finals: What to Expect',
            excerpt: 'Preview of the most anticipated sports event of the season.',
            slug: 'championship-preview',
            category: 'Sports',
            featured_image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400',
            views: 6450
          }
        ])
        break

      case 'password-reset':
        result = await sendPasswordResetEmail(
          email,
          'http://localhost:3000/auth/reset-password?token=test-reset-token'
        )
        break

      default:
        return NextResponse.json({
          error: 'Invalid type. Use: welcome, verification, new-post, weekly-digest, or password-reset',
          examples: [
            '?type=welcome&email=test@example.com',
            '?type=verification&email=test@example.com',
            '?type=new-post&email=test@example.com',
            '?type=weekly-digest&email=test@example.com',
            '?type=password-reset&email=test@example.com'
          ]
        }, { status: 400 })
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${type} email sent to ${email}`,
        note: 'Check your inbox! (might be in spam folder)'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
