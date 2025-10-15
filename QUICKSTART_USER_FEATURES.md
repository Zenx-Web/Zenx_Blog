# 🚀 Quick Start Guide: User Features

## 📋 Prerequisites

Before testing the new features, you need to:

### 1. Update Supabase Database

Open your Supabase project → SQL Editor → Run this:

```sql
-- Run the ENTIRE updated schema.sql file
-- Location: src/database/schema.sql
```

**Important Tables Added:**
- `email_subscriptions` - Newsletter subscribers
- `user_reading_history` - Track what users read
- `user_saved_posts` - Bookmarked articles
- `user_profiles` - Extended user info

### 2. Enable Supabase Auth

**In Supabase Dashboard:**

1. **Authentication** → **Providers** → Enable **Email**
2. **URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**`
3. **Email Templates** (optional): Customize signup/reset emails

### 3. Start Development Server

```bash
cd "c:\Users\Maac Panbazar\Desktop\blogs Zenx\zenx-blog"
npm run dev
```

---

## 🧪 Test the Features

### Test 1: User Registration
1. Visit: http://localhost:3000/auth/register
2. Fill in:
   - Display Name: Test User
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123
   - ✅ Check "I agree to terms"
3. Click "Create Account"
4. **Expected**: Redirect to `/dashboard`

### Test 2: User Dashboard
After registration, you should see:
- ✅ Welcome message with your name
- ✅ Stats cards (all showing 0 initially)
- ✅ Recent Reading section (empty for now)
- ✅ Saved Posts section (empty for now)
- ✅ Quick Actions buttons

### Test 3: Navigation Bar
Look at the top navbar:
- ✅ Should show your username (before @)
- ✅ Click username → dropdown menu:
  - Dashboard
  - Reading History
  - Saved Posts
  - Settings
  - Sign Out

### Test 4: Newsletter Subscription
1. Visit homepage: http://localhost:3000
2. Scroll to find newsletter widget (you'll need to add it)
3. Enter email: newsletter@test.com
4. Click "Subscribe"
5. **Expected**: Success message

### Test 5: Sign Out & Sign In
1. Click username → "Sign Out"
2. **Expected**: Redirect to homepage
3. Click "Sign In" button
4. Enter credentials from Test 1
5. **Expected**: Redirect to dashboard

---

## 📁 Quick Reference: New Pages

| Page | URL | Description |
|------|-----|-------------|
| **Login** | `/auth/login` | Sign in to existing account |
| **Register** | `/auth/register` | Create new account |
| **Dashboard** | `/dashboard` | User home with stats |
| **History** | `/dashboard/history` | Reading history (TODO) |
| **Saved** | `/dashboard/saved` | Bookmarked posts (TODO) |
| **Settings** | `/dashboard/settings` | User preferences (TODO) |

---

## 🔧 Integration Points

### Add Newsletter Widget to Homepage

**File**: `src/app/page.tsx`

```tsx
import NewsletterSubscribe from '@/components/NewsletterSubscribe'

// Add anywhere in your homepage:
<NewsletterSubscribe inline />  // Hero style

// OR in sidebar:
<NewsletterSubscribe />  // Compact style
```

### Add to Blog Post Page

**File**: `src/app/blog/[slug]/page.tsx`

Add after content:
```tsx
<NewsletterSubscribe inline />
```

### Add Save Button to Blog Posts

```tsx
'use client'
import { useSavedPosts } from '@/hooks/useSavedPosts'

export function SavePostButton({ postId }: { postId: string }) {
  const { savePost, unsavePost, isPostSaved } = useSavedPosts()
  const saved = isPostSaved(postId)

  return (
    <button 
      onClick={() => saved ? unsavePost(postId) : savePost(postId)}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg"
    >
      {saved ? '🔖 Saved' : '🔖 Save for Later'}
    </button>
  )
}
```

### Track Reading Progress

Add to blog post page:
```tsx
'use client'
import { useReadingHistory } from '@/hooks/useReadingHistory'
import { useEffect, useState } from 'react'

export function ReadingTracker({ postId }: { postId: string }) {
  const { trackReading } = useReadingHistory()
  const [startTime] = useState(Date.now())

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      const progress = Math.round((scrollTop / (documentHeight - windowHeight)) * 100)
      const readTime = Math.floor((Date.now() - startTime) / 1000)
      
      trackReading(postId, progress, readTime)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [postId, startTime, trackReading])

  return null // This is a tracking component, no UI
}
```

---

## 🎨 Styling Notes

All components match your existing Zenx theme:
- Primary color: `blue-600` (#3B82F6)
- Success: `green-600`
- Error: `red-600`
- Background: `gray-50`
- Cards: `white` with `shadow`

---

## ⚡ Quick Commands

```bash
# Start dev server
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Check for errors
npm run lint
```

---

## 🐛 Troubleshooting

### "User not authenticated" error
- Make sure you ran the schema.sql in Supabase
- Check Supabase Auth is enabled
- Clear browser cookies and try again

### "Cannot read property of undefined" on dashboard
- You're not logged in
- Go to `/auth/login` first

### Newsletter subscription not working
- Check Supabase connection
- Verify `email_subscriptions` table exists
- Check browser console for errors

### Reading history not showing
- You need to actually read blog posts first
- Reading tracking needs to be implemented on blog pages (see integration above)

---

## 📊 Data Flow

```
User Signs Up
    ↓
auth.users created (Supabase)
    ↓
user_profiles created (auto trigger)
    ↓
User logs in
    ↓
Dashboard shows stats (reading_history + saved_posts)
    ↓
User reads blog post
    ↓
reading_history updated (if tracking implemented)
    ↓
User saves post
    ↓
saved_posts updated
```

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] Run schema.sql in production Supabase
- [ ] Update environment variables:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` (production)
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production)
  - [ ] `NEXT_PUBLIC_SITE_URL` (https://imzenx.in)
- [ ] Test all auth flows in production
- [ ] Set up email provider (Resend) for notifications
- [ ] Enable RLS policies in Supabase
- [ ] Test newsletter subscription
- [ ] Verify redirect URLs in Supabase

---

## 🎯 Next Priorities

1. **Immediate**: Add newsletter widget to homepage/footer
2. **Soon**: Implement reading progress tracking
3. **Soon**: Add save button to blog posts
4. **Later**: Create history/saved/settings sub-pages
5. **Optional**: Set up Resend for email notifications

---

**Happy coding! 🚀**
