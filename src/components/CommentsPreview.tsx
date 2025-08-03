'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  users: {
    username?: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
  };
}

interface CommentsPreviewProps {
  blogPostId: string;
  className?: string;
}

export default function CommentsPreview({ blogPostId, className = '' }: CommentsPreviewProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch recent comments
  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/comments?blogPostId=${blogPostId}`);
      const data = await response.json();
      
      if (data.success) {
        // Only show the 2 most recent comments
        setComments(data.comments.slice(0, 2));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [blogPostId]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (comments.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className={`bg-white/5 rounded-xl border border-white/10 overflow-hidden ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-white">Recent Comments</h4>
          {isLoading && (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
          )}
        </div>
        
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start space-x-3">
              {comment.users?.profile_image_url ? (
                <Image
                  src={comment.users.profile_image_url}
                  alt={comment.users.username || 'User'}
                  width={24}
                  height={24}
                  className="rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium text-xs">
                    {comment.users?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-white font-medium text-xs">
                    {comment.users?.username || comment.users?.first_name || 'Anonymous'}
                  </p>
                  <span className="text-white/40 text-xs">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-white/80 text-xs leading-relaxed" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {comments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <Link 
              href={`/blog/${blogPostId}`}
              className="text-white/60 hover:text-white text-xs transition-colors"
            >
              View all comments →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 