import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarIcon, ClockIcon, EyeIcon, ShareIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import '@/styles/enhanced-blog.css'
import { headers } from 'next/headers'
import { load } from 'cheerio'
import type { ReactNode } from 'react'

import { supabase } from '@/lib/supabase'
import TableOfContents, { type TocHeading } from '@/components/TableOfContents'
import ReadingProgress from '@/components/ReadingProgress'
import type { Database } from '@/types/database.types'

type BlogPostRow = Database['public']['Tables']['blog_posts']['Row']

interface BlogPost extends BlogPostRow {
  views: number
}

type RelatedPost = Pick<
  BlogPostRow,
  'id' | 'title' | 'slug' | 'excerpt' | 'featured_image' | 'category' | 'read_time' | 'published_at'
>

type Heading = TocHeading;

function slugifyHeading(input: string) {
  const text = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  return text || 'section'
}

function normaliseHeadings(headings: Heading[]): Heading[] {
  const seen = new Map<string, number>()

  return headings.map((heading) => {
    const baseId = heading.id
    const count = seen.get(baseId) ?? 0
    seen.set(baseId, count + 1)

    if (count === 0) {
      return heading
    }

    return {
      ...heading,
      id: `${baseId}-${count}`
    }
  })
}

function processHtmlContent(rawHtml: string): { html: string; headings: Heading[] } {
  const wrapped = `<div id="zenx-article-root">${rawHtml}</div>`
  const $ = load(wrapped, { decodeEntities: false })
  const headings: Heading[] = []

  $('#zenx-article-root')
    .find('h2, h3')
    .each((index, element) => {
      const tagName = 'tagName' in element ? element.tagName?.toLowerCase() : undefined
      if (!tagName) return

      const level = Number(tagName.replace('h', ''))
      if (level !== 2 && level !== 3) return

      const text = $(element).text().trim()
      let slug = slugifyHeading(text)
      if (!slug || slug === 'section') {
        slug = `section-${index + 1}`
      }

      headings.push({ id: slug, text, level })
      $(element).attr('id', slug)
    })

  const uniqueHeadings = normaliseHeadings(headings)
  uniqueHeadings.forEach(({ id }, idx) => {
    $('#zenx-article-root')
      .find('h2, h3')
      .eq(idx)
      .attr('id', id)
  })

  const processedHtml = $('#zenx-article-root').html() ?? rawHtml
  return { html: processedHtml, headings: uniqueHeadings }
}

function extractMarkdownHeadings(markdown: string): Heading[] {
  const headings: Heading[] = []
  const lines = markdown.split('\n')

  lines.forEach((line) => {
    const match = line.match(/^(#{2,3})\s+(.*)$/)
    if (!match) return

    const level = match[1].length
    const text = match[2].trim()
    if (!text) return

    const slug = slugifyHeading(text)
    headings.push({ id: slug, text, level })
  })

  return normaliseHeadings(headings)
}

function extractTextFromChildren(children: ReactNode): string {
  if (typeof children === 'string') {
    return children
  }

  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join(' ')
  }

  if (typeof children === 'number') {
    return children.toString()
  }

  if (children && typeof children === 'object' && 'props' in children) {
    const node = children as { props?: { children?: ReactNode } }
    return extractTextFromChildren(node.props?.children ?? '')
  }

  return ''
}

async function getBlogPost(slug: string): Promise<{ post: BlogPost; relatedPosts: RelatedPost[] } | null> {
  try {
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()

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

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const headersList = await headers()
  const protocol = headersList.get('x-forwarded-proto') ?? 'http'
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host') ?? 'localhost:3000'
  const configuredBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  const baseUrl = (configuredBase || `${protocol}://${host}`).replace(/\/$/, '')

  const data = await getBlogPost(slug)
  
  if (!data) {
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
  const processedHtml = processedResult?.html ?? post.content
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

  return (
    <div className="min-h-screen bg-white">
      <ReadingProgress targetId={articleDomId} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="mb-8 flex text-sm text-gray-600">
          <Link href="/" className="hover:text-blue-600">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/?category=${post.category}`} className="hover:text-blue-600 capitalize">
            {post.category.replace('-', ' ')}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{post.title}</span>
        </nav>

        <header className="mb-10 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getCategoryColor(post.category)}`}>
              {post.category.replace('-', ' ')}
            </span>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="inline-flex items-center">
                <CalendarIcon className="mr-1.5 h-4 w-4" />
                {formattedPublishedDate}
              </span>
              <span className="inline-flex items-center">
                <ClockIcon className="mr-1.5 h-4 w-4" />
                {readTimeMinutes} min read
              </span>
              <span className="inline-flex items-center">
                <EyeIcon className="mr-1.5 h-4 w-4" />
                {post.views.toLocaleString()} views
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          <p className="max-w-3xl text-lg text-slate-600 sm:text-xl">
            {post.excerpt}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <ShareIcon className="h-4 w-4" />
            <span className="font-medium text-slate-600">Share</span>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
            >
              X (Twitter)
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
            >
              Facebook
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
            >
              LinkedIn
            </a>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${post.title} ${shareUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
            >
              WhatsApp
            </a>
          </div>
        </header>

        {post.featured_image && (
          <div className="mb-10 overflow-hidden rounded-3xl">
            <Image
              src={post.featured_image}
              alt={post.title}
              width={1200}
              height={650}
              className="h-72 w-full object-cover sm:h-96"
              priority
            />
          </div>
        )}

        <div className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]">
          <div className="space-y-10">
            <div className="rounded-3xl bg-slate-50 p-6 text-center text-slate-500 shadow-inner">
              <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
                Advertisement Space
              </div>
            </div>

            <article id={articleDomId} className="prose prose-lg mx-auto max-w-none text-slate-800 prose-headings:text-slate-900 prose-a:text-blue-600">
              {isHtmlContent ? (
                <div
                  className="enhanced-blog-content"
                  dangerouslySetInnerHTML={{ __html: processedHtml }}
                />
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    h1: ({ children }) => (
                      <h1 id={getMarkdownHeadingId(1, extractTextFromChildren(children))} className="text-3xl font-bold text-slate-900">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => {
                      const text = extractTextFromChildren(children)
                      const id = getMarkdownHeadingId(2, text)
                      return (
                        <h2 id={id} className="mt-12 text-2xl font-bold text-slate-900">
                          {children}
                        </h2>
                      )
                    },
                    h3: ({ children }) => {
                      const text = extractTextFromChildren(children)
                      const id = getMarkdownHeadingId(3, text)
                      return (
                        <h3 id={id} className="mt-8 text-xl font-semibold text-slate-900">
                          {children}
                        </h3>
                      )
                    },
                    p: ({ children }) => <p className="leading-relaxed text-slate-700">{children}</p>,
                    ul: ({ children }) => <ul className="my-6 list-disc pl-6 text-slate-700">{children}</ul>,
                    ol: ({ children }) => <ol className="my-6 list-decimal pl-6 text-slate-700">{children}</ol>,
                    blockquote: ({ children }) => (
                      <blockquote className="my-6 border-l-4 border-blue-500 bg-blue-50/60 px-6 py-4 text-slate-700">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="rounded bg-slate-900/90 px-2 py-1 font-mono text-sm text-slate-100">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="my-6 overflow-x-auto rounded-2xl bg-slate-900/95 p-5 text-sm text-slate-50">
                        {children}
                      </pre>
                    ),
                    table: ({ children }) => (
                      <div className="my-8 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                        <table className="w-full text-left text-sm text-slate-700">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => <th className="bg-slate-900/90 px-4 py-3 text-sm font-semibold text-white">{children}</th>,
                    td: ({ children }) => <td className="px-4 py-3 text-sm text-slate-700">{children}</td>
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              )}
            </article>

            <div className="rounded-3xl bg-slate-50 p-6 text-center text-slate-500 shadow-inner">
              <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
                Advertisement Space
              </div>
            </div>

            {postTags.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Tags</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {postTags.map((tag) => (
                    <span key={tag} className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                      #{tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {relatedPosts.length > 0 && (
              <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-slate-900">Related Articles</h2>
                  <span className="text-sm text-slate-500">Based on category</span>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {relatedPosts.map((relatedPost) => (
                    <Link
                      key={relatedPost.id}
                      href={`/blog/${relatedPost.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-lg"
                    >
                      {relatedPost.featured_image && (
                        <div className="relative h-40 w-full overflow-hidden">
                          <Image
                            src={relatedPost.featured_image}
                            alt={relatedPost.title}
                            fill
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col gap-3 p-5">
                        <h3 className="text-lg font-semibold text-slate-900 transition group-hover:text-blue-600">
                          {relatedPost.title}
                        </h3>
                        <p className="flex-1 text-sm text-slate-600 line-clamp-3">{relatedPost.excerpt}</p>
                        <div className="text-xs font-medium text-slate-500">
                          <ClockIcon className="mr-1 inline h-3 w-3" />
                          {relatedPost.read_time} min read
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <div className="rounded-3xl bg-slate-50 p-6 text-center text-slate-500 shadow-inner">
              <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
                Advertisement Space
              </div>
            </div>
          </div>

          <aside className="space-y-8">
            <TableOfContents headings={headings} />
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Stay in the loop</h3>
              <p className="mt-2 text-sm text-slate-600">
                Subscribe to get the hottest trends and AI-crafted breakdowns delivered weekly.
              </p>
              <form className="mt-4 space-y-3">
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}