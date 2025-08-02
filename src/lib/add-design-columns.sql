-- Add all missing columns to blog_posts table
-- Run this in your Supabase SQL Editor

-- Add design_config column to store JSON configuration for React components
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS design_config JSONB DEFAULT '{
  "theme": "dark-modern",
  "colors": {
    "primary": "#60a5fa",
    "secondary": "#a855f7",
    "background": "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
    "text": "#f8fafc",
    "accent": "#10b981"
  },
  "typography": {
    "fontFamily": "Inter, sans-serif",
    "headingWeight": "900",
    "bodyWeight": "400"
  },
  "layout": {
    "maxWidth": "1200px",
    "padding": "2rem",
    "spacing": "1.5rem"
  },
  "effects": {
    "glassmorphism": true,
    "gradients": true,
    "shadows": true,
    "animations": true
  }
}'::jsonb;

-- Add is_custom_designed column
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS is_custom_designed BOOLEAN DEFAULT FALSE;

-- Add ai_generated_component column to store AI-generated React component code
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS ai_generated_component TEXT;

-- Verify all columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
AND table_schema = 'public'
AND column_name IN ('design_config', 'is_custom_designed', 'ai_generated_component')
ORDER BY column_name; 