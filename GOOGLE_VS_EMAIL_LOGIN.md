# 🔐 Google OAuth vs Email/Password Login - Important Info

## The Issue You're Experiencing

You logged in via **Google OAuth** (`zenxen368@gmail.com`), and now when you try to login with **email/password** using the SAME email, it says "Invalid credentials".

## Why This Happens

When you sign in with Google:
- Supabase creates an account linked to Google OAuth
- No password is set for this account
- The account is identified by the Google provider

When you try to login with email/password:
- Supabase looks for an account with a password
- Your account exists, but has NO PASSWORD (only Google OAuth)
- Result: "Invalid credentials" error

**This is NORMAL behavior!** 🎯

---

## ✅ Solutions

### **Solution 1: Stick to One Login Method (Recommended)**

**If you signed up with Google → Always use Google to login**

1. Go to http://localhost:3000/auth/login
2. Click **"Continue with Google"** button
3. ✅ Works perfectly!

**Don't mix Google and email/password for the SAME email address.**

---

### **Solution 2: Use Different Emails**

If you want to test both login methods:

**For Google OAuth:**
- Email: `zenxen368@gmail.com`
- Method: "Continue with Google" button

**For Email/Password:**
- Email: `test@example.com` (different email!)
- Method: Email/password form
- Register at: http://localhost:3000/auth/register

---

### **Solution 3: Link Password to Your Google Account**

You CAN add a password to your Google-created account, but it requires using Supabase's password recovery:

1. Go to http://localhost:3000/auth/login
2. Click **"Forgot password?"**
3. Enter: `zenxen368@gmail.com`
4. Check your email for password reset link
5. Set a new password
6. ✅ Now you can login with both Google AND email/password!

---

## 🔧 For Development Setup

I've updated your `.env.local`:
- Changed `NEXT_PUBLIC_SITE_URL` from `https://imzenx.in` to `http://localhost:3000`
- This fixes OAuth redirects during development

**Now you need to configure Supabase:**

### Step 1: Add Redirect URL to Supabase
1. Go to: https://supabase.com/dashboard/project/umfhehmdhiusxmyezdkk/auth/url-configuration
2. Under **"Redirect URLs"**, add:
   ```
   http://localhost:3000/auth/callback
   ```
3. Click **"Add URL"** or **"Save"**

### Step 2: Verify Google OAuth is Enabled
1. Go to: https://supabase.com/dashboard/project/umfhehmdhiusxmyezdkk/auth/providers
2. Make sure **Google** is enabled
3. If not enabled, you'll need Google OAuth credentials (Client ID & Secret)

---

## 📝 Summary

**Your account created via Google:**
- ✅ Works with "Continue with Google" button
- ❌ Won't work with email/password (no password set)

**To use email/password:**
- Option A: Reset password via "Forgot password?" link
- Option B: Use a different email address for testing

**Recommended for you:**
- Just use Google login! It's simpler and more secure
- Click "Continue with Google" every time you login
- ✅ No password to remember!

---

## 🎯 Quick Fix Right Now

**To login successfully:**
1. Go to http://localhost:3000/auth/login
2. Click **"Continue with Google"** (the button with Google icon)
3. Authorize with your Google account
4. ✅ You'll be logged in!

**Don't use the email/password fields unless you've set a password via password reset.**

---

Need help setting this up? Let me know! 🚀
