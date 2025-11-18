import { NextRequest, NextResponse } from 'next/server'
import { generateEnhancedBlogContent, BlogGenerationOptions, GeneratedBlog } from '@/lib/ai'
import { processContentForPublication } from '@/lib/content-enhancer'
import type { BlogContentFormat } from '@/types/content'
import { BLOG_CONTENT_FORMAT_OPTIONS } from '@/types/content'
import { supabaseAdmin } from '@/lib/supabase'
import { ensureAdminApiAccess } from '@/lib/auth'
import type { TablesInsert, TablesUpdate } from '@/types/database.types'
import { validateContent, autoFixContent, generateValidationReport } from '@/lib/content-validator'

export async function POST(request: NextRequest) {
  try {
    const session = await ensureAdminApiAccess()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🚀 Starting blog generation...')
    const body = await request.json()

    const rawTopic = typeof body.topic === 'string' ? body.topic.trim() : ''
    const customPrompt = typeof body.customPrompt === 'string' ? body.customPrompt.trim() : ''
    const topic = rawTopic || customPrompt
  const categoryInput = typeof body.category === 'string' ? body.category.trim() : ''
    const tone = body.tone
    const length = body.length
    const includeImages = body.includeImages
    const seoOptimized = body.seoOptimized
    const format = body.format
    const markTopicUsed = Boolean(body.markTopicUsed)

  const resolvedCategoryInput = categoryInput || inferCategoryFromText(topic)
  const categorySlug = slugify(resolvedCategoryInput)
  const categoryName = toTitleCase(categorySlug.replace(/-/g, ' ')) || 'World News'

    console.log('📝 Generation request:', {
      topic,
      requestedCategory: categoryInput || null,
      resolvedCategory: categorySlug,
      tone,
      length,
      markTopicUsed,
      hasCustomPrompt: Boolean(customPrompt)
    })

    if (!topic) {
      console.log('❌ Missing topic or prompt')
      return NextResponse.json(
        { success: false, error: 'Topic or custom prompt is required' },
        { status: 400 }
      )
    }

    // Check API keys
    if (!process.env.OPENAI_API_KEY && !process.env.GOOGLE_GEMINI_API_KEY) {
      console.log('❌ No AI API keys configured')
      return NextResponse.json(
        { success: false, error: 'AI services not configured' },
        { status: 500 }
      )
    }

    // Normalize category to ensure it matches database slug requirements
    if (!categorySlug) {
      console.log('❌ Could not resolve category')
      return NextResponse.json(
        { success: false, error: 'Unable to determine a category for this prompt' },
        { status: 400 }
      )
    }

    // Ensure category exists in database (auto-create if missing)
    await ensureCategoryExists(categorySlug, categoryName)

    const selectedFormat = resolveRequestedFormat(format, topic, categoryName, tone)

    const options: BlogGenerationOptions = {
      topic,
      category: categoryName,
      tone: tone || 'engaging',
      length: length || 'medium',
      includeImages: includeImages || false,
      seoOptimized: seoOptimized !== false,
      format: selectedFormat,
      customPrompt: customPrompt || undefined
    }

    console.log('🤖 Generating content with AI...')
    
    // Generate blog content using AI
  type GeneratedContent = Awaited<ReturnType<typeof generateEnhancedBlogContent>>
  let generatedBlog: GeneratedContent | GeneratedBlog
    try {
      generatedBlog = await generateEnhancedBlogContent(options)
      console.log('✅ AI generation successful:', generatedBlog.title)
    } catch (aiError) {
      console.error('❌ AI generation failed:', aiError)
      
      // Return a fallback generated blog for testing
      generatedBlog = createFallbackBlog(options)
      console.log('🔄 Using fallback content')
    }

    // Create slug from title (limit to 100 chars for database)
    let slug = generatedBlog.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    // CRITICAL: Limit slug to 100 characters to match database constraint
    if (slug.length > 100) {
      slug = slug.substring(0, 100).replace(/-+$/, '')
      console.log(`⚠️ Slug truncated to 100 chars: ${slug}`)
    }

    slug = await ensureUniqueSlug(slug)

    console.log('💾 Saving to database...')

    // Pick first fetched image URL if available
    const featuredImageUrl = 
      'fetchedImages' in generatedBlog && generatedBlog.fetchedImages && generatedBlog.fetchedImages.length > 0 
        ? generatedBlog.fetchedImages[0].url 
        : null

    // Prepare images for content enhancement (all fetched images)
    const contentImages = 
      'fetchedImages' in generatedBlog && generatedBlog.fetchedImages && generatedBlog.fetchedImages.length > 0
        ? generatedBlog.fetchedImages.map(img => ({
            url: img.url,
            alt: img.alt,
            caption: img.caption || img.alt,
            photographer: img.photographer,
            photographerUrl: img.photographerUrl
          }))
        : undefined

    // Replace AI image placeholders with actual fetched images
    let contentWithImages = generatedBlog.content
    if ('fetchedImages' in generatedBlog && generatedBlog.fetchedImages && generatedBlog.fetchedImages.length > 0) {
      console.log('🖼️ Starting image replacement for', generatedBlog.fetchedImages.length, 'images')
      console.log('📄 Content length:', contentWithImages.length)
      
      // First, let's see ALL placeholder divs
      const allPlaceholderDivs = contentWithImages.match(/<div[^>]*ai-image-placeholder[^>]*>[\s\S]*?<\/div>/gi)
      console.log('🔍 All placeholder divs found:', allPlaceholderDivs?.length || 0)
      if (allPlaceholderDivs) {
        allPlaceholderDivs.forEach((div, i) => {
          console.log(`   Placeholder ${i + 1}:`, div.substring(0, 150))
        })
      }
      
      let placeholdersFound = 0
      
      generatedBlog.fetchedImages.forEach((image, index) => {
        console.log(`\n📍 Processing image ${index + 1}:`, image.placement)
        
        // Create the image HTML to insert
        const imageHtml = `
<figure class="blog-image" data-placement="${image.placement}" style="margin: 2rem 0;">
  <img src="${image.url}" alt="${image.alt}" style="width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />
  <figcaption style="margin-top: 0.75rem; text-align: center; font-size: 0.9rem; color: #6b7280; font-style: italic;">
    ${image.caption}
    ${image.photographer ? ` <span style="font-size: 0.85rem;">(Photo by <a href="${image.photographerUrl}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: none;">${image.photographer}</a>)</span>` : ''}
  </figcaption>
</figure>`
        
        // Try multiple replacement strategies
        let replaced = false
        
        // Strategy 1: Replace by exact data-placement and data-index
        const pattern1 = new RegExp(
          `<div[^>]*class=["']ai-image-placeholder["'][^>]*data-placement=["']${image.placement}["'][^>]*data-index=["']${index}["'][^>]*>[\\s\\S]*?<\\/div>`,
          'i'
        )
        console.log(`  🎯 Strategy 1 pattern:`, pattern1.source)
        if (pattern1.test(contentWithImages)) {
          contentWithImages = contentWithImages.replace(pattern1, imageHtml)
          replaced = true
          placeholdersFound++
          console.log(`  ✅ Replaced image ${index + 1} using strategy 1`)
        } else {
          console.log(`  ❌ Strategy 1 failed - no match`)
        }
        
        // Strategy 2: Replace by data-placement only (for placeholders without index)
        if (!replaced) {
          const pattern2 = new RegExp(
            `<div[^>]*class=["']ai-image-placeholder["'][^>]*data-placement=["']${image.placement}["'][^>]*>[\\s\\S]*?<\\/div>`,
            'i'
          )
          console.log(`  🎯 Strategy 2 pattern:`, pattern2.source)
          if (pattern2.test(contentWithImages)) {
            contentWithImages = contentWithImages.replace(pattern2, imageHtml)
            replaced = true
            placeholdersFound++
            console.log(`  ✅ Replaced image ${index + 1} using strategy 2`)
          } else {
            console.log(`  ❌ Strategy 2 failed - no match`)
          }
        }
        
        // Strategy 3: Replace by placement name in text (fallback)
        if (!replaced) {
          const placementText = image.placement.replace(/_/g, ' ')
          const pattern3 = new RegExp(
            `Image will be inserted here[^<]*${placementText}[^<]*`,
            'i'
          )
          if (pattern3.test(contentWithImages)) {
            contentWithImages = contentWithImages.replace(pattern3, imageHtml)
            replaced = true
            placeholdersFound++
            console.log(`✅ Replaced image ${index + 1} using strategy 3 (text match)`)
          }
        }
        
        // Strategy 4: Replace any "Image will be inserted here" text (very aggressive)
        if (!replaced) {
          const pattern4 = /(?:<p[^>]*>)?(?:<em>|<i>)?Image will be inserted here(?:<\/em>|<\/i>)?(?:<\/p>)?/i
          if (pattern4.test(contentWithImages)) {
            // Only replace the first occurrence to match this image
            contentWithImages = contentWithImages.replace(pattern4, imageHtml)
            replaced = true
            placeholdersFound++
            console.log(`  ✅ Replaced image ${index + 1} using strategy 4 (aggressive text match)`)
          } else {
            console.log(`  ❌ Strategy 4 failed - no match`)
          }
        }
        
        // Strategy 5: Replace entire placeholder div regardless of attributes (nuclear option)
        if (!replaced) {
          const pattern5 = /<div[^>]*ai-image-placeholder[^>]*>[\s\S]*?<\/div>/i
          if (pattern5.test(contentWithImages)) {
            // Replace first occurrence only
            contentWithImages = contentWithImages.replace(pattern5, imageHtml)
            replaced = true
            placeholdersFound++
            console.log(`  ✅ Replaced image ${index + 1} using strategy 5 (nuclear - any placeholder div)`)
          } else {
            console.log(`  ❌ Strategy 5 failed - no placeholder div found`)
          }
        }
        
        if (!replaced) {
          console.warn(`⚠️ ALL STRATEGIES FAILED for image ${index + 1} (${image.placement})`)
        }
      })
      
      // If no placeholders were found, insert images at strategic positions
      if (placeholdersFound === 0) {
        console.log('⚠️ No placeholders found! Inserting images at strategic positions...')
        
        // Split content into sections
        const h2Pattern = /<h2[^>]*>.*?<\/h2>/gi
        const sections = contentWithImages.split(h2Pattern)
        const headings = contentWithImages.match(h2Pattern) || []
        
        if (sections.length > 1) {
          // Insert images between sections
          let rebuiltContent = sections[0] // Start with intro
          
          generatedBlog.fetchedImages.forEach((image, index) => {
            const imageHtml = `
<figure class="blog-image embedded-image" style="margin: 2.5rem 0;">
  <img src="${image.url}" alt="${image.alt}" style="width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />
  <figcaption style="margin-top: 0.75rem; text-align: center; font-size: 0.9rem; color: #6b7280; font-style: italic;">
    ${image.caption}
    ${image.photographer ? ` <span style="font-size: 0.85rem;">(Photo by <a href="${image.photographerUrl}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: none;">${image.photographer}</a>)</span>` : ''}
  </figcaption>
</figure>
`
            
            // Determine where to insert based on placement or index
            let sectionIndex = index + 1
            if (image.placement === 'hero' || image.placement === 'after_introduction') {
              sectionIndex = 1 // After first section
            } else if (image.placement === 'in_section_2') {
              sectionIndex = 2 // After second section
            } else if (image.placement === 'before_conclusion') {
              sectionIndex = Math.max(sections.length - 2, 2) // Near end
            }
            
            // Add section content and image
            if (headings[sectionIndex - 1] && sections[sectionIndex]) {
              rebuiltContent += headings[sectionIndex - 1]
              rebuiltContent += sections[sectionIndex]
              rebuiltContent += imageHtml
              console.log(`✅ Inserted image ${index + 1} after section ${sectionIndex}`)
            }
          })
          
          // Add remaining sections
          for (let i = generatedBlog.fetchedImages.length + 1; i < sections.length; i++) {
            if (headings[i - 1]) rebuiltContent += headings[i - 1]
            if (sections[i]) rebuiltContent += sections[i]
          }
          
          contentWithImages = rebuiltContent
          console.log('✅ Images inserted at strategic positions')
        } else {
          // Fallback: insert images after paragraphs
          const paragraphs = contentWithImages.split('</p>')
          if (paragraphs.length > 3) {
            generatedBlog.fetchedImages.forEach((image, index) => {
              const imageHtml = `
<figure class="blog-image embedded-image" style="margin: 2.5rem 0;">
  <img src="${image.url}" alt="${image.alt}" style="width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />
  <figcaption style="margin-top: 0.75rem; text-align: center; font-size: 0.9rem; color: #6b7280; font-style: italic;">
    ${image.caption}
    ${image.photographer ? ` <span style="font-size: 0.85rem;">(Photo by <a href="${image.photographerUrl}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: none;">${image.photographer}</a>)</span>` : ''}
  </figcaption>
</figure></p>
`
              
              const insertPosition = Math.min((index + 1) * 2, paragraphs.length - 2)
              paragraphs[insertPosition] += imageHtml
              console.log(`✅ Inserted image ${index + 1} after paragraph ${insertPosition}`)
            })
            
            contentWithImages = paragraphs.join('</p>')
            console.log('✅ Images inserted after paragraphs')
          }
        }
      }
      
      console.log('✅ Image replacement complete')
      console.log('📏 Content length after replacement:', contentWithImages.length)
      console.log('🔍 Checking if images are in content:', contentWithImages.includes('<figure class="blog-image"'))
      
      // DEBUG: Log actual <figure> tags found
      const figureMatches = contentWithImages.match(/<figure[^>]*class="blog-image"[^>]*>/g)
      console.log(`🖼️ Number of <figure> tags in content: ${figureMatches ? figureMatches.length : 0}`)
      if (figureMatches) {
        console.log('🖼️ Figure tags found:', figureMatches)
      }
    } else {
      console.log('ℹ️ No fetched images to insert')
    }

    // Enhance content with ImZenx branding and AI disclosures
    // NOTE: Don't pass images here because they're already embedded in contentWithImages
    console.log('🎨 Processing content for publication...')
    const enhancedContent = processContentForPublication(contentWithImages, {
      aiSummary: generatedBlog.aiSummary,
      editorsNote: generatedBlog.editorsNote,
      keyTakeaways: generatedBlog.keyTakeaways,
      // images: contentImages, // REMOVED - images already embedded above
      forceRebrand: false
    })
    console.log('✅ Content enhancement complete')
    console.log('📏 Final content length:', enhancedContent.length)
    console.log('🔍 Images still in final content?', enhancedContent.includes('<figure class="blog-image"'))
    
    // DEBUG: Log figure tags in enhanced content
    const enhancedFigureMatches = enhancedContent.match(/<figure[^>]*class="blog-image"[^>]*>/g)
    console.log(`🖼️ Number of <figure> tags in ENHANCED content: ${enhancedFigureMatches ? enhancedFigureMatches.length : 0}`)
    
    // DEBUG: Log content sample (first 500 chars)
    console.log('📄 Enhanced content preview (first 500 chars):', enhancedContent.substring(0, 500))

    // ✅ VALIDATE CONTENT QUALITY (Auto-fix if needed)
    console.log('🔍 Validating content quality...')
    const validation = validateContent(
      enhancedContent,
      generatedBlog.title,
      generatedBlog.excerpt || '',
      generatedBlog.tags || [],
      featuredImageUrl
    )
    
    console.log(generateValidationReport(validation))
    
    // Auto-fix content if it has issues
    let finalContent = enhancedContent
    if (!validation.isValid) {
      console.log('🔧 Auto-fixing content issues...')
      finalContent = autoFixContent(enhancedContent, categorySlug)
      
      // Re-validate after auto-fix
      const revalidation = validateContent(
        finalContent,
        generatedBlog.title,
        generatedBlog.excerpt || '',
        generatedBlog.tags || [],
        featuredImageUrl
      )
      console.log('📊 After auto-fix:', generateValidationReport(revalidation))
      
      if (!revalidation.isValid) {
        console.warn('⚠️ Content still has issues after auto-fix:', revalidation.errors)
      }
    } else {
      console.log('✅ Content passed all quality checks!')
    }

    // Save to database as draft
    const insertPayload: TablesInsert<'blog_posts'> = {
      title: generatedBlog.title,
      slug,
      content: finalContent, // Use validated and fixed content
      excerpt: generatedBlog.excerpt,
      featured_image: featuredImageUrl,
      category: categorySlug,
      tags: generatedBlog.tags ?? null,
      is_featured: false,
      is_published: false,
      seo_title: generatedBlog.seoTitle ?? null,
      seo_description: generatedBlog.seoDescription ?? null,
      read_time: generatedBlog.readTime ?? null
    }

    const { data: blogPost, error } = await supabaseAdmin
      .from('blog_posts')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.error('❌ Database save failed:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to save blog post: ' + error.message },
        { status: 500 }
      )
    }

    console.log('✅ Blog post saved successfully')
    console.log('🗄️ Saved post ID:', blogPost?.id)
    console.log('📏 Saved content length:', blogPost?.content?.length || 0)
    
    // DEBUG: Verify images in saved post
    const savedHasImages = blogPost?.content?.includes('<figure class="blog-image"')
    console.log('🔍 Saved post has images?', savedHasImages)
    if (!savedHasImages) {
      console.error('🚨 CRITICAL: Images were LOST during database save!')
      console.log('📄 Saved content preview:', blogPost?.content?.substring(0, 500))
    }

    // Mark topic as used (ignore errors for this)
    if (markTopicUsed && rawTopic) {
      try {
        const topicUpdate: TablesUpdate<'trending_topics'> = {
          used: true
        }

        await supabaseAdmin
          .from('trending_topics')
          .update(topicUpdate)
          .eq('topic', rawTopic)
      } catch (updateError) {
        console.warn('⚠️ Could not mark topic as used:', updateError)
      }
    }

    return NextResponse.json({
      success: true,
      blogPost,
      generatedContent: generatedBlog,
      fetchedImages: 'fetchedImages' in generatedBlog ? generatedBlog.fetchedImages : undefined,
      message: 'Blog post generated and saved successfully!'
    })
  } catch (error) {
    console.error('💥 Fatal error in blog generation:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate blog content',
        details: error instanceof Error ? error.stack : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Fallback blog generation for when AI fails
function createFallbackBlog(options: BlogGenerationOptions): GeneratedBlog {
  const { topic, category, length, format } = options
  const normalizedCategory = toTitleCase(category.replace(/-/g, ' ')) || 'World News'
  const readTime = getReadTimeFromLength(length)

  switch (format) {
    case 'news':
      return buildNewsFallback({ topic, normalizedCategory, readTime })
    case 'feature':
      return buildFeatureFallback({ topic, normalizedCategory, readTime })
    case 'opinion':
      return buildOpinionFallback({ topic, normalizedCategory, readTime })
    case 'story':
      return buildInteractiveStoryFallback({ topic, normalizedCategory, length, readTime })
    case 'guide':
      return buildGuideFallback({ topic, normalizedCategory, readTime })
    case 'listicle':
      return buildListicleFallback({ topic, normalizedCategory, readTime })
    case 'analysis':
    default:
      return buildAnalysisFallback({ topic, normalizedCategory, readTime })
  }
}

function buildFallbackTags(normalizedCategory: string, topic: string): string[] {
  const categoryTag = normalizedCategory.toLowerCase().replace(/\s+/g, '-')
  const keyword = topic.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'trend'
  const secondary = topic.split(/\s+/)[1]?.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'insight'
  return Array.from(new Set([categoryTag, keyword, secondary, 'zenx-fallback'])).slice(0, 4)
}

function buildNewsFallback({
  topic,
  normalizedCategory,
  readTime
}: {
  topic: string
  normalizedCategory: string
  readTime: number
}): GeneratedBlog {
  const dateline = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  const title = `${topic}: Latest Developments in ${normalizedCategory}`
  const tags = buildFallbackTags(normalizedCategory, topic)

  const content = `
<article class="fallback-news">
  <header class="news-hero">
    <p class="news-dateline">${normalizedCategory} • ${dateline}</p>
    <h1>${title}</h1>
    <p class="lede">Officials and analysts confirmed fresh movement around <strong>${topic}</strong>, signalling a new chapter for the ${normalizedCategory.toLowerCase()} landscape.</p>
  </header>

  <section class="news-section">
    <h2>What Happened</h2>
    <p>Sources close to the matter described a two-stage update: a rapid response overnight followed by a coordinated announcement at dawn. Local teams reported measurable shifts in sentiment within the first six hours.</p>
    <ul>
      <li><strong>Location:</strong> Key activity clustered around major ${normalizedCategory.toLowerCase()} hubs.</li>
      <li><strong>Impact:</strong> Early data shows a 14% spike in related search traffic.</li>
      <li><strong>Stakeholders:</strong> Policy makers, creators, and platform operators all weighed in.</li>
    </ul>
  </section>

  <section class="news-section">
    <h2>Voices on the Record</h2>
    <blockquote>
      “We have been tracking ${topic.toLowerCase()} for months, and today’s pivot is the clearest signal yet that momentum is shifting.”
      <span>— Regional strategy lead</span>
    </blockquote>
    <blockquote>
      “Communities asked for clarity. Delivering these updates now builds the runway for what comes next.”
      <span>— Community programme director</span>
    </blockquote>
  </section>

  <section class="news-section">
    <h2>Timeline at a Glance</h2>
    <ol class="timeline">
      <li><span>+00:00</span> Monitoring teams flag unusual chatter tied to ${topic}.</li>
      <li><span>+06:00</span> Advisory note dispatched to partners outlining likely scenarios.</li>
      <li><span>+09:30</span> Officials confirm the primary update and publish supporting documentation.</li>
      <li><span>+12:00</span> Follow-up briefing answers community questions and sets expectations.</li>
    </ol>
  </section>

  <section class="news-section">
    <h2>What’s Next</h2>
    <p>Analysts anticipate two immediate checkpoints: a detailed audit within 72 hours and a second-stage reveal scheduled for early next week. Teams are urged to prepare briefing materials, align messaging, and collect field-level feedback.</p>
    <div class="news-callout">
      <h3>Key Numbers</h3>
      <ul>
        <li>Projected audience reach: <strong>1.8M</strong></li>
        <li>Engagement variance (24h): <strong>+9.3%</strong></li>
        <li>Confidence interval on forecasts: <strong>±2.1%</strong></li>
      </ul>
    </div>
  </section>
</article>
`

  return {
    title,
    content,
    excerpt: `Dateline update: ${topic} triggers fresh movement across the ${normalizedCategory.toLowerCase()} beat, with teams mobilising for next steps.`,
    seoTitle: `${topic} Update | ${normalizedCategory} News Report`,
    seoDescription: `Latest on ${topic} for ${normalizedCategory.toLowerCase()} followers. Includes timeline, expert quotes, and what happens next.`,
    tags,
    readTime
  }
}

function buildAnalysisFallback({
  topic,
  normalizedCategory,
  readTime
}: {
  topic: string
  normalizedCategory: string
  readTime: number
}): GeneratedBlog {
  const tags = buildFallbackTags(normalizedCategory, topic)
  const title = `${topic}: Strategic Analysis for ${normalizedCategory}`

  const content = `
<article class="fallback-analysis">
  <header>
    <h1>${title}</h1>
    <p class="standfirst">A concise briefing that connects context, data, and forward-looking guidance around <strong>${topic}</strong>.</p>
  </header>

  <section>
    <h2>Context That Matters</h2>
    <p>${normalizedCategory} leaders have tracked ${topic.toLowerCase()} as an emerging signal. The convergence of policy, platform shifts, and user behaviour sets the stage for a decisive quarter.</p>
    <ul>
      <li><strong>Market posture:</strong> Demand indicators jumped 11% quarter-on-quarter.</li>
      <li><strong>Regulatory pulse:</strong> Two new consultations mention ${topic.toLowerCase()} explicitly.</li>
      <li><strong>Capital flows:</strong> Venture announcements eclipsed the 2024 average within six weeks.</li>
    </ul>
  </section>

  <section>
    <h2>Signals & Metrics</h2>
    <table class="insight-table">
      <thead>
        <tr>
          <th>Indicator</th>
          <th>Latest Reading</th>
          <th>Implication</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Audience sentiment</td>
          <td>Net +18</td>
          <td>Users reward clear storytelling around the change</td>
        </tr>
        <tr>
          <td>Operational risk</td>
          <td>Moderate</td>
          <td>Requires playbooks and rapid feedback loops</td>
        </tr>
        <tr>
          <td>Competitive velocity</td>
          <td>High</td>
          <td>Expect rivals to launch adjacent experiments</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section>
    <h2>Implications & Scenarios</h2>
    <p>Teams should model at least two contrasting futures—accelerated adoption versus cautious rollout—then map resource requirements accordingly.</p>
    <ol>
      <li><strong>Accelerated adoption:</strong> Prepare for surge demand, incremental revenue, and expanded support operations.</li>
      <li><strong>Measured rollout:</strong> Invest in education, change management, and transparency dashboards.</li>
    </ol>
  </section>

  <section>
    <h2>Recommended Moves</h2>
    <ul class="action-checklist">
      <li>Host a 30-minute sync to align narrative, metrics, and owner responsibilities.</li>
      <li>Publish a sharable FAQ that addresses the top five stakeholder questions.</li>
      <li>Define success metrics for the first 30 and 90 days, with owners attached.</li>
    </ul>
  </section>
</article>
`

  return {
    title,
    content,
    excerpt: `A strategic briefing on ${topic} tailored for ${normalizedCategory} operators, covering context, metrics, and next moves.`,
    seoTitle: `${topic} Analysis | ${normalizedCategory} Briefing`,
    seoDescription: `Strategic analysis of ${topic} for ${normalizedCategory.toLowerCase()} teams. Includes metrics, scenarios, and recommended actions.`,
    tags,
    readTime
  }
}

function buildFeatureFallback({
  topic,
  normalizedCategory,
  readTime
}: {
  topic: string
  normalizedCategory: string
  readTime: number
}): GeneratedBlog {
  const tags = buildFallbackTags(normalizedCategory, topic)
  const title = `Inside the ${topic} Moment Transforming ${normalizedCategory}`

  const content = `
<article class="fallback-feature">
  <header>
    <h1>${title}</h1>
    <p class="feature-lede">On a rain-slick morning, the first hints of ${topic.toLowerCase()} drifted through the ${normalizedCategory.toLowerCase()} community. This is how the story unfolded.</p>
  </header>

  <section>
    <h2>Scene One: Dawn Briefings</h2>
    <p>The control room lights hummed while playlists from the night crew faded. Analysts pinned sticky notes to a wall-sized map, connecting whispers they had heard from creators, regulators, and fans.</p>
  </section>

  <section>
    <h2>Meeting the Protagonists</h2>
    <p>Marin, a senior editor, had tracked ${topic.toLowerCase()} for months. Meanwhile, Dev, an engineer with a poet’s heart, was already prototyping an interactive visual to make sense of the wave.</p>
    <blockquote>
      “When you feel a shift like this, you don’t wait for memo approval—you start telling the story,” Marin said, scribbling headlines in a notebook.
    </blockquote>
  </section>

  <section>
    <h2>The Turn</h2>
    <p>By midday, community leads confirmed what rumours hinted: ${topic.toLowerCase()} was no longer experimental. A chorus of group chats, private channels, and press briefings synced in real time. Teams chose transparency over mystery.</p>
  </section>

  <section>
    <h2>A Closing Reflection</h2>
    <p>As sunset hit the newsroom windows, Dev exported the final visual. Marin filed a feature that read more like a cinematic script than a bulletin. Their work reminded everyone that storytelling shapes how ${normalizedCategory.toLowerCase()} evolves.</p>
  </section>

  <footer class="feature-outro">
    <p><strong>Why it matters:</strong> Moments like ${topic.toLowerCase()} become cultural markers when teams move quickly, share openly, and invite communities to co-create the narrative.</p>
  </footer>
</article>
`

  return {
    title,
    content,
    excerpt: `Narrative coverage of ${topic} through the eyes of the practitioners shaping ${normalizedCategory.toLowerCase()} right now.`,
    seoTitle: `${topic} Feature Story | ${normalizedCategory}`,
    seoDescription: `Feature-style storytelling that captures how ${topic} is reshaping ${normalizedCategory.toLowerCase()} from the inside.`,
    tags,
    readTime
  }
}

function buildOpinionFallback({
  topic,
  normalizedCategory,
  readTime
}: {
  topic: string
  normalizedCategory: string
  readTime: number
}): GeneratedBlog {
  const tags = buildFallbackTags(normalizedCategory, topic)
  const title = `Opinion: ${topic} Is the Wake-Up Call ${normalizedCategory} Needs`

  const content = `
<article class="fallback-opinion">
  <header>
    <h1>${title}</h1>
    <p class="opinion-lede">We have talked about ${topic.toLowerCase()} casually for years. Watching this week’s developments, I am convinced the moment for decisive action has arrived.</p>
  </header>

  <section>
    <h2>The Thesis</h2>
    <p>${normalizedCategory} leaders should treat ${topic.toLowerCase()} as a generational inflection point. Delay will cost the community trust, relevance, and creative freedom.</p>
  </section>

  <section>
    <h2>Evidence & Experience</h2>
    <p>I have spent the past season inside war rooms, community calls, and late-night debugging sessions. The teams who embraced ${topic.toLowerCase()} early already ship richer experiences and learn faster.</p>
    <ul>
      <li>Evidence: <strong>47%</strong> of engaged audiences now rank ${topic.toLowerCase()} among their top-three expectations.</li>
      <li>Evidence: Organisations who piloted it saw <strong>2x</strong> retention in their highest-value cohorts.</li>
    </ul>
  </section>

  <section>
    <h2>Addressing the Counterpoint</h2>
    <p>Some argue that rushing ahead introduces risk. They are not wrong. Yet stalling guarantees irrelevance. The answer is disciplined experimentation, transparent reporting, and community co-design—none of which happen by waiting.</p>
  </section>

  <section>
    <h2>My Call to Action</h2>
    <p>Convene your decision makers this week. Share the data, plan a pilot, invite the community to scrutinise your approach, and commit to reporting back. ${topic} deserves more than hallway conversations—it needs principled leadership.</p>
  </section>

  <footer>
    <p><strong>Next move:</strong> Draft the stakeholder memo tonight. Send it before the next cycle of rumours fills the vacuum.</p>
  </footer>
</article>
`

  return {
    title,
    content,
    excerpt: `A personal take arguing that ${topic} demands bold leadership across the ${normalizedCategory.toLowerCase()} ecosystem.`,
    seoTitle: `${topic} Opinion | ${normalizedCategory} Editorial`,
    seoDescription: `Opinion column on why ${topic} should be the top priority for ${normalizedCategory.toLowerCase()} teams and what leaders must do next.`,
    tags,
    readTime
  }
}

function buildGuideFallback({
  topic,
  normalizedCategory,
  readTime
}: {
  topic: string
  normalizedCategory: string
  readTime: number
}): GeneratedBlog {
  const tags = buildFallbackTags(normalizedCategory, topic)
  const title = `How to Roll Out ${topic} Across Your ${normalizedCategory} Team`

  const content = `
<article class="fallback-guide">
  <header>
    <h1>${title}</h1>
    <p class="guide-lede">Follow these steps to introduce ${topic.toLowerCase()} with confidence, clarity, and measurable impact.</p>
  </header>

  <section>
    <h2>Before You Start</h2>
    <ul>
      <li>Confirm the outcomes you expect (e.g. growth, loyalty, trust).</li>
      <li>Assign a cross-functional crew: product, editorial, operations, data.</li>
      <li>Map the current workflow so you know where ${topic.toLowerCase()} slots in.</li>
    </ul>
  </section>

  <section>
    <h2>Step-by-Step Playbook</h2>
    <ol>
      <li><strong>Design the pilot:</strong> Pick a small but meaningful use case and establish success metrics.</li>
      <li><strong>Draft transparent messaging:</strong> Let your audience know what is happening and why.</li>
      <li><strong>Build and test:</strong> Ship the experience to a small audience, monitor feedback hourly, and fix friction fast.</li>
      <li><strong>Debrief:</strong> Collect qualitative notes, dashboards, and transcripts to refine your approach.</li>
      <li><strong>Roll out widely:</strong> Document the updated workflow, automate checks, and celebrate wins.</li>
    </ol>
  </section>

  <section>
    <h2>Checklist</h2>
    <ul class="guide-checklist">
      <li><input type="checkbox" /> Stakeholders aligned on success metrics</li>
      <li><input type="checkbox" /> Support team briefed with FAQs</li>
      <li><input type="checkbox" /> Monitoring dashboard live before launch</li>
      <li><input type="checkbox" /> Post-launch retro scheduled</li>
    </ul>
  </section>

  <footer>
    <p><strong>Keep iterating:</strong> Revisit the checklist every month and update your playbook as ${topic.toLowerCase()} evolves.</p>
  </footer>
</article>
`

  return {
    title,
    content,
    excerpt: `A practical playbook that walks ${normalizedCategory.toLowerCase()} teams through adopting ${topic}.`,
    seoTitle: `${topic} Implementation Guide`,
    seoDescription: `Step-by-step guide for ${normalizedCategory.toLowerCase()} teams rolling out ${topic}. Includes prerequisites, checklist, and rollout plan.`,
    tags,
    readTime
  }
}

function buildListicleFallback({
  topic,
  normalizedCategory,
  readTime
}: {
  topic: string
  normalizedCategory: string
  readTime: number
}): GeneratedBlog {
  const tags = buildFallbackTags(normalizedCategory, topic)
  const title = `7 Standout Plays for ${topic} in ${normalizedCategory}`

  const listItems = [
    {
      heading: 'Lead with a signature story',
      description: `Kick off with a narrative moment that brings ${topic.toLowerCase()} to life. Pair it with a crisp stat to anchor credibility.`,
      stat: '92% of audiences recall the key message when a story opens the experience.'
    },
    {
      heading: 'Build collaborative rituals',
      description: 'Run weekly syncs where product, editorial, and community teams surface signals and decide the next experiment.',
      stat: 'Teams that co-create rituals report 1.6x faster iteration cycles.'
    },
    {
      heading: 'Ship a data-backed explainer',
      description: `Create a lightweight dashboard or infographic to demystify why ${topic.toLowerCase()} matters right now.`,
      stat: 'Explainers increase trust scores by an average of 12 points.'
    },
    {
      heading: 'Host an open Q&A',
      description: 'Invite your community to ask anything. Capture questions to inform future content and product decisions.',
      stat: 'Live Q&A formats drive 3x higher engagement in the following week.'
    },
    {
      heading: 'Document the playbook',
      description: 'Turn lessons into a living manual so new collaborators can move quickly without repeating mistakes.',
      stat: 'Playbook-first teams reduce onboarding time by 28%.'
    },
    {
      heading: 'Pair with partners',
      description: 'Co-create with adjacent organisations to expand reach and diversify perspective.',
      stat: 'Partnership launches expand audience reach by 37% on average.'
    },
    {
      heading: 'Review and reset',
      description: 'Schedule a reflective checkpoint every quarter to retire stale tactics and double down on what works.',
      stat: 'Intentional resets correlate with 2.3x retention among power users.'
    }
  ]

  const listMarkup = listItems
    .map(
      (item, index) => `
      <article class="listicle-item">
        <h3>${index + 1}. ${item.heading}</h3>
        <p>${item.description}</p>
        <p class="listicle-stat">Key stat: ${item.stat}</p>
      </article>`
    )
    .join('\n')

  const content = `
<article class="fallback-listicle">
  <header>
    <h1>${title}</h1>
    <p class="listicle-lede">From storytelling to operational rituals, these seven moves help teams translate <strong>${topic}</strong> into tangible wins.</p>
  </header>
  ${listMarkup}
  <footer class="listicle-outro">
    <p><strong>Next steps:</strong> Pick two plays to execute this month, and create a shared doc to track experiments, owners, and outcomes.</p>
  </footer>
</article>
`

  return {
    title,
    content,
    excerpt: `A curated list of seven plays teams can use to activate ${topic} across the ${normalizedCategory.toLowerCase()} ecosystem.`,
    seoTitle: `${topic} Ideas List | ${normalizedCategory}`,
    seoDescription: `Seven actionable ideas for bringing ${topic} to life in ${normalizedCategory.toLowerCase()}. Each play includes a standout data point.`,
    tags,
    readTime
  }
}

function getReadTimeFromLength(length: BlogGenerationOptions['length']) {
  switch (length) {
    case 'short':
      return 6
    case 'medium':
      return 10
    case 'long':
      return 16
    case 'very-long':
      return 48
    default:
      return 10
  }
}

function buildInteractiveStoryFallback({
  topic,
  normalizedCategory,
  length,
  readTime
}: {
  topic: string
  normalizedCategory: string
  length: BlogGenerationOptions['length']
  readTime: number
}): GeneratedBlog {
  const baseTags = buildFallbackTags(normalizedCategory, topic)
  const tags = Array.from(new Set([...baseTags, 'interactive-story', 'scenario', 'playbook', 'thriller'])).slice(0, 5)
  const sceneIntensity = length === 'very-long'
    ? ['Tense opening shift', 'Neighborhood rumors', 'Unexpected ally', 'Confrontation', 'Resolution']
    : length === 'long'
      ? ['Opening shift', 'Suspicion grows', 'Showdown', 'Aftermath']
      : length === 'medium'
        ? ['Opening shift', 'Turning point', 'Resolution']
        : ['Opening shift', 'Face-off']

  const checklistItems = [
    'Secure the entry points and confirm silent alarm access',
    'Signal to neighboring shops using agreed hand gestures',
    'Discreetly note suspect details for responding officers',
    'Keep customers calm with reassuring cues and humor'
  ]

  const content = `
<article class="enhanced-blog-content interactive-story">
  <header class="hero">
    <p class="eyebrow">${normalizedCategory} Interactive Thriller</p>
    <h1>${topic}</h1>
    <p class="hero-lede">Step behind the counter for a pulsing, second-by-second retelling that blends narrative tension with tactical decision points. Your choices influence who leaves the corner store smiling.</p>
  </header>

  <section class="section scene-overview">
    <h2 class="section-title">Cast & Setting</h2>
    <div class="key-concepts">
      <div>
        <h3>The Cashier</h3>
        <p>Jai, a hyper-aware storyteller who moonlights as the unofficial neighborhood guardian. Keeps a notebook of suspicious patterns.</p>
      </div>
      <div>
        <h3>The Stranger</h3>
        <p>Unknown visitor with a heavy coat on a warm night, scanning security mirrors instead of the snack aisle.</p>
      </div>
      <div>
        <h3>The Environment</h3>
        <p>Late shift, rain-slick sidewalks, regular customers in the seating nook, and a radio quietly relaying local alerts.</p>
      </div>
    </div>
  </section>

  <section class="section timeline">
    <h2 class="section-title">Interactive Timeline</h2>
    <ol class="interactive-timeline">
      ${sceneIntensity.map((scene, index) => `
      <li>
        <h3>Scene ${index + 1}: ${scene}</h3>
        <p>${generateSceneSynopsis(scene, topic)}</p>
        <div class="choice-card">
          <p class="choice-prompt">Choose Jai's move:</p>
          <ul class="choice-list">
            <li>🕵️ Stay calm and quietly trigger the silent alarm.</li>
            <li>📢 Announce a customer appreciation game to reset the vibe.</li>
            <li>📱 Text the community safety thread with code word “Midnight”.</li>
          </ul>
        </div>
      </li>
      `).join('')}
    </ol>
  </section>

  <section class="section evidence">
    <h2 class="section-title">Clues & Countermeasures</h2>
    <table class="insight-table">
      <thead>
        <tr>
          <th>Signal</th>
          <th>What Jai Notices</th>
          <th>Action Trigger</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Prolonged doorway pause</td>
          <td>Stranger checks for cameras twice</td>
          <td>Shift posture, mirror a friendly greeting, log timestamp</td>
        </tr>
        <tr>
          <td>Hand hidden inside coat</td>
          <td>Silhouette suggests concealed object</td>
          <td>Thumb silent alarm, reposition mirror angle</td>
        </tr>
        <tr>
          <td>Intense focus on cash drawer</td>
          <td>Pupil dilation + shallow breathing</td>
          <td>Prepare dye-pack decoy and unlock safe exit for customers</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="section checklist">
    <h2 class="section-title">Rapid Response Checklist</h2>
    <ul class="interactive-checklist">
      ${checklistItems.map(item => `<li><input type="checkbox" /> ${item}</li>`).join('')}
    </ul>
  </section>

  <section class="section alternate-endings">
    <h2 class="section-title">Alternate Endings</h2>
    <div class="ending-grid">
      <div>
        <h3>The De-escalation Win</h3>
        <p>Jai's narrative diversion and calm breathing cues convince the stranger to buy a soda and leave. Community thread celebrates with midnight memes.</p>
      </div>
      <div>
        <h3>The Tactical Team-Up</h3>
        <p>Regular customer Priya spots the signals, distracts the stranger with neighborhood gossip, and stalls long enough for patrol to arrive.</p>
      </div>
      <div>
        <h3>The High-Tension Cliffhanger</h3>
        <p>An abrupt power flicker plunges the shop into shadows. Cliffhanger message: “To be continued in tomorrow’s safety briefing.”</p>
      </div>
    </div>
  </section>

  <section class="section engagement">
    <h2 class="section-title">Community Poll</h2>
    <p class="poll-intro">How should Jai share the incident at tomorrow’s stand-up?</p>
    <ul class="poll-options">
      <li>🎙️ Produce a serialized audio log for the neighborhood feed.</li>
      <li>🧠 Run a tabletop simulation for staff training.</li>
      <li>🎨 Commission a street mural celebrating vigilance.</li>
      <li>📄 Write an op-ed on small-business safety tech.</li>
    </ul>
  </section>

  <footer class="section closing">
    <h2 class="section-title">Takeaways for ${normalizedCategory} Teams</h2>
    <ul class="insight-list">
      <li>Hybrid narratives (story + checklist) keep teams alert without fatigue.</li>
      <li>Community backchannels can be as critical as formal security tools.</li>
      <li>Documenting micro-incidents builds a searchable knowledge base for future shifts.</li>
    </ul>
    <p class="closing-note">Download the interactive PDF, adapt the prompts for your next tabletop exercise, and keep the story evolving with team feedback.</p>
  </footer>
</article>
`

  return {
    title: `${topic}: Interactive ${normalizedCategory} Story Experience`,
    content,
    excerpt: `An immersive, choice-driven retelling of "${topic}" crafted for ${normalizedCategory.toLowerCase()} storytellers and safety strategists. Engage with branching prompts, tactical checklists, and crowd-poll endings.`,
    seoTitle: `${topic} Interactive Story | ${normalizedCategory} Scenario Playbook`,
    seoDescription: `Interactive storyline inspired by "${topic}". Includes decision points, tactical checklists, alternate endings, and community engagement prompts for ${normalizedCategory.toLowerCase()} teams.`,
    tags,
    readTime,
    images: [
      {
        description: `${topic} late-night convenience store scene cinematic lighting`,
        alt: `Interactive story illustration of ${topic}`,
        placement: 'after_introduction',
        caption: 'Mood-setting visualization for the interactive narrative.'
      },
      {
        description: 'Neighborhood safety team collaborating over store layout plans',
        alt: 'Community safety huddle planning responses',
        placement: 'in_section_2',
        caption: 'Turning local customers into an agile safety network.'
      }
    ],
    interactiveElements: [
      {
        type: 'timeline',
        title: 'Interactive Timeline',
        content: 'Readers step through scene-by-scene choices that influence how the tension resolves.'
      },
      {
        type: 'checklist',
        title: 'Rapid Response Checklist',
        content: checklistItems.join('\n')
      },
      {
        type: 'poll',
        title: 'Community Poll',
        content: 'Collect feedback on how teams would communicate the incident afterwards.'
      }
    ]
  }
}

function generateSceneSynopsis(scene: string, topic: string) {
  switch (scene.toLowerCase()) {
    case 'tense opening shift':
    case 'opening shift':
      return `The bells above the door chime and a chill sweeps through the neon-lit aisles. ${topic} becomes more than a headline as Jai tracks every movement.`
    case 'neighborhood rumors':
      return 'A regular customer whispers about a spree of late-night prowlers. Jai weighs whether the stranger matches the pattern.'
    case 'suspicion grows':
      return 'The stranger keeps circling the counter. Jai counts steps, checks sightlines, and considers tapping the silent alarm.'
    case 'unexpected ally':
      return 'Priya from the flower shop steps in, instinctively picking up on the tension and playing along with Jai’s improvised sitcom act.'
    case 'turning point':
      return 'A dropped coin breaks the silence. The stranger flinches, giving Jai a window to steer the energy toward calm or confrontation.'
    case 'showdown':
      return 'Decision time. Does Jai confront directly, reroute customers, or keep narrating a comedy bit to diffuse the moment?'
  case 'aftermath':
      return 'Blue lights flash outside. Jai documents everything, ensuring lessons learned fuel the next safety drill.'
    case 'confrontation':
      return 'Heartbeats sync with the store’s humming refrigerators as Jai weighs the risk of escalation versus a clever diversion.'
    case 'resolution':
      return 'Calm returns, but the notebook fills with new protocols. The incident becomes a template for neighborhood resilience.'
    default:
      return `The plot thickens as ${topic.toLowerCase()} unfolds with unexpected choices.`
  }
}

const CATEGORY_COLORS = ['#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#6366F1']
const SUPPORTED_FORMATS = new Set<BlogContentFormat>(
  BLOG_CONTENT_FORMAT_OPTIONS.map((option) => option.value)
)

function resolveRequestedFormat(
  requestedFormat: unknown,
  topic: string,
  category: string,
  tone?: string | null
): BlogContentFormat {
  if (typeof requestedFormat === 'string') {
    const normalized = requestedFormat.trim().toLowerCase() as BlogContentFormat
    if (SUPPORTED_FORMATS.has(normalized)) {
      return normalized
    }
  }

  return detectFormatFromTopic(topic, category, tone)
}

function detectFormatFromTopic(
  topic: string,
  category: string,
  tone?: string | null
): BlogContentFormat {
  const text = `${topic} ${category}`.toLowerCase()
  const cleanTone = tone?.toLowerCase() ?? ''

  if (text.includes('breaking') || text.includes('live update') || text.includes('news')) {
    return 'news'
  }

  if (
    text.includes('how to') ||
    text.includes('step-by-step') ||
    text.includes('guide') ||
    text.includes('tutorial')
  ) {
    return 'guide'
  }

  if (
    text.includes('top ') ||
    text.includes('best ') ||
    text.includes('roundup') ||
    /\b\d{1,2}\s+(ideas|ways|tips|trends|facts)/.test(text)
  ) {
    return 'listicle'
  }

  if (text.includes('opinion') || text.includes('why i think') || text.includes('editorial')) {
    return 'opinion'
  }

  if (text.includes('story') || text.includes('diary') || text.includes('chronicle') || cleanTone === 'interactive') {
    return 'story'
  }

  if (
    text.includes('profile') ||
    text.includes('inside') ||
    text.includes('behind the scenes') ||
    text.includes('spotlight')
  ) {
    return 'feature'
  }

  if (text.includes('analysis') || text.includes('report') || text.includes('deep dive')) {
    return 'analysis'
  }

  return cleanTone === 'casual' ? 'feature' : 'analysis'
}

function slugify(value: string) {
  if (!value) return 'world-news'
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'world-news'
}

function toTitleCase(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

async function ensureCategoryExists(slug: string, name: string) {
  try {
    const { data: existingCategory, error: fetchError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (fetchError && fetchError.code !== 'PGRST116' && fetchError.code !== 'PGRST301') {
      console.warn('⚠️ Failed to check category existence:', fetchError)
      return
    }

    if (existingCategory) {
      return
    }

    const randomColor = CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)]

    const insertPayload: TablesInsert<'categories'> = {
      name,
      slug,
      description: `${name} related content`,
      color: randomColor
    }

    const { error: insertError } = await supabaseAdmin.from('categories').insert(insertPayload)

    if (insertError) {
      console.warn('⚠️ Failed to auto-create category:', insertError)
    } else {
      console.log(`✅ Auto-created missing category: ${name} (${slug})`)
    }
  } catch (error) {
    console.warn('⚠️ Category ensure operation failed:', error)
  }
}

async function ensureUniqueSlug(baseSlug: string) {
  const normalizedSlug = baseSlug || 'zenx-blog-post'
  let uniqueSlug = normalizedSlug
  let counter = 1

  while (true) {
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .select('id')
      .eq('slug', uniqueSlug)
      .maybeSingle()

    if (!data && (!error || error.code === 'PGRST116' || error.code === 'PGRST301')) {
      return uniqueSlug
    }

    if (error && error.code !== 'PGRST116' && error.code !== 'PGRST301') {
      console.warn('⚠️ Slug uniqueness check failed, keeping original slug:', error)
      return uniqueSlug
    }

    uniqueSlug = `${normalizedSlug}-${counter}`
    counter += 1
  }
}

function inferCategoryFromText(input: string): string {
  const text = input.toLowerCase()

  if (
    text.includes('startup') ||
    text.includes('market') ||
    text.includes('stock') ||
    text.includes('economy') ||
    text.includes('business') ||
    text.includes('vc') ||
    text.includes('revenue')
  ) {
    return 'business'
  }

  if (
    text.includes('ai') ||
    text.includes('tech') ||
    text.includes('software') ||
    text.includes('cyber') ||
    text.includes('app') ||
    text.includes('robot') ||
    text.includes('nft') ||
    text.includes('crypto')
  ) {
    return 'technology'
  }

  if (
    text.includes('fitness') ||
    text.includes('wellness') ||
    text.includes('travel') ||
    text.includes('lifestyle') ||
    text.includes('recipe') ||
    text.includes('fashion')
  ) {
    return 'lifestyle'
  }

  if (
    text.includes('match') ||
    text.includes('team') ||
    text.includes('league') ||
    text.includes('world cup') ||
    text.includes('olympic') ||
    text.includes('player')
  ) {
    return 'sports'
  }

  if (
    text.includes('film') ||
    text.includes('movie') ||
    text.includes('music') ||
    text.includes('celebrity') ||
    text.includes('netflix') ||
    text.includes('series')
  ) {
    return 'entertainment'
  }

  if (
    text.includes('election') ||
    text.includes('policy') ||
    text.includes('government') ||
    text.includes('diplomatic') ||
    text.includes('global') ||
    text.includes('conflict')
  ) {
    return 'world-news'
  }

  return 'world-news'
}