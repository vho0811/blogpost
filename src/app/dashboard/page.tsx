'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { blogDatabase, type BlogPost } from '@/lib/blog-database';
import { readingProgressManager } from '@/lib/reading-progress';
import Link from 'next/link';
import { showNotification } from '@/components/BeautifulNotification';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; postId: string; postTitle: string }>({
    isOpen: false,
    postId: '',
    postTitle: ''
  });

  // Redirect if not logged in
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  // Load user's blog posts
  useEffect(() => {
    if (user) {
      loadBlogPosts();
    }
  }, [user, filter]);

  const loadBlogPosts = async () => {
    setLoading(true);
    try {
      if (user) {
        const posts = await blogDatabase.getUserBlogPosts(user.id, filter === 'all' ? undefined : filter);
        setBlogPosts(posts);
      }
    } catch (error) {
      console.error('Error loading blog posts:', error);
      setBlogPosts([]);
    } finally {
      setLoading(false);
    }
  };



  const handleDeleteClick = (id: string, title: string) => {
    setDeleteModal({
      isOpen: true,
      postId: id,
      postTitle: title
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      if (user) {
        const success = await blogDatabase.deleteBlogPost(deleteModal.postId, user.id);
        if (success) {
          setBlogPosts(posts => posts.filter(post => post.id !== deleteModal.postId));
          showNotification('Blog post deleted successfully', 'success');
        } else {
          showNotification('Failed to delete blog post', 'error');
        }
      }
    } catch (error) {
      showNotification('Failed to delete blog post', 'error');
    } finally {
      setDeleteModal({ isOpen: false, postId: '', postTitle: '' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, postId: '', postTitle: '' });
  };

  const handleStatusChange = async (id: string, status: 'draft' | 'published' | 'archived') => {
    try {
      if (user) {
        const updated = await blogDatabase.updateBlogPost(id, { status }, user.id);
        if (updated) {
          setBlogPosts(posts => posts.map(post => 
            post.id === id ? { ...post, status } : post
          ));
          showNotification(`Blog post ${status === 'published' ? 'published' : status === 'archived' ? 'archived' : 'saved as draft'}`, 'success');
        } else {
          showNotification('Failed to update blog post status', 'error');
        }
      }
    } catch (error) {
      showNotification('Failed to update blog post status', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-400 bg-green-400/10';
      case 'draft':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'archived':
        return 'text-gray-400 bg-gray-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  if (!isLoaded) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-white hover:text-gray-300 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            </div>
            
            <Link
              href="/write"
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-400 hover:to-purple-500 transition-all"
            >
              Write New Post
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-md rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">Total Posts</dt>
                  <dd className="text-2xl font-semibold text-white">{blogPosts.length}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-md rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">Published</dt>
                  <dd className="text-2xl font-semibold text-white">
                    {blogPosts.filter(post => post.status === 'published').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-md rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">Drafts</dt>
                  <dd className="text-2xl font-semibold text-white">
                    {blogPosts.filter(post => post.status === 'draft').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-md rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">Total Views</dt>
                  <dd className="text-2xl font-semibold text-white">
                    {blogPosts.reduce((sum, post) => sum + (post.views || 0), 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6">
          {(['all', 'published', 'draft', 'archived'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === status
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'text-gray-400 hover:text-white bg-gray-800/50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Blog Posts List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-400 mt-4">Loading your blog posts...</p>
          </div>
        ) : blogPosts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-400 mb-2">No blog posts found</h3>
            <p className="text-gray-500 mb-6">Start creating your first blog post!</p>
            <Link
              href="/write"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-400 hover:to-purple-500 transition-all"
            >
              Write Your First Post
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {blogPosts.map((post) => (
              <div key={post.id} className="bg-gray-800/50 backdrop-blur-md rounded-lg border border-gray-700 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-white truncate">
                        {post.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                        {post.status}
                      </span>
                    </div>
                    
                    {post.subtitle && (
                      <p className="text-gray-300 mb-3">{post.subtitle}</p>
                    )}
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-400 mb-3">
                      <span>Category: {post.category}</span>
                      <span>Views: {post.views || 0}</span>
                      <span>Likes: {post.likes || 0}</span>
                      <span>Read time: {post.read_time || 0} min</span>
                      <span>Created: {formatDate(post.created_at!)}</span>
                    </div>
                    
                    {/* Reading Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Reading Progress</span>
                        <span>
                          {(() => {
                            const progress = readingProgressManager.getProgress(post.id || '');
                            return progress ? `${Math.round(progress.progress)}%` : '0%';
                          })()}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-700/60 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${(() => {
                              const progress = readingProgressManager.getProgress(post.id || '');
                              return progress ? progress.progress : 0;
                            })()}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {post.status === 'published' && (
                      <Link
                        href={`/blog/${post.slug}`}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors cursor-pointer"
                        title="View Post"
                      >
                        <svg className="w-5 h-5 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                    )}
                    
                    <Link
                      href={`/write?id=${post.id}`}
                      className="p-2 text-gray-400 hover:text-green-400 transition-colors cursor-pointer"
                      title="Edit Post"
                    >
                      <svg className="w-5 h-5 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    
                    <select
                      value={post.status}
                      onChange={(e) => handleStatusChange(post.id!, e.target.value as 'draft' | 'published' | 'archived')}
                      className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                    
                    <button
                      onClick={() => handleDeleteClick(post.id!, post.title)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete Post"
                    >
                      <svg className="w-5 h-5 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Blog Post"
        message={`Are you sure you want to delete "${deleteModal.postTitle}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}