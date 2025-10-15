'use client'

import { useState, useEffect, useCallback } from 'react'
import { SparklesIcon, EyeIcon } from '@heroicons/react/24/outline'
import '../styles/enhanced-blog.css'
import type { TrendingTopic as TrendingTopicSource } from '@/lib/trending'
import type { BlogPost } from '@/lib/supabase'

interface AdminDashboardProps {
  adminEmail: string
}

interface TrendingTopic extends TrendingTopicSource {
  blogScore: number
  used?: boolean
  searchQuery?: string
}

interface GeneratedBlog {
  title: string
  content: string
  excerpt: string
  seoTitle: string
  seoDescription: string
  tags: string[]
  readTime: number
  images?: Array<{
    description: string
    alt: string
    placement: string
    caption: string
  }>
  interactiveElements?: Array<{
    type: string
    title: string
    content: string
  }>
}

interface BlogPostRecord {
  id: string
  slug: string
  category: string
  is_published: boolean
  is_featured: boolean
  featured_image?: string | null
  published_at?: string | null
  title?: string
  created_at?: string | null
  updated_at?: string | null
}

type ApiBlogPost = {
  id: string
  slug: string
  category: string
  is_published: boolean
  is_featured: boolean
  featured_image?: string | null
  published_at?: string | null
  title?: string
  created_at?: string | null
  updated_at?: string | null
}

export default function AdminDashboard({ adminEmail }: AdminDashboardProps) {
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedBlog, setGeneratedBlog] = useState<GeneratedBlog | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<TrendingTopic | null>(null)
  const [loading, setLoading] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [savedPost, setSavedPost] = useState<BlogPostRecord | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [managedPosts, setManagedPosts] = useState<BlogPost[]>([])
  const [postFilter, setPostFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [postActionId, setPostActionId] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    show: boolean
  }>({ type: 'info', message: '', show: false })

  // Form state for blog generation
  const [category, setCategory] = useState('technology')
  const [tone, setTone] = useState('engaging')
  const [length, setLength] = useState('medium')
  const [includeImages, setIncludeImages] = useState(true)
  const [seoOptimized, setSeoOptimized] = useState(true)
  
  // Simple search state for existing topics
  const [searchTerm, setSearchTerm] = useState('')
  
  // Custom topic search states
  const [customSearchQuery, setCustomSearchQuery] = useState('')
  const [isSearchingCustom, setIsSearchingCustom] = useState(false)
  
  // Filtered topics (simple search only)
  const filteredTopics = trendingTopics.filter(topic => {
    return topic.topic.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Show notification function
  const showNotification = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setNotification({ type, message, show: true })
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 5000)
  }, [])

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const mapPostRecord = (post: ApiBlogPost): BlogPostRecord => ({
    id: post.id,
    slug: post.slug,
    category: post.category,
    is_published: post.is_published,
    is_featured: post.is_featured,
    featured_image: post.featured_image,
    published_at: post.published_at,
    title: post.title,
    created_at: post.created_at ?? null,
    updated_at: post.updated_at ?? null
  })

  const slugifyTitle = (value: string) => {
    if (!value) {
      return 'zenx-blog-post'
    }

    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'zenx-blog-post'
  }

  const fetchTrendingTopics = useCallback(async () => {
    setLoading(true)
    try {
      console.log('Fetching trending topics from API...')
      const response = await fetch('/api/admin/trending', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // Force fresh data
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: {
        success: boolean
        topics?: TrendingTopic[]
        source?: string
      } = await response.json()
      console.log('API Response:', data)
      
      if (data.success && data.topics) {
        setTrendingTopics(data.topics)
        console.log('Fetched topics:', data.topics.length)
        
        // Show different messages based on data source
        if (data.source === 'fallback') {
          showNotification('warning', `External APIs unavailable. Loaded ${data.topics.length} fallback trending topics.`)
        } else {
          showNotification('success', `Successfully loaded ${data.topics.length} live trending topics!`)
        }
      } else {
        console.error('API returned no topics:', data)
        showNotification('error', 'Failed to fetch trending topics. Please try again.')
      }
    } catch (error) {
      console.error('Error fetching trending topics:', error)
      
      // Provide more specific error information
      if (error instanceof TypeError && error.message.includes('fetch')) {
        showNotification('error', 'Network error: Unable to connect to the trending topics API. Please check your connection.')
      } else {
        showNotification('error', `Error connecting to trending topics API: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  useEffect(() => {
    void fetchTrendingTopics()
  }, [fetchTrendingTopics])

  const fetchManagedPosts = useCallback(async () => {
    setIsLoadingPosts(true)
    setPostError(null)
    try {
      const statusParam = postFilter === 'all' ? 'all' : postFilter
      const response = await fetch(`/api/admin/posts?status=${statusParam}&limit=20`)

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.error || `Failed with status ${response.status}`)
      }

      const data: { posts?: BlogPost[] } = await response.json()
      setManagedPosts(Array.isArray(data.posts) ? data.posts : [])
    } catch (error) {
      console.error('Error loading posts:', error)
      const message = error instanceof Error ? error.message : 'Unable to load posts'
      setPostError(message)
      showNotification('error', message)
    } finally {
      setIsLoadingPosts(false)
    }
  }, [postFilter, showNotification])

  useEffect(() => {
    if (isHydrated) {
      void fetchManagedPosts()
    }
  }, [isHydrated, fetchManagedPosts])

  // Search for custom topics based on user query
  const searchCustomTopics = async () => {
    if (!customSearchQuery.trim()) {
      showNotification('warning', 'Please enter a search query')
      return
    }

    setIsSearchingCustom(true)
    try {
      const response = await fetch('/api/admin/search-topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: customSearchQuery,
          limit: 20
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.topics) {
        // Add custom searched topics to the existing list
  const newTopics = data.topics.map((topic: TrendingTopic) => ({
          ...topic,
          source: `Custom Search: ${customSearchQuery}`,
          blogScore: scoreTopicForBlog(topic)
        }))
        
        setTrendingTopics(prev => [...newTopics, ...prev])
        setCustomSearchQuery('')
        showNotification('success', `Found ${newTopics.length} new topics for "${customSearchQuery}"`)
      } else {
        showNotification('info', 'No topics found for your search query. Try different keywords.')
      }
    } catch (error) {
      console.error('Error searching custom topics:', error)
      showNotification('error', 'Error searching for topics. Please try again.')
    } finally {
      setIsSearchingCustom(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!postId) return
    const confirmDelete = window.confirm('Are you sure you want to delete this post? This action cannot be undone.')
    if (!confirmDelete) return

    setPostActionId(postId)
    try {
      const response = await fetch(`/api/admin/posts?id=${encodeURIComponent(postId)}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.error || 'Failed to delete post')
      }

      showNotification('success', 'Post deleted successfully.')
      void fetchManagedPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
      showNotification('error', error instanceof Error ? error.message : 'Failed to delete post')
    } finally {
      setPostActionId(null)
    }
  }

  const handleTogglePublishStatus = async (post: BlogPost) => {
    if (!post?.id) return

    setPostActionId(post.id)
    try {
      const payload = {
        id: post.id,
        is_published: !post.is_published,
        published_at: !post.is_published ? new Date().toISOString() : null,
      }

      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.error || 'Failed to update post status')
      }

      showNotification('success', !post.is_published ? 'Post published.' : 'Post moved to drafts.')
      void fetchManagedPosts()
    } catch (error) {
      console.error('Error updating publish status:', error)
      showNotification('error', error instanceof Error ? error.message : 'Failed to update publish status')
    } finally {
      setPostActionId(null)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const response = await fetch('/api/admin/auth/logout', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to log out. Please try again.')
      }

      showNotification('success', 'Logged out successfully.')
      window.location.href = '/admin/login'
    } catch (error) {
      console.error('Logout failed:', error)
      showNotification('error', error instanceof Error ? error.message : 'Logout failed')
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Helper function to score topics (simplified version)
  const scoreTopicForBlog = (topic: TrendingTopic): number => {
    const baseScore = Math.max(topic.relevanceScore, 200)
    const randomBoost = Math.floor(Math.random() * 300)
    return baseScore + randomBoost
  }

  // Get category icon
  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      'Technology': '💻',
      'Entertainment': '🎬',
      'Sports': '⚽',
      'Business': '💼',
      'Lifestyle': '🌟',
      'World News': '📰',
      'General': '📝'
    }
    return icons[category] || '📝'
  }

  // Auto-detect category from topic
  const detectCategoryFromTopic = (topicText: string): string => {
    const text = topicText.toLowerCase()
    
    // Technology keywords
    if (text.includes('ai') || text.includes('tech') || text.includes('iphone') || 
        text.includes('software') || text.includes('app') || text.includes('digital') ||
        text.includes('cyber') || text.includes('robot') || text.includes('internet') ||
        text.includes('google') || text.includes('microsoft') || text.includes('apple') ||
        text.includes('tesla') || text.includes('spacex') || text.includes('ev') ||
        text.includes('electric vehicle') || text.includes('bitcoin') || text.includes('crypto')) {
      return 'technology'
    }
    
    // Entertainment keywords
    if (text.includes('movie') || text.includes('film') || text.includes('netflix') ||
        text.includes('celebrity') || text.includes('music') || text.includes('concert') ||
        text.includes('series') || text.includes('actor') || text.includes('actress') ||
        text.includes('hollywood') || text.includes('gaming') || text.includes('game') ||
        text.includes('funny') || text.includes('comedy') || text.includes('joke') ||
        text.includes('viral') || text.includes('meme') || text.includes('story')) {
      return 'entertainment'
    }
    
    // Sports keywords
    if (text.includes('sport') || text.includes('football') || text.includes('soccer') ||
        text.includes('basketball') || text.includes('baseball') || text.includes('tennis') ||
        text.includes('olympics') || text.includes('world cup') || text.includes('player') ||
        text.includes('team') || text.includes('match') || text.includes('championship') ||
        text.includes('league') || text.includes('fifa') || text.includes('nfl') ||
        text.includes('nba') || text.includes('golf') || text.includes('racing')) {
      return 'sports'
    }
    
    // Business keywords
    if (text.includes('business') || text.includes('market') || text.includes('stock') ||
        text.includes('economy') || text.includes('finance') || text.includes('money') ||
        text.includes('investment') || text.includes('startup') || text.includes('company') ||
        text.includes('ceo') || text.includes('profit') || text.includes('revenue') ||
        text.includes('trade') || text.includes('bank') || text.includes('wall street')) {
      return 'business'
    }
    
    // Lifestyle keywords
    if (text.includes('health') || text.includes('fitness') || text.includes('diet') ||
        text.includes('fashion') || text.includes('beauty') || text.includes('travel') ||
        text.includes('food') || text.includes('recipe') || text.includes('lifestyle') ||
        text.includes('wellness') || text.includes('meditation') || text.includes('yoga') ||
        text.includes('home') || text.includes('design') || text.includes('sustainable')) {
      return 'lifestyle'
    }
    
    // Default to world news
    return 'world-news'
  }

  // Function to handle topic selection and auto-adjust settings
  const selectTopicForGeneration = (topic: TrendingTopic) => {
    setSelectedTopic(topic)
    
    // Auto-detect and set category based on topic
    const detectedCategory = topic.category ? 
      topic.category.toLowerCase().replace(/\s+/g, '-') : 
      detectCategoryFromTopic(topic.topic)
    
    setCategory(detectedCategory)

    if (!selectedTopic || selectedTopic.topic !== topic.topic) {
      setGeneratedBlog(null)
      setSavedPost(null)
    }
  }

  // Auto-detect tone from topic
  const detectToneFromTopic = (topicText: string): string => {
    const text = topicText.toLowerCase()
    
    if (text.includes('guide') || text.includes('how to') || text.includes('tutorial') || text.includes('tips')) {
      return 'informative'
    } else if (text.includes('funny') || text.includes('viral') || text.includes('meme') || text.includes('entertainment')) {
      return 'casual'
    } else if (text.includes('business') || text.includes('professional') || text.includes('market') || text.includes('analysis')) {
      return 'professional'
    } else {
      return 'engaging' // Default
    }
  }

  // Auto-detect length from topic
  const detectLengthFromTopic = (topicText: string): string => {
    const text = topicText.toLowerCase()
    
    if (text.includes('guide') || text.includes('complete') || text.includes('ultimate') || text.includes('comprehensive')) {
      return 'long'
    } else if (text.includes('quick') || text.includes('tips') || text.includes('update') || text.includes('news')) {
      return 'short'
    } else {
      return 'medium' // Default
    }
  }

  const generateBlog = async () => {
    if (!selectedTopic) {
      showNotification('warning', 'Select a topic before starting AI generation.')
      return
    }

    const topic = selectedTopic
    setIsGenerating(true)
    setSavedPost(null)

    // Get the detected category for API call
    const detectedCategory = topic.category ? 
      topic.category.toLowerCase().replace(/\s+/g, '-') : 
      detectCategoryFromTopic(topic.topic)
    const categoryForGeneration = category || detectedCategory

    try {
      const response = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.topic,
          category: categoryForGeneration,
          tone,
          length,
          includeImages,
          seoOptimized
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setGeneratedBlog(data.generatedContent)
        if (data.blogPost) {
          setSavedPost(mapPostRecord(data.blogPost))
        }
        // Update topic as used
        setTrendingTopics(prev => 
          prev.map(t => 
            t.topic === topic.topic ? { ...t, used: true } : t
          )
        )
        
        // Show success message
        if (data.message) {
          console.log('✅ Generation successful:', data.message)
          showNotification('success', 'Blog generated successfully!')
        }
      } else {
        console.error('❌ Generation failed:', data)
        const errorMessage = data.error || 'Unknown error occurred'
        showNotification('error', `Failed to generate blog: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Error generating blog:', error)
      showNotification('error', 'Error generating blog content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const buildPostPayload = (publish: boolean) => {
    if (!generatedBlog) {
      return null
    }

    const slug = savedPost?.slug || slugifyTitle(generatedBlog.title)
    const basePayload = {
      id: savedPost?.id,
      title: generatedBlog.title,
      slug,
      content: generatedBlog.content,
      excerpt: generatedBlog.excerpt,
      category: category || 'world-news',
      tags: Array.isArray(generatedBlog.tags) ? generatedBlog.tags : [],
      is_featured: savedPost?.is_featured ?? false,
      seo_title: generatedBlog.seoTitle,
      seo_description: generatedBlog.seoDescription,
      read_time: generatedBlog.readTime,
      featured_image: savedPost?.featured_image ?? null
    }

    if (publish) {
      return {
        ...basePayload,
        is_published: true,
        published_at: new Date().toISOString()
      }
    }

    return {
      ...basePayload,
      is_published: false,
      published_at: savedPost?.is_published ? savedPost.published_at : null
    }
  }

  const handleSaveDraft = async () => {
    if (!generatedBlog) {
      showNotification('warning', 'Generate a blog before saving a draft.')
      return
    }

    const payload = buildPostPayload(false)
    if (!payload) {
      showNotification('error', 'Unable to prepare draft payload.')
      return
    }

    setIsSavingDraft(true)
    try {
      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error?.error || 'Request failed')
      }

      const data = await response.json()
      if (data.post) {
        setSavedPost(mapPostRecord(data.post))
      }

      showNotification('success', 'Draft saved successfully!')
    } catch (error) {
      console.error('Error saving draft:', error)
      showNotification('error', `Failed to save draft: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handlePublish = async () => {
    if (!generatedBlog) {
      showNotification('warning', 'Generate a blog before publishing.')
      return
    }

    const payload = buildPostPayload(true)
    if (!payload) {
      showNotification('error', 'Unable to prepare publish payload.')
      return
    }

    setIsPublishing(true)
    try {
      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error?.error || 'Request failed')
      }

      const data = await response.json()
      if (data.post) {
        setSavedPost(mapPostRecord(data.post))
      }

      showNotification('success', 'Post published successfully!')
    } catch (error) {
      console.error('Error publishing post:', error)
      showNotification('error', `Failed to publish post: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsPublishing(false)
    }
  }

  // Prevent hydration mismatch by not rendering until hydrated
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Zenx Blog Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Loading dashboard...
            </p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Zenx Blog Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Generate AI-powered blog content from trending topics
          </p>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-gray-500">
              Logged in as <span className="font-semibold text-gray-800">{adminEmail}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => void fetchManagedPosts()}
                disabled={isLoadingPosts}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingPosts ? 'Refreshing posts…' : 'Refresh Posts'}
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? 'Signing out…' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        {notification.show && (
          <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg transition-all duration-300 ${
            notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            notification.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
            'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' && (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {notification.type === 'error' && (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {notification.type === 'warning' && (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                {notification.type === 'info' && (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                  className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Manage Existing Posts</h2>
              <p className="text-sm text-gray-600 mt-1">
                Publish, unpublish, or remove posts that have already been generated.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'All', value: 'all' as const },
                { label: 'Published', value: 'published' as const },
                { label: 'Drafts', value: 'draft' as const }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setPostFilter(filter.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    postFilter === filter.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {isLoadingPosts && managedPosts.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>Loading posts…</span>
              </div>
            </div>
          ) : null}

          {postError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {postError}
            </div>
          )}

          {!isLoadingPosts && managedPosts.length === 0 && !postError ? (
            <div className="text-center py-12 text-gray-500">
              <p className="font-medium">No posts found for this filter.</p>
              <p className="text-sm mt-1">Generate or import posts to see them listed here.</p>
            </div>
          ) : null}

          <div className="space-y-4">
            {managedPosts.map((post) => {
              const isProcessing = postActionId === post.id
              return (
                <div
                  key={post.id}
                  className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                        {post.title}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            post.is_published
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {post.is_published ? 'Published' : 'Draft'}
                        </span>
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span>Slug: <span className="font-mono text-gray-700">{post.slug}</span></span>
                        <span>Category: <span className="font-medium text-gray-700">{post.category}</span></span>
                        {post.published_at && (
                          <span>Published: {new Date(post.published_at).toLocaleDateString()}</span>
                        )}
                        {post.updated_at && (
                          <span>Updated: {new Date(post.updated_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleTogglePublishStatus(post)}
                        disabled={isProcessing}
                        className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors ${
                          post.is_published
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        } ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {isProcessing
                          ? 'Updating…'
                          : post.is_published
                            ? 'Unpublish'
                            : 'Publish'}
                      </button>
                      <button
                        onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                        className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        disabled={isProcessing}
                        className={`px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 ${
                          isProcessing ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Trending Topics Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Trending Topics ({filteredTopics.length})
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={fetchTrendingTopics}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-colors duration-200 flex items-center gap-2"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {loading ? 'Refreshing...' : 'Refresh Topics'}
                </button>
                <button
                  onClick={() => setTrendingTopics([])}
                  className="bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600 font-medium shadow-sm transition-colors duration-200"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Custom Topic Search */}
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
              <h3 className="font-medium text-gray-900 mb-3">🚀 Search New Topics</h3>
              <p className="text-sm text-gray-600 mb-3">
                Enter any keyword or topic to generate fresh blog ideas instantly!
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={customSearchQuery}
                  onChange={(e) => setCustomSearchQuery(e.target.value)}
                  placeholder="e.g., AI trends, crypto news, healthy recipes..."
                  className="flex-1 p-3 border border-purple-300 rounded-lg bg-white text-gray-900 font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  onKeyPress={(e) => e.key === 'Enter' && searchCustomTopics()}
                />
                <button
                  onClick={searchCustomTopics}
                  disabled={isSearchingCustom || !customSearchQuery.trim()}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-colors duration-200 flex items-center gap-2"
                >
                  {isSearchingCustom && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {isSearchingCustom ? 'Searching...' : '🔍 Search'}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs text-gray-600">Quick searches:</span>
                {['AI trends', 'crypto news', 'healthy recipes', 'gaming updates', 'business tips'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setCustomSearchQuery(suggestion)}
                    className="text-xs bg-white text-purple-600 border border-purple-300 px-2 py-1 rounded hover:bg-purple-50 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Simple Search for Existing Topics */}
            {trendingTopics.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-medium text-gray-900 mb-3">🔍 Search Current Topics</h3>
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search in current topics..."
                    className="flex-1 p-3 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {searchTerm && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-gray-600">Found: </span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                      {filteredTopics.length} topics matching &quot;{searchTerm}&quot;
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Generation Controls */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <h3 className="font-medium text-gray-900 mb-3">
                ⚙️ AI Generation Settings 
                {selectedTopic && <span className="text-green-600 text-sm ml-2">✨ Auto-Optimized</span>}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Mode / Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className={`w-full p-3 border rounded-lg bg-white text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      selectedTopic ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="professional" className="text-gray-900 font-medium">Professional</option>
                    <option value="casual" className="text-gray-900 font-medium">Casual</option>
                    <option value="engaging" className="text-gray-900 font-medium">Engaging</option>
                    <option value="informative" className="text-gray-900 font-medium">Informative</option>
                    <option value="interactive" className="text-gray-900 font-medium">Interactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Length
                  </label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className={`w-full p-3 border rounded-lg bg-white text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      selectedTopic ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="short" className="text-gray-900 font-medium">Short (800-1200 words)</option>
                    <option value="medium" className="text-gray-900 font-medium">Medium (1500-2000 words)</option>
                    <option value="long" className="text-gray-900 font-medium">Long (2500-3500 words)</option>
                    <option value="very-long" className="text-gray-900 font-medium">Very Long (12,000+ words)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Category 
                    {selectedTopic && (
                      <span className="text-green-600 text-xs ml-1">(Auto-detected)</span>
                    )}
                  </label>
                  <select
                    value={category}
                    disabled
                    className={`w-full p-3 border rounded-lg bg-gray-100 text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      selectedTopic ? 'border-green-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="technology" className="text-gray-900 font-medium">💻 Technology</option>
                    <option value="entertainment" className="text-gray-900 font-medium">🎬 Entertainment</option>
                    <option value="business" className="text-gray-900 font-medium">💼 Business</option>
                    <option value="lifestyle" className="text-gray-900 font-medium">🌟 Lifestyle</option>
                    <option value="sports" className="text-gray-900 font-medium">⚽ Sports</option>
                    <option value="world-news" className="text-gray-900 font-medium">📰 World News</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeImages}
                      onChange={(e) => setIncludeImages(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      🖼️ Include Images (Unsplash)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={seoOptimized}
                      onChange={(e) => setSeoOptimized(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      🚀 SEO Optimization
                    </span>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-500">
                    {selectedTopic ? 'Pick the mode and length you want, then launch AI generation.' : 'Select a topic to enable AI generation.'}
                  </div>
                  <button
                    onClick={generateBlog}
                    disabled={!selectedTopic || isGenerating}
                    className={`bg-green-600 text-white px-5 py-3 rounded-lg font-medium shadow-sm flex items-center gap-2 transition-colors ${
                      !selectedTopic || isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
                    }`}
                  >
                    <SparklesIcon className="w-4 h-4" />
                    {isGenerating ? 'Generating...' : 'Generate Blog'}
                  </button>
                </div>
              </div>
              {selectedTopic && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🎯</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 font-medium mb-2">
                        Selected Topic: {selectedTopic.topic}
                      </p>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div className="bg-white p-2 rounded border">
                          <span className="text-gray-600">Category:</span>
                          <div className="font-medium text-blue-700">
                            {getCategoryIcon(category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' '))} {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                          </div>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <span className="text-gray-600">Mode:</span>
                          <div className="font-medium text-green-700 capitalize">{tone}</div>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <span className="text-gray-600">Length:</span>
                          <div className="font-medium text-purple-700 capitalize">{length}</div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        ✨ Category is auto-detected. Choose the mode and length that match your publishing plan, then generate when ready.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Topics List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3 text-blue-600">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="font-medium">Loading trending topics...</span>
                  </div>
                </div>
              )}
              
              {!loading && trendingTopics.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="font-medium">No trending topics found</p>
                  <p className="text-sm mt-1">Click &quot;Refresh Topics&quot; to fetch the latest trends</p>
                </div>
              )}
              
              {!loading && trendingTopics.length > 0 && filteredTopics.length === 0 && searchTerm && (
                <div className="text-center py-8 text-gray-500">
                  <p className="font-medium">No topics match your search</p>
                  <p className="text-sm mt-1">Try different keywords or search for new topics above</p>
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear Search
                  </button>
                </div>
              )}
              
              {!loading && filteredTopics.map((topic, index) => (
                <div
                  key={`${topic.topic}-${index}`}
                  className={`p-4 border rounded-lg hover:shadow-sm transition-shadow ${
                    selectedTopic?.topic === topic.topic
                      ? 'bg-blue-50 border-blue-400 shadow-sm'
                      : topic.used
                        ? 'bg-gray-100 border-gray-300'
                        : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-medium text-base ${
                        topic.used ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        {topic.topic}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="font-medium">Source: <span className="text-blue-600">{topic.source}</span></span>
                        <span className="font-medium">Score: <span className="text-green-600">{topic.blogScore}</span></span>
                        {topic.category && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                            {getCategoryIcon(topic.category)} {topic.category}
                          </span>
                        )}
                        <div className="text-xs bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 text-gray-700 px-3 py-1 rounded-full">
                          <span className="font-medium">✨ Suggested:</span> 
                          <span className="text-blue-700"> {getCategoryIcon(detectCategoryFromTopic(topic.topic).replace('-', ' '))} {detectCategoryFromTopic(topic.topic).replace('-', ' ')}</span>
                          <span className="text-green-700"> • {detectToneFromTopic(topic.topic)}</span>
                          <span className="text-purple-700"> • {detectLengthFromTopic(topic.topic)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => selectTopicForGeneration(topic)}
                      disabled={isGenerating || topic.used}
                      className={`ml-4 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${
                        selectedTopic?.topic === topic.topic
                          ? 'bg-blue-600 text-white'
                          : topic.used
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm'
                      } disabled:opacity-50`}
                    >
                      <EyeIcon className="w-4 h-4" />
                      {selectedTopic?.topic === topic.topic ? 'Selected' : topic.used ? 'Used' : 'Select'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generated Blog Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Generated Blog Preview
            </h2>
            
            {isGenerating && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-blue-600">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span>Generating blog content with AI...</span>
                </div>
              </div>
            )}

            {generatedBlog && !isGenerating && (
              <div className="space-y-6">
                {/* Blog Title Section */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">📝 Blog Title</h3>
                  <p className="text-gray-800 font-medium text-lg">{generatedBlog.title}</p>
                </div>
                
                {/* SEO & Meta Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-bold text-gray-900 mb-2">🔍 SEO Title</h3>
                    <p className="text-gray-700 text-sm font-medium">{generatedBlog.seoTitle}</p>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h3 className="font-bold text-gray-900 mb-2">⏱️ Read Time</h3>
                    <p className="text-gray-700 font-medium">{generatedBlog.readTime} minutes</p>
                  </div>
                </div>
                
                {/* Excerpt */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="font-bold text-gray-900 mb-2">📄 Excerpt</h3>
                  <p className="text-gray-700 font-medium leading-relaxed">{generatedBlog.excerpt}</p>
                </div>
                
                {/* Meta Description */}
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h3 className="font-bold text-gray-900 mb-2">📋 Meta Description</h3>
                  <p className="text-gray-700 text-sm font-medium leading-relaxed">{generatedBlog.seoDescription}</p>
                </div>
                
                {/* Tags */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="font-bold text-gray-900 mb-3">🏷️ Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {generatedBlog.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium border border-purple-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Enhanced Images Section */}
                {generatedBlog.images && generatedBlog.images.length > 0 && (
                  <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                    <h3 className="font-bold text-gray-900 mb-3">🖼️ Suggested Images ({generatedBlog.images.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {generatedBlog.images.map((image, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border">
                          <div className="text-sm">
                            <p className="font-medium text-gray-800 mb-1">📍 {image.placement.replace(/_/g, ' ')}</p>
                            <p className="text-gray-600 mb-2">{image.description}</p>
                            <p className="text-xs text-gray-500 italic">{image.caption}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interactive Elements Section */}
                {generatedBlog.interactiveElements && generatedBlog.interactiveElements.length > 0 && (
                  <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                    <h3 className="font-bold text-gray-900 mb-3">⚡ Interactive Elements ({generatedBlog.interactiveElements.length})</h3>
                    <div className="space-y-3">
                      {generatedBlog.interactiveElements.map((element, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-teal-100 text-teal-800 px-2 py-1 rounded text-xs font-medium">
                              {element.type}
                            </span>
                            <span className="font-medium text-gray-800">{element.title}</span>
                          </div>
                          {element.type === 'table' && (
                            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              📊 Detailed comparison/data table included
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Enhanced Content Preview */}
                <div className="bg-gray-50 rounded-lg border">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-bold text-gray-900">📖 Enhanced Content Preview</h3>
                    <p className="text-sm text-gray-600 mt-1">With interactive tables, styling, and rich formatting</p>
                  </div>
                  <div className="p-4 max-h-96 overflow-y-auto">
                    {isHydrated ? (
                      <div 
                        className="enhanced-blog-content prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: generatedBlog.content.substring(0, 3000)
                        }}
                      />
                    ) : (
                      <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
                        {generatedBlog.content.substring(0, 2000).split('\n').map((line, index) => (
                          <p key={index} className="mb-2">{line}</p>
                        ))}
                      </div>
                    )}
                    {generatedBlog.content.length > 3000 && (
                      <div className="mt-4 text-center">
                        <span className="text-gray-500 text-sm bg-gray-200 px-3 py-1 rounded-full">
                          ... content continues with more interactive elements and rich formatting
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing || !generatedBlog}
                    className={`bg-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${isPublishing ? 'cursor-wait' : ''}`}
                  >
                    <span>✏️</span> {isPublishing ? 'Publishing...' : 'Edit & Publish'}
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft || !generatedBlog}
                    className={`bg-green-600 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed ${isSavingDraft ? 'cursor-wait' : ''}`}
                  >
                    <span>💾</span> {isSavingDraft ? 'Saving...' : 'Save as Draft'}
                  </button>
                  <button 
                    onClick={() => {
                      if (savedPost?.slug && savedPost.is_published) {
                        window.open(`/blog/${savedPost.slug}`, '_blank')
                        return
                      }

                      const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes')
                      if (previewWindow && generatedBlog) {
                        previewWindow.document.write(`
                          <html>
                            <head>
                              <title>${generatedBlog.title}</title>
                              <meta name="description" content="${generatedBlog.seoDescription}">
                              <style>
                                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
                                h1 { color: #1a202c; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
                                h2, h3 { color: #2d3748; margin-top: 25px; }
                                .meta { background: #f7fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
                                .tags { margin-top: 20px; }
                                .tag { background: #e2e8f0; color: #4a5568; padding: 5px 10px; border-radius: 15px; margin-right: 10px; font-size: 12px; }
                              </style>
                            </head>
                            <body>
                              <h1>${generatedBlog.title}</h1>
                              <div class="meta">
                                <strong>Read Time:</strong> ${generatedBlog.readTime} minutes<br>
                                <strong>Excerpt:</strong> ${generatedBlog.excerpt}
                              </div>
                              <div>${generatedBlog.content.replace(/\n/g, '<br/>')}</div>
                              <div class="tags">
                                <strong>Tags:</strong> ${generatedBlog.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                              </div>
                            </body>
                          </html>
                        `)
                        previewWindow.document.close()
                      } else if (!generatedBlog) {
                        showNotification('info', 'Generate content before previewing.')
                      }
                    }}
                    className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center gap-2"
                  >
                    <span>👁️</span> Preview in New Window
                  </button>
                </div>
              </div>
            )}

            {!generatedBlog && !isGenerating && (
              <div className="flex items-center justify-center py-12 text-gray-500">
                <div className="text-center">
                  <SparklesIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Select a trending topic to generate AI-powered blog content</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}