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
      message: trendingTopics.length === getFallbackTopics().length ? 'Using fallback topics - external APIs unavailable' : 'Live topics fetched successfully',
      source: trendingTopics.length === getFallbackTopics().length ? 'fallback' : 'live'
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
    { topic: "Latest iPhone 16 Features and Release Date", source: "Tech News", relevanceScore: 2500, category: "Technology" },
    { topic: "OpenAI GPT-5 Launch Rumors and Speculation", source: "AI News", relevanceScore: 2300, category: "Technology" },
    { topic: "Netflix New Series October 2025 Releases", source: "Entertainment", relevanceScore: 2100, category: "Entertainment" },
    { topic: "Tesla Cybertruck Production Updates", source: "Auto News", relevanceScore: 2000, category: "Technology" },
    { topic: "World Cup 2026 Qualification Updates", source: "Sports News", relevanceScore: 1900, category: "Sports" },
    { topic: "Climate Change Summit 2025 Key Outcomes", source: "World News", relevanceScore: 1800, category: "World News" },
    { topic: "Cryptocurrency Market Trends October 2025", source: "Finance", relevanceScore: 1700, category: "Business" },
    { topic: "SpaceX Mars Mission Latest Developments", source: "Space News", relevanceScore: 1600, category: "Technology" },
    { topic: "Healthy Living Trends for Winter 2025", source: "Lifestyle", relevanceScore: 1500, category: "Lifestyle" },
    { topic: "Gaming Industry Revenue Growth in 2025", source: "Gaming News", relevanceScore: 1400, category: "Entertainment" },
    { topic: "Remote Work Statistics and Future Predictions", source: "Business News", relevanceScore: 1300, category: "Business" },
    { topic: "Social Media Algorithm Changes Impact", source: "Tech News", relevanceScore: 1200, category: "Technology" },
    { topic: "Sustainable Fashion Brands Rising in 2025", source: "Fashion", relevanceScore: 1100, category: "Lifestyle" },
    { topic: "Electric Vehicle Charging Infrastructure Expansion", source: "Auto News", relevanceScore: 1000, category: "Technology" },
    { topic: "Mental Health Awareness Month Activities", source: "Health News", relevanceScore: 900, category: "Lifestyle" }
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