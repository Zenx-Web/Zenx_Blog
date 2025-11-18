// Test the content validator system
import { validateContent, autoFixContent, generateValidationReport } from '../src/lib/content-validator.ts'

console.log('🧪 Testing Content Validator System\n')

// Test 1: Short content (should fail)
console.log('='.repeat(60))
console.log('TEST 1: Short content without AI disclosure')
console.log('='.repeat(60))
const shortContent = '<p>This is a very short blog post. It does not have enough content.</p>'
const validation1 = validateContent(
  shortContent,
  'Test Short Post',
  'A short excerpt',
  ['test'],
  'https://example.com/image.jpg'
)
console.log(generateValidationReport(validation1))
console.log()

// Test 2: Good content
console.log('='.repeat(60))
console.log('TEST 2: Good quality content')
console.log('='.repeat(60))
const goodContent = `
<p>This is a comprehensive blog post about technology trends in 2024. In this guide, we'll explore the latest innovations that are shaping our digital future.</p>

<p>The technology landscape continues to evolve at an unprecedented pace. From artificial intelligence breakthroughs to revolutionary blockchain applications, we're witnessing transformational changes across all sectors.</p>

<h2>Understanding AI Development</h2>
<p>Artificial intelligence has become a cornerstone of modern innovation. Companies worldwide are leveraging AI to enhance their products, streamline operations, and deliver better customer experiences. Machine learning algorithms can now process vast amounts of data, identifying patterns and insights that were previously impossible to detect.</p>

<p>Learn more about <a href="/blog/ai-trends-2024">AI trends in 2024</a> and explore our <a href="/category/technology">technology category</a> for more insights.</p>

<h2>Blockchain Revolution</h2>
<p>Blockchain technology extends far beyond cryptocurrency. Organizations are discovering innovative applications in supply chain management, healthcare records, digital identity verification, and smart contracts. The decentralized nature of blockchain provides transparency, security, and efficiency that traditional systems struggle to match.</p>

<p>Check out our <a href="/blog/blockchain-applications">comprehensive guide to blockchain applications</a> for detailed insights.</p>

<h2>Cloud Computing Evolution</h2>
<p>Cloud infrastructure has become the backbone of digital transformation. Businesses of all sizes are migrating to cloud platforms, benefiting from scalability, cost efficiency, and global accessibility. Major providers like AWS, Azure, and Google Cloud continue to expand their services, offering sophisticated tools for developers and enterprises.</p>

<p>The serverless computing model is gaining traction, allowing developers to focus on code rather than infrastructure management. This approach reduces operational overhead while providing automatic scaling and improved resource utilization.</p>

<h2>Cybersecurity Challenges</h2>
<p>As technology advances, so do security threats. Organizations must implement robust cybersecurity measures to protect sensitive data and maintain customer trust. Multi-factor authentication, encryption, zero-trust architecture, and continuous monitoring have become essential components of modern security strategies.</p>

<p>Ransomware attacks and data breaches continue to pose significant risks. Companies need comprehensive security frameworks that address vulnerabilities across all touchpoints, from employee training to advanced threat detection systems.</p>

<h2>Future Outlook</h2>
<p>The technology sector shows no signs of slowing down. Emerging technologies like quantum computing, 5G networks, and edge computing promise to unlock new possibilities. Organizations that embrace innovation and adapt to changing technological landscapes will be best positioned for future success.</p>

<p><em>Note: This article was created with AI assistance from ChatGPT and refined by our editorial team at Zenx Blog to ensure accuracy and readability.</em></p>
`.trim()

const validation2 = validateContent(
  goodContent,
  'Technology Trends 2024: Complete Guide',
  'Explore the latest technology trends shaping our digital future, from AI breakthroughs to blockchain revolution.',
  ['technology', 'ai', 'blockchain', 'trends', '2024'],
  'https://example.com/tech-2024.jpg'
)
console.log(generateValidationReport(validation2))
console.log()

// Test 3: Auto-fix
console.log('='.repeat(60))
console.log('TEST 3: Auto-fix capabilities')
console.log('='.repeat(60))
const contentNeedingFix = `
<h2>Technology Overview</h2>
<p>${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100)}</p>
<h2>Key Points</h2>
<p>${'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. '.repeat(50)}</p>
`.trim()

console.log('Original content issues:')
const validationBeforeFix = validateContent(
  contentNeedingFix,
  'Technology Overview',
  'An overview of technology',
  ['tech'],
  'https://example.com/img.jpg'
)
console.log(`- Word count: ${validationBeforeFix.stats.wordCount}`)
console.log(`- Has AI disclosure: ${validationBeforeFix.stats.hasAIDisclosure}`)
console.log(`- Internal links: ${validationBeforeFix.stats.internalLinks}`)
console.log()

console.log('Applying auto-fix...')
const fixedContent = autoFixContent(contentNeedingFix, 'technology')

console.log('\nFixed content improvements:')
const validationAfterFix = validateContent(
  fixedContent,
  'Technology Overview',
  'An overview of technology',
  ['tech'],
  'https://example.com/img.jpg'
)
console.log(`- Word count: ${validationAfterFix.stats.wordCount}`)
console.log(`- Has AI disclosure: ${validationAfterFix.stats.hasAIDisclosure}`)
console.log(`- Internal links: ${validationAfterFix.stats.internalLinks}`)
console.log(`- Is valid: ${validationAfterFix.isValid}`)
console.log()

console.log('✅ All tests completed!')
