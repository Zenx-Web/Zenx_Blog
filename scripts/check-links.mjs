import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkLinks() {
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, content, slug')
    .eq('is_published', true)
    .limit(3)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`\nChecking ${posts.length} sample posts for internal links:\n`)
  
  posts.forEach((post, index) => {
    const hasCategory = post.content.includes('/blog?category=')
    const hasAiLink = post.content.includes('/how-we-use-ai')
    const hasAbout = post.content.includes('/about')
    const hasRelated = post.content.includes('**Related')
    
    console.log(`${index + 1}. "${post.title.substring(0, 50)}..."`)
    console.log(`   Category link: ${hasCategory ? '✅' : '❌'}`)
    console.log(`   AI link: ${hasAiLink ? '✅' : '❌'}`)
    console.log(`   About link: ${hasAbout ? '✅' : '❌'}`)
    console.log(`   Related section: ${hasRelated ? '✅' : '❌'}`)
    console.log(`   Slug: /blog/${post.slug}\n`)
  })
}

checkLinks()
