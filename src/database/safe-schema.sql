-- Safe Database Setup Script (handles existing tables)
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table (safe creation)
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog posts table (safe creation)
CREATE TABLE IF NOT EXISTS blog_posts (
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

-- Trending topics table (safe creation)
CREATE TABLE IF NOT EXISTS trending_topics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  topic TEXT NOT NULL,
  source TEXT NOT NULL,
  relevance_score INTEGER DEFAULT 0,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site analytics table (safe creation)
CREATE TABLE IF NOT EXISTS site_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_path TEXT NOT NULL,
  views INTEGER DEFAULT 1,
  unique_visitors INTEGER DEFAULT 1,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(page_path, date)
);

-- Insert default categories (safe insertion)
INSERT INTO categories (name, slug, description, color) 
SELECT * FROM (VALUES
  ('Technology', 'technology', 'Latest tech trends and innovations', '#8B5CF6'),
  ('Entertainment', 'entertainment', 'Movies, TV shows, celebrity news', '#F59E0B'),
  ('Lifestyle', 'lifestyle', 'Health, fashion, and lifestyle trends', '#10B981'),
  ('Business', 'business', 'Market trends and business news', '#3B82F6'),
  ('Sports', 'sports', 'Sports news and trending events', '#EF4444'),
  ('World News', 'world-news', 'Breaking news and global events', '#6B7280')
) AS t(name, slug, description, color)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE categories.slug = t.slug);

-- Enable Row Level Security (safe)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe cleanup)
DROP POLICY IF EXISTS "Anyone can read published posts" ON blog_posts;
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
DROP POLICY IF EXISTS "Admin can do everything on posts" ON blog_posts;
DROP POLICY IF EXISTS "Admin can do everything on categories" ON categories;
DROP POLICY IF EXISTS "Admin can do everything on trending topics" ON trending_topics;
DROP POLICY IF EXISTS "Admin can do everything on analytics" ON site_analytics;

-- Create policies for public read access
CREATE POLICY "Anyone can read published posts" ON blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can read categories" ON categories FOR SELECT USING (true);

-- Create policies for admin access
CREATE POLICY "Admin can do everything on posts" ON blog_posts FOR ALL USING (auth.email() = 'kbarhoi367@gmail.com');
CREATE POLICY "Admin can do everything on categories" ON categories FOR ALL USING (auth.email() = 'kbarhoi367@gmail.com');
CREATE POLICY "Admin can do everything on trending topics" ON trending_topics FOR ALL USING (auth.email() = 'kbarhoi367@gmail.com');
CREATE POLICY "Admin can do everything on analytics" ON site_analytics FOR ALL USING (auth.email() = 'kbarhoi367@gmail.com');

-- Function to update the updated_at timestamp (safe creation)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment views (safe creation)
CREATE OR REPLACE FUNCTION increment_post_views(post_slug TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE blog_posts SET views = views + 1 WHERE slug = post_slug;
END;
$$ language 'plpgsql';

-- Function to track page analytics (safe creation)
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