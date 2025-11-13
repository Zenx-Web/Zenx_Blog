#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 Checking blog posts for images in content...\n')

// Get all published posts
const { data: posts, error } = await supabase
  .from('blog_posts')
  .select('id, slug, title, is_published, content')
  .order('created_at', { ascending: false })
  .limit(10)

if (error) {
  console.error('❌ Error fetching posts:', error)
  process.exit(1)
}

if (!posts || posts.length === 0) {
  console.log('📝 No posts found in database')
  process.exit(0)
}

console.log(`📊 Analyzing ${posts.length} most recent posts:\n`)

posts.forEach((post, index) => {
  const hasImages = post.content?.includes('<figure class="blog-image"')
  const imageCount = (post.content?.match(/<figure[^>]*class="blog-image"/g) || []).length
  const status = post.is_published ? '✅ PUBLISHED' : '📝 DRAFT'
  const imageStatus = hasImages ? `✅ HAS ${imageCount} IMAGE(S)` : '❌ NO IMAGES'
  
  console.log(`${index + 1}. ${status} ${imageStatus}`)
  console.log(`   Title: ${post.title}`)
  console.log(`   Slug: ${post.slug}`)
  console.log(`   Content length: ${post.content?.length || 0} chars`)
  
  if (hasImages) {
    console.log(`   🖼️  Found ${imageCount} <figure> tag(s)`)
  } else {
    // Check for placeholders
    const hasPlaceholders = post.content?.includes('ai-image-placeholder')
    if (hasPlaceholders) {
      console.log(`   ⚠️  Still has placeholder divs (images not embedded)`)
    }
  }
  console.log('')
})

console.log('✅ Analysis complete!')
