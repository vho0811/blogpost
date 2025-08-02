'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { blogDatabase } from '@/lib/blog-database';

export function UserSync() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    const syncUser = async () => {
      if (isLoaded && user) {
        try {
      
          
          // Pass the entire Clerk user object to createOrUpdateUser
          const result = await blogDatabase.createOrUpdateUser(user);
          
          if (result) {
      
          } else {
            console.error('Failed to sync user to Supabase');
          }
        } catch (error) {
          console.error('Error syncing user to Supabase:', error);
        }
      }
    };

    syncUser();
  }, [user, isLoaded]);

  // This component doesn't render anything
  return null;
} 