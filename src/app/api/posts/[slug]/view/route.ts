import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
    }

    const { data: post, error: fetchError } = await supabaseAdmin
      .from('blog_posts')
      .select('id, is_published')
      .eq('slug', slug)
      .single()

    if (fetchError || !post || !post.is_published) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
    }

    const { error: incrementError } = await supabaseAdmin
      .rpc('increment_post_views', { post_slug: slug })

    if (incrementError) {
      throw incrementError
    }

    const { data: updated, error: refreshedError } = await supabaseAdmin
      .from('blog_posts')
      .select('views')
      .eq('id', post.id)
      .single()

    if (refreshedError || !updated) {
      throw refreshedError ?? new Error('Failed to fetch updated view count')
    }

    return NextResponse.json({ views: updated.views ?? 0 })
  } catch (error) {
    console.error('Failed to record post view', error)
    return NextResponse.json({ error: 'Failed to record post view' }, { status: 500 })
  }
}
