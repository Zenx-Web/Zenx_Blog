import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function auditContentQuality() {
  console.log('🔍 Auditing Content Quality for AdSense Compliance...\n')

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  const issues = []
  const suggestions = []
  let totalWordCount = 0

  console.log(`\n📊 Analyzing ${posts.length} published posts...\n`)

  posts.forEach((post, index) => {
    // Word count
    const wordCount = post.content ? post.content.split(/\s+/).filter(w => w.length > 0).length : 0
    totalWordCount += wordCount
    
    // Check for images
    const hasImages = post.content ? /<img[^>]+src="[^"]+"/.test(post.content) : false
    const imageCount = post.content ? (post.content.match(/<img/g) || []).length : 0
    
    // Check for headings
    const hasH2 = post.content ? /<h2/.test(post.content) : false
    const hasH3 = post.content ? /<h3/.test(post.content) : false
    const headingCount = post.content ? (post.content.match(/<h[2-3]/g) || []).length : 0
    
    // Check for internal links
    const hasInternalLinks = post.content ? post.content.includes('href="/blog/') || post.content.includes('href="/') : false
    const internalLinkCount = post.content ? (post.content.match(/href="\/(?!\/)/g) || []).length : 0
    
    // Check for AI disclosure
    const hasAIDisclosure = post.content ? 
      (post.content.toLowerCase().includes('ai-assisted') || 
       post.content.toLowerCase().includes('ai assisted') ||
       post.content.toLowerCase().includes('artificial intelligence')) : false
    
    // CRITICAL: Word count issues
    if (wordCount < 700) {
      issues.push({
        post: post.title,
        slug: post.slug,
        issue: `⚠️ THIN CONTENT: Only ${wordCount} words (need 800+)`,
        severity: 'CRITICAL',
        fix: 'Expand with more context, examples, timeline, impact analysis',
        category: 'Content Length'
      })
    } else if (wordCount < 800) {
      issues.push({
        post: post.title,
        slug: post.slug,
        issue: `⚠️ Short: ${wordCount} words (recommended 800+)`,
        severity: 'HIGH',
        fix: 'Add 1-2 more paragraphs with additional insights',
        category: 'Content Length'
      })
    }

    // HIGH: Structure issues
    if (!hasH2 && !hasH3) {
      issues.push({
        post: post.title,
        slug: post.slug,
        issue: 'No H2/H3 headings found',
        severity: 'HIGH',
        fix: 'Add section headings (What Happened, Why It Matters, What\'s Next)',
        category: 'Structure'
      })
    } else if (headingCount < 3) {
      issues.push({
        post: post.title,
        slug: post.slug,
        issue: `Only ${headingCount} heading(s) - need 3-5 for better structure`,
        severity: 'MEDIUM',
        fix: 'Add more section breaks with H2/H3 headings',
        category: 'Structure'
      })
    }

    // MEDIUM: Image issues
    if (!hasImages || !post.featured_image) {
      issues.push({
        post: post.title,
        slug: post.slug,
        issue: 'No featured image or content images',
        severity: 'MEDIUM',
        fix: 'Add relevant images with descriptive alt text',
        category: 'Media'
      })
    } else if (imageCount < 2 && wordCount > 800) {
      suggestions.push({
        post: post.title,
        slug: post.slug,
        suggestion: `Add 1-2 more images for ${wordCount} word article`
      })
    }

    // MEDIUM: Internal linking
    if (!hasInternalLinks) {
      issues.push({
        post: post.title,
        slug: post.slug,
        issue: 'No internal links found',
        severity: 'MEDIUM',
        fix: 'Add 2-3 internal links to related posts',
        category: 'SEO & Navigation'
      })
    } else if (internalLinkCount < 2) {
      suggestions.push({
        post: post.title,
        slug: post.slug,
        suggestion: `Only ${internalLinkCount} internal link(s) - add 1-2 more`
      })
    }

    // MEDIUM: AI disclosure
    if (!hasAIDisclosure) {
      issues.push({
        post: post.title,
        slug: post.slug,
        issue: 'Missing AI disclosure',
        severity: 'MEDIUM',
        fix: 'Add "AI-Assisted" badge or disclosure at bottom',
        category: 'Transparency'
      })
    }

    // LOW: SEO issues
    if (!post.seo_title || post.seo_title.length < 30) {
      suggestions.push({
        post: post.title,
        slug: post.slug,
        suggestion: 'SEO title is too short - make it 50-60 characters'
      })
    }

    if (!post.seo_description || post.seo_description.length < 120) {
      suggestions.push({
        post: post.title,
        slug: post.slug,
        suggestion: 'SEO description is too short - make it 150-160 characters'
      })
    }
  })

  // Group issues by severity
  const criticalIssues = issues.filter(i => i.severity === 'CRITICAL')
  const highIssues = issues.filter(i => i.severity === 'HIGH')
  const mediumIssues = issues.filter(i => i.severity === 'MEDIUM')

  // Print Summary Report
  console.log('='.repeat(80))
  console.log('📋 CONTENT QUALITY AUDIT REPORT FOR GOOGLE ADSENSE')
  console.log('='.repeat(80))
  console.log(`\n📊 OVERVIEW:`)
  console.log(`   Total Posts Analyzed: ${posts.length}`)
  console.log(`   Average Word Count: ${Math.round(totalWordCount / posts.length)} words`)
  console.log(`   Total Issues Found: ${issues.length}`)
  console.log(`   └─ 🔴 Critical: ${criticalIssues.length} (MUST FIX)`)
  console.log(`   └─ 🟠 High: ${highIssues.length} (Should Fix)`)
  console.log(`   └─ 🟡 Medium: ${mediumIssues.length} (Nice to Fix)`)
  console.log(`   Suggestions: ${suggestions.length}\n`)

  // Print Critical Issues First
  if (criticalIssues.length > 0) {
    console.log('🔴 CRITICAL ISSUES (MUST FIX FOR ADSENSE):')
    console.log('─'.repeat(80))
    criticalIssues.forEach((issue, idx) => {
      console.log(`\n${idx + 1}. "${issue.post}"`)
      console.log(`   Slug: /blog/${issue.slug}`)
      console.log(`   Problem: ${issue.issue}`)
      console.log(`   Fix: ${issue.fix}`)
    })
    console.log('\n')
  }

  // Print High Priority Issues
  if (highIssues.length > 0) {
    console.log('🟠 HIGH PRIORITY ISSUES:')
    console.log('─'.repeat(80))
    highIssues.forEach((issue, idx) => {
      console.log(`\n${idx + 1}. "${issue.post}"`)
      console.log(`   Slug: /blog/${issue.slug}`)
      console.log(`   Problem: ${issue.issue}`)
      console.log(`   Fix: ${issue.fix}`)
    })
    console.log('\n')
  }

  // Print Medium Priority Issues (grouped by category)
  if (mediumIssues.length > 0) {
    console.log('🟡 MEDIUM PRIORITY ISSUES:')
    console.log('─'.repeat(80))
    
    const categories = [...new Set(mediumIssues.map(i => i.category))]
    categories.forEach(category => {
      const categoryIssues = mediumIssues.filter(i => i.category === category)
      console.log(`\n📌 ${category} (${categoryIssues.length} posts):`)
      categoryIssues.forEach((issue, idx) => {
        console.log(`   ${idx + 1}. "${issue.post}" - ${issue.issue}`)
      })
    })
    console.log('\n')
  }

  // Print Suggestions
  if (suggestions.length > 0) {
    console.log('💡 SUGGESTIONS FOR IMPROVEMENT:')
    console.log('─'.repeat(80))
    suggestions.slice(0, 10).forEach((s, idx) => {
      console.log(`${idx + 1}. "${s.post}"`)
      console.log(`   ${s.suggestion}\n`)
    })
    if (suggestions.length > 10) {
      console.log(`   ... and ${suggestions.length - 10} more suggestions\n`)
    }
  }

  // Print Action Plan
  console.log('='.repeat(80))
  console.log('🎯 RECOMMENDED ACTION PLAN:')
  console.log('='.repeat(80))
  console.log('\n1. FIX CRITICAL ISSUES FIRST (Thin Content):')
  console.log(`   - ${criticalIssues.length} posts need expansion to 800+ words`)
  console.log('   - Focus on adding value: context, analysis, examples, timeline')
  console.log('   - Estimated time: 30-45 min per post')
  
  console.log('\n2. ADD STRUCTURE (Headings):')
  const structureIssues = highIssues.filter(i => i.category === 'Structure')
  console.log(`   - ${structureIssues.length} posts need better heading structure`)
  console.log('   - Add H2/H3 sections: Introduction, Main Content, Conclusion')
  console.log('   - Estimated time: 10-15 min per post')
  
  console.log('\n3. IMPROVE MEDIA & LINKS:')
  const mediaIssues = mediumIssues.filter(i => i.category === 'Media')
  const seoIssues = mediumIssues.filter(i => i.category === 'SEO & Navigation')
  console.log(`   - ${mediaIssues.length} posts need images`)
  console.log(`   - ${seoIssues.length} posts need internal links`)
  console.log('   - Estimated time: 5-10 min per post')
  
  console.log('\n4. ADD AI DISCLOSURES:')
  const transparencyIssues = mediumIssues.filter(i => i.category === 'Transparency')
  console.log(`   - ${transparencyIssues.length} posts need AI disclosure`)
  console.log('   - Add at bottom: "📝 This article was created with AI assistance"')
  console.log('   - Estimated time: 2 min per post')

  console.log('\n='.repeat(80))
  console.log('✅ NEXT STEPS:')
  console.log('='.repeat(80))
  console.log('1. Start with CRITICAL issues (thin content)')
  console.log('2. Fix HIGH priority issues (headings)')
  console.log('3. Address MEDIUM issues (images, links, disclosure)')
  console.log('4. Review suggestions for extra polish')
  console.log('5. Re-run this audit after fixes')
  console.log('6. Submit to Google AdSense when all CRITICAL issues resolved')
  console.log('\n💪 You got this! Let\'s get that AdSense approval! 🚀\n')
  console.log('='.repeat(80))
}

auditContentQuality()
