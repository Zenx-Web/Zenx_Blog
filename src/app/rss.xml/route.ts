import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Get latest 20 published blog posts
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('title, slug, excerpt, published_at, category')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(20)

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://imzenx.in'
    
    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Zenx Blog - Hot Topics &amp; Trending News</title>
    <description>Stay updated with the latest trending topics, hot news, and viral content. AI-powered blog covering technology, entertainment, business, and more.</description>
    <link>${baseUrl}</link>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    
    ${posts?.map(post => {
      const publishedAt = post.published_at ? new Date(post.published_at).toUTCString() : new Date().toUTCString()
      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.excerpt}]]></description>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid>${baseUrl}/blog/${post.slug}</guid>
      <pubDate>${publishedAt}</pubDate>
      <category>${post.category}</category>
    </item>`
    }).join('') || ''}
  </channel>
</rss>`

    return new Response(rssFeed, {
      headers: {
        'Content-Type': 'application/rss+xml',
        'Cache-Control': 'public, max-age=3600, revalidate=86400'
      }
    })
  } catch (error) {
    console.error('Error generating RSS feed:', error)
    return NextResponse.json(
      { error: 'Failed to generate RSS feed' },
      { status: 500 }
    )
  }
}