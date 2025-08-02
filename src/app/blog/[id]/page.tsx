import BlogContent from '@/components/BlogContent';
import SimpleAIDesignButton from '@/components/SimpleAIDesignButton';
import Link from 'next/link';

export default async function BlogPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <>
      {/* Floating Buttons - Completely separate from HTML content */}
      <div className="fixed top-10 left-10 z-[9999]" style={{ isolation: 'isolate', contain: 'layout style paint' }}>
        <Link href="/" className="group bg-gray-900/95 backdrop-blur-md text-white px-10 py-5 rounded-2xl font-semibold hover:bg-gray-800/95 transition-all duration-300 flex items-center gap-5 shadow-2xl border border-gray-700/30 hover:border-gray-600/50 hover:shadow-gray-900/25 hover:scale-105 leading-tight" style={{ all: 'unset', display: 'flex', alignItems: 'center', gap: '1.25rem', backgroundColor: 'rgba(17, 24, 39, 0.95)', backdropFilter: 'blur(12px)', color: 'white', padding: '1.25rem 2.5rem', borderRadius: '1rem', fontWeight: '600', transition: 'all 0.3s ease', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(55, 65, 81, 0.3)', textDecoration: 'none', fontSize: '1.125rem', letterSpacing: '0.025em', lineHeight: '1.25', cursor: 'pointer', zIndex: 9999 }}>
          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="transition-transform duration-300 group-hover:-translate-x-1">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          <span className="text-lg tracking-wide">Back to Stories</span>
        </Link>
      </div>
      
      {/* Floating AI Design Button - Completely separate from HTML content */}
      <div className="fixed top-10 right-10 z-[9999]" style={{ isolation: 'isolate', contain: 'layout style paint' }}>
        <SimpleAIDesignButton blogId={id} />
      </div>
      
      {/* HTML Content - This can change, buttons stay the same */}
      <div className="w-full" style={{ zIndex: 1 }}>
        <BlogContent docId={id} />
      </div>
    </>
  );
} 