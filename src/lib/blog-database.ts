import { supabase } from './supabase-client';

export interface DesignConfig {
  theme: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    headingWeight: string;
    bodyWeight: string;
  };
  layout: {
    maxWidth: string;
    padding: string;
    spacing: string;
  };
  effects: {
    glassmorphism: boolean;
    gradients: boolean;
    shadows: boolean;
    animations: boolean;
  };
}

export interface BlogPost {
  id?: string;
  user_id?: string;
  title: string;
  subtitle?: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  category: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  slug: string;
  read_time?: number;
  views?: number;
  likes?: number;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  design_config?: DesignConfig;
  is_custom_designed?: boolean;
  ai_generated_component?: string; // Store the AI-generated React component code
  
  // New AI design fields for improved publishing flow
  ai_generated_html?: string; // Store the AI-generated HTML website
  ai_website_settings?: AIWebsiteSettings; // Store AI design settings
  is_ai_designed?: boolean; // Flag to indicate if AI design is applied
  ai_designed_at?: string; // Timestamp when AI design was applied
  
  // Joined user data
  users?: {
    username?: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
  };
}

export interface AIWebsiteSettings {
  style: string;
  colorScheme: string;
  includeNavigation: boolean;
  includeTOC: boolean;
  enhanceContent: boolean;
  autoGenerateImages: boolean;
  suggestedStyle?: string;
  suggestedColorScheme?: string;
}

export interface User {
  id?: string;
  clerk_user_id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MediaFile {
  id?: string;
  user_id?: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  alt_text?: string;
  created_at?: string;
}

export class BlogDatabase {
  private supabase = supabase;

  // User Management
  async createOrUpdateUser(clerkUser: { 
    id?: string; 
    clerk_user_id?: string;
    email?: string;
    emailAddresses?: Array<{ emailAddress?: string }>;
    primaryEmailAddress?: { emailAddress?: string };
    username?: string;
    firstName?: string;
    first_name?: string;
    lastName?: string;
    last_name?: string;
    imageUrl?: string;
    profileImageUrl?: string;
    profile?: { imageUrl?: string };
    externalAccounts?: Array<{ imageUrl?: string }>;
    profile_image_url?: string;
  }): Promise<User | null> {
    try {
      
      // Extract email properly
      const email = clerkUser.email || 
                   clerkUser.emailAddresses?.[0]?.emailAddress || 
                   clerkUser.primaryEmailAddress?.emailAddress || '';
      
      // Extract username properly - try multiple sources
      const username = clerkUser.username || 
                      clerkUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 
                      email.split('@')[0] || 
                      'user';
      
      const userData = {
        clerk_user_id: clerkUser.id || clerkUser.clerk_user_id,
        email: email,
        username: username,
        first_name: clerkUser.firstName || clerkUser.first_name || '',
        last_name: clerkUser.lastName || clerkUser.last_name || '',
        profile_image_url: clerkUser.imageUrl || clerkUser.profileImageUrl || clerkUser.profile?.imageUrl || clerkUser.externalAccounts?.[0]?.imageUrl || clerkUser.profile_image_url || '',
      };



      const { data, error } = await this.supabase
        .from('users')
        .upsert(userData, { 
          onConflict: 'clerk_user_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating/updating user:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return null;
      }

      
      return data;
    } catch (error: unknown) {
      console.error('Error creating/updating user:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      return null;
    }
  }

  async getCurrentUser(clerkUserId: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .single();

      if (error) {
        console.error('Error getting current user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error getting user by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  // Blog Post Management
  async createBlogPost(blogPost: Omit<BlogPost, 'id' | 'user_id' | 'created_at' | 'updated_at'>, clerkUserId: string): Promise<BlogPost | null> {
    try {
      

      // Get or create user
      let currentUser = await this.getCurrentUser(clerkUserId);
      if (!currentUser) {

        // Create user if they don't exist
        currentUser = await this.createOrUpdateUser({ id: clerkUserId });
        if (!currentUser) {
          console.error('Failed to create user');
          throw new Error('Failed to create user');
        }
      }



      // Generate unique slug if not provided
      if (!blogPost.slug) {
        blogPost.slug = await this.generateUniqueSlug(blogPost.title);
      }

      // Calculate read time (always recalculate to ensure accuracy)
      blogPost.read_time = this.calculateReadTime(blogPost.content);

      const insertData = {
        ...blogPost,
        user_id: currentUser.id,
        published_at: blogPost.status === 'published' ? new Date().toISOString() : null
      };



      const { data, error } = await this.supabase
        .from('blog_posts')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating blog post:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        return null;
      }


      return data;
    } catch (error: unknown) {
      console.error('Error creating blog post:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      return null;
    }
  }

  async updateBlogPost(id: string, updates: Partial<BlogPost>, clerkUserId: string): Promise<BlogPost | null> {
    try {
      // Get or create user
      let currentUser = await this.getCurrentUser(clerkUserId);
      if (!currentUser) {
        // Create user if they don't exist
        currentUser = await this.createOrUpdateUser({ id: clerkUserId });
        if (!currentUser) throw new Error('Failed to create user');
      }

      // Update read time if content changed
      if (updates.content) {
        updates.read_time = this.calculateReadTime(updates.content);
      }

      // Update published_at if status changed to published
      if (updates.status === 'published') {
        updates.published_at = new Date().toISOString();
      }

      const { data, error } = await this.supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', currentUser.id)
        .select()
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (error: unknown) {
      return null;
    }
  }

  async getBlogPost(id: string): Promise<BlogPost | null> {
    try {
      const { data, error } = await this.supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error getting blog post:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting blog post:', error);
      return null;
    }
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
      const { data, error } = await this.supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) {
        console.error('Error getting blog post by slug:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting blog post by slug:', error);
      return null;
    }
  }

  async getUserBlogPosts(clerkUserId: string, status?: string): Promise<BlogPost[]> {
    try {
      // Get or create user
      let currentUser = await this.getCurrentUser(clerkUserId);
      if (!currentUser) {
        // Create user if they don't exist
        currentUser = await this.createOrUpdateUser({ id: clerkUserId });
        if (!currentUser) return [];
      }

      let query = this.supabase
        .from('blog_posts')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting user blog posts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user blog posts:', error);
      return [];
    }
  }

  async getPublishedBlogPosts(limit?: number, offset?: number): Promise<BlogPost[]> {
    try {
      let query = this.supabase
        .from('blog_posts')
        .select(`
          *,
          users!blog_posts_user_id_fkey (
            username,
            first_name,
            last_name,
            profile_image_url
          )
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (offset) {
        query = query.range(offset, offset + (limit || 10) - 1);
      } else if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting published blog posts:', error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error('Error getting published blog posts:', error);
      return [];
    }
  }

  async deleteBlogPost(id: string, clerkUserId: string): Promise<boolean> {
    try {
      // Get or create user
      let currentUser = await this.getCurrentUser(clerkUserId);
      if (!currentUser) {
        // Create user if they don't exist
        currentUser = await this.createOrUpdateUser({ id: clerkUserId });
        if (!currentUser) return false;
      }

      const { error } = await this.supabase
        .from('blog_posts')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error deleting blog post:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting blog post:', error);
      return false;
    }
  }

  // Media Management
  async uploadMedia(file: File, altText: string, clerkUserId: string): Promise<MediaFile | null> {
    try {
      const currentUser = await this.getCurrentUser(clerkUserId);
      if (!currentUser) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${currentUser.id}/${fileName}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await this.supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Save file metadata to database
      const mediaData = {
        user_id: currentUser.id,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        alt_text: altText,
      };

      const { data, error } = await this.supabase
        .from('media_files')
        .insert(mediaData)
        .select()
        .single();

      if (error) {
        console.error('Error saving media metadata:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error uploading media:', error);
      return null;
    }
  }

  async getUserMedia(clerkUserId: string): Promise<MediaFile[]> {
    try {
      const currentUser = await this.getCurrentUser(clerkUserId);
      if (!currentUser) return [];

      const { data, error } = await this.supabase
        .from('media_files')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting user media:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user media:', error);
      return [];
    }
  }

  // Analytics
  async incrementViews(blogPostId: string): Promise<void> {
    try {
      // First try the RPC function
      const { error: rpcError } = await this.supabase.rpc('increment_views', {
        blog_post_id: blogPostId
      });

      if (rpcError) {
        // Fallback: get current views and increment
        const { data: currentPost, error: fetchError } = await this.supabase
          .from('blog_posts')
          .select('views')
          .eq('id', blogPostId)
          .single();

        if (!fetchError && currentPost) {
          const currentViews = currentPost.views || 0;
          const { error: updateError } = await this.supabase
            .from('blog_posts')
            .update({ views: currentViews + 1 })
            .eq('id', blogPostId);

          if (updateError) {
            console.error('Error incrementing views:', updateError);
          }
        }
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }

  async incrementLikes(blogPostId: string): Promise<void> {
    try {
      await this.supabase.rpc('increment_likes', { blog_post_id: blogPostId });
    } catch (error) {
      console.error('Error incrementing likes:', error);
    }
  }

  // Utility functions
  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    // Check if slug exists and generate unique one
    while (true) {
      const { data, error } = await this.supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // No rows found, slug is unique
        break;
      } else if (data) {
        // Slug exists, try with counter
        slug = `${baseSlug}-${counter}`;
        counter++;
      } else {
        // Other error, break to avoid infinite loop
        break;
      }
    }
    
    return slug;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private calculateReadTime(content: string): number {
    // Remove HTML tags and decode HTML entities
    const text = content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .trim();
    
    // Count words more accurately
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Calculate read time (200 words per minute is standard)
    const readTime = Math.ceil(wordCount / 200);
    
    // Ensure minimum of 1 minute
    return Math.max(readTime, 1);
  }

  // Recalculate read time for existing blog posts
  async recalculateReadTime(blogPostId: string): Promise<boolean> {
    try {
      const { data: post, error: fetchError } = await this.supabase
        .from('blog_posts')
        .select('content')
        .eq('id', blogPostId)
        .single();

      if (fetchError || !post) {
        console.error('Error fetching blog post for read time calculation:', fetchError);
        return false;
      }

      const newReadTime = this.calculateReadTime(post.content);

      const { error: updateError } = await this.supabase
        .from('blog_posts')
        .update({ read_time: newReadTime })
        .eq('id', blogPostId);

      if (updateError) {
        console.error('Error updating read time:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error recalculating read time:', error);
      return false;
    }
  }

  // Recalculate read times for ALL blog posts (admin function)
  async recalculateAllReadTimes(): Promise<number> {
    try {
      const { data: posts, error } = await this.supabase
        .from('blog_posts')
        .select('id, content');

      if (error || !posts) {
        console.error('Error fetching all blog posts:', error);
        return 0;
      }

      let updatedCount = 0;
      for (const post of posts) {
        const newReadTime = this.calculateReadTime(post.content);
        
        const { error: updateError } = await this.supabase
          .from('blog_posts')
          .update({ read_time: newReadTime })
          .eq('id', post.id);

        if (!updateError) {
          updatedCount++;
        }
      }

      console.log(`✅ Updated read times for ${updatedCount} blog posts`);
      return updatedCount;
    } catch (error) {
      console.error('Error recalculating all read times:', error);
      return 0;
    }
  }

  // Generate initial HTML template for new blog posts
  generateInitialHTMLTemplate(blogPost: BlogPost): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${blogPost.title}</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: white;
      background: #000000;
      min-height: 100vh;
    }
    
    /* Navigation is handled by React components */
    
    /* Hero Section */
    .hero {
      padding: 5rem 1rem;
      text-align: center;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .hero-title {
      font-size: 4rem;
      font-weight: 900;
      line-height: 1;
      margin-bottom: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .hero-subtitle {
      font-size: 1.5rem;
      color: #d1d5db;
      margin-bottom: 3rem;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .hero-meta {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 0.75rem;
      color: #9ca3af;
      margin-bottom: 3rem;
    }
    
    .author-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .author-avatar {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      overflow: hidden;
    }
    
    .author-details {
      text-align: left;
    }
    
    .author-name {
      color: white;
      font-weight: 500;
    }
    
    .author-role {
      font-size: 0.875rem;
      color: #9ca3af;
    }
    
    /* Main Content */
    .main-content {
      max-width: 800px;
      margin: 0 auto;
      padding: 0 1rem 5rem 1rem;
    }
    
    .content-wrapper {
      background: rgba(31, 41, 55, 0.5);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 2rem;
      border: 1px solid #374151;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    
    .blog-image {
      width: 100%;
      max-height: 400px;
      object-fit: cover;
      border-radius: 10px;
      margin-bottom: 2rem;
      box-shadow: 0 8px 25px rgba(0,0,0,0.4);
    }
    
    .blog-tags {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    
    .tag {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
      font-size: 0.8rem;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }
    
    .blog-content {
      font-size: 1.1rem;
      line-height: 1.8;
      color: #e5e7eb;
    }
    
    .blog-content h1, .blog-content h2, .blog-content h3 {
      margin: 2rem 0 1rem 0;
      color: #60a5fa;
    }
    
    .blog-content p {
      margin-bottom: 1.5rem;
    }
    
    .blog-content a {
      color: #60a5fa;
      text-decoration: none;
      border-bottom: 1px solid #60a5fa;
    }
    
    .blog-content a:hover {
      color: #93c5fd;
      border-bottom-color: #93c5fd;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .hero-title {
        font-size: 2.5rem;
      }
      
      .hero-subtitle {
        font-size: 1.25rem;
      }
      
      .hero-meta {
        flex-direction: column;
        gap: 1rem;
      }
      
      .nav {
        padding: 1rem;
      }
      
      .content-wrapper {
        padding: 1rem;
      }
    }
  </style>
</head>
<body>
  <!-- Hero Section -->
  <section class="hero">
    <h1 class="hero-title">${blogPost.title}</h1>
    ${blogPost.subtitle ? `<p class="hero-subtitle">${blogPost.subtitle}</p>` : ''}
    
    <div class="hero-meta">
      <div class="author-info">
        <div class="author-avatar">
          AUTHOR_AVATAR_HTML
        </div>
        <div class="author-details">
          <div class="author-name">AUTHOR_NAME</div>
          <div class="author-role">AUTHOR_ROLE</div>
        </div>
      </div>
      <div>${new Date(blogPost.published_at || blogPost.created_at || '').toLocaleDateString()}</div>
      <div>${blogPost.read_time && blogPost.read_time > 0 ? blogPost.read_time : 5} min read</div>
    </div>
  </section>



  <!-- Main Content -->
  <main class="main-content">
    <div class="content-wrapper">
      ${blogPost.featured_image_url ? `<img src="${blogPost.featured_image_url}" alt="${blogPost.title}" class="blog-image">` : ''}
      
      ${blogPost.tags?.length ? `<div class="blog-tags">${blogPost.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
      
      <div class="blog-content">
        ${blogPost.content}
      </div>
    </div>
  </main>
  
  <!-- Navigation buttons are handled by React components -->
</body>
</html>
    `;
  }

  // Method to refresh HTML template for existing blog posts (for testing)
  async refreshHTMLTemplate(blogPostId: string): Promise<boolean> {
    try {
  
      
      // Get the blog post
      const blogPost = await this.getBlogPost(blogPostId);
      if (!blogPost) {
        console.error('Blog post not found');
        return false;
      }

      // Generate new HTML template with current content
      const newHTML = this.generateInitialHTMLTemplate(blogPost);

      // Update the blog post with new HTML
      const { error } = await this.supabase
        .from('blog_posts')
        .update({ 
          html_code: newHTML,
          updated_at: new Date().toISOString()
        })
        .eq('id', blogPostId)
        .select()
        .single();

      if (error) {
        console.error('Error updating HTML template:', error);
        return false;
      }


      return true;
    } catch (error) {
      console.error('Error refreshing HTML template:', error);
      return false;
    }
  }
}

export const blogDatabase = new BlogDatabase();