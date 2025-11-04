import { NextResponse } from 'next/server'
import { fetchAllTrendingTopics, scoreTopicForBlog, TrendingTopic } from '@/lib/trending'
import { supabaseAdmin } from '@/lib/supabase'
import { ensureAdminApiAccess } from '@/lib/auth'

export async function GET() {
  try {
    const session = await ensureAdminApiAccess()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fetching trending topics from external APIs...')
    
    // Set a timeout for external API calls
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('API timeout')), 10000) // 10 second timeout
    })

  let trendingTopics: TrendingTopic[] = []
  let usedFallback = false

    try {
      // Race between API calls and timeout
      const potentialTopics = await Promise.race([fetchAllTrendingTopics(), timeoutPromise])

      if (isTrendingTopicList(potentialTopics)) {
        trendingTopics = potentialTopics
      } else {
        throw new Error('Invalid topics payload received')
      }

      console.log(`Fetched ${trendingTopics.length} topics from external APIs`)
    } catch (apiError) {
      console.warn('External API calls failed or timed out:', apiError)
      trendingTopics = []
    }
    
    // If no topics found from external APIs, use fallback topics
    if (trendingTopics.length === 0) {
      console.log('No external topics found, using fallback topics')
      trendingTopics = getFallbackTopics()
      usedFallback = true
    }
    
    // Score topics for blog potential
    const scoredTopics = trendingTopics.map(topic => ({
      ...topic,
      blogScore: scoreTopicForBlog(topic)
    })).sort((a, b) => b.blogScore - a.blogScore)
    
    // Store in database for tracking (non-blocking)
    try {
      for (const topic of scoredTopics.slice(0, 20)) {
        await supabaseAdmin
          .from('trending_topics')
          .upsert({
            topic: topic.topic,
            source: topic.source,
            relevance_score: topic.blogScore,
            used: false
          }, {
            onConflict: 'topic,source',
            ignoreDuplicates: true
          })
      }
      console.log('Successfully stored topics in database')
    } catch (dbError) {
      console.warn('Database storage failed, continuing without storage:', dbError)
    }
    
    console.log(`Returning ${scoredTopics.length} trending topics`)
    
    return NextResponse.json({
      success: true,
      topics: scoredTopics.slice(0, 30),
      message: usedFallback ? 'Using fallback topics - external APIs unavailable' : 'Live topics fetched successfully',
      source: usedFallback ? 'fallback' : 'live'
    })
  } catch (error) {
    console.error('Critical error in trending topics API:', error)
    
    // Always return fallback topics even on critical error
    const fallbackTopics = getFallbackTopics()
    const scoredFallback = fallbackTopics.map(topic => ({
      ...topic,
      blogScore: scoreTopicForBlog(topic)
    })).sort((a, b) => b.blogScore - a.blogScore)
    
    return NextResponse.json({
      success: true,
      topics: scoredFallback,
      message: 'Using fallback topics due to system error',
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Fallback topics for when external APIs fail
function getFallbackTopics(): TrendingTopic[] {
  return [
    // Entertainment (5 topics)
    { topic: "Netflix New Series November 2025 Must-Watch Shows", source: "Entertainment", relevanceScore: 2500, category: "Entertainment" },
    { topic: "Taylor Swift Eras Tour 2025 Final Concerts", source: "Music", relevanceScore: 2400, category: "Entertainment" },
    { topic: "Marvel Phase 6 Movie Release Schedule Revealed", source: "Movies", relevanceScore: 2300, category: "Entertainment" },
    { topic: "Grammy Awards 2025 Predictions and Favorites", source: "Music", relevanceScore: 2200, category: "Entertainment" },
    { topic: "Top Trending TikTok Challenges This Week", source: "Social Media", relevanceScore: 2100, category: "Entertainment" },
    
    // Lifestyle (5 topics)
    { topic: "Winter 2025 Fashion Trends You Need to Know", source: "Fashion", relevanceScore: 2000, category: "Lifestyle" },
    { topic: "Best Healthy Meal Prep Ideas for Busy People", source: "Health", relevanceScore: 1900, category: "Lifestyle" },
    { topic: "Top Travel Destinations for Winter Holidays 2025", source: "Travel", relevanceScore: 1800, category: "Lifestyle" },
    { topic: "Morning Routine Habits of Successful People", source: "Wellness", relevanceScore: 1700, category: "Lifestyle" },
    { topic: "Home Decor Ideas to Refresh Your Space in 2025", source: "Home", relevanceScore: 1600, category: "Lifestyle" },
    
    // Technology (5 topics)
    { topic: "iPhone 16 Pro Max Features and Release Date", source: "Tech News", relevanceScore: 2600, category: "Technology" },
    { topic: "OpenAI GPT-5 Rumors and Expected Capabilities", source: "AI News", relevanceScore: 2500, category: "Technology" },
    { topic: "Tesla Cybertruck 2025 Production Updates", source: "Auto Tech", relevanceScore: 2400, category: "Technology" },
    { topic: "PlayStation 6 Development Leaks and Specs", source: "Gaming", relevanceScore: 2300, category: "Technology" },
    { topic: "Best Gaming Laptops Under $1500 in 2025", source: "Gaming Tech", relevanceScore: 2200, category: "Technology" },
    
    // Sports (5 topics)
    { topic: "World Cup 2026 Qualification Latest Results", source: "Soccer", relevanceScore: 2100, category: "Sports" },
    { topic: "NBA Season 2025-26 Championship Predictions", source: "Basketball", relevanceScore: 2000, category: "Sports" },
    { topic: "NFL Playoffs 2025 Teams and Predictions", source: "Football", relevanceScore: 1900, category: "Sports" },
    { topic: "Cristiano Ronaldo Latest Transfer News", source: "Soccer", relevanceScore: 1800, category: "Sports" },
    { topic: "Olympics 2026 Winter Games Preparation Updates", source: "Olympics", relevanceScore: 1700, category: "Sports" },
    
    // Business (5 topics)
    { topic: "Stock Market Trends November 2025 Analysis", source: "Finance", relevanceScore: 1900, category: "Business" },
    { topic: "Cryptocurrency Market Recovery 2025 Outlook", source: "Crypto", relevanceScore: 1800, category: "Business" },
    { topic: "Remote Work vs Office Return Debate in 2025", source: "Business News", relevanceScore: 1700, category: "Business" },
    { topic: "Top Startup Success Stories of 2025", source: "Entrepreneurship", relevanceScore: 1600, category: "Business" },
    { topic: "Best Side Hustles to Start in 2025", source: "Finance", relevanceScore: 1500, category: "Business" },
    
    // World News (5 topics)
    { topic: "Climate Change Summit 2025 Key Decisions", source: "World News", relevanceScore: 1800, category: "World News" },
    { topic: "Global Economy Outlook for 2026", source: "Economics", relevanceScore: 1700, category: "World News" },
    { topic: "Space Exploration 2025 Major Achievements", source: "Science", relevanceScore: 1600, category: "World News" },
    { topic: "Renewable Energy Breakthroughs in 2025", source: "Environment", relevanceScore: 1500, category: "World News" },
    { topic: "AI Regulation Policies Around the World", source: "Technology Policy", relevanceScore: 1400, category: "World News" }
  ]
}

function isTrendingTopicList(value: unknown): value is TrendingTopic[] {
  return Array.isArray(value) && value.every((item) => {
    return (
      typeof item === 'object' &&
      item !== null &&
      'topic' in item &&
      typeof (item as { topic: unknown }).topic === 'string' &&
      'source' in item &&
      typeof (item as { source: unknown }).source === 'string' &&
      'relevanceScore' in item &&
      typeof (item as { relevanceScore: unknown }).relevanceScore === 'number'
    )
  })
}