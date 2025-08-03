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