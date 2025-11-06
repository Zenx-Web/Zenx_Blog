'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useUserProfile } from '@/hooks/useUserProfile'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useUserProfile()
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // Load theme from user profile
  useEffect(() => {
    if (profile?.preferences?.theme) {
      const savedTheme = profile.preferences.theme as Theme
      setThemeState(savedTheme)
    } else {
      // Check localStorage as fallback
      const stored = localStorage.getItem('theme') as Theme | null
      if (stored) {
        setThemeState(stored)
      }
    }
  }, [profile])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    
    let effectiveTheme: 'light' | 'dark'
    
    if (theme === 'system') {
      effectiveTheme = systemTheme
    } else {
      effectiveTheme = theme as 'light' | 'dark'
    }

    setResolvedTheme(effectiveTheme)

    // Remove both classes first
    root.classList.remove('light', 'dark')
    // Add the active theme class
    root.classList.add(effectiveTheme)
    
    // Store in localStorage
    localStorage.setItem('theme', theme)
  }, [theme])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light'
      setResolvedTheme(newTheme)
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(newTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
