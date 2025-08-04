'use client';

import { useState } from 'react';
import { fontOptions, getFontFamily, getFontWeight, getLetterSpacing } from './CustomFontStyle';

interface BlogFontSelectorProps {
  onFontChange?: (font: string) => void;
  selectedFont?: string;
  className?: string;
}

export default function BlogFontSelector({ 
  onFontChange, 
  selectedFont = 'Inter',
  className = '' 
}: BlogFontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFontSelect = (fontValue: string) => {
    onFontChange?.(fontValue);
    setIsOpen(false);
  };

  const selectedFontOption = fontOptions.find(font => font.value === selectedFont);

  return (
    <div className={`relative ${className}`}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <label style={{
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#e5e7eb',
          minWidth: '80px'
        }}>
          Font:
        </label>
        
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.375rem',
              color: '#e5e7eb',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '150px',
              justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <span style={{ 
              fontFamily: getFontFamily(selectedFont),
              fontWeight: getFontWeight(selectedFont),
              letterSpacing: getLetterSpacing(selectedFont)
            }}>
              {selectedFontOption?.preview || 'Inter'}
            </span>
            <svg 
              style={{ 
                width: '0.75rem', 
                height: '0.75rem',
                transition: 'transform 0.2s ease',
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
              }} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                zIndex: 1000,
                background: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                maxHeight: '300px',
                overflowY: 'auto',
                marginTop: '0.25rem'
              }}
            >
              {fontOptions.map((font) => (
                <button
                  key={font.value}
                  onClick={() => handleFontSelect(font.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: selectedFont === font.value ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    border: 'none',
                    color: selectedFont === font.value ? '#ffffff' : '#e5e7eb',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedFont !== font.value) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedFont !== font.value) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ 
                      fontFamily: getFontFamily(font.value),
                      fontWeight: getFontWeight(font.value),
                      letterSpacing: getLetterSpacing(font.value),
                      fontSize: '0.875rem'
                    }}>
                      {font.preview}
                    </span>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: '#9ca3af',
                      marginTop: '0.25rem'
                    }}>
                      {font.desc}
                    </span>
                  </div>
                  {selectedFont === font.value && (
                    <svg style={{ width: '0.75rem', height: '0.75rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Font preview */}
      <div style={{
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '0.5rem',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        marginTop: '0.5rem'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#ffffff',
          marginBottom: '0.5rem',
          fontFamily: getFontFamily(selectedFont),
          fontWeight: getFontWeight(selectedFont),
          letterSpacing: getLetterSpacing(selectedFont)
        }}>
          Sample Heading
        </h3>
        <p style={{
          fontSize: '1rem',
          lineHeight: '1.6',
          color: '#e5e7eb',
          margin: '0',
          fontFamily: getFontFamily(selectedFont),
          fontWeight: getFontWeight(selectedFont),
          letterSpacing: getLetterSpacing(selectedFont)
        }}>
          This is how your blog content will look with the selected font. The typography has been optimized for readability and modern aesthetics.
        </p>
      </div>
    </div>
  );
} 