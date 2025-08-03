'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { blogDatabase } from '@/lib/blog-database';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  users: {
    username?: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
  };
}

interface CommentsSectionProps {
  blogPostId: string;
}

export default function CommentsSection({ blogPostId }: CommentsSectionProps) {
  const { user, isSignedIn } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [blogPostId]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const commentsData = await blogDatabase.getComments(blogPostId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn || !user || !newComment.trim()) return;

    try {
      setIsSubmitting(true);
      const newCommentData = await blogDatabase.addComment(blogPostId, newComment.trim(), user.id);
      setComments(prev => [newCommentData, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!isSignedIn || !user) return;

    try {
      const success = await blogDatabase.deleteComment(commentId, user.id);
      if (success) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserDisplayName = (comment: Comment) => {
    const user = comment.users;
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.first_name) {
      return user.first_name;
    }
    if (user?.username) {
      return user.username;
    }
    return 'Anonymous';
  };

  if (isLoading) {
    return (
      <div style={{
        maxWidth: '896px',
        margin: '0 auto',
        padding: '32px 16px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}>
          <div style={{
            height: '16px',
            backgroundColor: '#374151',
            borderRadius: '8px',
            width: '25%',
            marginBottom: '16px'
          }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              height: '16px',
              backgroundColor: '#374151',
              borderRadius: '8px'
            }}></div>
            <div style={{
              height: '16px',
              backgroundColor: '#374151',
              borderRadius: '8px',
              width: '83.333333%'
            }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '896px',
      margin: '0 auto',
      padding: '32px 16px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(75, 85, 99, 0.3)',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{ padding: '32px' }}>
          <h3 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#f9fafb',
            margin: '0 0 32px 0',
            letterSpacing: '-0.025em'
          }}>
            💬 Vibes ({comments.length})
          </h3>

          {/* Add Comment Form */}
          {isSignedIn ? (
            <form onSubmit={handleSubmitComment} style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flexShrink: '0' }}>
                  <img
                    style={{
                      height: '48px',
                      width: '48px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid rgba(75, 85, 99, 0.5)'
                    }}
                    src={user?.imageUrl || '/default-avatar.png'}
                    alt="Profile"
                  />
                </div>
                <div style={{ flex: '1' }}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Drop your thoughts..."
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      border: '1px solid rgba(75, 85, 99, 0.5)',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(31, 41, 55, 0.8)',
                      color: '#f9fafb',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      minHeight: '100px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      backdropFilter: 'blur(12px)'
                    }}
                    rows={3}
                    disabled={isSubmitting}
                  />
                  <div style={{
                    marginTop: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <button
                      type="submit"
                      disabled={!newComment.trim() || isSubmitting}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: 'rgba(59, 130, 246, 0.9)',
                        color: '#ffffff',
                        borderRadius: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: (!newComment.trim() || isSubmitting) ? '0.5' : '1',
                        pointerEvents: (!newComment.trim() || isSubmitting) ? 'none' : 'auto',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      {isSubmitting ? 'Posting...' : '💭 Share'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div style={{
              marginBottom: '40px',
              padding: '20px',
              backgroundColor: 'rgba(31, 41, 55, 0.8)',
              borderRadius: '12px',
              border: '1px solid rgba(75, 85, 99, 0.3)',
              backdropFilter: 'blur(12px)'
            }}>
              <p style={{
                color: '#9ca3af',
                margin: '0',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                Please sign in to leave a comment.
              </p>
            </div>
          )}

          {/* Comments List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {comments.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px 0',
                color: '#6b7280',
                fontSize: '16px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 16px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(75, 85, 99, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg style={{ width: '24px', height: '24px', color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p style={{ margin: '0', color: '#9ca3af' }}>
                  No vibes yet. Be the first to share your thoughts!
                </p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flexShrink: '0' }}>
                    <img
                      style={{
                        height: '40px',
                        width: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid rgba(75, 85, 99, 0.5)'
                      }}
                      src={comment.users?.profile_image_url || '/default-avatar.png'}
                      alt="Profile"
                    />
                  </div>
                  <div style={{ flex: '1' }}>
                    <div style={{
                      backgroundColor: 'rgba(31, 41, 55, 0.8)',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid rgba(75, 85, 99, 0.3)',
                      backdropFilter: 'blur(12px)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <span style={{
                            fontWeight: '600',
                            color: '#f9fafb',
                            fontSize: '14px'
                          }}>
                            {getUserDisplayName(comment)}
                          </span>
                          <span style={{
                            fontSize: '12px',
                            color: '#9ca3af',
                            fontWeight: '500'
                          }}>
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        {isSignedIn && user?.id === comment.user_id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            style={{
                              color: '#ef4444',
                              fontSize: '12px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontWeight: '500',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p style={{
                        color: '#e5e7eb',
                        margin: '0',
                        fontSize: '14px',
                        lineHeight: '1.6'
                      }}>
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 