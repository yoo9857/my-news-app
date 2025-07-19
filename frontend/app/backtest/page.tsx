'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker"; // Assuming you have this component

export default function BacktestPage() {
  const [stockCode, setStockCode] = useState('005930');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date('2022-01-01'));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [fastMa, setFastMa] = useState(10);
  const [slowMa, setSlowMa] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleRunBacktest = async () => {
    setIsLoading(true);
    const response = await fetch('/api/backtest/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        stock_code: stockCode, 
        start_date: startDate?.toISOString().split('T')[0],
        end_date: endDate?.toISOString().split('T')[0],
        parameters: { fast_ma: fastMa, slow_ma: slowMa }
      }),
    });
    const data = await response.json();
    // Here you would typically poll for results
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">백테스팅 엔진</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>전략 설정</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label>종목 코드</label>
              <Input value={stockCode} onChange={e => setStockCode(e.target.value)} />
            </div>
            <div>
              <label>시작일</label>
              <DatePicker date={startDate} setDate={setStartDate} />
            </div>
            <div>
              <label>종료일</label>
              <DatePicker date={endDate} setDate={setEndDate} />
            </div>
            <div>
              <label>Fast MA</label>
              <Input type="number" value={fastMa} onChange={e => setFastMa(parseInt(e.target.value))} />
            </div>
            <div>
              <label>Slow MA</label>
              <Input type="number" value={slowMa} onChange={e => setSlowMa(parseInt(e.target.value))} />
            </div>
            <Button onClick={handleRunBacktest} disabled={isLoading} className="w-full">
              {isLoading ? '실행 중...' : '백테스트 실행'}
            </Button>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>결과</CardTitle></CardHeader>
          <CardContent>
            {/* Results will be displayed here */}
            <p>백테스트 결과가 여기에 표시됩니다.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
