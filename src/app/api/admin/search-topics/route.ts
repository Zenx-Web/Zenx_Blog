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
  
  // Priority keywords for news/politics - check these FIRST
  const priorityNewsKeywords = [
    'judge', 'court', 'federal', 'government', 'law', 'legal', 'congress', 'senate',
    'president', 'minister', 'election', 'vote', 'policy', 'legislation', 'constitution',
    'military', 'army', 'navy', 'national guard', 'deployment', 'war', 'conflict',
    'climate', 'pandemic', 'covid', 'vaccine', 'emergency', 'disaster', 'crisis'
  ]
  
  // If it's clearly news/politics, return immediately
  const hasNewsKeywords = priorityNewsKeywords.some(keyword => lowerQuery.includes(keyword))
  if (hasNewsKeywords) {
    // Still check if it's ALSO tech-related (like "tech policy")
    const techNewsKeywords = ['tech policy', 'ai regulation', 'crypto law', 'data privacy law']
    const isTechNews = techNewsKeywords.some(keyword => lowerQuery.includes(keyword))
    if (!isTechNews) {
      return 'world-news'
    }
  }
  
  // Technology keywords - more specific now
  const techKeywords = [
    'ai', 'artificial intelligence', 'machine learning', 'chatgpt', 'openai',
    'software', 'app', 'application', 'programming', 'coding', 'developer',
    'iphone', 'android', 'smartphone', 'ios', 'samsung', 'pixel',
    'laptop', 'computer', 'pc', 'mac', 'windows', 'linux',
    'bitcoin', 'crypto', 'cryptocurrency', 'blockchain', 'ethereum', 'nft',
    'gaming', 'gamer', 'playstation', 'xbox', 'nintendo', 'steam', 'esports',
    'tesla', 'spacex', 'starlink', 'rocket', 'space tech',
    'google', 'microsoft', 'apple', 'amazon', 'meta', 'facebook',
    'twitter', 'instagram', 'tiktok', 'youtube', 'social media app',
    'vr', 'virtual reality', 'ar', 'augmented reality', 'metaverse',
    'drone', 'robot', 'automation', 'self-driving', 'autonomous',
    '5g', 'wifi', 'internet speed', 'broadband', 'fiber optic',
    'cybersecurity', 'hacking', 'data breach', 'ransomware',
    'cloud computing', 'aws', 'azure', 'server', 'database',
    'website', 'web dev', 'api', 'tech startup', 'silicon valley'
  ]
  
  // Entertainment keywords - more specific
  const entertainmentKeywords = [
    'movie', 'film', 'cinema', 'box office', 'hollywood', 'bollywood',
    'actor', 'actress', 'director', 'producer', 'celebrity', 'star',
    'music', 'song', 'album', 'concert', 'tour', 'singer', 'artist', 'band',
    'grammy', 'oscar', 'emmy', 'golden globe', 'award show',
    'tv show', 'series', 'season', 'episode', 'streaming',
    'netflix', 'disney', 'hbo', 'prime video', 'hulu',
    'marvel', 'dc comics', 'superhero', 'anime', 'manga',
    'viral video', 'meme', 'trending', 'influencer', 'youtuber',
    'fashion', 'style', 'runway', 'designer', 'model', 'vogue',
    'beauty', 'makeup', 'cosmetics', 'skincare'
  ]
  
  // Sports keywords - very specific
  const sportsKeywords = [
    'football', 'soccer', 'nfl', 'fifa', 'world cup', 'premier league',
    'basketball', 'nba', 'lebron', 'curry', 'lakers', 'warriors',
    'baseball', 'mlb', 'yankees', 'dodgers', 'home run',
    'cricket', 'ipl', 'test match', 'wicket', 'batting',
    'tennis', 'wimbledon', 'us open', 'federer', 'nadal',
    'golf', 'pga', 'masters', 'tiger woods',
    'olympics', 'medal', 'athlete', 'championship',
    'hockey', 'nhl', 'stanley cup', 'boxing', 'mma', 'ufc',
    'formula 1', 'f1', 'racing', 'grand prix', 'nascar',
    'super bowl', 'playoffs', 'finals', 'tournament',
    'player transfer', 'coach', 'team', 'league'
  ]
  
  // Business keywords - specific
  const businessKeywords = [
    'stock market', 'wall street', 'nasdaq', 'dow jones', 'trading',
    'investment', 'investor', 'venture capital', 'funding round',
    'startup', 'unicorn', 'ipo', 'merger', 'acquisition',
    'ceo', 'founder', 'entrepreneur', 'business model',
    'revenue', 'profit', 'earnings', 'quarterly report',
    'economy', 'inflation', 'recession', 'gdp', 'unemployment',
    'finance', 'banking', 'loan', 'interest rate', 'mortgage',
    'ecommerce', 'retail', 'sales', 'marketing campaign',
    'real estate', 'property market', 'housing'
  ]
  
  // Lifestyle keywords - specific
  const lifestyleKeywords = [
    'health tips', 'wellness', 'wellbeing', 'self-care',
    'fitness', 'workout', 'exercise', 'gym', 'yoga', 'pilates',
    'diet', 'nutrition', 'weight loss', 'keto', 'vegan',
    'recipe', 'cooking', 'chef', 'restaurant', 'food',
    'travel', 'vacation', 'destination', 'hotel', 'tourism',
    'home decor', 'interior design', 'diy', 'renovation',
    'parenting', 'baby', 'pregnancy', 'family',
    'relationship', 'dating', 'marriage', 'wedding',
    'meditation', 'mindfulness', 'mental health',
    'gardening', 'plants', 'sustainable living', 'eco-friendly'
  ]
  
  // Count matches with weighted scoring
  let techScore = 0
  let entertainmentScore = 0
  let sportsScore = 0
  let businessScore = 0
  let lifestyleScore = 0
  
  // Weight the matches - exact phrase matches count more
  techKeywords.forEach(keyword => {
    if (lowerQuery.includes(keyword)) {
      // Longer, more specific phrases get higher weight
      const weight = keyword.split(' ').length
      techScore += weight
    }
  })
  
  entertainmentKeywords.forEach(keyword => {
    if (lowerQuery.includes(keyword)) {
      const weight = keyword.split(' ').length
      entertainmentScore += weight
    }
  })
  
  sportsKeywords.forEach(keyword => {
    if (lowerQuery.includes(keyword)) {
      const weight = keyword.split(' ').length
      sportsScore += weight
    }
  })
  
  businessKeywords.forEach(keyword => {
    if (lowerQuery.includes(keyword)) {
      const weight = keyword.split(' ').length
      businessScore += weight
    }
  })
  
  lifestyleKeywords.forEach(keyword => {
    if (lowerQuery.includes(keyword)) {
      const weight = keyword.split(' ').length
      lifestyleScore += weight
    }
  })
  
  // Find the category with highest score
  const scores = {
    'technology': techScore,
    'entertainment': entertainmentScore,
    'sports': sportsScore,
    'business': businessScore,
    'lifestyle': lifestyleScore
  }
  
  // Get category with max score
  const maxScore = Math.max(...Object.values(scores))
  
  // If no strong match (score < 2), return world-news as default
  if (maxScore < 2) return 'world-news'
  
  // Return the category with highest score
  for (const [category, score] of Object.entries(scores)) {
    if (score === maxScore) return category
  }
  
  return 'world-news' // Default fallback
}