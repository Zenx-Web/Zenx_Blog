import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = join(__dirname, '..', '.env.local')

console.log('Loading environment from:', envPath)
config({ path: envPath })

console.log('\n=== Email Configuration Check ===\n')
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set (' + process.env.RESEND_API_KEY.substring(0, 10) + '...)' : '❌ NOT SET')
console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || '❌ NOT SET')
console.log('NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL || '❌ NOT SET')

console.log('\n=== Supabase Configuration ===\n')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ NOT SET')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ NOT SET')

// Check for subscribers in database
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('\n=== Checking Database for Subscribers ===\n')
  
  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Check email_subscriptions table
    const { data: subs, error: subsError } = await supabase
      .from('email_subscriptions')
      .select('email, is_verified, unsubscribed_at, preferences')
      .limit(10)
    
    if (subsError) {
      console.log('❌ Error fetching from email_subscriptions:', subsError.message)
    } else {
      console.log(`Found ${subs?.length || 0} email subscriptions:`)
      if (subs && subs.length > 0) {
        subs.forEach((sub, idx) => {
          console.log(`  ${idx + 1}. ${sub.email} - Verified: ${sub.is_verified ? '✅' : '❌'} - Unsubscribed: ${sub.unsubscribed_at ? '✅' : '❌'}`)
        })
      } else {
        console.log('  ⚠️  No subscribers found in email_subscriptions table')
      }
    }
    
    // Check newsletter_subscribers table
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletter_subscribers')
      .select('email, subscribed_at')
      .limit(10)
    
    if (newsletterError) {
      console.log('\n❌ Error fetching from newsletter_subscribers:', newsletterError.message)
    } else {
      console.log(`\nFound ${newsletter?.length || 0} newsletter subscribers:`)
      if (newsletter && newsletter.length > 0) {
        newsletter.forEach((sub, idx) => {
          console.log(`  ${idx + 1}. ${sub.email}`)
        })
      } else {
        console.log('  ⚠️  No subscribers found in newsletter_subscribers table')
      }
    }
    
    // Check recent blog posts
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('id, title, is_published, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(5)
    
    if (postsError) {
      console.log('\n❌ Error fetching posts:', postsError.message)
    } else {
      console.log(`\n=== Recent Published Posts (${posts?.length || 0}) ===\n`)
      if (posts && posts.length > 0) {
        posts.forEach((post, idx) => {
          console.log(`  ${idx + 1}. ${post.title}`)
          console.log(`     Published: ${post.published_at}`)
        })
      } else {
        console.log('  ⚠️  No published posts found')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
} else {
  console.log('\n⚠️  Cannot check database - Supabase credentials not configured')
}

console.log('\n=== Recommendations ===\n')

if (!process.env.RESEND_API_KEY) {
  console.log('❌ ISSUE: RESEND_API_KEY is not set')
  console.log('   FIX: Verify the API key is in .env.local file')
}

console.log('\n✅ Test complete!\n')
