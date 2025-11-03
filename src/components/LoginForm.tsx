'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

declare global {
  interface Window {
    hcaptcha?: {
      render: (container: string | HTMLElement, options: {
        sitekey: string
        callback: (token: string) => void
        'error-callback'?: () => void
        'expired-callback'?: () => void
      }) => string
      reset: (widgetId?: string) => void
      remove: (widgetId: string) => void
    }
  }
}

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isOAuthRedirecting, setIsOAuthRedirecting] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const { signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const captchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ''

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

  // Load hCaptcha script
  useEffect(() => {
    if (!captchaSiteKey) return
    if (typeof window === 'undefined') return

    const script = document.createElement('script')
    script.src = 'https://js.hcaptcha.com/1/api.js'
    script.async = true
    script.defer = true
    
    const onScriptLoad = () => {
      if (captchaRef.current && window.hcaptcha) {
        try {
          widgetIdRef.current = window.hcaptcha.render(captchaRef.current, {
            sitekey: captchaSiteKey,
            callback: (token: string) => {
              setCaptchaToken(token)
            },
            'error-callback': () => {
              setCaptchaToken(null)
              setError('CAPTCHA verification failed. Please try again.')
            },
            'expired-callback': () => {
              setCaptchaToken(null)
            }
          })
        } catch (err) {
          console.error('hCaptcha render error:', err)
        }
      }
    }

    script.addEventListener('load', onScriptLoad)
    document.head.appendChild(script)

    return () => {
      script.removeEventListener('load', onScriptLoad)
      if (widgetIdRef.current && window.hcaptcha) {
        try {
          window.hcaptcha.remove(widgetIdRef.current)
        } catch (err) {
          console.error('hCaptcha cleanup error:', err)
        }
      }
      if (document.head.contains(script)) {
        script.remove()
      }
    }
  }, [captchaSiteKey])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (captchaSiteKey && !captchaToken) {
      setError('Please complete the CAPTCHA verification')
      return
    }

    setLoading(true)

    try {
      const { error } = await signIn(email, password, captchaToken || undefined)

      if (error) {
        console.error('Login error:', error)
        setError(error.message || 'Invalid email or password')
        setLoading(false)
        // Reset CAPTCHA on error
        if (widgetIdRef.current && window.hcaptcha) {
          window.hcaptcha.reset(widgetIdRef.current)
          setCaptchaToken(null)
        }
      } else {
        const redirectTarget = searchParams?.get('redirect')
        router.push(redirectTarget && redirectTarget.startsWith('/') ? redirectTarget : '/dashboard')
        router.refresh()
      }
    } catch (err) {
      console.error('Unexpected login error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
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
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
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

            {captchaSiteKey && (
              <div className="flex justify-center">
                <div ref={captchaRef} />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isOAuthRedirecting || (!!captchaSiteKey && !captchaToken)}
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
