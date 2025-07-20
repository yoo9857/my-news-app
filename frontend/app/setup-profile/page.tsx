'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SetupProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If session is loaded and user already has a nickname, redirect to home
    if (session?.user?.nickname) {
      router.push('/');
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!session?.accessToken) {
      setError("인증 토큰이 없습니다. 다시 로그인해주세요.");
      setLoading(false);
      return;
    }

    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`http://localhost:8002/users/me/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ nickname })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        // Update the session with the new nickname
        await update({ user: { ...session?.user, nickname: updatedUser.nickname } });
        toast({
          title: "닉네임 설정 완료!",
          description: "닉네임이 성공적으로 설정되었습니다."
        });
        router.push('/'); // Redirect to home page
      } else {
        const errorData = await res.json();
        setError(errorData.detail || '닉네임 설정 실패.');
        toast({
          title: "닉네임 설정 실패",
          description: errorData.detail || '다시 시도해주세요.',
          variant: "destructive"
        });
      }
    } catch (err) {
      setError('예상치 못한 오류가 발생했습니다.');
      toast({
        title: "오류 발생",
        description: "예상치 못한 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // If session is not loaded or user already has a nickname, don't render the form yet
  if (!session || session.user?.nickname) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0F172A]">
      <Card className="w-full max-w-md bg-gray-800 text-gray-100 border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">닉네임 설정</CardTitle>
          <CardDescription className="text-center text-gray-400">
            서비스 이용을 위해 닉네임을 설정해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            <div>
              <Label htmlFor="nickname" className="text-gray-300">닉네임</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="mt-1 bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="사용할 닉네임을 입력하세요"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? '설정 중...' : '닉네임 설정'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}