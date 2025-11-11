import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fetchCopyrightFreeImage(query, count = 1) {
  const pexelsKey = process.env.PEXELS_API_KEY
  
  if (pexelsKey) {
    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
        { headers: { Authorization: pexelsKey } }
      )
      
      if (response.ok) {
        const data = await response.json()
        return data.photos.map(photo => ({
          url: photo.src.large,
          alt: query,
          photographer: photo.photographer,
          photographerUrl: photo.photographer_url
        }))
      }
    } catch (error) {
      console.warn('Pexels API failed:', error.message)
    }
  }
  
  // Fallback to Lorem Picsum
  return Array.from({ length: count }, (_, i) => ({
    url: `https://picsum.photos/1200/630?random=${Date.now() + i}`,
    alt: query,
    photographer: 'Lorem Picsum',
    photographerUrl: 'https://picsum.photos'
  }))
}

function insertImagesIntoContent(content, images) {
  console.log('  📝 Processing content for image insertion...')
  
  // First, try to replace existing placeholders
  let updatedContent = content
  let placeholdersReplaced = 0
  
  images.forEach((image, index) => {
    const imageHtml = `
<figure class="blog-image embedded-image" style="margin: 2.5rem 0;">
  <img src="${image.url}" alt="${image.alt}" style="width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />
  <figcaption style="margin-top: 0.75rem; text-align: center; font-size: 0.9rem; color: #6b7280; font-style: italic;">
    ${image.alt}
    ${image.photographer !== 'Lorem Picsum' ? ` <span style="font-size: 0.85rem;">(Photo by <a href="${image.photographerUrl}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: none;">${image.photographer}</a>)</span>` : ''}
  </figcaption>
</figure>`
    
    // Try to replace placeholder
    const placeholderPattern = /Image will be inserted here/i
    if (placeholderPattern.test(updatedContent)) {
      updatedContent = updatedContent.replace(placeholderPattern, imageHtml)
      placeholdersReplaced++
    }
  })
  
  if (placeholdersReplaced > 0) {
    console.log(`  ✅ Replaced ${placeholdersReplaced} placeholder(s)`)
    return updatedContent
  }
  
  // No placeholders found, insert at strategic positions
  console.log('  ⚙️ No placeholders found, inserting at strategic positions...')
  
  // Strategy: Insert between H2 sections
  const h2Pattern = /<h2[^>]*>.*?<\/h2>/gi
  const sections = updatedContent.split(h2Pattern)
  const headings = updatedContent.match(h2Pattern) || []
  
  if (sections.length > 2 && headings.length >= 2) {
    let rebuiltContent = sections[0] // Intro
    
    images.forEach((image, index) => {
      const imageHtml = `
<figure class="blog-image embedded-image" style="margin: 2.5rem 0;">
  <img src="${image.url}" alt="${image.alt}" style="width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />
  <figcaption style="margin-top: 0.75rem; text-align: center; font-size: 0.9rem; color: #6b7280; font-style: italic;">
    ${image.alt}
    ${image.photographer !== 'Lorem Picsum' ? ` <span style="font-size: 0.85rem;">(Photo by <a href="${image.photographerUrl}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: none;">${image.photographer}</a>)</span>` : ''}
  </figcaption>
</figure>
`
      
      const sectionIndex = Math.min(index + 1, sections.length - 2)
      if (headings[sectionIndex] && sections[sectionIndex + 1]) {
        rebuiltContent += headings[sectionIndex]
        rebuiltContent += sections[sectionIndex + 1]
        rebuiltContent += imageHtml
      }
    })
    
    // Add remaining sections
    for (let i = images.length + 1; i < sections.length; i++) {
      if (headings[i - 1]) rebuiltContent += headings[i - 1]
      if (sections[i]) rebuiltContent += sections[i]
    }
    
    console.log(`  ✅ Inserted ${images.length} image(s) between sections`)
    return rebuiltContent
  }
  
  // Fallback: No sections found
  console.log('  ℹ️ No H2 sections found, content structure doesn\'t support image insertion')
  return updatedContent
}

async function fixBlogImages() {
  console.log('🔍 Fetching blogs with placeholder images...\n')
  
  // Find blogs with "Image will be inserted here" text
  const { data: blogs, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, content, category')
    .ilike('content', '%Image will be inserted here%')
    .limit(20)
  
  if (error) {
    console.error('❌ Error fetching blogs:', error)
    return
  }
  
  if (!blogs || blogs.length === 0) {
    console.log('✅ No blogs found with placeholder images!')
    return
  }
  
  console.log(`Found ${blogs.length} blog(s) with placeholder images\n`)
  
  for (const blog of blogs) {
    console.log(`📄 Processing: "${blog.title}"`)
    console.log(`   Slug: ${blog.slug}`)
    console.log(`   Category: ${blog.category}`)
    
    try {
      // Fetch 3 images based on title and category
      const searchQuery = `${blog.title} ${blog.category}`
      console.log(`   🖼️ Fetching images for: "${searchQuery}"`)
      
      const images = await fetchCopyrightFreeImage(searchQuery, 3)
      console.log(`   ✅ Fetched ${images.length} image(s)`)
      
      // Insert images into content
      const updatedContent = insertImagesIntoContent(blog.content, images)
      
      // Update database
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ content: updatedContent })
        .eq('id', blog.id)
      
      if (updateError) {
        console.error(`   ❌ Error updating blog:`, updateError.message)
      } else {
        console.log(`   ✅ Blog updated successfully!\n`)
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.error(`   ❌ Error processing blog:`, error.message, '\n')
    }
  }
  
  console.log('\n✅ Image fix complete!')
  console.log('🌐 Check your blog at: https://imzenx.in')
}

// Run the script
fixBlogImages()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })
