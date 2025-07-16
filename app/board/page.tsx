"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface Post {
  id: number;
  title: string;
  content: string;
  author_id: number;
  created_at: string;
  updated_at: string;
}

export default function BoardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/posts/`);
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        const data = await response.json();
        setPosts(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (loading) {
    return <div className="container mx-auto p-4 text-white">Loading posts...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-white">게시판</h1>
      <div className="flex justify-end mb-4">
        <Link href="/board/new">
          <Button>새 글 작성</Button>
        </Link>
      </div>
      <div className="grid gap-4">
        {posts.length === 0 ? (
          <p className="text-white">게시글이 없습니다.</p>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="bg-gray-800 text-white">
              <CardHeader>
                <CardTitle className="text-xl">
                  <Link href={`/board/${post.id}`} className="hover:underline">
                    {post.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">작성일: {format(new Date(post.created_at), 'yyyy-MM-dd HH:mm')}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
