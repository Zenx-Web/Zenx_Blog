'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CalendarIcon, ClockIcon, EyeIcon } from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import TableOfContents, { type TocHeading } from '@/components/TableOfContents'
import NewsletterSubscribe from '@/components/NewsletterSubscribe'
import AdSlot from '@/components/AdSlot'
import SavePostButton from '@/components/SavePostButton'
import { getCategoryColor } from '@/lib/category-utils'

interface TemplateModernProps {
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
}

export default function TemplateModern({
  post,
  relatedPosts,
  headings,
  formattedDate,
  shareUrl,
  processedHtml,
  isHtmlContent,
  adsenseClientId,
  adSlots
}: TemplateModernProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Modern Full-Width Hero */}
      <div className="relative pt-0">
        {post.featured_image && (
          <div className="relative h-[60vh] w-full">
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            
            {/* Overlay Content */}
            <div className="absolute inset-0 flex items-end">
              <div className="mx-auto w-full max-w-5xl px-4 pb-12">
                <span className={`inline-block rounded-full px-4 py-2 text-sm font-bold ${getCategoryColor(post.category)} shadow-lg`}>
                  {post.category}
                </span>
                <h1 className="mt-4 text-5xl font-black leading-tight text-white drop-shadow-2xl md:text-6xl">
                  {post.title}
                </h1>
                <div className="mt-6 flex flex-wrap items-center gap-4 text-white/90">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    <time>{formattedDate}</time>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-white/60" />
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5" />
                    <span>{post.read_time} min read</span>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-white/60" />
                  <div className="flex items-center gap-2">
                    <EyeIcon className="h-5 w-5" />
                    <span>{post.views || 0} views</span>
                  </div>
                  <div className="ml-auto">
                    <SavePostButton postId={post.id} postSlug={post.slug} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Image Fallback */}
        {!post.featured_image && (
          <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-24">
            <div className="mx-auto max-w-5xl px-4">
              <span className={`inline-block rounded-full px-4 py-2 text-sm font-bold bg-white/20 text-white shadow-lg`}>
                {post.category}
              </span>
              <h1 className="mt-4 text-5xl font-black leading-tight text-white md:text-6xl">
                {post.title}
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-white/90">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  <time>{formattedDate}</time>
                </div>
                <div className="h-1 w-1 rounded-full bg-white/60" />
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  <span>{post.read_time} min read</span>
                </div>
                <div className="h-1 w-1 rounded-full bg-white/60" />
                <div className="flex items-center gap-2">
                  <EyeIcon className="h-5 w-5" />
                  <span>{post.views || 0} views</span>
                </div>
                <div className="ml-auto">
                  <SavePostButton postId={post.id} postSlug={post.slug} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Main Content */}
          <article className="lg:col-span-8">
            {/* Table of Contents - Mobile */}
            {headings.length > 0 && (
              <div className="mb-8 rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 lg:hidden">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Jump to Section</h3>
                <TableOfContents headings={headings} />
              </div>
            )}

            {/* Article Content */}
            <div className="prose prose-lg prose-slate max-w-none prose-headings:font-black prose-a:text-blue-600 prose-a:no-underline hover:prose-a:text-blue-800">
              {isHtmlContent ? (
                <div
                  id="zenx-article-content"
                  className="enhanced-blog-content"
                  dangerouslySetInnerHTML={{ __html: processedHtml }}
                />
              ) : (
                <div id="zenx-article-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {post.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Tags Section */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-16 rounded-3xl border-2 border-slate-200 bg-white p-8">
                <h3 className="mb-4 text-xl font-black text-gray-900">Explore Topics</h3>
                <div className="flex flex-wrap gap-3">
                  {post.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2 text-sm font-bold text-white shadow-lg transition hover:scale-105"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter */}
            <div className="mt-12">
              <NewsletterSubscribe />
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-8">
              {/* TOC - Desktop */}
              {headings.length > 0 && (
                <div className="hidden rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 lg:block">
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-900">
                    Quick Navigation
                  </h3>
                  <TableOfContents headings={headings} />
                </div>
              )}

              {/* Ad Space */}
              {adsenseClientId && adSlots.sidebar && (
                <div className="rounded-3xl border-2 border-gray-200 bg-white p-4 shadow-sm">
                  <p className="mb-2 text-center text-xs font-medium text-gray-500">Sponsored</p>
                  <AdSlot
                    slotId={adSlots.sidebar}
                    format="auto"
                    responsive
                  />
                </div>
              )}

              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-6 text-lg font-black text-gray-900">Continue Reading</h3>
                  <div className="space-y-4">
                    {relatedPosts.slice(0, 3).map((related: any) => (
                      <Link
                        key={related.id}
                        href={`/blog/${related.slug}`}
                        className="group block border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                      >
                        <h4 className="font-bold text-gray-900 transition group-hover:text-blue-600">
                          {related.title}
                        </h4>
                        <p className="mt-1 text-sm text-gray-500">{related.read_time} min read</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
