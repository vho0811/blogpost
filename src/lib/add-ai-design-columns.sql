-- Add AI design columns to blog_posts table
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS ai_generated_html TEXT,
ADD COLUMN IF NOT EXISTS ai_website_settings JSONB,
ADD COLUMN IF NOT EXISTS is_ai_designed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_designed_at TIMESTAMP WITH TIME ZONE;

-- Add index for AI design queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_ai_designed ON blog_posts(is_ai_designed);

-- Add index for AI design timestamp
CREATE INDEX IF NOT EXISTS idx_blog_posts_ai_designed_at ON blog_posts(ai_designed_at);

-- Update existing blog posts to have default values
UPDATE blog_posts 
SET 
  ai_generated_html = NULL,
  ai_website_settings = NULL,
  is_ai_designed = FALSE,
  ai_designed_at = NULL
WHERE ai_generated_html IS NULL; 