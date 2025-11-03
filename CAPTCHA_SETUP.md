# CAPTCHA Setup Guide for Zenx Blog

## Overview
CAPTCHA protection has been added to login and registration forms to prevent bot attacks and spam registrations. We're using **Cloudflare Turnstile** - a modern, privacy-friendly CAPTCHA alternative that's free and user-friendly.

## Why Cloudflare Turnstile?
- ✅ **Free unlimited use** (unlike Google reCAPTCHA)
- ✅ **Privacy-focused** - no personal data collection
- ✅ **Better UX** - often invisible to users
- ✅ **Native Supabase support**
- ✅ **No annoying "click traffic lights" puzzles

---

## Step 1: Get Cloudflare Turnstile Keys

### 1.1 Sign Up/Login to Cloudflare
1. Go to https://dash.cloudflare.com/
2. Sign up or log in (free account works)

### 1.2 Create a Turnstile Site
1. Navigate to **Turnstile** in the left sidebar
2. Click **Add Site**
3. Fill in the details:
   - **Site name**: `Zenx Blog - imzenx.in`
   - **Domain**: `imzenx.in` (or `localhost` for development)
   - **Widget mode**: `Managed` (recommended)
4. Click **Create**

### 1.3 Get Your Keys
You'll receive two keys:
- **Site Key** (public) - Used in frontend
- **Secret Key** (private) - Used in Supabase backend

---

## Step 2: Configure Supabase

### 2.1 Enable CAPTCHA in Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: `umfhehmdhiusxmyezdkk`
3. Navigate to **Authentication** → **Settings**
4. Scroll to **Bot and Abuse Protection**
5. Toggle **Enable Cloudflare Turnstile**
6. Enter your **Secret Key** from Step 1.3
7. Click **Save**

### 2.2 Configure CAPTCHA Settings
- **Enable for Sign Ups**: ✅ Yes
- **Enable for Sign Ins**: ✅ Yes (optional, but recommended)
- **Enable for Password Recovery**: ❌ No (optional)

---

## Step 3: Add Environment Variables

### 3.1 Update `.env.local`
Add this line to your `.env.local` file:

```bash
# Cloudflare Turnstile CAPTCHA
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here
```

### 3.2 Update `.env.vercel` (for production)
Add the same variable for Vercel deployment:

```bash
# Cloudflare Turnstile CAPTCHA
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_production_site_key_here
```

**Important**: Use different site keys for localhost (development) and imzenx.in (production)!

---

## Step 4: Test CAPTCHA

### 4.1 Development Testing
1. Make sure your `.env.local` has the CAPTCHA key
2. Restart your dev server: `npm run dev`
3. Go to http://localhost:3000/auth/register
4. You should see a Cloudflare Turnstile widget before the submit button
5. Complete the form and verify CAPTCHA appears and works

### 4.2 What You Should See
- **With CAPTCHA enabled**: A checkbox widget appears with "Verify you are human"
- **Without CAPTCHA**: If `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is not set, forms work normally (no CAPTCHA)

### 4.3 Testing Different Scenarios

#### Test successful registration:
```bash
# Should show CAPTCHA widget
# After completing CAPTCHA, registration proceeds normally
```

#### Test CAPTCHA validation:
- Try submitting form without completing CAPTCHA
- You should see error: "Please complete the CAPTCHA verification"

#### Test CAPTCHA reset on error:
- Enter invalid credentials
- CAPTCHA should reset, requiring new verification

---

## Step 5: Configure for Production

### 5.1 Create Production Turnstile Site
1. In Cloudflare Turnstile dashboard
2. Create a **new site** for production
3. Domain: `imzenx.in` (your actual domain)
4. Get new Site Key and Secret Key

### 5.2 Add to Vercel
When deploying to Vercel:
1. Go to Vercel project settings
2. **Environment Variables**
3. Add: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = `your_production_site_key`
4. Scope: Production

### 5.3 Update Supabase for Production
Make sure Supabase has the **production Secret Key** configured

---

## Troubleshooting

### CAPTCHA Not Showing
**Issue**: No CAPTCHA widget appears on login/register pages

**Solutions**:
1. Check if `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set in `.env.local`
2. Restart dev server after adding environment variable
3. Check browser console for errors
4. Verify Turnstile script loaded: Look for `https://challenges.cloudflare.com/turnstile/v0/api.js`

### CAPTCHA Verification Fails
**Issue**: Error message "CAPTCHA verification failed"

**Solutions**:
1. Check that Secret Key is correctly set in Supabase
2. Verify domain matches in Cloudflare Turnstile settings
3. For localhost, ensure Turnstile site allows `localhost` domain
4. Check Supabase logs for detailed error messages

### Form Submits Without CAPTCHA
**Issue**: Can submit form even without CAPTCHA

**Solutions**:
1. CAPTCHA is optional if `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is not set
2. This is by design - if no key provided, forms work normally
3. To enforce CAPTCHA, ensure environment variable is set

### Domain Mismatch Error
**Issue**: "Domain mismatch" error in console

**Solutions**:
1. Create separate Turnstile sites for development and production
2. Development site: Allow `localhost`
3. Production site: Allow `imzenx.in`
4. Use correct Site Key for each environment

---

## Implementation Details

### How It Works

1. **Frontend (LoginForm/RegisterForm)**:
   - Loads Cloudflare Turnstile script dynamically
   - Renders CAPTCHA widget
   - Collects CAPTCHA token when user completes challenge
   - Sends token with authentication request

2. **Backend (Supabase)**:
   - Receives CAPTCHA token with auth request
   - Validates token with Cloudflare
   - Allows/denies authentication based on validation

3. **User Experience**:
   - Most users: Automatic verification (invisible)
   - Suspicious activity: Simple checkbox challenge
   - Bot-like behavior: Additional verification steps

### Code Changes Made

#### Files Modified:
- ✅ `src/components/LoginForm.tsx` - Added CAPTCHA widget and validation
- ✅ `src/components/RegisterForm.tsx` - Added CAPTCHA widget and validation
- ✅ `src/lib/auth-context.tsx` - Added CAPTCHA token parameter support

#### Features Added:
- Dynamic Turnstile script loading
- CAPTCHA token state management
- Widget cleanup on unmount
- CAPTCHA reset on authentication failure
- Conditional rendering (only shows if key is configured)
- Form submission disabled until CAPTCHA completed

---

## Optional: Disable CAPTCHA

If you want to temporarily disable CAPTCHA:

### Method 1: Remove Environment Variable
```bash
# Comment out or remove from .env.local
# NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
```

### Method 2: Use Test Keys (Always Pass)
Cloudflare provides test keys that always succeed:
```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```
**Note**: Use only for testing, never in production!

---

## Security Best Practices

### ✅ Do's:
- Use different keys for development and production
- Keep Secret Key secure (never commit to Git)
- Enable CAPTCHA for both signup and login
- Monitor Turnstile analytics for bot attempts
- Regularly check Cloudflare dashboard for abuse patterns

### ❌ Don'ts:
- Don't share your Secret Key publicly
- Don't use test keys in production
- Don't commit `.env.local` to Git
- Don't use same Site Key across multiple domains
- Don't disable CAPTCHA in production

---

## Monitoring and Analytics

### Cloudflare Turnstile Dashboard
Access at: https://dash.cloudflare.com/

**View**:
- Number of CAPTCHA challenges served
- Success vs. failure rates
- Bot detection statistics
- Traffic patterns by country

**Use this data to**:
- Detect unusual bot activity
- Adjust CAPTCHA sensitivity if needed
- Monitor registration/login patterns

---

## Quick Reference

### Environment Variables
```bash
# Development (.env.local)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_dev_site_key

# Production (Vercel)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_prod_site_key
```

### Supabase Configuration Path
```
Supabase Dashboard → Authentication → Settings → Bot and Abuse Protection
```

### Cloudflare Turnstile Dashboard
```
https://dash.cloudflare.com/ → Turnstile → Your Sites
```

---

## Next Steps

After setting up CAPTCHA:

1. ✅ Test registration with CAPTCHA enabled
2. ✅ Test login with CAPTCHA enabled
3. ✅ Verify Supabase logs show successful CAPTCHA validation
4. ✅ Test on mobile devices
5. ✅ Configure production keys for Vercel deployment
6. ✅ Monitor Cloudflare analytics for first week

---

## Support and Resources

- **Cloudflare Turnstile Docs**: https://developers.cloudflare.com/turnstile/
- **Supabase CAPTCHA Guide**: https://supabase.com/docs/guides/auth/auth-captcha
- **Turnstile Dashboard**: https://dash.cloudflare.com/

Need help? Check the troubleshooting section or contact support.
