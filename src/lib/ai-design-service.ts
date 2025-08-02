import { aiService } from './ai-service';
import { blogDatabase, type BlogPost, type DesignConfig } from './blog-database';

interface DesignRequest {
  blogPostId: string;
  designPrompt: string;
  theme?: string;
}

interface DesignResult {
  success: boolean;
  reactComponentCode: string;
  designTheme: string;
  designPrompt: string;
  error?: string;
}

export class AIDesignService {
  private aiService = aiService;

  // Apply design to blog post (React component approach)
  async applyDesignToBlogPost(request: DesignRequest): Promise<DesignResult> {
    try {
      // Get the blog post from database with full context
      const blogPost = await blogDatabase.getBlogPost(request.blogPostId);
      if (!blogPost) {
        return {
          success: false,
          reactComponentCode: '',
          designTheme: '',
          designPrompt: request.designPrompt,
          error: 'Blog post not found'
        };
      }

      // Get author data
      const authorData = blogPost.user_id ? await blogDatabase.getUserById(blogPost.user_id) : null;

      // Get the current React component code
      const currentComponentCode = await this.getCurrentBlogPostComponentCode();

      // Create comprehensive design prompt with full context
      const designPrompt = this.createComprehensiveDesignPrompt({
        blogPost,
        authorData,
        currentComponentCode,
        designRequest: request.designPrompt
      });

      // Get AI response to generate new React component
      const aiResponse = await this.aiService.enhanceBlogPostWithCustomPrompt(designPrompt);
      
      if (!aiResponse.content) {
        return {
          success: false,
          reactComponentCode: '',
          designTheme: this.extractThemeFromPrompt(request.designPrompt),
          designPrompt: request.designPrompt,
          error: 'AI failed to generate design'
        };
      }

      return {
        success: true,
        reactComponentCode: aiResponse.content,
        designTheme: this.extractThemeFromPrompt(request.designPrompt),
        designPrompt: request.designPrompt,
        error: undefined
      };
    } catch (error: any) {
      console.error('Error applying design to blog post:', error);
      return {
        success: false,
        reactComponentCode: '',
        designTheme: '',
        designPrompt: request.designPrompt,
        error: error.message
      };
    }
  }

  private async getCurrentBlogPostComponentCode(): Promise<string> {
    // This would read the current BlogPostWithDesign.tsx file
    // For now, return a template
    return `
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { blogDatabase, type BlogPost, type DesignConfig } from '@/lib/blog-database';
import BlogAIDesigner from './BlogAIDesigner';

interface BlogPostWithDesignProps {
  blogId: string;
}

export default function BlogPostWithDesign({ blogId }: BlogPostWithDesignProps) {
  const [currentBlogPost, setCurrentBlogPost] = useState<BlogPost | null>(null);
  const [authorData, setAuthorData] = useState<any>(null);
  const [aiDesignerOpen, setAiDesignerOpen] = useState(false);

  // Load blog post from database
  useEffect(() => {
    const loadBlogPost = async () => {
      try {
        let post: BlogPost | null = null;
        post = await blogDatabase.getBlogPostBySlug(blogId);
        if (!post) {
          post = await blogDatabase.getBlogPost(blogId);
        }
        
        if (post) {
          setCurrentBlogPost(post);
          if (post.user_id) {
            const author = await blogDatabase.getUserById(post.user_id);
            if (author) {
              setAuthorData(author);
            }
          }
        }
      } catch (error) {
        console.error('Error loading blog post:', error);
      }
    };

    loadBlogPost();
  }, [blogId]);

  if (!currentBlogPost) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-lg font-medium">Back to Stories</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black leading-tight mb-8 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 bg-clip-text text-transparent animate-gradient">
            {currentBlogPost.title}
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-12">
            {currentBlogPost.subtitle}
          </p>
          
          <div className="flex items-center justify-center space-x-6 text-gray-400 mb-12">
            <div className="flex items-center space-x-2">
              {authorData?.profile_image_url ? (
                <img 
                  src={authorData.profile_image_url} 
                  alt={authorData.username || 'Author'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {authorData?.username?.[0]?.toUpperCase() || authorData?.first_name?.[0] || 'A'}
                </div>
              )}
              <div>
                <div className="font-medium text-white">
                  {authorData?.username || authorData?.first_name || 'Author'}
                </div>
                <div className="text-sm">
                  {authorData ? 'Blog Creator' : 'Blog Writer'}
                </div>
              </div>
            </div>
            <div className="text-sm">
              {new Date(currentBlogPost.published_at || currentBlogPost.created_at || '').toLocaleDateString()}
            </div>
            <div className="text-sm">
              {currentBlogPost.read_time || 5} min read
            </div>
            <button 
              onClick={() => setAiDesignerOpen(true)}
              className="ml-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:from-blue-400 hover:to-purple-500 transition-all duration-200 flex items-center gap-2"
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
        <div className="max-w-4xl mx-auto">
          <div 
            className="prose prose-lg max-w-none prose-headings:text-white prose-p:text-gray-300 prose-a:text-blue-400"
            dangerouslySetInnerHTML={{ __html: currentBlogPost.content }}
          />
        </div>
      </section>

      {/* AI Designer Modal */}
      <BlogAIDesigner
        blogId={currentBlogPost?.id}
        blogSlug={currentBlogPost?.slug || blogId}
        initialContent={currentBlogPost.content}
        initialTitle={currentBlogPost.title}
        initialSubtitle={currentBlogPost.subtitle || ''}
        isOpen={aiDesignerOpen}
        onClose={() => setAiDesignerOpen(false)}
      />
    </div>
  );
}`;
  }

  private createComprehensiveDesignPrompt({
    blogPost,
    authorData,
    currentComponentCode,
    designRequest
  }: {
    blogPost: BlogPost;
    authorData: any;
    currentComponentCode: string;
    designRequest: string;
  }): string {
    return `
🎨 **AI DESIGNER - COMPLETE VISUAL TRANSFORMATION**

🚀 **YOUR MISSION**: You are a revolutionary React designer. COMPLETELY TRANSFORM this blog post's visual design based on the user's request. Change the layout, structure, colors, effects - everything visual!

📋 **BLOG POST CONTEXT** (PRESERVE ALL CONTENT):
- Title: "${blogPost.title}"
- Subtitle: "${blogPost.subtitle || 'No subtitle'}"
- Content: "${blogPost.content}"
- Author: "${authorData?.username || authorData?.first_name || 'Unknown Author'}"
- Author Image: "${authorData?.profile_image_url || 'No image'}"
- Published Date: "${new Date(blogPost.published_at || blogPost.created_at || '').toLocaleDateString()}"
- Read Time: "${blogPost.read_time || 5} min read"
- Category: "${blogPost.category}"
- Tags: ${blogPost.tags ? JSON.stringify(blogPost.tags) : '[]'}
- Featured Image: "${blogPost.featured_image_url || 'No image'}"
- Slug: "${blogPost.slug}"
- Status: "${blogPost.status}"

🎯 **DESIGN REQUEST**: "${designRequest}"

📝 **ORIGINAL DEFAULT CODE** (TRANSFORM THIS COMPLETELY):
${currentComponentCode}

🎨 **TRANSFORMATION INSTRUCTIONS**:

**MUST DO - COMPLETE VISUAL TRANSFORMATION**:
1. **CHANGE THE LAYOUT STRUCTURE** - Try different layouts:
   - Grid layout with cards
   - Masonry layout (Pinterest-style)
   - Magazine layout with columns
   - Full-screen hero with background
   - Split-screen design
   - Timeline layout
   - Gallery-style layout

2. **CHANGE THE VISUAL DESIGN**:
   - Different color schemes and palettes
   - New typography and font styles
   - Different spacing and padding
   - New visual effects (glassmorphism, neumorphism, shadows)
   - Animations and transitions
   - Different button and component styles

3. **CHANGE THE STRUCTURE**:
   - Reorganize sections
   - Add new visual elements
   - Change the header design
   - Modify the hero section layout
   - Transform the content area structure

**EXAMPLES OF CREATIVE TRANSFORMATIONS**:

**For "futuristic sci-fi"**:
- Dark background with neon colors
- Grid layout with glowing borders
- Holographic effects and animations
- Tech-style typography

**For "elegant luxury"**:
- Sophisticated color palette
- Magazine-style layout
- Premium typography
- Refined spacing and shadows

**For "minimal clean"**:
- Lots of whitespace
- Simple typography
- Clean lines and subtle colors
- Minimalist layout

**For "colorful playful"**:
- Bright, vibrant colors
- Fun animations and effects
- Creative layout with overlapping elements
- Playful typography

**TECHNICAL REQUIREMENTS**:
- ✅ Keep all content (title, subtitle, content, author, date, read time)
- ✅ Keep all functionality (buttons, links, interactions)
- ✅ Use Tailwind CSS for styling
- ✅ Be responsive (mobile, tablet, desktop)
- ✅ Be creative and innovative

**WHAT TO TRANSFORM**:
- Layout structure and arrangement
- Color schemes and palettes
- Typography and text styling
- Spacing and padding
- Visual effects and animations
- Component designs
- Background styles
- Interactive elements

**WHAT NOT TO CHANGE**:
- Blog post content (title, subtitle, content)
- Author information
- Published date and read time
- Component logic and state
- Event handlers and functions
- Import statements
- TypeScript interfaces

🎨 **YOUR TASK**:
Take the original React component code above and COMPLETELY TRANSFORM it according to "${designRequest}". 

Focus on:
- **Layout transformation** - change the entire page structure
- **Visual effects** - add stunning animations and effects  
- **Design innovation** - try new design patterns
- **Creative expression** - make it visually amazing

Return the complete React component code with your revolutionary design applied.
`;
  }

  private extractThemeFromPrompt(prompt: string): string {
    const promptLower = prompt.toLowerCase();
    if (promptLower.includes('dark') || promptLower.includes('night')) return 'dark';
    if (promptLower.includes('colorful') || promptLower.includes('rainbow')) return 'colorful';
    if (promptLower.includes('professional') || promptLower.includes('corporate')) return 'professional';
    if (promptLower.includes('minimal') || promptLower.includes('clean')) return 'minimal';
    if (promptLower.includes('elegant') || promptLower.includes('luxury')) return 'elegant';
    if (promptLower.includes('tech') || promptLower.includes('futuristic')) return 'tech';
    if (promptLower.includes('nature') || promptLower.includes('organic')) return 'nature';
    return 'modern';
  }

  // Save designed blog post to database
  async saveDesignedBlogPost(blogPostId: string, designResult: DesignResult): Promise<boolean> {
    try {
      // For now, we'll store the React component code in the database
      // In a real implementation, you might want to store it as a file or in a different table
      const updated = await blogDatabase.updateBlogPost(blogPostId, {
        is_custom_designed: true
      }, 'current-user-id'); // This should be passed as parameter

      return !!updated;
    } catch (error: any) {
      console.error('Error saving designed blog post:', error);
      return false;
    }
  }
}

export const aiDesignService = new AIDesignService(); 