'use client'

import { useState } from 'react'
import { EnvelopeIcon } from '@heroicons/react/24/outline'

export default function NewsletterSubscribe({ inline = false }: { inline?: boolean }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.message)
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to subscribe')
      }
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  if (inline) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 my-8">
        <div className="max-w-2xl mx-auto text-center">
          <EnvelopeIcon className="h-8 w-8 text-white mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white mb-2">
            Never Miss a Post!
          </h3>
          <p className="text-blue-100 mb-4">
            Subscribe to get notifications when we publish new trending content.
          </p>

          {status === 'success' ? (
            <div className="bg-white/20 backdrop-blur rounded-lg p-4 text-white">
              ✓ {message}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                disabled={status === 'loading'}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-6 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50 transition"
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p className="mt-2 text-red-200 text-sm">{message}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <EnvelopeIcon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Newsletter</h3>
          <p className="text-sm text-gray-600">
            Get the latest trending posts delivered to your inbox
          </p>
        </div>
      </div>

      {status === 'success' ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">
          ✓ {message}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p className="mt-2 text-red-600 text-sm">{message}</p>
      )}

      <p className="mt-3 text-xs text-gray-500">
        No spam. Unsubscribe anytime.
      </p>
    </div>
  )
}
