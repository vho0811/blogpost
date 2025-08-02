'use client';

import { useState, useEffect } from 'react';
import { blogDatabase, type BlogPost } from '@/lib/blog-database';
import { showNotification } from './BeautifulNotification';

interface AIDesignToggleProps {
  docId: string;
  onDesignApplied?: () => void;
}

export default function AIDesignToggle({ docId, onDesignApplied }: AIDesignToggleProps) {
  const [isAIDesigned, setIsAIDesigned] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [blogData, setBlogData] = useState<BlogPost | null>(null);

  // Load blog data and check AI design status
  useEffect(() => {
    const loadBlogData = async () => {
      try {
        let post: BlogPost | null = null;
        post = await blogDatabase.getBlogPostBySlug(docId);
        if (!post) {
          post = await blogDatabase.getBlogPost(docId);
        }
        
        if (post) {
          setBlogData(post);
          setIsAIDesigned(post.is_ai_designed || false);
        }
      } catch (error) {
        console.error('Error loading blog data:', error);
      }
    };

    loadBlogData();
  }, [docId]);

  const handleAIToggle = async (checked: boolean) => {
    if (checked && !isAIDesigned) {
      // Generate AI design
      await handleGenerateAIDesign();
    } else if (!checked && isAIDesigned) {
      // Reset to blog view
      setIsAIDesigned(false);
      if (onDesignApplied) {
        onDesignApplied();
      }
    }
  };

  const handleGenerateAIDesign = async () => {
    if (!blogData) return;
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/ai-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blogPostId: blogData.id,
          designPrompt: 'Create a beautiful, professional website design with modern styling, enhanced typography, and engaging visual elements. Make it look like a premium blog with excellent user experience.'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setIsAIDesigned(true);
        if (onDesignApplied) {
          onDesignApplied();
        }
      } else {
        showNotification('Failed to generate AI design. Please try again.', 'error');
      }
    } catch (error) {
      showNotification('Failed to generate AI design. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!blogData) {
    return null;
  }

  return (
    <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">🎨 AI Design</h3>
          <p className="text-sm text-gray-600">
            Transform your blog into a beautiful, professional website
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Toggle Switch */}
          <div className="flex items-center">
            <button
              onClick={() => handleAIToggle(!isAIDesigned)}
              disabled={isGenerating}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isAIDesigned ? 'bg-blue-600' : 'bg-gray-200'
              } ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAIDesigned ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="ml-2 text-sm font-medium text-gray-700">
              {isAIDesigned ? 'AI Designed' : 'Blog View'}
            </span>
          </div>
          
          {/* Generate Button */}
          {!isAIDesigned && (
            <button
              onClick={handleGenerateAIDesign}
              disabled={isGenerating}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate AI Design
                </>
              )}
            </button>
          )}
          
          {/* View Website Button */}
          {isAIDesigned && (
            <button
              onClick={() => window.open(`/api/website/${docId}`, '_blank')}
              className="bg-white text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 border"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Website
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 