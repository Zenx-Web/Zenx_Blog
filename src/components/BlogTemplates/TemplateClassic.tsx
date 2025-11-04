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

interface TemplateClassicProps {
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

export default function TemplateClassic({
  post,
  relatedPosts,
  headings,
  formattedDate,
  shareUrl,
  processedHtml,
  isHtmlContent,
  adsenseClientId,
  adSlots
}: TemplateClassicProps) {
  return (
    <div className="bg-white">
      {/* Classic Hero Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-4xl px-4 py-12">
          {/* Category Badge */}
          <div className="mb-4">
            <span className={`inline-block rounded-full px-4 py-1 text-sm font-semibold ${getCategoryColor(post.category)}`}>
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="mb-6 text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              <time>{formattedDate}</time>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              <span>{post.read_time} min read</span>
            </div>
            <div className="flex items-center gap-2">
              <EyeIcon className="h-5 w-5" />
              <span>{post.views || 0} views</span>
            </div>
            <SavePostButton postId={post.id} postSlug={post.slug} />
          </div>

          {/* Featured Image */}
          {post.featured_image && (
            <div className="mt-8 overflow-hidden rounded-2xl shadow-xl">
              <Image
                src={post.featured_image}
                alt={post.title}
                width={1200}
                height={630}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Table of Contents - Sticky Sidebar */}
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-24">
              {headings.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                  <h3 className="mb-4 text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Table of Contents
                  </h3>
                  <TableOfContents headings={headings} />
                </div>
              )}
            </div>
          </aside>

          {/* Main Article */}
          <article className="lg:col-span-6">
            <div className="prose prose-lg max-w-none">
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

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 border-t border-gray-200 pt-8">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800"
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

          {/* Right Sidebar - Ads & Related */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24 space-y-8">
              {/* Ad Space */}
              {adsenseClientId && adSlots.sidebar && (
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="mb-2 text-center text-xs text-gray-500">Advertisement</p>
                  <AdSlot
                    slotId={adSlots.sidebar}
                    format="auto"
                    responsive
                  />
                </div>
              )}

              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 text-lg font-bold text-gray-900">Related Articles</h3>
                  <div className="space-y-4">
                    {relatedPosts.slice(0, 3).map((related) => (
                      <Link
                        key={related.id}
                        href={`/blog/${related.slug}`}
                        className="group block"
                      >
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">
                          {related.title}
                        </h4>
                        <p className="mt-1 text-sm text-gray-600">{related.read_time} min read</p>
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
