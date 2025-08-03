# Comments and Likes Setup Guide

## SQL Setup

1. **Run the SQL script** in your Supabase SQL Editor:
   - Copy the contents of `src/lib/add-comments-likes.sql`
   - Paste it into your Supabase SQL Editor
   - Click "Run" to execute the script

## What the SQL script does:

### Creates Tables:
- **`comments`** - Stores user comments on blog posts
- **`likes`** - Stores user likes on blog posts (with unique constraint to prevent duplicates)

### Sets up Security:
- **Row Level Security (RLS)** enabled on both tables
- **Policies** that allow:
  - Anyone to view comments/likes on published posts
  - Authenticated users to create comments/likes
  - Users to update/delete their own comments
  - Users to delete their own likes

### Creates Functions:
- **`toggle_like(blog_post_id UUID)`** - Handles like/unlike functionality
  - Automatically increments/decrements the likes count in blog_posts table
  - Prevents duplicate likes from the same user

## Features Added:

### Comments:
- ✅ Add comments (authenticated users only)
- ✅ View all comments on published posts
- ✅ Delete own comments
- ✅ Real-time comment count display
- ✅ User avatars and names
- ✅ Timestamp formatting

### Likes:
- ✅ Toggle like/unlike (authenticated users only)
- ✅ Real-time like count updates
- ✅ Visual feedback (heart icon fills when liked)
- ✅ Prevents duplicate likes
- ✅ Works on both regular and AI-designed blog posts

### UI Components:
- **`CommentsSection`** - Full comments interface
- **`LikeButton`** - Toggle like button with count
- Both components handle authentication states

## Usage:

1. **Comments**: Users can add comments below any blog post (must be signed in)
2. **Likes**: Users can like/unlike posts (must be signed in)
3. **Real-time**: Counts update immediately without page refresh
4. **Responsive**: Works on all screen sizes

## Security:
- Only authenticated users can like/comment
- Users can only delete their own comments
- Comments are only visible on published posts
- All database operations are protected by RLS policies

The implementation is simple and user-friendly - just click to like, type to comment! 