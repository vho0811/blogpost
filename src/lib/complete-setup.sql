-- Complete setup for comments and likes - fixes all schema issues
-- Run this in your Supabase SQL Editor

-- First, drop existing tables and functions to start fresh
DROP FUNCTION IF EXISTS toggle_like(UUID);
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create likes table
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blog_post_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_blog_post_id ON public.comments(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_blog_post_id ON public.likes(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Comments policies
DROP POLICY IF EXISTS "Anyone can view comments on published posts" ON public.comments;
CREATE POLICY "Anyone can view comments on published posts"
  ON public.comments FOR SELECT
  USING (
    blog_post_id IN (
      SELECT id FROM public.blog_posts WHERE status = 'published'
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid()::text IN (SELECT clerk_user_id FROM public.users));

DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE
  USING (user_id IN (SELECT id FROM public.users WHERE clerk_user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  USING (user_id IN (SELECT id FROM public.users WHERE clerk_user_id = auth.uid()::text));

-- Likes policies
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

-- Create the toggle_like function
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

-- Grant permissions on tables
GRANT ALL ON public.comments TO authenticated;
GRANT ALL ON public.likes TO authenticated;
GRANT SELECT ON public.comments TO anon;
GRANT SELECT ON public.likes TO anon;

-- Verify the setup
SELECT 'Tables created successfully' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('comments', 'likes');
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'toggle_like'; 