import { blogDatabase, type BlogPost, type AIWebsiteSettings } from './blog-database';
import { aiService } from './ai-service';



export async function generateAIDesign(docId: string) {
  try {
    // 1. Get the blog content
    const blogData = await blogDatabase.getBlogPost(docId);
    if (!blogData) {
      return { success: false, error: 'Blog post not found' };
    }

    // 2. Extract content from BlockNote
    const content = extractBlockNoteContent(blogData.content);
    
    // 3. Analyze content for design recommendations
    const analysis = await analyzeContentForDesign(content, blogData);
    
    // 4. Generate AI website with intelligent settings
    const aiWebsite = await generateAIWebsite(blogData, analysis);
    
    // 5. Save the AI-generated website
    const saved = await blogDatabase.updateBlogPost(docId, {
      ai_generated_html: aiWebsite,
      ai_website_settings: analysis,
      is_ai_designed: true,
      ai_designed_at: new Date().toISOString()
    }, 'current-user-id'); // This should be passed as parameter

    if (!saved) {
      return { success: false, error: 'Failed to save AI design to database' };
    }
    
    return { success: true };
  } catch (error: unknown) {
    console.error('Error generating AI design:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
  }
}

function extractBlockNoteContent(content: string): string {
  // Extract plain text content from BlockNote HTML
  // Remove HTML tags and extract meaningful content
  const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return textContent;
}

async function analyzeContentForDesign(content: string, blogData: BlogPost): Promise<AIWebsiteSettings> {
  try {
    // Analyze content for design recommendations
    const analysisPrompt = `
Analyze this blog content and suggest design settings:

Title: ${blogData.title}
Subtitle: ${blogData.subtitle}
Content: ${content.substring(0, 5000)} // First 5000 chars
Category: ${blogData.category}
Tags: ${blogData.tags?.join(', ') || 'None'}

Based on this content, suggest:
1. Style (modern, classic, minimal, colorful, tech, elegant, creative, nature)
2. Color scheme (dark, light, colorful, monochrome, warm, cool)
3. Whether to include navigation
4. Whether to include table of contents
5. Whether to enhance content
6. Whether to auto-generate images

Return as JSON:
{
  "style": "suggested_style",
  "colorScheme": "suggested_color_scheme",
  "includeNavigation": true/false,
  "includeTOC": true/false,
  "enhanceContent": true/false,
  "autoGenerateImages": true/false,
  "suggestedStyle": "detailed_style_description",
  "suggestedColorScheme": "detailed_color_description"
}
`;

    const response = await aiService.enhanceBlogPostWithCustomPrompt(analysisPrompt);
    
    if (response.content) {
      try {
        // Try to parse JSON response
        const analysis = JSON.parse(response.content);
        return analysis;
      } catch {
        // Fallback to default analysis
        return getDefaultAnalysis(blogData);
      }
    } else {
      return getDefaultAnalysis(blogData);
    }
  } catch (error) {
    console.error('Error analyzing content:', error);
    return getDefaultAnalysis(blogData);
  }
}

function getDefaultAnalysis(blogData: BlogPost): AIWebsiteSettings {
  // Default analysis based on category
  const category = blogData.category?.toLowerCase() || 'general';
  
  let style = 'modern';
  let colorScheme = 'dark';
  
  if (category.includes('tech') || category.includes('technology')) {
    style = 'tech';
    colorScheme = 'dark';
  } else if (category.includes('lifestyle') || category.includes('fashion')) {
    style = 'elegant';
    colorScheme = 'warm';
  } else if (category.includes('business') || category.includes('corporate')) {
    style = 'professional';
    colorScheme = 'light';
  } else if (category.includes('creative') || category.includes('art')) {
    style = 'creative';
    colorScheme = 'colorful';
  }
  
  return {
    style,
    colorScheme,
    includeNavigation: true,
    includeTOC: true,
    enhanceContent: true,
    autoGenerateImages: false,
    suggestedStyle: `${style} design with ${colorScheme} color scheme`,
    suggestedColorScheme: `${colorScheme} color palette`
  };
}

async function generateAIWebsite(blogData: BlogPost, settings: AIWebsiteSettings): Promise<string> {
  try {
    const websitePrompt = `
Generate a complete HTML website for this blog post with the following specifications:

BLOG CONTENT:
Title: ${blogData.title}
Subtitle: ${blogData.subtitle}
Content: ${blogData.content}
Author: ${blogData.user_id ? 'Blog Author' : 'Anonymous'}
Published: ${new Date(blogData.published_at || blogData.created_at || '').toLocaleDateString()}
Category: ${blogData.category}
Tags: ${blogData.tags?.join(', ') || 'None'}

DESIGN SPECIFICATIONS:
Style: ${settings.style}
Color Scheme: ${settings.colorScheme}
Include Navigation: ${settings.includeNavigation}
Include Table of Contents: ${settings.includeTOC}
Enhance Content: ${settings.enhanceContent}
Auto Generate Images: ${settings.autoGenerateImages}

REQUIREMENTS:
1. Generate complete HTML with embedded CSS
2. Make it responsive (mobile, tablet, desktop)
3. Use modern design principles
4. Include proper meta tags and SEO
5. Make it visually appealing and professional
6. Include smooth animations and transitions
7. Use the specified style and color scheme
8. Make it fast-loading and optimized

Return ONLY the complete HTML code, no explanations.
`;

    const response = await aiService.enhanceBlogPostWithCustomPrompt(websitePrompt);
    
    if (response.content) {
      return response.content;
    } else {
      // Fallback to a basic HTML template
      return generateBasicHTMLTemplate(blogData, settings);
    }
  } catch (error) {
    console.error('Error generating AI website:', error);
    return generateBasicHTMLTemplate(blogData, settings);
  }
}

function generateBasicHTMLTemplate(blogData: BlogPost, settings: AIWebsiteSettings): string {
  const isDark = settings.colorScheme === 'dark';
  const bgColor = isDark ? '#0f172a' : '#ffffff';
  const textColor = isDark ? '#e2e8f0' : '#1f2937';
  const accentColor = isDark ? '#3b82f6' : '#2563eb';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${blogData.title}</title>
    <meta name="description" content="${blogData.subtitle || blogData.title}">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: ${textColor};
            background: ${bgColor};
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
        }
        
        .header {
            background: rgba(255, 255, 255, ${isDark ? '0.05' : '0.95'});
            backdrop-filter: blur(10px);
            border-bottom: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
            position: sticky;
            top: 0;
            z-index: 50;
        }
        
        .nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 0;
        }
        
        .back-link {
            color: ${accentColor};
            text-decoration: none;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .hero {
            padding: 4rem 0;
            text-align: center;
        }
        
        .title {
            font-size: 3rem;
            font-weight: 900;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, ${accentColor}, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .subtitle {
            font-size: 1.25rem;
            color: ${isDark ? '#9ca3af' : '#6b7280'};
            margin-bottom: 2rem;
        }
        
        .meta {
            display: flex;
            justify-content: center;
            gap: 2rem;
            margin-bottom: 3rem;
            color: ${isDark ? '#9ca3af' : '#6b7280'};
        }
        
        .content {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: rgba(255, 255, 255, ${isDark ? '0.05' : '0.95'});
            border-radius: 1rem;
            border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
        }
        
        .content h1, .content h2, .content h3 {
            color: ${accentColor};
            margin: 2rem 0 1rem 0;
        }
        
        .content p {
            margin-bottom: 1.5rem;
        }
        
        .content a {
            color: ${accentColor};
            text-decoration: none;
        }
        
        .content a:hover {
            text-decoration: underline;
        }
        
        @media (max-width: 768px) {
            .title {
                font-size: 2rem;
            }
            
            .meta {
                flex-direction: column;
                gap: 1rem;
            }
            
            .container {
                padding: 0 1rem;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <nav class="nav container">
            <a href="/" class="back-link">
                ← Back to Stories
            </a>
        </nav>
    </header>
    
    <main>
        <section class="hero">
            <div class="container">
                <h1 class="title">${blogData.title}</h1>
                ${blogData.subtitle ? `<p class="subtitle">${blogData.subtitle}</p>` : ''}
                
                <div class="meta">
                    <span>${new Date(blogData.published_at || blogData.created_at || '').toLocaleDateString()}</span>
                    <span>${blogData.read_time && blogData.read_time > 0 ? blogData.read_time : 5} min read</span>
                    <span>${blogData.category}</span>
                </div>
            </div>
        </section>
        
        <section class="content">
            ${blogData.content}
        </section>
    </main>
</body>
</html>
  `;
} 