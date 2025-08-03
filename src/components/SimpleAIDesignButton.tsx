'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from '@clerk/nextjs';
import { Textarea } from '@/components/ui/textarea';

interface SimpleAIDesignButtonProps {
  blogId: string;
  blogPost?: {
    user_id?: string;
    content?: string;
  } | null;
}

interface AIDesignSettings {
  style: 'modern' | 'dark' | 'warm' | 'vibrant' | 'professional' | 'creative' | 'custom';
  customPrompt: string;
}

const styleOptions = [
  { 
    value: 'modern', 
    label: 'Modern Minimal', 
    desc: 'Clean lines, bold typography',
    icon: '✨',
    prompt: 'Create a clean, minimalist design with lots of white space, subtle shadows, and modern typography. Use a monochromatic color scheme with one accent color. CRITICAL: Ensure high contrast between text and background - if background is dark, text must be light/white. If background is light, text must be dark. Never use similar colors for text and background.' 
  },
  { 
    value: 'dark', 
    label: 'Dark Tech', 
    desc: 'Neon accents, cyberpunk aesthetic',
    icon: '⚡',
    prompt: 'Design a futuristic dark theme with neon accents, glowing effects, and a cyberpunk aesthetic. Use dark backgrounds with bright cyan, purple, and green highlights. CRITICAL: Dark backgrounds require bright/white text for readability. Neon accents should be bright enough to stand out against dark backgrounds.' 
  },
  { 
    value: 'warm', 
    label: 'Warm & Cozy', 
    desc: 'Earth tones, homey feel',
    icon: '🍄',
    prompt: 'Create a warm, inviting design with earth tones, soft gradients, and cozy typography. Use warm browns, oranges, and cream colors with a homey feel. CRITICAL: Ensure text color contrasts strongly with background - dark text on light warm backgrounds, or light text on dark warm backgrounds.' 
  },
  { 
    value: 'vibrant', 
    label: 'Bold & Vibrant', 
    desc: 'Bright colors, dynamic elements',
    icon: '🌈',
    prompt: 'Design a bold, energetic layout with bright colors, strong contrasts, and dynamic elements. Use vibrant gradients and eye-catching typography. CRITICAL: Maintain readability by using high contrast - bright backgrounds need dark text, dark backgrounds need bright text. Never compromise readability for aesthetics.' 
  },
  { 
    value: 'professional', 
    label: 'Professional', 
    desc: 'Corporate-grade, builds trust',
    icon: '💼',
    prompt: 'Create a clean, professional design suitable for business content. Use a conservative color palette, structured layout, and readable typography. CRITICAL: Professional designs require excellent contrast - use dark text on light backgrounds or light text on dark backgrounds. Ensure all text is easily readable.' 
  },
  { 
    value: 'creative', 
    label: 'Creative Artsy', 
    desc: 'Bold, breaks conventions',
    icon: '🎨',
    prompt: 'Design an artistic, creative layout with hand-drawn elements, organic shapes, and artistic typography. Use a mix of colors and textures. CRITICAL: Despite creative elements, maintain perfect readability with strong contrast between text and background colors. Text must always be clearly visible.' 
  }
];

export default function SimpleAIDesignButton({ blogId, blogPost }: SimpleAIDesignButtonProps) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [settings, setSettings] = useState<AIDesignSettings>({
    style: 'modern',
    customPrompt: '', // Start with empty prompt - user must type or select
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAIDesign = async (themePrompt: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blogPostId: blogId,
          themePrompt: themePrompt
        }),
      });

      if (response.ok) {
        window.dispatchEvent(new CustomEvent('aiDesignApplied'));
        setIsOpen(false);
        // Auto reload the page to show the new design
        window.location.reload();
      } else {
        console.error('AI design failed');
      }
    } catch (error) {
      console.error('Error applying AI design:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => {
    // ONLY use the custom prompt text, ignore style selection completely
    const finalPrompt = settings.customPrompt || 'Create a clean, modern design with good typography and spacing.';
    
    handleAIDesign(finalPrompt);
  };

  const handleStyleSelect = (style: AIDesignSettings['style']) => {
    const selectedOption = styleOptions.find(option => option.value === style);
    const autoPrompt = selectedOption?.prompt || '';
    
    setSettings({ 
      ...settings, 
      style, 
      customPrompt: autoPrompt 
    });
  };

  const handleCustomPromptChange = (text: string) => {
    // When user types, completely ignore the selected style
    setSettings({
      ...settings,
      customPrompt: text,
      style: 'custom' // Mark as custom to ignore style selection
    });
  };

  // Check if current user is the owner of the blog post
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const getSupabaseUserId = async () => {
      if (user) {
        try {
          const response = await fetch('/api/get-supabase-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clerkUserId: user.id })
          });
          const { data: supabaseUser } = await response.json();
          
          if (supabaseUser?.id) {
            setSupabaseUserId(supabaseUser.id);
          }
        } catch (error) {
          console.error('Error getting Supabase user ID:', error);
        }
      }
    };
    
    getSupabaseUserId();
  }, [user]);
  
  const isOwner = supabaseUserId && blogPost && blogPost.user_id && supabaseUserId === blogPost.user_id;
  
  // FORCE SHOW BUTTON - FUCK THE MOUNTED CHECK
  // if (!mounted) return null;
  
  // DEBUG: Show button for everyone temporarily to test positioning
  // TODO: Restore owner-only access later
  // if (!isOwner) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={isGenerating}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          color: 'white',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.75rem',
          fontWeight: '600',
          transition: 'all 0.3s ease',
          boxShadow: '0 15px 35px -8px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(75, 85, 99, 0.6)',
          fontSize: '0.95rem',
          letterSpacing: '0.025em',
          lineHeight: '1.25',
          cursor: 'pointer',
          opacity: isGenerating ? '0.5' : '1',
          margin: '0',
          outline: 'none',
          fontFamily: 'inherit'
        }}
      >
        {isGenerating ? (
          <>
            <div style={{
              width: '1.5rem',
              height: '1.5rem',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span>Designing...</span>
          </>
        ) : (
          <>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>AI Design</span>
          </>
        )}
      </button>

      {/* Professional Dark Modal - Vertical Layout */}
      {isOpen && createPortal(
        <div style={{
          position: 'fixed',
          inset: '0',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          overflowY: 'auto'
        }}>
          <div 
            style={{
              position: 'fixed',
              inset: '0',
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)'
            }}
            onClick={() => setIsOpen(false)}
          />
          
          <div 
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #0f1419 100%)',
              borderRadius: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              width: '100%',
              maxWidth: '72rem',
              maxHeight: '85vh',
              overflowY: 'auto',
              border: '1px solid rgba(75, 85, 99, 0.6)'
            }}
          >
            
            {/* Close Button */}
            <div style={{
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              zIndex: 10
            }}>
                <button
                  onClick={() => setIsOpen(false)}
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.3)';
                  e.currentTarget.style.color = '#f87171';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

            {/* Content Body - Horizontal Layout */}
            <div 
              style={{
                display: 'flex',
                height: '100%',
                minHeight: '600px'
              }}
            >
              {/* Left Side - Design Styles */}
              <div 
                style={{
                  flex: '2',
                  padding: '3rem 2rem 3rem 3rem',
                  borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'linear-gradient(180deg, rgba(15, 20, 25, 0.5) 0%, rgba(26, 31, 46, 0.3) 100%)'
                }}
              >
                <div 
                  style={{
                    marginBottom: '2.5rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingBottom: '1.5rem'
                  }}
                >
                  <h2 
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #60a5fa 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      marginBottom: '0.5rem',
                      margin: '0 0 0.5rem 0',
                      padding: '0'
                    }}
                  >
                    Quick Templates
                  </h2>
                  <p style={{ 
                    color: '#64748b', 
                    fontSize: '0.875rem',
                    margin: '0',
                    padding: '0'
                  }}>
                    Click any style to paste a template into the input above
                  </p>
            </div>

                <div 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1.5rem',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    paddingRight: '1rem'
                  }}
                >
                  {styleOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStyleSelect(option.value as AIDesignSettings['style'])}
                      style={{
                        padding: '1.5rem',
                        borderRadius: '16px',
                        textAlign: 'left',
                        background: settings.style === option.value 
                          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: settings.style === option.value 
                          ? '2px solid rgba(59, 130, 246, 0.5)'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        margin: '0',
                        outline: 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (settings.style !== option.value) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (settings.style !== option.value) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        }
                      }}
                    >
                      {settings.style === option.value && (
                        <div 
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '2px',
                            backgroundImage: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 2s infinite'
                          }}
                        />
                      )}
                      
                      <div 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '1rem',
                          margin: '0 0 1rem 0',
                          padding: '0'
                        }}
                      >
                        <div style={{ fontSize: '1.5rem', margin: '0', padding: '0' }}>{option.icon}</div>
                        {settings.style === option.value && (
                          <div 
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                              margin: '0',
                              padding: '0'
                            }}
                          >
                            <svg style={{ width: '12px', height: '12px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <h3 
                        style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: settings.style === option.value ? '#ffffff' : '#e2e8f0',
                          marginBottom: '0.5rem',
                          margin: '0 0 0.5rem 0',
                          padding: '0'
                        }}
                      >
                        {option.label}
                      </h3>
                      <p 
                        style={{
                          color: '#64748b',
                          fontSize: '0.8rem',
                          lineHeight: '1.4',
                          margin: '0',
                          padding: '0'
                        }}
                      >
                        {option.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Side - Custom Instructions */}
              <div 
                style={{
                  flex: '1',
                  padding: '3rem',
                  background: 'linear-gradient(180deg, rgba(26, 31, 46, 0.3) 0%, rgba(15, 20, 25, 0.5) 100%)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div 
                  style={{
                    marginBottom: '2.5rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingBottom: '1.5rem'
                  }}
                >
                  <h2 
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #ffffff 0%, #10b981 50%, #06b6d4 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      marginBottom: '0.5rem',
                      margin: '0 0 0.5rem 0',
                      padding: '0'
                    }}
                  >
                    Design Instructions
                  </h2>
                  <p style={{ 
                    color: '#64748b', 
                    fontSize: '0.875rem',
                    margin: '0',
                    padding: '0'
                  }}>
                    Type your design vision here. The AI will create exactly what you describe!
                  </p>
                </div>

                <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                  <Textarea
                    id="custom-prompt"
                    value={settings.customPrompt}
                    onChange={(e) => handleCustomPromptChange(e.target.value)}
                    placeholder="Describe your design vision... Examples: 'Dark theme with neon blue accents', 'Minimal white design with large typography', 'Vintage retro style with warm colors'"
                    rows={12}
                    style={{
                      flex: '1',
                      fontSize: '0.95rem',
                      lineHeight: '1.6',
                      padding: '1.5rem',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      color: '#e2e8f0',
                      backdropFilter: 'blur(10px)',
                      outline: 'none',
                      resize: 'none',
                      transition: 'all 0.3s ease',
                      margin: '0',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <p 
                    style={{
                      fontSize: '0.8rem',
                      color: '#64748b',
                      marginTop: '1rem',
                      fontStyle: 'italic',
                      margin: '1rem 0 0 0',
                      padding: '0'
                    }}
                  >
                    💡 The AI will handle any text intelligently. Be creative or use the style buttons below for quick templates!
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div 
              style={{
                padding: '2rem 3rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'linear-gradient(180deg, rgba(15, 20, 25, 0.8) 0%, rgba(10, 15, 20, 0.9) 100%)',
                backdropFilter: 'blur(20px)'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                alignItems: 'center', 
                gap: '1.5rem',
                margin: '0',
                padding: '0'
              }}>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: '12px 32px',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    color: '#94a3b8',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    margin: '0',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.color = '#e2e8f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !settings.customPrompt.trim()}
                  style={{
                    padding: '12px 36px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: 'white',
                    backgroundImage: (isGenerating || !settings.customPrompt.trim())
                      ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
                      : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
                    backgroundSize: '200% 100%',
                    backgroundPosition: '0% 0',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: (isGenerating || !settings.customPrompt.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (isGenerating || !settings.customPrompt.trim()) ? 0.7 : 1,
                    boxShadow: (isGenerating || !settings.customPrompt.trim())
                      ? 'none' 
                      : '0 8px 32px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    margin: '0',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isGenerating && settings.customPrompt.trim()) {
                      e.currentTarget.style.backgroundPosition = '100% 0';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isGenerating && settings.customPrompt.trim()) {
                      e.currentTarget.style.backgroundPosition = '0% 0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)';
                    }
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    margin: '0',
                    padding: '0'
                  }}>
                  {isGenerating ? (
                    <>
                        <div 
                          style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            borderTop: '2px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}
                        />
                        Generating Design...
                      </>
                    ) : !settings.customPrompt.trim() ? (
                      <>
                        <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                        Select a Style First
                    </>
                  ) : (
                    <>
                        <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                        Generate Design
                    </>
                  )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}