'use client';

import { useState, useEffect } from 'react';

import { blogDatabase, type BlogPost } from '@/lib/blog-database';
import { useUser } from '@clerk/nextjs';
import { showNotification } from './BeautifulNotification';

interface BlogAIDesignerProps {
  blogId?: string;
  blogSlug?: string;
  initialContent?: string;
  initialTitle?: string;
  initialSubtitle?: string;
  onContentUpdate?: (content: string) => void;
  onTitleUpdate?: (title: string) => void;
  onSubtitleUpdate?: (subtitle: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onDesignApplied?: () => void;
}

export default function BlogAIDesigner({
  blogId,
  blogSlug,
  isOpen: externalIsOpen,
  onClose,
  onDesignApplied
}: BlogAIDesignerProps) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(externalIsOpen || false);
  
  // Sync with external isOpen prop
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);
  const [designPrompt, setDesignPrompt] = useState('');
  const [isRedesigning, setIsRedesigning] = useState(false);
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [loadingBlog, setLoadingBlog] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Load blog post data from database
  useEffect(() => {
    const loadBlogPost = async () => {
      if (!blogId && !blogSlug) {
    
        return;
      }
      

      setLoadingBlog(true);
      
      try {
        let post: BlogPost | null = null;
        
        if (blogId) {
  
          post = await blogDatabase.getBlogPost(blogId);
          
          if (!post) {
  
            post = await blogDatabase.getBlogPostBySlug(blogId);
          }
        } else if (blogSlug) {
  
          post = await blogDatabase.getBlogPostBySlug(blogSlug);
        }
        
        if (post) {
          setBlogPost(post);
  
          
          // Check if current user is the owner
          if (user && post.user_id) {
            const currentUser = await blogDatabase.getCurrentUser(user.id);
            const isOwner = currentUser?.id === post.user_id;
            setIsOwner(isOwner);
    
          }
          
          // Note: Design theme and prompt columns were removed from database
          // Design state is now managed locally in the component
          setDesignPrompt('');
        } else {
  
        }
      } catch (error) {
        console.error('💥 Error loading blog post:', error);
      } finally {
        setLoadingBlog(false);
      }
    };

    loadBlogPost();
  }, [blogId, blogSlug, user]);

  const handleRedesign = async () => {
    if (!blogPost || !user) {
      showNotification('Missing blog post or user authentication', 'error');
      return;
    }

    if (!designPrompt.trim()) {
      showNotification('Please enter a design description or select a theme', 'warning');
      return;
    }
    
    setIsRedesigning(true);

    
    try {
      const response = await fetch('/api/ai-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blogPostId: blogPost.id,
          themePrompt: designPrompt
        })
      });


      const result = await response.json();
      
      if (result.success) {
        showNotification('🎉 Blog post redesigned successfully! The new design has been applied.', 'success');
        
        // Call the callback to notify parent component
        if (onDesignApplied) {
          onDesignApplied();
        }
        
        // Close the modal after successful design
        setTimeout(() => {
          setIsOpen(false);
          if (onClose) onClose();
        }, 1000);
      } else {
        showNotification(`❌ Design failed: ${result.error || 'Unknown error'}`, 'error');
      }
      
    } catch (error: unknown) {
      showNotification('💥 Failed to redesign blog post. Please try again.', 'error');
    } finally {
      setIsRedesigning(false);
    }
  };

  const handleResetDesign = async () => {
    if (!blogPost || !user) return;
    
    setIsRedesigning(true);
    
    try {
      const response = await fetch('/api/ai-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blogPostId: blogPost.id,
          themePrompt: 'reset to default dark modern theme'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification('Blog post reset to default design successfully!', 'success');
        
        // Call the callback to notify parent component
        if (onDesignApplied) {
          onDesignApplied();
        }
        
        // Close the modal after successful reset
        setTimeout(() => {
          setIsOpen(false);
          if (onClose) onClose();
        }, 1000);
      } else {
        showNotification(`Reset failed: ${result.error}`, 'error');
      }
      
    } catch (error: unknown) {
      showNotification('Failed to reset blog post. Please try again.', 'error');
    } finally {
      setIsRedesigning(false);
    }
  };

  const quickThemes = [
    { 
      name: '🌙 Dark & Modern', 
      prompt: 'Create a sleek dark theme with neon accents, glass morphism effects, and modern typography. Make it look like a premium tech blog with dark backgrounds and glowing elements.' 
    },
    { 
      name: '🌈 Colorful & Vibrant', 
      prompt: 'Design a colorful and playful layout with rainbow gradients, animated elements, and vibrant colors throughout. Make it fun and energetic with lots of visual flair.' 
    },
    { 
      name: '💼 Professional & Corporate', 
      prompt: 'Create a clean, professional design with blue color scheme, elegant typography, and corporate styling. Make it look like a business blog with proper spacing and clean lines.' 
    },
    { 
      name: '⚡ Tech & Futuristic', 
      prompt: 'Design a cyberpunk-inspired layout with neon green text, dark backgrounds, glowing effects, and futuristic elements. Make it look like a sci-fi tech blog.' 
    },
    { 
      name: '✨ Elegant & Luxury', 
      prompt: 'Create an elegant and luxurious design with purple gradients, premium typography, and sophisticated styling. Make it look like a high-end lifestyle blog.' 
    },
    { 
      name: '🧘 Minimal & Clean', 
      prompt: 'Design a minimal and clean layout with lots of white space, simple typography, and subtle colors. Focus on readability and simplicity.' 
    },
    { 
      name: '🎨 Creative & Artistic', 
      prompt: 'Create an artistic and creative design with bold colors, unique layouts, and creative typography. Make it look like an art portfolio or creative blog.' 
    },
    { 
      name: '🌿 Nature & Organic', 
      prompt: 'Design a nature-inspired layout with earth tones, organic shapes, and natural elements. Make it feel warm and connected to nature.' 
    }
  ];

  // Show AI designer for all users (for testing)
  // if (!user) {
  
  //   return null;
  // }


  
  // Set up communication listeners for HTML template button
  useEffect(() => {
    if (typeof window !== 'undefined') {
  
      
      // Listen for postMessage from HTML template
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OPEN_AI_DESIGNER' && event.data?.source === 'blog-html-template') {
    
          setIsOpen(true);
        }
      };
      
      // Listen for custom event from HTML template
      const handleCustomEvent = (event: CustomEvent) => {
        if (event.detail?.source === 'blog-html-template') {
    
          setIsOpen(true);
        }
      };
      
      // Set up global function as fallback (for external isOpen prop)
      (window as Window & { openAIDesignerModal?: () => void }).openAIDesignerModal = () => {
    
        setIsOpen(true);
      };
      
      // Add event listeners
      window.addEventListener('message', handleMessage);
      window.addEventListener('openAIDesigner', handleCustomEvent as EventListener);

      // Cleanup
      return () => {
        window.removeEventListener('message', handleMessage);
        window.removeEventListener('openAIDesigner', handleCustomEvent as EventListener);
      };
    }
  }, []);



  // Only show the AI designer if the user is the owner of the blog post
  if (!isOwner) return null;

  return (
    <>

      {/* AI Designer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-white">⚡ AI Design Studio</h2>
                  <p className="text-gray-300 mt-2 text-lg">Transform your blog with AI-powered styling</p>
                </div>
                <button
                  onClick={() => {
                    if (onClose) {
                      onClose();
                    } else {
                      setIsOpen(false);
                    }
                  }}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)] bg-gray-900">
              {loadingBlog ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400 text-lg">Loading blog post...</p>
                  </div>
                </div>
              ) : (
              <div className="space-y-8">
                {/* Quick Themes */}
                <div>
                  <label className="block text-2xl font-bold text-white mb-6">
                    🎨 Quick Design Styles
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {quickThemes.map((theme, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setDesignPrompt(theme.prompt);
                        }}
                        className={`group p-6 border-2 rounded-xl transition-all duration-300 text-left hover:scale-105 ${
                          designPrompt === theme.prompt
                            ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/25'
                            : 'border-gray-600 bg-gray-800 hover:border-blue-400 hover:bg-gray-700 hover:shadow-lg'
                        }`}
                      >
                        <div className="font-bold text-white mb-3 text-lg group-hover:text-blue-300">{theme.name}</div>
                        <div className="text-sm text-gray-400 line-clamp-3 group-hover:text-gray-300">{theme.prompt.slice(0, 100)}...</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Design */}
                <div>
                  <label className="block text-2xl font-bold text-white mb-4">
                    💭 Custom Design Description
                  </label>
                  <textarea
                    value={designPrompt}
                    onChange={(e) => setDesignPrompt(e.target.value)}
                    placeholder="Describe your dream blog design... Examples: 'Make it dark and modern with neon accents', 'Create a colorful rainbow theme with animations', 'Design it like a luxury magazine with gold accents', 'Make it look like a sci-fi tech blog with glowing green text'"
                    className="w-full h-40 p-6 bg-gray-800 border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-lg transition-all duration-200"
                  />
                </div>
                
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={handleRedesign}
                    disabled={isRedesigning || !designPrompt.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-purple-700 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-blue-500/25"
                  >
                    {isRedesigning ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        Designing...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Apply Design
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleResetDesign}
                    disabled={isRedesigning}
                    className="bg-gray-700 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-gray-600 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl"
                  >
                    {isRedesigning ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        Resetting...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Reset
                      </>
                    )}
                  </button>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 