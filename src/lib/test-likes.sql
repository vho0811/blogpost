-- Test likes functionality
-- Run this in your Supabase SQL Editor to check if everything is set up correctly

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('likes', 'comments', 'users', 'blog_posts');

-- Check if function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'toggle_like';

-- Check if policies exist
SELECT policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'likes';

-- Test the function (this will fail if not authenticated, but shows the function exists)
-- SELECT toggle_like('00000000-0000-0000-0000-000000000000'); 