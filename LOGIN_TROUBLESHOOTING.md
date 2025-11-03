# 🚨 LOGIN ISSUE TROUBLESHOOTING

## The Problem
You're seeing "Invalid login credentials" even after disabling hCaptcha.

## Most Likely Causes

### 1. **User Account Doesn't Exist** (90% chance)
The email `zenxen368@gmail.com` hasn't been registered yet.

**Solution:**
1. Go to http://localhost:3000/auth/register
2. Fill in the registration form
3. Create an account with your email and password
4. Then try logging in

---

### 2. **Email Not Confirmed** (If you already registered)
Supabase might require email confirmation.

**Check Supabase Settings:**
1. Go to: https://supabase.com/dashboard/project/umfhehmdhiusxmyezdkk/settings/auth
2. Look for **"Email Auth"** section
3. Find **"Confirm email"** toggle
4. If it's ON, you need to confirm your email before logging in
5. **Recommended**: Turn it OFF for development

**If Email Confirmation is ON:**
- Check your email inbox for confirmation link from Supabase
- Click the link to verify your email
- Then try logging in again

---

### 3. **Wrong Password**
The password you're entering doesn't match what's stored.

**Solution:**
- Make sure Caps Lock is OFF
- Use the "Show Password" eye icon to verify you typed it correctly
- Try password reset if needed

---

### 4. **Wrong Email Format**
Supabase might have a different email stored.

**Emails to try:**
- `zenxen368@gmail.com` (current)
- `kbarhoi367@gmail.com` (from .env.local ADMIN_EMAIL)

---

## ✅ RECOMMENDED STEPS (In Order):

### Step 1: Disable Email Confirmation
1. Open: https://supabase.com/dashboard/project/umfhehmdhiusxmyezdkk/settings/auth
2. Scroll to **"Email Auth"**
3. Toggle **OFF** "Confirm email"
4. Click **Save**

### Step 2: Register New Account
1. Go to: http://localhost:3000/auth/register
2. Fill in:
   - Display Name: Your name
   - Email: `zenxen368@gmail.com`
   - Password: `Krishna@122`
   - Confirm Password: `Krishna@122`
3. Accept terms
4. Click "Create Account"

### Step 3: Try Login
1. Go to: http://localhost:3000/auth/login
2. Email: `zenxen368@gmail.com`
3. Password: `Krishna@122`
4. Click "Sign In"

---

## 🔍 How to Check If User Exists

### Option A: Via Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/umfhehmdhiusxmyezdkk/auth/users
2. Look for your email in the users list
3. If you see it, the account exists
4. Check if "Email Confirmed" column shows ✅ or ❌

### Option B: Via SQL Editor
1. Go to: https://supabase.com/dashboard/project/umfhehmdhiusxmyezdkk/sql/new
2. Run this query:
```sql
SELECT email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email IN ('zenxen368@gmail.com', 'kbarhoi367@gmail.com');
```
3. If empty result = account doesn't exist
4. If shows data = account exists

---

## 🎯 Quick Test Right Now:

**Go to the register page and try to create an account:**
http://localhost:3000/auth/register

If registration succeeds → Account didn't exist before
If registration says "User already exists" → Account exists but password is wrong or email needs confirmation

---

## 📞 Still Not Working?

After trying the above, if you still get "Invalid login credentials":

1. **Check browser console** (F12 → Console tab)
   - Look for any error messages
   - Share them with me

2. **Try clearing browser data**
   - Cookies
   - Local storage
   - Session storage

3. **Try incognito/private mode**
   - Sometimes cached auth data causes issues

4. **Verify Supabase connection**
   - Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correct in .env.local
   - Restart dev server after any .env changes

---

## Most Common Fix:
**Just register a new account! 90% of the time, "Invalid credentials" means the account doesn't exist yet.** 🎯

Go here now: http://localhost:3000/auth/register
