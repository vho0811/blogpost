'use client';

import { useEffect, useMemo, useState } from 'react';
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
  onChange,
  placeholder = 'Start writing your blog post...'
}: BlockNoteEditorProps) {
  const { user } = useUser();

  // Convert HTML to BlockNote blocks on initial load
  const initialBlocks = useMemo(() => {
    if (initialContent) {
      try {
        // Simple HTML to blocks conversion
        const htmlContent = initialContent.replace(/<[^>]*>/g, '');
        const paragraphs = htmlContent.split('\n').filter(p => p.trim());
        
        const blocks: PartialBlock[] = paragraphs.map(text => ({
          type: 'paragraph' as const,
          content: text.trim(),
        }));
        
        return blocks.length > 0 ? blocks : [{ type: 'paragraph' as const, content: '' }];
      } catch (error) {
        console.error('Error parsing initial content:', error);
        return [{ type: 'paragraph' as const, content: '' }];
      }
    } else {
      return [{ type: 'paragraph' as const, content: '' }];
    }
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

  // Create the editor instance
  const editor = useCreateBlockNote({
    initialContent: initialBlocks,
    uploadFile,
  });

  // Handle content changes
  const handleChange = async () => {
    try {
      const htmlContent = await editor.blocksToHTMLLossy(editor.document);
      onChange?.(htmlContent);
    } catch (error) {
      console.error('Error converting blocks to HTML:', error);
    }
  };

  return (
    <div className="min-h-[400px] bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div className="p-4">
        <BlockNoteView
          editor={editor}
          onChange={handleChange}
          theme="dark"
          className="blocknote-editor"
        />
      </div>
      
      <style jsx global>{`
        .blocknote-editor {
          background: transparent !important;
        }
        
        .bn-container {
          background: transparent !important;
          color: #ffffff !important;
        }
        
        .bn-editor {
          background: transparent !important;
          color: #ffffff !important;
        }
        
        .ProseMirror {
          background: transparent !important;
          color: #ffffff !important;
          padding: 1rem !important;
          min-height: 300px !important;
        }
        
        .ProseMirror p {
          color: #ffffff !important;
          margin: 0.5rem 0 !important;
        }
        
        .ProseMirror h1,
        .ProseMirror h2,
        .ProseMirror h3,
        .ProseMirror h4,
        .ProseMirror h5,
        .ProseMirror h6 {
          color: #ffffff !important;
          font-weight: bold !important;
        }
        
        .ProseMirror ul,
        .ProseMirror ol {
          color: #ffffff !important;
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