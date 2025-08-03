'use client';

import { createPortal } from 'react-dom';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer" 
        onClick={onCancel}
        style={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)'
        }}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-gray-900/95 backdrop-blur-md rounded-3xl border border-gray-700/50 shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        style={{
          background: 'rgba(17, 24, 39, 0.95)',
          backdropFilter: 'blur(12px)',
          borderRadius: '1.5rem',
          border: '1px solid rgba(55, 65, 81, 0.5)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          maxWidth: '28rem',
          width: '100%',
          margin: '0 1rem',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div 
          className="p-8 border-b border-gray-700/50"
          style={{
            padding: '2rem',
            borderBottom: '1px solid rgba(55, 65, 81, 0.5)'
          }}
        >
          <div className="flex items-start gap-6">
            <div 
              className="flex-shrink-0 w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center"
              style={{
                flexShrink: 0,
                width: '4rem',
                height: '4rem',
                background: 'rgba(239, 68, 68, 0.2)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg 
                className="w-8 h-8 text-red-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{
                  width: '2rem',
                  height: '2rem',
                  color: '#f87171'
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 
                className="text-xl font-semibold text-white mb-3 leading-tight"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '0.75rem',
                  lineHeight: '1.3'
                }}
              >
                {title}
              </h3>
              <p 
                className="text-gray-300 text-base leading-relaxed"
                style={{
                  color: '#d1d5db',
                  fontSize: '1rem',
                  lineHeight: '1.6'
                }}
              >
                {message}
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div 
          className="p-8 bg-gray-800/30 flex items-center justify-end gap-4"
          style={{
            padding: '2rem',
            background: 'rgba(31, 41, 55, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '1rem'
          }}
        >
          <button
            onClick={onCancel}
            className="px-6 py-3 text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-600/50 rounded-xl font-medium transition-all duration-200 border border-gray-600/50 hover:border-gray-500/50 cursor-pointer"
            style={{
              padding: '0.75rem 1.5rem',
              color: '#d1d5db',
              background: 'rgba(55, 65, 81, 0.5)',
              borderRadius: '0.75rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              border: '1px solid rgba(75, 85, 99, 0.5)',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-red-500/20 border border-red-500/50 cursor-pointer"
            style={{
              padding: '0.75rem 1.5rem',
              background: '#dc2626',
              color: 'white',
              borderRadius: '0.75rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Delete Comment
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}