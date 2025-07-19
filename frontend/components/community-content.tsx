'use client';

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useCommunityPosts } from '@/hooks/useCommunityPosts';
import { PostCardSkeleton } from '@/components/ui/PostCardSkeleton';
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton';
import { AnimatedPostCard } from '@/components/ui/AnimatedPostCard';
import PostDetailView from '@/components/PostDetailView';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export default function CommunityContent() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>("all");
  const { posts, loading, error, searchTerm, setSearchTerm, hasMore, loadMore } = useCommunityPosts(selectedCategory);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const handlePostClick = (postId: string) => {
    setSelectedPostId(postId);
  };

  const handleBackToList = () => {
    setSelectedPostId(null);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Community Board</h1>

      {!selectedPostId ? (
        <>
          <div className="mb-4">
            <ToggleGroup type="single" value={selectedCategory || "all"} onValueChange={handleCategoryChange}>
              <ToggleGroupItem value="all" aria-label="View all posts">
                All
              </ToggleGroupItem>
              <ToggleGroupItem value="국내 주식" aria-label="View domestic stock posts">
                국내 주식
              </ToggleGroupItem>
              <ToggleGroupItem value="해외 주식" aria-label="View overseas stock posts">
                해외 주식
              </ToggleGroupItem>
              <ToggleGroupItem value="자유 토론" aria-label="View free discussion posts">
                자유 토론
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

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
                  <AnimatedPostCard key={post.id} post={post} onClick={() => handlePostClick(post.id)} />
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
        </>
      ) : (
        <PostDetailView postId={selectedPostId} onBack={handleBackToList} />
      )}
      <ScrollToTopButton />
    </div>
  );
}
