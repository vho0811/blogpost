'use client';

import { useState, useEffect } from 'react';
import { readingProgressManager, type ReadingProgress } from '@/lib/reading-progress';

interface ReadingProgressBarProps {
  blogId?: string;
  showStats?: boolean;
}

export default function ReadingProgressBar({ blogId, showStats = false }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);


  useEffect(() => {
    // Load stored progress if blogId is provided
    if (blogId) {
      const stored = readingProgressManager.getProgress(blogId);
      if (stored) {
        setProgress(stored.progress);
      }
    }
  }, [blogId]);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // Prevent division by zero and handle edge cases
      if (docHeight <= 0) {
        setProgress(0);
        return;
      }
      
      const scrollPercent = (scrollTop / docHeight) * 100;
      const newProgress = Math.min(Math.max(scrollPercent, 0), 100);
      
      // Only update if it's a valid number
      if (!isNaN(newProgress) && isFinite(newProgress)) {
        setProgress(newProgress);
        
        // Save progress if blogId is provided
        if (blogId) {
          readingProgressManager.updateProgress(blogId, newProgress);
        }
      }
    };

    window.addEventListener('scroll', updateProgress);
    updateProgress(); // Initial calculation

    return () => window.removeEventListener('scroll', updateProgress);
  }, [blogId]);

  // If no blogId, show overall reading stats
  if (!blogId && showStats) {
    const stats = readingProgressManager.getReadingStats();
    
    return (
      <div 
        className="fixed top-4 left-4 z-[99999] bg-gray-900/90 backdrop-blur-md rounded-lg p-3 border border-gray-700/50 shadow-xl"
        style={{ 
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 99999,
          backgroundColor: 'rgba(17, 24, 39, 0.9)',
          backdropFilter: 'blur(12px)',
          borderRadius: '8px',
          padding: '12px',
          border: '1px solid rgba(55, 65, 81, 0.5)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          minWidth: '180px'
        }}
      >
        <div className="text-white text-sm font-medium mb-2">Reading Stats</div>
        <div className="space-y-1 text-xs text-gray-300">
          <div>Posts Read: {stats.completedPosts}/{stats.totalPosts}</div>
          <div>Avg Progress: {stats.averageProgress}%</div>
          <div>Total Time: {stats.totalReadingTime} min</div>
        </div>
      </div>
    );
  }

  // For individual blog posts, show a thin progress bar at the top
  return (
    <div 
      className="fixed top-0 left-0 w-full h-2 z-[99999] bg-gray-800/30"
      style={{ 
        position: 'fixed',
        top: '0px',
        left: '0px',
        width: '100%',
        height: '12px',
        backgroundColor: 'rgba(31, 41, 55, 0.4)',
        zIndex: 99999,
        pointerEvents: 'none'
      }}
    >
      <div 
        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-150 ease-out"
        style={{ 
          width: `${isNaN(progress) || !isFinite(progress) ? 0 : progress}%`,
          height: '100%',
          background: 'linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)',
          transition: 'width 150ms ease-out',
          boxShadow: '0 0 12px rgba(59, 130, 246, 0.6)'
        }}
      />
    </div>
  );
} 