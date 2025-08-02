'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface SimpleAIDesignButtonProps {
  blogId: string;
}

interface AIDesignSettings {
  style: 'modern' | 'dark' | 'warm' | 'vibrant' | 'professional' | 'creative';
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

export default function SimpleAIDesignButton({ blogId }: SimpleAIDesignButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [settings, setSettings] = useState<AIDesignSettings>({
    style: 'modern',
    customPrompt: '',
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
    const selectedStyle = styleOptions.find(s => s.value === settings.style);
    const basePrompt = selectedStyle?.prompt || '';
    
    let finalPrompt = basePrompt;
    
    if (settings.customPrompt) {
      finalPrompt += `\n\nAdditional requirements: ${settings.customPrompt}`;
    }

    handleAIDesign(finalPrompt);
  };

  const handleStyleSelect = (style: AIDesignSettings['style']) => {
    setSettings({ ...settings, style });
  };

  if (!mounted) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={isGenerating}
        className="group bg-gray-900/95 backdrop-blur-md text-white px-10 py-5 rounded-2xl font-semibold hover:bg-gray-800/95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-5 shadow-2xl border border-gray-700/30 hover:border-gray-600/50 hover:shadow-gray-900/25 hover:scale-105"
        style={{ 
          all: 'unset', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1.25rem', 
          backgroundColor: 'rgba(17, 24, 39, 0.95)', 
          backdropFilter: 'blur(12px)', 
          color: 'white', 
          padding: '1.25rem 2.5rem', 
          borderRadius: '1rem', 
          fontWeight: '600', 
          transition: 'all 0.3s ease', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
          border: '1px solid rgba(55, 65, 81, 0.3)', 
          textDecoration: 'none', 
          fontSize: '1.125rem', 
          letterSpacing: '0.025em', 
          lineHeight: '1.25', 
          cursor: 'pointer', 
          zIndex: 9999 
        }}
      >
        {isGenerating ? (
          <>
            <svg className="w-7 h-7 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg tracking-wide">Designing...</span>
          </>
        ) : (
          <>
            <svg className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-lg tracking-wide">AI Design</span>
          </>
        )}
      </button>

      {/* Professional Modal */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-8 py-8">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">AI Design Generator</h1>
                    <p className="text-slate-300 text-lg leading-relaxed">Transform your blog with intelligent design. Choose a style and let AI create a beautiful, professional layout.</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors p-3 rounded-2xl hover:bg-white/10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(85vh-200px)] space-y-10">
              {/* Style Selection */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">Design Style</h2>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {styleOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStyleSelect(option.value as AIDesignSettings['style'])}
                      className={`group p-6 border-2 rounded-2xl text-left transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                        settings.style === option.value
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-100'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-3xl">{option.icon}</div>
                        {settings.style === option.value && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {option.label}
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-sm">
                        {option.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">Custom Instructions</h2>
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="custom-prompt" className="text-base font-semibold text-gray-700">
                    Additional design requirements (optional)
                  </Label>
                  <Textarea
                    id="custom-prompt"
                    value={settings.customPrompt}
                    onChange={(e) => setSettings({ ...settings, customPrompt: e.target.value })}
                    placeholder="Describe any specific design requests, color preferences, or special requirements..."
                    className="min-h-[120px] text-base leading-relaxed"
                    rows={5}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Be specific about colors, layouts, or any special features you'd like to see in your design.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-3 h-auto text-base font-medium"
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-8 py-3 h-auto text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isGenerating ? (
                    <>
                      <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating Design...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Design
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}