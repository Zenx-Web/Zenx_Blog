import axios from 'axios'
import * as cheerio from 'cheerio'

export interface TrendingTopic {
  topic: string
  source: string
  relevanceScore: number
  category?: string
  url?: string
  searchQuery?: string
}

// NEW: Search for topics based on a specific query
export async function searchTopicsByQuery(query: string, limit: number = 20): Promise<TrendingTopic[]> {
  console.log(`🔍 Searching for "${query}" across multiple sources...`)
  
  const timeoutDuration = 5000 // 5 seconds per source
  
  const fetchWithTimeout = async <T>(fetchFunction: () => Promise<T>): Promise<T> => {
    const timeoutPromise = new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Source timeout')), timeoutDuration)
    })
    
    return Promise.race([fetchFunction(), timeoutPromise])
  }
  
  // Search across multiple sources in parallel
  const [redditResults, newsResults, googleResults] = await Promise.allSettled([
    fetchWithTimeout(() => searchReddit(query)),
    fetchWithTimeout(() => searchNews(query)),
    fetchWithTimeout(() => searchGoogleTrends(query))
  ])
  
  const allResults: TrendingTopic[] = []
  
  if (redditResults.status === 'fulfilled') {
    allResults.push(...redditResults.value)
    console.log(`✓ Reddit search: ${redditResults.value.length} results`)
  } else {
    console.log(`✗ Reddit search failed: ${redditResults.reason}`)
  }
  
  if (newsResults.status === 'fulfilled') {
    allResults.push(...newsResults.value)
    console.log(`✓ News search: ${newsResults.value.length} results`)
  } else {
    console.log(`✗ News search failed: ${newsResults.reason}`)
  }
  
  if (googleResults.status === 'fulfilled') {
    allResults.push(...googleResults.value)
    console.log(`✓ Google search: ${googleResults.value.length} results`)
  } else {
    console.log(`✗ Google search failed: ${googleResults.reason}`)
  }
  
  // Remove duplicates and sort by relevance
  const uniqueResults = allResults.filter((result, index, self) => 
    index === self.findIndex((r) => 
      r.topic.toLowerCase().trim() === result.topic.toLowerCase().trim()
    )
  )
  
  console.log(`Total unique results: ${uniqueResults.length}`)
  
  return uniqueResults
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit)
}

// Search Reddit for specific query
async function searchReddit(query: string): Promise<TrendingTopic[]> {
  try {
    console.log(`Searching Reddit for "${query}"...`)
    
    const results: TrendingTopic[] = []
    
    // Detect what type of query this is and target specific subreddits
    const queryLower = query.toLowerCase()
    const targetSubreddits: string[] = []
    
    // Add category-specific subreddits based on query
    if (queryLower.includes('fitness') || queryLower.includes('workout') || queryLower.includes('exercise') || queryLower.includes('gym')) {
      targetSubreddits.push('fitness', 'loseit', 'bodyweightfitness', 'gainit')
    }
    if (queryLower.includes('health') || queryLower.includes('wellness') || queryLower.includes('diet') || queryLower.includes('nutrition')) {
      targetSubreddits.push('health', 'nutrition', 'wellness', 'healthyfood')
    }
    if (queryLower.includes('travel') || queryLower.includes('vacation') || queryLower.includes('destination')) {
      targetSubreddits.push('travel', 'solotravel', 'backpacking', 'digitalnomad')
    }
    if (queryLower.includes('food') || queryLower.includes('cooking') || queryLower.includes('recipe')) {
      targetSubreddits.push('food', 'cooking', 'recipes', 'eatcheapandhealthy')
    }
    if (queryLower.includes('fashion') || queryLower.includes('style')) {
      targetSubreddits.push('fashion', 'malefashionadvice', 'femalefashionadvice')
    }
    
    // If we have targeted subreddits, search them directly first
    if (targetSubreddits.length > 0) {
      for (const subreddit of targetSubreddits.slice(0, 3)) {
        try {
          const response = await axios.get(`https://www.reddit.com/r/${subreddit}/search.json`, {
            params: {
              q: query,
              restrict_sr: true,
              sort: 'relevance',
              limit: 10,
              t: 'month'
            },
            timeout: 2000,
            headers: {
              'User-Agent': 'ZenxBlog/1.0'
            }
          })
          
          const posts = response.data.data.children
          posts.forEach(({ data }: any) => {
            if (data.title && data.title.length > 15) {
              results.push({
                topic: cleanTopicTitle(data.title),
                source: `Reddit r/${subreddit}`,
                relevanceScore: calculateRelevanceScore(data.score, data.num_comments),
                category: getCategoryFromSubreddit(subreddit),
                url: `https://reddit.com${data.permalink}`,
                searchQuery: query
              })
            }
          })
        } catch (err) {
          console.warn(`Targeted search failed for r/${subreddit}`)
        }
      }
    }
    
    // Try multiple time ranges to get more results from general search
    const timeRanges = ['day', 'week', 'month']
    
    for (const timeRange of timeRanges) {
      try {
        const response = await axios.get(`https://www.reddit.com/search.json`, {
          params: {
            q: query,
            sort: 'relevance', // Changed from 'hot' to 'relevance' for better matching
            limit: 25,
            t: timeRange
          },
          timeout: 3000,
          headers: {
            'User-Agent': 'ZenxBlog/1.0 (Web Scraper for trending topics)'
          }
        })
        
        const posts: Array<{ data: { title: string; score: number; subreddit: string; permalink: string; num_comments: number } }> = 
          response.data.data.children
        
        const validPosts = posts
          .filter(({ data }) => data.title && data.title.length > 15)
          .map(({ data }) => ({
            topic: cleanTopicTitle(data.title),
            source: `Reddit r/${data.subreddit}`,
            relevanceScore: calculateRelevanceScore(data.score, data.num_comments),
            category: getCategoryFromSubreddit(data.subreddit),
            url: `https://reddit.com${data.permalink}`,
            searchQuery: query
          }))
        
        results.push(...validPosts)
        
        // If we got enough results, break early
        if (results.length >= 20) break
      } catch (err) {
        console.warn(`Reddit search failed for timeRange ${timeRange}:`, err)
        continue
      }
    }
    
    return results
  } catch (error) {
    console.warn('Reddit search failed:', error instanceof Error ? error.message : 'Unknown error')
    return []
  }
}

// Search news sources for specific query
async function searchNews(query: string): Promise<TrendingTopic[]> {
  try {
    console.log(`Searching news for "${query}"...`)
    
    const results: TrendingTopic[] = []
    
    // Try NewsAPI first if available
    if (process.env.NEWS_API_KEY) {
      try {
        const response = await axios.get('https://newsapi.org/v2/everything', {
          params: {
            q: query,
            sortBy: 'relevancy', // Changed to relevancy for better matches
            pageSize: 30,
            language: 'en',
            apiKey: process.env.NEWS_API_KEY
          },
          timeout: 4000
        })
        
        const articles: Array<{ title: string; url: string; source: { name: string }; publishedAt: string }> = 
          response.data.articles
        
        results.push(...articles.map((article, index) => ({
          topic: cleanTopicTitle(article.title),
          source: article.source.name || 'News',
          relevanceScore: 1800 - (index * 30), // Decreasing score by position
          category: getCategoryFromNews(article.title),
          url: article.url,
          searchQuery: query
        })))
      } catch (err) {
        console.warn('NewsAPI search failed:', err)
      }
    }
    
    // Always try Google News as fallback/supplement
    try {
      const googleNewsResults = await searchGoogleNews(query)
      results.push(...googleNewsResults)
    } catch (err) {
      console.warn('Google News search failed:', err)
    }
    
    return results
  } catch (error) {
    console.warn('News search failed:', error instanceof Error ? error.message : 'Unknown error')
    return []
  }
}

// Search Google News RSS
async function searchGoogleNews(query: string): Promise<TrendingTopic[]> {
  try {
    console.log(`Searching Google News for "${query}"...`)
    
    const encodedQuery = encodeURIComponent(query)
    const response = await axios.get(
      `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`,
      {
        timeout: 4000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    )
    
    const $ = cheerio.load(response.data, { xmlMode: true })
    const topics: TrendingTopic[] = []
    
    $('item').each((index, element) => {
      const title = $(element).find('title').text()
      const link = $(element).find('link').text()
      const source = $(element).find('source').text() || 'Google News'
      
      if (title && title.length > 15) {
        topics.push({
          topic: cleanTopicTitle(title),
          source: source,
          relevanceScore: 1200 - (index * 30),
          category: getCategoryFromNews(title),
          url: link,
          searchQuery: query
        })
      }
    })
    
    return topics.slice(0, 15)
  } catch (error) {
    console.warn('Google News search failed:', error instanceof Error ? error.message : 'Unknown error')
    return []
  }
}

// Search Google Trends for related queries
async function searchGoogleTrends(query: string): Promise<TrendingTopic[]> {
  try {
    console.log(`Searching Google Trends for "${query}"...`)
    
    // Get current trending searches that might be related
    const response = await axios.get('https://trends.google.com/trends/trendingsearches/daily/rss?geo=US', {
      timeout: 4000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    const $ = cheerio.load(response.data, { xmlMode: true })
    const topics: TrendingTopic[] = []
    
    const queryLower = query.toLowerCase()
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2)
    
    $('item').each((_, element) => {
      const title = $(element).find('title').text()
      const traffic = $(element).find('ht\\:approx_traffic').text()
      const link = $(element).find('link').text()
      
      if (title && title !== 'Trending searches') {
        const titleLower = title.toLowerCase()
        
        // Check if the trend is related to the query
        const isRelated = queryWords.some(word => titleLower.includes(word)) || 
                          titleLower.includes(queryLower)
        
        if (isRelated) {
          topics.push({
            topic: cleanTopicTitle(title),
            source: 'Google Trends',
            relevanceScore: parseInt(traffic?.replace(/[,+]/g, '') || '2000'),
            category: getCategoryFromNews(title),
            url: link,
            searchQuery: query
          })
        }
      }
    })
    
    return topics
  } catch (error) {
    console.warn('Google Trends search failed:', error instanceof Error ? error.message : 'Unknown error')
    return []
  }
}

// Clean topic titles
function cleanTopicTitle(title: string): string {
  // Remove source tags like "- CNN", "| Reuters", etc.
  let cleaned = title.replace(/\s*[-|]\s*[A-Z]{2,}\s*$/, '')
  
  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  
  // Remove trailing ellipsis or dashes
  cleaned = cleaned.replace(/[.\-…]+$/, '')
  
  return cleaned
}

// Calculate relevance score based on engagement
function calculateRelevanceScore(upvotes: number, comments: number): number {
  // Reddit algorithm: upvotes are worth more than comments
  return Math.round((upvotes * 1.5) + (comments * 0.5))
}

// Fetch trending topics from Google Trends (using web scraping)
export async function fetchGoogleTrends(): Promise<TrendingTopic[]> {
  try {
    console.log('Attempting to fetch Google Trends...')
    const response = await axios.get('https://trends.google.com/trends/trendingsearches/daily/rss?geo=US', {
      timeout: 5000, // 5 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    const $ = cheerio.load(response.data, { xmlMode: true })
    
    const trends: TrendingTopic[] = []
    
    $('item').each((_, element) => {
      const title = $(element).find('title').text()
      const traffic = $(element).find('ht\\:approx_traffic').text()
      
      if (title && title !== 'Trending searches') {
        trends.push({
          topic: title,
          source: 'Google Trends',
          relevanceScore: parseInt(traffic?.replace(/[,+]/g, '') || '1000'),
          url: $(element).find('link').text()
        })
      }
    })
    
    console.log(`Fetched ${trends.length} topics from Google Trends`)
    return trends.slice(0, 20) // Top 20 trends
  } catch (error) {
    console.warn('Google Trends unavailable:', error instanceof Error ? error.message : 'Unknown error')
    return []
  }
}

// Fetch trending topics from Reddit
export async function fetchRedditTrends(): Promise<TrendingTopic[]> {
  try {
    console.log('Attempting to fetch Reddit trends...')
    const subreddits = ['all', 'worldnews', 'technology', 'entertainment', 'business']
    const trends: TrendingTopic[] = []
    
    for (const subreddit of subreddits) {
      try {
        const response = await axios.get(`https://www.reddit.com/r/${subreddit}/hot.json?limit=10`, {
          timeout: 3000, // 3 second timeout per subreddit
          headers: {
            'User-Agent': 'ZenxBlog/1.0 (Web Scraper for trending topics)'
          }
        })
        
        const posts: Array<{ data: { title: string; score: number; permalink: string } }> = response.data.data.children
        
        posts.forEach(({ data }) => {
          if (data.title && data.title.length > 10) { // Filter out very short titles
            trends.push({
              topic: data.title,
              source: `Reddit r/${subreddit}`,
              relevanceScore: data.score,
              category: getCategoryFromSubreddit(subreddit),
              url: `https://reddit.com${data.permalink}`
            })
          }
        })
        
        console.log(`Fetched ${posts.length} posts from r/${subreddit}`)
      } catch (subredditError) {
        console.warn(`Failed to fetch from r/${subreddit}:`, subredditError instanceof Error ? subredditError.message : 'Unknown error')
        continue // Continue with other subreddits
      }
    }
    
    console.log(`Total Reddit trends fetched: ${trends.length}`)
    return trends.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 30)
  } catch (error) {
    console.warn('Reddit API unavailable:', error instanceof Error ? error.message : 'Unknown error')
    return []
  }
}

// Fetch trending topics from News API
export async function fetchNewsTrends(): Promise<TrendingTopic[]> {
  if (!process.env.NEWS_API_KEY) {
    console.warn('News API key not provided')
    return []
  }
  
  try {
    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        country: 'us',
        pageSize: 20,
        apiKey: process.env.NEWS_API_KEY
      }
    })
    
    const articles: Array<{ title: string; url: string }> = response.data.articles
    const trends: TrendingTopic[] = articles.map((article) => ({
      topic: article.title,
      source: 'News API',
      relevanceScore: 1000, // Default score for news
      category: getCategoryFromNews(article.title),
      url: article.url
    }))
    
    return trends
  } catch (error) {
    console.error('Error fetching news trends:', error)
    return []
  }
}

// Fetch trending hashtags from Twitter (using web scraping as backup)
export async function fetchTwitterTrends(): Promise<TrendingTopic[]> {
  try {
    // This is a simplified version - in production, you'd use Twitter API v2
    const response = await axios.get('https://getdaytrends.com/united-states/')
    const $ = cheerio.load(response.data)
    
    const trends: TrendingTopic[] = []
    
    $('.trend-card__title').each((_, element) => {
      const topic = $(element).text().trim()
      if (topic) {
        trends.push({
          topic: topic,
          source: 'Twitter Trends',
          relevanceScore: 500, // Default score
          category: 'trending'
        })
      }
    })
    
    return trends.slice(0, 15)
  } catch (error) {
    console.error('Error fetching Twitter trends:', error)
    return []
  }
}

// Main function to fetch all trending topics
export async function fetchAllTrendingTopics(): Promise<TrendingTopic[]> {
  console.log('Fetching trending topics from all sources...')
  
  // Set individual timeouts for each source
  const timeoutDuration = 4000 // 4 seconds per source
  
  const fetchWithTimeout = async <T>(fetchFunction: () => Promise<T>): Promise<T> => {
    const timeoutPromise = new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Source timeout')), timeoutDuration)
    })
    
    return Promise.race([fetchFunction(), timeoutPromise])
  }
  
  // Fetch category-specific topics to ensure variety
  const [
    googleTrends, 
    redditTrends, 
    newsTrends, 
    twitterTrends,
    entertainmentTopics,
    lifestyleTopics,
    sportsTopics,
    businessTopics,
    techTopics
  ] = await Promise.allSettled([
    fetchWithTimeout(() => fetchGoogleTrends()),
    fetchWithTimeout(() => fetchRedditTrends()),
    fetchWithTimeout(() => fetchNewsTrends()),
    fetchWithTimeout(() => fetchTwitterTrends()),
    fetchWithTimeout(() => fetchCategoryTopics('entertainment')),
    fetchWithTimeout(() => fetchCategoryTopics('lifestyle')),
    fetchWithTimeout(() => fetchCategoryTopics('sports')),
    fetchWithTimeout(() => fetchCategoryTopics('business')),
    fetchWithTimeout(() => fetchCategoryTopics('technology'))
  ])
  
  const allTrends: TrendingTopic[] = []
  let successfulSources = 0
  
  // Combine all successful results
  if (googleTrends.status === 'fulfilled') {
    allTrends.push(...googleTrends.value)
    successfulSources++
    console.log(`✓ Google Trends: ${googleTrends.value.length} topics`)
  } else {
    console.log(`✗ Google Trends failed: ${googleTrends.reason}`)
  }
  
  if (redditTrends.status === 'fulfilled') {
    allTrends.push(...redditTrends.value)
    successfulSources++
    console.log(`✓ Reddit: ${redditTrends.value.length} topics`)
  } else {
    console.log(`✗ Reddit failed: ${redditTrends.reason}`)
  }
  
  if (newsTrends.status === 'fulfilled') {
    allTrends.push(...newsTrends.value)
    successfulSources++
    console.log(`✓ News API: ${newsTrends.value.length} topics`)
  } else {
    console.log(`✗ News API failed: ${newsTrends.reason}`)
  }
  
  if (twitterTrends.status === 'fulfilled') {
    allTrends.push(...twitterTrends.value)
    successfulSources++
    console.log(`✓ Twitter: ${twitterTrends.value.length} topics`)
  } else {
    console.log(`✗ Twitter failed: ${twitterTrends.reason}`)
  }
  
  // Add category-specific topics
  if (entertainmentTopics.status === 'fulfilled') {
    allTrends.push(...entertainmentTopics.value)
    console.log(`✓ Entertainment: ${entertainmentTopics.value.length} topics`)
  }
  
  if (lifestyleTopics.status === 'fulfilled') {
    allTrends.push(...lifestyleTopics.value)
    console.log(`✓ Lifestyle: ${lifestyleTopics.value.length} topics`)
  }
  
  if (sportsTopics.status === 'fulfilled') {
    allTrends.push(...sportsTopics.value)
    console.log(`✓ Sports: ${sportsTopics.value.length} topics`)
  }
  
  if (businessTopics.status === 'fulfilled') {
    allTrends.push(...businessTopics.value)
    console.log(`✓ Business: ${businessTopics.value.length} topics`)
  }
  
  if (techTopics.status === 'fulfilled') {
    allTrends.push(...techTopics.value)
    console.log(`✓ Technology: ${techTopics.value.length} topics`)
  }
  
  console.log(`Successfully fetched from sources, total topics: ${allTrends.length}`)
  
  // Remove duplicates and sort by relevance
  const uniqueTrends = allTrends.filter((trend, index, self) => 
    index === self.findIndex((t) => t.topic.toLowerCase() === trend.topic.toLowerCase())
  )
  
  console.log(`After deduplication: ${uniqueTrends.length} unique topics`)
  
  return uniqueTrends
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 50) // Top 50 trending topics
}

// Fetch category-specific topics from Reddit
async function fetchCategoryTopics(category: string): Promise<TrendingTopic[]> {
  const subredditMap: { [key: string]: string[] } = {
    'entertainment': ['movies', 'television', 'music', 'netflix', 'entertainment', 'celebrity'],
    'lifestyle': ['fitness', 'health', 'food', 'cooking', 'travel', 'fashion', 'beauty'],
    'sports': ['sports', 'nfl', 'nba', 'soccer', 'football', 'basketball'],
    'business': ['business', 'stocks', 'investing', 'entrepreneur', 'finance'],
    'technology': ['technology', 'programming', 'gaming', 'pcgaming', 'gadgets']
  }
  
  const subreddits = subredditMap[category] || []
  if (subreddits.length === 0) return []
  
  try {
    const topics: TrendingTopic[] = []
    
    // Fetch from multiple subreddits for this category
    for (const subreddit of subreddits.slice(0, 3)) {
      try {
        const response = await axios.get(`https://www.reddit.com/r/${subreddit}/hot.json`, {
          params: { limit: 10 },
          timeout: 2000,
          headers: {
            'User-Agent': 'ZenxBlog/1.0'
          }
        })
        
        const posts = response.data.data.children
        posts.forEach(({ data }: any) => {
          if (data.title && data.title.length > 15) {
            topics.push({
              topic: cleanTopicTitle(data.title),
              source: `Reddit r/${subreddit}`,
              relevanceScore: calculateRelevanceScore(data.score, data.num_comments),
              category: category.charAt(0).toUpperCase() + category.slice(1),
              url: `https://reddit.com${data.permalink}`
            })
          }
        })
      } catch (err) {
        console.warn(`Failed to fetch from r/${subreddit}`)
      }
    }
    
    return topics.slice(0, 5) // Top 5 per category
  } catch (error) {
    console.warn(`Category fetch failed for ${category}:`, error)
    return []
  }
}

// Helper function to categorize topics from subreddit
function getCategoryFromSubreddit(subreddit: string): string {
  const lower = subreddit.toLowerCase()
  
  // Technology subreddits
  if (['technology', 'tech', 'programming', 'coding', 'apple', 'android', 'microsoft',
       'google', 'linux', 'gaming', 'pcgaming', 'ps5', 'xbox', 'nintendo',
       'cryptocurrency', 'bitcoin', 'ethereum', 'artificialintelligence', 'machinelearning'].includes(lower)) {
    return 'Technology'
  }
  
  // Entertainment subreddits
  if (['entertainment', 'movies', 'television', 'music', 'celebrity', 'popculture',
       'netflix', 'anime', 'marvel', 'starwars', 'memes', 'funny', 'videos'].includes(lower)) {
    return 'Entertainment'
  }
  
  // Sports subreddits
  if (['sports', 'nfl', 'nba', 'soccer', 'football', 'baseball', 'hockey',
       'tennis', 'golf', 'mma', 'boxing', 'formula1', 'cricket'].includes(lower)) {
    return 'Sports'
  }
  
  // Business subreddits
  if (['business', 'finance', 'investing', 'stocks', 'wallstreetbets', 'entrepreneur',
       'smallbusiness', 'marketing', 'economics', 'personalfinance'].includes(lower)) {
    return 'Business'
  }
  
  // Lifestyle subreddits
  if (['health', 'fitness', 'loseit', 'bodyweightfitness', 'food', 'cooking', 'recipes', 'travel', 'fashion',
       'beauty', 'wellness', 'meditation', 'yoga', 'gardening', 'diy', 'interiordesign', 'homeimprovement'].includes(lower)) {
    return 'Lifestyle'
  }
  
  // News/World subreddits
  if (['worldnews', 'news', 'politics', 'science', 'space', 'environment', 'climate'].includes(lower)) {
    return 'World News'
  }
  
  return 'General'
}

// Helper function to categorize topics from news content - ENHANCED with priority checking
function getCategoryFromNews(title: string): string {
  const lowerTitle = title.toLowerCase()
  
  // Priority keywords for news/politics - check these FIRST
  const priorityNewsKeywords = [
    'judge', 'court', 'federal', 'government', 'law', 'legal', 'congress', 'senate',
    'president', 'minister', 'election', 'vote', 'policy', 'legislation',
    'military', 'army', 'navy', 'national guard', 'deployment', 'war', 'conflict',
    'climate crisis', 'pandemic', 'covid', 'vaccine', 'emergency', 'disaster', 'crime', 'police'
  ]
  
  // If it's clearly news/politics, return immediately unless it's tech-related news
  const hasNewsKeywords = priorityNewsKeywords.some(keyword => lowerTitle.includes(keyword))
  if (hasNewsKeywords) {
    const techNewsKeywords = ['tech policy', 'ai regulation', 'crypto law']
    const isTechNews = techNewsKeywords.some(keyword => lowerTitle.includes(keyword))
    if (!isTechNews) {
      return 'World News'
    }
  }
  
  // Weighted scoring - longer, more specific phrases get higher scores
  let techScore = 0
  let entertainmentScore = 0
  let sportsScore = 0
  let businessScore = 0
  let lifestyleScore = 0
  
  // Technology keywords - more specific
  const techWords = ['ai', 'artificial intelligence', 'machine learning', 'chatgpt',
                     'software', 'app', 'programming', 'coding', 'digital',
                     'iphone', 'android', 'smartphone', 'google', 'microsoft', 'apple',
                     'crypto', 'bitcoin', 'blockchain', 'gaming', 'playstation', 'xbox',
                     'robot', 'automation', 'cloud', 'cybersecurity', 'hacking']
  techWords.forEach(word => { 
    if (lowerTitle.includes(word)) {
      const weight = word.split(' ').length
      techScore += weight
    }
  })
  
  // Entertainment keywords - specific
  const entertainmentWords = ['movie', 'film', 'cinema', 'actor', 'actress', 'celebrity',
                             'music', 'album', 'concert', 'singer', 'artist',
                             'tv show', 'series', 'netflix', 'disney', 'streaming',
                             'marvel', 'award', 'grammy', 'oscar', 'fashion', 'beauty']
  entertainmentWords.forEach(word => { 
    if (lowerTitle.includes(word)) {
      const weight = word.split(' ').length
      entertainmentScore += weight
    }
  })
  
  // Sports keywords - specific
  const sportsWords = ['football', 'soccer', 'basketball', 'baseball', 'tennis', 'golf',
                      'nfl', 'nba', 'mlb', 'fifa', 'olympics', 'championship',
                      'player', 'team', 'coach', 'match', 'tournament', 'league']
  sportsWords.forEach(word => { 
    if (lowerTitle.includes(word)) {
      const weight = word.split(' ').length
      sportsScore += weight
    }
  })
  
  // Business keywords - specific
  const businessWords = ['stock market', 'wall street', 'trading', 'investment',
                        'startup', 'ipo', 'merger', 'acquisition', 'ceo', 'founder',
                        'economy', 'inflation', 'recession', 'finance', 'banking',
                        'revenue', 'profit', 'earnings']
  businessWords.forEach(word => { 
    if (lowerTitle.includes(word)) {
      const weight = word.split(' ').length
      businessScore += weight
    }
  })
  
  // Lifestyle keywords - specific and comprehensive
  const lifestyleWords = ['health tips', 'wellness', 'wellbeing', 'self-care',
                         'fitness', 'workout', 'exercise', 'gym', 'training',
                         'diet', 'nutrition', 'weight loss', 'healthy eating',
                         'recipe', 'cooking', 'food', 'meal prep',
                         'travel', 'vacation', 'destination', 'tourism',
                         'home decor', 'interior design', 'diy',
                         'yoga', 'meditation', 'mindfulness',
                         'parenting', 'family', 'relationship',
                         'sustainable living', 'eco-friendly']
  lifestyleWords.forEach(word => { 
    if (lowerTitle.includes(word)) {
      const weight = word.split(' ').length
      lifestyleScore += weight
    }
  })
  
  // Find max score
  const maxScore = Math.max(techScore, entertainmentScore, sportsScore, businessScore, lifestyleScore)
  
  // If no strong match (score < 2), return World News
  if (maxScore < 2) return 'World News'
  
  if (techScore === maxScore) return 'Technology'
  if (entertainmentScore === maxScore) return 'Entertainment'
  if (sportsScore === maxScore) return 'Sports'
  if (businessScore === maxScore) return 'Business'
  if (lifestyleScore === maxScore) return 'Lifestyle'
  
  return 'World News'
}

// Function to score topic relevance for blog potential
export function scoreTopicForBlog(topic: TrendingTopic): number {
  let score = topic.relevanceScore
  
  // Boost score for certain categories
  const categoryBoosts: { [key: string]: number } = {
    'Technology': 1.3,
    'Entertainment': 1.2,
    'Business': 1.1,
    'Sports': 1.1,
    'World News': 1.0
  }
  
  if (topic.category && categoryBoosts[topic.category]) {
    score *= categoryBoosts[topic.category]
  }
  
  // Boost score for certain sources
  const sourceBoosts: { [key: string]: number } = {
    'Google Trends': 1.2,
    'Reddit r/all': 1.1,
    'News API': 1.0
  }
  
  if (sourceBoosts[topic.source]) {
    score *= sourceBoosts[topic.source]
  }
  
  return Math.round(score)
}