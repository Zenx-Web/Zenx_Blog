import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '..', '.env.local') })

console.log('=== Testing Email Notification System ===\n')

// Get the most recent published post
const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { data: posts, error } = await supabase
  .from('blog_posts')
  .select('id, title, excerpt, slug, category, featured_image, published_at')
  .eq('is_published', true)
  .order('published_at', { ascending: false })
  .limit(1)

if (error || !posts || posts.length === 0) {
  console.log('❌ No published posts found to test with')
  process.exit(1)
}

const post = posts[0]
console.log('📰 Testing with post:', post.title)
console.log('   Published:', post.published_at)
console.log('   Slug:', post.slug)
console.log('')

// Call the notification API
console.log('📧 Sending notification to subscribers...\n')

try {
  const response = await fetch('http://localhost:3000/api/admin/notify-subscribers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      postId: post.id,
      sendToSubscribers: true
    })
  })

  const result = await response.json()
  
  if (response.ok) {
    console.log('✅ SUCCESS!')
    console.log(`   Total subscribers: ${result.totalSubscribers || 0}`)
    console.log(`   Successfully sent: ${result.successCount || 0}`)
    console.log(`   Failed: ${result.failureCount || 0}`)
    console.log(`   Message: ${result.message}`)
  } else {
    console.log('❌ FAILED!')
    console.log('   Error:', result.error)
  }
} catch (error) {
  console.log('❌ ERROR:', error.message)
  console.log('\n⚠️  Make sure the dev server is running: npm run dev')
}

console.log('\n=== Test Complete ===\n')
