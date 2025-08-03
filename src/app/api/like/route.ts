import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { blogDatabase } from '@/lib/blog-database';

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
    const { blogPostId } = body;

    if (!blogPostId) {
      return NextResponse.json({
        success: false,
        error: 'Missing blogPostId'
      }, { status: 400 });
    }

    const result = await blogDatabase.toggleLike(blogPostId, userId);

    return NextResponse.json({
      success: true,
      liked: result.liked,
      likesCount: result.likesCount
    });

  } catch (error) {
    console.error('Error in like API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
} 