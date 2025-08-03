import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// AI Service Configuration
interface AIConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'ollama';
  model: string;
  temperature: number;
  maxTokens: number;
}

// Enhanced Blog Post Interface
interface EnhancedBlogPost {
  title: string;
  subtitle: string;
  content: string;
  designSuggestions: string[];
  interactiveElements: string[];
  seoOptimizations: string[];
  visualEnhancements: string[];
}

class AIService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private googleAI: GoogleGenerativeAI | null = null;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize Anthropic (Claude) - Priority provider
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    // Initialize OpenAI (fallback)
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    // Initialize Google AI (fallback)
    if (process.env.GOOGLE_AI_API_KEY && process.env.GOOGLE_AI_API_KEY !== 'your_google_ai_api_key_here') {
      this.googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    }
  }

  // Transform plain text into enhanced blog content
  async enhanceBlogPost(plainText: string, category: string = 'Technology'): Promise<EnhancedBlogPost> {
    const prompt = `
You are an expert content enhancer and web designer. Transform this plain blog text into an engaging, visually appealing blog post with modern design elements.

Original Text:
${plainText}

Category: ${category}

Please provide:
1. An engaging title (max 60 characters)
2. A compelling subtitle (max 120 characters)
3. Enhanced content with proper HTML structure, headings, and formatting
4. 5 design suggestions for visual enhancement
5. 3 interactive elements to add
6. 3 SEO optimizations
7. 3 visual enhancement ideas

Format the response as JSON with these keys: title, subtitle, content, designSuggestions, interactiveElements, seoOptimizations, visualEnhancements
`;

    try {
      let response: string;

      // Try Claude first, then fallback to other providers
      if (this.anthropic) {
        const anthropicResponse = await this.anthropic.messages.create({
          model: this.config.model,
          max_tokens: Math.min(this.config.maxTokens, 32000), // Higher cap for long content
          temperature: this.config.temperature,
          messages: [{ role: 'user', content: prompt }],
        });
        response = (anthropicResponse.content[0] as { text?: string })?.text || '';
      } else if (this.openai) {
        const openaiResponse = await this.openai.chat.completions.create({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        });
        response = openaiResponse.choices[0]?.message?.content || '';
      } else if (this.googleAI) {
        const model = this.googleAI.getGenerativeModel({ model: this.config.model });
        const googleResponse = await model.generateContent(prompt);
        response = googleResponse.response.text();
      } else {
        console.warn('No AI provider configured. Using fallback enhancement.');
        return this.createFallbackEnhancement(plainText, category);
      }

      // Parse the JSON response
      const enhancedPost = JSON.parse(response) as EnhancedBlogPost;
      return enhancedPost;
    } catch (error) {
      console.error('AI enhancement failed:', error);
      // Fallback to basic enhancement
      return this.createFallbackEnhancement(plainText, category);
    }
  }

  // Transform plain text into enhanced blog content with custom prompt
  async enhanceBlogPostWithCustomPrompt(customPrompt: string): Promise<EnhancedBlogPost> {
    try {
      let response: string;

      // Try Claude first, then fallback to other providers
      if (this.anthropic) {
    
        // Use higher token limit for HTML generation (Claude max is 8192)
        const isHTMLGeneration = customPrompt.includes('<!DOCTYPE html>') || customPrompt.includes('<html') || customPrompt.includes('HTML template');
        const maxTokensForRequest = isHTMLGeneration ? 8192 : Math.min(this.config.maxTokens, 8192);
        
        const anthropicResponse = await this.anthropic.messages.create({
          model: this.config.model,
          max_tokens: maxTokensForRequest,
          temperature: this.config.temperature,
          messages: [{ role: 'user', content: customPrompt }],
          stream: false, // Disable streaming to avoid the warning
        });
        response = (anthropicResponse.content[0] as { text?: string })?.text || '';
      } else if (this.openai) {
        // Use higher token limit for HTML generation
        const isHTMLGeneration = customPrompt.includes('<!DOCTYPE html>') || customPrompt.includes('<html') || customPrompt.includes('HTML template');
        const maxTokensForRequest = isHTMLGeneration ? 8192 : this.config.maxTokens;
        
        const openaiResponse = await this.openai.chat.completions.create({
          model: this.config.model,
          messages: [{ role: 'user', content: customPrompt }],
          temperature: this.config.temperature,
          max_tokens: maxTokensForRequest,
        });
        response = openaiResponse.choices[0]?.message?.content || '';
      } else if (this.googleAI) {
    
        const model = this.googleAI.getGenerativeModel({ model: this.config.model });
        const googleResponse = await model.generateContent(customPrompt);
        response = googleResponse.response.text();
      } else {
        console.warn('No AI provider configured. Using fallback enhancement.');
        return this.createFallbackEnhancement('', 'Technology');
      }

    
      
      // Check if response looks like HTML
      if (response.includes('<!DOCTYPE html>') || response.includes('<html') || response.includes('<body')) {
        // Return HTML content directly
        return {
          title: 'Custom Design',
          subtitle: 'AI Generated Design',
          content: response,
          designSuggestions: ['Custom AI design applied'],
          interactiveElements: ['Custom styling'],
          seoOptimizations: ['Design optimized'],
          visualEnhancements: ['Custom theme applied']
        };
      }
      
      // Try to parse as JSON for structured responses
      try {
        const enhancedPost = JSON.parse(response) as EnhancedBlogPost;
        return enhancedPost;
      } catch {
  
        // Return the response as content
        return {
          title: 'Custom Design',
          subtitle: 'AI Generated Design',
          content: response,
          designSuggestions: ['Custom AI design applied'],
          interactiveElements: ['Custom styling'],
          seoOptimizations: ['Design optimized'],
          visualEnhancements: ['Custom theme applied']
        };
      }
    } catch (error) {
      console.error('Custom AI enhancement failed:', error);
      // Fallback to basic enhancement
      return this.createFallbackEnhancement('', 'Technology');
    }
  }

  // Generate design suggestions for blog posts
  async generateDesignSuggestions(content: string, theme: string = 'modern'): Promise<string[]> {
    const prompt = `
Generate 5 creative design suggestions for this blog content that would make it more visually appealing and engaging:

Content: ${content.substring(0, 2000)}...
Theme: ${theme}

Focus on:
- Interactive elements
- Visual hierarchy
- Color schemes
- Typography improvements
- Animation ideas

Return as a JSON array of strings.
`;

    try {
      let response: string;

      if (this.anthropic) {
        const anthropicResponse = await this.anthropic.messages.create({
          model: this.config.model,
          max_tokens: 500,
          temperature: this.config.temperature,
          messages: [{ role: 'user', content: prompt }],
        });
        response = (anthropicResponse.content[0] as { text?: string })?.text || '';
      } else if (this.openai) {
        const openaiResponse = await this.openai.chat.completions.create({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: this.config.temperature,
          max_tokens: 500,
        });
        response = openaiResponse.choices[0]?.message?.content || '';
      } else {
        console.warn('No AI provider available for design suggestions, using fallback');
        return [
          'Add gradient text animations for headings',
          'Include interactive data visualizations',
          'Create floating action buttons',
          'Add animated progress indicators',
          'Implement hover effects for key elements'
        ];
      }

      return JSON.parse(response);
    } catch (error) {
      console.error('Design suggestions failed:', error);
      return [
        'Add gradient text animations for headings',
        'Include interactive data visualizations',
        'Create floating action buttons',
        'Add animated progress indicators',
        'Implement hover effects for key elements'
      ];
    }
  }

  // Generate SEO optimizations
  async generateSEOOptimizations(content: string, title: string): Promise<string[]> {
    const prompt = `
Generate 5 SEO optimization suggestions for this blog post:

Title: ${title}
Content: ${content.substring(0, 1500)}...

Focus on:
- Meta descriptions
- Keyword optimization
- Internal linking
- Schema markup
- Content structure

Return as a JSON array of strings.
`;

    try {
      let response: string;

      if (this.anthropic) {
        const anthropicResponse = await this.anthropic.messages.create({
          model: this.config.model,
          max_tokens: 500,
          temperature: this.config.temperature,
          messages: [{ role: 'user', content: prompt }],
          stream: false, // Disable streaming to avoid the warning
        });
        response = (anthropicResponse.content[0] as { text?: string })?.text || '';
      } else if (this.openai) {
        const openaiResponse = await this.openai.chat.completions.create({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: this.config.temperature,
          max_tokens: 500,
        });
        response = openaiResponse.choices[0]?.message?.content || '';
      } else {
        console.warn('No AI provider available for SEO optimization, using fallback');
        return [
          'Add meta description with target keywords',
          'Include internal links to related content',
          'Optimize heading structure (H1, H2, H3)',
          'Add schema markup for better search results',
          'Include alt text for all images'
        ];
      }

      return JSON.parse(response);
    } catch (error) {
      console.error('SEO optimization failed:', error);
      return [
        'Add meta description with target keywords',
        'Include internal links to related content',
        'Optimize heading structure (H1, H2, H3)',
        'Add schema markup for better search results',
        'Include alt text for all images'
      ];
    }
  }

  // Create fallback enhancement when AI fails
  private createFallbackEnhancement(plainText: string, category: string): EnhancedBlogPost {
    const lines = plainText.split('\n').filter(line => line.trim());
    const title = lines[0] || 'Amazing Blog Post';
    const subtitle = lines[1] || 'Discover incredible insights and stories';
    
    return {
      title: title.length > 60 ? title.substring(0, 57) + '...' : title,
      subtitle: subtitle.length > 120 ? subtitle.substring(0, 117) + '...' : subtitle,
      content: `<div class="prose prose-invert prose-xl max-w-none">
        <p class="text-xl leading-relaxed mb-8">${plainText}</p>
      </div>`,
      designSuggestions: [
        'Add gradient text animations for headings',
        'Include interactive data visualizations',
        'Create floating action buttons',
        'Add animated progress indicators',
        'Implement hover effects for key elements'
      ],
      interactiveElements: [
        'Reading progress indicator',
        'Social sharing buttons',
        'Interactive timeline'
      ],
      seoOptimizations: [
        'Add meta description with target keywords',
        'Include internal links to related content',
        'Optimize heading structure'
      ],
      visualEnhancements: [
        'Add hero image with overlay',
        'Include animated background elements',
        'Create floating tech icons'
      ]
    };
  }
}

// Export singleton instance
export const aiService = new AIService({
  provider: (process.env.AI_PROVIDER as 'openai' | 'anthropic' | 'google' | 'ollama') || 'anthropic',
  model: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022',
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  maxTokens: Math.min(parseInt(process.env.MAX_TOKENS || '4000'), 32000), // Higher cap for long content, but still reasonable
});

export default AIService; 