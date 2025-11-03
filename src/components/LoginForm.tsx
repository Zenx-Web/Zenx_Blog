'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isOAuthRedirecting, setIsOAuthRedirecting] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const oauthRedirectTarget = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`
    }

    const configured = process.env.NEXT_PUBLIC_SITE_URL
    if (configured) {
      return `${configured.replace(/\/$/, '')}/auth/callback`
    }

    return ''
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      const redirectTarget = searchParams?.get('redirect')
      router.push(redirectTarget && redirectTarget.startsWith('/') ? redirectTarget : '/dashboard')
      router.refresh()
    }
  }

  const handleGoogleSignIn = async () => {
    if (!oauthRedirectTarget) {
      setError('Missing OAuth redirect configuration. Please set NEXT_PUBLIC_SITE_URL.')
      return
    }

    setError('')
    setIsOAuthRedirecting(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: oauthRedirectTarget,
          scopes: 'openid profile email'
        }
      })

      if (error) {
        throw error
      }

      // Supabase will redirect away; keep button disabled until navigation completes.
    } catch (oauthError) {
      console.error('Google sign-in failed', oauthError)
      setError(oauthError instanceof Error ? oauthError.message : 'Google sign-in failed. Please try again.')
      setIsOAuthRedirecting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="mt-2 text-gray-600">Sign in to your Zenx Blog account</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isOAuthRedirecting}
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M12 10.8v3.84h5.46c-.24 1.26-1.47 3.72-5.46 3.72-3.3 0-6-2.73-6-6.06s2.7-6.06 6-6.06c1.89 0 3.15.81 3.87 1.5l2.64-2.55C16.77 3.9 14.64 3 12 3 6.96 3 2.82 7.2 2.82 12s4.14 9 9.18 9c5.292 0 8.82-3.72 8.82-8.97 0-.6-.06-1.05-.15-1.53H12z"
                />
              </svg>
              {isOAuthRedirecting ? 'Redirecting…' : 'Continue with Google'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-sm font-medium text-gray-500">or sign in with email</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white text-gray-900 placeholder-gray-400"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white text-gray-900 placeholder-gray-400"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || isOAuthRedirecting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to Zenx Blog?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/auth/register"
                className="w-full flex justify-center py-3 px-4 border-2 border-blue-600 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
              >
                Create an Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
