
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

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

interface Comment {
  id: string;
  content: string;
  user: { nickname: string };
  createdAt: string;
}

export default function PostDetailView({ postId, onBack }) {
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPostAndComments = async () => {
      setLoading(true);
      setError(null);
      try {
        const postRes = await fetch(`/api/posts/${postId}`);
        if (!postRes.ok) {
          throw new Error(`HTTP error! status: ${postRes.status}`);
        }
        const postResponse = await postRes.json();
        setPost(postResponse.data);

        const commentsRes = await fetch(`/api/comments?postId=${postId}`);
        if (!commentsRes.ok) {
          throw new Error(`HTTP error! status: ${commentsRes.status}`);
        }
        const commentsResponse = await commentsRes.json();
        setComments(commentsResponse.data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchPostAndComments();
  }, [postId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to comment.');
      return;
    }
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment, userId: user.id, postId: postId }),
      });

      if (res.ok) {
        const responseData = await res.json();
        const addedComment: Comment = responseData.data;
        setComments((prev) => [...prev, addedComment]);
        setNewComment('');
      } else {
        const { error } = await res.json();
        setError(error);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('Please log in to like.');
      return;
    }
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id, postId: postId }),
      });
      if (res.ok) {
        // Optionally update like count on UI
        if (post) {
          setPost({
            ...post,
            likeCount: res.status === 201 ? post.likeCount + 1 : post.likeCount - 1,
          });
        }
      } else {
        const { error } = await res.json();
        setError(error);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  if (!post) return <div className="text-center py-10">Post not found.</div>;

  return (
    <div className="container mx-auto p-4">
      <Button onClick={onBack} className="mb-4">Back to List</Button>
      <Card>
        <CardHeader>
          <CardTitle>{post.title}</CardTitle>
          <p className="text-sm text-gray-500">Category: {post.category.name}</p>
          <p className="text-sm text-gray-500">Author: {post.user.nickname}</p>
          <p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</p>
        </CardHeader>
        <CardContent>
          <p>{post.content}</p>
          <div className="flex items-center space-x-4 mt-4">
            <Button onClick={handleLike}>Like ({post.likeCount})</Button>
            <span>Views: {post.viewCount}</span>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mt-8 mb-4">Comments</h2>
      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardContent>
              <p>{comment.content}</p>
              <p className="text-sm text-gray-500">By: {comment.user.nickname} at {new Date(comment.createdAt).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {user && (
        <form onSubmit={handleCommentSubmit} className="mt-8">
          <textarea
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={4}
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          ></textarea>
          <Button type="submit" className="mt-2">Submit Comment</Button>
        </form>
      )}
    </div>
  );
}
