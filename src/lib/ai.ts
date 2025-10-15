import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

export interface BlogGenerationOptions {
  topic: string
  category: string
  tone: 'professional' | 'casual' | 'engaging' | 'informative' | 'interactive'
  length: 'short' | 'medium' | 'long' | 'very-long'
  includeImages: boolean
  seoOptimized: boolean
}

export interface GeneratedBlog {
  title: string
  content: string
  excerpt: string
  seoTitle: string
  seoDescription: string
  tags: string[]
  readTime: number
  images?: Array<{
    description: string
    alt: string
    placement: string
    caption: string
  }>
  interactiveElements?: Array<{
    type: string
    title: string
    content: string
  }>
}

// Generate blog post using ChatGPT
const PRIMARY_OPENAI_MODEL = 'gpt-4o-mini'
const FALLBACK_OPENAI_MODEL = 'gpt-3.5-turbo'

function parseGeneratedBlogJson(raw: string): GeneratedBlog {
  let content = raw.trim()

  if (content.startsWith('```')) {
    content = content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  }

  try {
    return JSON.parse(content) as GeneratedBlog
  } catch (error) {
    const match = content.match(/\{[\s\S]*\}/)
    if (match) {
      return JSON.parse(match[0]) as GeneratedBlog
    }

    throw error
  }
}

async function requestChatCompletion(model: string, prompt: string) {
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: "You are an expert content writer specializing in trending topics and SEO-optimized blog posts. Always respond with valid JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
  })

  const response = completion.choices[0].message.content
  if (!response) throw new Error(`No response from ChatGPT (${model})`)

  return parseGeneratedBlogJson(response)
}

export async function generateBlogWithChatGPT(options: BlogGenerationOptions): Promise<GeneratedBlog> {
  const { topic, category, tone, length, seoOptimized } = options

  const lengthWords = {
    short: '800-1200',
    medium: '1500-2000',
    long: '2500-3500',
    'very-long': '12000-15000'
  }

  const prompt = `Create a comprehensive, interactive blog post about "${topic}" for the ${category} category.

Requirements:
- Tone: ${tone}
- Length: ${lengthWords[length]} words
- SEO optimized: ${seoOptimized}
- Include trending keywords naturally
- Make it highly engaging and shareable
- Include practical insights and actionable advice
- Structure with clear headings and subheadings
- MUST include detailed comparison tables where relevant
- MUST include statistical data tables
- MUST include step-by-step guides with numbered lists
- Add relevant infographic suggestions
- Include interactive elements like polls, quizzes, or checklists
- Use rich formatting: bold, italic, quotes, code blocks
- Add call-to-action sections
- Include expert quotes or case studies

IMPORTANT: Format the content with HTML for better styling:
- Use proper HTML table tags for detailed tables with styling classes
- Include divs with classes for special sections
- Add styling for interactive elements
- Use semantic HTML5 tags

Include 3-5 relevant copyright-free image suggestions with:
- Detailed description for image search
- Alt text for accessibility
- Suggested placement in content

Please provide the response in the following JSON format:
{
  "title": "Engaging title for the blog post",
  "content": "Full blog post content in HTML format with proper styling, tables, and interactive elements",
  "excerpt": "Brief 2-3 sentence summary",
  "seoTitle": "SEO optimized title (60 characters max)",
  "seoDescription": "SEO meta description (150-160 characters)",
  "tags": ["relevant", "tags", "for", "the", "post"],
  "readTime": estimated_read_time_in_minutes,
  "images": [
    {
      "description": "Detailed description for finding copyright-free image",
      "alt": "Alt text for accessibility",
      "placement": "after_introduction|before_conclusion|in_section_2",
      "caption": "Image caption text"
    }
  ],
  "interactiveElements": [
    {
      "type": "table|quiz|checklist|poll",
      "title": "Element title",
      "content": "Element content or HTML"
    }
  ]
}`

  try {
    return await requestChatCompletion(PRIMARY_OPENAI_MODEL, prompt)
  } catch (error) {
    const status =
      typeof error === 'object' && error !== null && 'status' in error
        ? (error as { status?: number }).status
        : undefined
    console.warn(`Primary OpenAI model ${PRIMARY_OPENAI_MODEL} failed`, error)

    if (status === 404 || status === 403 || status === 429) {
      console.info(`Trying fallback OpenAI model ${FALLBACK_OPENAI_MODEL}...`)
      try {
        return await requestChatCompletion(FALLBACK_OPENAI_MODEL, prompt)
      } catch (fallbackError) {
        console.error('Fallback OpenAI model failed:', fallbackError)
        throw new Error('Failed to generate blog content with ChatGPT (fallback also failed)')
      }
    }

    throw new Error('Failed to generate blog content with ChatGPT')
  }
}

// Generate blog post using Gemini
export async function generateBlogWithGemini(options: BlogGenerationOptions): Promise<GeneratedBlog> {
  const { topic, category, tone, length, seoOptimized } = options

  const lengthWords = {
    short: '800-1200',
    medium: '1500-2000',
    long: '2500-3500',
    'very-long': '12000-15000'
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" })

  const prompt = `Create a comprehensive, interactive blog post about "${topic}" for the ${category} category.

Requirements:
- Tone: ${tone}
- Length: ${lengthWords[length]} words
- SEO optimized: ${seoOptimized}
- Include trending keywords naturally
- Make it highly engaging and shareable
- Include practical insights and actionable advice
- Structure with clear headings and subheadings
- MUST include detailed comparison tables where relevant
- MUST include statistical data tables
- MUST include step-by-step guides with numbered lists
- Add relevant infographic suggestions
- Include interactive elements like polls, quizzes, or checklists
- Use rich formatting: bold, italic, quotes, code blocks
- Add call-to-action sections
- Include expert quotes or case studies

IMPORTANT: Format the content with HTML for better styling:
- Use proper HTML table tags for detailed tables with styling classes
- Include divs with classes for special sections
- Add styling for interactive elements
- Use semantic HTML5 tags

Include 3-5 relevant copyright-free image suggestions with:
- Detailed description for image search
- Alt text for accessibility
- Suggested placement in content

Please provide the response in the following JSON format:
{
  "title": "Engaging title for the blog post",
  "content": "Full blog post content in HTML format with proper styling, tables, and interactive elements",
  "excerpt": "Brief 2-3 sentence summary",
  "seoTitle": "SEO optimized title (60 characters max)",
  "seoDescription": "SEO meta description (150-160 characters)",
  "tags": ["relevant", "tags", "for", "the", "post"],
  "readTime": estimated_read_time_in_minutes,
  "images": [
    {
      "description": "Detailed description for finding copyright-free image",
      "alt": "Alt text for accessibility",
      "placement": "after_introduction|before_conclusion|in_section_2",
      "caption": "Image caption text"
    }
  ],
  "interactiveElements": [
    {
      "type": "table|quiz|checklist|poll",
      "title": "Element title",
      "content": "Element content or HTML"
    }
  ]
}`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response.text()

    // Clean up the response to extract JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No valid JSON found in Gemini response')

    return JSON.parse(jsonMatch[0]) as GeneratedBlog
  } catch (error) {
    console.error('Error generating blog with Gemini:', error)
    throw new Error('Failed to generate blog content with Gemini')
  }
}

// Generate blog using both AIs and pick the best one
export async function generateBlogContent(options: BlogGenerationOptions): Promise<GeneratedBlog> {
  try {
    // Try ChatGPT first
    return await generateBlogWithChatGPT(options)
  } catch (chatGPTError) {
    console.error('ChatGPT generation failed:', chatGPTError)
    throw chatGPTError
  }
}

// Generate SEO-optimized meta content
export async function generateSEOContent(title: string, content: string): Promise<{
  seoTitle: string
  seoDescription: string
  tags: string[]
}> {
  const prompt = `Based on this blog post title and content, generate SEO-optimized metadata:

Title: ${title}
Content: ${content.substring(0, 1000)}...

Please provide JSON response with:
{
  "seoTitle": "SEO title (60 characters max)",
  "seoDescription": "Meta description (150-160 characters)",
  "tags": ["relevant", "seo", "tags"]
}`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system", 
          content: "You are an SEO expert. Generate optimized metadata that will improve search rankings."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
    })

    const response = completion.choices[0].message.content
    if (!response) throw new Error('No response from ChatGPT')

    return JSON.parse(response)
  } catch (error) {
    console.error('Error generating SEO content:', error)
    throw new Error('Failed to generate SEO content')
  }
}

// Fetch copyright-free images from Unsplash
export async function fetchCopyrightFreeImages(query: string, count: number = 3): Promise<Array<{
  url: string
  downloadUrl: string
  alt: string
  photographer: string
  photographerUrl: string
}>> {
  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY
  
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('Unsplash API key not provided, returning placeholder images')
    return generatePlaceholderImages(query, count)
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`)
    }

    const data: {
      results: Array<{
        urls: { regular: string }
        links: { download: string }
        alt_description: string | null
        user: { name: string; links: { html: string } }
      }>
    } = await response.json()

    return data.results.map((photo) => ({
      url: photo.urls.regular,
      downloadUrl: photo.links.download,
      alt: photo.alt_description || `Image related to ${query}`,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
    }))
  } catch (error) {
    console.error('Error fetching Unsplash images:', error)
    return generatePlaceholderImages(query, count)
  }
}

// Generate placeholder images when Unsplash is not available
function generatePlaceholderImages(query: string, count: number): Array<{
  url: string
  downloadUrl: string
  alt: string
  photographer: string
  photographerUrl: string
}> {
  const placeholders: Array<{
    url: string
    downloadUrl: string
    alt: string
    photographer: string
    photographerUrl: string
  }> = []
  
  for (let i = 0; i < count; i++) {
    placeholders.push({
      url: `https://picsum.photos/800/450?random=${Date.now() + i}`,
      downloadUrl: `https://picsum.photos/800/450?random=${Date.now() + i}`,
      alt: `Placeholder image related to ${query}`,
      photographer: 'Lorem Picsum',
      photographerUrl: 'https://picsum.photos',
    })
  }
  
  return placeholders
}

// Enhanced blog generation with images
export async function generateEnhancedBlogContent(options: BlogGenerationOptions): Promise<GeneratedBlog & {
  fetchedImages?: Array<{
    url: string
    downloadUrl: string
    alt: string
    photographer: string
    photographerUrl: string
  }>
}> {
  try {
    // Generate the blog content
    const blog = await generateBlogContent(options)
    
    // If images are requested, fetch them
    if (options.includeImages && blog.images && blog.images.length > 0) {
      const fetchedImages: Array<{
        url: string
        downloadUrl: string
        alt: string
        photographer: string
        photographerUrl: string
        placement: string
        caption: string
      }> = []
      
      for (const imageSpec of blog.images) {
        const images = await fetchCopyrightFreeImages(imageSpec.description, 1)
        if (images.length > 0) {
          fetchedImages.push({
            ...images[0],
            alt: imageSpec.alt,
            placement: imageSpec.placement,
            caption: imageSpec.caption
          })
        }
      }
      
      return { ...blog, fetchedImages }
    }
    
    return blog
  } catch (error) {
    console.error('Error generating enhanced blog content:', error)
    throw error
  }
}