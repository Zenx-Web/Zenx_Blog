import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { BlogContentFormat } from '@/types/content'

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
  format: BlogContentFormat
  customPrompt?: string
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
  aiSummary?: string[]
  editorsNote?: string
  keyTakeaways?: string[]
}

const FORMAT_GUIDELINES: Record<BlogContentFormat, {
  label: string
  purpose: string
  structure: string[]
  voice: string[]
  signature: string[]
}> = {
  news: {
    label: 'breaking news report',
    purpose: 'deliver timely, verifiable facts with clear next steps',
    structure: [
      'Open with a dateline and concise lede summarising the most important facts',
      'Follow an inverted pyramid: key developments → supporting evidence → wider context',
      'Include at least two quoted sources (attribute them clearly, even if imaginary for narrative effect)',
      'Add a timeline or “what we know” bullet list for chronological clarity',
      'Close with the immediate outlook or confirmed next actions'
    ],
    voice: [
      'Objective, third-person voice with short, declarative paragraphs',
      'Prioritise accuracy, attribution, and specificity over hype',
      'Reference locations, stakeholders, and numbers wherever possible'
    ],
    signature: [
      'Embed a fact box or key metrics callout using semantic HTML',
      'Use subheadings that read like newsroom slug lines, not generic labels'
    ]
  },
  feature: {
    label: 'feature profile',
    purpose: 'immerse readers in a human-centred narrative that unfolds with depth',
    structure: [
      'Begin with a scene-setting anecdote or sensory moment that introduces the central character or setting',
      'Weave background, stakes, and context through storytelling beats and transitions',
      'Interleave reported detail with quotes, observations, and descriptive colour',
      'Build toward a reveal, lesson, or transformation before closing with reflective resonance'
    ],
    voice: [
      'Warm, cinematic prose that uses active verbs and sensory detail',
      'Vary pacing with a mix of short and long sentences to sustain momentum',
      'Let dialogue or quoted reflections punctuate the narrative arc'
    ],
    signature: [
      'Highlight sidebars for “Behind the scenes” or “Key players” to add dimensionality',
      'End with a forward-looking note or unanswered question that invites curiosity'
    ]
  },
  analysis: {
    label: 'analytical briefing',
    purpose: 'decode why the topic matters, who is impacted, and what may happen next',
    structure: [
      'Start with a thesis paragraph framing the central question or tension',
      'Provide essential background and data in a way that can stand alone as a reference',
      'Break down competing viewpoints or scenarios with evidence-backed evaluation',
      'Conclude with implications, risks, and practical recommendations'
    ],
    voice: [
      'Confident, explanatory voice that balances accessibility with subject depth',
      'Use comparisons, frameworks, or matrices to help readers interpret data',
      'Cite plausible experts or sources to ground assertions'
    ],
    signature: [
      'Include a table or structured list that summarises critical metrics or scenarios',
      'Name sections with analytical verbs (e.g., “Assessing”, “Projecting”, “Modeling”)'
    ]
  },
  opinion: {
    label: 'opinion editorial',
    purpose: 'argue a clear stance while acknowledging nuance and counterarguments',
    structure: [
      'Lead with a strong thesis statement or provocative hook within the opening sentences',
      'Lay out supporting arguments with evidence, anecdotes, or personal authority',
      'Address counterpoints fairly, then refute or reframe them',
      'Wrap with an actionable takeaway or rallying call'
    ],
    voice: [
      'First-person or close-third perspective with confident, persuasive language',
      'Blend storytelling and logic; vary sentence rhythm to keep rhetoric fresh',
      'Use rhetorical devices sparingly but intentionally'
    ],
    signature: [
      'Add a “What I’m watching” or “If nothing changes” breakout to emphasise stakes',
      'Finish with a memorable line that reinforces the author’s stance'
    ]
  },
  story: {
    label: 'narrative story',
    purpose: 'transport readers through characters, conflict, and resolution',
    structure: [
      'Open in medias res or with a vivid moment that spotlights tension',
      'Introduce characters through action, dialogue, and internal stakes',
      'Escalate the conflict with twists or complications that feel specific to this topic',
      'Resolve with emotional payoff and hint at an echo or aftermath'
    ],
    voice: [
      'Imaginative, scene-driven voice that balances description with dialogue',
      'Maintain a consistent point of view and let small details make the world feel real',
      'Ensure each paragraph advances the plot or reveals something new'
    ],
    signature: [
      'Use dialogue tags and pacing to differentiate speakers naturally',
      'Include a reflective beat or moral that connects the story to the category context'
    ]
  },
  guide: {
    label: 'step-by-step guide',
    purpose: 'equip readers to accomplish a task with confidence',
    structure: [
      'Begin with a succinct promise of what readers will achieve and prerequisites',
      'Lay out sequential steps with numbered headings and checkpoints',
      'Add pro tips, cautions, and tool recommendations per step',
      'Close with maintenance advice, troubleshooting, or next-level ideas'
    ],
    voice: [
      'Supportive, coach-like voice that anticipates questions and removes friction',
      'Use direct address (“you”) and verbs that encourage action',
      'Surface quick wins and deeper dives so beginners and experts both find value'
    ],
    signature: [
      'Provide at least one checklist or decision tree in HTML list form',
      'Highlight common pitfalls or FAQs in callout boxes'
    ]
  },
  listicle: {
    label: 'curated listicle',
    purpose: 'deliver punchy highlights that readers can skim or explore',
    structure: [
      'Kick off with an energetic intro that frames the list’s theme and selection criteria',
      'Organise numbered sections with compelling subheadlines and supporting detail',
      'Balance facts, anecdotes, and data points across items to avoid repetition',
      'Wrap with a summary that ties the list back to the broader trend'
    ],
    voice: [
      'Upbeat, authoritative tone that feels curated rather than generic',
      'Use vivid verbs, unexpected comparisons, and rhetorical hooks per item',
      'Keep paragraphs tight but give enough specificity to feel substantive'
    ],
    signature: [
      'Include at least one comparative table or quick-score card if the topic allows',
      'Add a “How to use this list” or “Next moves” section at the end'
    ]
  }
}

function buildFormatInstructionBlock(format: BlogContentFormat, category: string) {
  const guideline = FORMAT_GUIDELINES[format]
  const structureLines = guideline.structure.map((line) => `- ${line}`).join('\n')
  const voiceLines = guideline.voice.map((line) => `- ${line}`).join('\n')
  const signatureLines = guideline.signature.map((line) => `- ${line}`).join('\n')

  return `Format focus: ${guideline.label} for the ${category} space.\nPurpose: ${guideline.purpose}.\nStructure guidelines:\n${structureLines}\nVoice & pacing:\n${voiceLines}\nSignature touches to ensure uniqueness:\n${signatureLines}`
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
  const { topic, category, tone, length, seoOptimized, includeImages, format, customPrompt } = options

  const lengthWords = {
    short: '800-1200',
    medium: '1500-2000',
    long: '2500-3500',
    'very-long': '12000-15000'
  }

  const today = new Date()
  const todayLabel = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
  const currentYear = today.getFullYear()

  const formatInstructionBlock = buildFormatInstructionBlock(format, category)
  const imageInstruction = includeImages
    ? 'Include 3 image suggestions that align with pivotal beats in the piece.'
    : 'Return an empty array for images if no visuals feel essential.'

  const openingInstruction = customPrompt
    ? `Create a ${FORMAT_GUIDELINES[format].label} that fulfils the editor's brief for readers who follow ${category} developments.`
    : `Create a ${FORMAT_GUIDELINES[format].label} about "${topic}" for readers who follow ${category} developments.`

  const prompt = `${openingInstruction}

${customPrompt ? `Editor brief (highest priority):
${customPrompt}

` : ''}${formatInstructionBlock}

General requirements:
- Today is ${todayLabel}. Anchor datelines, timelines, and outlook to ${currentYear} and beyond unless the topic explicitly references an earlier era.
- Tone: ${tone}
- Target length: ${lengthWords[length]} words (flex as needed to keep pacing natural)
- SEO optimised: ${seoOptimized}. Thread priority keywords organically through headings and copy.
- Craft bespoke hooks and section headings—avoid boilerplate phrasing.
- Use semantic HTML5 (<section>, <article>, <aside>, <figure>, <h2>, <h3>, <p>, <blockquote>, <ul>, <ol>) to structure the article.
- Weave in concrete specifics (names, dates, locations, stats, quotes) that make this piece feel reported.
- ${imageInstruction}
- Suggest 1-3 interactive elements that genuinely fit a ${format} experience (e.g. timeline, checklist, poll, Q&A).
- Conclude with a distinctive takeaway tied to what readers should do or watch next.
- Avoid generic filler, self-referential AI language, or motivational clichés.

CRITICAL: EMBED IMAGES AND INTERACTIVE ELEMENTS IN THE CONTENT HTML:
- When you suggest images in the JSON "images" array, you MUST also embed placeholder image tags in the HTML content at those exact placements
- Use this EXACT format for image placeholders: <div class="ai-image-placeholder" data-placement="PLACEMENT_NAME" data-index="INDEX_NUMBER"><p class="image-caption">Image will be inserted here</p></div>
- Replace PLACEMENT_NAME with: hero, after_introduction, in_section_2, or before_conclusion
- Replace INDEX_NUMBER with: 0, 1, or 2 (matching the index in the images array)
- Example for first image at hero: <div class="ai-image-placeholder" data-placement="hero" data-index="0"><p class="image-caption">Image will be inserted here</p></div>
- When you suggest interactive elements, you MUST embed them directly in the HTML content where they make sense
- For polls: Use <div class="interactive-poll" data-type="poll"><h4>[Poll Title]</h4><ul><li>[Option 1]</li><li>[Option 2]</li><li>[Option 3]</li><li>[Option 4]</li></ul></div>
- For timelines: Use <div class="interactive-timeline" data-type="timeline"><h4>[Timeline Title]</h4><ol><li><strong>[Time/Date]</strong> - [Event description]</li></ol></div>
- For checklists: Use <div class="interactive-checklist" data-type="checklist"><h4>[Checklist Title]</h4><ul class="checklist"><li>[ ] [Item 1]</li><li>[ ] [Item 2]</li></ul></div>
- For callouts: Use <aside class="interactive-callout" data-type="callout"><h4>[Callout Title]</h4><p>[Important message or tip]</p></aside>
- Place interactive elements naturally within the content flow where they add value
- DO NOT just list them separately - integrate them into the narrative

CRITICAL BRANDING & EDITORIAL REQUIREMENTS:
- Add author attribution at the top: "By ImZenx (AI-Assisted)"
- Include an "AI Summary" section with 3 bullet points at the very beginning
- Add an "Editor's Note" section after the introduction with a personal observation (150-200 words)
- Include "Key Takeaways" section at the end with 3-5 bullet insights
- Append AI transparency notice at the very end: "⚙️ This article was generated using AI tools and reviewed by ImZenx before publishing."
- Ensure content is 100% original, factually accurate, and adds unique perspective
- Avoid copying from web sources - rephrase and add analysis

Return valid JSON with the following schema:
{
  "title": "Specific headline tailored to this story",
  "content": "Full HTML article following the instructions above, INCLUDING the author attribution, editorial sections, and AI transparency notice",
  "excerpt": "2-3 sentence summary",
  "seoTitle": "<=60 character SEO title",
  "seoDescription": "150-160 character meta description",
  "tags": ["keyword", "another"],
  "readTime": minutes_estimate,
  "aiSummary": ["3 concise bullet points summarizing the article"],
  "editorsNote": "Personal observation or commentary from ImZenx perspective (150-200 words)",
  "keyTakeaways": ["3-5 actionable insights or conclusions"],
  "images": [
    {
      "description": "Image brief",
      "alt": "Accessible alt text",
      "placement": "hero|after_introduction|in_section_2|before_conclusion",
      "caption": "Optional caption"
    }
  ],
  "interactiveElements": [
    {
      "type": "timeline|checklist|poll|quiz|callout|table",
      "title": "Element title",
      "content": "HTML or Markdown snippet"
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
  const { topic, category, tone, length, seoOptimized, includeImages, format, customPrompt } = options

  const lengthWords = {
    short: '800-1200',
    medium: '1500-2000',
    long: '2500-3500',
    'very-long': '12000-15000'
  }

  const today = new Date()
  const todayLabel = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
  const currentYear = today.getFullYear()

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" })

  const formatInstructionBlock = buildFormatInstructionBlock(format, category)
  const imageInstruction = includeImages
    ? 'Include 3 image suggestions that align with key beats in the narrative.'
    : 'Return an empty array for images if no visual support is required.'

  const openingInstruction = customPrompt
    ? `Write a ${FORMAT_GUIDELINES[format].label} that delivers on the editor's brief for an audience immersed in ${category}.`
    : `Write a ${FORMAT_GUIDELINES[format].label} about "${topic}" for an audience immersed in ${category}.`

  const prompt = `${openingInstruction}

${customPrompt ? `Editor brief (highest priority):
${customPrompt}

` : ''}${formatInstructionBlock}

General guidance:
- Today is ${todayLabel}; situate developments in ${currentYear} or upcoming months unless the topic demands historical framing.
- Tone: ${tone}
- Target length: ${lengthWords[length]} words (flex slightly to preserve flow)
- SEO optimised: ${seoOptimized}. Thread priority keywords through headings, standfirst, and body copy naturally.
- Invent distinctive headlines and transitions tailored to this topic.
- Use semantic HTML5 structure (<section>, <article>, <aside>, <figure>, <h2>, <h3>, <p>, <blockquote>, <ul>, <ol>).
- Include vivid, verifiable specifics (names, stats, quotes, timeline markers).
- ${imageInstruction}
- Suggest interactiveElements that suit a ${format} experience (timeline, checklist, poll, quiz, callout, table, etc.).
- Close with a reader-centric takeaway or next-step prompt.
- Never mention that you are an AI.

CRITICAL: EMBED IMAGES AND INTERACTIVE ELEMENTS IN THE CONTENT HTML:
- When you suggest images in the JSON "images" array, you MUST also embed placeholder image tags in the HTML content at those exact placements
- Use this EXACT format for image placeholders: <div class="ai-image-placeholder" data-placement="PLACEMENT_NAME" data-index="INDEX_NUMBER"><p class="image-caption">Image will be inserted here</p></div>
- Replace PLACEMENT_NAME with: hero, after_introduction, in_section_2, or before_conclusion
- Replace INDEX_NUMBER with: 0, 1, or 2 (matching the index in the images array)
- Example for first image at hero: <div class="ai-image-placeholder" data-placement="hero" data-index="0"><p class="image-caption">Image will be inserted here</p></div>
- When you suggest interactive elements, you MUST embed them directly in the HTML content where they make sense
- For polls: Use <div class="interactive-poll" data-type="poll"><h4>[Poll Title]</h4><ul><li>[Option 1]</li><li>[Option 2]</li><li>[Option 3]</li><li>[Option 4]</li></ul></div>
- For timelines: Use <div class="interactive-timeline" data-type="timeline"><h4>[Timeline Title]</h4><ol><li><strong>[Time/Date]</strong> - [Event description]</li></ol></div>
- For checklists: Use <div class="interactive-checklist" data-type="checklist"><h4>[Checklist Title]</h4><ul class="checklist"><li>[ ] [Item 1]</li><li>[ ] [Item 2]</li></ul></div>
- For callouts: Use <aside class="interactive-callout" data-type="callout"><h4>[Callout Title]</h4><p>[Important message or tip]</p></aside>
- Place interactive elements naturally within the content flow where they add value
- DO NOT just list them separately - integrate them into the narrative

CRITICAL BRANDING & EDITORIAL REQUIREMENTS:
- Add author attribution at the top: "By ImZenx (AI-Assisted)"
- Include an "AI Summary" section with 3 bullet points at the very beginning
- Add an "Editor's Note" section after the introduction with a personal observation (150-200 words)
- Include "Key Takeaways" section at the end with 3-5 bullet insights
- Append AI transparency notice at the very end: "⚙️ This article was generated using AI tools and reviewed by ImZenx before publishing."
- Ensure content is 100% original, factually accurate, and adds unique perspective
- Avoid copying from web sources - rephrase and add analysis

Respond with valid JSON using this schema:
{
  "title": "Specific headline",
  "content": "HTML article INCLUDING the author attribution, editorial sections, and AI transparency notice",
  "excerpt": "Short summary",
  "seoTitle": "<=60 char SEO title",
  "seoDescription": "150-160 char meta description",
  "tags": ["keywords"],
  "readTime": minutes_estimate,
  "aiSummary": ["3 concise bullet points summarizing the article"],
  "editorsNote": "Personal observation or commentary from ImZenx perspective (150-200 words)",
  "keyTakeaways": ["3-5 actionable insights or conclusions"],
  "images": [
    {
      "description": "Image brief",
      "alt": "Alt text",
      "placement": "hero|after_introduction|in_section_2|before_conclusion",
      "caption": "Optional caption"
    }
  ],
  "interactiveElements": [
    {
      "type": "timeline|checklist|poll|quiz|callout|table",
      "title": "Element title",
      "content": "HTML or Markdown"
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
    placement: string
    caption: string
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