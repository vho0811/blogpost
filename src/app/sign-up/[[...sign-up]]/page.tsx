'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to sign-in since sign-up is disabled
    router.push('/sign-in');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <div className="w-full max-w-md text-center">
        <div className="text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">Sign Up Disabled</h1>
          <p className="text-gray-400">Please contact your administrator to get access.</p>
          <p className="text-gray-400 mt-2">Only existing users can sign in.</p>
        </div>
        <button
          onClick={() => router.push('/sign-in')}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-400 hover:to-purple-500 transition-all"
        >
          Go to Sign In
        </button>
      </div>
    </div>
  );
}