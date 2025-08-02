-- Fix RLS policies to allow user creation
-- Run this in your Supabase SQL Editor

-- Drop existing RLS policies for users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create new RLS policies that allow user creation
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Allow user creation without authentication (for initial signup)
CREATE POLICY "Allow user creation" ON users
  FOR INSERT WITH CHECK (true);

-- Alternative: If the above doesn't work, temporarily disable RLS for testing
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Then re-enable after testing:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY; 