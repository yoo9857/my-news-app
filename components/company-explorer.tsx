'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockInfo } from '@/lib/types';
import { useVirtualizer } from '@tanstack/react-virtual';

interface CompanyExplorerProps {
  stockData: StockInfo[];
  isLoading: boolean;
  fetchError: boolean;
}

const getChangeRateColor = (rate: number) => {
  if (rate > 0) return 'text-green-400';
  if (rate < 0) return 'text-red-400';
  return 'text-slate-400';
};

const ChangeRateIcon = ({ rate }: { rate: number }) => {
  if (rate > 0) return <ArrowUp size={14} className="inline-block mr-1 text-green-400" />;
  if (rate < 0) return <ArrowDown size={14} className="inline-block mr-1 text-red-400" />;
  return null;
};

export default function CompanyExplorer({ stockData, isLoading, fetchError }: CompanyExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'KOSPI' | 'KOSDAQ'>('ALL');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const filteredCompanies = useMemo(() => {
    let companies = stockData;
    if (marketFilter !== 'ALL') {
      companies = companies.filter(company => company.market === marketFilter);
    }
    if (!debouncedSearchTerm) return companies;
    const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();
    return companies.filter(
      company => company.name.toLowerCase().includes(lowerCaseSearchTerm) || 
                 company.stockCode.includes(lowerCaseSearchTerm)
    );
  }, [stockData, debouncedSearchTerm, marketFilter]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredCompanies.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 57, // Row height in pixels
    overscan: 10,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-full text-center">
        <Loader2 className="h-10 w-10 text-indigo-400 animate-spin mb-4" />
        <p className="text-slate-300">기업 데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col justify-center items-center h-full text-center">
        <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
        <p className="text-red-400 font-semibold">데이터 로딩 실패</p>
        <Button onClick={() => window.location.reload()} className="mt-4 bg-indigo-600 hover:bg-indigo-700">새로고침</Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Input 
          placeholder="종목명 또는 코드로 검색..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-grow bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
        />
        <Tabs defaultValue="ALL" onValueChange={(value) => setMarketFilter(value as any)} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ALL">전체</TabsTrigger>
            <TabsTrigger value="KOSPI">코스피</TabsTrigger>
            <TabsTrigger value="KOSDAQ">코스닥</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div ref={parentRef} className="flex-grow rounded-lg border border-slate-700/50 overflow-auto">
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, minWidth: '640px', position: 'relative' }}>
          <Table>
            <TableHeader className="sticky top-0 bg-slate-900/80 backdrop-blur-sm z-10">
              <TableRow className="border-slate-700 hover:bg-slate-900/80">
                <TableHead className="text-slate-300 pl-4" style={{ width: '280px' }}>종목명</TableHead>
                <TableHead className="text-right text-slate-300" style={{ width: '120px' }}>현재가</TableHead>
                <TableHead className="text-right text-slate-300" style={{ width: '120px' }}>등락률</TableHead>
                <TableHead className="text-right text-slate-300 pr-4" style={{ width: '120px' }}>거래량</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rowVirtualizer.getVirtualItems().map(virtualItem => {
                const stock = filteredCompanies[virtualItem.index];
                const rate = parseFloat(stock.changeRate);
                return (
                  <TableRow 
                    key={virtualItem.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    className="border-b border-slate-800 hover:bg-slate-800/50"
                  >
                    <TableCell className="font-medium text-slate-200 truncate pl-4">{stock.name} <span className="text-slate-500 text-xs">({stock.stockCode})</span></TableCell>
                    <TableCell className="text-right text-slate-200 font-mono">{parseInt(stock.currentPrice, 10).toLocaleString()}원</TableCell>
                    <TableCell className={`text-right font-semibold ${getChangeRateColor(rate)}`}>
                      <ChangeRateIcon rate={rate} />
                      {stock.changeRate}%
                    </TableCell>
                    <TableCell className="text-right text-slate-400 font-mono pr-4">{parseInt(stock.volume, 10).toLocaleString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}