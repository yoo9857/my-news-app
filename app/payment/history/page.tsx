"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { format } from 'date-fns';

interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  currency: string;
  status: string;
  pg_transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function PaymentHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      const headers = getTokenHeaders();
      if (!headers) return;

      try {
        const response = await fetch('http://localhost:8003/api/transactions/me', {
          headers: headers,
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('token_type');
            router.push('/login');
          }
          const errorData = await response.json();
          throw new Error(errorData.detail || '트랜잭션 내역을 불러오지 못했습니다.');
        }

        const data = await response.json();
        setTransactions(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [router]);

  if (loading) {
    return <div className="container mx-auto p-4 text-white">트랜잭션 내역 로딩 중...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">오류: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-white">결제 내역</h1>
      <Card className="bg-gray-800 text-white">
        <CardHeader>
          <CardTitle>나의 트랜잭션</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-400">결제 내역이 없습니다.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>금액</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>PG ID</TableHead>
                  <TableHead>날짜</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.id}</TableCell>
                    <TableCell>{tx.amount} {tx.currency}</TableCell>
                    <TableCell>{tx.status}</TableCell>
                    <TableCell>{tx.pg_transaction_id || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(tx.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
