import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Zenx Blog <noreply@imzenx.in>'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://imzenx.in'

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set. Email not sent.')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || undefined,
    })

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    }
  }
}

/**
 * Welcome email for new users
 */
export async function sendWelcomeEmail(email: string, displayName: string) {
  const subject = `Welcome to Zenx Blog! 🎉`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
          .header { background: linear-gradient(135deg, #3B82F6 0%, #6366F1 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 20px; color: #1F2937; margin-bottom: 20px; }
          .message { font-size: 16px; color: #4B5563; line-height: 1.6; margin-bottom: 30px; }
          .button { display: inline-block; padding: 14px 28px; background: #3B82F6; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .features { background: #F9FAFB; border-radius: 8px; padding: 20px; margin: 30px 0; }
          .feature { margin: 15px 0; display: flex; align-items: start; }
          .feature-icon { font-size: 24px; margin-right: 12px; }
          .feature-text { color: #374151; line-height: 1.5; }
          .footer { background: #F3F4F6; padding: 30px; text-align: center; color: #6B7280; font-size: 14px; }
          .footer a { color: #3B82F6; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Welcome to Zenx Blog</h1>
          </div>
          
          <div class="content">
            <div class="greeting">Hi ${displayName}! 👋</div>
            
            <div class="message">
              Thank you for joining Zenx Blog! We're excited to have you as part of our community.
            </div>
            
            <div class="message">
              Zenx Blog delivers the hottest trending topics and viral content powered by AI. 
              Stay ahead of the curve with news on technology, entertainment, business, lifestyle, and more.
            </div>
            
            <div style="text-align: center;">
              <a href="${SITE_URL}/dashboard" class="button">Visit Your Dashboard</a>
            </div>
            
            <div class="features">
              <h3 style="margin-top: 0; color: #1F2937;">What You Can Do:</h3>
              
              <div class="feature">
                <div class="feature-icon">📖</div>
                <div class="feature-text">
                  <strong>Track Your Reading</strong><br>
                  Automatically save your reading history and pick up where you left off
                </div>
              </div>
              
              <div class="feature">
                <div class="feature-icon">🔖</div>
                <div class="feature-text">
                  <strong>Save Articles</strong><br>
                  Bookmark your favorite posts to read later
                </div>
              </div>
              
              <div class="feature">
                <div class="feature-icon">📧</div>
                <div class="feature-text">
                  <strong>Get Notified</strong><br>
                  Receive updates when we publish trending content
                </div>
              </div>
              
              <div class="feature">
                <div class="feature-icon">📊</div>
                <div class="feature-text">
                  <strong>View Stats</strong><br>
                  See your reading time, completed articles, and more
                </div>
              </div>
            </div>
            
            <div class="message">
              Start exploring trending topics now and stay informed!
            </div>
          </div>
          
          <div class="footer">
            <p><strong>Zenx Blog</strong> - Hot Topics & Trending News</p>
            <p>
              <a href="${SITE_URL}">Visit Website</a> · 
              <a href="${SITE_URL}/dashboard/settings">Manage Preferences</a>
            </p>
            <p style="margin-top: 20px; font-size: 12px; color: #9CA3AF;">
              You're receiving this because you signed up for Zenx Blog.
            </p>
          </div>
        </div>
      </body>
    </html>
  `
  
  const text = `
Welcome to Zenx Blog, ${displayName}!

Thank you for joining our community. We're excited to have you here.

Zenx Blog delivers the hottest trending topics and viral content. Stay ahead with news on technology, entertainment, business, and more.

What you can do:
- Track your reading history
- Bookmark favorite articles  
- Get notified about new content
- View your reading stats

Visit your dashboard: ${SITE_URL}/dashboard

---
Zenx Blog - Hot Topics & Trending News
${SITE_URL}
  `
  
  return sendEmail({ to: email, subject, html, text })
}

/**
 * Email verification email
 */
export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${SITE_URL}/api/verify-email?token=${token}`
  const subject = `Verify your email for Zenx Blog`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
          .header { background: #3B82F6; padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; }
          .content { padding: 40px 30px; text-align: center; }
          .button { display: inline-block; padding: 14px 28px; background: #3B82F6; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #F3F4F6; padding: 20px; text-align: center; color: #6B7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✉️ Verify Your Email</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #4B5563; margin-bottom: 30px;">
              Click the button below to verify your email address and complete your registration.
            </p>
            <a href="${verifyUrl}" class="button">Verify Email Address</a>
            <p style="font-size: 14px; color: #6B7280; margin-top: 30px;">
              Or copy this link: <br><a href="${verifyUrl}" style="color: #3B82F6;">${verifyUrl}</a>
            </p>
            <p style="font-size: 14px; color: #9CA3AF; margin-top: 30px;">
              This link will expire in 24 hours.
            </p>
          </div>
          <div class="footer">
            <p>Zenx Blog - ${SITE_URL}</p>
          </div>
        </div>
      </body>
    </html>
  `
  
  return sendEmail({ to: email, subject, html })
}

/**
 * New blog post notification for subscribers
 */
export async function sendNewPostNotification(
  subscriberEmail: string,
  post: {
    title: string
    excerpt: string
    slug: string
    category: string
    featured_image?: string
  }
) {
  const postUrl = `${SITE_URL}/blog/${post.slug}`
  const unsubscribeUrl = `${SITE_URL}/unsubscribe?email=${encodeURIComponent(subscriberEmail)}`
  const subject = `📰 New on Zenx Blog: ${post.title}`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F9FAFB; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
          .header { background: linear-gradient(135deg, #3B82F6 0%, #6366F1 100%); padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .post-card { border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin: 20px 0; }
          .post-image { width: 100%; height: 250px; object-fit: cover; }
          .post-content { padding: 20px; }
          .category-badge { display: inline-block; background: #EFF6FF; color: #3B82F6; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 12px; }
          .post-title { font-size: 22px; color: #1F2937; margin: 12px 0; font-weight: 700; line-height: 1.3; }
          .post-excerpt { font-size: 15px; color: #6B7280; line-height: 1.6; margin: 15px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #3B82F6; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 15px; }
          .footer { background: #F3F4F6; padding: 30px; text-align: center; }
          .footer-text { color: #6B7280; font-size: 13px; margin: 8px 0; }
          .footer a { color: #3B82F6; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔥 New Trending Post on Zenx Blog</h1>
          </div>
          
          <div class="content">
            <p style="font-size: 16px; color: #4B5563; margin-bottom: 20px;">
              We just published a new post you might be interested in:
            </p>
            
            <div class="post-card">
              ${post.featured_image ? `<img src="${post.featured_image}" alt="${post.title}" class="post-image">` : ''}
              <div class="post-content">
                <span class="category-badge">${post.category}</span>
                <h2 class="post-title">${post.title}</h2>
                <p class="post-excerpt">${post.excerpt}</p>
                <a href="${postUrl}" class="button">Read Full Article →</a>
              </div>
            </div>
            
            <p style="font-size: 14px; color: #6B7280; margin-top: 30px; text-align: center;">
              Stay updated with the latest trending topics!
            </p>
          </div>
          
          <div class="footer">
            <p class="footer-text"><strong>Zenx Blog</strong> - Hot Topics & Trending News</p>
            <p class="footer-text">
              <a href="${SITE_URL}">Visit Website</a> · 
              <a href="${SITE_URL}/?category=${post.category}">More in ${post.category}</a>
            </p>
            <p class="footer-text" style="margin-top: 20px;">
              <a href="${unsubscribeUrl}">Unsubscribe</a> from these emails
            </p>
          </div>
        </div>
      </body>
    </html>
  `
  
  const text = `
New Post on Zenx Blog

${post.title}

${post.excerpt}

Read more: ${postUrl}

Category: ${post.category}

---
Unsubscribe: ${unsubscribeUrl}
  `
  
  return sendEmail({ to: subscriberEmail, subject, html, text })
}

/**
 * Welcome email for newsletter subscribers
 */
export async function sendNewsletterWelcomeEmail(subscriberEmail: string) {
  const unsubscribeUrl = `${SITE_URL}/unsubscribe?email=${encodeURIComponent(subscriberEmail)}`
  const subject = `🎉 You're in! Welcome to the Zenx newsletter`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #F9FAFB; }
          .container { max-width: 620px; margin: 0 auto; background: #ffffff; }
          .header { background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); padding: 48px 32px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 30px; }
          .content { padding: 40px 36px; color: #374151; }
          .content h2 { margin-top: 0; font-size: 24px; color: #1F2937; }
          .highlight { background: #EEF2FF; border-radius: 10px; padding: 18px 20px; margin: 28px 0; }
          .highlight p { margin: 8px 0; color: #4338CA; font-weight: 600; }
          .cta { display: inline-block; padding: 14px 28px; background: #2563EB; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 600; margin-top: 24px; }
          .footer { background: #F3F4F6; padding: 28px 32px; text-align: center; color: #6B7280; font-size: 13px; }
          .footer a { color: #2563EB; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thanks for subscribing 🎉</h1>
          </div>
          <div class="content">
            <h2>Hi there!</h2>
            <p>You're now part of the Zenx inner circle. We'll keep you ahead of the curve with stories that are rising fast and conversations you do not want to miss.</p>
            <div class="highlight">
              <p>Here's what to expect next:</p>
              <ul style="padding-left: 18px; margin: 14px 0; color: #4B5563;">
                <li style="margin: 10px 0;">🔥 AI-curated trending topics before they go viral</li>
                <li style="margin: 10px 0;">📬 Instant alerts when we drop a must-read</li>
                <li style="margin: 10px 0;">📊 Exclusive insights, hacks, and deep dives</li>
              </ul>
            </div>
            <p>Craving something right now? Explore the latest hits below and start reading.</p>
            <div style="text-align: center;">
              <a href="${SITE_URL}/blog" class="cta">See what's trending →</a>
            </div>
            <p style="margin-top: 36px; font-size: 14px; color: #6B7280;">You are in control. Unsubscribe anytime with one click.</p>
          </div>
          <div class="footer">
            <p><strong>Zenx Blog</strong> · Hot Topics. Viral Stories. Smart Insights.</p>
            <p><a href="${SITE_URL}">Visit website</a> · <a href="${unsubscribeUrl}">Unsubscribe</a></p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
Welcome to the Zenx newsletter!

You're now part of our inner circle. Expect:
- AI-curated trending topics before they go viral
- Instant alerts when new must-read posts drop
- Exclusive insights, hacks, and deep dives

Start exploring: ${SITE_URL}/blog

Unsubscribe anytime: ${unsubscribeUrl}
  `

  return sendEmail({ to: subscriberEmail, subject, html, text })
}

/**
 * Weekly digest email
 */
export async function sendWeeklyDigest(
  subscriberEmail: string,
  posts: Array<{
    title: string
    excerpt: string
    slug: string
    category: string
    featured_image?: string
    views: number
  }>
) {
  const unsubscribeUrl = `${SITE_URL}/unsubscribe?email=${encodeURIComponent(subscriberEmail)}`
  const subject = `📊 This Week's Top Stories on Zenx Blog`
  
  const postsHtml = posts.map(post => `
    <div style="border-bottom: 1px solid #E5E7EB; padding: 20px 0;">
      <div style="display: flex; gap: 15px;">
        ${post.featured_image ? `
          <div style="flex-shrink: 0;">
            <img src="${post.featured_image}" alt="${post.title}" style="width: 120px; height: 90px; object-fit: cover; border-radius: 8px;">
          </div>
        ` : ''}
        <div style="flex: 1;">
          <span style="display: inline-block; background: #EFF6FF; color: #3B82F6; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">
            ${post.category}
          </span>
          <h3 style="margin: 8px 0; font-size: 18px; color: #1F2937;">
            <a href="${SITE_URL}/blog/${post.slug}" style="color: #1F2937; text-decoration: none;">${post.title}</a>
          </h3>
          <p style="margin: 8px 0; color: #6B7280; font-size: 14px; line-height: 1.5;">${post.excerpt.substring(0, 120)}...</p>
          <p style="margin: 8px 0; color: #9CA3AF; font-size: 12px;">👁 ${post.views.toLocaleString()} views</p>
        </div>
      </div>
    </div>
  `).join('')
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F9FAFB; }
          .container { max-width: 650px; margin: 0 auto; background: #ffffff; }
          .header { background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px; }
          .content { padding: 30px; }
          .footer { background: #F3F4F6; padding: 30px; text-align: center; color: #6B7280; font-size: 13px; }
          .footer a { color: #3B82F6; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 This Week's Top Stories</h1>
            <p>The most popular posts from Zenx Blog</p>
          </div>
          
          <div class="content">
            <p style="font-size: 16px; color: #4B5563; margin-bottom: 30px;">
              Here are the trending posts from this week that you might have missed:
            </p>
            
            ${postsHtml}
            
            <div style="text-align: center; margin-top: 40px;">
              <a href="${SITE_URL}" style="display: inline-block; padding: 14px 28px; background: #3B82F6; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Browse All Articles
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>Zenx Blog</strong> - Hot Topics & Trending News</p>
            <p style="margin: 15px 0;">
              <a href="${SITE_URL}">Visit Website</a> · 
              <a href="${SITE_URL}/dashboard">Your Dashboard</a>
            </p>
            <p style="margin-top: 20px;">
              <a href="${unsubscribeUrl}">Unsubscribe</a> from weekly digests
            </p>
          </div>
        </div>
      </body>
    </html>
  `
  
  return sendEmail({ to: subscriberEmail, subject, html })
}

/**
 * Password reset email
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const subject = `Reset your Zenx Blog password`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
          .header { background: #EF4444; padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; }
          .content { padding: 40px 30px; text-align: center; }
          .button { display: inline-block; padding: 14px 28px; background: #EF4444; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .warning { background: #FEF2F2; border: 1px solid #FEE2E2; border-radius: 8px; padding: 15px; margin: 20px 0; color: #991B1B; font-size: 14px; }
          .footer { background: #F3F4F6; padding: 20px; text-align: center; color: #6B7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Reset Your Password</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #4B5563; margin-bottom: 30px;">
              We received a request to reset your password for your Zenx Blog account.
            </p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p style="font-size: 14px; color: #6B7280; margin-top: 30px;">
              Or copy this link: <br><a href="${resetUrl}" style="color: #3B82F6;">${resetUrl}</a>
            </p>
            <div class="warning">
              ⚠️ If you didn't request this, you can safely ignore this email. Your password won't change.
            </div>
            <p style="font-size: 14px; color: #9CA3AF; margin-top: 30px;">
              This link will expire in 1 hour for security reasons.
            </p>
          </div>
          <div class="footer">
            <p>Zenx Blog - ${SITE_URL}</p>
          </div>
        </div>
      </body>
    </html>
  `
  
  return sendEmail({ to: email, subject, html })
}
