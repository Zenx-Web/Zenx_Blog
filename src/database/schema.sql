-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog posts table
CREATE TABLE blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  featured_image TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  seo_title TEXT,
  seo_description TEXT,
  read_time INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (category) REFERENCES categories(slug)
);

-- Trending topics table
CREATE TABLE trending_topics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  topic TEXT NOT NULL,
  source TEXT NOT NULL,
  relevance_score INTEGER DEFAULT 0,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site analytics table
CREATE TABLE site_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_path TEXT NOT NULL,
  views INTEGER DEFAULT 1,
  unique_visitors INTEGER DEFAULT 1,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(page_path, date)
);

-- Email subscriptions table
CREATE TABLE email_subscriptions (
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
CREATE TABLE user_reading_history (
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
CREATE TABLE user_saved_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- User profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  preferences JSONB DEFAULT '{"emailNotifications": true, "theme": "light"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, slug, description, color) VALUES
('Technology', 'technology', 'Latest tech trends and innovations', '#8B5CF6'),
('Entertainment', 'entertainment', 'Movies, TV shows, celebrity news', '#F59E0B'),
('Lifestyle', 'lifestyle', 'Health, fashion, and lifestyle trends', '#10B981'),
('Business', 'business', 'Market trends and business news', '#3B82F6'),
('Sports', 'sports', 'Sports news and trending events', '#EF4444'),
('World News', 'world-news', 'Breaking news and global events', '#6B7280'),
('Science', 'science', 'Scientific research and discoveries', '#06B6D4'),
('Health', 'health', 'Health and wellness news', '#10B981');

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can read published posts" ON blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can read categories" ON categories FOR SELECT USING (true);

-- Create policies for admin access (you'll need to set up authentication)
CREATE POLICY "Admin can do everything on posts" ON blog_posts FOR ALL USING (auth.email() = 'kbarhoi367@gmail.com');
CREATE POLICY "Admin can do everything on categories" ON categories FOR ALL USING (auth.email() = 'kbarhoi367@gmail.com');
CREATE POLICY "Admin can do everything on trending topics" ON trending_topics FOR ALL USING (auth.email() = 'kbarhoi367@gmail.com');
CREATE POLICY "Admin can do everything on analytics" ON site_analytics FOR ALL USING (auth.email() = 'kbarhoi367@gmail.com');

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

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment views
CREATE OR REPLACE FUNCTION increment_post_views(post_slug TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE blog_posts
  SET views = COALESCE(views, 0) + 1
  WHERE slug = post_slug;
END;
$$ language 'plpgsql';

-- Function to track page analytics
CREATE OR REPLACE FUNCTION track_page_view(page_path TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO site_analytics (page_path, views, unique_visitors, date)
    VALUES (page_path, 1, 1, CURRENT_DATE)
    ON CONFLICT (page_path, date)
    DO UPDATE SET
        views = site_analytics.views + 1,
        unique_visitors = site_analytics.unique_visitors + 1;
END;
$$ language 'plpgsql';

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

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();