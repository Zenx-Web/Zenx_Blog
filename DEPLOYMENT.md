# 🚀 Zenx Blog - Deployment Guide

## Pre-Deployment Checklist

### ✅ Security (COMPLETED)
- [x] Strong `ADMIN_SESSION_SECRET` generated (32-byte base64)
- [x] Removed hardcoded Supabase credentials from code
- [x] Environment variables properly validated
- [x] Admin authentication implemented with session cookies
- [x] All admin API routes protected with `ensureAdminApiAccess`

### ✅ Build & Testing (COMPLETED)
- [x] TypeScript compilation passes (`npm run type-check`)
- [x] Production build successful (`npm run build`)
- [x] ESLint checks pass (`npm run lint`)
- [x] Images loading correctly (Unsplash integration working)
- [x] Admin panel fully functional (login, logout, post management)

### ✅ Features Implemented
- [x] AI-powered blog generation (OpenAI GPT + Google Gemini)
- [x] Trending topics fetching (Reddit, NewsAPI, Google Trends)
- [x] Admin dashboard with post management
- [x] Hero section with featured posts
- [x] Table of Contents with active section highlighting
- [x] Reading progress bar
- [x] Responsive mobile-first design
- [x] SEO optimization (meta tags, structured data)
- [x] Social sharing buttons
- [x] Category filtering
- [x] Related posts

## Deployment to Hostinger

### Step 1: Prepare Build Output
```bash
# Build for production
npm run build

# The output will be in the .next folder
```

### Step 2: Configure Hostinger
Since Hostinger shared hosting doesn't natively support Next.js, you have two options:

#### Option A: Deploy to Vercel (Recommended)
1. Push code to GitHub
2. Import project to Vercel: https://vercel.com/new
3. Add environment variables in Vercel dashboard
4. Point your domain `imzenx.in` to Vercel using CNAME

#### Option B: Use Hostinger VPS
1. Upgrade to VPS hosting
2. Install Node.js 18+ and PM2
3. Upload files via SFTP
4. Run production server with PM2

### Step 3: Environment Variables
Copy all variables from `.env.local` to your hosting platform:

**Required Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_GEMINI_API_KEY`
- `UNSPLASH_ACCESS_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_SITE_URL` (set to https://imzenx.in)

**Optional Variables:**
- `GOOGLE_TRENDS_API_KEY`
- `NEWS_API_KEY`
- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`

### Step 4: Domain Configuration
1. In Hostinger DNS settings, add:
   - For Vercel: CNAME record pointing to `cname.vercel-dns.com`
   - For VPS: A record pointing to your VPS IP
2. Update `NEXT_PUBLIC_SITE_URL` to `https://imzenx.in`
3. Wait for DNS propagation (up to 48 hours)

### Step 5: Post-Deployment
1. Visit `https://imzenx.in/admin/login`
2. Login with credentials from `ADMIN_EMAIL` and `ADMIN_PASSWORD`
3. Generate your first blog post
4. Test all features:
   - Image loading
   - Admin CRUD operations
   - Blog post viewing
   - Category filtering
   - Social sharing

## Performance Optimization

### Already Implemented
- ✅ Next.js Image optimization with lazy loading
- ✅ Static page generation where possible
- ✅ Turbopack for faster builds
- ✅ Tailwind CSS purging
- ✅ React Server Components

### Recommended Post-Deployment
- [ ] Enable Vercel Analytics
- [ ] Set up Google Analytics 4
- [ ] Configure Google Search Console
- [ ] Submit sitemap: `https://imzenx.in/sitemap.xml`
- [ ] Test Google AdSense placement
- [ ] Monitor Core Web Vitals

## Monitoring & Maintenance

### Daily Tasks
- Check admin dashboard for new trending topics
- Generate 2-3 blog posts on trending topics
- Review and publish draft posts

### Weekly Tasks
- Review analytics (traffic, popular posts)
- Update featured posts
- Check for broken images
- Monitor API usage (OpenAI, Unsplash limits)

### Monthly Tasks
- Review SEO performance in Search Console
- Update meta descriptions for top posts
- Clean up unused posts
- Backup Supabase database

## Troubleshooting

### Images Not Loading
- Check Unsplash API key is valid (50 requests/hour free tier)
- Verify `next.config.ts` has proper `remotePatterns`
- Ensure posts have `featured_image` field populated

### Admin Login Issues
- Verify `ADMIN_SESSION_SECRET` is set correctly
- Check browser cookies are enabled
- Ensure `ADMIN_EMAIL` and `ADMIN_PASSWORD` match `.env.local`

### Build Failures
- Run `npm run type-check` locally first
- Check all environment variables are set
- Review build logs for specific errors

## Revenue Setup

### Google AdSense
1. Apply for AdSense account
2. Add AdSense code to `src/app/layout.tsx`
3. Place ad units in:
   - Between blog post sections
   - Sidebar
   - Below hero section

### Affiliate Marketing
1. Sign up for relevant affiliate programs
2. Add affiliate links in blog content
3. Track performance in admin analytics

## Support

For issues or questions:
- Check documentation in `/docs`
- Review error logs in Vercel dashboard
- Contact: kbarhoi367@gmail.com

---

**Deployment Date**: January 2025  
**Version**: 1.0.0  
**Status**: ✅ Ready for Production
