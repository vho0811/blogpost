import BlogPageWrapper from '@/components/BlogPageWrapper';

export default async function BlogPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return <BlogPageWrapper blogId={id} />;
} 