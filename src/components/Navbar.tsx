'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { MagnifyingGlassIcon, Bars3Icon, XMarkIcon, UserCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/lib/auth-context'
import { useUserProfile } from '@/hooks/useUserProfile'

const categories = [
  { name: 'Technology', slug: 'technology', icon: '💻' },
  { name: 'Gaming', slug: 'gaming', icon: '🎮' },
  { name: 'Entertainment', slug: 'entertainment', icon: '🎬' },
  { name: 'Business', slug: 'business', icon: '💼' },
  { name: 'Lifestyle', slug: 'lifestyle', icon: '✨' },
  { name: 'Sports', slug: 'sports', icon: '⚽' },
  { name: 'World News', slug: 'world-news', icon: '🌍' }
]

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { user, signOut } = useAuth()
  const { profile } = useUserProfile()
  
  const categoriesRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const resolvedDisplayName = profile?.display_name?.trim() || user?.email?.split('@')[0] || 'Account'

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setShowCategoriesDropdown(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery)}`
      setIsMobileMenuOpen(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ImZenx
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">AI meets Trending News</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-all"
            >
              Home
            </Link>

            {/* Categories Dropdown */}
            <div className="relative" ref={categoriesRef}>
              <button
                onClick={() => setShowCategoriesDropdown(!showCategoriesDropdown)}
                className="flex items-center gap-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-all"
              >
                Categories
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${showCategoriesDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showCategoriesDropdown && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <div className="grid grid-cols-1 gap-1 px-2">
                    {categories.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/?category=${category.slug}`}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:text-blue-600 rounded-md transition-all"
                        onClick={() => setShowCategoriesDropdown(false)}
                      >
                        <span className="text-lg">{category.icon}</span>
                        <span className="font-medium">{category.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/about"
              className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-all"
            >
              About
            </Link>
            <Link
              href="/how-we-use-ai"
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-md text-sm font-medium transition-all"
            >
              How We Use AI
            </Link>
            <Link
              href="/contact"
              className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-all"
            >
              Contact
            </Link>
          </div>

          {/* Right Side: Search & User */}
          <div className="hidden lg:flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-48 xl:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </form>

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <UserCircleIcon className="h-6 w-6" />
                  <span className="text-sm font-medium max-w-[100px] truncate">{resolvedDisplayName}</span>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      📊 Dashboard
                    </Link>
                    <Link
                      href="/dashboard/history"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      📖 Reading History
                    </Link>
                    <Link
                      href="/dashboard/saved"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      🔖 Saved Posts
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      ⚙️ Settings
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg shadow-sm transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-2 transition"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Slide-in Menu */}
        <div
          className={`lg:hidden fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="h-full overflow-y-auto overflow-x-hidden">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Menu
              </h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
                aria-label="Close menu"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </form>

              {/* Navigation Links */}
              <div className="space-y-1">
                <Link
                  href="/"
                  className="flex items-center gap-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-lg text-base font-medium transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  🏠 Home
                </Link>

                {/* Categories Section */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Categories
                  </p>
                  {categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/?category=${category.slug}`}
                      className="flex items-center gap-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-lg text-base transition-all"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="text-lg">{category.icon}</span>
                      <span className="font-medium">{category.name}</span>
                    </Link>
                  ))}
                </div>

                {/* Pages Section */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Pages
                  </p>
                  <Link
                    href="/about"
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-lg text-base font-medium transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    ℹ️ About
                  </Link>
                  <Link
                    href="/how-we-use-ai"
                    className="flex items-center gap-3 text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-4 py-3 rounded-lg text-base font-medium transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    ⚙️ How We Use AI
                  </Link>
                  <Link
                    href="/contact"
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-lg text-base font-medium transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    📧 Contact
                  </Link>
                </div>
              </div>

              {/* User Section */}
              {user ? (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Account
                  </p>
                  <p className="px-4 py-2 text-sm text-gray-600 truncate">
                    {profile?.display_name || user.email}
                  </p>
                  <div className="mt-2 space-y-1">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-lg text-base transition-all"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      📊 Dashboard
                    </Link>
                    <Link
                      href="/dashboard/history"
                      className="flex items-center gap-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-lg text-base transition-all"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      📖 Reading History
                    </Link>
                    <Link
                      href="/dashboard/saved"
                      className="flex items-center gap-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-lg text-base transition-all"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      🔖 Saved Posts
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-lg text-base transition-all"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      ⚙️ Settings
                    </Link>
                    <button
                      onClick={async () => {
                        setIsMobileMenuOpen(false)
                        await handleSignOut()
                      }}
                      className="flex items-center gap-3 w-full text-left text-red-600 hover:bg-red-50 px-4 py-3 rounded-lg text-base transition-all"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                  <Link
                    href="/auth/login"
                    className="block text-center px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 border border-gray-300 rounded-lg transition"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block text-center px-4 py-3 text-base font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg shadow-sm transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </div>
    </nav>
  )
}