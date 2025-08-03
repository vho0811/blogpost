import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { blogDatabase } from '@/lib/blog-database';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const blogPostId = searchParams.get('blogPostId');

    if (!blogPostId) {
      return NextResponse.json({
        success: false,
        error: 'Missing blogPostId'
      }, { status: 400 });
    }

    const isLiked = await blogDatabase.checkIfLiked(blogPostId, userId);

    return NextResponse.json({
      success: true,
      liked: isLiked
    });

  } catch (error) {
    console.error('Error checking like status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
} 