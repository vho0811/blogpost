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
    const { blogPostId, themePrompt } = body;

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

    // Get the existing HTML template from the database
    const existingHTML = blogPost.ai_generated_html;
    if (!existingHTML) {
      return NextResponse.json({
        success: false,
        error: 'No HTML template found to modify'
      }, { status: 400 });
    }

    // Send the existing template directly to AI (without injecting content)
    console.log('🔍 Sending template to AI for styling...');
    const modifiedHTML = await modifyHTMLWithAI(existingHTML, blogPost, themePrompt);
    console.log('🔍 AI returned HTML, length:', modifiedHTML.length);
    console.log('🔍 Same as original?', modifiedHTML === existingHTML);

    // Save the modified HTML template back to the database
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

  } catch (error) {
    console.error('Error in AI design API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

// Function to modify HTML template with AI
// AI will use {CONTENT} placeholder, no need for content injection

const modifyHTMLWithAI = async (existingHTML: string, blogPost: BlogPost, themePrompt: string): Promise<string> => {
  console.log('🔍 modifyHTMLWithAI called with theme:', themePrompt);
  
  // Analyze the user prompt to determine if it's valid
  const promptAnalysis = analyzeUserPrompt(themePrompt);
  console.log('🔍 Prompt analysis:', promptAnalysis);
  
  if (!promptAnalysis.isValid) {
    console.log('🔍 Prompt invalid, returning original HTML');
    // Return original HTML if prompt is not valid
    return existingHTML;
  }

  const systemPrompt = `You are a professional web designer. Your task is to modify ONLY the CSS styling in an HTML template while keeping everything else exactly the same.

CRITICAL RULES:
1. You will receive a complete HTML template
2. Keep ALL text, content, and constants EXACTLY as they are
3. Keep ALL HTML structure EXACTLY as it is
4. ONLY modify the CSS styling in the <style> section
5. DO NOT add comments like "Rest of HTML remains unchanged"
6. Return the COMPLETE HTML file with only the CSS modified

WHAT TO PRESERVE EXACTLY:
- All dynamic content and template variables
- All HTML elements and structure
- All existing content and text
- The complete HTML document structure
- All author information and metadata
- All images and media references

WHAT YOU CAN MODIFY:
- Colors, fonts, backgrounds in the CSS
- Layout and spacing in the CSS
- Animations and effects in the CSS
- Add new CSS classes if needed

DESIGN THEME: ${promptAnalysis.enhancedPrompt}

IMPORTANT: Return the COMPLETE HTML document with only the CSS styling modified. Do not use placeholder comments or truncate the HTML.`;

    try {
    // Pass the existing HTML template to AI for styling modification
    const userPrompt = `Here is the existing HTML template that you need to restyle:

${existingHTML}

CRITICAL INSTRUCTION: You must use placeholders for ALL dynamic content. This is MANDATORY:
- Keep ALL HTML structure EXACTLY the same
- Use these EXACT placeholders (do not change them):
  * {TITLE} - for blog title
  * {SUBTITLE} - for blog subtitle  
  * {CONTENT} - for blog content
  * {AUTHOR_NAME} - for author name
  * {AUTHOR_AVATAR} - for author avatar/image
  * {PUBLISH_DATE} - for publish date
  * {READ_TIME} - for read time
  * {CATEGORY} - for blog category
- Do NOT put any actual text content - only use these placeholders
- ONLY modify CSS styling

Examples of what sections should look like:
<h1 class="title">{TITLE}</h1>
<div class="author-name">{AUTHOR_NAME}</div>
<section class="content">{CONTENT}</section>

DO NOT put actual text content anywhere - use only the placeholders listed above.

`;
    
    console.log('🔍 Calling AI service...');
    const response = await aiService.enhanceBlogPostWithCustomPrompt(systemPrompt + '\n\nUSER REQUEST:\n' + userPrompt);
    console.log('🔍 AI response received, content length:', response.content?.length);
    
    if (response.content) {
      // Clean the AI response to remove any unwanted text
      let cleanedContent = response.content;
      
      // Remove any text that's not HTML (like "This redesign features:" descriptions)
      const htmlMatch = cleanedContent.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
      if (htmlMatch) {
        cleanedContent = htmlMatch[0];
      }
      
      // Remove any explanatory text before or after HTML
      cleanedContent = cleanedContent.replace(/^[^<]*/, '').replace(/[^>]*$/, '');
      
      // Return the AI generated content directly
      
      // The AI should have preserved all constants - return the styled template as-is
      return cleanedContent;
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
  const trimmedPrompt = prompt.trim();
  
  // If prompt is empty or too short, provide a helpful default
  if (trimmedPrompt.length < 5) {
    return { 
      isValid: true, 
      enhancedPrompt: 'Create a clean, modern design with good typography and spacing. Use a professional color scheme and ensure excellent readability.' 
    };
  }
  
  // Check for inappropriate content (keep this for safety)
  const inappropriateKeywords = [
    'fuck', 'shit', 'ass', 'bitch', 'dick', 'porn', 'sex', 'nude', 'naked',
    'hate', 'kill', 'death', 'blood', 'gore', 'violence', 'terrorist', 'bomb'
  ];
  
  const hasInappropriateContent = inappropriateKeywords.some(keyword => 
    trimmedPrompt.toLowerCase().includes(keyword)
  );
  
  if (hasInappropriateContent) {
    return { 
      isValid: true, 
      enhancedPrompt: 'Create a clean, professional design suitable for all audiences with good typography and spacing.' 
    };
  }
  
  // For all other text, let the AI handle it intelligently
  const enhancedPrompt = `As a professional web designer, create a design that follows this vision: "${trimmedPrompt}". 

CRITICAL REQUIREMENTS:
- The design MUST be immediately visible and functional when the page loads
- All text content must be clearly readable with strong contrast
- The layout must be responsive and work on all screen sizes
- Navigation and interactive elements must be easily accessible
- The design should feel modern, professional, and polished

DESIGN PRINCIPLES TO APPLY:
- Excellent typography hierarchy with clear heading structure
- Strong contrast between text and background colors (WCAG compliant)
- Proper spacing and visual balance throughout the layout
- Responsive design that adapts to different screen sizes
- Professional color theory with harmonious color schemes
- Clean, modern CSS styling with smooth transitions and hover effects
- Accessible design with proper focus states and keyboard navigation
- Visual hierarchy that guides the user's eye through the content
- Consistent spacing and alignment throughout the design

QUALITY STANDARDS:
- No broken layouts or overlapping elements
- No invisible text or poor contrast
- No excessive animations that interfere with usability
- No design elements that break the user experience
- Ensure the design looks professional and trustworthy

If the user's request is unclear, vague, or not design-related, fall back to creating a clean, modern, professional design with excellent typography, good visual hierarchy, and strong accessibility standards.

Focus on creating a design that matches the user's vision while maintaining professional standards and user experience best practices. The final result should be immediately usable and visually appealing.`;
  
  return { isValid: true, enhancedPrompt };
};

// Function to enhance design prompts with intelligent analysis
const enhanceDesignPrompt = (prompt: string): string => {
  // This function is no longer used but kept for potential future use
  return prompt;
}; 