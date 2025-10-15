'use client'

import { useAuth } from '@/lib/auth-context'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useReadingHistory } from '@/hooks/useReadingHistory'
import { useSavedPosts } from '@/hooks/useSavedPosts'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useUserProfile()
  const { history, loading: historyLoading } = useReadingHistory()
  const { savedPosts, loading: savedLoading } = useSavedPosts()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const recentHistory = history.slice(0, 5)
  const recentSaved = savedPosts.slice(0, 5)

  const formatDateSafe = (value: string | null, pattern: string, fallback: string) => {
    if (!value) return fallback
    try {
      return format(new Date(value), pattern)
    } catch {
      return fallback
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.display_name || user.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Track your reading progress and manage your saved articles
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Articles Read</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {history.filter(h => h.completed).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📖</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saved Posts</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{savedPosts.length}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔖</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reading Time</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {Math.round(history.reduce((acc, h) => acc + (h.read_time_seconds ?? 0), 0) / 60)}m
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏱️</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Reading History */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Recent Reading</h2>
                <Link
                  href="/dashboard/history"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {historyLoading ? (
                <p className="text-gray-500 text-center py-8">Loading...</p>
              ) : recentHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No reading history yet. Start exploring!
                </p>
              ) : (
                <div className="space-y-4">
                  {recentHistory.map((item) => (
                    <Link
                      key={item.id}
                      href={`/blog/${item.post?.slug}`}
                      className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition"
                    >
                      {item.post?.featured_image && (
                        <div className="flex-shrink-0 w-16 h-16 relative rounded overflow-hidden">
                          <Image
                            src={item.post.featured_image}
                            alt={item.post.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {item.post?.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {formatDateSafe(item.last_read_at, 'MMM d, yyyy', 'TBD')}
                          </span>
                          {item.completed && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              ✓ Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Saved Posts */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Saved Posts</h2>
                <Link
                  href="/dashboard/saved"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {savedLoading ? (
                <p className="text-gray-500 text-center py-8">Loading...</p>
              ) : recentSaved.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No saved posts yet. Bookmark articles to read later!
                </p>
              ) : (
                <div className="space-y-4">
                  {recentSaved.map((item) => (
                    <Link
                      key={item.id}
                      href={`/blog/${item.post?.slug}`}
                      className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition"
                    >
                      {item.post?.featured_image && (
                        <div className="flex-shrink-0 w-16 h-16 relative rounded overflow-hidden">
                          <Image
                            src={item.post.featured_image}
                            alt={item.post.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {item.post?.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Saved on {formatDateSafe(item.saved_at, 'MMM d, yyyy', 'TBD')}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/"
              className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <span className="text-2xl">🏠</span>
              <div>
                <h3 className="font-medium text-gray-900">Browse Articles</h3>
                <p className="text-sm text-gray-600">Discover trending content</p>
              </div>
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <span className="text-2xl">⚙️</span>
              <div>
                <h3 className="font-medium text-gray-900">Settings</h3>
                <p className="text-sm text-gray-600">Manage your preferences</p>
              </div>
            </Link>
            <Link
              href="/dashboard/history"
              className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <span className="text-2xl">📊</span>
              <div>
                <h3 className="font-medium text-gray-900">View Stats</h3>
                <p className="text-sm text-gray-600">See your reading analytics</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
