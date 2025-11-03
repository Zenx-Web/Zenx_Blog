import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How We Use AI - ImZenx Blog',
  description: 'Learn about our AI-powered content creation process and human review standards at ImZenx.',
  openGraph: {
    title: 'How We Use AI - ImZenx',
    description: 'Transparent breakdown of our AI-assisted editorial workflow and quality standards.',
  },
}

export default function HowWeUseAIPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            How We Use AI
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Transparency in our AI-powered, human-reviewed editorial process
          </p>
        </header>

        {/* Tagline */}
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-2xl p-8 mb-12 text-center">
          <p className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            "Where AI meets Trending News — Curated by Humans."
          </p>
        </div>

        {/* Main Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          
          {/* Introduction */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Our Philosophy</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              ImZenx is an AI-powered media platform that explores the world's trending stories using artificial intelligence. 
              However, every piece of content you read here has been <strong>personally reviewed, edited, and approved</strong> before 
              publication. We believe AI is a powerful tool for research and drafting, but human judgment, creativity, and 
              accountability remain essential to quality journalism.
            </p>
          </section>

          {/* What AI Tools We Use */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              <span className="mr-2">🤖</span>
              What AI Tools We Use
            </h2>
            <div className="space-y-4">
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Content Generation</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  We use <strong>ChatGPT (OpenAI)</strong> and <strong>Google Gemini</strong> to draft article outlines, 
                  generate initial content, and suggest creative angles on trending topics.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Topic Discovery</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Our systems monitor <strong>Google Trends</strong>, <strong>Reddit</strong>, <strong>News APIs</strong>, 
                  and social media to identify trending topics in real-time across tech, gaming, entertainment, and world news.
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">SEO Optimization</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  AI helps us generate meta titles, descriptions, and keyword tags to ensure our content reaches the right audience 
                  through search engines.
                </p>
              </div>

              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Image Generation</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Featured images are sourced from <strong>Unsplash</strong> (copyright-free) or generated using 
                  AI art tools like <strong>DALL·E</strong> and <strong>Stable Diffusion</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* How Human Review Works */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              <span className="mr-2">👤</span>
              How Human Review Ensures Quality
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Every AI-generated article goes through a strict review process before going live:
            </p>
            
            <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
              <li className="pl-2">
                <strong>Fact-Checking:</strong> We verify dates, names, statistics, and claims against reliable sources.
              </li>
              <li className="pl-2">
                <strong>Originality Check:</strong> Content is reviewed to ensure it's not copied from other websites and adds unique perspective or analysis.
              </li>
              <li className="pl-2">
                <strong>Grammar & Readability:</strong> We edit for clarity, flow, and natural human-like writing style.
              </li>
              <li className="pl-2">
                <strong>Editorial Additions:</strong> We add personal commentary in "Editor's Note" sections and curate key takeaways.
              </li>
              <li className="pl-2">
                <strong>Category & SEO Review:</strong> Proper categorization, meta tags, and internal linking are manually verified.
              </li>
              <li className="pl-2">
                <strong>Final Approval:</strong> No content goes live without explicit human approval.
              </li>
            </ol>
          </section>

          {/* Our AI Workflow */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              <span className="mr-2">⚙️</span>
              Our AI-Assisted Editorial Workflow
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                <div className="text-3xl mb-2">1️⃣</div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">Trending Topic Discovery</h3>
                <p className="text-gray-700 dark:text-gray-300">AI fetches daily trending topics from multiple APIs and ranks them by relevance.</p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <div className="text-3xl mb-2">2️⃣</div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">Content Generation</h3>
                <p className="text-gray-700 dark:text-gray-300">AI drafts the article with title, subheadings, body, and meta tags automatically.</p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                <div className="text-3xl mb-2">3️⃣</div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">Human Review</h3>
                <p className="text-gray-700 dark:text-gray-300">I personally review, fact-check, edit, and add editorial commentary to every post.</p>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6">
                <div className="text-3xl mb-2">4️⃣</div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">Publication</h3>
                <p className="text-gray-700 dark:text-gray-300">After approval, the post goes live with clear AI disclosure at the bottom.</p>
              </div>
            </div>
          </section>

          {/* Why AI Transparency Matters */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              <span className="mr-2">💡</span>
              Why AI Transparency Matters
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We believe readers deserve to know when AI is involved in content creation. Transparency builds trust and 
              helps readers make informed decisions about the sources they consume. By clearly marking AI-assisted content 
              and maintaining rigorous human oversight, we aim to demonstrate that AI can enhance—not replace—quality journalism.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border-l-4 border-yellow-500">
              <p className="text-gray-800 dark:text-gray-200 font-medium">
                Every article on ImZenx includes this disclosure:
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-2 italic">
                "⚙️ This article was generated using AI tools and reviewed by ImZenx before publishing."
              </p>
            </div>
          </section>

          {/* Our Commitment */}
          <section className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 shadow-lg text-white">
            <h2 className="text-2xl font-bold mb-4">Our Commitment to You</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="mr-3 text-2xl">✓</span>
                <span>100% factual accuracy through human fact-checking</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">✓</span>
                <span>Original content with unique analysis and perspective</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">✓</span>
                <span>Clear AI disclosure on every AI-assisted article</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">✓</span>
                <span>Human editorial oversight and personal commentary</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">✓</span>
                <span>Continuous improvement of our AI-human workflow</span>
              </li>
            </ul>
          </section>

          {/* About the Creator */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              <span className="mr-2">👨‍💻</span>
              About ImZenx
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              ImZenx is created and managed by a gamer, streamer, and digital creator passionate about technology, 
              gaming, and storytelling. As both a content creator and tech enthusiast, I leverage AI tools to scale 
              content production while maintaining the personal touch and editorial standards that readers expect. 
              Every article reflects my commitment to quality, transparency, and respect for the audience.
            </p>
          </section>

          {/* Contact & Questions */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Questions or Feedback?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We're always looking to improve our AI-assisted editorial process. If you have questions about 
              how a specific article was created or suggestions for our workflow, we'd love to hear from you.
            </p>
            <Link 
              href="/contact" 
              className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:shadow-lg transition-all"
            >
              Contact Us
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}
