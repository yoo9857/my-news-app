'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { StockInfo } from '@/lib/types'; // lib/types.ts에서 타입을 가져옵니다.

// 부모(page.tsx)로부터 받는 props의 타입을 정확히 정의합니다.
interface CompanyExplorerProps {
  stockData: StockInfo[]; // ✅ stockData는 배열(StockInfo[])로 받습니다.
  isLoading: boolean;
  fetchError: boolean;
}

export default function CompanyExplorer({ stockData, isLoading, fetchError }: CompanyExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // stockData가 배열이므로, 바로 filter와 map을 사용할 수 있습니다.
  const filteredCompanies = useMemo(() => {
    if (!searchTerm) return stockData;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return stockData.filter(
      company => company.name.toLowerCase().includes(lowerCaseSearchTerm) || 
                 company.stockCode.includes(lowerCaseSearchTerm)
    );
  }, [stockData, searchTerm]);

  // 1. isLoading prop을 사용하여 로딩 상태를 표시합니다.
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
        <p className="ml-4 text-lg text-gray-300">초기 기업 데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  // 2. fetchError prop을 사용하여 에러 상태를 표시합니다.
  if (fetchError) {
    return (
      <div className="text-center h-96 flex flex-col justify-center items-center">
         <p className="text-red-400 text-xl font-semibold">데이터 로딩 실패</p>
         <p className="text-gray-400 mt-2">서버에 연결할 수 없거나 데이터를 가져오는 중 오류가 발생했습니다.</p>
         <Button onClick={() => window.location.reload()} className="mt-4">새로고침</Button>
      </div>
    );
  }
  
  // 3. 로딩과 에러가 모두 없을 때, 받은 데이터를 화면에 그립니다.
  return (
    <div className="space-y-4">
      <Input 
        placeholder="종목명 또는 코드로 검색..." 
        value={searchTerm} 
        onChange={e => setSearchTerm(e.target.value)}
        className="bg-[#2A3445] border-[#3C4A5C] text-white"
      />
      <ScrollArea className="h-[calc(100vh-300px)] border border-[#3C4A5C] rounded-md overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-[#1C2534]">
            <TableRow>
              <TableHead className="text-white px-2 py-2">종목명</TableHead>
              <TableHead className="text-right text-white px-2 py-2">현재가</TableHead>
              <TableHead className="text-right text-white px-2 py-2">등락률</TableHead>
              <TableHead className="text-right text-white px-2 py-2">거래량</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies.map(stock => (
              <TableRow key={stock.stockCode}>
                <TableCell className="font-medium px-2 py-2">{stock.name} <span className="text-gray-400">({stock.stockCode})</span></TableCell>
                <TableCell className="text-right px-2 py-2">{parseInt(stock.currentPrice, 10).toLocaleString()}원</TableCell>
                <TableCell className={`text-right font-semibold px-2 py-2 ${parseFloat(stock.changeRate) > 0 ? 'text-green-400' : parseFloat(stock.changeRate) < 0 ? 'text-red-400' : ''}`}>
                  {stock.changeRate}%
                </TableCell>
                <TableCell className="text-right px-2 py-2">{parseInt(stock.volume, 10).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}