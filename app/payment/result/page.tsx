"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status'); // e.g., 'success', 'fail'
  const message = searchParams.get('message');
  const transactionId = searchParams.get('transactionId');

  const [displayStatus, setDisplayStatus] = useState('');
  const [displayMessage, setDisplayMessage] = useState('');

  useEffect(() => {
    if (status === 'success') {
      setDisplayStatus('결제 성공!');
      setDisplayMessage(message || `트랜잭션 ID: ${transactionId}`);
    } else if (status === 'fail') {
      setDisplayStatus('결제 실패');
      setDisplayMessage(message || '결제 처리 중 오류가 발생했습니다.');
    } else {
      setDisplayStatus('알 수 없는 결제 결과');
      setDisplayMessage('결제 정보를 확인할 수 없습니다.');
    }
  }, [status, message, transactionId]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <Card className="w-full max-w-md p-6 text-center">
        <CardHeader>
          <CardTitle className={`text-3xl font-bold ${status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
            {displayStatus}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg text-white">{displayMessage}</p>
          <Link href="/payment">
            <Button className="w-full">다시 결제하기</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full mt-2">홈으로</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
