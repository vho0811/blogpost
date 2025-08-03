import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { blogDatabase } from '@/lib/blog-database';

// GET - Fetch comments for a blog post
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blogPostId = searchParams.get('blogPostId');

    if (!blogPostId) {
      return NextResponse.json({
        success: false,
        error: 'Missing blogPostId'
      }, { status: 400 });
    }

    const comments = await blogDatabase.getComments(blogPostId);

    return NextResponse.json({
      success: true,
      comments
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

// POST - Add a new comment
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
    const { blogPostId, content } = body;

    if (!blogPostId || !content) {
      return NextResponse.json({
        success: false,
        error: 'Missing blogPostId or content'
      }, { status: 400 });
    }

    const comment = await blogDatabase.addComment(blogPostId, content, userId);

    if (comment) {
      return NextResponse.json({
        success: true,
        comment
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to add comment'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error adding comment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

// PUT - Update a comment
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    const body = await request.json();
    const { commentId, content } = body;

    if (!commentId || !content) {
      return NextResponse.json({
        success: false,
        error: 'Missing commentId or content'
      }, { status: 400 });
    }

    const comment = await blogDatabase.updateComment(commentId, content, userId);

    if (comment) {
      return NextResponse.json({
        success: true,
        comment
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to update comment'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error updating comment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

// DELETE - Delete a comment
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({
        success: false,
        error: 'Missing commentId'
      }, { status: 400 });
    }

    const success = await blogDatabase.deleteComment(commentId, userId);

    return NextResponse.json({
      success
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
} 