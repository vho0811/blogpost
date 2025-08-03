-- Simple likes setup - more reliable version
-- Run this in your Supabase SQL Editor

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS toggle_like(UUID);

-- Create a simpler toggle_like function
CREATE OR REPLACE FUNCTION toggle_like(blog_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  existing_like_id UUID;
BEGIN
  -- Get current user ID from auth
  SELECT id INTO current_user_id 
  FROM public.users 
  WHERE clerk_user_id = auth.uid()::text;
  
  -- If user doesn't exist, create them
  IF current_user_id IS NULL THEN
    INSERT INTO public.users (clerk_user_id, email)
    VALUES (auth.uid()::text, auth.jwt() ->> 'email')
    ON CONFLICT (clerk_user_id) DO NOTHING
    RETURNING id INTO current_user_id;
    
    -- If still null, get the existing user
    IF current_user_id IS NULL THEN
      SELECT id INTO current_user_id 
      FROM public.users 
      WHERE clerk_user_id = auth.uid()::text;
    END IF;
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
  ELSE
    -- Add like
    INSERT INTO public.likes (blog_post_id, user_id) 
    VALUES (toggle_like.blog_post_id, current_user_id);
    
    -- Increment likes count
    UPDATE public.blog_posts 
    SET likes = COALESCE(likes, 0) + 1
    WHERE id = toggle_like.blog_post_id;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION toggle_like(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_like(UUID) TO anon;

-- Make sure tables exist with proper structure
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blog_post_id, user_id)
);

-- Enable RLS on likes table
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Create policies for likes
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
  WITH CHECK (auth.uid()::text IN (SELECT clerk_user_id FROM public.users));

DROP POLICY IF EXISTS "Users can delete their own likes" ON public.likes;
CREATE POLICY "Users can delete their own likes"
  ON public.likes FOR DELETE
  USING (auth.uid()::text IN (SELECT clerk_user_id FROM public.users));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_likes_blog_post_id ON public.likes(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id); 