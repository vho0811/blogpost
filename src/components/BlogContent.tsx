'use client';

import { useState, useEffect, useRef } from 'react';
import { blogDatabase, type BlogPost } from '@/lib/blog-database';

interface BlogContentProps {
  docId: string;
}

export default function BlogContent({ docId }: BlogContentProps) {
  const [blogData, setBlogData] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const hasIncrementedViews = useRef(false);

  // Function to sanitize AI-generated HTML and remove navigation buttons
  const sanitizeAIHTML = (html: string): string => {
    if (!html) return html;
    
    // Remove any Back to Stories links/buttons
    let sanitized = html.replace(
      /<a[^>]*class="[^"]*back-link[^"]*"[^>]*>.*?<\/a>/gi,
      ''
    );
    sanitized = sanitized.replace(
      /<a[^>]*href="\/"[^>]*>.*?Back to Stories.*?<\/a>/gi,
      ''
    );
    sanitized = sanitized.replace(
      /<a[^>]*>.*?Back to Stories.*?<\/a>/gi,
      ''
    );
    
    // Remove any AI Design buttons
    sanitized = sanitized.replace(
      /<button[^>]*class="[^"]*ai-design-button[^"]*"[^>]*>.*?<\/button>/gi,
      ''
    );
    sanitized = sanitized.replace(
      /<button[^>]*id="ai-design-button"[^>]*>.*?<\/button>/gi,
      ''
    );
    sanitized = sanitized.replace(
      /<button[^>]*>.*?Design.*?<\/button>/gi,
      ''
    );
    
    // Remove any header/navigation sections that might contain buttons
    sanitized = sanitized.replace(
      /<header[^>]*>.*?<\/header>/gi,
      ''
    );
    sanitized = sanitized.replace(
      /<nav[^>]*>.*?<\/nav>/gi,
      ''
    );
    
    return sanitized;
  };

  // Load blog data
  useEffect(() => {
    const loadBlogData = async () => {
      setLoading(true);
      try {
        let post: BlogPost | null = null;
        post = await blogDatabase.getBlogPostBySlug(docId);
        if (!post) {
          post = await blogDatabase.getBlogPost(docId);
        }
        
        if (post) {
          setBlogData(post);
          
          // Only increment views once per post per session
          if (post.status === 'published' && post.id && !hasIncrementedViews.current) {
            hasIncrementedViews.current = true;
            await blogDatabase.incrementViews(post.id);
            // Update the local state to reflect the incremented view count
            setBlogData(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : prev);
          }
        }
      } catch (error) {
        console.error('Error loading blog data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBlogData();
  }, [docId, refreshKey]);

  // Listen for AI design applied events
  useEffect(() => {
    const handleDesignApplied = () => {
      // Refresh the content after a short delay to allow DB update
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 1000);
    };
    
    window.addEventListener('aiDesignApplied', handleDesignApplied);
    
    return () => {
      window.removeEventListener('aiDesignApplied', handleDesignApplied);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  if (!blogData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Blog Post Not Found</h2>
        <p className="text-gray-600">The requested blog post could not be found.</p>
      </div>
    );
  }

  // Display the HTML from the database
  return (
    <div className="w-full min-h-screen" style={{ zIndex: 1 }}>
      {blogData.ai_generated_html ? (
        <div 
          className="ai-content-container"
          style={{ 
            isolation: 'isolate',
            contain: 'layout style paint',
            zIndex: 1
          }}
        >
          <div 
            dangerouslySetInnerHTML={{ __html: sanitizeAIHTML(blogData.ai_generated_html) }}
            className="w-full min-h-screen"
            style={{ 
              display: 'block',
              width: '100%',
              height: '100%',
              position: 'relative',
              zIndex: 1
            }}
          />
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No HTML Content</h2>
          <p className="text-gray-600">The blog post doesn&apos;t have any HTML content to display.</p>
          <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
            {JSON.stringify(blogData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 