-- Fix likes functionality with better error handling
-- Run this in your Supabase SQL Editor

-- First, let's check what we have
SELECT 'Current tables:' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'blog_posts', 'comments', 'likes');

-- Drop and recreate the toggle_like function with better error handling
DROP FUNCTION IF EXISTS toggle_like(UUID);

CREATE OR REPLACE FUNCTION toggle_like(blog_post_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  existing_like_id UUID;
  user_email TEXT;
  result JSON;
BEGIN
  -- Get user email from auth
  user_email := auth.jwt() ->> 'email';
  
  -- Get or create user
  SELECT id INTO current_user_id 
  FROM public.users 
  WHERE clerk_user_id = auth.uid()::text;
  
  -- If user doesn't exist, create them
  IF current_user_id IS NULL THEN
    INSERT INTO public.users (clerk_user_id, email, username)
    VALUES (auth.uid()::text, user_email, COALESCE(user_email, 'user_' || substr(auth.uid()::text, 1, 8)))
    RETURNING id INTO current_user_id;
  END IF;
  
  -- Verify we have a user ID
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create or find user';
  END IF;
  
  -- Check if like already exists
  SELECT id INTO existing_like_id
  FROM public.likes 
  WHERE blog_post_id = toggle_like.blog_post_id 
  AND user_id = current_user_id;
  
  IF existing_like_id IS NOT NULL THEN
    -- Remove like
    DELETE FROM public.likes 
    WHERE id = existing_like_id;
    
    -- Decrement likes count
    UPDATE public.blog_posts 
    SET likes = GREATEST(COALESCE(likes, 0) - 1, 0)
    WHERE id = toggle_like.blog_post_id;
    
    result := json_build_object('action', 'unliked', 'likes_count', (SELECT likes FROM public.blog_posts WHERE id = toggle_like.blog_post_id));
  ELSE
    -- Add like
    INSERT INTO public.likes (blog_post_id, user_id) 
    VALUES (toggle_like.blog_post_id, current_user_id);
    
    -- Increment likes count
    UPDATE public.blog_posts 
    SET likes = COALESCE(likes, 0) + 1
    WHERE id = toggle_like.blog_post_id;
    
    result := json_build_object('action', 'liked', 'likes_count', (SELECT likes FROM public.blog_posts WHERE id = toggle_like.blog_post_id));
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    RETURN json_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE,
      'user_id', current_user_id,
      'blog_post_id', blog_post_id
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION toggle_like(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_like(UUID) TO anon;

-- Make sure the likes table exists and has correct structure
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blog_post_id, user_id)
);

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_likes_blog_post_id ON public.likes(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

-- Enable RLS on likes table
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate
DROP POLICY IF EXISTS "Anyone can view likes on published posts" ON public.likes;
DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.likes;

-- Create policies
CREATE POLICY "Anyone can view likes on published posts"
  ON public.likes FOR SELECT
  USING (
    blog_post_id IN (
      SELECT id FROM public.blog_posts WHERE status = 'published'
    )
  );

CREATE POLICY "Authenticated users can create likes"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid()::text IN (SELECT clerk_user_id FROM public.users));

CREATE POLICY "Users can delete their own likes"
  ON public.likes FOR DELETE
  USING (auth.uid()::text IN (SELECT clerk_user_id FROM public.users));

-- Grant permissions
GRANT ALL ON public.likes TO authenticated;
GRANT SELECT ON public.likes TO anon;

-- Verify the setup
SELECT 'Function created successfully' as status;
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'toggle_like'; 