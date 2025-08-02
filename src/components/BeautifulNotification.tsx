'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

interface NotificationState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

let notificationId = 0;
let setNotifications: React.Dispatch<React.SetStateAction<NotificationState[]>> | null = null;

export const showNotification = (
  message: string, 
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
  duration: number = 4000
) => {
  const id = `notification-${++notificationId}`;
  const notification: NotificationState = { id, message, type, duration };
  
  if (setNotifications) {
    setNotifications(prev => [...prev, notification]);
  }
};

function Notification({ message, type, duration = 4000, onClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);
    
    // Auto-close after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!mounted) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: '#10b981',
          shadow: 'rgba(16, 185, 129, 0.3)'
        };
      case 'error':
        return {
          bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          border: '#ef4444',
          shadow: 'rgba(239, 68, 68, 0.3)'
        };
      case 'warning':
        return {
          bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          border: '#f59e0b',
          shadow: 'rgba(245, 158, 11, 0.3)'
        };
      case 'info':
      default:
        return {
          bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          border: '#3b82f6',
          shadow: 'rgba(59, 130, 246, 0.3)'
        };
    }
  };

  const colors = getColors();

  return createPortal(
    <div
      className="fixed z-[99999] transition-all duration-300 ease-out"
      style={{
        top: '2rem',
        right: '2rem',
        transform: isVisible ? 'translateX(0) scale(1)' : 'translateX(100%) scale(0.95)',
        opacity: isVisible ? 1 : 0
      }}
    >
      <div
        className="flex items-center gap-4 px-6 py-4 rounded-2xl backdrop-blur-md border text-white shadow-2xl min-w-[300px] max-w-[500px]"
        style={{
          background: colors.bg,
          borderColor: colors.border,
          boxShadow: `0 20px 40px ${colors.shadow}, 0 0 0 1px rgba(255, 255, 255, 0.1)`
        }}
      >
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1">
          <p className="text-white font-medium leading-relaxed">
            {message}
          </p>
        </div>

        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 p-1 rounded-lg transition-colors"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'rgba(255, 255, 255, 0.8)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}

export default function NotificationContainer() {
  const [notifications, setNotificationsState] = useState<NotificationState[]>([]);

  useEffect(() => {
    setNotifications = setNotificationsState;
    return () => {
      setNotifications = null;
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotificationsState(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            position: 'relative',
            zIndex: 99999 - index // Stack notifications properly
          }}
        >
          <Notification
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            onClose={() => removeNotification(notification.id)}
          />
        </div>
      ))}
    </>
  );
}