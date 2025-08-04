'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { blogDatabase, type BlogPost } from '@/lib/blog-database';
import Link from 'next/link';
import BlockNoteEditor from '@/components/BlockNoteEditor';
import { showNotification } from '@/components/BeautifulNotification';

function WritePageContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  
  const [blogPost, setBlogPost] = useState<Partial<BlogPost>>({
    title: '',
    subtitle: '',
    content: '',
    category: 'General',
    status: 'draft'
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [showTips, setShowTips] = useState(false);

  const handleSave = useCallback(async (status: 'draft' | 'published') => {
    if (!blogPost.title || !blogPost.content) {
      showNotification('Please provide at least a title and content', 'warning');
      return;
    }
    setIsSaving(true);
    try {
      // Extract featured image from content or use default
      const extractedImage = extractFeaturedImage(blogPost.content || '');
      
      const featuredImageUrl = extractedImage || 'data:image/svg+xml;base64,' + btoa(`
        <svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
              <stop offset="25%" style="stop-color:#0f172a;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#334155;stop-opacity:1" />
              <stop offset="75%" style="stop-color:#1e293b;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
            </linearGradient>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" stroke-width="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gradient)"/>
          <rect width="100%" height="100%" fill="url(#grid)"/>
          <circle cx="200" cy="150" r="60" fill="#3b82f6" opacity="0.1"/>
          <circle cx="600" cy="250" r="80" fill="#8b5cf6" opacity="0.08"/>
          <circle cx="400" cy="200" r="40" fill="#06b6d4" opacity="0.12"/>
          <text x="400" y="210" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif" font-size="18" font-weight="600">Blog Post</text>
        </svg>
      `);
      
      // Calculate read time for the blog post
      const calculateReadTime = (content: string): number => {
        if (!content) return 1;
        const text = content
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim();
        const words = text.split(/\s+/).filter(word => word.length > 0);
        return Math.max(Math.ceil(words.length / 200), 1);
      };

      const readTime = calculateReadTime(blogPost.content || '');
      
      // Create blog data differently for new vs existing posts
      let blogData: Partial<BlogPost>;
      
      if (blogPost.id) {
        // For UPDATES: Never include slug to avoid unique constraint conflicts
        blogData = {
          title: blogPost.title,
          subtitle: blogPost.subtitle,
          content: blogPost.content,
          category: blogPost.category,
          status,
          read_time: readTime,
          featured_image_url: featuredImageUrl,
          published_at: status === 'published' ? new Date().toISOString() : undefined,
          // PRESERVE existing AI-designed HTML, only regenerate if none exists
          ai_generated_html: blogPost.ai_generated_html || generateInitialHTML(blogPost)
        };
      } else {
        // For NEW POSTS: Let database generate slug
        blogData = {
          ...blogPost,
          status,
          read_time: readTime,
          featured_image_url: featuredImageUrl,
          published_at: status === 'published' ? new Date().toISOString() : undefined,
          ai_generated_html: generateInitialHTML(blogPost),
          ai_website_settings: undefined,
          is_ai_designed: false
        };
        // Remove any existing slug to let database generate it
        delete (blogData as Partial<BlogPost> & { slug?: string }).slug;
      }

      let result;
      if (blogPost.id && user) {
        result = await blogDatabase.updateBlogPost(blogPost.id, blogData, user.id);
      } else if (user) {
        result = await blogDatabase.createBlogPost(blogData as Omit<BlogPost, 'id' | 'user_id' | 'created_at' | 'updated_at'>, user.id);
      }

      if (result) {
        setBlogPost(result);
        setSavedMessage(status === 'published' ? 'Published successfully!' : 'Saved as draft');
        setTimeout(() => setSavedMessage(''), 3000);
        
        // Step 2: Redirect to published blog page after publishing
        if (status === 'published' && result.slug) {
          router.push(`/blog/${result.slug}`);
        }
      } else {
        showNotification('Failed to save blog post - there might be a duplicate title or slug. Please try a different title.', 'error');
      }
    } catch (error: unknown) {
      showNotification('Failed to save blog post. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [blogPost, user, router]);

  // Generate initial HTML for the blog post
  const generateInitialHTML = useCallback((post: Partial<BlogPost>): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{TITLE}</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;900&family=Source+Sans+Pro:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, sans-serif; 
            line-height: 1.6; 
            color: #e2e8f0; 
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
            min-height: 100vh; 
        }
        .outer-wrapper {
            min-height: 100vh;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
        .hero { 
            padding: 6rem 0; 
            text-align: center; 
        }
        .title { 
            font-size: 4rem; 
            font-weight: 900; 
            font-family: 'Playfair Display', serif;
            margin-bottom: 1.5rem; 
            background: linear-gradient(135deg, #60a5fa, #8b5cf6, #ec4899); 
            -webkit-background-clip: text; 
            -webkit-text-fill-color: transparent; 
            background-clip: text;
            line-height: 1.1;
        }
        .subtitle { 
            font-size: 1.5rem; 
            color: #9ca3af; 
            margin-bottom: 3rem; 
            font-weight: 400;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        .meta { 
            display: flex; 
            justify-content: center; 
            gap: 3rem; 
            margin-bottom: 4rem; 
            color: #9ca3af;
            font-size: 0.95rem;
            font-weight: 500;
        }
        .meta span {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .author-info {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
            justify-content: center;
        }
        .author-avatar {
            width: 3rem;
            height: 3rem;
            border-radius: 50%;
            background: linear-gradient(135deg, #60a5fa, #8b5cf6);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 1.2rem;
            overflow: hidden;
        }
        .author-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .author-details {
            text-align: left;
        }
        .author-name {
            color: white;
            font-weight: 600;
            font-size: 1.1rem;
        }
        .author-role {
            color: #9ca3af;
            font-size: 0.9rem;
        }
        .content { 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 3rem; 
            background: rgba(31,41,55,0.6); 
            backdrop-filter: blur(20px); 
            border-radius: 1.5rem; 
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .content h1, .content h2, .content h3 { 
            color: #60a5fa; 
            margin: 2.5rem 0 1.5rem 0; 
            font-weight: 700;
        }
        .content h1 { font-size: 2rem; }
        .content h2 { font-size: 1.75rem; }
        .content h3 { font-size: 1.5rem; }
        .content p { 
            margin-bottom: 1.5rem; 
            line-height: 1.8;
            color: #e2e8f0;
            font-size: 1.125rem;
            font-weight: 300;
            letter-spacing: 0.01em;
        }
        .content a { 
            color: #60a5fa; 
            text-decoration: none;
            border-bottom: 1px solid rgba(96, 165, 250, 0.3);
            transition: all 0.3s ease;
        }
        .content a:hover { 
            color: #93c5fd;
            border-bottom-color: #93c5fd;
        }
        .content ul, .content ol {
            margin: 1.5rem 0;
            padding-left: 2rem;
        }
        .content li {
            margin-bottom: 0.5rem;
            line-height: 1.7;
        }
        .content blockquote {
            border-left: 4px solid #60a5fa;
            padding-left: 1.5rem;
            margin: 2rem 0;
            font-style: italic;
            color: #9ca3af;
        }
        .content code {
            background: rgba(96, 165, 250, 0.1);
            padding: 0.2rem 0.4rem;
            border-radius: 0.25rem;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9rem;
        }
        .content pre {
            background: rgba(0, 0, 0, 0.3);
            padding: 1.5rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 1.5rem 0;
        }
        @media (max-width: 768px) { 
            .title { font-size: 2.5rem; } 
            .subtitle { font-size: 1.25rem; }
            .meta { flex-direction: column; gap: 1rem; } 
            .container { padding: 0 1rem; }
            .content { padding: 2rem; }
            .hero { padding: 4rem 0; }
        }
    </style>
</head>
<body>
    <div class="outer-wrapper">
        <div class="container">
            <main>
                <section class="hero">
                    <div class="container">
                        <h1 class="title">{TITLE}</h1>
                        {SUBTITLE}
                        
                        <div class="author-info">
                            <div class="author-avatar">
                                {AUTHOR_AVATAR}
                            </div>
                            <div class="author-details">
                                <div class="author-name">{AUTHOR_NAME}</div>
                                <div class="author-role">Blog Creator</div>
                            </div>
                        </div>
                        
                        <div class="meta">
                            <span>
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                {PUBLISH_DATE}
                            </span>
                            <span>
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                {READ_TIME} min read
                            </span>
                            <span>
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                                </svg>
                                {CATEGORY}
                            </span>
                        </div>
                    </div>
                </section>
                
                <section class="content">
                    {CONTENT}
                </section>
            </main>
        </div>
    </div>
</body>
</html>
    `;
  }, [user]);

  // Extract the FIRST image from content for featured image
  const extractFeaturedImage = (content: string): string | undefined => {
    if (!content) return undefined;

    try {
      // Check if content is JSON (BlockNote format)
      if (content.startsWith('[') && content.endsWith(']')) {
        const blocks = JSON.parse(content);
        
        // Iterate through blocks in order to find the FIRST image
        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i];
          
          // Check for different possible image block structures
          if (block.type === 'image') {
            // Try different possible paths for the image URL
            const imageUrl = block.props?.url || 
                           block.props?.src || 
                           block.content?.url || 
                           block.content?.src ||
                           block.url ||
                           block.src;
            
            if (imageUrl) {
              return imageUrl;
            }
          }
        }
      } else {
        // Check HTML content for the FIRST image
        const imgRegex = /<img[^>]+src=["']([^"'>]+)["'][^>]*>/i;
        const match = content.match(imgRegex);
        if (match && match[1]) {
          return match[1];
        }
      }
    } catch (error) {
      // Error parsing content for images - silently fail
    }

    return undefined;
  };

  // Redirect if not logged in
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }
  }, [isLoaded, user, router]);

  // Load existing blog post for editing
  useEffect(() => {
    const loadBlogPost = async () => {
      if (editId && user) {
        try {
          const existingPost = await blogDatabase.getBlogPost(editId);
          if (existingPost) {
            setBlogPost(existingPost);
          }
        } catch (error) {
          // Error loading blog post for editing
        }
      }
    };

    loadBlogPost();
  }, [editId, user]);

  // Auto-save functionality (reduced frequency to avoid interference)
  useEffect(() => {
    const autoSave = setTimeout(() => {
      if (blogPost.title && blogPost.content) {
        handleSave('draft');
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSave);
  }, [blogPost, handleSave]);

  // Calculate completion percentage
  const completionPercentage = Math.min(100, 
    ((blogPost.title ? 25 : 0) + 
     (blogPost.subtitle ? 15 : 0) + 
     (blogPost.content ? 60 : 0))
  );

  // Don't render anything if not loaded or not authenticated
  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-white/60 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-white/60">
                  {editId ? 'Editing Story' : 'New Story'}
                </div>
                <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-500 ease-out"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-white/40">{completionPercentage}%</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {savedMessage && (
                <span className="text-white/80 text-sm font-medium">{savedMessage}</span>
              )}
              
              <button
                onClick={() => setShowTips(!showTips)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              <button
                onClick={() => handleSave('draft')}
                disabled={isSaving}
                className="px-6 py-2.5 text-white/80 bg-white/5 rounded-full hover:bg-white/10 transition-all duration-300 border border-white/10 text-sm font-medium disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : editId ? 'Update Draft' : 'Save Draft'}
              </button>
              
              <button
                onClick={() => handleSave('published')}
                disabled={isSaving || !blogPost.title || !blogPost.content}
                className="px-6 py-2.5 bg-white text-black rounded-full hover:bg-white/90 transition-all duration-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (editId ? 'Updating...' : 'Publishing...') : (editId ? 'Update & Publish' : 'Publish')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Writing Tips Panel */}
      {showTips && (
        <div className="bg-white/5 border-b border-white/10 px-6 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-2">
                <h3 className="text-white font-medium">Writing Tips</h3>
                <ul className="text-white/60 space-y-1 text-xs">
                  <li>• Start with a compelling title</li>
                  <li>• Use clear, concise language</li>
                  <li>• Break up text with headings</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-medium">Formatting</h3>
                <ul className="text-white/60 space-y-1 text-xs">
                  <li>• Use # for main headings</li>
                  <li>• Use ## for subheadings</li>
                  <li>• Add images to enhance content</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-medium">AI Enhancement</h3>
                <ul className="text-white/60 space-y-1 text-xs">
                  <li>• Publish first, then enhance with AI</li>
                  <li>• AI can improve visual design</li>
                  <li>• Customize colors and layouts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Story Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-medium mb-4">Story Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-xs font-medium uppercase tracking-wide block mb-2">Category</label>
                  <select
                    value={blogPost.category}
                    onChange={(e) => setBlogPost({ ...blogPost, category: e.target.value })}
                    className="w-full p-3 bg-white/5 text-white border border-white/10 rounded-lg focus:ring-2 focus:ring-white/20 focus:border-white/20 focus:outline-none transition-all duration-300 text-sm"
                  >
                    <option value="General" className="bg-black text-white">General</option>
                    <option value="Technology" className="bg-black text-white">Technology</option>
                    <option value="Design" className="bg-black text-white">Design</option>
                    <option value="Business" className="bg-black text-white">Business</option>
                    <option value="Lifestyle" className="bg-black text-white">Lifestyle</option>
                    <option value="Science" className="bg-black text-white">Science</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-white/60 text-xs font-medium uppercase tracking-wide block mb-2">Read Time</label>
                  <div className="text-white/80 text-sm">
                    {blogPost.content ? `${Math.ceil((blogPost.content.length || 0) / 200)} min read` : '0 min read'}
                  </div>
                </div>
                
                <div>
                  <label className="text-white/60 text-xs font-medium uppercase tracking-wide block mb-2">Status</label>
                  <div className="text-white/80 text-sm">
                    {editId ? 'Editing existing story' : 'Creating new story'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-medium mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowTips(!showTips)}
                  className="w-full text-left p-3 text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 text-sm"
                >
                  {showTips ? 'Hide' : 'Show'} Writing Tips
                </button>
                <Link
                  href="/"
                  className="block w-full text-left p-3 text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 text-sm"
                >
                  View All Stories
                </Link>
              </div>
            </div>
          </div>

          {/* Main Writing Area */}
          <div className="lg:col-span-3 space-y-8">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-white/60 text-sm font-medium uppercase tracking-wide">Title</label>
              <input
                type="text"
                placeholder="Enter your story title..."
                value={blogPost.title}
                onChange={(e) => setBlogPost({ ...blogPost, title: e.target.value })}
                className="w-full text-3xl md:text-4xl font-light bg-transparent text-white placeholder-white/30 border-none outline-none resize-none leading-tight"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <label className="text-white/60 text-sm font-medium uppercase tracking-wide">Subtitle</label>
              <input
                type="text"
                placeholder="Add a subtitle to your story..."
                value={blogPost.subtitle}
                onChange={(e) => setBlogPost({ ...blogPost, subtitle: e.target.value })}
                className="w-full text-lg text-white/80 bg-transparent placeholder-white/30 border-none outline-none leading-relaxed"
              />
            </div>

            {/* Content Editor */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-white/60 text-sm font-medium uppercase tracking-wide">Content</label>
                <div className="text-white/40 text-xs">
                  {blogPost.content ? `${Math.ceil((blogPost.content.length || 0) / 200)} min read` : '0 min read'}
                </div>
              </div>
              <div className="border border-white/10 rounded-lg overflow-hidden bg-white/5">
                <BlockNoteEditor
                  initialContent={blogPost.content}
                  onChange={(content) => setBlogPost({ ...blogPost, content })}
                  placeholder="Start writing your story..."
                />
              </div>
              <p className="text-white/40 text-xs">
                Use the rich text editor to create your story. After publishing, you can enhance the visual design with AI.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <WritePageContent />
    </Suspense>
  );
}