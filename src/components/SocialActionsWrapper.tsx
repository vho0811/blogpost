'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';

interface SocialActionsWrapperProps {
  postId: string;
  likes: number;
  views: number;
  category: string;
  slug?: string;
  className?: string;
  isLiked?: boolean;
  onLikeChange?: (liked: boolean) => void;
}

export default function SocialActionsWrapper({ 
  postId, 
  likes, 
  views, 
  category, 
  slug, 
  className = '',
  isLiked = false,
  onLikeChange
}: SocialActionsWrapperProps) {
  const { isSignedIn } = useUser();
  const [likesCount, setLikesCount] = useState(likes);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!isSignedIn) {
      // Could show sign-in prompt here
      return;
    }

    if (isLiking) return;

    try {
      setIsLiking(true);
      
      const response = await fetch('/api/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ blogPostId: postId }),
      });

      const result = await response.json();

      if (result.success) {
        setLikesCount(result.likesCount);
        // Call the parent callback to update the like state
        if (onLikeChange) {
          onLikeChange(result.liked);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div 
      className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '1rem',
        overflow: 'hidden'
      }}
    >
      {/* Social Actions Header */}
      <div 
        className="px-6 py-4 border-b border-white/10"
        style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex items-center justify-between">
          <h3 
            className="text-lg font-semibold text-white"
            style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: 'white'
            }}
          >
            Engage with this story
          </h3>
          <div 
            className="flex items-center space-x-4 text-sm text-white/60"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}
          >
            <span>{views} views</span>
            <span 
              className="px-3 py-1 bg-white/10 rounded-full text-xs"
              style={{
                padding: '0.25rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '9999px',
                fontSize: '0.75rem'
              }}
            >
              {category}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div 
        className="px-6 py-4"
        style={{
          padding: '1rem 1.5rem'
        }}
      >
        <div 
          className="flex items-center justify-between"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={isLiking}
            className="flex items-center space-x-3 group transition-all duration-300"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s ease',
              cursor: isLiking ? 'not-allowed' : 'pointer'
            }}
          >
            <div 
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isLiked 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-white/10 text-white/60 hover:bg-red-500/20 hover:text-red-400'
              }`}
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                background: isLiked 
                  ? 'rgba(239, 68, 68, 0.2)' 
                  : 'rgba(255, 255, 255, 0.1)',
                color: isLiked 
                  ? '#f87171' 
                  : 'rgba(255, 255, 255, 0.6)'
              }}
            >
              {isLiking ? (
                <div 
                  className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"
                  style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    border: '2px solid currentColor',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}
                />
              ) : (
                <svg 
                  className="w-5 h-5" 
                  fill={isLiked ? 'currentColor' : 'none'} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{
                    width: '1.25rem',
                    height: '1.25rem'
                  }}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                  />
                </svg>
              )}
            </div>
            <div className="text-left">
              <p 
                className={`font-semibold text-sm ${
                  isLiked ? 'text-red-400' : 'text-white'
                }`}
                style={{
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: isLiked ? '#f87171' : 'white'
                }}
              >
                {likesCount} likes
              </p>
              <p 
                className="text-xs text-white/60"
                style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}
              >
                {isLiked ? 'You liked this' : 'Tap to like'}
              </p>
            </div>
          </button>

          {/* Comment Button */}
          <Link
            href={`/blog/${slug || postId}`}
            className="flex items-center space-x-3 group transition-all duration-300"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s ease',
              textDecoration: 'none'
            }}
          >
            <div 
              className="w-12 h-12 rounded-full bg-white/10 text-white/60 hover:bg-blue-500/20 hover:text-blue-400 flex items-center justify-center transition-all duration-300"
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{
                  width: '1.25rem',
                  height: '1.25rem'
                }}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                />
              </svg>
            </div>
            <div className="text-left">
              <p 
                className="font-semibold text-sm text-white"
                style={{
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: 'white'
                }}
              >
                Comment
              </p>
              <p 
                className="text-xs text-white/60"
                style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}
              >
                Share your thoughts
              </p>
            </div>
          </Link>

          {/* Share Button */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Check out this story',
                  url: window.location.origin + `/blog/${slug || postId}`
                });
              } else {
                navigator.clipboard.writeText(window.location.origin + `/blog/${slug || postId}`);
              }
            }}
            className="flex items-center space-x-3 group transition-all duration-300"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s ease',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <div 
              className="w-12 h-12 rounded-full bg-white/10 text-white/60 hover:bg-green-500/20 hover:text-green-400 flex items-center justify-center transition-all duration-300"
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{
                  width: '1.25rem',
                  height: '1.25rem'
                }}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" 
                />
              </svg>
            </div>
            <div className="text-left">
              <p 
                className="font-semibold text-sm text-white"
                style={{
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: 'white'
                }}
              >
                Share
              </p>
              <p 
                className="text-xs text-white/60"
                style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}
              >
                Spread the word
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
} 