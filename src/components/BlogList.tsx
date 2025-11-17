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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section - Enhanced */}
      {heroPost && !searchQuery && (
        <section className="relative mb-16 overflow-hidden">
          {/* Background gradient decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5 dark:from-blue-400/10 dark:via-purple-400/10 dark:to-pink-400/10" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12">
              {/* Hero Content */}
              <div className="relative z-10 flex flex-col justify-center space-y-8">
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/30 animate-pulse">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Featured Story
                    </span>
                    <span className="inline-flex items-center rounded-full border-2 border-blue-600/20 bg-blue-50 dark:bg-blue-900/30 px-4 py-1.5 text-sm font-semibold text-blue-700 dark:text-blue-300">
                      {heroPost.category.replace('-', ' ')}
                    </span>
                  </div>
                  
                  <Link href={`/blog/${heroPost.slug}`} className="group block">
                    <h1 className="text-4xl font-black leading-tight tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {heroPost.title}
                    </h1>
                  </Link>
                  
                  <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300 sm:text-xl">
                    {heroPost.excerpt}
                  </p>
                  
                  <Link 
                    href={`/blog/${heroPost.slug}`}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105"
                  >
                    Read Full Story
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
                
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    <span className="font-medium">{formatDateSafe(heroPost.published_at, 'MMM dd, yyyy', 'Unpublished')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5" />
                    <span className="font-medium">{(heroPost.read_time ?? 0)} min read</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <EyeIcon className="h-5 w-5" />
                    <span className="font-medium">{(heroPost.views ?? 0).toLocaleString()} views</span>
                  </div>
                </div>
              </div>
              
              {/* Hero Image */}
              <div className="relative">
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl shadow-gray-900/20 dark:shadow-black/40 ring-1 ring-gray-900/10 dark:ring-white/10">
                  {heroPost.featured_image ? (
                    <Image
                      src={heroPost.featured_image}
                      alt={heroPost.title}
                      fill
                      priority
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
                  )}
                </div>
                {/* Decorative elements */}
                <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-3xl" />
                <div className="absolute -top-4 -left-4 h-32 w-32 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-3xl" />
              </div>
            </div>
            
            {/* Supporting Posts - Enhanced Cards */}
            {supportingPosts.length > 0 && (
              <div className="mt-12 grid gap-6 sm:grid-cols-2">
                {supportingPosts.map((post, index) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                    <article className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg shadow-gray-900/10 dark:shadow-black/30 ring-1 ring-gray-900/5 dark:ring-white/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-gray-900/20 dark:hover:shadow-black/40">
                      {post.featured_image && (
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={post.featured_image}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                          <div className="absolute bottom-4 left-4">
                            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/90 dark:bg-gray-900/90 px-3 py-1 text-xs font-semibold text-gray-900 dark:text-white backdrop-blur-sm">
                              {post.category.replace('-', ' ')}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 mb-3">
                          {post.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium">{formatDateSafe(post.published_at, 'MMM dd', 'TBD')}</span>
                          <span>•</span>
                          <span className="font-medium">{(post.read_time ?? 0)} min read</span>
                        </div>
                      </div>
                      {/* Hover effect indicator */}
                      <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Categories Section - Enhanced */}
      {categorySummary.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-8 shadow-xl shadow-gray-900/5 dark:shadow-black/20 ring-1 ring-gray-900/5 dark:ring-white/5">
            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                    Explore by Topic
                  </h2>
                  <p className="text-base text-gray-600 dark:text-gray-400">
                    Discover content that matches your interests
                  </p>
                </div>
                <Link
                  href="/?category=all"
                  className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold uppercase tracking-wide transition-all duration-300 ${!category || category === 'all' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md hover:shadow-lg'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  All Articles
                </Link>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {categorySummary.map(({ category: categoryKey, count }) => {
                  const isActive = category === categoryKey
                  const label = categoryKey.replace('-', ' ')
                  return (
                    <Link
                      key={categoryKey}
                      href={`/?category=${encodeURIComponent(categoryKey)}`}
                      className={`group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 hover:scale-105 shadow-md hover:shadow-lg'}`}
                    >
                      <span className="capitalize">{label}</span>
                      <span className={`flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold min-w-[24px] transition-colors ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 group-hover:bg-blue-100 dark:group-hover:bg-blue-800'}`}>
                        {count}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
            
            {/* Background decoration */}
            <div className="absolute top-0 right-0 h-64 w-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
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
          <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">Featured Picks</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {supportingPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-gray-900">
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

      {/* Regular Posts Section - Enhanced */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
              {searchQuery ? `Search Results for "${searchQuery}"` : 
               category && category !== 'all' ? `${category.replace('-', ' ')} Articles` : 
               'Latest Articles'}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              {searchQuery ? `Found ${visiblePosts.length} articles matching your search` : 
               'Fresh content updated daily'}
            </p>
          </div>
        </div>

        {visiblePosts.length === 0 && !loading ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No articles found</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {feedItems.map((item) => {
                if (item.type === 'post') {
                  const post = item.post
                  return (
                    <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                      <article className="relative h-full overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg shadow-gray-900/10 dark:shadow-black/30 ring-1 ring-gray-900/5 dark:ring-white/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-gray-900/20 dark:hover:shadow-black/40">
                        {post.featured_image && (
                          <div className="relative h-56 overflow-hidden">
                            <Image
                              src={post.featured_image}
                              alt={post.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                            <div className="absolute top-4 left-4">
                              <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide backdrop-blur-sm ${getCategoryColor(post.category)}`}>
                                {post.category.replace('-', ' ')}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="p-6">
                          <h3 className="font-black text-xl text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 mb-3 line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 leading-relaxed">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              <span className="font-medium">{formatDateSafe(post.published_at, 'MMM dd', 'TBD')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ClockIcon className="h-4 w-4" />
                              <span className="font-medium">{(post.read_time ?? 0)}m</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <EyeIcon className="h-4 w-4" />
                              <span className="font-medium">{(post.views ?? 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        {/* Hover effect indicator */}
                        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
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

            {/* Load More Button - Enhanced */}
            {hasMore && (
              <div className="text-center mt-16">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-full hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 font-bold text-base"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading More...
                    </>
                  ) : (
                    <>
                      Load More Articles
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}