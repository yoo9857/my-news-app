'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CreatePostPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('자유 토론'); // Default category
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!user) {
      setError('You must be logged in to create a post.');
      setLoading(false);
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError('Title and content cannot be empty.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:8002/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          author_id: user.id,
          category,
        }),
      });

      if (res.ok) {
        const newPost = await res.json();
        router.push(`/community/${newPost.data.id}`); // Redirect to the new post's detail page
      } else {
        const errorData = await res.json();
        setError(errorData.detail || 'Failed to create post.');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Create New Post</h1>

      {error && <div className="text-red-500 mb-4">Error: {error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <Input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
          <Select onValueChange={setCategory} defaultValue={category}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="국내 주식">국내 주식</SelectItem>
              <SelectItem value="해외 주식">해외 주식</SelectItem>
              <SelectItem value="자유 토론">자유 토론</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={10}
            className="mt-1 block w-full"
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Post'}
        </Button>
      </form>
    </div>
  );
}