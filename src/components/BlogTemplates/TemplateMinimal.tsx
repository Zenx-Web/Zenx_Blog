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

interface TemplateMinimalProps {
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

export default function TemplateMinimal({
  post,
  relatedPosts,
  headings,
  formattedDate,
  shareUrl,
  processedHtml,
  isHtmlContent,
  adsenseClientId,
  adSlots
}: TemplateMinimalProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="text-center">
          {/* Category - Minimal */}
          <div className="mb-6">
            <span className="text-sm font-medium uppercase tracking-widest text-gray-500">
              {post.category}
            </span>
          </div>

          {/* Title - Clean & Centered */}
          <h1 className="mb-8 text-4xl font-light leading-tight text-gray-900 md:text-5xl lg:text-6xl">
            {post.title}
          </h1>

          {/* Meta - Simple */}
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <time>{formattedDate}</time>
            <span>•</span>
            <span>{post.read_time} min read</span>
            <span>•</span>
            <span>{post.views || 0} views</span>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-center">
            <SavePostButton postId={post.id} postSlug={post.slug} />
          </div>
        </div>

        {/* Featured Image - Minimal */}
        {post.featured_image && (
          <div className="mt-12">
            <Image
              src={post.featured_image}
              alt={post.title}
              width={1200}
              height={675}
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        )}
      </div>

      {/* Content - Minimal & Focused */}
      <div className="mx-auto max-w-2xl px-4 pb-24">
        {/* TOC - Minimal */}
        {headings.length > 0 && (
          <div className="mb-12 border-y border-gray-200 py-8">
            <h3 className="mb-4 text-xs font-medium uppercase tracking-widest text-gray-500">
              Contents
            </h3>
            <TableOfContents headings={headings} />
          </div>
        )}

        {/* Article Content */}
        <article className="prose prose-lg prose-gray max-w-none prose-headings:font-light prose-p:text-gray-700 prose-p:leading-loose prose-a:text-gray-900 prose-a:underline prose-a:decoration-gray-300 hover:prose-a:decoration-gray-900">
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
        </article>

        {/* Tags - Minimal */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-16 border-t border-gray-200 pt-12">
            <div className="flex flex-wrap justify-center gap-4">
              {post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Ad - Minimal */}
        {adsenseClientId && adSlots.mid && (
          <div className="my-16 border-y border-gray-100 py-8">
            <p className="mb-4 text-center text-xs uppercase tracking-wide text-gray-400">
              Advertisement
            </p>
            <AdSlot slotId={adSlots.mid} format="auto" />
          </div>
        )}

        {/* Related Posts - Minimal */}
        {relatedPosts.length > 0 && (
          <div className="mt-24 border-t border-gray-200 pt-12">
            <h3 className="mb-8 text-xs font-medium uppercase tracking-widest text-gray-500">
              Related Reading
            </h3>
            <div className="space-y-8">
              {relatedPosts.slice(0, 3).map((related: any) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="group block"
                >
                  <h4 className="text-2xl font-light text-gray-900 transition group-hover:text-gray-600">
                    {related.title}
                  </h4>
                  <p className="mt-2 text-sm text-gray-500">{related.read_time} min read</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Newsletter - Minimal */}
        <div className="mt-24 border-t border-gray-200 pt-12">
          <NewsletterSubscribe />
        </div>
      </div>
    </div>
  )
}
