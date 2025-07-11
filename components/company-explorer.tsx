'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
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
    estimateSize: () => 57, // Estimate row height
    overscan: 5,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-full text-center">
        <Loader2 className="h-10 w-10 text-indigo-400 animate-spin mb-4" />
        <p className="text-slate-300">기업 데이터를 불러오는 중입니다...</p>
        <p className="text-sm text-slate-500">잠시만 기다려주세요.</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col justify-center items-center h-full text-center">
        <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
        <p className="text-red-400 font-semibold">데이터 ��딩 실패</p>
        <p className="text-slate-400 mt-2 text-sm">서버 연결에 문제가 발생했습니다.</p>
        <Button onClick={() => window.location.reload()} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
          새로고침
        </Button>
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
      <div ref={parentRef} className="flex-grow border border-slate-700/50 rounded-lg overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-slate-900/80 backdrop-blur-sm z-10">
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300">종목명</TableHead>
              <TableHead className="text-right text-slate-300">현재가</TableHead>
              <TableHead className="text-right text-slate-300">등락률</TableHead>
              <TableHead className="text-right text-slate-300">거래량</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
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
                  className="border-slate-800 hover:bg-slate-800/50"
                >
                  <TableCell className="font-medium text-slate-200">{stock.name} <span className="text-slate-500">({stock.stockCode})</span></TableCell>
                  <TableCell className="text-right text-slate-200">{parseInt(stock.currentPrice, 10).toLocaleString()}원</TableCell>
                  <TableCell className={`text-right font-semibold ${getChangeRateColor(rate)}`}>
                    <ChangeRateIcon rate={rate} />
                    {stock.changeRate}%
                  </TableCell>
                  <TableCell className="text-right text-slate-400">{parseInt(stock.volume, 10).toLocaleString()}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}