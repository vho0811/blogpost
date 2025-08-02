'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { blogDatabase, type BlogPost } from '@/lib/blog-database';
import BlogAIDesigner from '@/components/BlogAIDesigner';

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Debug Clerk state


  // Fetch blog posts from database
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setIsLoading(true);
        const posts = await blogDatabase.getPublishedBlogPosts();
        setBlogPosts(posts || []);
        
        // Set the first post as featured, or use a default
        if (posts && posts.length > 0) {
          setFeaturedPost(posts[0]);
        }
      } catch (error) {
        console.error('Error fetching blog posts:', error);
        setBlogPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogPosts();


  }, []);

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
                    {(featuredPost as any)?.users?.profile_image_url ? (
                      <img 
                        src={(featuredPost as any)?.users?.profile_image_url} 
                        alt={(featuredPost as any)?.users?.username || 'Author'}
                        className="w-16 h-16 rounded-full object-cover shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xl">
                          {(featuredPost as any)?.users?.username?.[0]?.toUpperCase() || 'A'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-white font-bold text-lg">
                        {(featuredPost as any)?.users?.username || 'Author'}
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

                  {/* Interactive Progress Bar */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Reading Progress</span>
                      <span>Featured Story</span>
                    </div>
                    <div className="w-full h-3 bg-gray-800/60 rounded-full overflow-hidden border border-gray-700/50">
                      <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out group-hover:w-full shadow-lg shadow-blue-500/20" style={{ width: '0%' }}></div>
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

                      {/* Author and Date */}
                      <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center space-x-3">
                          {(post as any)?.users?.profile_image_url ? (
                            <img 
                              src={(post as any)?.users?.profile_image_url} 
                              alt={(post as any)?.users?.username || 'Author'}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-600 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {(post as any)?.users?.username?.[0]?.toUpperCase() || 'A'}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-white font-medium text-sm">
                              {(post as any)?.users?.username || 'Author'}
                            </p>
                            <p className="text-gray-400 text-xs">Blog Creator</p>
                          </div>
                        </div>
                        <time className="text-gray-400 text-xs">
                          {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Recently'}
                        </time>
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

        {/* AI Enhancement Section */}
        <div className="text-center mb-16">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-8 backdrop-blur-md">
            <h2 className="text-3xl font-bold text-white mb-4">AI-Powered Content Enhancement</h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Transform your blog posts into stunning, engaging content with our AI-powered enhancer. 
              Get beautiful designs, interactive elements, and SEO optimizations instantly.
            </p>
            {isSignedIn ? (
              <Link href="/write" className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-full hover:from-blue-400 hover:to-purple-500 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                Start Creating with AI
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </Link>
            ) : (
              <SignInButton mode="modal">
                <button className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-full hover:from-blue-400 hover:to-purple-500 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/30 cursor-pointer border border-blue-400/20">
                  Sign In to Start
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </SignInButton>
            )}
          </div>
        </div>

        {/* Load More Section */}
        <div className="text-center">
          <button className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-full hover:from-blue-400 hover:to-purple-500 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer">
            Load More Stories
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </section>
    </div>
  );
}