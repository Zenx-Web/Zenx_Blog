'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

interface SetupStatus {
  status: 'success' | 'error' | 'loading'
  message: string
  categories?: number
  error?: string
  instructions?: string[]
  next_steps?: string[]
}

export default function SetupPage() {
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({ status: 'loading', message: 'Checking setup...' })

  useEffect(() => {
    checkSetup()
  }, [])

  const checkSetup = async () => {
    try {
      const response = await fetch('/api/setup')
      const data = await response.json()
      setSetupStatus(data)
    } catch (error) {
      setSetupStatus({
        status: 'error',
        message: 'Failed to check setup',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const setupDatabase = async () => {
    setSetupStatus({ status: 'loading', message: 'Setting up database...' })
    try {
      const response = await fetch('/api/setup/database', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        setSetupStatus({
          status: 'success',
          message: data.message,
          next_steps: data.next_steps
        })
      } else {
        setSetupStatus({
          status: 'error',
          message: data.message,
          error: data.error
        })
      }
    } catch (error) {
      setSetupStatus({
        status: 'error',
        message: 'Failed to setup database',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Zenx Blog Setup
          </h1>
          <p className="text-gray-600">
            Configure your AI-powered blog platform
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center mb-4">
            {setupStatus.status === 'loading' && (
              <ClockIcon className="w-6 h-6 text-yellow-500 mr-3 animate-spin" />
            )}
            {setupStatus.status === 'success' && (
              <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3" />
            )}
            {setupStatus.status === 'error' && (
              <XCircleIcon className="w-6 h-6 text-red-500 mr-3" />
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              Database Connection
            </h2>
          </div>
          
          <p className={`text-lg mb-4 ${
            setupStatus.status === 'success' ? 'text-green-700' : 
            setupStatus.status === 'error' ? 'text-red-700' : 'text-gray-700'
          }`}>
            {setupStatus.message}
          </p>

          {setupStatus.categories !== undefined && (
            <p className="text-gray-600 mb-4">
              Found {setupStatus.categories} categories in database
            </p>
          )}

          <div className="flex gap-4">
            <button
              onClick={checkSetup}
              disabled={setupStatus.status === 'loading'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {setupStatus.status === 'loading' ? 'Checking...' : 'Recheck Connection'}
            </button>
            
            <button
              onClick={setupDatabase}
              disabled={setupStatus.status === 'loading'}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Setup Database
            </button>
          </div>
        </div>

        {/* Instructions */}
        {setupStatus.instructions && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-red-800 mb-3">
              Setup Required
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-red-700">
              {setupStatus.instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Next Steps */}
        {setupStatus.next_steps && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-green-800 mb-3">
              Next Steps
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-green-700">
              {setupStatus.next_steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Database Schema */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Database Schema
          </h3>
          <p className="text-gray-600 mb-4">
            Copy and paste this SQL code into your Supabase SQL Editor:
          </p>
          <div className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
{`-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog posts table
CREATE TABLE blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  featured_image TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  seo_title TEXT,
  seo_description TEXT,
  read_time INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (category) REFERENCES categories(slug)
);

-- Insert default categories
INSERT INTO categories (name, slug, description, color) VALUES
('Technology', 'technology', 'Latest tech trends and innovations', '#8B5CF6'),
('Entertainment', 'entertainment', 'Movies, TV shows, celebrity news', '#F59E0B'),
('Lifestyle', 'lifestyle', 'Health, fashion, and lifestyle trends', '#10B981'),
('Business', 'business', 'Market trends and business news', '#3B82F6'),
('Sports', 'sports', 'Sports news and trending events', '#EF4444'),
('World News', 'world-news', 'Breaking news and global events', '#6B7280');

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can read published posts" ON blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can read categories" ON categories FOR SELECT USING (true);`}
            </pre>
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Environment Variables
          </h3>
          <p className="text-gray-600 mb-4">
            Make sure these are set in your .env.local file:
          </p>
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="text-sm">
{`# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=https://umfhehmdhiusxmyezdkk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# AI APIs (Need to be configured)
OPENAI_API_KEY=your_chatgpt_api_key
GOOGLE_GEMINI_API_KEY=your_gemini_api_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://imzenx.in
ADMIN_EMAIL=your_admin_email@example.com`}
            </pre>
          </div>
        </div>

        {/* Links */}
        <div className="mt-8 text-center space-x-4">
          <Link
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
          >
            View Blog
          </Link>
          <Link
            href="/admin"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 inline-block"
          >
            Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}