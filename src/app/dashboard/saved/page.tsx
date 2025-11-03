'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useAuth } from '@/lib/auth-context'
import { useSavedPosts } from '@/hooks/useSavedPosts'

function formatDateSafe(value: string | null, pattern: string, fallback: string) {
  if (!value) return fallback
  try {
    return format(new Date(value), pattern)
  } catch {
    return fallback
  }
}

export default function SavedPostsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { savedPosts, loading } = useSavedPosts()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/dashboard/saved')
    }
  }, [authLoading, user, router])

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-gray-600">Loading your saved posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Saved Posts</h1>
            <p className="mt-2 text-sm text-gray-600">
              All the stories you have bookmarked for later live here.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
          >
            ← Browse Articles
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Bookmarked reads</h2>
          </div>
          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500">Fetching your saved posts...</div>
          ) : savedPosts.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              Nothing saved yet. Tap the bookmark icon on any article to add it here.
            </div>
          ) : (
            <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
              {savedPosts.map((item) => (
                <Link
                  key={item.id}
                  href={`/blog/${item.post?.slug ?? ''}`}
                  className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {item.post?.featured_image ? (
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={item.post.featured_image}
                        alt={item.post.title}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-blue-50 text-blue-600">
                      <span className="text-base font-semibold">{item.post?.category ?? 'Article'}</span>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-blue-600">
                      <span>{item.post?.category?.replace('-', ' ')}</span>
                      <span className="text-gray-500">
                        Saved {formatDateSafe(item.saved_at, 'MMM d, yyyy', 'Recently')}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {item.post?.title ?? 'Untitled article'}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-3">{item.post?.excerpt}</p>
                    <div className="mt-auto text-xs text-gray-500">
                      {(item.post?.read_time ?? 0)} min read
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
