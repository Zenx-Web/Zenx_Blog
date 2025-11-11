import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const slug = 'breaking-mlb-pitchers-emmanuel-clase-and-luis-ortiz-charged-with-bribery-1'

console.log(`🔍 Checking blog post: ${slug}\n`)

// Check if post exists (any status)
const { data: post, error } = await supabase
  .from('blog_posts')
  .select('id, slug, title, is_published, created_at')
  .eq('slug', slug)
  .single()

if (error) {
  console.error('❌ Error:', error.message)
  console.log('\n📋 Checking all recent blog posts:')
  
  const { data: allPosts } = await supabase
    .from('blog_posts')
    .select('slug, title, is_published, created_at')
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (allPosts) {
    console.table(allPosts)
  }
} else {
  console.log('✅ Post found!')
  console.log(`   ID: ${post.id}`)
  console.log(`   Title: ${post.title}`)
  console.log(`   Published: ${post.is_published}`)
  console.log(`   Created: ${post.created_at}`)
}
