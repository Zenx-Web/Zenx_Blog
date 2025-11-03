'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { BookmarkIcon as BookmarkIconOutline } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid'
import { useSavedPosts } from '@/hooks/useSavedPosts'
import { useAuth } from '@/lib/auth-context'

interface SavePostButtonProps {
  postId: string
  postSlug: string
  variant?: 'button' | 'icon'
  className?: string
}

export default function SavePostButton({
  postId,
  postSlug,
  variant = 'button',
  className,
}: SavePostButtonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { isPostSaved, savePost, unsavePost } = useSavedPosts()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saved = isPostSaved(postId)

  const handleClick = async () => {
    if (pending) {
      return
    }

    if (!user) {
      const redirectTo = pathname || `/blog/${postSlug}`
      router.push(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`)
      return
    }

    setPending(true)
    setError(null)

    const action = saved ? unsavePost : savePost
    const { error: actionError } = await action(postId)

    if (actionError) {
      setError(actionError)
    }

    setPending(false)
  }

  const iconClass = variant === 'icon' ? 'h-6 w-6' : 'h-5 w-5'
  const icon = saved ? (
    <BookmarkIconSolid className={`${iconClass} text-blue-600`} aria-hidden="true" />
  ) : (
    <BookmarkIconOutline className={`${iconClass} text-slate-600`} aria-hidden="true" />
  )

  if (variant === 'icon') {
    return (
      <div className={className ?? 'flex flex-col items-start'}>
        <button
          type="button"
          onClick={handleClick}
          disabled={pending}
          aria-pressed={saved}
          aria-label={saved ? 'Remove from saved posts' : 'Save post for later'}
          className={`rounded-full border border-slate-200 bg-white p-2 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 ${pending ? 'opacity-70' : ''}`}
        >
          {icon}
        </button>
        {error && (
          <span className="mt-2 block text-xs text-red-600" role="alert">
            {error}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={className ?? 'flex flex-col items-start'}>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={saved}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${saved ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50'} ${pending ? 'opacity-70' : ''}`}
      >
        {icon}
        <span>{saved ? 'Saved' : 'Save for later'}</span>
      </button>
      {error && (
        <span className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
