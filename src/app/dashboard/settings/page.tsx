'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useTheme } from '@/lib/theme-context'

export default function DashboardSettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { profile, loading, updateProfile } = useUserProfile()
  const { theme: currentTheme, setTheme: setGlobalTheme } = useTheme()

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/dashboard/settings')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.display_name ?? '')
    setBio(profile.bio ?? '')
    setEmailNotifications(profile.preferences?.emailNotifications ?? true)
    const storedTheme = profile.preferences?.theme as 'light' | 'dark' | 'system' | undefined
    setTheme(storedTheme || 'system')
  }, [profile])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setFeedback(null)

    // Apply theme globally
    setGlobalTheme(theme)

    const { error } = await updateProfile({
      display_name: displayName,
      bio,
      preferences: {
        emailNotifications,
        theme
      }
    })

    if (error) {
      setFeedback({ type: 'error', message: error })
    } else {
      setFeedback({ type: 'success', message: 'Settings saved successfully.' })
    }

    setSaving(false)
  }

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-gray-600">Preparing your settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-2 text-sm text-gray-600">Update your public profile and notification preferences.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Profile details</h2>
            <p className="mt-1 text-sm text-gray-600">Control the information other readers see on Zenx.</p>

            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  Display name
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Your name or alias"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Share a quick intro so others know what you follow."
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <p className="mt-1 text-xs text-gray-500">We recommend keeping this under 280 characters.</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Notifications & theme</h2>
            <p className="mt-1 text-sm text-gray-600">Choose how Zenx keeps in touch with you.</p>

            <div className="mt-6 space-y-4">
              <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={emailNotifications}
                  onChange={(event) => setEmailNotifications(event.target.checked)}
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Email me about trending stories</span>
                  <p className="text-sm text-gray-600">Receive quick updates when new AI-curated topics go live.</p>
                </div>
              </label>

              <div>
                <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                  Preferred theme
                </label>
                <select
                  id="theme"
                  name="theme"
                  value={theme}
                  onChange={(event) => setTheme(event.target.value as 'light' | 'dark' | 'system')}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="system">Follow system setting</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">We will mirror this preference across future Zenx surfaces.</p>
              </div>
            </div>
          </section>

          {feedback && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}
            >
              {feedback.message}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setDisplayName(profile?.display_name ?? '')
                setBio(profile?.bio ?? '')
                setEmailNotifications(profile?.preferences?.emailNotifications ?? true)
                const storedTheme = profile?.preferences?.theme as 'light' | 'dark' | 'system' | undefined
                setTheme(storedTheme || 'system')
                setFeedback(null)
              }}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              disabled={saving || loading}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
