import dynamic from 'next/dynamic'
import { getTemplateForPost, type TemplateType } from '@/lib/template-selector'
import { analyzeContent, generateCustomLayout } from '@/lib/content-analyzer'
import type { TocHeading } from '@/components/TableOfContents'

// Dynamically import templates for code splitting
const TemplateClassic = dynamic(() => import('./TemplateClassic'))
const TemplateModern = dynamic(() => import('./TemplateModern'))
const TemplateMagazine = dynamic(() => import('./TemplateMagazine'))
const TemplateMinimal = dynamic(() => import('./TemplateMinimal'))

interface BlogTemplateRendererProps {
  post: any
  relatedPosts: any[]
  headings: TocHeading[]
  formattedDate: string
  shareUrl: string
  processedHtml: string
  isHtmlContent: boolean
  adsenseClientId: string
  adSlots: {
    top: string
    sidebar: string
    mid: string
    footer: string
  }
  templateOverride?: TemplateType // Optional: force a specific template
  useAILayout?: boolean // Optional: enable AI-powered custom layouts
}

export default async function BlogTemplateRenderer({
  post,
  relatedPosts,
  headings,
  formattedDate,
  shareUrl,
  processedHtml,
  isHtmlContent,
  adsenseClientId,
  adSlots,
  templateOverride,
  useAILayout = false
}: BlogTemplateRendererProps) {
  // If AI layout is enabled, analyze content and generate custom layout
  if (useAILayout && !templateOverride) {
    try {
      console.log('🤖 AI Layout: Analyzing content for post:', post.title)
      console.log('📊 Content length:', post.content?.length || 0, 'characters')
      console.log('📁 Category:', post.category)
      
      const analysis = await analyzeContent(post.content, post.title, post.category)
      console.log('✅ AI Analysis complete:', {
        contentType: analysis.contentType,
        tone: analysis.tone,
        complexity: analysis.complexity,
        readingTime: analysis.readingTime
      })
      
      const customLayout = generateCustomLayout(analysis, post.category)
      console.log('🎨 Generated layout:', {
        layoutType: customLayout.layoutType,
        showTOC: customLayout.components.showTOC,
        showSidebar: customLayout.components.showSidebar,
        typography: customLayout.components.typography,
        colorScheme: customLayout.styling.colorScheme
      })
      
      // Use AI-generated template selection
      const aiTemplateType = customLayout.layoutType as TemplateType
      
      const templateProps = {
        post,
        relatedPosts,
        headings,
        formattedDate,
        shareUrl,
        processedHtml,
        isHtmlContent,
        adsenseClientId,
        adSlots,
        customLayout // Pass custom layout configuration
      }

      // Render AI-selected template with custom configuration
      switch (aiTemplateType) {
        case 'modern':
          return <TemplateModern {...templateProps} />
        case 'magazine':
          return <TemplateMagazine {...templateProps} />
        case 'minimal':
          return <TemplateMinimal {...templateProps} />
        case 'classic':
        default:
          return <TemplateClassic {...templateProps} />
      }
    } catch (error) {
      console.error('AI layout generation failed, falling back to default:', error)
      // Fall through to default template selection
    }
  }

  // Select template based on category and post ID (or use override)
  const templateType = templateOverride || getTemplateForPost(post.category, post.id)

  const templateProps = {
    post,
    relatedPosts,
    headings,
    formattedDate,
    shareUrl,
    processedHtml,
    isHtmlContent,
    adsenseClientId,
    adSlots
  }

  // Render the selected template
  switch (templateType) {
    case 'modern':
      return <TemplateModern {...templateProps} />
    case 'magazine':
      return <TemplateMagazine {...templateProps} />
    case 'minimal':
      return <TemplateMinimal {...templateProps} />
    case 'classic':
    default:
      return <TemplateClassic {...templateProps} />
  }
}
