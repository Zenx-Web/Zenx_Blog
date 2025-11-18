/**
 * Content Validator - Ensures all blog posts meet quality standards
 * Automatically validates content before saving to prevent AdSense issues
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  stats: {
    wordCount: number
    readTime: number
    hasAIDisclosure: boolean
    hasInternalLinks: boolean
    hasFeaturedImage: boolean
  }
}

export interface ContentValidationRules {
  minWordCount: number
  maxWordCount: number
  requireAIDisclosure: boolean
  requireInternalLinks: boolean
  minInternalLinks: number
  requireFeaturedImage: boolean
  requireExcerpt: boolean
  minExcerptLength: number
  requireTags: boolean
  minTags: number
}

// Default rules aligned with Google AdSense requirements
export const DEFAULT_RULES: ContentValidationRules = {
  minWordCount: 800,
  maxWordCount: 5000,
  requireAIDisclosure: true,
  requireInternalLinks: true,
  minInternalLinks: 2,
  requireFeaturedImage: false, // Optional but recommended
  requireExcerpt: true,
  minExcerptLength: 100,
  requireTags: true,
  minTags: 2,
}

/**
 * Validate blog post content against quality rules
 */
export function validateContent(
  content: string,
  title: string,
  excerpt: string = '',
  tags: string[] = [],
  featuredImage: string | null = null,
  rules: ContentValidationRules = DEFAULT_RULES
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Calculate word count
  const wordCount = content.trim().split(/\s+/).length
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  // Check word count
  if (wordCount < rules.minWordCount) {
    errors.push(
      `Content too short: ${wordCount} words (minimum: ${rules.minWordCount}). ` +
      `Google AdSense requires substantial content.`
    )
  } else if (wordCount < rules.minWordCount + 100) {
    warnings.push(
      `Content is close to minimum: ${wordCount} words. Consider adding more value.`
    )
  }

  if (wordCount > rules.maxWordCount) {
    warnings.push(
      `Content is very long: ${wordCount} words. Consider splitting into multiple posts.`
    )
  }

  // Check for AI disclosure
  const hasAIDisclosure = checkAIDisclosure(content)
  if (rules.requireAIDisclosure && !hasAIDisclosure) {
    errors.push(
      'Missing AI transparency disclosure. Google requires disclosure for AI-generated content.'
    )
  }

  // Check for internal links
  const internalLinksCount = countInternalLinks(content)
  const hasInternalLinks = internalLinksCount >= rules.minInternalLinks
  
  if (rules.requireInternalLinks && !hasInternalLinks) {
    errors.push(
      `Insufficient internal links: ${internalLinksCount} found (minimum: ${rules.minInternalLinks}). ` +
      `Add links to other blog posts, categories, or site pages.`
    )
  }

  // Check featured image
  const hasFeaturedImage = !!featuredImage
  if (rules.requireFeaturedImage && !hasFeaturedImage) {
    warnings.push('No featured image. Images improve engagement and SEO.')
  }

  // Check excerpt
  if (rules.requireExcerpt) {
    if (!excerpt || excerpt.trim().length === 0) {
      errors.push('Missing excerpt. Required for SEO and social sharing.')
    } else if (excerpt.trim().length < rules.minExcerptLength) {
      warnings.push(
        `Excerpt too short: ${excerpt.length} characters (recommended: ${rules.minExcerptLength}+)`
      )
    }
  }

  // Check tags
  if (rules.requireTags && tags.length < rules.minTags) {
    warnings.push(
      `Not enough tags: ${tags.length} (recommended: ${rules.minTags}+). Tags improve discoverability.`
    )
  }

  // Check title length
  if (title.length < 30) {
    warnings.push('Title is short. Consider making it more descriptive (30-60 characters ideal).')
  } else if (title.length > 100) {
    warnings.push('Title is long. Keep it under 70 characters for better SEO.')
  }

  // Check for thin content patterns
  const thinContentWarnings = detectThinContent(content)
  warnings.push(...thinContentWarnings)

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      wordCount,
      readTime,
      hasAIDisclosure,
      hasInternalLinks,
      hasFeaturedImage,
    },
  }
}

/**
 * Check if content has AI disclosure
 */
function checkAIDisclosure(content: string): boolean {
  const aiDisclosurePatterns = [
    /ai-generated/i,
    /artificial intelligence/i,
    /how we use ai/i,
    /editorial process/i,
    /ai.*assist/i,
    /machine learning/i,
    /automated.*content/i,
  ]

  return aiDisclosurePatterns.some(pattern => pattern.test(content))
}

/**
 * Count internal links in content
 */
function countInternalLinks(content: string): number {
  const internalLinkPatterns = [
    /\[.*?\]\(\/blog\//g,
    /\[.*?\]\(\/category\//g,
    /\[.*?\]\(\/about/g,
    /\[.*?\]\(\/how-we-use-ai/g,
    /href="\/blog\//g,
    /href="\/category\//g,
  ]

  let count = 0
  for (const pattern of internalLinkPatterns) {
    const matches = content.match(pattern)
    if (matches) {
      count += matches.length
    }
  }

  return count
}

/**
 * Detect thin content patterns that could trigger AdSense issues
 */
function detectThinContent(content: string): string[] {
  const warnings: string[] = []

  // Check for excessive repetition
  const words = content.toLowerCase().split(/\s+/)
  const wordFrequency: Record<string, number> = {}
  
  for (const word of words) {
    if (word.length > 4) { // Only check words longer than 4 characters
      wordFrequency[word] = (wordFrequency[word] || 0) + 1
    }
  }

  const totalWords = words.length
  for (const [word, count] of Object.entries(wordFrequency)) {
    const frequency = count / totalWords
    if (frequency > 0.05 && count > 10) {
      warnings.push(
        `Word "${word}" appears ${count} times (${(frequency * 100).toFixed(1)}%). Avoid excessive repetition.`
      )
    }
  }

  // Check for very short paragraphs (possible thin content)
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0)
  const shortParagraphs = paragraphs.filter(p => p.split(/\s+/).length < 20)
  
  if (shortParagraphs.length > paragraphs.length * 0.5) {
    warnings.push(
      'Many short paragraphs detected. Consider adding more substance to each section.'
    )
  }

  // Check for lack of structure
  const hasHeadings = /^#{1,6}\s/m.test(content)
  if (!hasHeadings) {
    warnings.push('No headings found. Use headers (H2, H3) to structure your content.')
  }

  return warnings
}

/**
 * Auto-fix common content issues
 */
export function autoFixContent(
  content: string,
  category: string = 'world-news'
): string {
  let fixed = content

  // Add AI disclosure if missing
  if (!checkAIDisclosure(content)) {
    fixed = addAIDisclosure(fixed)
  }

  // Add internal links if missing
  if (countInternalLinks(content) < 2) {
    fixed = addInternalLinks(fixed, category)
  }

  return fixed
}

/**
 * Add AI transparency disclosure to content
 */
function addAIDisclosure(content: string): string {
  const disclosure = `

---

## 📝 Editorial Note

This article was created with the assistance of AI technology to provide timely and relevant information. Our editorial team reviews and curates all content to ensure accuracy and quality. Learn more about [how we use AI](/how-we-use-ai) in our content creation process.

---
`

  // Add before the last section or at the end
  if (content.includes('## Conclusion') || content.includes('## Summary')) {
    return content.replace(/(## (?:Conclusion|Summary))/i, `${disclosure}\n$1`)
  }

  return content + disclosure
}

/**
 * Add internal links to content
 */
function addInternalLinks(content: string, category: string): string {
  const categoryLink = `\n\n**Related:** [Explore more ${category.replace('-', ' ')} articles](/blog?category=${category})\n`
  const aiLink = `\n**Learn more:** [Our AI-powered editorial process](/how-we-use-ai)\n`

  // Add at strategic points
  let enhanced = content

  // Add category link after first major section
  const firstHeadingMatch = content.match(/\n## .+?\n/)
  if (firstHeadingMatch) {
    const insertPos = content.indexOf(firstHeadingMatch[0]) + firstHeadingMatch[0].length
    enhanced = content.slice(0, insertPos) + categoryLink + content.slice(insertPos)
  }

  // Add AI link before conclusion or at end
  if (enhanced.includes('## Conclusion')) {
    enhanced = enhanced.replace(/## Conclusion/i, `${aiLink}\n## Conclusion`)
  } else {
    enhanced += aiLink
  }

  return enhanced
}

/**
 * Generate validation report
 */
export function generateValidationReport(result: ValidationResult): string {
  const lines: string[] = []

  lines.push('=== Content Validation Report ===\n')
  lines.push(`Status: ${result.isValid ? '✅ PASSED' : '❌ FAILED'}\n`)

  lines.push('\n📊 Statistics:')
  lines.push(`- Word Count: ${result.stats.wordCount}`)
  lines.push(`- Read Time: ${result.stats.readTime} min`)
  lines.push(`- AI Disclosure: ${result.stats.hasAIDisclosure ? '✅' : '❌'}`)
  lines.push(`- Internal Links: ${result.stats.hasInternalLinks ? '✅' : '❌'}`)
  lines.push(`- Featured Image: ${result.stats.hasFeaturedImage ? '✅' : '⚠️ Optional'}`)

  if (result.errors.length > 0) {
    lines.push('\n🚨 ERRORS (Must Fix):')
    result.errors.forEach((error, i) => {
      lines.push(`${i + 1}. ${error}`)
    })
  }

  if (result.warnings.length > 0) {
    lines.push('\n⚠️ WARNINGS (Recommended):')
    result.warnings.forEach((warning, i) => {
      lines.push(`${i + 1}. ${warning}`)
    })
  }

  if (result.isValid) {
    lines.push('\n✅ Content meets all quality standards and is ready for publication!')
  }

  return lines.join('\n')
}
