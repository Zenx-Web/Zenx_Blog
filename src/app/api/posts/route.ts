import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    
    let query = supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image,
        category,
        tags,
        is_featured,
        read_time,
        views,
        published_at
      `)
      .eq('is_published', true)
      .order('published_at', { ascending: false })
    
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`)
    }
    
    const { data: posts, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Get featured posts separately
    const { data: featuredPosts } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image,
        category,
        tags,
        read_time,
        views,
        published_at
      `)
      .eq('is_published', true)
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(3)
    
    return NextResponse.json({
      posts: posts || [],
      featuredPosts: featuredPosts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}