'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useAuth } from '@/lib/auth-context'
import { useReadingHistory } from '@/hooks/useReadingHistory'

function formatDateSafe(value: string | null, pattern: string, fallback: string) {
  if (!value) return fallback
  try {
    return format(new Date(value), pattern)
  } catch {
    return fallback
  }
}

export default function ReadingHistoryPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { history, loading } = useReadingHistory()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/dashboard/history')
    }
  }, [authLoading, user, router])

  const summary = useMemo(() => {
    const totalRead = history.length
    const completed = history.filter((item) => item.completed).length
    const totalMinutes = Math.round(
      history.reduce((acc, item) => acc + (item.read_time_seconds ?? 0), 0) / 60
    )
    return { totalRead, completed, totalMinutes }
  }, [history])

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-gray-600">Loading your reading history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reading History</h1>
            <p className="mt-2 text-sm text-gray-600">
              Revisit articles you have explored recently and track your progress.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
          >
            ← Browse Articles
          </Link>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total articles viewed</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{summary.totalRead}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Completed reads</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{summary.completed}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Reading time</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{summary.totalMinutes} min</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent activity</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="px-6 py-12 text-center text-gray-500">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                You have not read any articles yet. Start exploring trending stories!
              </div>
            ) : (
              history.map((item) => (
                <Link
                  key={item.id}
                  href={`/blog/${item.post?.slug ?? ''}`}
                  className="flex flex-col gap-4 px-6 py-5 transition hover:bg-gray-50 sm:flex-row sm:items-center"
                >
                  {item.post?.featured_image ? (
                    <div className="relative h-20 w-full overflow-hidden rounded-xl sm:h-20 sm:w-32">
                      <Image
                        src={item.post.featured_image}
                        alt={item.post.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-20 w-full items-center justify-center rounded-xl bg-blue-50 text-blue-600 sm:w-32">
                      <span className="text-sm font-semibold">{item.post?.category ?? 'Article'}</span>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-blue-600">
                      <span>{item.post?.category?.replace('-', ' ')}</span>
                      {item.completed && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">
                          Completed
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {item.post?.title ?? 'Untitled article'}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {item.post?.excerpt}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span>Last read: {formatDateSafe(item.last_read_at, 'MMM d, yyyy', 'Recently')}</span>
                      <span>Progress: {Math.round(item.progress ?? 0)}%</span>
                      <span>Read time: {Math.max(1, Math.round((item.read_time_seconds ?? 0) / 60))} min</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
