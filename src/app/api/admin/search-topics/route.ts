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
      // Fallback to generated ideas if no real results found
      const fallbackResults = await generateTopicIdeas(query, limit)
      return NextResponse.json({
        success: true,
        topics: fallbackResults,
        query: query,
        message: `Generated ${fallbackResults.length} topic ideas for "${query}" (no live results found)`,
        source: 'generated'
      })
    }
    
    return NextResponse.json({
      success: true,
      topics: searchResults,
      query: query,
      message: `Found ${searchResults.length} trending topics for "${query}"`,
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

// Generate topic ideas based on search query
async function generateTopicIdeas(query: string, limit: number) {
  const baseQuery = query.toLowerCase().trim()
  
  // Topic templates and variations
  const topicTemplates = [
    `Latest ${query} trends and updates`,
    `How ${query} is changing in 2025`,
    `Top 10 ${query} tips for beginners`,
    `The future of ${query}: What to expect`,
    `${query} vs alternatives: Complete comparison`,
    `Why ${query} is trending right now`,
    `${query} mistakes to avoid in 2025`,
    `The ultimate guide to ${query}`,
    `${query} industry insights and analysis`,
    `How to get started with ${query}`,
    `${query}: Benefits and drawbacks explained`,
    `${query} success stories and case studies`,
    `The impact of ${query} on daily life`,
    `${query} tools and resources you need to know`,
    `${query} myths vs facts: Truth revealed`,
    `${query} market predictions for 2025`,
    `Best ${query} practices for professionals`,
    `${query} innovations that will surprise you`,
    `The science behind ${query} explained`,
    `${query} trends that are going viral`
  ]

  // Category-specific variations
  const categoryVariations: { [key: string]: string[] } = {
    technology: [
      `${query} AI integration possibilities`,
      `${query} cybersecurity concerns and solutions`,
      `${query} mobile app development trends`,
      `${query} cloud computing advantages`,
      `${query} automation impact on industries`
    ],
    business: [
      `${query} startup opportunities and challenges`,
      `${query} market analysis and growth potential`,
      `${query} investment strategies and tips`,
      `${query} business model innovations`,
      `${query} entrepreneurship success factors`
    ],
    lifestyle: [
      `${query} health and wellness benefits`,
      `${query} sustainable living practices`,
      `${query} work-life balance tips`,
      `${query} personal development strategies`,
      `${query} mindfulness and mental health`
    ],
    entertainment: [
      `${query} celebrity news and updates`,
      `${query} movie and TV show reviews`,
      `${query} gaming industry developments`,
      `${query} music trends and artist spotlights`,
      `${query} viral social media content`
    ]
  }

  // Detect category from query
  const detectedCategory = detectQueryCategory(baseQuery)
  
  // Combine templates with category-specific variations
  let allTemplates = [...topicTemplates]
  if (categoryVariations[detectedCategory]) {
    allTemplates = [...allTemplates, ...categoryVariations[detectedCategory]]
  }

  // Generate topics with variations
  const topics = allTemplates.slice(0, limit).map((template) => ({
    topic: template,
    source: 'Custom Search',
    relevanceScore: Math.floor(Math.random() * 1500) + 500,
    category: detectedCategory.charAt(0).toUpperCase() + detectedCategory.slice(1),
    used: false,
    searchQuery: query
  }))

  return topics
}

// Detect category from search query
function detectQueryCategory(query: string): string {
  const techKeywords = ['ai', 'tech', 'software', 'app', 'digital', 'cyber', 'robot', 'automation', 'cloud', 'data']
  const businessKeywords = ['business', 'startup', 'investment', 'market', 'finance', 'entrepreneur', 'profit', 'strategy']
  const lifestyleKeywords = ['health', 'fitness', 'lifestyle', 'wellness', 'food', 'travel', 'fashion', 'home', 'mindfulness']
  const entertainmentKeywords = ['movie', 'music', 'game', 'celebrity', 'tv', 'show', 'entertainment', 'viral', 'social']
  const sportsKeywords = ['sport', 'football', 'basketball', 'soccer', 'tennis', 'olympics', 'fitness', 'athlete', 'team']

  if (techKeywords.some(keyword => query.includes(keyword))) return 'technology'
  if (businessKeywords.some(keyword => query.includes(keyword))) return 'business'
  if (lifestyleKeywords.some(keyword => query.includes(keyword))) return 'lifestyle'
  if (entertainmentKeywords.some(keyword => query.includes(keyword))) return 'entertainment'
  if (sportsKeywords.some(keyword => query.includes(keyword))) return 'sports'
  
  return 'world-news' // Default category
}