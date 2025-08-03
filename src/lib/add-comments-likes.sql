-- Add comments and likes functionality
-- Run this in your Supabase SQL Editor

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes table
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blog_post_id, user_id) -- Prevent duplicate likes
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
CREATE POLICY "Anyone can view comments on published posts"
  ON public.comments FOR SELECT
  USING (
    blog_post_id IN (
      SELECT id FROM public.blog_posts WHERE status = 'published'
    )
  );

CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid()::text IN (SELECT clerk_user_id FROM public.users));

CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE
  USING (user_id IN (SELECT id FROM public.users WHERE clerk_user_id = auth.uid()::text));

CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  USING (user_id IN (SELECT id FROM public.users WHERE clerk_user_id = auth.uid()::text));

-- Likes policies
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
  USING (user_id IN (SELECT id FROM public.users WHERE clerk_user_id = auth.uid()::text));

-- Functions for managing likes
CREATE OR REPLACE FUNCTION toggle_like(blog_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user ID
  SELECT id INTO current_user_id FROM public.users WHERE clerk_user_id = auth.uid()::text;
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Check if like exists
  IF EXISTS (SELECT 1 FROM public.likes WHERE blog_post_id = toggle_like.blog_post_id AND user_id = current_user_id) THEN
    -- Remove like
    DELETE FROM public.likes WHERE blog_post_id = toggle_like.blog_post_id AND user_id = current_user_id;
    -- Decrement likes count
    UPDATE public.blog_posts SET likes = GREATEST(likes - 1, 0) WHERE id = toggle_like.blog_post_id;
  ELSE
    -- Add like
    INSERT INTO public.likes (blog_post_id, user_id) VALUES (toggle_like.blog_post_id, current_user_id);
    -- Increment likes count
    UPDATE public.blog_posts SET likes = COALESCE(likes, 0) + 1 WHERE id = toggle_like.blog_post_id;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION toggle_like(UUID) TO authenticated; 