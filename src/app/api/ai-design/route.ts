import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { blogDatabase } from '@/lib/blog-database';
import { BlogPost } from '@/lib/blog-database';
import { aiService } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    const body = await request.json();
    const { blogPostId, action, themePrompt } = body;

    if (!blogPostId) {
      return NextResponse.json({
        success: false,
        error: 'Missing blogPostId'
      }, { status: 400 });
    }

    // Get the blog post
    let blogPost = await blogDatabase.getBlogPost(blogPostId);
    if (!blogPost) {
      // Try to get by slug if not found by ID
      blogPost = await blogDatabase.getBlogPostBySlug(blogPostId);
    }
    
    if (!blogPost) {
      return NextResponse.json({
        success: false,
        error: 'Blog post not found'
      }, { status: 404 });
    }

    // Get current user to check ownership
    const currentUser = await blogDatabase.getCurrentUser(userId);
    if (!currentUser || currentUser.id !== blogPost.user_id) {
      return NextResponse.json({
        success: false,
        error: 'You can only redesign your own blog posts'
      }, { status: 403 });
    }

    // Get the existing HTML from the database
    const existingHTML = blogPost.ai_generated_html;
    if (!existingHTML) {
      return NextResponse.json({
        success: false,
        error: 'No HTML found to modify'
      }, { status: 400 });
    }

    // Modify the existing HTML with AI using the theme prompt
    const modifiedHTML = await modifyHTMLWithAI(existingHTML, blogPost, themePrompt);

    // Save the modified HTML back to the database
    if (!blogPost.id) {
      return NextResponse.json({
        success: false,
        error: 'Blog post ID not found'
      }, { status: 400 });
    }

    const saved = await blogDatabase.updateBlogPost(blogPost.id, {
      ai_generated_html: modifiedHTML,
      is_ai_designed: true,
      ai_designed_at: new Date().toISOString()
    }, userId);

    if (saved) {
      return NextResponse.json({
        success: true,
        message: 'HTML modified successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to save modified HTML'
      }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error('Error in AI design API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

// Function to modify HTML with AI
const modifyHTMLWithAI = async (existingHTML: string, blogPost: BlogPost, themePrompt: string): Promise<string> => {
  // Analyze the user prompt to determine if it's valid
  const promptAnalysis = analyzeUserPrompt(themePrompt);
  
  if (!promptAnalysis.isValid) {
    // Return original HTML if prompt is not valid

    return existingHTML;
  }

  const systemPrompt = `You are a professional web designer and developer. Your task is to redesign an entire HTML page based on user requirements.

IMPORTANT CONTEXT:
- This is a blog post page with fixed navigation buttons that MUST remain visible and accessible
- There are TWO fixed buttons positioned outside the main content area:
  1. "Back to Stories" button (top-left, fixed position) - should always be visible
  2. "AI Design" button (top-right, fixed position) - has dark gray background (bg-gray-800) with white text
- These buttons are handled by React components and should NOT be included in your HTML
- Your design should work well with these fixed buttons remaining visible
- CRITICAL: Do NOT include any navigation, header, or button elements in your HTML output
- CRITICAL: Do NOT include any "Back to Stories" links or "AI Design" buttons in your HTML
- CRITICAL: Focus only on the content area, hero section, and styling - leave navigation to React

CRITICAL REQUIREMENTS:
1. Redesign the ENTIRE page - outer wrapper, background, header, navigation, hero section, content area, everything
2. Keep all the content (title, subtitle, content) exactly the same
3. Apply the specific design theme to the WHOLE page including the outer wrapper and background
4. Redesign the complete layout, colors, typography, animations for the entire page
5. Make sure the entire page design matches their theme description
6. Add appropriate animations and effects for the theme across the whole page
7. Use colors and typography that match the theme throughout
8. IMPORTANT: Include the actual blog content in the content area
9. DO NOT use comments like "<!-- Rest of the HTML remains exactly the same -->"
10. Redesign the complete HTML structure with enhanced CSS for the entire page
11. The content section should contain: ${blogPost.content}
12. Redesign outer-wrapper, header, navigation, hero section, content area - EVERYTHING
13. The outer wrapper and background should match the theme
14. DO NOT include any AI Design buttons in the HTML - they are handled separately
15. The fixed buttons will remain visible on top of your design, so ensure your background/colors work well with them
16. Use contrasting colors - if background is bright, use dark text; if background is dark, use light text

BLOG INFO:
Title: ${blogPost.title}
Subtitle: ${blogPost.subtitle || ''}
Content: ${blogPost.content}
Category: ${blogPost.category || 'General'}
Read Time: ${blogPost.read_time && blogPost.read_time > 0 ? blogPost.read_time : 5} min read

DESIGN REQUIREMENTS:
${promptAnalysis.enhancedPrompt}

Return ONLY the complete redesigned HTML page with enhanced CSS for the entire page, no explanations.`;

  try {
    const response = await aiService.enhanceBlogPostWithCustomPrompt(systemPrompt + '\n\n' + `Here is the current HTML page to redesign:\n\n${existingHTML}`);
    
    if (response.content) {
      return response.content;
    } else {
      // Fallback: return the original HTML
      return existingHTML;
    }
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw new Error('Failed to generate AI design');
  }
};

// Function to analyze user prompt and determine if it's valid
const analyzeUserPrompt = (prompt: string) => {
  const trimmedPrompt = prompt.trim().toLowerCase();
  
  // Check if prompt is too short or contains invalid content
  if (trimmedPrompt.length < 10) {
    return { isValid: false, enhancedPrompt: 'Create a clean, modern design with good typography and spacing.' };
  }
  
  // Check for inappropriate or non-design related content
  const inappropriateKeywords = [
    'fuck', 'shit', 'ass', 'bitch', 'dick', 'porn', 'sex', 'nude', 'naked',
    'hate', 'kill', 'death', 'blood', 'gore', 'violence', 'terrorist', 'bomb'
  ];
  
  const hasInappropriateContent = inappropriateKeywords.some(keyword => 
    trimmedPrompt.includes(keyword)
  );
  
  if (hasInappropriateContent) {
    return { isValid: false, enhancedPrompt: 'Create a clean, professional design suitable for all audiences.' };
  }
  
  // Check if prompt is too vague or generic
  const vaguePhrases = [
    'make it look good', 'make it better', 'improve it', 'fix it',
    'change it', 'do something', 'whatever', 'idk', 'i dont know'
  ];
  
  const isTooVague = vaguePhrases.some(phrase => 
    trimmedPrompt.includes(phrase)
  );
  
  if (isTooVague) {
    return { isValid: false, enhancedPrompt: 'Create a modern, clean design with good visual hierarchy and readability.' };
  }
  
  // Check if prompt is about content changes rather than design
  const contentChangeKeywords = [
    'change the text', 'edit the content', 'modify the words', 'rewrite',
    'add more text', 'remove text', 'change title', 'change subtitle'
  ];
  
  const isContentChange = contentChangeKeywords.some(keyword => 
    trimmedPrompt.includes(keyword)
  );
  
  if (isContentChange) {
    return { isValid: false, enhancedPrompt: 'Create a clean, modern design with good typography and spacing.' };
  }
  
  // If prompt is valid, enhance it with design-specific instructions
  const enhancedPrompt = enhanceDesignPrompt(trimmedPrompt);
  
  return { isValid: true, enhancedPrompt };
};

// Function to enhance design prompts with specific instructions
const enhanceDesignPrompt = (prompt: string): string => {
  let enhanced = prompt;
  
  // Add specific design instructions based on keywords
  if (prompt.includes('dark') || prompt.includes('night')) {
    enhanced += ' Use dark backgrounds with light text and subtle accents.';
  }
  
  if (prompt.includes('light') || prompt.includes('bright') || prompt.includes('white')) {
    enhanced += ' Use light backgrounds with dark text and clean typography.';
  }
  
  if (prompt.includes('colorful') || prompt.includes('vibrant') || prompt.includes('bright')) {
    enhanced += ' Use a vibrant color palette with strong contrasts and energetic elements.';
  }
  
  if (prompt.includes('minimal') || prompt.includes('simple') || prompt.includes('clean')) {
    enhanced += ' Use lots of white space, simple typography, and minimal decorative elements.';
  }
  
  if (prompt.includes('professional') || prompt.includes('business') || prompt.includes('corporate')) {
    enhanced += ' Use a conservative color palette, structured layout, and readable typography.';
  }
  
  if (prompt.includes('modern') || prompt.includes('contemporary')) {
    enhanced += ' Use modern typography, clean lines, and contemporary design principles.';
  }
  
  if (prompt.includes('elegant') || prompt.includes('luxury') || prompt.includes('premium')) {
    enhanced += ' Use sophisticated typography, refined spacing, and premium visual elements.';
  }
  
  if (prompt.includes('tech') || prompt.includes('futuristic') || prompt.includes('cyber')) {
    enhanced += ' Use futuristic elements, neon accents, and high-tech visual styling.';
  }
  
  if (prompt.includes('warm') || prompt.includes('cozy') || prompt.includes('comfortable')) {
    enhanced += ' Use warm color tones, soft gradients, and inviting visual elements.';
  }
  
  if (prompt.includes('creative') || prompt.includes('artistic') || prompt.includes('art')) {
    enhanced += ' Use creative typography, artistic elements, and unique visual styling.';
  }
  
  return enhanced;
}; 