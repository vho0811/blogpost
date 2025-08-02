'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { blogDatabase, type BlogPost } from '@/lib/blog-database';
import Link from 'next/link';
import BlockNoteEditor from '@/components/BlockNoteEditor';
import { showNotification } from '@/components/BeautifulNotification';

export default function WritePage() {
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedMessage, setSavedMessage] = useState('');

  const handleSave = useCallback(async (status: 'draft' | 'published') => {
         if (!blogPost.title || !blogPost.content) {
      showNotification('Please provide at least a title and content', 'warning');
      return;
    }
    setIsSaving(true);
    try {
      const slug = blogPost.slug || generateSlug(blogPost.title);
      
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
      
      // Generate initial HTML for the blog post
      const initialHTML = generateInitialHTML(blogPost);
      
      const blogData = {
        ...blogPost,
        slug,
        status,
        featured_image_url: featuredImageUrl,
        published_at: status === 'published' ? new Date().toISOString() : undefined,
        // Store the initial HTML in the database
        ai_generated_html: initialHTML,
        ai_website_settings: undefined,
        is_ai_designed: false
      } as BlogPost;

      let result;
      if (blogPost.id && user) {
        result = await blogDatabase.updateBlogPost(blogPost.id, blogData, user.id);
      } else if (user) {
        result = await blogDatabase.createBlogPost(blogData, user.id);
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
    } catch (error: any) {
      showNotification('Failed to save blog post. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [blogPost, user, router]);

  // Generate initial HTML for the blog post
  const generateInitialHTML = (post: Partial<BlogPost>): string => {
    // Get user data for the author info
    const authorName = user?.firstName || user?.username || 'User';
    const authorInitial = authorName.charAt(0).toUpperCase();
    const authorImage = user?.imageUrl || '';
    
    // Calculate read time if not already set
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
    
    // Use actual read time or calculate it
    const readTime = (post.read_time && post.read_time > 0) ? post.read_time : calculateReadTime(post.content || '');
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title}</title>
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
                        <h1 class="title">${post.title}</h1>
                        ${post.subtitle ? `<p class="subtitle">${post.subtitle}</p>` : ''}
                        
                        <div class="author-info">
                            <div class="author-avatar">
                                ${authorImage ? `<img src="${authorImage}" alt="${authorName}" />` : authorInitial}
                            </div>
                            <div class="author-details">
                                <div class="author-name">${authorName}</div>
                                <div class="author-role">Blog Creator</div>
                            </div>
                        </div>
                        
                        <div class="meta">
                            <span>
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                ${new Date().toLocaleDateString()}
                            </span>
                            <span>
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                ${readTime} min read
                            </span>
                            <span>
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                                </svg>
                                ${post.category || 'General'}
                            </span>
                        </div>
                    </div>
                </section>
                
                <section class="content">
                    ${post.featured_image_url ? `<img src="${post.featured_image_url}" alt="${post.title}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 10px; margin-bottom: 2rem; box-shadow: 0 8px 25px rgba(0,0,0,0.4);" />` : ''}
                    ${post.content}
                </section>
            </main>
        </div>
    </div>
</body>
</html>
    `;
  };

  const generateSlug = (title: string): string => {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Add timestamp to make it unique
    const timestamp = Date.now().toString().slice(-6);
    return `${baseSlug}-${timestamp}`;
  };

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

  // Auto-save functionality
  useEffect(() => {
    const autoSave = setTimeout(() => {
             if (blogPost.title && blogPost.content) {
        handleSave('draft');
      }
    }, 10000); // Auto-save every 10 seconds

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
            <label className="block text-white font-medium">Category</label>
            <select
                             value={blogPost.category}
               onChange={(e) => setBlogPost({ ...blogPost, category: e.target.value })}
              className="w-full p-3 bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="General">General</option>
              <option value="Technology">Technology</option>
              <option value="Lifestyle">Lifestyle</option>
              <option value="Business">Business</option>
              <option value="Travel">Travel</option>
              <option value="Food">Food</option>
              <option value="Health">Health</option>
              <option value="Sports">Sports</option>
              <option value="Entertainment">Entertainment</option>
            </select>
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