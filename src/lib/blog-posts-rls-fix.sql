-- Fix RLS policies for blog_posts table
-- Run this in your Supabase SQL Editor

-- Drop existing RLS policies for blog_posts
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Users can view their own blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Users can insert their own blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Users can update their own blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Users can delete their own blog posts" ON blog_posts;

-- Create new RLS policies for blog_posts
CREATE POLICY "Anyone can view published blog posts" ON blog_posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "Users can view their own blog posts" ON blog_posts
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Users can insert their own blog posts" ON blog_posts
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Users can update their own blog posts" ON blog_posts
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Users can delete their own blog posts" ON blog_posts
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Alternative: Temporarily disable RLS for testing
-- ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY; 