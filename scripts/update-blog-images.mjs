import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const unsplashKey = process.env.UNSPLASH_ACCESS_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fetchUnsplashImage(query) {
  if (!unsplashKey) {
    console.warn('⚠️  No Unsplash key, using placeholder')
    return `https://picsum.photos/seed/${encodeURIComponent(query)}/1200/630`
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${unsplashKey}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular
    }
    
    return `https://picsum.photos/seed/${encodeURIComponent(query)}/1200/630`
  } catch (error) {
    console.error('Error fetching from Unsplash:', error)
    return `https://picsum.photos/seed/${encodeURIComponent(query)}/1200/630`
  }
}

async function updateBlogImages() {
  console.log('🔍 Fetching blog posts without images...\n')

  // Get all posts without featured images
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, category, featured_image')
    .is('featured_image', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching posts:', error)
    process.exit(1)
  }

  if (!posts || posts.length === 0) {
    console.log('✅ All posts already have images!')
    return
  }

  console.log(`📝 Found ${posts.length} posts without images\n`)

  let updated = 0
  let failed = 0

  for (const post of posts) {
    try {
      console.log(`Processing: ${post.title}`)
      
      // Generate search query from title and category
      const searchQuery = `${post.category} ${post.title}`.substring(0, 100)
      
      // Fetch image
      const imageUrl = await fetchUnsplashImage(searchQuery)
      
      console.log(`  → Image: ${imageUrl.substring(0, 60)}...`)
      
      // Update post
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ featured_image: imageUrl })
        .eq('id', post.id)

      if (updateError) {
        throw updateError
      }

      updated++
      console.log(`  ✅ Updated successfully\n`)
      
      // Rate limit: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (err) {
      failed++
      console.error(`  ❌ Failed: ${err.message}\n`)
    }
  }

  console.log('\n📊 Summary:')
  console.log(`  ✅ Updated: ${updated}`)
  console.log(`  ❌ Failed: ${failed}`)
  console.log(`  📝 Total: ${posts.length}`)
}

updateBlogImages()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
