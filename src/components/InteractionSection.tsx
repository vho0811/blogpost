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

interface InteractionSectionProps {
  blogPostId: string;
  initialLikesCount?: number;
  blogPostOwnerId?: string;
}

export default function InteractionSection({ blogPostId, initialLikesCount = 0, blogPostOwnerId }: InteractionSectionProps) {
  const { user, isSignedIn } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentSupabaseUserId, setCurrentSupabaseUserId] = useState<string | null>(null);

  // Add CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    loadComments();
    if (isSignedIn && user) {
      checkIfLiked();
      getCurrentSupabaseUser();
    }
  }, [blogPostId, isSignedIn, user]);

  const getCurrentSupabaseUser = async () => {
    if (!user) return;
    try {
      const currentUser = await blogDatabase.getCurrentUser(user.id);
      setCurrentSupabaseUserId(currentUser?.id || null);
    } catch (error) {
      console.error('Error getting current Supabase user:', error);
    }
  };

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

  const checkIfLiked = async () => {
    try {
      const liked = await blogDatabase.checkIfLiked(blogPostId, user!.id);
      setIsLiked(liked);
    } catch (error) {
      console.error('Error checking if liked:', error);
    }
  };

  const handleToggleLike = async () => {
    if (!isSignedIn || !user || isLikeLoading) return;

    try {
      setIsLikeLoading(true);
      console.log('Attempting to toggle like for user:', user.id, 'blog post:', blogPostId);
      
      const result = await blogDatabase.toggleLike(blogPostId, user.id);
      console.log('Toggle like successful:', result);
      
      setIsLiked(result.liked);
      setLikesCount(result.likesCount);
    } catch (error) {
      console.error('Error toggling like:', error);
      // Show user-friendly error message
      alert('Failed to toggle like. Please try again.');
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn || !user || !newComment.trim()) return;

    try {
      setIsSubmitting(true);
      const newCommentData = await blogDatabase.addComment(blogPostId, newComment.trim(), user.id);
      if (newCommentData) {
        // @ts-ignore - Type mismatch between database return type and Comment interface
        setComments(prev => [newCommentData, ...prev]);
      }
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

  const handleEditComment = async (commentId: string) => {
    if (!isSignedIn || !user || isEditing) return;

    try {
      setIsEditing(true);
      const updatedComment = await blogDatabase.updateComment(commentId, editingContent, user.id);
      setComments(prev => prev.map(comment => 
        comment.id === commentId ? updatedComment : comment
      ));
      setEditingCommentId(null);
      setEditingContent('');
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingContent('');
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

  const handleSignInPrompt = () => {
    alert('Please sign in to interact with posts');
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
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(75, 85, 99, 0.3)',
          backdropFilter: 'blur(20px)',
          padding: '32px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px',
            paddingBottom: '24px',
            borderBottom: '1px solid rgba(75, 85, 99, 0.3)'
          }}>
            <div style={{
              height: '28px',
              backgroundColor: 'rgba(75, 85, 99, 0.3)',
              borderRadius: '8px',
              width: '120px',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}></div>
            <div style={{
              height: '44px',
              backgroundColor: 'rgba(75, 85, 99, 0.3)',
              borderRadius: '12px',
              width: '100px',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}></div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            marginBottom: '40px'
          }}>
            <div style={{
              height: '48px',
              width: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(75, 85, 99, 0.3)',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}></div>
            <div style={{ flex: '1' }}>
              <div style={{
                height: '100px',
                backgroundColor: 'rgba(75, 85, 99, 0.3)',
                borderRadius: '12px',
                marginBottom: '16px',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}></div>
              <div style={{
                height: '44px',
                backgroundColor: 'rgba(75, 85, 99, 0.3)',
                borderRadius: '12px',
                width: '100px',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}></div>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                display: 'flex',
                gap: '16px',
                animation: `slideInUp 0.4s ease-out ${i * 0.1}s both`
              }}>
                <div style={{
                  height: '40px',
                  width: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(75, 85, 99, 0.3)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}></div>
                <div style={{ flex: '1' }}>
                  <div style={{
                    backgroundColor: 'rgba(75, 85, 99, 0.3)',
                    borderRadius: '12px',
                    padding: '20px',
                    height: '80px',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }}></div>
                </div>
              </div>
            ))}
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
        backdropFilter: 'blur(20px)',
        animation: 'fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div style={{ padding: '32px' }}>
          {/* Header with Love Button and Comments Count */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px',
            paddingBottom: '24px',
            borderBottom: '1px solid rgba(75, 85, 99, 0.3)'
          }}>
            <h3 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#f9fafb',
              margin: '0',
              letterSpacing: '-0.025em'
            }}>
              💬 Vibes ({comments.length})
            </h3>
            
            <button
              onClick={isSignedIn ? handleToggleLike : handleSignInPrompt}
              disabled={isLikeLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '12px',
                cursor: isLikeLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isLikeLoading ? '0.6' : '1',
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
                {isLiked ? ' Lit' : ' Spark'} ({likesCount})
              </span>
            </button>
          </div>

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
              comments.map((comment, index) => (
                <div key={comment.id} style={{ 
                  display: 'flex', 
                  gap: '16px',
                  animation: `slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s both`
                }}>
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
                        <div style={{
                          display: 'flex',
                          gap: '8px'
                        }}>
                          {isSignedIn && currentSupabaseUserId === comment.user_id && (
                            <>
                              <button
                                onClick={() => startEditComment(comment)}
                                disabled={editingCommentId !== null}
                                style={{
                                  color: '#3b82f6',
                                  fontSize: '12px',
                                  background: 'none',
                                  border: 'none',
                                  cursor: editingCommentId !== null ? 'not-allowed' : 'pointer',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontWeight: '500',
                                  transition: 'all 0.2s ease',
                                  opacity: editingCommentId !== null ? '0.5' : '1'
                                }}
                              >
                                Edit
                              </button>
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
                            </>
                          )}
                          {isSignedIn && currentSupabaseUserId === blogPostOwnerId && currentSupabaseUserId !== comment.user_id && (
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
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                      {editingCommentId === comment.id ? (
                        <div style={{ marginTop: '12px' }}>
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '1px solid rgba(75, 85, 99, 0.5)',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(31, 41, 55, 0.8)',
                              color: '#f9fafb',
                              outline: 'none',
                              resize: 'none',
                              fontFamily: 'inherit',
                              fontSize: '14px',
                              lineHeight: '1.6',
                              minHeight: '80px',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              backdropFilter: 'blur(12px)'
                            }}
                            rows={3}
                            disabled={isEditing}
                          />
                          <div style={{
                            marginTop: '12px',
                            display: 'flex',
                            gap: '8px'
                          }}>
                            <button
                              onClick={() => handleEditComment(comment.id)}
                              disabled={!editingContent.trim() || isEditing}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: 'rgba(59, 130, 246, 0.9)',
                                color: '#ffffff',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '12px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                opacity: (!editingContent.trim() || isEditing) ? '0.5' : '1',
                                pointerEvents: (!editingContent.trim() || isEditing) ? 'none' : 'auto',
                                backdropFilter: 'blur(12px)',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                              }}
                            >
                              {isEditing ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEditComment}
                              disabled={isEditing}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: 'rgba(75, 85, 99, 0.8)',
                                color: '#e5e7eb',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '12px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                opacity: isEditing ? '0.5' : '1',
                                pointerEvents: isEditing ? 'none' : 'auto',
                                backdropFilter: 'blur(12px)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p style={{
                          color: '#e5e7eb',
                          margin: '0',
                          fontSize: '14px',
                          lineHeight: '1.6'
                        }}>
                          {comment.content}
                        </p>
                      )}
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