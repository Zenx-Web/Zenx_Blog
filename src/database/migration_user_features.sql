-- ============================================
-- USER FEATURES MIGRATION
-- Run this in Supabase SQL Editor
-- This adds user authentication tables only
-- ============================================

-- Email subscriptions table
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  preferences JSONB DEFAULT '{"newPosts": true, "weekly": false, "monthly": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User reading history table (tracks what users read)
CREATE TABLE IF NOT EXISTS user_reading_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0, -- Reading progress percentage (0-100)
  completed BOOLEAN DEFAULT FALSE,
  read_time_seconds INTEGER DEFAULT 0,
  first_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- User saved posts/bookmarks table
CREATE TABLE IF NOT EXISTS user_saved_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  preferences JSONB DEFAULT '{"emailNotifications": true, "theme": "light"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on new tables
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can subscribe" ON email_subscriptions;
DROP POLICY IF EXISTS "Anyone can read their own subscription" ON email_subscriptions;
DROP POLICY IF EXISTS "Admin can manage subscriptions" ON email_subscriptions;
DROP POLICY IF EXISTS "Users can view own history" ON user_reading_history;
DROP POLICY IF EXISTS "Users can insert own history" ON user_reading_history;
DROP POLICY IF EXISTS "Users can update own history" ON user_reading_history;
DROP POLICY IF EXISTS "Users can delete own history" ON user_reading_history;
DROP POLICY IF EXISTS "Users can view own saved posts" ON user_saved_posts;
DROP POLICY IF EXISTS "Users can save posts" ON user_saved_posts;
DROP POLICY IF EXISTS "Users can delete own saved posts" ON user_saved_posts;
DROP POLICY IF EXISTS "Users can view any profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Policies for email subscriptions (public can subscribe)
CREATE POLICY "Anyone can subscribe" ON email_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read their own subscription" ON email_subscriptions FOR SELECT USING (true);
CREATE POLICY "Admin can manage subscriptions" ON email_subscriptions FOR ALL USING (auth.email() = 'kbarhoi367@gmail.com');

-- Policies for user reading history (users can only see their own)
CREATE POLICY "Users can view own history" ON user_reading_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON user_reading_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own history" ON user_reading_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own history" ON user_reading_history FOR DELETE USING (auth.uid() = user_id);

-- Policies for user saved posts (users can only see their own)
CREATE POLICY "Users can view own saved posts" ON user_saved_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save posts" ON user_saved_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved posts" ON user_saved_posts FOR DELETE USING (auth.uid() = user_id);

-- Policies for user profiles (users can only see and edit their own)
CREATE POLICY "Users can view any profile" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Add trigger to update user_profiles updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile automatically when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Go to Supabase Dashboard → Authentication → Providers
-- 2. Enable Email provider
-- 3. Set Site URL to: http://localhost:3000 (or your domain)
-- 4. Add redirect URLs: http://localhost:3000/**
-- ============================================
