

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useCommunityPosts } from '@/hooks/useCommunityPosts';
import { PostCardSkeleton } from '@/components/ui/PostCardSkeleton';
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton';
import { AnimatedPostCard } from '@/components/ui/AnimatedPostCard';

export default function CommunityPage() {
  const { user } = useAuth();
  const { posts, loading, error, searchTerm, setSearchTerm, hasMore, loadMore } = useCommunityPosts();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Community Board</h1>

      <div className="flex mb-4 space-x-2">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        {user && (
          <Link href="/community/new">
            <Button>Create Post</Button>
          </Link>
        )}
      </div>

      {error && <div className="text-center py-10 text-red-500">Error: {error}</div>}

      {loading && posts.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {!error && posts.length === 0 && (
            <div className="text-center py-10 text-gray-500">No posts found.</div>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <AnimatedPostCard key={post.id} post={post} onClick={() => console.log(`Post clicked: ${post.title}`)} />
            ))}
          </div>
          {hasMore && (
            <div className="text-center mt-6">
              <Button onClick={loadMore} disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}
      <ScrollToTopButton />
    </div>
  );
}

