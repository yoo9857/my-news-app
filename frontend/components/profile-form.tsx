'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfileForm() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [nickname, setNickname] = useState(session?.user?.nickname || '');
  const [avatarUrl, setAvatarUrl] = useState(session?.user?.avatar_url || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session?.user) {
      setNickname(session.user.nickname || '');
      setAvatarUrl(session.user.avatar_url || '');
      setEmail(session.user.email || '');
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`http://localhost:8002/users/me/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ nickname, avatar_url: avatarUrl }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        // Update the session with the new user data
        await update({ user: { ...session?.user, nickname: updatedUser.nickname, avatar_url: updatedUser.avatar_url } });
        toast({
          title: "프로필 업데이트 성공!",
          description: "프로필 정보가 성공적으로 업데이트되었습니다.",
        });
      } else {
        const errorData = await res.json();
        setError(errorData.detail || '프로필 업데이트 실패.');
        toast({
          title: "프로필 업데이트 실패",
          description: errorData.detail || '다시 시도해주세요.',
          variant: "destructive",
        });
      }
    } catch (err) {
      setError('예상치 못한 오류가 발생했습니다.');
      toast({
        title: "오류 발생",
        description: "예상치 못한 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} disabled className="mt-1 bg-gray-700 border-gray-600 text-gray-400" />
      </div>
      <div>
        <Label htmlFor="nickname">Nickname</Label>
        <Input
          id="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="mt-1 bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      <div>
        <Label htmlFor="avatarUrl">Avatar URL</Label>
        <Input
          id="avatarUrl"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="mt-1 bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
        {loading ? 'Updating...' : 'Update Profile'}
      </Button>
    </form>
  );
}
