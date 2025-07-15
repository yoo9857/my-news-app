"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function PaymentPage() {
  const [amount, setAmount] = useState(1000);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const getTokenHeaders = () => {
    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');
    if (!token || !tokenType) {
      router.push('/login');
      return null;
    }
    return {
      Authorization: `${tokenType} ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const handlePaymentRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const headers = getTokenHeaders();
    if (!headers) return;

    try {
      // In a real application, you'd get the user_id from the authenticated user context
      // For this example, we'll assume user_id 1 for simplicity or fetch it from /api/users/me
      // Let's fetch current user to get their ID
      const userResponse = await fetch('http://localhost:8003/api/users/me/', {
        headers: { Authorization: headers.Authorization },
      });
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user info for payment');
      }
      const userData = await userResponse.json();
      const userId = userData.id; // UserInDB now has 'id' field

      const response = await fetch('http://localhost:8003/api/transactions/request', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ amount, user_id: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : '결제 요청 실패');
      }

      const data = await response.json();
      toast({
        title: "결제 요청 성공",
        description: `트랜잭션 ID: ${data.id}, 상태: ${data.status}`, 
      });
      // Here you would typically redirect to a PG payment page or open a popup
      // For this example, we just log success and show toast
      console.log('Payment request created:', data);

    } catch (err: any) {
      toast({
        title: "결제 요청 실패",
        description: err.message,
        variant: "destructive",
      });
      console.error('Payment request error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <Card className="w-full max-w-md p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">후원/결제</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePaymentRequest} className="space-y-4">
            <div>
              <Label htmlFor="amount">금액 (KRW)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="결제 금액을 입력하세요"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                min={100}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '결제 요청 중...' : '결제 요청'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-sm text-gray-400">
          <p>이것은 데모 결제 요청입니다. 실제 결제는 이루어지지 않습니다.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
