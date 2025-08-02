# 🚀 AI-Powered Blog CMS - Complete Setup Guide

## 📋 Overview

This is a complete Content Management System (CMS) for blogs with AI-powered design capabilities. Users can sign up, write blog posts, upload images, and use AI to redesign their blog pages with different themes and styles.

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **AI**: Claude 3.5 Sonnet (Anthropic)
- **Deployment**: Vercel (recommended)

## 🔧 Required Services & APIs

### 1. Clerk Authentication
- **Purpose**: User authentication and management
- **Website**: https://clerk.com
- **Setup**:
  1. Create a Clerk account
  2. Create a new application
  3. Get your Publishable Key and Secret Key
  4. Configure sign-in/sign-up pages

### 2. Supabase Database & Storage
- **Purpose**: Database for blog posts, user data, file storage
- **Website**: https://supabase.com
- **Setup**:
  1. Create a Supabase project
  2. Get your Project URL and Anon Key
  3. Run the database schema (see Database Setup section)
  4. Enable Storage for file uploads

### 3. Anthropic Claude API
- **Purpose**: AI-powered content enhancement and design generation
- **Website**: https://console.anthropic.com
- **Setup**:
  1. Create an Anthropic account
  2. Get API access and your API key
  3. Ensure you have credits/billing set up

## 🚀 Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd blogapp

# Install dependencies
npm install
```

### 2. Environment Variables Setup

Copy the environment template and fill in your values:

```bash
# Copy the template
cp env.example.new .env.local
```

Edit `.env.local` with your actual values:

```env
# Claude (Anthropic) AI Configuration
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
AI_PROVIDER=anthropic
AI_MODEL=claude-3-5-sonnet-20241022
AI_TEMPERATURE=0.7
MAX_TOKENS=4000
ENABLE_AI_ENHANCEMENT=true

# Clerk Authentication Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-publishable-key
CLERK_SECRET_KEY=sk_test_your-clerk-secret-key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 3. Database Setup

Run the SQL schema in your Supabase SQL editor:

```sql
-- Copy and paste the entire contents of src/lib/supabase-schema.sql
-- into your Supabase SQL editor and run it
```

This will create:
- Users table
- Blog posts table
- Design history table
- Media files table
- Comments table
- Analytics table
- Row Level Security policies
- Utility functions

### 4. Supabase Storage Setup

In your Supabase dashboard:

1. Go to Storage
2. Create a new bucket called `media`
3. Set the bucket to public
4. Configure storage policies for authenticated users

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 Features & Usage

### For Users:

1. **Sign Up/Sign In**: Create an account or sign in
2. **Dashboard**: View all your blog posts, analytics, and manage content
3. **Write**: Create new blog posts with rich text editor
4. **Image Upload**: Upload featured images and media files
5. **AI Designer**: Use AI to redesign blog pages with custom prompts
6. **Publish**: Publish drafts to make them publicly visible

### For Visitors:

1. **Browse**: Read published blog posts
2. **View**: Beautiful, responsive blog post layouts
3. **AI-Enhanced**: Experience AI-generated designs and layouts

## 🤖 AI Features

### AI Designer Capabilities:

- **Design Prompts**: Natural language design requests
- **Automatic Redesign**: Complete page structure changes
- **Content-Aware**: AI considers blog content when designing
- **Persistent Changes**: Design changes are permanent
- **Version History**: Track design changes in database

### Example AI Prompts:

- "Make it dark and modern with neon accents"
- "Create a professional corporate look"
- "Design it with a retro 80s theme"
- "Make it colorful and playful for a food blog"
- "Apply a minimalist design with lots of white space"

## 📊 Database Schema

### Core Tables:

- **users**: User profiles and auth data
- **blog_posts**: Blog content, metadata, SEO
- **design_history**: AI design change history
- **media_files**: Uploaded images and files
- **comments**: Blog post comments
- **blog_analytics**: View tracking and metrics

### Key Features:

- Row Level Security (RLS) for data protection
- Automatic timestamps and metadata
- SEO-friendly URLs with slugs
- Real-time subscriptions for live updates
- File storage integration

## 🔐 Security Features

- **Authentication**: Secure user auth with Clerk
- **Authorization**: Row-level security in Supabase
- **Data Protection**: Users can only access their own data
- **File Security**: Secure file uploads and storage
- **API Protection**: Authenticated API routes

## 🚀 Deployment

### Vercel Deployment (Recommended):

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

### Environment Variables for Production:

Make sure to set all the same environment variables in your production environment (Vercel, Netlify, etc.).

## 🐛 Troubleshooting

### Common Issues:

1. **Clerk Authentication Not Working**:
   - Check your Clerk keys in .env.local
   - Verify domain settings in Clerk dashboard

2. **Supabase Connection Issues**:
   - Verify Supabase URL and keys
   - Check if RLS policies are enabled
   - Ensure database schema is properly set up

3. **AI Features Not Working**:
   - Check Anthropic API key
   - Verify you have credits in your Anthropic account
   - Check API rate limits

4. **File Upload Issues**:
   - Verify Supabase storage bucket is created
   - Check storage policies and permissions
   - Ensure bucket is set to public

### Debug Steps:

1. Check browser console for errors
2. Verify environment variables are loaded
3. Check Supabase logs for database errors
4. Test API endpoints individually

## 🎨 Customization

### Styling:
- Modify Tailwind classes in components
- Update color schemes in `tailwind.config.js`
- Customize animations and transitions

### AI Prompts:
- Modify AI prompts in `src/lib/ai-code-generator.ts`
- Customize design generation logic
- Add new AI features and capabilities

### Database Schema:
- Add new tables or fields as needed
- Update TypeScript types accordingly
- Modify RLS policies for new features

## 📝 API Endpoints

- `GET /api/blog` - Get blog posts
- `POST /api/blog` - Create blog post
- `PUT /api/blog/[id]` - Update blog post
- `DELETE /api/blog/[id]` - Delete blog post
- `POST /api/upload` - Upload media files
- `GET /api/analyze-structure` - Analyze component structure
- `POST /api/apply-code-changes` - Apply AI-generated code

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

## 💡 Tips for Success

1. **Start Small**: Begin with basic blog functionality before using AI features
2. **Test AI**: Try different design prompts to understand AI capabilities
3. **Backup**: Always backup your database before making major changes
4. **Monitor**: Keep an eye on API usage and costs
5. **Iterate**: Use the design history to track what works best

Ready to build amazing AI-powered blogs! 🎉