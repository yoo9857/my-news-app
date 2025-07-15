"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Google 로그인 처리 중...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      const handleGoogleLogin = async () => {
        try {
          const response = await fetch(`http://localhost:8003/api/auth/google/callback?code=${code}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Google 로그인 실패');
          }
          const data = await response.json();
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('token_type', data.token_type);
          setMessage('로그인 성공! 프로필 페이지로 이동합니다...');
          router.push('/profile');
        } catch (err: any) {
          setError(err.message);
          setMessage('Google 로그인 실패');
          console.error('Google login error:', err);
        }
      };
      handleGoogleLogin();
    } else {
      setError('Google 인증 코드가 없습니다.');
      setMessage('Google 로그인 실패');
    }
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <Card className="w-full max-w-md p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Google 로그인</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-red-500 text-center">오류: {error}</p>
          ) : (
            <p className="text-white text-center">{message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
