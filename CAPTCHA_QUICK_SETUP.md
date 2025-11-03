# Quick CAPTCHA Setup - 5 Minutes

## What You Need to Do RIGHT NOW

### Step 1: Get Cloudflare Turnstile Keys (2 minutes)
1. Go to https://dash.cloudflare.com/sign-up (free account)
2. After login, click **Turnstile** in left menu
3. Click **Add Site**
4. Enter:
   - Site name: `Zenx Blog Local`
   - Domain: `localhost`
   - Widget mode: `Managed`
5. Click **Create**
6. **COPY** the **Site Key** (looks like: `1x00000000000000000000AA`)
7. **COPY** the **Secret Key** (looks like: `1x0000000000000000000000000000000AA`)

### Step 2: Add to Your .env.local (1 minute)
Open `c:\Users\Maac Panbazar\Desktop\blogs Zenx\zenx-blog\.env.local`

Add this line at the bottom:
```bash
# Cloudflare Turnstile CAPTCHA
NEXT_PUBLIC_TURNSTILE_SITE_KEY=paste_your_site_key_here
```

### Step 3: Configure Supabase (2 minutes)
1. Go to https://supabase.com/dashboard/project/umfhehmdhiusxmyezdkk/settings/auth
2. Scroll down to **Bot and Abuse Protection**
3. Toggle **Enable Cloudflare Turnstile** to ON
4. Paste your **Secret Key** from Step 1
5. Check these boxes:
   - ✅ Enable for Sign Up
   - ✅ Enable for Sign In
6. Click **Save**

### Step 4: Test It (30 seconds)
1. Restart dev server: Stop current server and run `npm run dev`
2. Go to http://localhost:3000/auth/register
3. You should see a CAPTCHA widget appear above the "Create Account" button
4. Try submitting without checking - should show error
5. Complete CAPTCHA and submit - should work!

---

## That's It! 🎉

CAPTCHA is now protecting your login and registration forms from bots.

### For Production Deployment:
When you deploy to Vercel, create a **second** Turnstile site:
- Domain: `imzenx.in` (not localhost)
- Add the production Site Key to Vercel environment variables
- Update Supabase Secret Key for production

See `CAPTCHA_SETUP.md` for detailed production setup guide.

---

## Quick Test Commands

```powershell
# Restart dev server
npm run dev

# Visit registration page
start http://localhost:3000/auth/register

# Visit login page  
start http://localhost:3000/auth/login
```

---

## Troubleshooting

**CAPTCHA not showing?**
- Did you add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` to `.env.local`?
- Did you restart the dev server after adding it?
- Check browser console for errors

**Form won't submit?**
- Complete the CAPTCHA verification first
- Make sure Supabase has the Secret Key configured
- Check domain matches (use `localhost` for development)

**Still having issues?**
Check `CAPTCHA_SETUP.md` for detailed troubleshooting guide.
