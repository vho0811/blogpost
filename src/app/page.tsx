'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { blogDatabase, type BlogPost } from '@/lib/blog-database';

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);


  // Debug Clerk state


  // Fetch blog posts from database
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setIsLoading(true);
        const posts = await blogDatabase.getPublishedBlogPosts(12); // Show 12 posts initially
        setBlogPosts(posts || []);

        
        // Set the first post as featured, or use a default
        if (posts && posts.length > 0) {
          setFeaturedPost(posts[0]);
        }
        
        // Check if there are more posts to load (if we got exactly 12, there might be more)
        setHasMorePosts((posts?.length || 0) >= 12);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
        setBlogPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  // Load more posts function
  const loadMorePosts = async () => {
    if (isLoadingMore || !hasMorePosts) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      const offset = (nextPage - 1) * 12; // Load 12 more posts
      
      // Fetch next batch of posts
      const morePosts = await blogDatabase.getPublishedBlogPosts(12, offset);
      
      if (morePosts && morePosts.length > 0) {
        setBlogPosts(prev => [...prev, ...morePosts]);
        setCurrentPage(nextPage);
        setHasMorePosts(morePosts.length >= 12);
      } else {
        setHasMorePosts(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold text-white">
                BlogAI
              </Link>
              <nav className="hidden md:flex items-center space-x-6">
                <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
                {isSignedIn && (
                  <>
                    <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                      Dashboard
                    </Link>
                    <Link href="/write" className="text-gray-300 hover:text-white transition-colors">
                      Write
                    </Link>
                  </>
                )}
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {isLoaded ? (
                <>
                  {isSignedIn ? (
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-300 text-sm">
                        Welcome, {user.firstName || user.username || 'User'}!
                      </span>
                      <UserButton />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <SignInButton mode="modal">
                        <button className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-400 hover:to-purple-500 transition-all duration-300 cursor-pointer font-medium shadow-lg hover:shadow-blue-500/25 hover:scale-105 border border-blue-400/30">
                          Sign In
                        </button>
                      </SignInButton>
                    </div>
                  )}
                </>
              ) : (
                // Show sign-in button while Clerk is loading
                <div className="flex items-center space-x-3">
                  <SignInButton mode="modal">
                    <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-400 hover:to-purple-500 transition-all cursor-pointer">
                      Sign In
                    </button>
                  </SignInButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
            {isSignedIn ? 'Welcome Back!' : 'Discover Amazing Stories'}
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-8">
            {isSignedIn 
              ? 'Ready to create your next masterpiece? Your AI-powered writing platform awaits.'
              : 'Read, write, and share stories that matter. Enhanced with AI-powered beauty.'
            }
          </p>
          
          {isSignedIn && (
            <div className="flex justify-center space-x-4">
              <Link
                href="/write"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-full hover:from-blue-400 hover:to-purple-500 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Start Writing
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-gray-300 border-2 border-gray-600 rounded-full hover:text-white hover:border-gray-500 transition-all duration-300"
              >
                My Dashboard
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* Featured Post - Next Level Design */}
        {featuredPost && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Featured Story</h2>
            <Link href={`/blog/${featuredPost.slug || featuredPost.id}`} className="block group">
              <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-gray-800 hover:border-gray-700 transition-all duration-700 hover:scale-[1.02]">
                {/* Hero Image with Overlay */}
                <div className="relative aspect-[21/9] overflow-hidden">
                  <Image
                    src={featuredPost.featured_image_url || '/featured-blog.jpg'}
                    alt={featuredPost.title}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  
                  {/* Floating Elements */}
                  <div className="absolute top-8 left-8">
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white border border-blue-400/30 shadow-lg">
                      {featuredPost.category}
                    </span>
                  </div>
                  
                  <div className="absolute top-8 right-8">
                    <div className="flex items-center space-x-2 text-white/80">
                      <span className="text-sm">{featuredPost.read_time && featuredPost.read_time > 0 ? featuredPost.read_time : 5} min read</span>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-12">
                    <div className="max-w-4xl">
                      <h3 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-500">
                        {featuredPost.title}
                      </h3>
                      <p className="text-xl md:text-2xl text-gray-200 max-w-3xl leading-relaxed mb-8">
                        {featuredPost.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interactive Stats Bar */}
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      {featuredPost?.users?.profile_image_url ? (
                        <img 
                          src={featuredPost.users.profile_image_url} 
                          alt={featuredPost.users.username || 'Author'}
                          className="w-16 h-16 rounded-full object-cover shadow-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-xl">
                            {featuredPost?.users?.username?.[0]?.toUpperCase() || 'A'}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-white font-bold text-lg">
                          {featuredPost?.users?.username || 'Author'}
                        </p>
                        <p className="text-gray-400">Blog Creator</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">
                        {featuredPost.published_at ? new Date(featuredPost.published_at).toLocaleDateString() : 'Recently'}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-green-400 font-medium">{featuredPost.views || 0} views</span>
                        <span className="text-blue-400 font-medium">{featuredPost.likes || 0} likes</span>
                      </div>
                    </div>
                  </div>



                  {/* Call to Action */}
                  <div className="mt-8 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button className="group flex items-center space-x-2 text-gray-400 hover:text-white transition-all duration-300 cursor-pointer bg-gray-800/40 hover:bg-gray-700/60 px-4 py-2 rounded-lg border border-gray-700/50 hover:border-gray-600/70 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/10">
                        <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="font-medium">Save</span>
                      </button>
                      <button className="group flex items-center space-x-2 text-gray-400 hover:text-white transition-all duration-300 cursor-pointer bg-gray-800/40 hover:bg-gray-700/60 px-4 py-2 rounded-lg border border-gray-700/50 hover:border-gray-600/70 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-500/10">
                        <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        <span className="font-medium">Share</span>
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 text-white font-semibold">
                      <span>Read Full Story</span>
                      <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          </div>
        )}

        {/* Blog Posts Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Latest Stories</h2>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-white">Loading blog posts...</p>
            </div>
          ) : blogPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug || post.id}`} className="block group">
                  <article className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-2xl overflow-hidden hover:from-gray-800/50 hover:to-gray-700/50 transition-all duration-500 hover:scale-105 border border-gray-800 hover:border-gray-700">
                    {/* Post Image */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={post.featured_image_url || '/featured-blog.jpg'}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      
                      {/* Category Badge */}
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-500 to-blue-500 text-white border border-green-400/30">
                          {post.category}
                        </span>
                      </div>
                      
                      {/* Read Time */}
                      <div className="absolute top-4 right-4">
                        <span className="text-white/80 text-xs bg-black/50 px-2 py-1 rounded">
                          {post.read_time && post.read_time > 0 ? post.read_time : 5} min read
                        </span>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="p-6 space-y-4">
                      {/* Title */}
                      <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-green-400 group-hover:to-blue-400 transition-all duration-300 line-clamp-2">
                        {post.title}
                      </h3>

                      {/* Subtitle */}
                      <p className="text-gray-300 text-sm line-clamp-3">
                        {post.subtitle}
                      </p>



                      {/* Author, Date, and Stats */}
                                              <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-3">
                          {post?.users?.profile_image_url ? (
                            <img 
                              src={post.users.profile_image_url} 
                              alt={post.users.username || 'Author'}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-600 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {post?.users?.username?.[0]?.toUpperCase() || 'A'}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-white font-medium text-sm">
                              {post?.users?.username || 'Author'}
                            </p>
                            <p className="text-gray-400 text-xs">Blog Creator</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <time className="text-gray-400 text-xs block">
                            {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Recently'}
                          </time>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-green-400 text-xs font-medium">{post.views || 0} views</span>
                            <span className="text-blue-400 text-xs font-medium">{post.likes || 0} likes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No blog posts found. Be the first to create one!</p>
              {isSignedIn && (
                <Link
                  href="/write"
                  className="inline-flex items-center mt-4 px-6 py-3 text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-400 hover:to-purple-500 transition-all"
                >
                  Create Your First Post
                </Link>
              )}
            </div>
          )}
        </div>



        {/* Load More Section */}
        {blogPosts.length > 0 && (
          <div className="text-center mb-16">
            {hasMorePosts ? (
              <button 
                onClick={loadMorePosts}
                disabled={isLoadingMore}
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-full hover:from-blue-400 hover:to-purple-500 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoadingMore ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading More Stories...
                  </>
                ) : (
                  <>
                    Load More Stories
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">You&apos;ve Seen All Stories!</h3>
                <p className="text-gray-400 mb-6">You&apos;ve reached the end of our current collection. Check back soon for more amazing stories!</p>
                {isSignedIn && (
                  <Link 
                    href="/write" 
                    className="inline-flex items-center px-6 py-3 text-white bg-gradient-to-r from-green-500 to-blue-600 rounded-lg hover:from-green-400 hover:to-blue-500 transition-all duration-300"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Write Your Own Story
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}