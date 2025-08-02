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
      
          
          // Pass the Clerk user object with proper type conversion
          const result = await blogDatabase.createOrUpdateUser({
            id: user.id,
            email: user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress || undefined,
            username: user.username || undefined,
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
            imageUrl: user.imageUrl || undefined,
            profile_image_url: user.imageUrl || undefined
          });
          
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