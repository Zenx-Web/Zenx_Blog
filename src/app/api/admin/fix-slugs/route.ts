import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // First, get all posts with long slugs
    const { data: longSlugPosts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, slug, title')
      .or('char_length(slug).gt.100')

    if (fetchError) {
      console.error('Error fetching long slugs:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const updates = []
    
    for (const post of longSlugPosts || []) {
      // Truncate slug to 100 chars and clean it up
      let newSlug = post.slug.substring(0, 100).replace(/-+$/, '')
      
      // Ensure uniqueness by checking if truncated slug already exists
      const { data: existing } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', newSlug)
        .neq('id', post.id)
        .limit(1)

      if (existing && existing.length > 0) {
        // Add a number suffix to make it unique
        let counter = 1
        let testSlug = newSlug
        while (counter < 100) {
          testSlug = `${newSlug.substring(0, 95)}-${counter}`
          const { data: duplicate } = await supabase
            .from('blog_posts')
            .select('id')
            .eq('slug', testSlug)
            .limit(1)
          
          if (!duplicate || duplicate.length === 0) {
            newSlug = testSlug
            break
          }
          counter++
        }
      }

      updates.push({
        id: post.id,
        oldSlug: post.slug,
        newSlug: newSlug
      })

      // Update the post with the new slug
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ slug: newSlug })
        .eq('id', post.id)

      if (updateError) {
        console.error(`Error updating post ${post.id}:`, updateError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Fixed ${updates.length} long slugs`,
      updates: updates
    })
  } catch (error) {
    console.error('Error in fix-slugs API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}