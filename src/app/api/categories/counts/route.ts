import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get all published posts with their categories
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('category')
      .eq('is_published', true)

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Count posts per category
    const counts: Record<string, number> = {}
    posts?.forEach(post => {
      if (post.category) {
        counts[post.category] = (counts[post.category] || 0) + 1
      }
    })

    // Only include categories with 3+ posts
    const activeCategories = Object.entries(counts)
      .filter(([_, count]) => count >= 3)
      .map(([slug, count]) => ({ slug, count }))

    return NextResponse.json({ 
      success: true, 
      counts,
      categories: activeCategories,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching category counts:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch category counts' 
    }, { status: 500 })
  }
}
