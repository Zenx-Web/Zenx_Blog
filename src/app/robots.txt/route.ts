export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://imzenx.in'
  
  const robotsTxt = `User-agent: *
Allow: /

# Important pages
Allow: /blog/
Allow: /sitemap.xml

# Admin and API routes - disallow
Disallow: /admin/
Disallow: /api/

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for being respectful
Crawl-delay: 1`

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400'
    }
  })
}