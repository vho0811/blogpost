import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to your AI-powered blog platform</p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 
                'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500',
              card: 'bg-gray-800/50 backdrop-blur-md border border-gray-700',
              headerTitle: 'text-white',
              headerSubtitle: 'text-gray-400',
              socialButtonsBlockButton: 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600',
              formFieldInput: 'bg-gray-700 border-gray-600 text-white',
              formFieldLabel: 'text-gray-300',
              footerActionLink: 'text-blue-400 hover:text-blue-300',
            },
          }}
          signUpUrl="/sign-up"
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}