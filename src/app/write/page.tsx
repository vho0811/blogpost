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

  const handleSave = useCallback(async (status: 'draft' | 'published') => {
         if (!blogPost.title || !blogPost.content) {
      showNotification('Please provide at least a title and content', 'warning');
      return;
    }
    setIsSaving(true);
    try {
      // For existing posts, keep the original slug (never change it)
      // For new posts, let the database generate a unique slug
      const slug = blogPost.id && blogPost.slug ? blogPost.slug : undefined;
      

      
      // Extract featured image from content or use default
      const extractedImage = extractFeaturedImage(blogPost.content || '');
      
      // Temporary debug - remove this later
      if (!extractedImage && blogPost.content) {
        console.log('🔍 DEBUG: No image extracted from content. Content preview:');
        console.log(blogPost.content.slice(0, 500));
      }
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
        delete (blogData as any).slug;
      }

      console.log('🔍 SAVE DEBUG:', {
        isUpdate: !!blogPost.id,
        blogData: {
          id: blogData.id,
          title: blogData.title,
          slug: blogData.slug,
          hasSlug: 'slug' in blogData
        }
      });

      let result;
      if (blogPost.id && user) {
        result = await blogDatabase.updateBlogPost(blogPost.id, blogData, user.id);
      } else if (user) {
        result = await blogDatabase.createBlogPost(blogData as any, user.id);
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
    // This function now generates a dynamic template with placeholders
    // instead of hardcoded values, so the HTML can adapt to content changes
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{TITLE}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
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

  // Slug generation is now handled by the database to ensure uniqueness

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
    }, 30000); // Auto-save every 30 seconds (reduced from 10)

    return () => clearTimeout(autoSave);
  }, [blogPost, handleSave]);

  // Don't render anything if not loaded or not authenticated
  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-white hover:text-gray-300 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            
            <div className="flex items-center space-x-4">
              {savedMessage && (
                <span className="text-green-400 text-sm">{savedMessage}</span>
              )}
              
              <button
                onClick={() => handleSave('draft')}
                disabled={isSaving}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Saving...' : editId ? 'Update Draft' : 'Save Draft'}
              </button>
              
              <button
                onClick={() => handleSave('published')}
                                 disabled={isSaving || !blogPost.title || !blogPost.content}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-400 hover:to-purple-500 disabled:opacity-50 transition-all"
              >
                {isSaving ? (editId ? 'Updating...' : 'Publishing...') : (editId ? 'Update & Publish' : 'Publish')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Title */}
          <div>
            <input
              type="text"
              placeholder="Enter your blog title..."
                             value={blogPost.title}
               onChange={(e) => setBlogPost({ ...blogPost, title: e.target.value })}
              className="w-full text-4xl md:text-5xl font-bold bg-transparent text-white placeholder-gray-500 border-none outline-none resize-none"
            />
          </div>

          {/* Subtitle */}
          <div>
            <input
              type="text"
              placeholder="Add a subtitle (optional)..."
                             value={blogPost.subtitle}
               onChange={(e) => setBlogPost({ ...blogPost, subtitle: e.target.value })}
              className="w-full text-xl text-gray-300 bg-transparent placeholder-gray-600 border-none outline-none"
            />
          </div>

                    {/* Category */}
          <div className="space-y-4">
            <label className="block text-white font-medium text-lg mb-3">Category</label>
            <div className="relative">
              <select
                value={blogPost.category}
                onChange={(e) => setBlogPost({ ...blogPost, category: e.target.value })}
                className="w-full p-4 pr-12 bg-gradient-to-r from-gray-800 to-gray-700 text-white border-2 border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all duration-300 hover:border-gray-500 hover:from-gray-750 hover:to-gray-650 appearance-none cursor-pointer backdrop-blur-sm shadow-lg"
                style={{
                  backgroundImage: 'linear-gradient(135deg, rgba(31, 41, 55, 0.9) 0%, rgba(55, 65, 81, 0.9) 100%)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
              >
                <option value="General" className="bg-gray-800 text-white py-2">📝 General</option>
                <option value="Technology" className="bg-gray-800 text-white py-2">💻 Technology</option>
                <option value="Lifestyle" className="bg-gray-800 text-white py-2">🌟 Lifestyle</option>
                <option value="Business" className="bg-gray-800 text-white py-2">💼 Business</option>
                <option value="Travel" className="bg-gray-800 text-white py-2">✈️ Travel</option>
                <option value="Food" className="bg-gray-800 text-white py-2">🍽️ Food</option>
                <option value="Health" className="bg-gray-800 text-white py-2">🏥 Health</option>
                <option value="Sports" className="bg-gray-800 text-white py-2">⚽ Sports</option>
                <option value="Entertainment" className="bg-gray-800 text-white py-2">🎬 Entertainment</option>
              </select>
              
              {/* Custom dropdown arrow */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400 transition-transform duration-200 group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {/* Glow effect on focus */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-purple-500/0 transition-all duration-300 pointer-events-none opacity-0 focus-within:opacity-100" style={{
                backgroundImage: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)'
              }}></div>
            </div>
          </div>

          {/* Content Editor */}
          <div className="space-y-4">
            <label className="block text-white font-medium">Content</label>
            <BlockNoteEditor
                             initialContent={blogPost.content}
               onChange={(content) => setBlogPost({ ...blogPost, content })}
              placeholder="Start writing your blog content..."
            />
            <p className="text-gray-400 text-sm">
              Tip: Use the rich text editor with blocks, headings, lists, and more. After publishing, you can enhance the visual appearance with AI design.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <WritePageContent />
    </Suspense>
  );
}