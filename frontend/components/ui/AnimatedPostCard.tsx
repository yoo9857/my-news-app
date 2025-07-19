
'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Post {
  id: string;
  title: string;
  user: { nickname: string };
  category: { name: string };
  viewCount: number;
  likeCount: number;
  createdAt: string;
}

interface AnimatedPostCardProps {
  post: Post;
  onClick: () => void; // Add onClick prop
}

export function AnimatedPostCard({ post, onClick }: AnimatedPostCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick} // Attach onClick to the motion.div
      style={{ cursor: 'pointer' }} // Add cursor style to indicate clickability
    >
      <Card>
        <CardHeader>
          <CardTitle>{post.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Category: {post.category.name}</p>
          <p className="text-sm text-gray-500">Author: {post.user.nickname}</p>
          <p className="text-sm text-gray-500">Views: {post.viewCount} | Likes: {post.likeCount}</p>
          <p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
