-- Fix likes functionality for Clerk authentication
-- Run this in your Supabase SQL Editor

-- Drop the problematic RPC function that uses auth.uid()
DROP FUNCTION IF EXISTS toggle_like(UUID);

-- Ensure the likes table exists with proper structure
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blog_post_id, user_id) -- Prevent duplicate likes
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_likes_blog_post_id ON public.likes(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

-- Enable RLS on likes table
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Update RLS policies for likes to work with Clerk
DROP POLICY IF EXISTS "Anyone can view likes on published posts" ON public.likes;
CREATE POLICY "Anyone can view likes on published posts"
  ON public.likes FOR SELECT
  USING (
    blog_post_id IN (
      SELECT id FROM public.blog_posts WHERE status = 'published'
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.likes;
CREATE POLICY "Authenticated users can create likes"
  ON public.likes FOR INSERT
  WITH CHECK (true); -- We'll handle authentication in the application layer

DROP POLICY IF EXISTS "Users can delete their own likes" ON public.likes;
CREATE POLICY "Users can delete their own likes"
  ON public.likes FOR DELETE
  WITH CHECK (true); -- We'll handle authentication in the application layer

-- Grant permissions
GRANT ALL ON public.likes TO authenticated;
GRANT SELECT ON public.likes TO anon;

-- Verify the setup
SELECT 'Likes table setup completed' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'likes';
SELECT indexname FROM pg_indexes WHERE tablename = 'likes'; 