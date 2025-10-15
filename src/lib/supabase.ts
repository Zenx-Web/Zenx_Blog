import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Environment variables validation
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Admin client with service role for admin operations (server-side only)
// Only initialize on the server side (Node.js environment)
let supabaseAdminInstance: SupabaseClient<Database> | null = null

if (typeof window === 'undefined') {
  // Server-side code
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  supabaseAdminInstance = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export const supabaseAdmin = supabaseAdminInstance!

export type BlogPost = Database['public']['Tables']['blog_posts']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type TrendingTopic = Database['public']['Tables']['trending_topics']['Row']
export type SiteAnalytics = Database['public']['Tables']['site_analytics']['Row']