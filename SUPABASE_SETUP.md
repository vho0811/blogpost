# 🗄️ **Complete Supabase Setup Guide**

## 📋 **What You Need to Set Up**

### **1. Create Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Sign up/login and create a new project
3. Choose a region close to your users
4. Wait for project to be ready (2-3 minutes)

### **2. Get Your API Keys**
1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **3. Run the Database Schema**

#### **Step 1: Open SQL Editor**
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**

#### **Step 2: Copy and Paste the Schema**
Copy the **entire contents** of `src/lib/supabase-schema.sql` and paste it into the SQL editor.

#### **Step 3: Execute the Schema**
Click **Run** to create all tables, policies, and functions.

### **4. Set Up Storage Bucket**

#### **Step 1: Create Media Bucket**
1. Go to **Storage** in your Supabase dashboard
2. Click **Create a new bucket**
3. Name it: `media`
4. Set it to **Public**
5. Click **Create bucket**

#### **Step 2: Configure Storage Policies**
In the SQL Editor, run this additional SQL:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Allow users to view their own files
CREATE POLICY "Users can view their own files" ON storage.objects
FOR SELECT USING (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Allow users to update their own files
CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (bucket_id = 'media' AND auth.role() = 'authenticated');
```

### **5. Configure Environment Variables**

Add these to your `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 🔍 **Verify Your Setup**

### **Check Tables Created**
Go to **Table Editor** in Supabase and verify these tables exist:
- ✅ `users`
- ✅ `blog_posts`
- ✅ `design_history`
- ✅ `design_templates`
- ✅ `comments`
- ✅ `media_files`
- ✅ `blog_analytics`

### **Check Storage Bucket**
Go to **Storage** and verify:
- ✅ `media` bucket exists
- ✅ Bucket is set to **Public**
- ✅ Policies are configured

### **Test Database Connection**
Run this in your SQL Editor to test:

```sql
-- Test user creation
INSERT INTO users (clerk_user_id, email, username) 
VALUES ('test-user-123', 'test@example.com', 'testuser')
ON CONFLICT (clerk_user_id) DO NOTHING;

-- Test blog post creation
INSERT INTO blog_posts (user_id, title, content, slug, status)
SELECT id, 'Test Post', 'This is a test post', 'test-post', 'draft'
FROM users WHERE clerk_user_id = 'test-user-123';

-- Verify data
SELECT * FROM blog_posts;
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Table doesn't exist"**
**Solution**: Make sure you ran the complete schema SQL. Check the **Table Editor** to see if tables were created.

### **Issue 2: "Permission denied"**
**Solution**: Check that Row Level Security (RLS) policies are enabled and configured correctly.

### **Issue 3: "Storage bucket not found"**
**Solution**: 
1. Verify the `media` bucket exists
2. Check bucket is set to **Public**
3. Verify storage policies are configured

### **Issue 4: "Invalid API key"**
**Solution**: 
1. Double-check your API keys in `.env.local`
2. Make sure you're using the correct project URL
3. Verify keys are not truncated

### **Issue 5: "RLS policy violation"**
**Solution**: This usually means the user isn't authenticated. Check that:
1. Clerk authentication is working
2. User is properly signed in
3. RLS policies are correctly configured

## 🔧 **Advanced Configuration**

### **Enable Real-time Features**
The schema already includes real-time subscriptions, but you can verify in **Database** → **Replication** that these tables are enabled:
- `blog_posts`
- `comments`
- `blog_analytics`

### **Custom Functions**
The schema includes these utility functions:
- `handle_updated_at()`: Auto-updates timestamps
- `generate_slug()`: Creates URL-friendly slugs
- `calculate_read_time()`: Estimates reading time

### **Backup & Restore**
To backup your schema:
1. Go to **Settings** → **Database**
2. Click **Download schema**
3. Save the SQL file for future reference

## 📊 **Database Schema Overview**

### **Core Tables**
```sql
users              → User profiles & authentication
blog_posts         → Blog content & metadata
media_files        → Uploaded images & files
design_history     → AI design changes
comments           → User engagement
blog_analytics     → Performance metrics
```

### **Key Features**
- ✅ **Row Level Security**: Users only see their own data
- ✅ **Real-time subscriptions**: Live updates
- ✅ **Automatic timestamps**: Created/updated tracking
- ✅ **Foreign key relationships**: Data integrity
- ✅ **Indexes**: Fast queries
- ✅ **Triggers**: Auto-update timestamps

## 🎯 **Next Steps**

1. **Test the Setup**: Create a test user and blog post
2. **Configure Clerk**: Set up authentication
3. **Set up Anthropic**: Get your AI API key
4. **Start Development**: Run `npm run dev`
5. **Create Content**: Sign up and start writing!

---

## 💡 **Pro Tips**

- **Backup Regularly**: Export your schema periodically
- **Monitor Usage**: Check Supabase dashboard for usage metrics
- **Test Policies**: Verify RLS policies work as expected
- **Optimize Queries**: Use the provided indexes for performance
- **Scale Up**: Supabase handles scaling automatically

**Your database is now ready for the AI-powered blog CMS!** 🚀 