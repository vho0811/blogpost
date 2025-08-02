'use client';

import { useState } from 'react';

interface EnhancedBlogPost {
  title: string;
  subtitle: string;
  content: string;
  designSuggestions: string[];
  interactiveElements: string[];
  seoOptimizations: string[];
  visualEnhancements: string[];
}

export default function AITextEnhancer() {
  const [plainText, setPlainText] = useState('');
  const [category, setCategory] = useState('Technology');
  const [isLoading, setIsLoading] = useState(false);
  const [enhancedPost, setEnhancedPost] = useState<EnhancedBlogPost | null>(null);
  const [error, setError] = useState('');

  const categories = [
    'Technology', 'Lifestyle', 'Business', 'Design', 'Food', 
    'Work', 'Education', 'Health', 'Travel', 'Entertainment'
  ];

  const handleEnhance = async () => {
    if (!plainText.trim()) {
      setError('Please enter some text to enhance');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/enhance-blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plainText: plainText.trim(),
          category
        }),
      });

      const result = await response.json();

      if (result.success) {
        setEnhancedPost(result.data);
      } else {
        setError(result.error || 'Failed to enhance content');
      }
    } catch (err) {
      setError('Failed to connect to AI service');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-6">
          AI Text Enhancer
        </h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          Transform your plain blog text into stunning, engaging content with AI-powered enhancements
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">Input Your Text</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Plain Text Content</label>
                <textarea
                  value={plainText}
                  onChange={(e) => setPlainText(e.target.value)}
                  placeholder="Paste your plain blog text here..."
                  className="w-full h-64 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <button
                onClick={handleEnhance}
                disabled={isLoading || !plainText.trim()}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:from-blue-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Enhancing with AI...</span>
                  </div>
                ) : (
                  'Enhance with AI'
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-6">
          {enhancedPost && (
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4">Enhanced Content</h2>
              
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-white font-medium mb-2">Enhanced Title</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={enhancedPost.title}
                      readOnly
                      className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                    />
                    <button
                      onClick={() => copyToClipboard(enhancedPost.title)}
                      className="px-4 py-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-500/30 transition-all duration-200"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-white font-medium mb-2">Enhanced Subtitle</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={enhancedPost.subtitle}
                      readOnly
                      className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                    />
                    <button
                      onClick={() => copyToClipboard(enhancedPost.subtitle)}
                      className="px-4 py-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-500/30 transition-all duration-200"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Enhanced Content */}
                <div>
                  <label className="block text-white font-medium mb-2">Enhanced Content (HTML)</label>
                  <div className="flex items-center space-x-2 mb-2">
                    <button
                      onClick={() => copyToClipboard(enhancedPost.content)}
                      className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 hover:bg-green-500/30 transition-all duration-200"
                    >
                      Copy HTML
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <pre className="text-sm text-gray-300 bg-black/50 p-4 rounded-xl border border-white/10">
                      {enhancedPost.content}
                    </pre>
                  </div>
                </div>

                {/* Design Suggestions */}
                <div>
                  <label className="block text-white font-medium mb-2">Design Suggestions</label>
                  <div className="space-y-2">
                    {enhancedPost.designSuggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-300 text-sm">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interactive Elements */}
                <div>
                  <label className="block text-white font-medium mb-2">Interactive Elements</label>
                  <div className="space-y-2">
                    {enhancedPost.interactiveElements.map((element, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-gray-300 text-sm">{element}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SEO Optimizations */}
                <div>
                  <label className="block text-white font-medium mb-2">SEO Optimizations</label>
                  <div className="space-y-2">
                    {enhancedPost.seoOptimizations.map((optimization, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-gray-300 text-sm">{optimization}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!enhancedPost && (
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <div className="text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p>Enhanced content will appear here after processing</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 