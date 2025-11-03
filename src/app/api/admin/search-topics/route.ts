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
  const lowerQuery = query.toLowerCase()
  
  // Technology keywords - expanded
  const techKeywords = [
    'ai', 'artificial intelligence', 'tech', 'technology', 'software', 'app', 'application',
    'digital', 'cyber', 'robot', 'automation', 'cloud', 'data', 'gaming', 'game', 'video game',
    'computer', 'laptop', 'smartphone', 'iphone', 'android', 'ios', 'windows', 'mac',
    'coding', 'programming', 'developer', 'bitcoin', 'crypto', 'blockchain', 'nft',
    'metaverse', 'vr', 'virtual reality', 'ar', 'augmented reality', 'machine learning',
    'chatgpt', 'openai', 'google', 'microsoft', 'apple', 'tesla', 'spacex', 'amazon',
    'facebook', 'meta', 'instagram', 'twitter', 'tiktok', 'youtube', 'netflix',
    'internet', 'web', 'website', 'online', 'streaming', 'podcast', 'gadget', 'device',
    'electric vehicle', 'ev', 'drone', '5g', 'wifi', 'cybersecurity', 'hacking', 'privacy'
  ]
  
  // Entertainment keywords - expanded
  const entertainmentKeywords = [
    'movie', 'film', 'cinema', 'hollywood', 'bollywood', 'entertainment', 'celebrity',
    'music', 'concert', 'album', 'song', 'singer', 'artist', 'band', 'musician',
    'tv', 'television', 'show', 'series', 'netflix', 'disney', 'hbo', 'prime video',
    'actor', 'actress', 'director', 'producer', 'oscar', 'grammy', 'award',
    'viral', 'meme', 'funny', 'comedy', 'joke', 'humor', 'trending',
    'marvel', 'dc', 'superhero', 'anime', 'manga', 'cartoon',
    'influencer', 'youtuber', 'streamer', 'twitch', 'content creator',
    'fashion', 'style', 'beauty', 'makeup', 'model', 'runway'
  ]
  
  // Sports keywords - expanded
  const sportsKeywords = [
    'sport', 'sports', 'football', 'soccer', 'nfl', 'fifa', 'world cup',
    'basketball', 'nba', 'baseball', 'mlb', 'cricket', 'ipl', 'tennis',
    'golf', 'olympics', 'championship', 'tournament', 'league', 'match',
    'player', 'team', 'coach', 'athlete', 'fitness', 'workout', 'gym',
    'hockey', 'nhl', 'boxing', 'mma', 'ufc', 'wrestling', 'wwe',
    'racing', 'formula 1', 'f1', 'nascar', 'motorsport',
    'rugby', 'volleyball', 'badminton', 'table tennis', 'esports', 'gaming tournament'
  ]
  
  // Business keywords - expanded
  const businessKeywords = [
    'business', 'startup', 'entrepreneur', 'investment', 'investor', 'funding',
    'market', 'stock', 'share', 'trading', 'economy', 'finance', 'financial',
    'money', 'profit', 'revenue', 'sales', 'marketing', 'advertising',
    'ceo', 'founder', 'company', 'corporation', 'enterprise', 'industry',
    'bank', 'banking', 'insurance', 'real estate', 'property',
    'wall street', 'nasdaq', 'dow jones', 'forex', 'commodity',
    'tax', 'accounting', 'audit', 'consulting', 'management',
    'ecommerce', 'retail', 'wholesale', 'supply chain', 'logistics',
    'venture capital', 'vc', 'ipo', 'merger', 'acquisition', 'strategy'
  ]
  
  // Lifestyle keywords - expanded
  const lifestyleKeywords = [
    'health', 'healthy', 'wellness', 'wellbeing', 'fitness', 'exercise',
    'diet', 'nutrition', 'food', 'recipe', 'cooking', 'chef', 'restaurant',
    'travel', 'tourism', 'vacation', 'holiday', 'destination', 'hotel',
    'lifestyle', 'living', 'home', 'interior', 'design', 'decor', 'diy',
    'sustainable', 'eco-friendly', 'green', 'organic', 'vegan', 'vegetarian',
    'yoga', 'meditation', 'mindfulness', 'mental health', 'therapy', 'self-care',
    'parenting', 'family', 'relationship', 'dating', 'wedding', 'marriage',
    'pet', 'dog', 'cat', 'garden', 'gardening', 'nature', 'outdoor',
    'wine', 'coffee', 'tea', 'beverage', 'drink'
  ]
  
  // World News keywords - expanded
  const newsKeywords = [
    'news', 'breaking', 'update', 'latest', 'current', 'today',
    'politics', 'political', 'government', 'president', 'minister', 'election',
    'climate', 'environment', 'global warming', 'weather', 'disaster',
    'war', 'conflict', 'military', 'defense', 'security', 'terrorism',
    'law', 'legal', 'court', 'justice', 'crime', 'police',
    'science', 'research', 'study', 'discovery', 'breakthrough',
    'education', 'university', 'school', 'student', 'teacher',
    'covid', 'pandemic', 'virus', 'vaccine', 'health crisis',
    'international', 'global', 'world', 'country', 'nation'
  ]
  
  // Count matches for each category
  let techScore = 0
  let entertainmentScore = 0
  let sportsScore = 0
  let businessScore = 0
  let lifestyleScore = 0
  let newsScore = 0
  
  // Check each keyword and assign scores
  techKeywords.forEach(keyword => {
    if (lowerQuery.includes(keyword)) techScore++
  })
  entertainmentKeywords.forEach(keyword => {
    if (lowerQuery.includes(keyword)) entertainmentScore++
  })
  sportsKeywords.forEach(keyword => {
    if (lowerQuery.includes(keyword)) sportsScore++
  })
  businessKeywords.forEach(keyword => {
    if (lowerQuery.includes(keyword)) businessScore++
  })
  lifestyleKeywords.forEach(keyword => {
    if (lowerQuery.includes(keyword)) lifestyleScore++
  })
  newsKeywords.forEach(keyword => {
    if (lowerQuery.includes(keyword)) newsScore++
  })
  
  // Find the category with highest score
  const scores = {
    'technology': techScore,
    'entertainment': entertainmentScore,
    'sports': sportsScore,
    'business': businessScore,
    'lifestyle': lifestyleScore,
    'world-news': newsScore
  }
  
  // Get category with max score
  const maxScore = Math.max(...Object.values(scores))
  
  // If no keywords matched, return world-news as default
  if (maxScore === 0) return 'world-news'
  
  // Return the category with highest score
  for (const [category, score] of Object.entries(scores)) {
    if (score === maxScore) return category
  }
  
  return 'world-news' // Default fallback
}