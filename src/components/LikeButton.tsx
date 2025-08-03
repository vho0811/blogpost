'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { blogDatabase } from '@/lib/blog-database';

interface LikeButtonProps {
  blogPostId: string;
  initialLikesCount?: number;
  className?: string;
}

export default function LikeButton({ blogPostId, initialLikesCount = 0, className = '' }: LikeButtonProps) {
  const { user, isSignedIn } = useUser();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isSignedIn && user) {
      checkIfLiked();
    }
  }, [isSignedIn, user, blogPostId]);

  const checkIfLiked = async () => {
    try {
      const liked = await blogDatabase.checkIfLiked(blogPostId, user!.id);
      setIsLiked(liked);
    } catch (error) {
      console.error('Error checking if liked:', error);
    }
  };

  const handleToggleLike = async () => {
    if (!isSignedIn || !user || isLoading) return;

    try {
      setIsLoading(true);
      const result = await blogDatabase.toggleLike(blogPostId, user.id);
      setIsLiked(result.liked);
      setLikesCount(result.likesCount);
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInPrompt = () => {
    alert('Please sign in to like posts');
  };

  return (
    <button
      onClick={isSignedIn ? handleToggleLike : handleSignInPrompt}
      disabled={isLoading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 20px',
        borderRadius: '12px',
        border: 'none',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isLoading ? '0.6' : '1',
        backgroundColor: isLiked 
          ? 'rgba(239, 68, 68, 0.1)' 
          : 'rgba(17, 24, 39, 0.8)',
        color: isLiked ? '#ef4444' : '#e5e7eb',
        backdropFilter: 'blur(12px)',
        boxShadow: isLiked 
          ? '0 4px 12px rgba(239, 68, 68, 0.3)' 
          : '0 4px 12px rgba(0, 0, 0, 0.3)',
        border: isLiked 
          ? '1px solid rgba(239, 68, 68, 0.3)' 
          : '1px solid rgba(75, 85, 99, 0.3)'
      }}
    >
      <svg
        style={{
          width: '18px',
          height: '18px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          color: isLiked ? '#ef4444' : '#9ca3af',
          transform: isLiked ? 'scale(1.1)' : 'scale(1)'
        }}
        fill={isLiked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span style={{ 
        fontWeight: '600',
        letterSpacing: '0.025em'
      }}>
        {isLiked ? '🔥 Lit' : '🔥 Spark'} ({likesCount})
      </span>
    </button>
  );
} 