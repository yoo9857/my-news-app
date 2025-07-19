'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';

interface Post {
  id: string;
  title: string;
  content: string;
  user: { nickname: string };
  category: { name: string };
  viewCount: number;
  likeCount: number;
  createdAt: string;
}

export function useCommunityPosts(category: string | null = null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/posts?q=${debouncedSearchTerm}&page=${page}${category ? `&category=${category}` : ''}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const responseData = await res.json();
        const data: Post[] = responseData.data; // Access the 'data' property
        setPosts((prevPosts) => (page === 1 ? data : [...prevPosts, ...data]));
        setHasMore(data.length > 0);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [debouncedSearchTerm, page, category]);

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  return { posts, loading, error, searchTerm, setSearchTerm, hasMore, loadMore };
}