-- Add the missing increment_views function
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION increment_views(blog_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE blog_posts 
  SET views = COALESCE(views, 0) + 1
  WHERE id = blog_post_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_views(UUID) TO anon; 