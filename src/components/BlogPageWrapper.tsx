'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { blogDatabase, type BlogPost } from '@/lib/blog-database';
import SimpleAIDesignButton from '@/components/SimpleAIDesignButton';
import ReadingProgressBar from '@/components/ReadingProgressBar';
import Link from 'next/link';

// Function to replace all dynamic placeholders in HTML template
function replaceAllPlaceholders(htmlTemplate: string, blogPost: BlogPost): string {
  if (!htmlTemplate || !blogPost) return htmlTemplate || '';
  
  // Get user data for author info
  const authorData = blogPost.users;
  const authorName = authorData?.first_name || authorData?.username || 'Unknown Author';
  const authorImage = authorData?.profile_image_url || '';
  const authorInitial = authorName.charAt(0).toUpperCase();
  
  // Calculate read time if needed
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
  
  const readTime = (blogPost.read_time && blogPost.read_time > 0) ? blogPost.read_time : calculateReadTime(blogPost.content || '');
  
  // Replace all placeholders with actual values
  return htmlTemplate
    .replace(/{TITLE}/g, blogPost.title || 'Untitled')
    .replace(/{SUBTITLE}/g, blogPost.subtitle ? `<p class="subtitle">${blogPost.subtitle}</p>` : '')
    .replace(/{CONTENT}/g, blogPost.content || '')
    .replace(/{AUTHOR_NAME}/g, authorName)
    .replace(/{AUTHOR_AVATAR}/g, authorImage ? `<img src="${authorImage}" alt="${authorName}" />` : authorInitial)
    .replace(/{PUBLISH_DATE}/g, new Date(blogPost.published_at || blogPost.created_at || '').toLocaleDateString())
    .replace(/{READ_TIME}/g, readTime.toString())
    .replace(/{CATEGORY}/g, blogPost.category || 'General');
}

interface BlogPageWrapperProps {
  blogId: string;
}

export default function BlogPageWrapper({ blogId }: BlogPageWrapperProps) {
  const { user } = useUser();
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBlogPost = async () => {
      setLoading(true);
      try {
        let post: BlogPost | null = null;
        
        // First try to get by slug (for published posts)
        post = await blogDatabase.getBlogPostBySlug(blogId);
        
        // If not found by slug, only try by ID if it looks like a UUID
        if (!post && blogId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          post = await blogDatabase.getBlogPost(blogId);
        }
        
        if (post) {
          console.log('🔍 BlogPageWrapper loaded post:', {
            id: post.id,
            title: post.title,
            hasAiHtml: !!post.ai_generated_html,
            aiHtmlLength: post.ai_generated_html?.length,
            contentLength: post.content?.length,
            contentPreview: post.content?.slice(0, 100)
          });
          setBlogPost(post);
        }
      } catch (error) {
        console.error('Error loading blog post:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBlogPost();
  }, [blogId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* Reading Progress Bar - Fixed at top level */}
      <ReadingProgressBar blogId={blogId} />
      
      {/* Floating Buttons - Completely separate from HTML content */}
      <div className="fixed top-10 left-10 z-[9999]" style={{ isolation: 'isolate', contain: 'layout style paint' }}>
        <Link href="/" className="group bg-gray-900/95 backdrop-blur-md text-white px-10 py-5 rounded-2xl font-semibold hover:bg-gray-800/95 transition-all duration-300 flex items-center gap-5 shadow-2xl border border-gray-700/30 hover:border-gray-600/50 hover:shadow-gray-900/25 hover:scale-105 leading-tight" style={{ all: 'unset', display: 'flex', alignItems: 'center', gap: '1.25rem', backgroundColor: 'rgba(17, 24, 39, 0.95)', backdropFilter: 'blur(12px)', color: 'white', padding: '1.25rem 2.5rem', borderRadius: '1rem', fontWeight: '600', transition: 'all 0.3s ease', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(55, 65, 81, 0.3)', textDecoration: 'none', fontSize: '1.125rem', letterSpacing: '0.025em', lineHeight: '1.25', cursor: 'pointer', zIndex: 9999 }}>
          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="transition-transform duration-300 group-hover:-translate-x-1">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          <span className="text-lg tracking-wide">Back to Stories</span>
        </Link>
      </div>
      
      {/* Floating AI Design Button - Only show for owner */}
      <div className="fixed top-10 right-10 z-[9999]" style={{ isolation: 'isolate', contain: 'layout style paint' }}>
        <SimpleAIDesignButton blogId={blogId} blogPost={blogPost} />
      </div>
      
      {/* HTML Content - This can change, buttons stay the same */}
      <div className="w-full" style={{ zIndex: 1 }}>
        <div className="w-full min-h-screen" style={{ zIndex: 1 }}>
          {blogPost?.ai_generated_html ? (
            <div 
              className="ai-content-container"
              style={{ 
                isolation: 'isolate',
                contain: 'layout style paint',
                zIndex: 1
              }}
            >
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: replaceAllPlaceholders(blogPost.ai_generated_html, blogPost)
                }}
                className="w-full min-h-screen"
                style={{ 
                  display: 'block',
                  zIndex: 1
                }}
              />
            </div>
          ) : (
            <div className="w-full min-h-screen bg-white" style={{ zIndex: 1 }}>
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{blogPost?.title}</h1>
                {blogPost?.subtitle && (
                  <p className="text-xl text-gray-600 mb-8">{blogPost.subtitle}</p>
                )}
                <div className="prose prose-lg max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: blogPost?.content || '' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 