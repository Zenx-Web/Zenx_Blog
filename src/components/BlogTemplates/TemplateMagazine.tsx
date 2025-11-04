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

interface TemplateMagazineProps {
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

export default function TemplateMagazine({
  post,
  relatedPosts,
  headings,
  formattedDate,
  shareUrl,
  processedHtml,
  isHtmlContent,
  adsenseClientId,
  adSlots
}: TemplateMagazineProps) {
  return (
    <div className="bg-white">
      {/* Magazine-Style Header */}
      <div className="border-b-4 border-black bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-4 flex items-center gap-4">
            <span className={`rounded px-3 py-1 text-xs font-bold uppercase tracking-widest ${getCategoryColor(post.category)}`}>
              {post.category}
            </span>
            <div className="h-px flex-1 bg-gray-300" />
            <time className="text-sm font-medium text-gray-600">{formattedDate}</time>
          </div>

          <h1 className="font-serif text-5xl font-bold leading-tight text-gray-900 md:text-6xl lg:text-7xl">
            {post.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-6 border-y border-gray-300 py-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ClockIcon className="h-4 w-4" />
              <span className="font-medium">{post.read_time} min read</span>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <EyeIcon className="h-4 w-4" />
              <span className="font-medium">{post.views || 0} views</span>
            </div>
            <div className="ml-auto">
              <SavePostButton postId={post.id} postSlug={post.slug} />
            </div>
          </div>
        </div>
      </div>

      {/* Featured Image - Magazine Style */}
      {post.featured_image && (
        <div className="border-b-2 border-gray-200">
          <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="overflow-hidden">
              <Image
                src={post.featured_image}
                alt={post.title}
                width={1200}
                height={675}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          </div>
        </div>
      )}

      {/* Magazine Layout: Two-Column with Drop Cap */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Sidebar - Left */}
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-24 space-y-8">
              {/* TOC */}
              {headings.length > 0 && (
                <div className="border-l-4 border-black bg-gray-50 p-6">
                  <h3 className="mb-4 font-serif text-lg font-bold text-gray-900">
                    In This Article
                  </h3>
                  <TableOfContents headings={headings} />
                </div>
              )}

              {/* Ad */}
              {adsenseClientId && adSlots.sidebar && (
                <div className="border border-gray-200 p-4">
                  <p className="mb-2 text-center text-xs uppercase tracking-wide text-gray-500">
                    Advertisement
                  </p>
                  <AdSlot slotId={adSlots.sidebar} format="auto" />
                </div>
              )}
            </div>
          </aside>

          {/* Main Article - Center */}
          <article className="lg:col-span-6">
            {/* Magazine-style prose */}
            <div className="prose prose-xl prose-gray max-w-none font-serif prose-headings:font-serif prose-headings:font-bold prose-p:leading-relaxed prose-a:text-blue-900 prose-a:underline prose-blockquote:border-l-4 prose-blockquote:border-black prose-blockquote:font-serif prose-blockquote:italic">
              {isHtmlContent ? (
                <div
                  id="zenx-article-content"
                  className="enhanced-blog-content drop-cap"
                  dangerouslySetInnerHTML={{ __html: processedHtml }}
                />
              ) : (
                <div id="zenx-article-content" className="drop-cap">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {post.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Tags - Magazine Style */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 border-t-2 border-gray-900 pt-8">
                <h3 className="mb-4 font-serif text-xl font-bold text-gray-900">Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="border-2 border-gray-900 bg-white px-4 py-2 text-sm font-bold uppercase tracking-wide text-gray-900 transition hover:bg-gray-900 hover:text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter - Magazine Style */}
            <div className="mt-12 border-y-2 border-gray-900 py-8">
              <NewsletterSubscribe />
            </div>
          </article>

          {/* Sidebar - Right */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24 space-y-8">
              {/* Related Articles - Magazine Style */}
              {relatedPosts.length > 0 && (
                <div className="border-2 border-gray-900 bg-white p-6">
                  <h3 className="mb-6 border-b-2 border-gray-900 pb-2 font-serif text-xl font-bold text-gray-900">
                    More Stories
                  </h3>
                  <div className="space-y-6">
                    {relatedPosts.slice(0, 3).map((related: any, index: number) => (
                      <div key={related.id}>
                        <Link
                          href={`/blog/${related.slug}`}
                          className="group block"
                        >
                          <div className="mb-2 text-3xl font-bold text-gray-300">
                            0{index + 1}
                          </div>
                          <h4 className="font-serif text-lg font-bold text-gray-900 transition group-hover:text-blue-900">
                            {related.title}
                          </h4>
                          <p className="mt-2 text-sm text-gray-600">
                            {related.read_time} min read
                          </p>
                        </Link>
                        {index < relatedPosts.slice(0, 3).length - 1 && (
                          <div className="mt-6 h-px bg-gray-300" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Magazine-style drop cap CSS */}
      <style jsx>{`
        .drop-cap::first-letter {
          float: left;
          font-size: 4.5rem;
          line-height: 0.85;
          font-weight: bold;
          margin: 0.1rem 0.5rem 0 0;
          font-family: Georgia, serif;
        }
      `}</style>
    </div>
  )
}
