import type { Tables } from '@/types/database.types'

// Type alias for blog post
type BlogPost = Tables<'blog_posts'>

export interface ContentAnalysis {
  contentType: 'tutorial' | 'news' | 'review' | 'listicle' | 'opinion' | 'interview' | 'story' | 'technical'
  structure: {
    hasIntro: boolean
    hasConclusion: boolean
    hasSteps: boolean
    hasList: boolean
    hasCodeBlocks: boolean
    hasQuotes: boolean
    hasImages: boolean
    sectionCount: number
    hasDataTables: boolean
    hasComparisons: boolean
  }
  tone: 'formal' | 'casual' | 'professional' | 'friendly' | 'technical' | 'conversational' | 'opinion'
  readingTime: number
  complexity: 'beginner' | 'intermediate' | 'advanced'
  features: string[]
  wordCount: number
  engagement: {
    hasCallToAction: boolean
    hasQuestions: boolean
    hasExamples: boolean
    isVisuallyRich: boolean
    interactivityScore: number
  }
  seoQuality: {
    hasSubheadings: boolean
    headingDensity: number
    contentDepth: 'shallow' | 'medium' | 'deep'
  }
}

export interface CustomLayout {
  layoutType: 'tutorial' | 'news' | 'review' | 'feature' | 'minimal' | 'magazine'
  components: {
    showTOC: boolean
    showProgress: boolean
    showSidebar: boolean
    showAuthorBio: boolean
    showRelatedPosts: boolean
    showSocialShare: boolean
    showComments: boolean
    highlightBoxes: boolean
    codeTheme: string
    typography: 'readable' | 'compact' | 'elegant'
  }
  styling: {
    headerStyle: 'minimal' | 'hero' | 'featured' | 'magazine'
    colorScheme: 'blue' | 'green' | 'purple' | 'orange' | 'neutral'
    spacing: 'tight' | 'normal' | 'loose'
    fontSize: 'small' | 'medium' | 'large'
  }
  advanced: {
    layoutPriority: 'content' | 'visual' | 'balanced'
    navigationStyle: 'sticky' | 'floating' | 'inline'
    contentWidth: 'narrow' | 'medium' | 'wide' | 'full'
    emphasisLevel: 'subtle' | 'moderate' | 'bold'
  }
}

export async function analyzeContent(content: string, title: string, category: string): Promise<ContentAnalysis> {
  // Strip HTML tags to analyze the actual text content
  const strippedContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const originalContent = content // Keep original for HTML-specific checks
  
  // Analyze content structure - check both HTML and markdown
  const hasCodeBlocks = /```[\s\S]*?```|<code|<pre/.test(originalContent)
  const hasSteps = /(\d+\.|step \d+)|<h\d>.*?(\d+\.|step)/i.test(originalContent)
  const hasList = /^[\s]*[-*+]|\d+\.|<ul|<ol|<li/m.test(originalContent)
  const hasQuotes = /^>|<blockquote/m.test(originalContent)
  const hasImages = /!\[.*?\]\(.*?\)|<img/i.test(originalContent)
  const hasIntro = strippedContent.split(/[.!?]+/).length > 3
  const hasConclusion = /conclusion|summary|wrap up|final thoughts|takeaways/i.test(strippedContent)
  
  // Determine content type
  let contentType: ContentAnalysis['contentType'] = 'story'
  
  if (hasSteps || /tutorial|guide|how to/i.test(title)) {
    contentType = 'tutorial'
  } else if (/breaking|news|update|announced/i.test(title)) {
    contentType = 'news'
  } else if (/review|rating|pros and cons/i.test(strippedContent + title)) {
    contentType = 'review'
  } else if (hasList && /top \d+|best \d+|\d+ ways|\d+ tips/i.test(title)) {
    contentType = 'listicle'
  } else if (/opinion|think|believe|perspective/i.test(strippedContent)) {
    contentType = 'opinion'
  } else if (/interview|Q&A|conversation with/i.test(title)) {
    contentType = 'interview'
  } else if (hasCodeBlocks || /api|code|programming|development/i.test(strippedContent)) {
    contentType = 'technical'
  }

  // Analyze tone using stripped content
  const formalWords = strippedContent.match(/\b(therefore|furthermore|consequently|moreover)\b/gi)?.length || 0
  const casualWords = strippedContent.match(/\b(gonna|wanna|cool|awesome|amazing)\b/gi)?.length || 0
  const technicalWords = strippedContent.match(/\b(algorithm|implementation|configuration|deployment)\b/gi)?.length || 0
  const opinionWords = strippedContent.match(/\b(think|believe|opinion|perspective|personally)\b/gi)?.length || 0
  
  let tone: ContentAnalysis['tone'] = 'professional'
  if (opinionWords > 3) tone = 'opinion'
  else if (casualWords > formalWords) tone = 'casual'
  else if (technicalWords > 5) tone = 'technical'
  else if (formalWords > casualWords) tone = 'formal'

  // Calculate reading time using stripped content (rough estimate)
  const wordCount = strippedContent.split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 200) // Average reading speed

  // Determine complexity using stripped content
  const complexWords = strippedContent.match(/\b\w{10,}\b/g)?.length || 0
  const sentences = strippedContent.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentenceLength = sentences.length > 0 
    ? sentences.reduce((acc, sentence) => acc + sentence.split(/\s+/).length, 0) / sentences.length 
    : 10
  
  let complexity: ContentAnalysis['complexity'] = 'intermediate'
  if (complexWords < 10 && sentenceLength < 15) complexity = 'beginner'
  else if (complexWords > 30 || sentenceLength > 25) complexity = 'advanced'

  // Extract features
  const features = []
  if (hasCodeBlocks) features.push('code-snippets')
  if (hasSteps) features.push('step-by-step')
  if (hasImages) features.push('visual-content')
  if (hasQuotes) features.push('quotes')
  if (readingTime > 10) features.push('long-read')
  if (contentType === 'tutorial') features.push('actionable')

  // Advanced analysis - Section count
  const headings = originalContent.match(/<h[1-6]|^#{1,6}\s/gm) || []
  const sectionCount = headings.length

  // Check for data tables
  const hasDataTables = /<table|^\|.*\|$/m.test(originalContent)

  // Check for comparisons (vs, versus, compared to, etc.)
  const hasComparisons = /\b(vs|versus|compared to|comparison|versus|difference between)\b/i.test(strippedContent)

  // Engagement metrics
  const hasCallToAction = /\b(subscribe|follow|share|comment|try|download|get started|sign up|learn more)\b/i.test(strippedContent)
  const hasQuestions = /\?/g.test(strippedContent) && (strippedContent.match(/\?/g) || []).length > 2
  const hasExamples = /\b(example|for instance|such as|like|e\.g\.|i\.e\.)\b/i.test(strippedContent)
  const isVisuallyRich = hasImages || hasCodeBlocks || hasDataTables || hasQuotes
  
  // Calculate interactivity score (0-100)
  let interactivityScore = 0
  if (hasCallToAction) interactivityScore += 20
  if (hasQuestions) interactivityScore += 15
  if (hasExamples) interactivityScore += 15
  if (hasSteps) interactivityScore += 20
  if (isVisuallyRich) interactivityScore += 15
  if (hasList) interactivityScore += 15

  // SEO Quality metrics
  const hasSubheadings = sectionCount > 2
  const headingDensity = wordCount > 0 ? (sectionCount / wordCount) * 1000 : 0 // headings per 1000 words
  
  let contentDepth: ContentAnalysis['seoQuality']['contentDepth'] = 'medium'
  if (wordCount < 500 || sectionCount < 3) contentDepth = 'shallow'
  else if (wordCount > 1500 && sectionCount > 5) contentDepth = 'deep'

  return {
    contentType,
    structure: {
      hasIntro,
      hasConclusion,
      hasSteps,
      hasList,
      hasCodeBlocks,
      hasQuotes,
      hasImages,
      sectionCount,
      hasDataTables,
      hasComparisons
    },
    tone,
    readingTime,
    complexity,
    features,
    wordCount,
    engagement: {
      hasCallToAction,
      hasQuestions,
      hasExamples,
      isVisuallyRich,
      interactivityScore
    },
    seoQuality: {
      hasSubheadings,
      headingDensity,
      contentDepth
    }
  }
}

export function generateCustomLayout(analysis: ContentAnalysis, category: string): CustomLayout {
  console.log('🎨 Advanced AI Layout Generation')
  console.log('📊 Analysis:', {
    contentType: analysis.contentType,
    complexity: analysis.complexity,
    interactivityScore: analysis.engagement.interactivityScore,
    contentDepth: analysis.seoQuality.contentDepth,
    sectionCount: analysis.structure.sectionCount
  })

  let layoutType: CustomLayout['layoutType'] = 'minimal'
  
  // ADVANCED LAYOUT SELECTION - Based on multiple factors
  if (analysis.contentType === 'tutorial' || analysis.contentType === 'technical') {
    // Tutorials need structured, step-by-step layouts
    layoutType = 'tutorial'
  } else if (analysis.contentType === 'news' && analysis.readingTime < 5) {
    // Quick news needs minimal, fast-reading layout
    layoutType = 'news'
  } else if (analysis.contentType === 'review' || analysis.structure.hasComparisons) {
    // Reviews and comparisons need feature-rich layouts
    layoutType = 'review'
  } else if (analysis.contentType === 'listicle' || (analysis.structure.hasList && analysis.structure.sectionCount > 4)) {
    // Listicles need magazine-style layouts
    layoutType = 'magazine'
  } else if (analysis.seoQuality.contentDepth === 'deep' && analysis.readingTime > 8) {
    // Long-form content needs feature layout with good navigation
    layoutType = 'feature'
  } else if (analysis.engagement.interactivityScore > 60) {
    // Highly interactive content needs magazine layout
    layoutType = 'magazine'
  } else {
    // Default based on category
    if (category === 'entertainment') layoutType = 'magazine'
    else if (category === 'business' || category === 'world-news') layoutType = 'feature'
    else layoutType = 'minimal'
  }

  // SMART COMPONENT CONFIGURATION
  const components = {
    // TOC - Show for long, structured content
    showTOC: analysis.structure.sectionCount >= 4 || 
             analysis.readingTime > 5 || 
             analysis.structure.hasSteps ||
             analysis.seoQuality.contentDepth === 'deep',
    
    // Progress bar - For longer reads
    showProgress: analysis.readingTime > 3 || analysis.structure.sectionCount > 5,
    
    // Sidebar - For complex, technical, or deep content
    showSidebar: analysis.complexity === 'advanced' ||
                 analysis.seoQuality.contentDepth === 'deep' ||
                 analysis.contentType === 'tutorial' ||
                 analysis.structure.hasComparisons ||
                 analysis.structure.hasDataTables,
    
    // Author bio - For opinion pieces and interviews
    showAuthorBio: analysis.tone === 'opinion' || 
                   analysis.contentType === 'interview' ||
                   analysis.contentType === 'story',
    
    // Related posts - Always show for engagement
    showRelatedPosts: true,
    
    // Social share - More prominent for engaging content
    showSocialShare: analysis.engagement.interactivityScore > 40 ||
                     analysis.contentType === 'opinion' ||
                     analysis.contentType === 'review',
    
    // Comments - Encourage discussion except for news
    showComments: analysis.contentType !== 'news',
    
    // Highlight boxes - For tutorials and step-by-step content
    highlightBoxes: analysis.structure.hasSteps || 
                    analysis.contentType === 'tutorial' ||
                    analysis.engagement.hasExamples,
    
    // Code theme - Dark for technical content
    codeTheme: (analysis.structure.hasCodeBlocks && analysis.tone === 'technical') ? 
               'github-dark' : 'github',
    
    // Typography - Based on complexity and tone
    typography: (analysis.complexity === 'advanced' && analysis.seoQuality.contentDepth === 'deep') ? 
                'readable' : 
                (analysis.tone === 'casual' || analysis.engagement.interactivityScore > 70) ? 
                'compact' : 
                'elegant' as 'readable' | 'compact' | 'elegant'
  }

  // DYNAMIC COLOR SCHEME SELECTION
  const colorMap: Record<string, CustomLayout['styling']['colorScheme']> = {
    'technology': 'blue',
    'health': 'green', 
    'lifestyle': 'purple',
    'entertainment': 'orange',
    'business': 'neutral',
    'world-news': 'blue',
    'science': 'blue',
    'politics': 'neutral',
    'sports': 'orange'
  }

  // INTELLIGENT HEADER STYLE
  let headerStyle: CustomLayout['styling']['headerStyle'] = 'minimal'
  if (analysis.contentType === 'news') {
    headerStyle = 'hero' // Bold, attention-grabbing for news
  } else if (analysis.contentType === 'review' || analysis.structure.hasComparisons) {
    headerStyle = 'featured' // Prominent for reviews
  } else if (category === 'entertainment' || analysis.engagement.interactivityScore > 70) {
    headerStyle = 'magazine' // Eye-catching for entertainment
  } else if (analysis.seoQuality.contentDepth === 'deep') {
    headerStyle = 'featured' // Professional for deep content
  }

  // OPTIMIZED SPACING
  let spacing: CustomLayout['styling']['spacing'] = 'normal'
  if (analysis.complexity === 'beginner' || analysis.engagement.isVisuallyRich) {
    spacing = 'loose' // More breathing room for beginners and visual content
  } else if (analysis.readingTime > 12 && analysis.seoQuality.contentDepth === 'deep') {
    spacing = 'normal' // Balanced for long reads
  } else if (analysis.contentType === 'news' || analysis.readingTime < 3) {
    spacing = 'tight' // Compact for quick reads
  }

  // ADAPTIVE FONT SIZE
  let fontSize: CustomLayout['styling']['fontSize'] = 'medium'
  if (analysis.complexity === 'advanced' || analysis.readingTime > 10) {
    fontSize = 'large' // Larger for easier reading of complex content
  } else if (analysis.contentType === 'news' && analysis.readingTime < 3) {
    fontSize = 'small' // Compact for quick news
  }

  const styling = {
    headerStyle,
    colorScheme: colorMap[category] || 'neutral',
    spacing,
    fontSize
  }

  console.log('✅ Generated Layout:', {
    layoutType,
    showTOC: components.showTOC,
    showSidebar: components.showSidebar,
    spacing,
    fontSize
  })

  // ADVANCED LAYOUT CONFIGURATION
  let layoutPriority: CustomLayout['advanced']['layoutPriority'] = 'balanced'
  if (analysis.engagement.isVisuallyRich && analysis.structure.hasImages) {
    layoutPriority = 'visual' // Emphasize visuals
  } else if (analysis.seoQuality.contentDepth === 'deep' || analysis.complexity === 'advanced') {
    layoutPriority = 'content' // Focus on readability
  }

  let navigationStyle: CustomLayout['advanced']['navigationStyle'] = 'sticky'
  if (components.showTOC && analysis.structure.sectionCount > 6) {
    navigationStyle = 'floating' // Floating TOC for long content
  } else if (!components.showTOC || analysis.readingTime < 3) {
    navigationStyle = 'inline' // Minimal navigation for short content
  }

  let contentWidth: CustomLayout['advanced']['contentWidth'] = 'medium'
  if (analysis.structure.hasDataTables || analysis.structure.hasCodeBlocks) {
    contentWidth = 'wide' // Need space for tables/code
  } else if (analysis.seoQuality.contentDepth === 'deep' && !analysis.engagement.isVisuallyRich) {
    contentWidth = 'narrow' // Better readability for text-heavy content
  } else if (layoutType === 'magazine' || analysis.engagement.isVisuallyRich) {
    contentWidth = 'full' // Full width for visual content
  }

  let emphasisLevel: CustomLayout['advanced']['emphasisLevel'] = 'moderate'
  if (analysis.engagement.interactivityScore > 75 || analysis.contentType === 'news') {
    emphasisLevel = 'bold' // Strong emphasis for engaging/urgent content
  } else if (analysis.tone === 'formal' || analysis.complexity === 'advanced') {
    emphasisLevel = 'subtle' // Understated for professional content
  }

  return {
    layoutType,
    components,
    styling,
    advanced: {
      layoutPriority,
      navigationStyle,
      contentWidth,
      emphasisLevel
    }
  }
}