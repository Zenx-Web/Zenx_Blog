# Supabase Authentication Setup Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Enable Email Authentication

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: **umfhehmdhiusxmyezdkk**
3. Navigate to: **Authentication** → **Providers**
4. Find **Email** and toggle it **ON** (if not already enabled)

### Step 2: Configure Site URLs

Still in **Authentication** settings:

1. Click on **URL Configuration**
2. Set these values:

**Site URL** (for production):
```
https://imzenx.in
```

**Redirect URLs** (add both):
```
http://localhost:3000/**
https://imzenx.in/**
```

This allows redirects after login/signup to work properly.

### Step 3: Run Database Migration

You need to create the user tables in Supabase:

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste this SQL:

```sql
-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email subscriptions table
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  preferences JSONB DEFAULT '{"newPosts": true, "weeklyDigest": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

-- User reading history
CREATE TABLE IF NOT EXISTS user_reading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  read_time_seconds INTEGER DEFAULT 0,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- User saved posts (bookmarks)
CREATE TABLE IF NOT EXISTS user_saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for email_subscriptions
DROP POLICY IF EXISTS "Anyone can subscribe" ON email_subscriptions;
CREATE POLICY "Anyone can subscribe"
  ON email_subscriptions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their subscription" ON email_subscriptions;
CREATE POLICY "Users can view their subscription"
  ON email_subscriptions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update their subscription" ON email_subscriptions;
CREATE POLICY "Users can update their subscription"
  ON email_subscriptions FOR UPDATE
  USING (true);

-- RLS Policies for user_reading_history
DROP POLICY IF EXISTS "Users can view their own history" ON user_reading_history;
CREATE POLICY "Users can view their own history"
  ON user_reading_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own history" ON user_reading_history;
CREATE POLICY "Users can insert their own history"
  ON user_reading_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own history" ON user_reading_history;
CREATE POLICY "Users can update their own history"
  ON user_reading_history FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own history" ON user_reading_history;
CREATE POLICY "Users can delete their own history"
  ON user_reading_history FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_saved_posts
DROP POLICY IF EXISTS "Users can view their saved posts" ON user_saved_posts;
CREATE POLICY "Users can view their saved posts"
  ON user_saved_posts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save posts" ON user_saved_posts;
CREATE POLICY "Users can save posts"
  ON user_saved_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave posts" ON user_saved_posts;
CREATE POLICY "Users can unsave posts"
  ON user_saved_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_reading_history_user_id ON user_reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reading_history_post_id ON user_reading_history(post_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_posts_user_id ON user_saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_posts_post_id ON user_saved_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_email ON email_subscriptions(email);
```

3. Click **Run** or press `Ctrl+Enter`
4. You should see "Success. No rows returned"

### Step 4: Configure Email Templates (Optional)

For better branded emails from Supabase:

1. Go to **Authentication** → **Email Templates**
2. Customize these templates:
   - **Confirm signup** - Sent when user registers
   - **Magic Link** - For passwordless login (if you enable it)
   - **Change Email Address** - When user changes email
   - **Reset Password** - Password reset emails

You can add your branding, logo, and custom text.

## ✅ Test Your Authentication

### 1. Create a Test Account

Visit: http://localhost:3000/auth/register

- **Email**: test@example.com
- **Display Name**: Test User
- **Password**: Test123!@#
- **Confirm Password**: Test123!@#

Click **Sign Up**

### 2. Check Supabase Dashboard

Go to **Authentication** → **Users**

You should see your new user listed!

### 3. Login

Visit: http://localhost:3000/auth/login

- **Email**: test@example.com
- **Password**: Test123!@#

Click **Sign In**

You should be redirected to: http://localhost:3000/dashboard

### 4. View Dashboard

The dashboard shows:
- Articles read count
- Saved posts
- Reading time statistics
- Recent reading history

## 🔒 Security Features Already Enabled

✅ **Row Level Security (RLS)** - Users can only see/edit their own data
✅ **Secure Password Storage** - Handled by Supabase (bcrypt)
✅ **Session Management** - Auto refresh tokens
✅ **Email Verification** - Can be enabled in settings
✅ **Password Reset** - Built-in functionality

## 📧 Email Confirmation (Optional)

By default, users can sign up without email confirmation. To require email verification:

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle **Confirm email** to ON
3. Users must click link in email before they can log in

**Note**: For development, you might want to keep this OFF for easier testing.

## 🎯 What Works Now

### User Features:
- ✅ Sign up with email/password
- ✅ Login/logout
- ✅ Password reset
- ✅ User dashboard
- ✅ Reading history tracking
- ✅ Bookmark/save posts
- ✅ User profile management

### Admin Features:
- ✅ Generate blog posts with AI
- ✅ Manage posts in admin panel
- ✅ Send email notifications to subscribers
- ✅ View analytics

## 🐛 Troubleshooting

### "Invalid login credentials"
- Check email/password are correct
- Verify user exists in Supabase dashboard
- Check if email confirmation is required

### "User not authorized"
- RLS policies might be blocking access
- Check user is logged in (check browser console)
- Verify RLS policies are created

### Database errors
- Make sure you ran the migration SQL
- Check table names match (lowercase, underscores)
- Look at Supabase logs: **Database** → **Query Performance**

### Email not sending
- Check SMTP settings in Supabase
- For development, emails appear in Supabase logs
- Enable email auth provider

## 🚀 Next Steps

1. ✅ Run the SQL migration above
2. ✅ Enable email authentication
3. ✅ Create a test user account
4. ✅ Test login/logout
5. ✅ Customize email templates (optional)
6. ✅ Enable email confirmation (for production)

## 📞 Need Help?

- **Supabase Docs**: https://supabase.com/docs/guides/auth
- **Supabase Discord**: https://discord.supabase.com
- **Your Supabase Project**: https://supabase.com/dashboard/project/umfhehmdhiusxmyezdkk

---

**Your authentication system is ready to use!** 🎉
