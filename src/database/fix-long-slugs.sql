-- Fix existing long slugs that exceed btree index limit
-- This script truncates slugs to 100 characters and ensures uniqueness

-- First, let's see which slugs are too long
-- SELECT slug, LENGTH(slug) FROM blog_posts WHERE LENGTH(slug) > 100;

-- Update long slugs by truncating them and ensuring they end cleanly
UPDATE blog_posts 
SET slug = CASE 
  WHEN LENGTH(slug) > 100 THEN 
    REGEXP_REPLACE(
      SUBSTRING(slug FROM 1 FOR 100), 
      '-+$', 
      ''
    )
  ELSE slug 
END
WHERE LENGTH(slug) > 100;

-- Handle potential duplicates by adding a number suffix
-- This is a more complex operation that may need manual review
DO $$
DECLARE
    rec RECORD;
    counter INTEGER;
    new_slug TEXT;
BEGIN
    -- Find duplicates after truncation
    FOR rec IN 
        SELECT slug, COUNT(*) as cnt 
        FROM blog_posts 
        GROUP BY slug 
        HAVING COUNT(*) > 1
    LOOP
        counter := 1;
        -- Update duplicates with numbered suffixes
        FOR rec IN 
            SELECT id, slug 
            FROM blog_posts 
            WHERE slug = rec.slug 
            ORDER BY created_at
        LOOP
            IF counter > 1 THEN
                new_slug := rec.slug || '-' || counter;
                -- Ensure the new slug with suffix isn't too long
                IF LENGTH(new_slug) > 100 THEN
                    new_slug := SUBSTRING(rec.slug FROM 1 FOR (95 - LENGTH(counter::TEXT))) || '-' || counter;
                END IF;
                UPDATE blog_posts SET slug = new_slug WHERE id = rec.id;
            END IF;
            counter := counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- Finally, alter the column to enforce the length constraint
ALTER TABLE blog_posts ALTER COLUMN slug TYPE VARCHAR(100);