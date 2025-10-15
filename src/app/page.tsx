import BlogList from '@/components/BlogList'
import { supabase } from '@/lib/supabase'

interface HomePageProps {
  searchParams: Promise<{
    category?: string
    search?: string
    page?: string
  }>
}

async function getInitialPosts(category?: string, search?: string) {
  try {
    const limit = 12

    let postsQuery = supabase
      .from('blog_posts')
      .select(
        `
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
        `
      )
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .range(0, limit - 1)

    if (category && category !== 'all') {
      postsQuery = postsQuery.eq('category', category)
    }

    if (search) {
      postsQuery = postsQuery.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`)
    }

    const { data: posts, error: postsError } = await postsQuery

    if (postsError) {
      throw postsError
    }

    const { data: featuredPosts, error: featuredError } = await supabase
      .from('blog_posts')
      .select(
        `
          id,
          title,
          slug,
          excerpt,
          featured_image,
          category,
          tags,
          is_featured,
          is_featured,
          read_time,
          views,
          published_at
        `
      )
      .eq('is_published', true)
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(3)

    if (featuredError) {
      throw featuredError
    }

    return {
      posts: posts || [],
      featuredPosts: featuredPosts || []
    }
  } catch (error) {
    console.error('Error fetching initial posts:', error)
    return { posts: [], featuredPosts: [] }
  }
}

export default async function Home({ searchParams }: HomePageProps) {
  const { category, search } = await searchParams
  const { posts, featuredPosts } = await getInitialPosts(category, search)

  return (
    <main>
      <BlogList 
        initialPosts={posts}
        initialFeaturedPosts={featuredPosts}
        category={category}
        searchQuery={search}
      />
    </main>
  )
}
