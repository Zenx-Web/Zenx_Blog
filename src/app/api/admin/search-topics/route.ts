import { NextResponse } from 'next/server'
import { ensureAdminApiAccess } from '@/lib/auth'
import { searchTopicsByQuery } from '@/lib/trending'

export async function POST(request: Request) {
  try {
    const session = await ensureAdminApiAccess()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { query, limit = 20 } = await request.json()
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Searching for trending topics related to: "${query}"`)

    // Search for real trending topics based on the query
    const searchResults = await searchTopicsByQuery(query, limit)
    
    if (searchResults.length === 0) {
      console.log(`⚠️ No live results found for "${query}", generating blog-worthy topics...`)
      
      // Generate intelligent blog topics based on the search query
      const fallbackResults = generateBlogTopicsFromQuery(query, limit)
      
      return NextResponse.json({
        success: true,
        topics: fallbackResults,
        query: query,
        message: `No live trending results found for "${query}". Here are ${fallbackResults.length} blog-worthy topic ideas you can write about.`,
        source: 'generated'
      })
    }
    
    return NextResponse.json({
      success: true,
      topics: searchResults,
      query: query,
      message: `Found ${searchResults.length} live trending topics for "${query}"`,
      source: 'live'
    })
  } catch (error) {
    console.error('Error in custom topic search:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search for topics' },
      { status: 500 }
    )
  }
}

// Generate intelligent blog topics when no live results found
function generateBlogTopicsFromQuery(query: string, limit: number) {
  const baseQuery = query.trim()
  const category = detectQueryCategory(baseQuery.toLowerCase())
  
  // Intelligent topic templates based on query type
  const topics = [
    `${baseQuery}: Complete Guide and Latest Updates`,
    `Everything You Need to Know About ${baseQuery}`,
    `${baseQuery} - Expert Analysis and Insights`,
    `Top 10 Facts About ${baseQuery}`,
    `${baseQuery}: Trends and Predictions for 2025`,
    `Understanding ${baseQuery}: A Deep Dive`,
    `${baseQuery} Explained: Beginner to Expert`,
    `The Ultimate ${baseQuery} Resource Guide`,
    `${baseQuery}: Why It Matters in 2025`,
    `${baseQuery} - Common Questions Answered`,
    `How ${baseQuery} is Changing the Industry`,
    `${baseQuery}: Best Practices and Tips`,
    `The Future of ${baseQuery}: What's Next`,
    `${baseQuery} Success Stories and Case Studies`,
    `${baseQuery} vs Alternatives: Complete Comparison`
  ]
  
  return topics.slice(0, limit).map((topic, index) => ({
    topic: topic,
    source: 'Zenx Blog Ideas',
    relevanceScore: 1000 - (index * 50),
    category: category.charAt(0).toUpperCase() + category.slice(1),
    searchQuery: query,
    used: false
  }))
}

// Detect category from search query
function detectQueryCategory(query: string): string {
  const techKeywords = ['ai', 'tech', 'software', 'app', 'digital', 'cyber', 'robot', 'automation', 'cloud', 'data', 'gaming', 'game']
  const businessKeywords = ['business', 'startup', 'investment', 'market', 'finance', 'entrepreneur', 'profit', 'strategy']
  const lifestyleKeywords = ['health', 'fitness', 'lifestyle', 'wellness', 'food', 'travel', 'fashion', 'home', 'mindfulness']
  const entertainmentKeywords = ['movie', 'music', 'celebrity', 'tv', 'show', 'entertainment', 'viral', 'social']
  const sportsKeywords = ['sport', 'football', 'basketball', 'soccer', 'tennis', 'olympics', 'athlete', 'team']

  if (techKeywords.some(keyword => query.includes(keyword))) return 'technology'
  if (businessKeywords.some(keyword => query.includes(keyword))) return 'business'
  if (lifestyleKeywords.some(keyword => query.includes(keyword))) return 'lifestyle'
  if (entertainmentKeywords.some(keyword => query.includes(keyword))) return 'entertainment'
  if (sportsKeywords.some(keyword => query.includes(keyword))) return 'sports'
  
  return 'world-news' // Default category
}