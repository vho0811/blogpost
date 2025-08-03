'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { SignInButton } from '@clerk/nextjs';
import Image from 'next/image';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

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

interface CommentsProps {
  blogPostId: string;
  className?: string;
}

export default function Comments({ blogPostId, className = '' }: CommentsProps) {
  const { isSignedIn, user } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; commentId: string | null }>({
    isOpen: false,
    commentId: null
  });

  // Fetch comments
  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/comments?blogPostId=${blogPostId}`);
      const data = await response.json();
      
      if (data.success) {
        setComments(data.comments);
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

  // Add new comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blogPostId,
          content: newComment.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
      } else {
        alert('Failed to post comment. Please try again.');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update comment
  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          content: editContent.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setComments(prev => 
          prev.map(comment => 
            comment.id === commentId 
              ? { ...comment, content: editContent.trim() }
              : comment
          )
        );
        setEditingComment(null);
        setEditContent('');
      } else {
        alert('Failed to update comment. Please try again.');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment. Please try again.');
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
        setDeleteModal({ isOpen: false, commentId: null });
      } else {
        alert('Failed to delete comment. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (commentId: string) => {
    setDeleteModal({ isOpen: true, commentId });
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, commentId: null });
  };

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

  // Check if user is comment author
  const isCommentAuthor = (comment: Comment) => {
    return comment.users?.username === user?.username || 
           comment.users?.first_name === user?.firstName;
  };

  return (
    <>
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(15, 15, 15, 0.98) 0%, rgba(25, 25, 25, 0.98) 50%, rgba(35, 35, 35, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '1.5rem',
          border: '1px solid rgba(64, 64, 64, 0.4)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          margin: '0',
          padding: '0'
        }}
      >
        {/* Comments Header */}
        <div 
          style={{
            padding: '1.5rem 2rem',
            borderBottom: '1px solid rgba(64, 64, 64, 0.4)',
            background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.8) 0%, rgba(30, 30, 30, 0.8) 100%)',
            margin: '0'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            margin: '0',
            padding: '0'
          }}>
            <h3 
              style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#f8fafc',
                letterSpacing: '0.025em',
                margin: '0',
                padding: '0'
              }}
            >
              Comments ({comments.length})
            </h3>
            {isLoading && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#9ca3af',
                margin: '0',
                padding: '0'
              }}>
                <div 
                  style={{
                    width: '1rem',
                    height: '1rem',
                    border: '2px solid rgba(75, 85, 99, 1)',
                    borderTop: '2px solid rgba(156, 163, 175, 1)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}
                ></div>
                <span 
                  style={{
                    fontSize: '0.875rem',
                    margin: '0',
                    padding: '0'
                  }}
                >
                  Loading...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Add Comment Form */}
        <div 
          style={{
            padding: '2rem',
            borderBottom: '1px solid rgba(64, 64, 64, 0.4)',
            background: 'linear-gradient(135deg, rgba(18, 18, 18, 0.6) 0%, rgba(28, 28, 28, 0.6) 100%)',
            margin: '0'
          }}
        >
          {isSignedIn ? (
            <form onSubmit={handleSubmitComment} style={{ margin: '0', padding: '0' }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                margin: '0',
                padding: '0'
              }}>
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={user.username || 'You'}
                    width={40}
                    height={40}
                    style={{
                      borderRadius: '50%',
                      flexShrink: 0,
                      margin: '0',
                      padding: '0'
                    }}
                  />
                ) : (
                  <div 
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      margin: '0',
                      padding: '0'
                    }}
                  >
                    <span 
                      style={{
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        margin: '0',
                        padding: '0'
                      }}
                    >
                      {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                    </span>
                  </div>
                )}
                <div style={{
                  flex: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  margin: '0',
                  padding: '0'
                }}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    style={{
                      width: '100%',
                      background: 'rgba(12, 12, 12, 0.8)',
                      border: '1px solid rgba(64, 64, 64, 0.6)',
                      borderRadius: '0.875rem',
                      padding: '1rem 1.25rem',
                      color: '#f1f5f9',
                      resize: 'none',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      margin: '0',
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      fontFamily: 'inherit',
                      minHeight: '3rem'
                    }}
                    rows={3}
                    disabled={isSubmitting}
                  />
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    margin: '0',
                    padding: '0'
                  }}>
                    <p 
                      style={{
                        color: '#9ca3af',
                        fontSize: '0.875rem',
                        margin: '0',
                        padding: '0'
                      }}
                    >
                      {newComment.length}/500 characters
                    </p>
                    <button
                      type="submit"
                      disabled={!newComment.trim() || isSubmitting}
                      style={{
                        padding: '0.75rem 2rem',
                        background: 'linear-gradient(135deg, #1f1f1f 0%, #2a2a2a 100%)',
                        color: '#f8fafc',
                        borderRadius: '0.75rem',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s ease',
                        border: '1px solid rgba(64, 64, 64, 0.6)',
                        cursor: 'pointer',
                        margin: '0',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                        opacity: (!newComment.trim() || isSubmitting) ? '0.5' : '1',
                        letterSpacing: '0.025em'
                      }}
                    >
                      {isSubmitting ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '1.5rem 0',
              margin: '0'
            }}>
              <div 
                style={{
                  width: '4rem',
                  height: '4rem',
                  margin: '0 auto 1rem',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(124, 58, 237, 0.2) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg 
                  style={{
                    width: '2rem',
                    height: '2rem',
                    color: '#60a5fa'
                  }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h4 
                style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '0.5rem',
                  margin: '0 0 0.5rem 0',
                  padding: '0'
                }}
              >
                Join the conversation
              </h4>
              <p 
                style={{
                  color: '#9ca3af',
                  marginBottom: '1rem',
                  margin: '0 0 1rem 0',
                  padding: '0',
                  fontSize: '0.875rem'
                }}
              >
                Sign in to share your thoughts on this story
              </p>
              <SignInButton mode="modal">
                <button 
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(90deg, #2563eb 0%, #7c3aed 100%)',
                    color: 'white',
                    borderRadius: '9999px',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease',
                    border: 'none',
                    cursor: 'pointer',
                    margin: '0',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  Sign In to Comment
                </button>
              </SignInButton>
            </div>
          )}
        </div>

        {/* Comments List */}
        <div style={{ margin: '0', padding: '0' }}>
          {comments.length === 0 && !isLoading ? (
            <div 
              style={{
                padding: '2rem 1.5rem',
                textAlign: 'center'
              }}
            >
              <div 
                style={{
                  width: '4rem',
                  height: '4rem',
                  margin: '0 auto 1rem',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(55, 65, 81, 0.7) 0%, rgba(75, 85, 99, 0.7) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg 
                  style={{
                    width: '2rem',
                    height: '2rem',
                    color: '#9ca3af'
                  }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h4 
                style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '0.5rem',
                  margin: '0 0 0.5rem 0',
                  padding: '0'
                }}
              >
                No comments yet
              </h4>
              <p 
                style={{
                  color: '#9ca3af',
                  fontSize: '0.875rem',
                  margin: '0',
                  padding: '0'
                }}
              >
                Be the first to share your thoughts on this story
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div 
                key={comment.id} 
                style={{
                  padding: '1.5rem 1.5rem',
                  transition: 'background-color 0.2s ease',
                  borderBottom: '1px solid rgba(75, 85, 99, 0.4)',
                  margin: '0'
                }}
              >
                {editingComment === comment.id ? (
                  // Edit Comment Form
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    margin: '0',
                    padding: '0'
                  }}>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(31, 41, 55, 0.7)',
                        border: '1px solid rgba(75, 85, 99, 0.8)',
                        borderRadius: '0.75rem',
                        padding: '1rem',
                        color: 'white',
                        resize: 'none',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        margin: '0',
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                        fontFamily: 'inherit',
                        minHeight: '3rem'
                      }}
                      rows={3}
                    />
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '0.75rem',
                      margin: '0',
                      padding: '0'
                    }}>
                      <button
                        onClick={() => {
                          setEditingComment(null);
                          setEditContent('');
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          color: '#9ca3af',
                          transition: 'color 0.2s ease',
                          fontSize: '0.875rem',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          margin: '0'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateComment(comment.id)}
                        disabled={!editContent.trim()}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'linear-gradient(90deg, #2563eb 0%, #7c3aed 100%)',
                          color: 'white',
                          borderRadius: '9999px',
                          fontWeight: '500',
                          fontSize: '0.875rem',
                          transition: 'all 0.2s ease',
                          border: 'none',
                          cursor: 'pointer',
                          margin: '0',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                          opacity: !editContent.trim() ? '0.5' : '1'
                        }}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  // Comment Display
                  <div style={{ margin: '0', padding: '0' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      margin: '0',
                      padding: '0'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        margin: '0',
                        padding: '0'
                      }}>
                        {comment.users?.profile_image_url ? (
                          <Image
                            src={comment.users.profile_image_url}
                            alt={comment.users.username || 'User'}
                            width={40}
                            height={40}
                            style={{
                              borderRadius: '50%',
                              margin: '0',
                              padding: '0'
                            }}
                          />
                        ) : (
                          <div 
                            style={{
                              width: '2.5rem',
                              height: '2.5rem',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #4b5563 0%, #374151 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0',
                              padding: '0'
                            }}
                          >
                            <span 
                              style={{
                                color: 'white',
                                fontWeight: '600',
                                fontSize: '0.875rem',
                                margin: '0',
                                padding: '0'
                              }}
                            >
                              {comment.users?.username?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                        <div style={{
                          flex: '1',
                          minWidth: '0',
                          margin: '0',
                          padding: '0'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginBottom: '0.5rem',
                            margin: '0 0 0.5rem 0',
                            padding: '0'
                          }}>
                            <p 
                              style={{
                                color: 'white',
                                fontWeight: '600',
                                fontSize: '0.875rem',
                                margin: '0',
                                padding: '0',
                                lineHeight: '1.2'
                              }}
                            >
                              {comment.users?.username || comment.users?.first_name || 'Anonymous'}
                            </p>
                            <span 
                              style={{
                                color: '#9ca3af',
                                fontSize: '0.75rem',
                                margin: '0',
                                padding: '0',
                                lineHeight: '1.2'
                              }}
                            >
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p 
                            style={{
                              color: '#e5e7eb',
                              lineHeight: '1.6',
                              fontSize: '0.875rem',
                              margin: '0',
                              padding: '0'
                            }}
                          >
                            {comment.content}
                          </p>
                        </div>
                      </div>
                      
                      {isCommentAuthor(comment) && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          margin: '0',
                          padding: '0'
                        }}>
                          <button
                            onClick={() => {
                              setEditingComment(comment.id);
                              setEditContent(comment.content);
                            }}
                            style={{
                              color: '#9ca3af',
                              transition: 'all 0.2s ease',
                              padding: '0.5rem',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              margin: '0',
                              borderRadius: '0.5rem'
                            }}
                          >
                            <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openDeleteModal(comment.id)}
                            style={{
                              color: '#9ca3af',
                              transition: 'all 0.2s ease',
                              padding: '0.5rem',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              margin: '0',
                              borderRadius: '0.5rem'
                            }}
                          >
                            <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        onConfirm={() => deleteModal.commentId && handleDeleteComment(deleteModal.commentId)}
        onCancel={closeDeleteModal}
      />
    </>
  );
} 