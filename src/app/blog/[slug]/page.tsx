import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarIcon, ClockIcon, EyeIcon, ShareIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import '@/styles/enhanced-blog.css'
import { headers } from 'next/headers'
import { load } from 'cheerio'
import { Fragment } from 'react'
import type { ReactNode } from 'react'

import { supabase } from '@/lib/supabase'
import TableOfContents, { type TocHeading } from '@/components/TableOfContents'
import ReadingProgress from '@/components/ReadingProgress'
import NewsletterSubscribe from '@/components/NewsletterSubscribe'
import AdSlot from '@/components/AdSlot'
import SavePostButton from '@/components/SavePostButton'
import PostViewCounter from '@/components/PostViewCounter'
import ReadingHistoryTracker from '@/components/ReadingHistoryTracker'
import InlineAd from '@/components/InlineAd'
import InlineAdInjector from '@/components/InlineAdInjector'
import BlogTemplateRenderer from '@/components/BlogTemplates/BlogTemplateRenderer'

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? ''
const ARTICLE_TOP_AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_TOP_SLOT ?? ''
const ARTICLE_MID_AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_MID_SLOT ?? ''
const ARTICLE_FOOTER_AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_FOOTER_SLOT ?? ''
const ARTICLE_SIDEBAR_AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_SIDEBAR_SLOT ?? ''
const ARTICLE_INLINE_AD_SLOT_PRIMARY = process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_INLINE_PRIMARY_SLOT ?? ''
const ARTICLE_INLINE_AD_SLOT_SECONDARY = process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_INLINE_SECONDARY_SLOT ?? ''

// Force dynamic rendering for preview mode support
export const dynamic = 'force-dynamic'
export const dynamicParams = true

type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  read_time: number | null
  published_at: string | null
  featured_image: string | null
  tags: string[] | null
  seo_title: string | null
  seo_description: string | null
  views: number | null
}

type RelatedPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image: string | null
  category: string
  read_time: number | null
  published_at: string | null
}

type ProcessedHtmlResult = {
  html: string
  headings: TocHeading[]
}

const HEADING_TAGS = ['h1', 'h2', 'h3']

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'section'
}

function getUniqueId(base: string, seen: Map<string, number>): string {
  const count = seen.get(base) ?? 0
  seen.set(base, count + 1)
  return count === 0 ? base : `${base}-${count + 1}`
}

function extractTextFromChildren(children: ReactNode): string {
  if (typeof children === 'string') {
    return children
  }

  if (typeof children === 'number') {
    return children.toString()
  }

  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join(' ')
  }

  if (children && typeof children === 'object' && 'props' in children) {
    const node = children as { props?: { children?: ReactNode } }
    return extractTextFromChildren(node.props?.children ?? '')
  }

  return ''
}

function extractMarkdownHeadings(markdown: string): TocHeading[] {
  const lines = markdown.split(/\r?\n/)
  const seen = new Map<string, number>()
  const headings: TocHeading[] = []

  lines.forEach((line) => {
    const match = /^(#{1,3})\s+(.*)/.exec(line.trim())
    if (!match) return

    const level = match[1].length
    const text = match[2].trim()
    if (!text) return

    const base = slugifyHeading(text)
    const id = getUniqueId(base, seen)

    headings.push({
      id,
      text,
      level
    })
  })

  return headings
}

function processHtmlContent(html: string): ProcessedHtmlResult {
  const $ = load(html, { decodeEntities: false })
  $('script, style, iframe, noscript').remove()
  $('[data-inline-ad]').remove()

  const seen = new Map<string, number>()
  const headings: TocHeading[] = []

  $('h1, h2, h3').each((_, element) => {
    const node = element as { tagName?: string; name?: string }
    const rawTagName = typeof node.tagName === 'string' ? node.tagName : node.name
    const tagName = rawTagName?.toLowerCase()
    if (!tagName || !HEADING_TAGS.includes(tagName)) {
      return
    }

    const level = Number(tagName.replace('h', ''))
    const text = $(element).text().trim()
    if (!text) {
      return
    }

    const base = slugifyHeading(text)
    const id = getUniqueId(base, seen)

    $(element).attr('id', id)
    headings.push({ id, text, level })
  })

  return {
    html: $.root().html() ?? html,
    headings
  }
}

function injectInlineAdsIntoHtml(html: string): string {
  const $ = load(html, { decodeEntities: false })
  $('[data-inline-ad]').remove()

  const paragraphs = $('p')
  if (paragraphs.length === 0) {
    return $.root().html() ?? html
  }

  const targets: Array<{ index: number; slot: 'primary' | 'secondary' }> = [
    { index: 1, slot: 'primary' },
    { index: 4, slot: 'secondary' }
  ]

  targets.forEach(({ index, slot }) => {
    const paragraph = paragraphs.eq(index)
    if (paragraph.length) {
      paragraph.after(`<div class="inline-ad" data-inline-ad="true" data-slot="${slot}"></div>`)
    }
  })

  return $.root().html() ?? html
}

async function getBlogPost(slug: string, preview: boolean = false): Promise<{ post: BlogPost; relatedPosts: RelatedPost[] } | null> {
  try {
    console.log('📖 getBlogPost - slug:', slug, 'preview:', preview)
    
    // Build query with or without is_published check based on preview mode
    let query = supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
    
    // Only filter by is_published if NOT in preview mode
    if (!preview) {
      console.log('✅ Adding is_published filter (normal mode)')
      query = query.eq('is_published', true)
    } else {
      console.log('🔓 Skipping is_published filter (preview mode)')
    }
    
    const { data: post, error } = await query.single()

    if (error || !post) {
      return null
    }

    const { data: relatedPosts, error: relatedError } = await supabase
      .from('blog_posts')
      .select(
        `
          id,
          title,
          slug,
          excerpt,
          featured_image,
          category,
          read_time,
          published_at
        `
      )
      .eq('is_published', true)
      .eq('category', post.category)
      .neq('slug', slug)
      .order('published_at', { ascending: false })
      .limit(3)

    if (relatedError) {
      console.warn('⚠️ Failed to fetch related posts:', relatedError)
    }

    return {
      post: {
        ...post,
        views: post.views ?? 0
      },
      relatedPosts: (relatedPosts || []).map((related) => ({
        ...related,
        read_time: related.read_time ?? 0,
        published_at: related.published_at ?? null
      }))
    }
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getBlogPost(slug)
  
  if (!data) {
    return {
      title: 'Post Not Found - Zenx Blog',
      description: 'The blog post you are looking for could not be found.'
    }
  }

  const { post } = data
  const postTags = post.tags ?? []

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    keywords: postTags.join(', '),
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      authors: ['Zenx Blog'],
      tags: postTags,
      images: post.featured_image ? [{
        url: post.featured_image,
        width: 1200,
        height: 630,
        alt: post.title
      }] : []
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.featured_image ? [post.featured_image] : []
    }
  }
}

export default async function BlogPost({ 
  params,
  searchParams 
}: { 
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { slug } = await params
  const searchParamsResolved = await searchParams
  const preview = searchParamsResolved?.preview
  const isPreview = preview === 'true'
  
  console.log('🔍 Blog page - slug:', slug, 'preview param:', preview, 'isPreview:', isPreview)
  
  const headersList = await headers()
  const protocol = headersList.get('x-forwarded-proto') ?? 'http'
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host') ?? 'localhost:3000'
  const configuredBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  const baseUrl = (configuredBase || `${protocol}://${host}`).replace(/\/$/, '')

  const data = await getBlogPost(slug, isPreview)
  
  if (!data) {
    console.error('❌ No data returned from getBlogPost')
    notFound()
  }

  const { post, relatedPosts } = data

  const publishedDate = post.published_at ? new Date(post.published_at) : null
  const formattedPublishedDate = publishedDate ? format(publishedDate, 'MMMM dd, yyyy') : 'Unpublished'
  const readTimeMinutes = post.read_time ?? 0
  const postTags = post.tags ?? []

  const articleDomId = 'zenx-article-content'
  const isHtmlContent = /<([a-z][\w0-9]*)\b[^>]*>/i.test(post.content || '')
  const processedResult = isHtmlContent ? processHtmlContent(post.content) : null
  const htmlWithInlineAds = processedResult ? injectInlineAdsIntoHtml(processedResult.html) : null
  const processedHtml = htmlWithInlineAds ?? processedResult?.html ?? post.content
  const headings = isHtmlContent
    ? processedResult?.headings ?? []
    : extractMarkdownHeadings(post.content)

  const markdownHeadingBuckets = headings.reduce<Record<string, string[]>>((acc, heading) => {
    const key = `${heading.level}-${heading.text.toLowerCase()}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(heading.id)
    return acc
  }, {})

  const getMarkdownHeadingId = (level: number, text: string) => {
    const key = `${level}-${text.toLowerCase()}`
    const ids = markdownHeadingBuckets[key]
    if (!ids || ids.length === 0) {
      const fallback = slugifyHeading(text)
      return fallback
    }
    return ids.shift() ?? slugifyHeading(text)
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'technology': 'bg-purple-100 text-purple-800',
      'entertainment': 'bg-yellow-100 text-yellow-800',
      'business': 'bg-blue-100 text-blue-800',
      'lifestyle': 'bg-green-100 text-green-800',
      'sports': 'bg-red-100 text-red-800',
      'world-news': 'bg-gray-100 text-gray-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const shareUrl = `${baseUrl}/blog/${post.slug}`
  let markdownParagraphCount = 0

  const mergeClassName = (base: string, extra?: string) => [base, extra].filter(Boolean).join(' ')

  const markdownComponents: Components = {
    h1: ({ children, className, ...props }) => {
      const text = extractTextFromChildren(children ?? '')
      const id = getMarkdownHeadingId(1, text)
      return (
        <h1
          {...props}
          id={id}
          className={mergeClassName('text-3xl font-bold text-slate-900', className)}
        >
          {children}
        </h1>
      )
    },
    h2: ({ children, className, ...props }) => {
      const text = extractTextFromChildren(children ?? '')
      const id = getMarkdownHeadingId(2, text)
      return (
        <h2
          {...props}
          id={id}
          className={mergeClassName('mt-12 text-2xl font-bold text-slate-900', className)}
        >
          {children}
        </h2>
      )
    },
    h3: ({ children, className, ...props }) => {
      const text = extractTextFromChildren(children ?? '')
      const id = getMarkdownHeadingId(3, text)
      return (
        <h3
          {...props}
          id={id}
          className={mergeClassName('mt-8 text-xl font-semibold text-slate-900', className)}
        >
          {children}
        </h3>
      )
    },
    p: ({ children, className, ...props }) => {
      markdownParagraphCount += 1

      const paragraph = (
        <p {...props} className={mergeClassName('leading-relaxed text-slate-700', className)}>
          {children}
        </p>
      )

      const inlineAds: Array<{ key: string; slot: string; label: string }> = []

      if (markdownParagraphCount === 2) {
        inlineAds.push({
          key: 'markdown-inline-primary',
          slot: ARTICLE_INLINE_AD_SLOT_PRIMARY,
          label: 'Sponsored Read'
        })
      }

      if (markdownParagraphCount === 5) {
        inlineAds.push({
          key: 'markdown-inline-secondary',
          slot: ARTICLE_INLINE_AD_SLOT_SECONDARY,
          label: 'Recommended Partner'
        })
      }

      if (inlineAds.length === 0) {
        return paragraph
      }

      return (
        <Fragment>
          {paragraph}
          {inlineAds.map(({ key, slot, label }) => (
            <InlineAd
              key={key}
              slotId={slot}
              clientId={ADSENSE_CLIENT_ID}
              format="fluid"
              label={label}
              className="max-w-3xl"
            />
          ))}
        </Fragment>
      )
    },
    ul: ({ children, className, ...props }) => (
      <ul {...props} className={mergeClassName('my-6 list-disc pl-6 text-slate-700', className)}>
        {children}
      </ul>
    ),
    ol: ({ children, className, ...props }) => (
      <ol {...props} className={mergeClassName('my-6 list-decimal pl-6 text-slate-700', className)}>
        {children}
      </ol>
    ),
    blockquote: ({ children, className, ...props }) => (
      <blockquote
        {...props}
        className={mergeClassName('my-6 border-l-4 border-blue-500 bg-blue-50/60 px-6 py-4 text-slate-700', className)}
      >
        {children}
      </blockquote>
    ),
    code: ({ children, className, ...props }) => (
      <code
        {...props}
        className={mergeClassName('rounded bg-slate-900/90 px-2 py-1 font-mono text-sm text-slate-100', className)}
      >
        {children}
      </code>
    ),
    pre: ({ children, className, ...props }) => (
      <pre
        {...props}
        className={mergeClassName('my-6 overflow-x-auto rounded-2xl bg-slate-900/95 p-5 text-sm text-slate-50', className)}
      >
        {children}
      </pre>
    ),
    table: ({ children, className, ...props }) => (
      <div className={mergeClassName('my-8 overflow-hidden rounded-2xl border border-slate-200 shadow-sm', className)}>
        <table {...props} className="w-full text-left text-sm text-slate-700">
          {children}
        </table>
      </div>
    ),
    th: ({ children, className, ...props }) => (
      <th
        {...props}
        className={mergeClassName('bg-slate-900/90 px-4 py-3 text-sm font-semibold text-white', className)}
      >
        {children}
      </th>
    ),
    td: ({ children, className, ...props }) => (
      <td {...props} className={mergeClassName('px-4 py-3 text-sm text-slate-700', className)}>
        {children}
      </td>
    )
  }

  return (
    <div className="min-h-screen bg-white pt-6">
      {isPreview && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black px-4 py-2 text-center font-bold">
          👁️ PREVIEW MODE - This is an unpublished draft
          <script dangerouslySetInnerHTML={{
            __html: `console.log('🔍 Client: Preview mode active for post: ${post.slug}')`
          }} />
        </div>
      )}
      <script dangerouslySetInnerHTML={{
        __html: `console.log('🔍 Client: Blog post loaded - slug: ${post.slug}, preview: ${isPreview}')`
      }} />
      <ReadingProgress targetId={articleDomId} />
      <ReadingHistoryTracker postId={post.id} articleElementId={articleDomId} />
      <PostViewCounter
        postId={post.id}
        slug={post.slug}
        initialViews={post.views ?? 0}
        className="hidden"
      />
      
      <BlogTemplateRenderer
        post={post}
        relatedPosts={relatedPosts}
        headings={headings}
        formattedDate={formattedPublishedDate}
        shareUrl={shareUrl}
        processedHtml={processedHtml}
        isHtmlContent={isHtmlContent}
        adsenseClientId={ADSENSE_CLIENT_ID}
        adSlots={{
          top: ARTICLE_TOP_AD_SLOT,
          sidebar: ARTICLE_SIDEBAR_AD_SLOT,
          mid: ARTICLE_MID_AD_SLOT,
          footer: ARTICLE_FOOTER_AD_SLOT
        }}
        useAILayout={true} // Enable AI-powered custom layouts
      />
    </div>
  )
}