'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CalendarIcon, ClockIcon, EyeIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import AdSlot from '@/components/AdSlot'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image: string | null
  category: string
  tags: string[] | null
  is_featured: boolean | null
  read_time: number | null
  views: number | null
  published_at: string | null
}

interface BlogListProps {
  initialPosts?: BlogPost[]
  initialFeaturedPosts?: BlogPost[]
  category?: string
  searchQuery?: string
}

const FEED_AD_INTERVAL = 3
const INLINE_FEED_AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE ?? '7311203366'
const LEADERBOARD_AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD ?? '3950542855'
const MID_FEED_AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID_FEED ?? '7311203366'
const FOOTER_AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER ?? '3950542855'
type FeedItem =
  | { type: 'post'; post: BlogPost }
  | { type: 'ad'; id: string; span: number }

export default function BlogList({ 
  initialPosts = [], 
  initialFeaturedPosts = [],
  category,
  searchQuery
}: BlogListProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts)
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>(initialFeaturedPosts)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const formatDateSafe = (value: string | null, pattern: string, fallback: string) => {
    if (!value) return fallback
    try {
      return format(new Date(value), pattern)
    } catch {
      return fallback
    }
  }

  const curatedFeatured = useMemo(() => {
    if (featuredPosts.length > 0) {
      return featuredPosts
    }
    return posts.slice(0, 3)
  }, [featuredPosts, posts])

  const heroPost = useMemo(() => {
    return curatedFeatured.length > 0 ? curatedFeatured[0] : null
  }, [curatedFeatured])

  const supportingPosts = useMemo(() => {
    return heroPost ? curatedFeatured.slice(1, 3) : curatedFeatured.slice(0, 2)
  }, [curatedFeatured, heroPost])

  const hiddenPostIds = useMemo(() => {
    const ids = new Set<string>()
    if (heroPost) ids.add(heroPost.id)
    supportingPosts.forEach((post) => ids.add(post.id))
    return ids
  }, [heroPost, supportingPosts])

  const visiblePosts = useMemo(() => {
    if (!posts.length) return posts
    return posts.filter((post) => !hiddenPostIds.has(post.id))
  }, [posts, hiddenPostIds])

  const feedItems = useMemo(() => {
    if (visiblePosts.length === 0) {
      return [] as FeedItem[]
    }

    const items: FeedItem[] = []
    visiblePosts.forEach((post, index) => {
      const position = index + 1
      const columnIndex = index % 3

      items.push({ type: 'post', post })

      if (position % FEED_AD_INTERVAL === 0) {
        // Wide ad after every third post to break rows
  items.push({ type: 'ad', id: `feed-ad-wide-${index}`, span: 3 })
      } else if (columnIndex === 2) {
        // End of each row (3-column layout)
  items.push({ type: 'ad', id: `feed-ad-inline-${index}`, span: 1 })
      }
    })

    return items
  }, [visiblePosts])

  const categorySummary = useMemo(() => {
    const tally = new Map<string, number>()
    const register = (items: BlogPost[]) => {
      items.forEach((item) => {
        if (!item.category) return
        tally.set(item.category, (tally.get(item.category) ?? 0) + 1)
      })
    }

    register(curatedFeatured)
    register(posts)

    return Array.from(tally.entries())
      .map(([key, value]) => ({ category: key, count: value }))
      .sort((a, b) => b.count - a.count)
  }, [curatedFeatured, posts])

  const fetchPosts = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '12'
      })
      
      if (category && category !== 'all') {
        params.append('category', category)
      }
      
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/posts?${params}`)
      const data = await response.json()

      if (data.posts) {
        if (reset) {
          setPosts(data.posts)
          setFeaturedPosts(data.featuredPosts || [])
        } else {
          setPosts(prev => [...prev, ...data.posts])
        }
        
        setHasMore(data.pagination.page < data.pagination.totalPages)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }, [category, searchQuery])

  useEffect(() => {
    if (category || searchQuery) {
      void fetchPosts(1, true)
    }
  }, [category, searchQuery, fetchPosts])

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(page + 1)
    }
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="mb-8">
        <AdSlot
          slotId={LEADERBOARD_AD_SLOT}
          format="auto"
          variant="bare"
          className="w-full"
          slotStyle={{ display: 'block', minHeight: 90 }}
          title="Sponsored Leaderboard"
        />
      </section>

      {heroPost && !searchQuery && (
        <section className="relative mb-12 overflow-hidden rounded-3xl bg-slate-900 text-white">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative z-10 flex flex-col justify-between p-8 sm:p-10 lg:p-12">
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <span className="rounded-full bg-white/15 px-4 py-1 text-sm font-semibold uppercase tracking-wider">
                    Featured
                  </span>
                  <span className="rounded-full bg-blue-500/90 px-4 py-1 text-sm font-semibold">
                    {heroPost.category.replace('-', ' ')}
                  </span>
                </div>
                <Link href={`/blog/${heroPost.slug}`} className="group block max-w-3xl">
                  <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl transition-colors group-hover:text-blue-200">
                    {heroPost.title}
                  </h1>
                </Link>
                <p className="max-w-2xl text-base text-slate-200 sm:text-lg">
                  {heroPost.excerpt}
                </p>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-slate-300">
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {formatDateSafe(heroPost.published_at, 'MMM dd, yyyy', 'Unpublished')}
                </div>
                <div className="flex items-center">
                  <ClockIcon className="mr-2 h-5 w-5" />
                  {(heroPost.read_time ?? 0)} min read
                </div>
                <div className="flex items-center">
                  <EyeIcon className="mr-2 h-5 w-5" />
                  {(heroPost.views ?? 0).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden">
              {heroPost.featured_image ? (
                <Image
                  src={heroPost.featured_image}
                  alt={heroPost.title}
                  fill
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/60 via-purple-500/60 to-indigo-600/60" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
            </div>
          </div>
          {supportingPosts.length > 0 && (
            <div className="border-t border-white/10 bg-slate-900/80 backdrop-blur">
              <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-2">
                {supportingPosts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                    <article className="flex gap-5 rounded-2xl border border-white/5 bg-white/5 p-5 transition hover:bg-white/10">
                      <div className="flex-1 space-y-3">
                        <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-100">
                          {post.category.replace('-', ' ')}
                        </span>
                        <h3 className="text-lg font-semibold text-white transition group-hover:text-blue-200">
                          {post.title}
                        </h3>
                        <p className="line-clamp-2 text-sm text-slate-200">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-300">
                          <span>{formatDateSafe(post.published_at, 'MMM dd', 'TBD')}</span>
                          <span>•</span>
                          <span>{(post.read_time ?? 0)} min read</span>
                        </div>
                      </div>
                      {post.featured_image && (
                        <div className="relative hidden h-24 w-32 flex-shrink-0 overflow-hidden rounded-xl sm:block">
                          <Image
                            src={post.featured_image}
                            alt={post.title}
                            fill
                            className="object-cover transition group-hover:scale-105"
                          />
                        </div>
                      )}
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {categorySummary.length > 0 && (
        <section className="mb-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Explore by Topic</h2>
              <p className="text-sm text-gray-500">Jump into categories other readers love right now.</p>
            </div>
            <Link
              href="/?category=all"
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${!category || category === 'all' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All Articles
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {categorySummary.map(({ category: categoryKey, count }) => {
              const isActive = category === categoryKey
              const label = categoryKey.replace('-', ' ')
              return (
                <Link
                  key={categoryKey}
                  href={`/?category=${encodeURIComponent(categoryKey)}`}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700'}`}
                >
                  <span className="capitalize">{label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isActive ? 'bg-blue-500/40 text-white' : 'bg-white text-gray-700'}`}>
                    {count}
                  </span>
                </Link>
              )
            })}
          </div>

          <div className="mt-8">
            <AdSlot
              slotId={MID_FEED_AD_SLOT}
              format="fluid"
              layout="in-article"
              variant="minimal"
              className="w-full"
              slotStyle={{ display: 'block', margin: '0 auto' }}
              title="Featured Partner"
            />
          </div>
        </section>
      )}

      {supportingPosts.length > 0 && searchQuery && (
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">Featured Picks</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {supportingPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  {post.featured_image && (
                    <div className="relative h-48">
                      <Image
                        src={post.featured_image}
                        alt={post.title}
                        fill
                        className="object-cover transition group-hover:scale-105"
                      />
                      <div className="absolute top-4 left-4">
                        <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${getCategoryColor(post.category)}`}>
                          {post.category.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900 transition group-hover:text-blue-600">
                      {post.title}
                    </h3>
                    <p className="mb-4 flex-1 text-sm text-gray-600 line-clamp-3">{post.excerpt}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <CalendarIcon className="mr-1 h-4 w-4" />
                      {formatDateSafe(post.published_at, 'MMM dd, yyyy', 'Unpublished')}
                      <span className="mx-2">•</span>
                      <ClockIcon className="mr-1 h-4 w-4" />
                      {(post.read_time ?? 0)} min read
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Regular Posts Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {searchQuery ? `Search Results for "${searchQuery}"` : 
             category && category !== 'all' ? `${category.replace('-', ' ')} Articles` : 
             'Latest Articles'}
          </h2>
        </div>

        {visiblePosts.length === 0 && !loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No articles found.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {feedItems.map((item) => {
                if (item.type === 'post') {
                  const post = item.post
                  return (
                    <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                      <article className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                        {post.featured_image && (
                          <div className="relative h-48">
                            <Image
                              src={post.featured_image}
                              alt={post.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-4 left-4">
                              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(post.category)}`}>
                                {post.category.replace('-', ' ')}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="p-6">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors mb-3 line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-gray-600 mb-4 line-clamp-3">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {formatDateSafe(post.published_at, 'MMM dd', 'TBD')}
                            </div>
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              {(post.read_time ?? 0)}m
                            </div>
                            <div className="flex items-center">
                              <EyeIcon className="h-4 w-4 mr-1" />
                              {(post.views ?? 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  )
                }

                const spanClasses = item.span === 3 ? 'md:col-span-2 lg:col-span-3' : ''

                return (
                  <div key={item.id} className={spanClasses}>
                    <AdSlot
                      slotId={INLINE_FEED_AD_SLOT}
                      format="fluid"
                      layout="in-article"
                      variant="bare"
                      showLabel={false}
                      className="w-full text-center"
                      slotStyle={{ display: 'block', margin: item.span === 3 ? '24px auto' : '16px auto' }}
                      title={item.span === 3 ? 'Sponsored Highlight' : 'Sponsored'}
                    />
                  </div>
                )
              })}
            </div>

            <div className="mt-12">
              <AdSlot
                slotId={FOOTER_AD_SLOT}
                format="auto"
                variant="panel"
                className="mx-auto max-w-3xl"
                slotStyle={{ minHeight: 250 }}
                title="Sponsored Offers"
              />
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Loading...' : 'Load More Articles'}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}