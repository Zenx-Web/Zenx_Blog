-- Add missing categories that are in admin dashboard but not in database
INSERT INTO categories (name, slug, description, color) VALUES
('Science', 'science', 'Scientific research and discoveries', '#06B6D4'),
('Health', 'health', 'Health and wellness news', '#10B981')
ON CONFLICT (slug) DO NOTHING;