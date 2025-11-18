import Link from 'next/link'

export const metadata = {
  title: 'About ImZenx - AI-Powered, Human-Reviewed News',
  description: 'ImZenx is an AI-powered media platform exploring trending stories with human oversight. Learn about our mission, team, and editorial standards.'
}

export default function AboutPage() {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            About ImZenx
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 font-medium">
            Where AI meets Trending News — Curated by Humans
          </p>
        </div>

        {/* Main Content */}
        <div className="mt-10 space-y-8">
          
          {/* Mission Statement */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Our Mission</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong>ImZenx</strong> is an AI-powered media platform that explores the world's trending stories 
              using artificial intelligence. Each article is created with AI assistance, then <strong>personally reviewed, 
              refined, and approved</strong> before publishing. We believe in leveraging cutting-edge technology to 
              scale content creation while maintaining the human judgment, creativity, and accountability that define 
              quality journalism.
            </p>
          </section>

          {/* What We Cover */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">What We Cover</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              ImZenx focuses on the topics shaping our digital world:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Technology & AI</h3>
                  <p className="text-gray-600 dark:text-gray-400">Latest innovations, gadgets, and digital trends</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🎮</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Gaming & E-Sports</h3>
                  <p className="text-gray-600 dark:text-gray-400">Valorant, FPS games, and competitive gaming</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🌍</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">World News</h3>
                  <p className="text-gray-600 dark:text-gray-400">Global current events and breaking stories</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🎬</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Entertainment</h3>
                  <p className="text-gray-600 dark:text-gray-400">Movies, YouTube, pop culture, and media</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🇮🇳</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">India Trends</h3>
                  <p className="text-gray-600 dark:text-gray-400">Regional stories and cultural movements</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-2xl">💼</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Business</h3>
                  <p className="text-gray-600 dark:text-gray-400">Startups, markets, and economic trends</p>
                </div>
              </div>
            </div>
          </section>

          {/* How We Work */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">How We Work</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">AI-Powered Topic Discovery</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Our systems monitor Google Trends, Reddit, News APIs, and social media to identify trending topics in real-time.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">AI-Assisted Content Generation</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    ChatGPT and Google Gemini help us draft comprehensive, well-researched articles with proper structure and SEO optimization.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-100 dark:bg-green-900/30 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Human Review & Refinement</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Every article is fact-checked, edited for grammar and accuracy, and enriched with personal commentary before publication.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-orange-100 dark:bg-orange-900/30 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Transparent Publication</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    All AI-assisted articles include clear disclosure, author attribution, and editorial notes to maintain transparency.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* About the Creator */}
          <section className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 shadow-lg text-white">
            <h2 className="text-3xl font-semibold mb-4">Meet the Creator</h2>
            <p className="text-lg leading-relaxed">
              ImZenx is created and managed by a passionate <strong>gamer, streamer, and digital creator</strong> who 
              believes in the power of technology to democratize content creation. With a background in gaming 
              (especially Valorant and FPS titles), streaming, and digital media, I bring a unique perspective to 
              tech and entertainment coverage. My goal is to build a modern news hub that combines AI efficiency 
              with human authenticity.
            </p>
          </section>

          {/* Our Standards */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border-2 border-blue-200 dark:border-blue-800">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">📋 Our Editorial Standards</h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg mb-6">
              <p className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                ✅ Quality Content Guarantee
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Every article published on ImZenx meets strict quality standards to ensure value for our readers and compliance with Google AdSense policies.
              </p>
            </div>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start space-x-3">
                <span className="text-green-500 text-xl">✓</span>
                <span><strong>Minimum 800 Words:</strong> Comprehensive coverage with context, analysis, and insights</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-500 text-xl">✓</span>
                <span><strong>Factual Accuracy:</strong> Every claim is verified against reliable sources before publication</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-500 text-xl">✓</span>
                <span><strong>Original Content:</strong> AI drafts are heavily edited to add unique perspective and avoid plagiarism</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-500 text-xl">✓</span>
                <span><strong>Proper Structure:</strong> Clear headings, sections, and formatting for easy reading</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-500 text-xl">✓</span>
                <span><strong>Visual Content:</strong> Relevant images with proper attribution and alt text for accessibility</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-500 text-xl">✓</span>
                <span><strong>Internal Linking:</strong> Connected to related articles for better navigation and context</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-500 text-xl">✓</span>
                <span><strong>SEO & Readability:</strong> Optimized for both search engines and human readers</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-500 text-xl">✓</span>
                <span><strong>AI Transparency:</strong> Clear disclosure on every AI-assisted piece with "AI-Assisted" badge</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-500 text-xl">✓</span>
                <span><strong>Regular Updates:</strong> Articles updated as stories develop or new information emerges</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-500 text-xl">✓</span>
                <span><strong>AdSense Compliance:</strong> All content meets Google's quality and policy standards</span>
              </li>
            </ul>
            <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Note:</strong> We do not publish thin content, misleading headlines, or auto-generated articles without human review. Every post is carefully crafted to provide genuine value to our readers.
              </p>
            </div>
          </section>

          {/* Author Attribution & Accountability */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">👤 Author Attribution</h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p className="text-lg">
                All articles on ImZenx are attributed to the <strong>"ImZenx Editorial Team"</strong> with clear AI disclosure.
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <p className="font-semibold mb-2">Typical Byline:</p>
                <div className="border-l-4 border-purple-600 pl-4">
                  <p className="text-sm"><strong>Written By:</strong> ImZenx Editorial Team (AI-Assisted)</p>
                  <p className="text-sm"><strong>Reviewed By:</strong> Human Editors</p>
                  <p className="text-sm"><strong>Published:</strong> [Date]</p>
                  <p className="text-sm"><strong>Last Updated:</strong> [Date]</p>
                </div>
              </div>
              <p>
                This attribution system ensures accountability while being transparent about our AI-assisted workflow.
              </p>
            </div>
          </section>

          {/* What's Next */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">What's Next</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We're continuously improving our AI-human workflow to deliver better content faster. Upcoming features include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Enhanced personalization based on reader interests</li>
              <li>Interactive content formats (polls, quizzes, timelines)</li>
              <li>Community features for reader engagement</li>
              <li>Expanded coverage of niche gaming and tech topics</li>
              <li>Newsletter with curated daily highlights</li>
            </ul>
          </section>

          {/* CTA Section */}
          <section className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Want to Learn More About Our AI Process?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              We believe in complete transparency about how AI powers our editorial workflow.
            </p>
            <Link 
              href="/how-we-use-ai" 
              className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:shadow-lg transition-all"
            >
              Read: How We Use AI
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}

