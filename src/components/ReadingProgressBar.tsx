'use client';

import { useState, useEffect } from 'react';

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setProgress(Math.min(scrollPercent, 100));
    };

    window.addEventListener('scroll', updateProgress);
    updateProgress(); // Initial calculation

    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div 
      style={{ 
        position: 'fixed',
        top: '0px',
        left: '0px',
        width: '100%',
        height: '4px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        zIndex: 999999,
        pointerEvents: 'none',
        backdropFilter: 'blur(2px)'
      }}
    >
      <div 
        style={{ 
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)',
          transition: 'width 100ms ease-out',
          boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)'
        }}
      />
    </div>
  );
} 