'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { SparklesIcon, EyeIcon } from '@heroicons/react/24/outline'
import '../styles/enhanced-blog.css'
import type { TrendingTopic as TrendingTopicSource } from '@/lib/trending'
import type { BlogPost } from '@/lib/supabase'
import { normalizeEmailPreferences } from '@/lib/preferences'
import type { EmailPreferences } from '@/types/database.types'

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

interface AdminManagedUser {
  id: string
  email: string | null
  createdAt: string | null
  lastSignInAt: string | null
  bannedUntil: string | null
  factors: number
  profile: {
    display_name: string | null
    avatar_url: string | null
    bio: string | null
    preferences: EmailPreferences | null
    updated_at: string | null
  } | null
}

type UserStatusFilter = 'all' | 'active' | 'deactivated'
type UserAdminAction = 'reset_password' | 'deactivate' | 'activate' | 'delete'

interface UserProfileDraft {
  displayName: string
  bio: string
  emailNotifications: boolean
  weekly: boolean
  monthly: boolean
}

const createEmptyUserProfileDraft = (): UserProfileDraft => ({
  displayName: '',
  bio: '',
  emailNotifications: true,
  weekly: false,
  monthly: false,
})

const POSTS_PER_PAGE = 5

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
  const [postSearchTerm, setPostSearchTerm] = useState('')
  const [postPage, setPostPage] = useState(1)
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [postActionId, setPostActionId] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [managedUsers, setManagedUsers] = useState<AdminManagedUser[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [userLoadError, setUserLoadError] = useState<string | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const userQueryRef = useRef('')
  const [userStatusFilter, setUserStatusFilter] = useState<UserStatusFilter>('all')
  const [selectedUser, setSelectedUser] = useState<AdminManagedUser | null>(null)
  const [userProfileDraft, setUserProfileDraft] = useState<UserProfileDraft>(createEmptyUserProfileDraft())
  const [isUpdatingUser, setIsUpdatingUser] = useState(false)
  const [userActionInFlight, setUserActionInFlight] = useState<UserAdminAction | null>(null)
  const [userPagination, setUserPagination] = useState<{ page: number; perPage: number; count: number; hasMore: boolean } | null>(null)
  
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
  const [customPrompt, setCustomPrompt] = useState('')
  
  // Blog creation mode toggle
  const [blogMode, setBlogMode] = useState<'ai' | 'manual'>('ai')
  
  // Manual blog writing state
  const [manualBlogTitle, setManualBlogTitle] = useState('')
  const [manualBlogContent, setManualBlogContent] = useState('')
  const [manualBlogExcerpt, setManualBlogExcerpt] = useState('')
  const [manualBlogCategory, setManualBlogCategory] = useState('technology')
  const [manualBlogTags, setManualBlogTags] = useState('')
  const [manualBlogFeaturedImage, setManualBlogFeaturedImage] = useState('')
  const [manualBlogSeoTitle, setManualBlogSeoTitle] = useState('')
  const [manualBlogSeoDescription, setManualBlogSeoDescription] = useState('')
  const [isPublishingManual, setIsPublishingManual] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Simple search state for existing topics
  const [searchTerm, setSearchTerm] = useState('')
  
  // Custom topic search states
  const [customSearchQuery, setCustomSearchQuery] = useState('')
  const [isSearchingCustom, setIsSearchingCustom] = useState(false)
  
  // Filtered topics (simple search only)
  const filteredTopics = trendingTopics.filter(topic => {
    return topic.topic.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const hasPromptForGeneration = customPrompt.trim().length > 0

  const sortedPosts = useMemo(() => {
    return [...managedPosts].sort((a, b) => {
      const aDate = Date.parse(a.published_at || a.updated_at || a.created_at || '') || 0
      const bDate = Date.parse(b.published_at || b.updated_at || b.created_at || '') || 0
      return bDate - aDate
    })
  }, [managedPosts])

  const filteredPosts = useMemo(() => {
    const query = postSearchTerm.trim().toLowerCase()
    if (!query) {
      return sortedPosts
    }

    return sortedPosts.filter((post) => {
      const title = post.title?.toLowerCase() ?? ''
      const slug = post.slug.toLowerCase()
      const categoryMatch = post.category.toLowerCase()
      return (
        title.includes(query) ||
        slug.includes(query) ||
        categoryMatch.includes(query)
      )
    })
  }, [sortedPosts, postSearchTerm])

  const totalPosts = filteredPosts.length
  const totalPages = Math.max(1, Math.ceil(totalPosts / POSTS_PER_PAGE))
  const currentPage = Math.min(postPage, totalPages)
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE)
  const showingFrom = totalPosts === 0 ? 0 : startIndex + 1
  const showingTo = totalPosts === 0 ? 0 : Math.min(startIndex + paginatedPosts.length, totalPosts)

  useEffect(() => {
    if (postPage > totalPages) {
      setPostPage(totalPages)
    }
  }, [postPage, totalPages])

  const userStatusFilters: Array<{ label: string; value: UserStatusFilter }> = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Deactivated', value: 'deactivated' },
  ]

  // Show notification function
  const showNotification = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setNotification({ type, message, show: true })
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 5000)
  }, [])

  const notifySubscribers = useCallback(async (postId: string) => {
    try {
      const response = await fetch('/api/admin/notify-subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ postId })
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.error || 'Failed to notify subscribers')
      }

      const result = await response.json()
      const total = typeof result?.totalSubscribers === 'number' ? result.totalSubscribers : null
      showNotification('success', total && total > 0
        ? `Sent new post notification to ${total} subscriber${total === 1 ? '' : 's'}.`
        : 'No subscribers opted in for notifications, nothing sent.'
      )
    } catch (error) {
      console.error('Subscriber notification error:', error)
      showNotification('warning', error instanceof Error ? error.message : 'Failed to notify subscribers')
    }
  }, [showNotification])

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const isUserCurrentlyDeactivated = (user: AdminManagedUser | null) => {
    if (!user?.bannedUntil) return false
    const timestamp = Date.parse(user.bannedUntil)
    if (Number.isNaN(timestamp)) {
      return true
    }
    return timestamp > Date.now()
  }

  const formatUserDateTime = (value: string | null) => {
    if (!value) return 'Never'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return 'Never'
    }
    return parsed.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  }

  const fetchAdminUsers = useCallback(async (options?: { query?: string; status?: UserStatusFilter }) => {
    setIsLoadingUsers(true)
    setUserLoadError(null)

    try {
      let effectiveStatus = userStatusFilter
      if (options?.status) {
        effectiveStatus = options.status
      }

      if (options?.query !== undefined) {
        userQueryRef.current = options.query.trim()
      }

      const effectiveQuery = userQueryRef.current
      const params = new URLSearchParams()

      if (effectiveQuery) {
        params.set('query', effectiveQuery)
      }
      if (effectiveStatus !== 'all') {
        params.set('status', effectiveStatus)
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`)
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.error || `Failed with status ${response.status}`)
      }

      const data = await response.json()
      const users: AdminManagedUser[] = Array.isArray(data.users) ? data.users : []

      setManagedUsers(users)
      setUserPagination(data.pagination ?? null)

      setSelectedUser((current) => {
        if (!current) return current
        return users.find((user) => user.id === current.id) ?? null
      })
    } catch (error) {
      console.error('Error loading users:', error)
      const message = error instanceof Error ? error.message : 'Unable to load users'
      setUserLoadError(message)
      showNotification('error', message)
    } finally {
      setIsLoadingUsers(false)
    }
  }, [userStatusFilter, showNotification])

  useEffect(() => {
    if (isHydrated) {
      void fetchAdminUsers()
    }
  }, [isHydrated, fetchAdminUsers])

  useEffect(() => {
    if (!selectedUser) {
      setUserProfileDraft(createEmptyUserProfileDraft())
      return
    }

    const preferences = normalizeEmailPreferences(selectedUser.profile?.preferences ?? null)
    setUserProfileDraft({
      displayName: selectedUser.profile?.display_name ?? '',
      bio: selectedUser.profile?.bio ?? '',
      emailNotifications: preferences.newPosts !== false,
      weekly: Boolean(preferences.weekly),
      monthly: Boolean(preferences.monthly),
    })
  }, [selectedUser])

  const handleUserSearch = async () => {
    await fetchAdminUsers({ query: userSearch })
  }

  const handleClearUserSearch = async () => {
    setUserSearch('')
    await fetchAdminUsers({ query: '' })
  }

  const handleRefreshUsers = async () => {
    await fetchAdminUsers()
  }

  const handleSaveUserProfile = useCallback(async () => {
    if (!selectedUser) {
      return
    }

    setIsUpdatingUser(true)

    try {
      const preferencesPayload: EmailPreferences = {
        newPosts: userProfileDraft.emailNotifications,
        weekly: userProfileDraft.weekly,
        monthly: userProfileDraft.monthly,
      }

      const response = await fetch('/api/admin/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          displayName: userProfileDraft.displayName.trim() || null,
          bio: userProfileDraft.bio.trim() || null,
          preferences: preferencesPayload,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.error || 'Failed to update profile')
      }

      const data = await response.json()
      const updatedProfile = data?.profile
      const normalizedPreferences = normalizeEmailPreferences(updatedProfile?.preferences ?? null)

      setManagedUsers((users) =>
        users.map((user) =>
          user.id === selectedUser.id
            ? {
                ...user,
                profile: {
                  display_name: updatedProfile?.display_name ?? null,
                  avatar_url: updatedProfile?.avatar_url ?? null,
                  bio: updatedProfile?.bio ?? null,
                  preferences: normalizedPreferences,
                  updated_at: updatedProfile?.updated_at ?? null,
                },
              }
            : user
        )
      )

      setSelectedUser((current) =>
        current && current.id === selectedUser.id
          ? {
              ...current,
              profile: {
                display_name: updatedProfile?.display_name ?? null,
                avatar_url: updatedProfile?.avatar_url ?? null,
                bio: updatedProfile?.bio ?? null,
                preferences: normalizedPreferences,
                updated_at: updatedProfile?.updated_at ?? null,
              },
            }
          : current
      )

      setUserProfileDraft({
        displayName: updatedProfile?.display_name ?? '',
        bio: updatedProfile?.bio ?? '',
        emailNotifications: normalizedPreferences.newPosts !== false,
        weekly: Boolean(normalizedPreferences.weekly),
        monthly: Boolean(normalizedPreferences.monthly),
      })

      showNotification('success', 'Profile updated successfully.')
    } catch (error) {
      console.error('Failed to update user profile:', error)
      const message = error instanceof Error ? error.message : 'Unable to update profile'
      showNotification('error', message)
    } finally {
      setIsUpdatingUser(false)
    }
  }, [selectedUser, userProfileDraft, showNotification])

  const triggerUserAction = useCallback(async (action: UserAdminAction) => {
    if (!selectedUser) {
      return
    }

    if (action === 'delete') {
      const confirmed = window.confirm(`Delete user ${selectedUser.email || selectedUser.id}? This cannot be undone.`)
      if (!confirmed) {
        return
      }
    }

    setUserActionInFlight(action)

    try {
      const response = await fetch('/api/admin/users/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userId: selectedUser.id,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.error || 'Failed to process action')
      }

      const data = await response.json()
      showNotification('success', data?.message || 'Action completed successfully.')

      if (action === 'delete') {
        setSelectedUser(null)
      }

      await fetchAdminUsers()
    } catch (error) {
      console.error('Failed to process user action:', error)
      const message = error instanceof Error ? error.message : 'Unable to process action'
      showNotification('error', message)
    } finally {
      setUserActionInFlight(null)
    }
  }, [selectedUser, fetchAdminUsers, showNotification])

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
      
      if (data.success && data.topics && data.topics.length > 0) {
        // Add custom searched topics to the existing list with proper scoring
        const newTopics = data.topics.map((topic: TrendingTopic) => ({
          ...topic,
          blogScore: scoreTopicForBlog(topic),
          searchQuery: customSearchQuery
        }))
        
        setTrendingTopics(prev => [...newTopics, ...prev])
        setCustomSearchQuery('')
        
        if (data.source === 'live') {
          showNotification('success', `✅ Found ${newTopics.length} live trending topics for "${customSearchQuery}"!`)
        } else {
          showNotification('info', `💡 Generated ${newTopics.length} topic ideas for "${customSearchQuery}" (no live results available)`)
        }
      } else {
        showNotification('warning', `No results found for "${customSearchQuery}". Try different keywords or check your spelling.`)
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

      const responseBody = await response.json().catch(() => null)

      if (!response.ok) {
        const errorBody = responseBody
        throw new Error(errorBody?.error || 'Failed to update post status')
      }

      const updatedPost = responseBody?.post ? mapPostRecord(responseBody.post) : null

      showNotification('success', !post.is_published ? 'Post published.' : 'Post moved to drafts.')
      if (!post.is_published && updatedPost?.id) {
        void notifySubscribers(updatedPost.id)
      }
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

  // Auto-detect category from topic - ENHANCED with priority checking
  const detectCategoryFromTopic = (topicText: string): string => {
    const text = topicText.toLowerCase()
    
    // Priority keywords for news/politics - check these FIRST
    const priorityNewsKeywords = [
      'judge', 'court', 'federal', 'government', 'law', 'legal', 'congress', 'senate',
      'president', 'minister', 'election', 'vote', 'policy', 'legislation',
      'military', 'army', 'navy', 'national guard', 'deployment', 'war', 'conflict',
      'climate crisis', 'pandemic', 'covid', 'vaccine', 'emergency', 'disaster'
    ]
    
    // If it's clearly news/politics, return immediately unless it's tech-related news
    const hasNewsKeywords = priorityNewsKeywords.some(keyword => text.includes(keyword))
    if (hasNewsKeywords) {
      const techNewsKeywords = ['tech policy', 'ai regulation', 'crypto law', 'data privacy law']
      const isTechNews = techNewsKeywords.some(keyword => text.includes(keyword))
      if (!isTechNews) {
        return 'world-news'
      }
    }
    
    // Weighted scoring for better accuracy
    let techScore = 0
    let entertainmentScore = 0
    let sportsScore = 0
    let businessScore = 0
    let lifestyleScore = 0
    
    // Technology keywords - more specific
    const techKeywords = [
      'ai', 'artificial intelligence', 'machine learning', 'chatgpt', 'openai',
      'software', 'app', 'application', 'programming', 'coding', 'developer',
      'iphone', 'android', 'smartphone', 'samsung', 'pixel',
      'laptop', 'computer', 'pc', 'mac', 'windows', 'linux',
      'bitcoin', 'crypto', 'cryptocurrency', 'blockchain', 'ethereum', 'nft',
      'gaming', 'gamer', 'playstation', 'xbox', 'nintendo', 'steam',
      'tesla', 'spacex', 'starlink', 'rocket', 'space tech',
      'google', 'microsoft', 'apple', 'amazon', 'meta', 'facebook',
      'vr', 'virtual reality', 'ar', 'metaverse',
      'drone', 'robot', 'automation', 'self-driving',
      '5g', 'wifi', 'cybersecurity', 'hacking', 'data breach'
    ]
    
    // Entertainment keywords - specific
    const entertainmentKeywords = [
      'movie', 'film', 'cinema', 'box office', 'hollywood', 'bollywood',
      'actor', 'actress', 'director', 'celebrity', 'star',
      'music', 'song', 'album', 'concert', 'singer', 'artist', 'band',
      'grammy', 'oscar', 'emmy', 'award show',
      'tv show', 'series', 'season', 'episode', 'streaming',
      'netflix', 'disney', 'hbo', 'prime video',
      'marvel', 'dc comics', 'superhero', 'anime',
      'viral video', 'meme', 'influencer', 'youtuber',
      'fashion', 'runway', 'designer', 'model', 'vogue',
      'beauty', 'makeup', 'cosmetics'
    ]
    
    // Sports keywords - very specific
    const sportsKeywords = [
      'football', 'soccer', 'nfl', 'fifa', 'world cup', 'premier league',
      'basketball', 'nba', 'lebron', 'lakers',
      'baseball', 'mlb', 'yankees', 'home run',
      'cricket', 'ipl', 'test match', 'wicket',
      'tennis', 'wimbledon', 'us open',
      'golf', 'pga', 'masters',
      'olympics', 'medal', 'athlete', 'championship',
      'hockey', 'nhl', 'boxing', 'mma', 'ufc',
      'formula 1', 'f1', 'racing', 'grand prix',
      'super bowl', 'playoffs', 'finals', 'tournament'
    ]
    
    // Business keywords - specific
    const businessKeywords = [
      'stock market', 'wall street', 'nasdaq', 'dow jones', 'trading',
      'investment', 'investor', 'venture capital', 'funding round',
      'startup', 'unicorn', 'ipo', 'merger', 'acquisition',
      'ceo', 'founder', 'entrepreneur', 'business model',
      'revenue', 'profit', 'earnings', 'quarterly report',
      'economy', 'inflation', 'recession', 'gdp',
      'finance', 'banking', 'loan', 'interest rate',
      'ecommerce', 'retail', 'sales', 'marketing campaign'
    ]
    
    // Lifestyle keywords - specific
    const lifestyleKeywords = [
      'health tips', 'wellness', 'self-care',
      'fitness', 'workout', 'exercise', 'gym', 'yoga',
      'diet', 'nutrition', 'weight loss', 'keto', 'vegan',
      'recipe', 'cooking', 'chef', 'restaurant',
      'travel', 'vacation', 'destination', 'hotel',
      'home decor', 'interior design', 'diy',
      'parenting', 'baby', 'pregnancy',
      'relationship', 'dating', 'wedding',
      'meditation', 'mindfulness', 'mental health'
    ]
    
    // Weight matches - longer phrases get higher weight
    techKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        const weight = keyword.split(' ').length
        techScore += weight
      }
    })
    
    entertainmentKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        const weight = keyword.split(' ').length
        entertainmentScore += weight
      }
    })
    
    sportsKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        const weight = keyword.split(' ').length
        sportsScore += weight
      }
    })
    
    businessKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        const weight = keyword.split(' ').length
        businessScore += weight
      }
    })
    
    lifestyleKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        const weight = keyword.split(' ').length
        lifestyleScore += weight
      }
    })
    
    // Find category with highest score
    const maxScore = Math.max(techScore, entertainmentScore, sportsScore, businessScore, lifestyleScore)
    
    // If no strong match (score < 2), default to world-news
    if (maxScore < 2) return 'world-news'
    
    // Return category with highest score
    if (techScore === maxScore) return 'technology'
    if (entertainmentScore === maxScore) return 'entertainment'
    if (sportsScore === maxScore) return 'sports'
    if (businessScore === maxScore) return 'business'
    if (lifestyleScore === maxScore) return 'lifestyle'
    
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

  const clearSelectedTopic = () => {
    setSelectedTopic(null)
    setGeneratedBlog(null)
    setSavedPost(null)
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
    const topicSelection = selectedTopic
    const trimmedPrompt = customPrompt.trim()
    const hasCustomPrompt = trimmedPrompt.length > 0

    if (!topicSelection && !hasCustomPrompt) {
      showNotification('warning', 'Select a topic or provide a custom prompt before starting AI generation.')
      return
    }

  const topicLabel = topicSelection ? topicSelection.topic : trimmedPrompt

    if (!topicLabel) {
      showNotification('error', 'Unable to determine a topic for generation.')
      return
    }

    setIsGenerating(true)
    setSavedPost(null)

    const detectedCategory = topicSelection
      ? (topicSelection.category
          ? topicSelection.category.toLowerCase().replace(/\s+/g, '-')
          : detectCategoryFromTopic(topicSelection.topic))
      : detectCategoryFromTopic(topicLabel)

    const categoryForGeneration = (category || detectedCategory || 'world-news')

    try {
      const response = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topicSelection ? topicSelection.topic : '',
          category: categoryForGeneration,
          tone,
          length,
          includeImages,
          seoOptimized,
          customPrompt: hasCustomPrompt ? trimmedPrompt : undefined,
          markTopicUsed: Boolean(topicSelection)
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setGeneratedBlog(data.generatedContent)
        if (data.blogPost) {
          setSavedPost(mapPostRecord(data.blogPost))
        }
        
        if (topicSelection) {
          setTrendingTopics(prev => 
            prev.map(t => 
              t.topic === topicSelection.topic ? { ...t, used: true } : t
            )
          )
        }
        
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
      if (data.post?.id) {
        void notifySubscribers(data.post.id)
      }
    } catch (error) {
      console.error('Error publishing post:', error)
      showNotification('error', `Failed to publish post: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsPublishing(false)
    }
  }

  const publishManualBlog = async (publishNow: boolean = false) => {
    // Validation
    if (!manualBlogTitle.trim()) {
      showNotification('warning', 'Please enter a blog title')
      return
    }
    if (!manualBlogContent.trim()) {
      showNotification('warning', 'Please enter blog content')
      return
    }
    if (!manualBlogExcerpt.trim()) {
      showNotification('warning', 'Please enter a blog excerpt')
      return
    }

    setIsPublishingManual(true)

    try {
      const slug = slugifyTitle(manualBlogTitle)
      const tags = manualBlogTags.split(',').map(tag => tag.trim()).filter(Boolean)
      
      // Estimate read time (average reading speed: 200 words per minute)
      const wordCount = manualBlogContent.trim().split(/\s+/).length
      const readTime = Math.max(1, Math.ceil(wordCount / 200))

      const payload = {
        title: manualBlogTitle.trim(),
        slug,
        content: manualBlogContent.trim(),
        excerpt: manualBlogExcerpt.trim(),
        category: manualBlogCategory,
        tags,
        is_published: publishNow,
        published_at: publishNow ? new Date().toISOString() : null,
        featured_image: manualBlogFeaturedImage.trim() || null,
        seo_title: manualBlogSeoTitle.trim() || manualBlogTitle.trim(),
        seo_description: manualBlogSeoDescription.trim() || manualBlogExcerpt.trim(),
        read_time: readTime,
        is_featured: false
      }

      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        showNotification('success', publishNow ? 'Blog published successfully!' : 'Blog saved as draft!')
        
        // Clear form
        setManualBlogTitle('')
        setManualBlogContent('')
        setManualBlogExcerpt('')
        setManualBlogTags('')
        setManualBlogFeaturedImage('')
        setManualBlogSeoTitle('')
        setManualBlogSeoDescription('')
        
        // Refresh posts list
        void fetchManagedPosts()
        
        // Send notifications if published
        if (publishNow && data.post?.id) {
          void notifySubscribers(data.post.id)
        }
      } else {
        showNotification('error', data.error || 'Failed to save blog')
      }
    } catch (error) {
      console.error('Error publishing manual blog:', error)
      showNotification('error', 'Error saving blog. Please try again.')
    } finally {
      setIsPublishingManual(false)
    }
  }

  // Handle image upload
  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      showNotification('error', 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      showNotification('error', 'File too large. Maximum size is 5MB.')
      return
    }

    setIsUploadingImage(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      setManualBlogFeaturedImage(data.url)
      showNotification('success', 'Image uploaded successfully!')

    } catch (error: any) {
      console.error('Image upload error:', error)
      showNotification('error', error.message || 'Failed to upload image')
    } finally {
      setIsUploadingImage(false)
      setUploadProgress(0)
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
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Zenx Blog Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Generate AI-powered blog content from trending topics
          </p>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-gray-500">
              Logged in as <span className="font-semibold text-gray-800">{adminEmail}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => void fetchManagedPosts()}
                disabled={isLoadingPosts}
                className="flex-1 sm:flex-none px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isLoadingPosts ? 'Refreshing posts…' : 'Refresh Posts'}
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 sm:flex-none px-4 py-2 text-sm bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
          <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Manage Existing Posts</h2>
              <p className="text-sm text-gray-600 mt-1">
                Publish, unpublish, or remove posts that have already been generated.
              </p>
            </div>
            <div className="flex flex-col w-full gap-3 sm:flex-row sm:items-center lg:w-auto">
              <div className="relative w-full sm:w-64">
                <input
                  type="search"
                  value={postSearchTerm}
                  onChange={(event) => {
                    setPostSearchTerm(event.target.value)
                    setPostPage(1)
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-12 text-sm text-gray-700 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Search title, slug, or category"
                  aria-label="Search posts"
                />
                <svg
                  className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M5 11a6 6 0 1112 0 6 6 0 01-12 0z"
                  />
                </svg>
                {postSearchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setPostSearchTerm('')
                      setPostPage(1)
                    }}
                    className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'All', value: 'all' as const },
                  { label: 'Published', value: 'published' as const },
                  { label: 'Drafts', value: 'draft' as const }
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setPostFilter(filter.value)
                      setPostPage(1)
                    }}
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

          {!isLoadingPosts && filteredPosts.length === 0 && !postError ? (
            <div className="text-center py-12 text-gray-500">
              <p className="font-medium">
                {postSearchTerm ? 'No posts match your search.' : 'No posts found for this filter.'}
              </p>
              <p className="text-sm mt-1">Generate or import posts to see them listed here.</p>
            </div>
          ) : null}

          <div className="space-y-4">
            {paginatedPosts.map((post) => {
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
                        onClick={() => window.open(`/blog/${post.slug}`, '_blank', 'noopener,noreferrer')}
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

          {filteredPosts.length > 0 && (
            <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Showing {showingFrom}-{showingTo} of {totalPosts} {totalPosts === 1 ? 'post' : 'posts'}.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPostPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 ${
                    currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPostPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPosts === 0}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 ${
                    currentPage === totalPages || totalPosts === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              <p className="text-sm text-gray-600 mt-1">
                Review, filter, and manage registered readers. Click a user to edit their profile or send account actions.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {userStatusFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setUserStatusFilter(filter.value)}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${
                      userStatusFilter === filter.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => void handleRefreshUsers()}
                disabled={isLoadingUsers}
                className="w-full sm:w-auto px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isLoadingUsers ? 'Refreshing…' : 'Refresh Users'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex-1">
                  <label htmlFor="user-search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search users
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="user-search"
                      type="text"
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void handleUserSearch()
                        }
                      }}
                      placeholder="Search by email or name…"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => void handleUserSearch()}
                        className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                      >
                        Search
                      </button>
                      <button
                        onClick={() => void handleClearUserSearch()}
                        className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 whitespace-nowrap"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 text-center sm:text-left">
                  Showing {managedUsers.length} result{managedUsers.length === 1 ? '' : 's'}
                  {userPagination?.hasMore ? ' (more available)' : ''}
                </div>
              </div>

              {userLoadError ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {userLoadError}
                </div>
              ) : null}

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoadingUsers && managedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                            Loading users…
                          </td>
                        </tr>
                      ) : null}

                      {!isLoadingUsers && managedUsers.length === 0 && !userLoadError ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                            No users found for this filter.
                          </td>
                        </tr>
                      ) : null}

                      {managedUsers.map((user) => {
                        const userStatus = isUserCurrentlyDeactivated(user) ? 'Deactivated' : 'Active'
                        return (
                          <tr key={user.id} className={selectedUser?.id === user.id ? 'bg-blue-50' : undefined}>
                            <td className="px-4 py-3 text-sm">
                              <div className="font-medium text-gray-900">{user.email || 'Unknown email'}</div>
                              <div className="text-xs text-gray-500">
                                Joined {formatUserDateTime(user.createdAt)}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  userStatus === 'Active'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {userStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatUserDateTime(user.lastSignInAt)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              <button
                                onClick={() => setSelectedUser(user)}
                                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
              {selectedUser ? (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">User Detail</h3>
                    <p className="text-sm text-gray-600">
                      Manage account status and profile information for <span className="font-medium">{selectedUser.email || selectedUser.id}</span>.
                    </p>
                  </div>
                  <dl className="space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <dt>Status</dt>
                      <dd className={`font-medium ${isUserCurrentlyDeactivated(selectedUser) ? 'text-yellow-700' : 'text-green-700'}`}>
                        {isUserCurrentlyDeactivated(selectedUser) ? 'Deactivated' : 'Active'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Created</dt>
                      <dd>{formatUserDateTime(selectedUser.createdAt)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Last Login</dt>
                      <dd>{formatUserDateTime(selectedUser.lastSignInAt)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>MFA Factors</dt>
                      <dd>{selectedUser.factors}</dd>
                    </div>
                  </dl>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Profile</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="profile-display-name">
                          Display Name
                        </label>
                        <input
                          id="profile-display-name"
                          type="text"
                          value={userProfileDraft.displayName}
                          onChange={(event) =>
                            setUserProfileDraft((draft) => ({ ...draft, displayName: event.target.value }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter display name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="profile-bio">
                          Bio
                        </label>
                        <textarea
                          id="profile-bio"
                          value={userProfileDraft.bio}
                          onChange={(event) =>
                            setUserProfileDraft((draft) => ({ ...draft, bio: event.target.value }))
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Short description"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-600">Email Preferences</p>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={userProfileDraft.emailNotifications}
                            onChange={(event) =>
                              setUserProfileDraft((draft) => ({ ...draft, emailNotifications: event.target.checked }))
                            }
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          Receive new post alerts
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={userProfileDraft.weekly}
                            onChange={(event) =>
                              setUserProfileDraft((draft) => ({ ...draft, weekly: event.target.checked }))
                            }
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          Weekly digest
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={userProfileDraft.monthly}
                            onChange={(event) =>
                              setUserProfileDraft((draft) => ({ ...draft, monthly: event.target.checked }))
                            }
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          Monthly highlights
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => void handleSaveUserProfile()}
                          disabled={isUpdatingUser}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdatingUser ? 'Saving…' : 'Save Profile'}
                        </button>
                        <button
                          onClick={() => setSelectedUser(null)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900">Account Actions</h4>
                    <button
                      onClick={() => void triggerUserAction('reset_password')}
                      disabled={userActionInFlight === 'reset_password'}
                      className="w-full px-4 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {userActionInFlight === 'reset_password' ? 'Sending reset…' : 'Send password reset email'}
                    </button>
                    <button
                      onClick={() => void triggerUserAction(isUserCurrentlyDeactivated(selectedUser) ? 'activate' : 'deactivate')}
                      disabled={userActionInFlight === 'activate' || userActionInFlight === 'deactivate'}
                      className={`w-full px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isUserCurrentlyDeactivated(selectedUser)
                          ? 'bg-green-600 text-white'
                          : 'bg-yellow-500 text-white'
                      }`}
                    >
                      {userActionInFlight === 'activate' || userActionInFlight === 'deactivate'
                        ? 'Updating status…'
                        : isUserCurrentlyDeactivated(selectedUser)
                          ? 'Reactivate user'
                          : 'Deactivate user'}
                    </button>
                    <button
                      onClick={() => void triggerUserAction('delete')}
                      disabled={userActionInFlight === 'delete'}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {userActionInFlight === 'delete' ? 'Deleting…' : 'Delete user'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 text-sm py-12">
                  Select a user to view details and perform actions.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Blog Creation Mode Toggle */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow-md p-6 mb-8 border-2 border-purple-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">✍️ Blog Creation Mode</h2>
              <p className="text-sm text-gray-600">Choose how you want to create your blog post</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setBlogMode('ai')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  blogMode === 'ai'
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                </svg>
                AI Generated
              </button>
              <button
                onClick={() => setBlogMode('manual')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  blogMode === 'manual'
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Write Manually
              </button>
            </div>
          </div>
        </div>

        {/* AI Generation Section */}
        {blogMode === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Trending Topics Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Trending Topics ({filteredTopics.length})
              </h2>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button
                  onClick={fetchTrendingTopics}
                  disabled={loading}
                  className="flex-1 sm:flex-none bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {loading ? 'Refreshing...' : 'Refresh Topics'}
                </button>
                <button
                  onClick={() => setTrendingTopics([])}
                  className="flex-1 sm:flex-none bg-gray-500 text-white px-4 py-2 sm:py-3 rounded-lg hover:bg-gray-600 font-medium shadow-sm transition-colors duration-200 text-sm sm:text-base whitespace-nowrap"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Custom Topic Search */}
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
              <h3 className="font-medium text-gray-900 mb-3">🚀 Search Live Trending Topics</h3>
              <p className="text-sm text-gray-600 mb-3">
                Search Reddit, Google News, and other sources for <strong>real trending topics</strong> based on your keywords. Get actual news articles, discussions, and viral content!
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={customSearchQuery}
                  onChange={(e) => setCustomSearchQuery(e.target.value)}
                  placeholder="e.g., gaming updates, tech news, crypto trends..."
                  className="flex-1 p-3 border border-purple-300 rounded-lg bg-white text-gray-900 font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  onKeyPress={(e) => e.key === 'Enter' && searchCustomTopics()}
                />
                <button
                  onClick={searchCustomTopics}
                  disabled={isSearchingCustom || !customSearchQuery.trim()}
                  className="w-full sm:w-auto bg-purple-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-colors duration-200 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {isSearchingCustom && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {isSearchingCustom ? 'Searching...' : '🔍 Search Live'}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs text-gray-600">Popular searches:</span>
                {['gaming updates', 'AI news', 'crypto trends', 'tech releases', 'business tips', 'celebrity news'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setCustomSearchQuery(suggestion)}
                    className="text-xs bg-white text-purple-600 border border-purple-300 px-2 py-1 rounded hover:bg-purple-50 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <div className="mt-3 p-3 bg-white rounded border border-purple-200">
                <p className="text-xs text-gray-700">
                  <strong>💡 Pro Tip:</strong> Use specific keywords like &quot;Jubeen Garg&quot;, &quot;iPhone 16 review&quot;, or &quot;PS5 games 2025&quot; 
                  to find the most relevant trending content. The search scans Reddit posts, Google News articles, and trending searches to find real, current topics!
                </p>
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

            <div className="mb-6 rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">🧠 Custom AI Prompt (Optional)</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Provide specific instructions for the AI. Leave this blank to rely solely on a selected trending topic.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearSelectedTopic}
                  disabled={!selectedTopic}
                  className={`text-sm font-medium transition ${selectedTopic ? 'text-blue-600 hover:text-blue-700' : 'text-gray-400 cursor-not-allowed'}`}
                >
                  {selectedTopic ? 'Clear selected topic' : 'No topic selected'}
                </button>
              </div>
              <textarea
                value={customPrompt}
                onChange={(event) => setCustomPrompt(event.target.value)}
                rows={4}
                placeholder="Example: Write a conversational explainer about how AI-powered news curation is changing journalism, include expert quotes, a comparison table, and a step-by-step reader action plan."
                className="mt-3 w-full rounded-lg border border-blue-200 bg-blue-50/40 p-3 text-sm text-gray-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <div className="mt-3 flex flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {selectedTopic
                    ? 'The AI will blend this brief with the highlighted trending topic.'
                    : 'The AI will rely entirely on this prompt plus the settings below.'}
                </span>
                <div className="flex items-center gap-3">
                  <span>{customPrompt.trim().length} characters</span>
                  <button
                    type="button"
                    onClick={() => setCustomPrompt('')}
                    disabled={!customPrompt}
                    className={`font-medium transition ${customPrompt ? 'text-blue-600 hover:text-blue-700' : 'text-gray-400 cursor-not-allowed'}`}
                  >
                    Clear prompt
                  </button>
                </div>
              </div>
            </div>

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
                      <span className="text-blue-600 text-xs ml-1">(Auto-detected - You can override)</span>
                    )}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 border border-gray-300 bg-white text-gray-900 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 transition-colors"
                  >
                    <option value="technology" className="text-gray-900 font-medium">💻 Technology</option>
                    <option value="entertainment" className="text-gray-900 font-medium">🎬 Entertainment</option>
                    <option value="business" className="text-gray-900 font-medium">💼 Business</option>
                    <option value="lifestyle" className="text-gray-900 font-medium">🌟 Lifestyle</option>
                    <option value="sports" className="text-gray-900 font-medium">⚽ Sports</option>
                    <option value="world-news" className="text-gray-900 font-medium">📰 World News</option>
                    <option value="science" className="text-gray-900 font-medium">🔬 Science</option>
                    <option value="health" className="text-gray-900 font-medium">🏥 Health</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
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
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                  <div className="text-sm text-gray-500 text-center sm:text-left">
                    {selectedTopic
                      ? 'Pick the mode and length you want, then launch AI generation.'
                      : hasPromptForGeneration
                        ? 'Using your custom prompt. Choose settings and generate when ready.'
                        : 'Select a topic or add a custom prompt to enable AI generation.'}
                  </div>
                  <button
                    onClick={generateBlog}
                    disabled={(!selectedTopic && !hasPromptForGeneration) || isGenerating}
                    className={`w-full sm:w-auto bg-green-600 text-white px-5 py-3 rounded-lg font-medium shadow-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                      (!selectedTopic && !hasPromptForGeneration) || isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
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
        )}

        {/* Manual Blog Editor Section */}
        {blogMode === 'manual' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900">Manual Blog Editor</h2>
          </div>

          <div className="space-y-6">
            {/* Blog Title */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Blog Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={manualBlogTitle}
                onChange={(e) => setManualBlogTitle(e.target.value)}
                placeholder="Enter an engaging title for your blog post..."
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Blog Excerpt */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Excerpt / Summary <span className="text-red-500">*</span>
              </label>
              <textarea
                value={manualBlogExcerpt}
                onChange={(e) => setManualBlogExcerpt(e.target.value)}
                placeholder="Write a brief summary (2-3 sentences) that will appear in blog listings..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Blog Content */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Blog Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={manualBlogContent}
                onChange={(e) => setManualBlogContent(e.target.value)}
                placeholder="Write your blog content here... You can use markdown formatting."
                rows={20}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-2 text-sm text-gray-600">
                Word count: {manualBlogContent.trim().split(/\s+/).filter(w => w).length} words
              </p>
            </div>

            {/* Category and Tags */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Category
                </label>
                <select
                  value={manualBlogCategory}
                  onChange={(e) => setManualBlogCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Technology">Technology</option>
                  <option value="Business">Business</option>
                  <option value="Lifestyle">Lifestyle</option>
                  <option value="Health">Health</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Science">Science</option>
                  <option value="Sports">Sports</option>
                  <option value="Politics">Politics</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={manualBlogTags}
                  onChange={(e) => setManualBlogTags(e.target.value)}
                  placeholder="e.g., AI, Technology, Innovation"
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Featured Image */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Featured Image
              </label>
              
              <div className="space-y-3">
                {/* Upload Button */}
                <div className="flex gap-3">
                  <label className="flex-1 cursor-pointer">
                    <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isUploadingImage 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}>
                      {isUploadingImage ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </div>
                          <div className="text-sm text-gray-600">
                            Uploading... {uploadProgress}%
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, WebP, GIF up to 5MB</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                    />
                  </label>
                </div>

                {/* OR Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="text-sm text-gray-500 font-medium">OR</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>

                {/* URL Input */}
                <div>
                  <input
                    type="url"
                    value={manualBlogFeaturedImage}
                    onChange={(e) => setManualBlogFeaturedImage(e.target.value)}
                    placeholder="Paste image URL: https://example.com/image.jpg"
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Image Preview */}
                {manualBlogFeaturedImage && (
                  <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700">Preview:</p>
                      <button
                        onClick={() => setManualBlogFeaturedImage('')}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    <img 
                      src={manualBlogFeaturedImage} 
                      alt="Preview" 
                      className="w-full max-w-md rounded-lg border border-gray-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SEO Settings */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 SEO Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    SEO Title (Optional - defaults to blog title)
                  </label>
                  <input
                    type="text"
                    value={manualBlogSeoTitle}
                    onChange={(e) => setManualBlogSeoTitle(e.target.value)}
                    placeholder="SEO-optimized title for search engines..."
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    SEO Description (Optional - defaults to excerpt)
                  </label>
                  <textarea
                    value={manualBlogSeoDescription}
                    onChange={(e) => setManualBlogSeoDescription(e.target.value)}
                    placeholder="Meta description for search engines (150-160 characters)..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-600">
                    {manualBlogSeoDescription.length} characters
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
              <button
                onClick={() => publishManualBlog(false)}
                disabled={isPublishingManual || !manualBlogTitle.trim() || !manualBlogContent.trim() || !manualBlogExcerpt.trim()}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isPublishingManual ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <span>💾</span> Save as Draft
                  </>
                )}
              </button>
              <button
                onClick={() => publishManualBlog(true)}
                disabled={isPublishingManual || !manualBlogTitle.trim() || !manualBlogContent.trim() || !manualBlogExcerpt.trim()}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isPublishingManual ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Publishing...
                  </>
                ) : (
                  <>
                    <span>🚀</span> Publish Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}