'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { blogDatabase, type BlogPost } from '@/lib/blog-database';
import CommentsPreview from '@/components/CommentsPreview';
import SocialActionsWrapper from '@/components/SocialActionsWrapper';

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [isCheckingLikes, setIsCheckingLikes] = useState(false);

  // Check if user has liked posts
  const checkUserLikes = async () => {
    if (!isSignedIn || !user) return;
    
    try {
      setIsCheckingLikes(true);
      const likedPostIds = new Set<string>();
      
      // Check each post to see if user has liked it
      for (const post of blogPosts) {
        if (post.id) {
          try {
            const response = await fetch(`/api/like/check?blogPostId=${post.id}`);
            const data = await response.json();
            
            if (data.success && data.liked) {
              likedPostIds.add(post.id);
            }
          } catch (error) {
            console.error('Error checking like for post:', post.id, error);
          }
        }
      }
      
      setLikedPosts(likedPostIds);
    } catch (error) {
      console.error('Error checking user likes:', error);
    } finally {
      setIsCheckingLikes(false);
    }
  };

  // Simple view increment when user clicks on a blog post
  const handlePostClick = async (postId: string | undefined) => {
    if (!postId) return;
    try {
      await blogDatabase.incrementViews(postId);
      
      // Update local state to reflect the change
      setBlogPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, views: (post.views || 0) + 1 }
            : post
        )
      );
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  // Fetch blog posts from database
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setIsLoading(true);
        const posts = await blogDatabase.getPublishedBlogPosts(20);
        setBlogPosts(posts || []);
        setHasMorePosts((posts?.length || 0) >= 20);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
        setBlogPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  // Check user likes after posts are loaded and user is signed in
  useEffect(() => {
    if (blogPosts.length > 0 && isSignedIn && isLoaded) {
      checkUserLikes();
    }
  }, [blogPosts, isSignedIn, isLoaded]);

  // Load more posts function
  const loadMorePosts = async () => {
    if (isLoadingMore || !hasMorePosts) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      const offset = (nextPage - 1) * 20;
      
      const morePosts = await blogDatabase.getPublishedBlogPosts(20, offset);
      
      if (morePosts && morePosts.length > 0) {
        setBlogPosts(prev => [...prev, ...morePosts]);
        setCurrentPage(nextPage);
        setHasMorePosts(morePosts.length >= 20);
      } else {
        setHasMorePosts(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Stories' },
    { id: 'technology', name: 'Technology' },
    { id: 'design', name: 'Design' },
    { id: 'business', name: 'Business' },
    { id: 'lifestyle', name: 'Lifestyle' },
    { id: 'science', name: 'Science' }
  ];

  // Filter and search posts
  const filteredPosts = blogPosts
    .filter(post => selectedCategory === 'all' || post.category?.toLowerCase() === selectedCategory)
    .filter(post => 
      searchQuery === '' || 
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.users?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSearch(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-12">
              <Link href="/" className="text-3xl font-light tracking-tight">
                StoryFlow
              </Link>
              <nav className="hidden md:flex items-center space-x-8">
                <Link href="/" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
                  Home
                </Link>
                <Link href="/trending" className="text-white/60 hover:text-white transition-colors text-sm font-medium">
                  Trending
                </Link>
                {isSignedIn && (
                  <>
                    <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors text-sm font-medium">
                      Dashboard
                    </Link>
                    <Link href="/write" className="text-white/60 hover:text-white transition-colors text-sm font-medium">
                      Write
                    </Link>
                  </>
                )}
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative">
                <form onSubmit={handleSearch} className="hidden md:flex items-center bg-white/5 rounded-full px-4 py-2 border border-white/10">
                  <input 
                    type="text" 
                    placeholder="Search stories..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent text-white placeholder-white/40 outline-none text-sm w-48"
                  />
                  <button type="submit" className="ml-2 text-white/40 hover:text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </form>
                
                {/* Mobile Search Toggle */}
                <button 
                  onClick={() => setShowSearch(!showSearch)}
                  className="md:hidden text-white/60 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>

              {isLoaded ? (
                <>
                  {isSignedIn ? (
                    <UserButton />
                  ) : (
                    <SignInButton mode="modal">
                      <button className="px-6 py-2.5 bg-white text-black rounded-full hover:bg-white/90 transition-all duration-300 font-medium text-sm">
                        Sign In
                      </button>
                    </SignInButton>
                  )}
                </>
              ) : (
                <SignInButton mode="modal">
                  <button className="px-4 py-2 bg-white text-black rounded-full hover:bg-white/90 transition-all text-sm">
                    Sign In
                  </button>
                </SignInButton>
              )}
            </div>
          </div>

          {/* Mobile Search */}
          {showSearch && (
            <div className="md:hidden mt-4">
              <form onSubmit={handleSearch} className="flex items-center bg-white/5 rounded-full px-4 py-2 border border-white/10">
                <input 
                  type="text" 
                  placeholder="Search stories..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-white placeholder-white/40 outline-none text-sm flex-1"
                />
                <button type="submit" className="ml-2 text-white/40 hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-light tracking-tight text-white mb-6">
            {isSignedIn ? `Welcome back, ${user.firstName || user.username || 'Storyteller'}` : 'Discover Stories'}
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto mb-8 leading-relaxed">
            {isSignedIn 
              ? 'Your personalized feed of stories awaits. Create, share, and explore.'
              : 'Join the community of storytellers. Share your narrative with AI-powered design.'
            }
          </p>
          
          {isSignedIn && (
            <Link
              href="/write"
              className="inline-flex items-center px-8 py-4 text-white bg-white/10 rounded-full hover:bg-white/20 transition-all duration-300 border border-white/20 text-sm font-medium"
            >
              Write Story
            </Link>
          )}
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex items-center space-x-1 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-white text-black'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-white/80 text-sm">
              Search results for &quot;{searchQuery}&quot; • {filteredPosts.length} stories found
            </p>
            <button 
              onClick={() => setSearchQuery('')}
              className="text-white/40 hover:text-white text-sm mt-2"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Stories Feed - Vertical Social Media Style */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white mb-4"></div>
              <p className="text-white/60">Loading stories...</p>
            </div>
          ) : filteredPosts.length > 0 ? (
            <>
              {filteredPosts.map((post) => (
                <article key={post.id} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden group">
                  {/* Story Header */}
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {post?.users?.profile_image_url ? (
                          <img 
                            src={post.users.profile_image_url} 
                            alt={post.users.username || 'Author'}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {post?.users?.username?.[0]?.toUpperCase() || 'A'}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium text-sm">
                            {post?.users?.username || 'Anonymous'}
                          </p>
                          <p className="text-white/40 text-xs">
                            {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Recently'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-white/40 text-xs">{post.read_time && post.read_time > 0 ? post.read_time : 5} min read</span>
                      </div>
                    </div>

                    {/* Story Title & Subtitle */}
                    <Link href={`/blog/${post.slug || post.id}`} onClick={() => handlePostClick(post.id)}>
                      <h2 className="text-xl font-medium text-white mb-3 group-hover:text-white/80 transition-colors leading-tight">
                        {post.title}
                      </h2>
                      <p className="text-white/70 text-sm leading-relaxed" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {post.subtitle}
                      </p>
                    </Link>
                  </div>

                  {/* Story Image */}
                  {post.featured_image_url && (
                    <Link href={`/blog/${post.slug || post.id}`} onClick={() => handlePostClick(post.id)}>
                      <div className="relative aspect-[16/9] overflow-hidden cursor-pointer">
                        <Image
                          src={post.featured_image_url}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                    </Link>
                  )}

                  {/* Professional Social Actions Wrapper */}
                  <div className="p-6">
                    <SocialActionsWrapper
                      postId={post.id!}
                      likes={post.likes || 0}
                      views={post.views || 0}
                      category={post.category}
                      slug={post.slug}
                      isLiked={likedPosts.has(post.id!)}
                      onLikeChange={(liked) => {
                        setLikedPosts(prev => {
                          const newSet = new Set(prev);
                          if (liked) {
                            newSet.add(post.id!);
                          } else {
                            newSet.delete(post.id!);
                          }
                          return newSet;
                        });
                      }}
                    />
                  </div>

                  {/* Comments Preview */}
                  <div className="px-6 pb-6">
                    <CommentsPreview blogPostId={post.id!} />
                  </div>
                </article>
              ))}

              {/* Load More Button */}
              {hasMorePosts && (
                <div className="text-center pt-8">
                  <button 
                    onClick={loadMorePosts}
                    disabled={isLoadingMore}
                    className="px-8 py-4 text-white bg-white/10 rounded-full hover:bg-white/20 transition-all duration-300 border border-white/20 text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingMore ? 'Loading...' : 'Load More Stories'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-2xl font-light text-white mb-4">
                {searchQuery ? 'No search results found' : 'No stories found'}
              </h3>
              <p className="text-white/60 mb-8">
                {searchQuery 
                  ? `No stories match "${searchQuery}". Try different keywords or browse all stories.`
                  : 'No stories match your current filter. Try a different category or be the first to create one.'
                }
              </p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-white/60 hover:text-white text-sm mb-4 block"
                >
                  Clear search
                </button>
              )}
              {isSignedIn && (
                <Link
                  href="/write"
                  className="inline-flex items-center px-8 py-4 text-white bg-white/10 rounded-full hover:bg-white/20 transition-all border border-white/20 text-sm font-medium"
                >
                  Write Your First Story
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}