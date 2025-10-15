# Zenx Blog - AI-Powered Trending Topics Blog Platform

![Zenx Blog](https://img.shields.io/badge/Zenx%20Blog-AI%20Powered-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.5.5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success)

A modern, AI-powered blog platform that automatically generates content from trending topics using ChatGPT and Google Gemini. Built for **imzenx.in** domain with a focus on viral content and revenue optimization.

## 🚀 Features

### 🤖 AI-Powered Content Generation
- **Dual AI Integration**: ChatGPT + Google Gemini for diverse content
- **Trending Topics Fetcher**: Automatically pulls hot topics from Reddit, NewsAPI, Google Trends
- **Smart Content Creation**: AI generates SEO-optimized blog posts with images
- **Customizable Tone & Length**: Professional, casual, engaging content styles
- **Image Integration**: Auto-fetches copyright-free images from Unsplash
- **Admin Dashboard**: Full CRUD operations with secure session authentication

### 📈 Traffic & SEO Optimization
- **SEO-First Design**: Auto-generated meta tags, structured data
- **Hero Section**: Engaging featured posts layout
- **Table of Contents**: Automatic TOC generation with active section highlighting
- **Reading Progress**: Visual progress bar for better UX
- **Category Filtering**: Easy navigation by topic
- **Related Posts**: Keep readers engaged
- **Sitemap & RSS**: Dynamic XML sitemaps and RSS feeds
- **Fast Loading**: Next.js 15 with Turbopack optimization
- **Mobile-First**: Responsive design across all devices

### 💰 Revenue Features
- **Google AdSense Ready**: Strategic ad placement areas
- **Affiliate Marketing Support**: Built-in link management
- **Analytics Integration**: Track performance and revenue
- **Social Media Optimization**: Auto-sharing capabilities

## 🛠 Tech Stack

- **Frontend**: Next.js 15.5.5 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **AI APIs**: OpenAI GPT-4, Google Gemini 1.5 Flash
- **Images**: Unsplash API (copyright-free)
- **Authentication**: Custom session-based auth with HMAC cookies
- **Deployment**: Vercel (recommended) or Hostinger VPS
- **Domain**: imzenx.in

## 🚀 Quick Start

### 1. Environment Setup

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI API Keys
OPENAI_API_KEY=your_openai_api_key
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
UNSPLASH_ACCESS_KEY=your_unsplash_access_key

# Trending Topics APIs (Optional)
GOOGLE_TRENDS_API_KEY=your_serpapi_key_optional
NEWS_API_KEY=your_newsapi_key_optional

# Admin Authentication
ADMIN_EMAIL=your_admin_email@example.com
ADMIN_PASSWORD=your_secure_password
# Generate with: node -p "require('crypto').randomBytes(32).toString('base64')"
ADMIN_SESSION_SECRET=generate_random_32_byte_base64_string
NEXTAUTH_SECRET=generate_random_32_byte_base64_string

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://imzenx.in
NEXT_PUBLIC_SITE_NAME="Zenx Blog"
```

### 2. Database Setup

1. Create a new Supabase project
2. Run the SQL commands from `src/database/schema.sql`
3. Update the RLS policies with your admin email

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your blog!

## 📚 Usage Guide

### Admin Login (`/admin/login`)

1. Navigate to `http://localhost:3000/admin/login`
2. Login with your `ADMIN_EMAIL` and `ADMIN_PASSWORD`
3. Secure session-based authentication keeps you logged in

### Admin Dashboard (`/admin`)

1. **Fetch Trending Topics**: Click "🔄 Refresh Topics" to get latest trends
2. **Search Custom Topics**: Search for specific topics manually
3. **Generate Content**: 
   - Select a topic from trending list
   - Choose category, tone, and length
   - Toggle "Include Images" for Unsplash integration
   - Toggle "SEO Optimization" for better rankings
4. **Manage Posts**:
   - Filter by Published/Draft/All
   - Publish/Unpublish posts with one click
   - Delete unwanted posts
   - View live posts directly
5. **Logout**: Securely logout when done

### Content Management

- **Draft System**: All AI-generated content starts as drafts
- **SEO Optimization**: Auto-generated meta tags and descriptions
- **Featured Posts**: Highlight your best content
- **Categories**: Organize content by topics

## 🎯 AI Content Strategy

### Trending Sources
- **Google Trends**: Real-time search trends
- **Reddit Hot Posts**: Popular discussions
- **News APIs**: Breaking news topics
- **Twitter Trends**: Social media buzz

### Content Types
- **Technology**: Latest tech trends and innovations
- **Entertainment**: Celebrity news, movies, TV shows
- **Business**: Market trends and startup news
- **Lifestyle**: Health, fashion, and lifestyle trends
- **Sports**: Sports news and events
- **World News**: Breaking news and global events

## 💡 Revenue Optimization

### AdSense Integration
- **Strategic Placement**: Header, sidebar, in-content ads
- **Mobile Optimized**: Responsive ad units
- **Performance Tracking**: Built-in analytics

### SEO Features
- **Trending Keywords**: Auto-integration of hot search terms
- **Quick Publishing**: Be first to cover trending topics
- **Social Signals**: Auto-sharing boosts visibility
- **Schema Markup**: Rich snippets for better rankings

## 🚀 Deployment

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.**

### Quick Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import to Vercel: https://vercel.com/new
3. Add all environment variables from `.env.local`
4. Deploy!
5. Point `imzenx.in` domain to Vercel

### Pre-Deployment Checklist

✅ Security hardened (no hardcoded credentials)  
✅ TypeScript compilation passes  
✅ Production build successful  
✅ All features tested  
✅ Environment variables documented  
✅ Admin authentication working  
✅ Images loading correctly  

### Build Commands

```bash
# Type check
npm run type-check

# Lint check
npm run lint

# Production build
npm run build

# Start production server
npm start
```

## 📊 Analytics & Monitoring

### Built-in Analytics
- **Post Views**: Track article performance
- **Category Performance**: See which topics work best
- **Trending Topic Success**: Monitor AI content effectiveness

### External Integrations
- **Google Analytics**: Detailed traffic analysis
- **Google Search Console**: SEO performance
- **AdSense Reports**: Revenue optimization

---

**Built with ❤️ for viral content creation and sustainable blogging revenue at imzenx.in**
