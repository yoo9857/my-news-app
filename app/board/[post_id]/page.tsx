"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

interface Post {
  id: number;
  title: string;
  content: string;
  author_id: number;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: number;
  post_id: number;
  author_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.post_id as string;
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        // Fetch post
        const postResponse = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/posts/${postId}`);
        if (!postResponse.ok) {
          throw new Error('게시글을 불러오지 못했습니다.');
        }
        const postData = await postResponse.json();
        setPost(postData);

        // Fetch comments
        const commentsResponse = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/posts/${postId}/comments/`);
        if (!commentsResponse.ok) {
          throw new Error('댓글을 불러오지 못했습니다.');
        }
        const commentsData = await commentsResponse.json();
        setComments(commentsData);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPostAndComments();
    }
  }, [postId]);

  const handleCommentSubmit = async () => {
    setCommentLoading(true);
    setCommentError(null);

    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');

    if (!token || !tokenType) {
      setCommentError('댓글을 작성하려면 로그인이 필요합니다.');
      setCommentLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/posts/${postId}/comments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${tokenType} ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '댓글 작성 실패');
      }

      const addedComment = await response.json();
      setComments([...comments, addedComment]);
      setNewComment('');
    } catch (err: any) {
      setCommentError(err.message);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeletePost = async () => {
    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');

    if (!token || !tokenType) {
      alert('게시글을 삭제하려면 로그인이 필요합니다.');
      return;
    }

    if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/posts/${postId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `${tokenType} ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || '게시글 삭제 실패');
        }

        alert('게시글이 삭제되었습니다.');
        router.push('/board');
      } catch (err: any) {
        alert(`삭제 실패: ${err.message}`);
      }
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4 text-white">게시글 로딩 중...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">오류: {error}</div>;
  }

  if (!post) {
    return <div className="container mx-auto p-4 text-white">게시글을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="bg-gray-800 text-white mb-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{post.title}</CardTitle>
          <p className="text-sm text-gray-400">작성일: {format(new Date(post.created_at), 'yyyy-MM-dd HH:mm')}</p>
        </CardHeader>
        <CardContent>
          <p className="text-lg whitespace-pre-wrap">{post.content}</p>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="destructive" onClick={handleDeletePost}>삭제</Button>
        </CardFooter>
      </Card>

      <h2 className="text-2xl font-bold mb-4 text-white">댓글</h2>
      <div className="space-y-4 mb-6">
        {comments.length === 0 ? (
          <p className="text-gray-400">아직 댓글이 없습니다.</p>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="bg-gray-700 text-white">
              <CardContent className="pt-4">
                <p className="text-sm text-gray-300 mb-2">작성자 ID: {comment.author_id}</p>
                <p className="whitespace-pre-wrap">{comment.content}</p>
                <p className="text-xs text-gray-400 mt-2">{format(new Date(comment.created_at), 'yyyy-MM-dd HH:mm')}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="bg-gray-800 text-white">
        <CardHeader>
          <CardTitle className="text-xl">댓글 작성</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="댓글을 입력하세요..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={4}
            className="mb-4"
          />
          {commentError && <p className="text-red-500 text-sm mb-2">{commentError}</p>}
          <Button onClick={handleCommentSubmit} disabled={commentLoading || !newComment.trim()}>
            {commentLoading ? '작성 중...' : '댓글 작성'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
