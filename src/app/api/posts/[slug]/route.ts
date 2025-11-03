import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    // Get the blog post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()
    
    if (error || !post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }
    
    // Get related posts
    const { data: relatedPosts } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image,
        category,
        read_time,
        published_at
      `)
      .eq('is_published', true)
      .eq('category', post.category)
      .neq('slug', slug)
      .limit(3)
    
    return NextResponse.json({
      post: {
        ...post,
        views: post.views ?? 0
      },
      relatedPosts: relatedPosts || []
    })
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    )
  }
}