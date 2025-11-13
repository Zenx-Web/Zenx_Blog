import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 Searching for Google AI Cloud Compute post...\n')

// Search by title pattern
const { data: posts, error } = await supabase
  .from('blog_posts')
  .select('id, slug, title, is_published, created_at')
  .ilike('title', '%Google%AI%Cloud%')
  .order('created_at', { ascending: false })

if (error) {
  console.error('❌ Error:', error.message)
} else if (!posts || posts.length === 0) {
  console.log('❌ No posts found matching "Google AI Cloud"')
  console.log('\n📋 Showing all recent posts:')
  
  const { data: allPosts } = await supabase
    .from('blog_posts')
    .select('slug, title, is_published')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (allPosts) {
    console.table(allPosts)
  }
} else {
  console.log('✅ Found posts:\n')
  posts.forEach(post => {
    console.log(`Title: ${post.title}`)
    console.log(`Slug:  ${post.slug}`)
    console.log(`Published: ${post.is_published}`)
    console.log(`Created: ${post.created_at}`)
    console.log(`URL: /blog/${post.slug}?preview=true`)
    console.log('---')
  })
}
