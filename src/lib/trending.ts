import axios from 'axios'
import * as cheerio from 'cheerio'

export interface TrendingTopic {
  topic: string
  source: string
  relevanceScore: number
  category?: string
  url?: string
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
  
  const [googleTrends, redditTrends, newsTrends, twitterTrends] = await Promise.allSettled([
    fetchWithTimeout(() => fetchGoogleTrends()),
    fetchWithTimeout(() => fetchRedditTrends()),
    fetchWithTimeout(() => fetchNewsTrends()),
    fetchWithTimeout(() => fetchTwitterTrends())
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
  
  console.log(`Successfully fetched from ${successfulSources}/4 sources, total topics: ${allTrends.length}`)
  
  // Remove duplicates and sort by relevance
  const uniqueTrends = allTrends.filter((trend, index, self) => 
    index === self.findIndex((t) => t.topic.toLowerCase() === trend.topic.toLowerCase())
  )
  
  console.log(`After deduplication: ${uniqueTrends.length} unique topics`)
  
  return uniqueTrends
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 50) // Top 50 trending topics
}

// Helper function to categorize topics from subreddit
function getCategoryFromSubreddit(subreddit: string): string {
  const categoryMap: { [key: string]: string } = {
    'technology': 'Technology',
    'worldnews': 'World News',
    'entertainment': 'Entertainment',
    'business': 'Business',
    'sports': 'Sports',
    'all': 'General'
  }
  
  return categoryMap[subreddit] || 'General'
}

// Helper function to categorize topics from news content
function getCategoryFromNews(title: string): string {
  const lowerTitle = title.toLowerCase()
  
  if (lowerTitle.includes('tech') || lowerTitle.includes('ai') || lowerTitle.includes('software')) {
    return 'Technology'
  } else if (lowerTitle.includes('business') || lowerTitle.includes('market') || lowerTitle.includes('economy')) {
    return 'Business'
  } else if (lowerTitle.includes('sports') || lowerTitle.includes('game') || lowerTitle.includes('player')) {
    return 'Sports'
  } else if (lowerTitle.includes('movie') || lowerTitle.includes('celebrity') || lowerTitle.includes('music')) {
    return 'Entertainment'
  } else {
    return 'World News'
  }
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