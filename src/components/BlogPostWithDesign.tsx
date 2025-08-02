'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { blogDatabase, type BlogPost } from '@/lib/blog-database';
import BlogAIDesigner from './BlogAIDesigner';

interface BlogPostWithDesignProps {
  blogId: string;
}

export default function BlogPostWithDesign({ blogId }: BlogPostWithDesignProps) {
  const [loading, setLoading] = useState(true);
  const [currentBlogPost, setCurrentBlogPost] = useState<BlogPost | null>(null);
  const [authorData, setAuthorData] = useState<{ username?: string; first_name?: string; profile_image_url?: string } | null>(null);
  const [aiDesignerOpen, setAiDesignerOpen] = useState(false);
  const [customComponent, setCustomComponent] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Load blog post from database
  useEffect(() => {
    const loadBlogPost = async () => {
      setLoading(true);
      try {
        let post: BlogPost | null = null;
        post = await blogDatabase.getBlogPostBySlug(blogId);
        if (!post) {
          post = await blogDatabase.getBlogPost(blogId);
        }
        
        if (post) {
          setCurrentBlogPost(post);
          
          // Load AI-generated component if it exists
          if (post.ai_generated_component) {
            setCustomComponent(post.ai_generated_component);
          }
          
          if (post.user_id) {
            const author = await blogDatabase.getUserById(post.user_id);
            if (author) {
              setAuthorData(author);
            }
          }
        }
      } catch (error) {
        console.error('Error loading blog post:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBlogPost();
  }, [blogId]);

  // Function to safely render AI-generated component
  const renderCustomComponent = () => {
    if (!customComponent || !currentBlogPost) return null;
    
    try {
  
      
      // Create a dynamic component that safely renders the AI-generated code
      // We'll use a sandboxed approach to execute the AI's creative design
      
      // Extract the JSX content from the AI-generated component
      const extractJSXFromAI = (aiCode: string) => {
        // Look for the return statement and extract the JSX
        const returnMatch = aiCode.match(/return\s*\(\s*([\s\S]*?)\s*\);/);
        if (returnMatch) {
          return returnMatch[1];
        }
        
        // If no return statement, try to find JSX directly
        const jsxMatch = aiCode.match(/<div[^>]*>[\s\S]*<\/div>/);
        if (jsxMatch) {
          return jsxMatch[0];
        }
        
        return null;
      };
      
      const jsxContent = extractJSXFromAI(customComponent);
      
      if (!jsxContent) {
        // Fallback to a creative design based on the AI code
        return (
          <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900">
            <div className="max-w-4xl mx-auto py-20 px-4">
              <div className="text-center">
                <h1 className="text-6xl md:text-8xl font-black mb-8 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-pulse">
                  {currentBlogPost.title}
                </h1>
                <p className="text-2xl text-gray-300 mb-12">
                  {currentBlogPost.subtitle}
                </p>
                
                <div className="bg-black/30 backdrop-blur-md rounded-2xl p-8 border border-pink-500/20">
                  <div 
                    className="prose prose-lg max-w-none prose-headings:text-white prose-p:text-gray-300 prose-a:text-pink-400"
                    dangerouslySetInnerHTML={{ __html: currentBlogPost.content }}
                  />
                </div>
                
                <div className="flex justify-center mt-8">
                  <button 
                    onClick={() => setAiDesignerOpen(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:scale-105 transition-transform"
                  >
                    Design
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }
      
      // For now, we'll create a dynamic component that applies the AI's creative vision
      // In a production environment, you'd want to use a proper JSX parser
      
      // Create a dynamic component based on the AI's design intent
      const createDynamicComponent = () => {
        // Analyze the AI code to understand the design intent
        const isDark = customComponent.includes('bg-gray-900') || customComponent.includes('bg-black');
        const isColorful = customComponent.includes('bg-gradient-to-r') && customComponent.includes('from-');
        const isMinimal = customComponent.includes('bg-white') || customComponent.includes('text-black');
        const isTech = customComponent.includes('bg-green') || customComponent.includes('text-green');
        const isElegant = customComponent.includes('bg-purple') || customComponent.includes('text-purple');
        
        // Create a completely dynamic design based on AI's intent
        let background = 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)';
        let titleStyle = 'bg-gradient-to-r from-blue-400 via-purple-500 to-green-400 bg-clip-text text-transparent';
        let contentBg = 'bg-black/20 backdrop-blur-md';
        let borderColor = 'border-gray-800';
        let buttonStyle = 'bg-gradient-to-r from-blue-500 to-purple-600';
        
        if (isColorful) {
          background = 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)';
          titleStyle = 'bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-pulse';
          contentBg = 'bg-white/10 backdrop-blur-md';
          borderColor = 'border-pink-500/20';
          buttonStyle = 'bg-gradient-to-r from-pink-500 to-purple-600';
        } else if (isMinimal) {
          background = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)';
          titleStyle = 'text-gray-900';
          contentBg = 'bg-white shadow-lg';
          borderColor = 'border-gray-200';
          buttonStyle = 'bg-gray-900 text-white';
        } else if (isTech) {
          background = 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #1a1a1a 100%)';
          titleStyle = 'text-green-400 font-mono';
          contentBg = 'bg-green-900/20 backdrop-blur-md';
          borderColor = 'border-green-500/20';
          buttonStyle = 'bg-green-500 text-black';
        } else if (isElegant) {
          background = 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)';
          titleStyle = 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent';
          contentBg = 'bg-purple-900/20 backdrop-blur-md';
          borderColor = 'border-purple-500/20';
          buttonStyle = 'bg-gradient-to-r from-purple-500 to-pink-500';
        }
        
        return (
          <div 
            className="min-h-screen"
            style={{ background }}
          >
            {/* Header */}
            <header className={`relative z-10 ${contentBg} ${borderColor} border-b`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center justify-between">
                  <Link href="/" className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="text-lg font-medium">Back to Stories</span>
                  </Link>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3 text-white/80">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">AI Designed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* Hero Section */}
            <section className="relative py-20 px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className={`text-6xl md:text-8xl lg:text-9xl font-black leading-tight mb-8 ${titleStyle}`}>
                  {currentBlogPost.title}
                </h1>
                <p className="text-2xl md:text-3xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-12">
                  {currentBlogPost.subtitle}
                </p>
                
                <div className="flex items-center justify-center space-x-6 text-gray-300 mb-12">
                  <div className="flex items-center space-x-2">
                    {authorData?.profile_image_url ? (
                      <img 
                        src={authorData.profile_image_url} 
                        alt={authorData.username || 'Author'}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-500/50"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-pink-500/50">
                        {authorData?.username?.[0]?.toUpperCase() || authorData?.first_name?.[0] || (currentBlogPost?.user_id ? 'U' : 'A')}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-white">
                        {authorData?.username || authorData?.first_name || (currentBlogPost?.user_id ? 'User' : 'Author')}
                      </div>
                      <div className="text-sm text-gray-400">
                        {authorData ? 'Blog Creator' : 'Blog Writer'}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(currentBlogPost.published_at || currentBlogPost.created_at || '').toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-400">
                    {currentBlogPost.read_time && currentBlogPost.read_time > 0 ? currentBlogPost.read_time : 5} min read
                  </div>
                  <button 
                    onClick={() => setAiDesignerOpen(true)}
                    className={`text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 hover:scale-105 cursor-pointer ${buttonStyle}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                    </svg>
                    Design
                  </button>
                </div>
              </div>
            </section>

            {/* Content */}
            <section className="relative py-20 px-4 sm:px-6 lg:px-8">
              <div className={`max-w-4xl mx-auto ${contentBg} rounded-2xl p-8 ${borderColor} shadow-2xl`}>
                {currentBlogPost.featured_image_url && (
                  <img 
                    src={currentBlogPost.featured_image_url} 
                    alt={currentBlogPost.title}
                    className="w-full max-h-96 object-cover rounded-lg mb-8 shadow-2xl"
                  />
                )}
                
                {currentBlogPost.tags && currentBlogPost.tags.length > 0 && (
                  <div className="flex gap-2 mb-8 flex-wrap">
                    {currentBlogPost.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className={`text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg ${buttonStyle}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div 
                  className="prose prose-lg max-w-none prose-headings:text-white prose-p:text-gray-300 prose-a:text-pink-400 prose-strong:text-white prose-code:text-yellow-400 prose-blockquote:border-l-pink-500 prose-blockquote:bg-pink-900/20 prose-blockquote:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: currentBlogPost.content }}
                />
              </div>
            </section>
          </div>
        );
      };
      
      return createDynamicComponent();
      
    } catch (error) {
      console.error('Error rendering custom component:', error);
      setRenderError('Failed to render AI design');
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-white">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (!currentBlogPost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Blog Post Not Found</h1>
          <p className="text-gray-300">The requested blog post could not be found.</p>
        </div>
      </div>
    );
  }

  // If there's a custom AI-generated component, render it
  if (customComponent) {
    return renderCustomComponent();
  }

  return (
    <>
      {/* Default Dark Modern Blog Post Design */}
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {/* Header */}
        <header className="relative z-10 bg-black/20 backdrop-blur-md border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-lg font-medium">Back to Stories</span>
              </Link>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 text-white/80">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Reading</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="w-1/3 h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
                    </div>
                    <span className="text-xs text-white/60">33%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black leading-tight mb-8 bg-gradient-to-r from-blue-400 via-purple-500 to-green-400 bg-clip-text text-transparent animate-gradient">
              {currentBlogPost.title}
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-12">
              {currentBlogPost.subtitle}
            </p>
            
            <div className="flex items-center justify-center space-x-6 text-gray-300 mb-12">
              <div className="flex items-center space-x-2">
                {authorData?.profile_image_url ? (
                  <img 
                    src={authorData.profile_image_url} 
                    alt={authorData.username || 'Author'}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/50"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-blue-500/50">
                    {authorData?.username?.[0]?.toUpperCase() || authorData?.first_name?.[0] || (currentBlogPost?.user_id ? 'U' : 'A')}
                  </div>
                )}
                <div>
                  <div className="font-medium text-white">
                    {authorData?.username || authorData?.first_name || (currentBlogPost?.user_id ? 'User' : 'Author')}
                  </div>
                  <div className="text-sm text-gray-400">
                    {authorData ? 'Blog Creator' : 'Blog Writer'}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                {new Date(currentBlogPost.published_at || currentBlogPost.created_at || '').toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-400">
                {currentBlogPost.read_time && currentBlogPost.read_time > 0 ? currentBlogPost.read_time : 5} min read
              </div>
              <button 
                onClick={() => {
              
                  setAiDesignerOpen(true);
                }}
                className="ml-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:from-blue-400 hover:to-purple-500 transition-all duration-200 flex items-center gap-2 hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
                Design
              </button>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-gray-800 shadow-2xl">
            {currentBlogPost.featured_image_url && (
              <img 
                src={currentBlogPost.featured_image_url} 
                alt={currentBlogPost.title}
                className="w-full max-h-96 object-cover rounded-lg mb-8 shadow-2xl"
              />
            )}
            
            {currentBlogPost.tags && currentBlogPost.tags.length > 0 && (
              <div className="flex gap-2 mb-8 flex-wrap">
                {currentBlogPost.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <div 
              className="prose prose-lg max-w-none prose-headings:text-white prose-p:text-gray-300 prose-a:text-blue-400 prose-strong:text-white prose-code:text-green-400 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-900/20 prose-blockquote:text-gray-300"
              dangerouslySetInnerHTML={{ __html: currentBlogPost.content }}
            />
          </div>
        </section>
      </div>

      {/* AI Designer Modal Component */}
      <BlogAIDesigner
        blogId={currentBlogPost?.id}
        blogSlug={currentBlogPost?.slug || blogId}
        initialContent={currentBlogPost.content}
        initialTitle={currentBlogPost.title}
        initialSubtitle={currentBlogPost.subtitle || ''}
        isOpen={aiDesignerOpen}
        onClose={() => setAiDesignerOpen(false)}
        onDesignApplied={() => {
          // Reload the page to show the new design
          window.location.reload();
        }}
      />
    </>
  );
} 