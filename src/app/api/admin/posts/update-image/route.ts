import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, featuredImage } = body

    if (!postId || !featuredImage) {
      return NextResponse.json(
        { error: 'Post ID and featured image URL are required' },
        { status: 400 }
      )
    }

    // Update the post's featured_image
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .update({ 
        featured_image: featuredImage,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select()
      .single()

    if (error) {
      console.error('Supabase error updating image:', error)
      return NextResponse.json(
        { error: 'Failed to update image in database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      post: data
    })
  } catch (error) {
    console.error('Error updating post image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
