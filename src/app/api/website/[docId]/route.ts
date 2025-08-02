import { NextRequest, NextResponse } from 'next/server';
import { blogDatabase } from '@/lib/blog-database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const { docId } = await params;
    
    // Get the blog post data
    let blogPost = await blogDatabase.getBlogPostBySlug(docId);
    if (!blogPost) {
      blogPost = await blogDatabase.getBlogPost(docId);
    }

    if (!blogPost || !blogPost.is_ai_designed || !blogPost.ai_generated_html) {
      return new NextResponse('Website not found or not designed', { 
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Return the AI-generated HTML directly
    return new NextResponse(blogPost.ai_generated_html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    console.error('Error serving website:', error);
    return new NextResponse('Internal Server Error', { 
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
} 