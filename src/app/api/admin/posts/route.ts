import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { ensureAdminApiAccess } from '@/lib/auth'
import type { TablesInsert, TablesUpdate } from '@/types/database.types'

// Get all blog posts
export async function GET(request: NextRequest) {
  try {
    const session = await ensureAdminApiAccess()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') // 'published', 'draft', 'all'
    
    let query = supabaseAdmin
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
    
    if (status === 'published') {
      query = query.eq('is_published', true)
    } else if (status === 'draft') {
      query = query.eq('is_published', false)
    }
    
    const { data: posts, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// Create or update blog post
export async function POST(request: NextRequest) {
  try {
    const session = await ensureAdminApiAccess()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as Partial<TablesInsert<'blog_posts'>> & {
      id?: string
      slug?: string
    }

    const { id, slug, ...rest } = body

    const updatePayload: TablesUpdate<'blog_posts'> = { ...rest }

    if (typeof slug === 'string' && slug.trim().length > 0) {
      const safeSlug = await ensureUniqueSlug(slug, id)
      updatePayload.slug = safeSlug
    }

    if (id) {
      const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      revalidateAfterSave(data.slug)
      return NextResponse.json({ success: true, post: data })
    } else {
      if (typeof slug === 'string' && slug.trim().length > 0) {
        updatePayload.slug = await ensureUniqueSlug(slug, undefined)
      }

      const requiredFields: Array<keyof TablesInsert<'blog_posts'>> = [
        'title',
        'content',
        'excerpt',
        'category'
      ]

      for (const field of requiredFields) {
        if (!updatePayload[field]) {
          return NextResponse.json(
            { error: `Missing required field: ${field}` },
            { status: 400 }
          )
        }
      }

      const insertPayload: TablesInsert<'blog_posts'> = {
        ...updatePayload,
        title: updatePayload.title!,
        content: updatePayload.content!,
        excerpt: updatePayload.excerpt!,
        category: updatePayload.category!,
        slug: updatePayload.slug || (await ensureUniqueSlug(updatePayload.title!, undefined))
      }

      const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .insert(insertPayload)
        .select()
        .single()
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      revalidateAfterSave(data.slug)
      return NextResponse.json({ success: true, post: data })
    }
  } catch (error) {
    console.error('Error saving post:', error)
    return NextResponse.json(
      { error: 'Failed to save post' },
      { status: 500 }
    )
  }
}

async function ensureUniqueSlug(baseSlug: string, currentId?: string) {
  const normalizedSlug = baseSlug
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'zenx-blog-post'

  // Ensure base slug is not longer than 95 characters to allow for counter suffix
  const maxBaseLength = 95
  const truncatedSlug = normalizedSlug.length > maxBaseLength 
    ? normalizedSlug.substring(0, maxBaseLength).replace(/-+$/, '') 
    : normalizedSlug

  let uniqueSlug = truncatedSlug
  let counter = 1

  while (true) {
    // Ensure final slug never exceeds 100 characters
    if (uniqueSlug.length > 100) {
      const counterStr = counter.toString()
      const maxLength = 100 - counterStr.length - 1 // -1 for the hyphen
      uniqueSlug = truncatedSlug.substring(0, maxLength).replace(/-+$/, '') + '-' + counterStr
    }

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .select('id')
      .eq('slug', uniqueSlug)
      .maybeSingle()

    if (!data && (!error || error.code === 'PGRST116' || error.code === 'PGRST301')) {
      return uniqueSlug
    }

    if (data && data.id === currentId) {
      return uniqueSlug
    }

    if (error && error.code !== 'PGRST116' && error.code !== 'PGRST301') {
      console.warn('⚠️ Slug uniqueness check failed, keeping slug as-is:', error)
      return uniqueSlug
    }

    const counterStr = counter.toString()
    const maxLength = 100 - counterStr.length - 1 // -1 for the hyphen
    uniqueSlug = truncatedSlug.substring(0, maxLength).replace(/-+$/, '') + '-' + counterStr
    counter += 1
  }
}

// Delete blog post
export async function DELETE(request: NextRequest) {
  try {
    const session = await ensureAdminApiAccess()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
    }
    
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .delete()
      .eq('id', id)
      .select('slug')
      .maybeSingle()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (data?.slug) {
      revalidateAfterSave(data.slug)
    } else {
      revalidatePath('/admin')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}

function revalidateAfterSave(slug: string) {
  try {
    revalidatePath('/')
    revalidatePath('/admin')
    if (slug) {
      revalidatePath('/blog')
      revalidatePath(`/blog/${slug}`)
    }
  } catch (error) {
    console.warn('⚠️ Failed to revalidate paths:', error)
  }
}