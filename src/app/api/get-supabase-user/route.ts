import { NextRequest, NextResponse } from 'next/server';
import { blogDatabase } from '@/lib/blog-database';

export async function POST(request: NextRequest) {
  try {
    const { clerkUserId } = await request.json();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Clerk user ID is required' }, { status: 400 });
    }
    
    const supabaseUser = await blogDatabase.getCurrentUser(clerkUserId);
    
    if (!supabaseUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ data: supabaseUser });
  } catch (error) {
    console.error('Error getting Supabase user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 