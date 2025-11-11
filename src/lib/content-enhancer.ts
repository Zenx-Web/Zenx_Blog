/**
 * Content Enhancer - Add ImZenx branding and AI disclosures to blog content
 */

export interface EnhancedContent {
  content: string
  aiSummary?: string[]
  editorsNote?: string
  keyTakeaways?: string[]
  images?: Array<{
    url: string
    alt: string
    caption: string
    photographer?: string
    photographerUrl?: string
  }>
}

/**
 * Inject ImZenx branding elements into blog content
 */
export function enhanceContentWithBranding(
  rawContent: string,
  options?: {
    aiSummary?: string[]
    editorsNote?: string
    keyTakeaways?: string[]
    skipDisclosure?: boolean
    images?: Array<{
      url: string
      alt: string
      caption: string
      photographer?: string
      photographerUrl?: string
    }>
  }
): string {
  const { aiSummary, editorsNote, keyTakeaways, skipDisclosure, images } = options || {}

  let enhancedContent = ''

  // Add author attribution at the top
  enhancedContent += `
<div class="author-attribution" style="margin-bottom: 2rem; padding: 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px;">
  <p style="margin: 0; font-size: 0.875rem; font-weight: 600;">
    ✍️ By <strong>ImZenx</strong> <span style="opacity: 0.9;">(AI-Assisted)</span>
  </p>
</div>
`

  // Add AI Summary section if provided
  if (aiSummary && aiSummary.length > 0) {
    enhancedContent += `
<div class="ai-summary" style="margin-bottom: 2rem; padding: 1.5rem; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 8px;">
  <h2 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.25rem; color: #1e40af;">🤖 AI Summary</h2>
  <ul style="margin: 0; padding-left: 1.5rem; line-height: 1.8;">
${aiSummary.map(point => `    <li>${point}</li>`).join('\n')}
  </ul>
</div>
`
  }

  // Add the main content
  enhancedContent += rawContent

  // Add Editor's Note after the main content introduction
  if (editorsNote) {
    enhancedContent += `
<aside class="editors-note" style="margin: 2rem 0; padding: 1.5rem; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px;">
  <h3 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.125rem; color: #92400e;">✏️ Editor's Note</h3>
  <p style="margin: 0; line-height: 1.8; color: #451a03;">${editorsNote}</p>
</aside>
`
  }

  // Add Image Suggestions section if images are provided
  if (images && images.length > 0) {
    enhancedContent += `
<div class="image-suggestions" style="margin-top: 3rem; margin-bottom: 3rem;">
  <h2 style="margin-top: 0; margin-bottom: 2rem; font-size: 1.75rem; color: #1f2937; font-weight: 700;">Image Suggestions</h2>
`
    
    images.forEach(image => {
      enhancedContent += `
  <div style="margin-bottom: 2rem;">
    <img src="${image.url}" alt="${image.alt}" style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 0.75rem;" />
    <p style="margin: 0; font-style: italic; color: #6b7280; font-size: 0.95rem; text-align: center;">
      ${image.caption}${image.photographer && image.photographerUrl ? 
        ` <span style="font-size: 0.875rem;">(Photo by <a href="${image.photographerUrl}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: none;">${image.photographer}</a>)</span>` 
        : ''}
    </p>
  </div>
`
    })

    enhancedContent += `
</div>
`
  }

  // Add Key Takeaways section
  if (keyTakeaways && keyTakeaways.length > 0) {
    enhancedContent += `
<div class="key-takeaways" style="margin-top: 3rem; padding: 1.5rem; background: #f0fdf4; border: 2px solid #10b981; border-radius: 12px;">
  <h2 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.5rem; color: #065f46;">✅ Key Takeaways</h2>
  <ul style="margin: 0; padding-left: 1.5rem; line-height: 1.8; color: #064e3b;">
${keyTakeaways.map(takeaway => `    <li style="margin-bottom: 0.5rem;"><strong>${takeaway}</strong></li>`).join('\n')}
  </ul>
</div>
`
  }

  // Add AI transparency disclosure at the bottom
  if (!skipDisclosure) {
    enhancedContent += `
<div class="ai-disclosure" style="margin-top: 3rem; padding: 1.25rem; background: #f3f4f6; border-radius: 8px; text-align: center;">
  <p style="margin: 0; font-size: 0.875rem; color: #4b5563;">
    ⚙️ <em>This article was generated using AI tools and reviewed by ImZenx before publishing.</em>
  </p>
</div>
`
  }

  return enhancedContent
}

/**
 * Extract AI Summary from content if it exists
 */
export function extractAISummary(content: string): string[] | undefined {
  const summaryMatch = content.match(
    /<div[^>]*class="ai-summary"[^>]*>([\s\S]*?)<\/div>/i
  )
  
  if (!summaryMatch) return undefined

  const listMatch = summaryMatch[1].match(/<ul[^>]*>([\s\S]*?)<\/ul>/i)
  if (!listMatch) return undefined

  const items = listMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi)
  if (!items) return undefined

  return items.map(item => 
    item.replace(/<\/?li[^>]*>/gi, '').trim()
  )
}

/**
 * Extract Editor's Note from content if it exists
 */
export function extractEditorsNote(content: string): string | undefined {
  const noteMatch = content.match(
    /<aside[^>]*class="editors-note"[^>]*>([\s\S]*?)<\/aside>/i
  )
  
  if (!noteMatch) return undefined

  const paragraphMatch = noteMatch[1].match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  if (!paragraphMatch) return undefined

  return paragraphMatch[1].replace(/<[^>]+>/g, '').trim()
}

/**
 * Extract Key Takeaways from content if it exists
 */
export function extractKeyTakeaways(content: string): string[] | undefined {
  const takeawaysMatch = content.match(
    /<div[^>]*class="key-takeaways"[^>]*>([\s\S]*?)<\/div>/i
  )
  
  if (!takeawaysMatch) return undefined

  const listMatch = takeawaysMatch[1].match(/<ul[^>]*>([\s\S]*?)<\/ul>/i)
  if (!listMatch) return undefined

  const items = listMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi)
  if (!items) return undefined

  return items.map(item => 
    item.replace(/<\/?li[^>]*>/gi, '').replace(/<[^>]+>/g, '').trim()
  )
}

/**
 * Check if content already has ImZenx branding
 */
export function hasImZenxBranding(content: string): boolean {
  return (
    content.includes('class="author-attribution"') ||
    content.includes('By ImZenx') ||
    content.includes('class="ai-disclosure"')
  )
}

/**
 * Remove existing branding to avoid duplicates
 */
export function stripExistingBranding(content: string): string {
  let cleaned = content

  // Remove author attribution
  cleaned = cleaned.replace(
    /<div[^>]*class="author-attribution"[^>]*>[\s\S]*?<\/div>/gi,
    ''
  )

  // Remove AI summary
  cleaned = cleaned.replace(
    /<div[^>]*class="ai-summary"[^>]*>[\s\S]*?<\/div>/gi,
    ''
  )

  // Remove editor's note
  cleaned = cleaned.replace(
    /<aside[^>]*class="editors-note"[^>]*>[\s\S]*?<\/aside>/gi,
    ''
  )

  // Remove key takeaways
  cleaned = cleaned.replace(
    /<div[^>]*class="key-takeaways"[^>]*>[\s\S]*?<\/div>/gi,
    ''
  )

  // Remove AI disclosure
  cleaned = cleaned.replace(
    /<div[^>]*class="ai-disclosure"[^>]*>[\s\S]*?<\/div>/gi,
    ''
  )

  return cleaned.trim()
}

/**
 * Process content to ensure ImZenx branding is properly applied
 */
export function processContentForPublication(
  content: string,
  options?: {
    aiSummary?: string[]
    editorsNote?: string
    keyTakeaways?: string[]
    forceRebrand?: boolean
    images?: Array<{
      url: string
      alt: string
      caption: string
      photographer?: string
      photographerUrl?: string
    }>
  }
): string {
  const { aiSummary, editorsNote, keyTakeaways, forceRebrand, images } = options || {}

  // If already branded and not forcing rebrand, return as-is
  if (!forceRebrand && hasImZenxBranding(content)) {
    return content
  }

  // Strip existing branding if forcing rebrand
  const cleanContent = forceRebrand ? stripExistingBranding(content) : content

  // Apply new branding
  return enhanceContentWithBranding(cleanContent, {
    aiSummary,
    editorsNote,
    keyTakeaways,
    images
  })
}
