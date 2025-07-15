'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from 'lucide-react';

interface StockDetails {
  name: string;
  code: string;
  price: number;
  // ... other fields
}

interface FinancialStatement {
  year: number;
  quarter: number;
  revenue: number;
  operating_profit: number;
  net_income: number;
}

export default function StockDetailPage() {
  const params = useParams();
  const code = params.code as string;

  const [details, setDetails] = useState<StockDetails | null>(null);
  const [financials, setFinancials] = useState<FinancialStatement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [detailsRes, financialsRes] = await Promise.all([
          fetch(`/api/stocks/details?code=${code}`),
          fetch(`/api/financials/${code}`)
        ]);

        if (!detailsRes.ok) throw new Error('Failed to fetch stock details');
        const detailsData = await detailsRes.json();
        if(detailsData.success) setDetails(detailsData.data);

        if (financialsRes.ok) {
          const financialsData = await financialsRes.json();
          if (financialsData.success) setFinancials(financialsData.data);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [code]);

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  if (error) return <div className="text-red-500 text-center mt-10">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-2">{details?.name} ({details?.code})</h1>
      <p className="text-xl text-slate-400 mb-8">현재가: {details?.price?.toLocaleString()}원</p>

      <Card>
        <CardHeader>
          <CardTitle>재무 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>년도/분기</TableHead>
                <TableHead className="text-right">매출액</TableHead>
                <TableHead className="text-right">영업이익</TableHead>
                <TableHead className="text-right">당기순이익</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {financials.map(f => (
                <TableRow key={`${f.year}-${f.quarter}`}>
                  <TableCell>{f.year}년 {f.quarter}분기</TableCell>
                  <TableCell className="text-right">{(f.revenue / 100000000).toFixed(2)} 억</TableCell>
                  <TableCell className="text-right">{(f.operating_profit / 100000000).toFixed(2)} 억</TableCell>
                  <TableCell className="text-right">{(f.net_income / 100000000).toFixed(2)} 억</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
