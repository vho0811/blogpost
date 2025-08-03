'use client';

import { useMemo, useEffect, useCallback } from 'react';
import { PartialBlock } from '@blocknote/core';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { blogDatabase } from '@/lib/blog-database';
import { useUser } from '@clerk/nextjs';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

interface BlockNoteEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
}

export default function BlockNoteEditor({
  initialContent = '',
  onChange
}: BlockNoteEditorProps) {
  const { user } = useUser();

  // Convert HTML to BlockNote blocks on initial load
  const initialBlocks = useMemo(() => {
    if (initialContent && initialContent.trim()) {
      try {
        // Check if content is already in JSON format (BlockNote blocks)
        if (initialContent.startsWith('[') && initialContent.endsWith(']')) {
          try {
            const parsed = JSON.parse(initialContent);
            if (Array.isArray(parsed)) {
              return parsed;
            }
          } catch {
            // Fall through to other parsing methods
          }
        }

        // For HTML content, we'll handle it after the editor is created
        if (initialContent.includes('<') && initialContent.includes('>')) {
          // Return empty blocks for now, we'll load HTML content after editor creation
          return [{ type: 'paragraph' as const, content: '' }];
        }

        // Fallback: Process as plain text
        const cleanText = initialContent
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n')
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"');

        const paragraphs = cleanText
          .split('\n')
          .map(p => p.trim())
          .filter(p => p.length > 0);
        
        const blocks: PartialBlock[] = paragraphs.map(text => ({
          type: 'paragraph' as const,
          content: text,
        }));
        
        return blocks.length > 0 ? blocks : [{ type: 'paragraph' as const, content: '' }];
      } catch {
        return [{ type: 'paragraph' as const, content: '' }];
      }
    }
    return [{ type: 'paragraph' as const, content: '' }];
  }, [initialContent]);

  // Custom upload function for images
  const uploadFile = async (file: File) => {
    try {
      if (user) {
        const uploadedMedia = await blogDatabase.uploadMedia(file, `Uploaded image: ${file.name}`, user.id);
        if (uploadedMedia) {
          return uploadedMedia.file_url;
        }
      }
      throw new Error('Upload failed');
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  // Create the editor instance with full formatting features
  const editor = useCreateBlockNote({
    initialContent: initialBlocks,
    uploadFile,
    // Enable all default features for proper functionality
    trailingBlock: true,
    animations: true,
  });

  // Handle HTML content loading after editor creation
  useEffect(() => {
    if (initialContent && initialContent.includes('<') && initialContent.includes('>')) {
      const loadHTMLContent = async () => {
        try {
          const blocks = await editor.tryParseHTMLToBlocks(initialContent);
          editor.replaceBlocks(editor.document, blocks);
        } catch {
          // Silently handle parsing errors
        }
      };
      loadHTMLContent();
    }
  }, [editor, initialContent]);

  // Debounced content change handler to avoid excessive calls
  const debouncedOnChange = useCallback(
    async () => {
      try {
        // Convert blocks to HTML using BlockNote's official method
        const htmlContent = await editor.blocksToHTMLLossy(editor.document);
        onChange?.(htmlContent);
      } catch {
        // Silently handle conversion errors
      }
    },
    [editor, onChange]
  );

  // Handle content changes with debouncing
  const handleChange = useCallback(() => {
    // Clear any existing timeout
    if ((window as typeof window & { blockNoteChangeTimeout?: NodeJS.Timeout }).blockNoteChangeTimeout) {
      clearTimeout((window as typeof window & { blockNoteChangeTimeout?: NodeJS.Timeout }).blockNoteChangeTimeout);
    }
    
    // Set a new timeout to debounce the change - INCREASED to prevent scroll jumping
    (window as typeof window & { blockNoteChangeTimeout?: NodeJS.Timeout }).blockNoteChangeTimeout = setTimeout(() => {
      debouncedOnChange();
    }, 1000); // Increased from 500ms to 1000ms to prevent frequent re-renders
  }, [debouncedOnChange]);

  return (
    <div className="min-h-[400px] bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div className="p-4">
        <BlockNoteView
          editor={editor}
          onChange={handleChange}
          theme="dark"
          className="blocknote-editor"
          formattingToolbar={true}
          linkToolbar={true}
          sideMenu={true}
          slashMenu={true}
        />
      </div>
      
      <style jsx global>{`
        .blocknote-editor {
          background: transparent !important;
        }
        
        .bn-container {
          background: transparent !important;
        }
        
        .bn-editor {
          background: transparent !important;
        }
        
        .ProseMirror {
          background: transparent !important;
          padding: 1rem !important;
          min-height: 300px !important;
        }
        
        .ProseMirror p {
          margin: 0.5rem 0 !important;
        }
        
        .ProseMirror h1,
        .ProseMirror h2,
        .ProseMirror h3,
        .ProseMirror h4,
        .ProseMirror h5,
        .ProseMirror h6 {
          font-weight: bold !important;
        }
        
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem !important;
        }
        
        .ProseMirror blockquote {
          border-left: 4px solid #6366f1 !important;
          padding-left: 1rem !important;
          margin: 1rem 0 !important;
          color: #d1d5db !important;
          font-style: italic !important;
        }
        
        .ProseMirror code {
          background: #374151 !important;
          color: #f3f4f6 !important;
          padding: 0.25rem 0.5rem !important;
          border-radius: 0.25rem !important;
          font-family: 'JetBrains Mono', 'Monaco', 'Consolas', monospace !important;
        }
        
        .ProseMirror pre {
          background: #1f2937 !important;
          color: #f3f4f6 !important;
          padding: 1rem !important;
          border-radius: 0.5rem !important;
          overflow-x: auto !important;
          margin: 1rem 0 !important;
        }
        
        .bn-side-menu {
          background: #374151 !important;
          border: 1px solid #4b5563 !important;
        }
        
        .bn-drag-handle {
          color: #9ca3af !important;
        }
        
        .bn-formatting-toolbar {
          background: #374151 !important;
          border: 1px solid #4b5563 !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3) !important;
        }
        
        .bn-formatting-toolbar button {
          color: #f3f4f6 !important;
        }
        
        .bn-formatting-toolbar button:hover {
          background: #4b5563 !important;
        }
        
        .bn-slash-menu {
          background: #374151 !important;
          border: 1px solid #4b5563 !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3) !important;
        }
        
        .bn-slash-menu-item {
          color: #f3f4f6 !important;
        }
        
        .bn-slash-menu-item:hover,
        .bn-slash-menu-item[data-selected="true"] {
          background: #4b5563 !important;
        }
        
        .bn-suggestion-menu {
          background: #374151 !important;
          border: 1px solid #4b5563 !important;
        }
        
        .bn-suggestion-menu-item {
          color: #f3f4f6 !important;
        }
        
        .bn-suggestion-menu-item:hover {
          background: #4b5563 !important;
        }
      `}</style>
    </div>
  );
}