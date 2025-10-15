# 📧 Email Notification System - Complete Guide

## 🎯 Overview

Custom HTML email templates with Resend integration for:
- ✅ Welcome emails
- ✅ Email verification
- ✅ New post notifications
- ✅ Weekly digest
- ✅ Password reset

---

## 🚀 Setup Instructions

### Step 1: Get Resend API Key (FREE)

1. Go to: https://resend.com
2. Sign up for FREE account (100 emails/day)
3. Verify your domain OR use their test domain
4. Get your API key from dashboard
5. Add to `.env.local`:

```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL="Zenx Blog <noreply@imzenx.in>"
CRON_SECRET=generate_a_random_secret_string
```

### Step 2: Verify Your Domain (Production Only)

**For Development**: Use Resend's test emails (sent to your verified email)

**For Production**:
1. Go to Resend Dashboard → Domains
2. Add your domain: `imzenx.in`
3. Add DNS records they provide:
   - SPF record
   - DKIM record
4. Wait for verification (usually 5-10 minutes)
5. Use: `noreply@imzenx.in` or `hello@imzenx.in`

---

## 📧 Email Templates Included

### 1. Welcome Email
**Sent when**: User signs up
**File**: `src/lib/email.ts` → `sendWelcomeEmail()`

**Features**:
- Beautiful gradient header
- Feature highlights
- Call-to-action button
- Dashboard link

**Trigger**: Auto-sent on user registration (you'll need to add this to the signup flow)

---

### 2. Email Verification
**Sent when**: User needs to verify email
**File**: `src/lib/email.ts` → `sendVerificationEmail()`

**Features**:
- Verification link button
- 24-hour expiry notice
- Copy-paste fallback link

**Trigger**: Newsletter subscription (can be enabled)

---

### 3. New Post Notification
**Sent when**: New blog post published
**File**: `src/lib/email.ts` → `sendNewPostNotification()`

**Features**:
- Featured image
- Category badge
- Excerpt preview
- Read more button
- Unsubscribe link

**Trigger**: Call API after publishing post

---

### 4. Weekly Digest
**Sent when**: Weekly (automated via cron)
**File**: `src/lib/email.ts` → `sendWeeklyDigest()`

**Features**:
- Top 5 posts of the week
- Thumbnails & view counts
- Category tags
- Browse all button

**Trigger**: Cron job (weekly)

---

### 5. Password Reset
**Sent when**: User requests password reset
**File**: `src/lib/email.ts` → `sendPasswordResetEmail()`

**Features**:
- Reset link button
- Security warning
- 1-hour expiry notice

**Trigger**: Password reset flow

---

## 🔧 How to Use

### Send Welcome Email (Add to Registration)

Update `src/components/RegisterForm.tsx`:

```tsx
import { sendWelcomeEmail } from '@/lib/email'

// After successful signup:
const { error } = await signUp(email, password, displayName)

if (!error) {
  // Send welcome email
  await sendWelcomeEmail(email, displayName)
  
  setSuccess(true)
  router.push('/dashboard')
}
```

---

### Send New Post Notification (Add to Admin)

Update `src/components/AdminDashboard.tsx`:

```tsx
// After generating and publishing a post:
const handlePublishPost = async (postId: string) => {
  // Publish the post
  await fetch('/api/admin/posts', {
    method: 'PUT',
    body: JSON.stringify({ id: postId, is_published: true })
  })
  
  // Send notification to subscribers
  await fetch('/api/admin/notify-subscribers', {
    method: 'POST',
    body: JSON.stringify({ 
      postId,
      sendToSubscribers: true 
    })
  })
  
  alert('Post published and subscribers notified!')
}
```

---

### Set Up Weekly Digest (Cron Job)

**Option A: Vercel Cron (Recommended)**

Create `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/admin/send-weekly-digest",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

Schedule: Every Monday at 9 AM

**Option B: External Cron Service**

Use services like:
- Cron-job.org
- EasyCron
- GitHub Actions

Set up a weekly call to:
```
POST https://imzenx.in/api/admin/send-weekly-digest
Headers:
  Authorization: Bearer YOUR_CRON_SECRET
```

---

## 📊 API Endpoints

### POST `/api/admin/notify-subscribers`

Send notification when new post is published.

**Request**:
```json
{
  "postId": "uuid-of-post",
  "sendToSubscribers": true
}
```

**Response**:
```json
{
  "message": "Notifications sent",
  "totalSubscribers": 150,
  "successCount": 148,
  "failureCount": 2
}
```

---

### POST `/api/admin/send-weekly-digest`

Send weekly digest to subscribers.

**Headers**:
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response**:
```json
{
  "message": "Weekly digest sent",
  "totalSubscribers": 75,
  "successCount": 74,
  "failureCount": 1,
  "postCount": 5
}
```

---

## 🎨 Email Design Features

All emails include:
- ✅ Responsive design (mobile-friendly)
- ✅ Modern gradient headers
- ✅ Branded colors (Zenx blue #3B82F6)
- ✅ Clear call-to-action buttons
- ✅ Professional typography
- ✅ Unsubscribe links (where applicable)
- ✅ Plain text fallback

---

## 🔒 Security & Best Practices

1. **Rate Limiting**: Emails sent in batches of 10 with 1s delay
2. **Verification**: Only verified subscribers get emails
3. **Unsubscribe**: All emails include unsubscribe link
4. **Secrets**: Cron endpoints protected with secret token
5. **Fallbacks**: Plain text versions included

---

## 📈 Resend Limits

**Free Plan**:
- 100 emails/day
- 1 domain
- 1 API key

**Upgrade** ($20/month):
- 50,000 emails/month
- Unlimited domains
- Analytics
- Team members

---

## 🧪 Testing

### Test in Development:

```bash
# In your terminal
curl -X POST http://localhost:3000/api/admin/notify-subscribers \
  -H "Content-Type: application/json" \
  -d '{"postId": "your-post-id", "sendToSubscribers": false}'
```

Or use Postman/Insomnia

### Test Emails:

Resend will send test emails to your verified email address in development.

---

## 🐛 Troubleshooting

### "Email service not configured"
- Check `RESEND_API_KEY` is set in `.env.local`
- Restart dev server after adding env vars

### "Domain not verified"
- Use Resend test email in development
- Verify domain in Resend dashboard for production

### Emails not sending
- Check Resend dashboard for errors
- Verify subscriber has `is_verified = true`
- Check subscriber preferences allow notifications

### Rate limit exceeded
- Upgrade Resend plan
- Reduce batch size in code
- Increase delay between batches

---

## 📝 Customization

### Change Email Design:

Edit templates in `src/lib/email.ts`:

```typescript
// Example: Change header color
const html = `
  <div class="header" style="background: #YOUR_COLOR;">
    ...
  </div>
`
```

### Add More Email Types:

```typescript
export async function sendCustomEmail(email: string, data: any) {
  const subject = `Your Subject`
  
  const html = `
    <!-- Your HTML template -->
  `
  
  return sendEmail({ to: email, subject, html })
}
```

---

## 🎯 Next Steps

1. **Get Resend API Key**: https://resend.com
2. **Add to `.env.local`**
3. **Test welcome email** (signup flow)
4. **Test post notification** (admin panel)
5. **Set up weekly digest** (cron job)
6. **Verify domain** (production)

---

## 📞 Support

- Resend Docs: https://resend.com/docs
- Resend Support: https://resend.com/support

---

**Your complete email system is ready! 📧✨**
