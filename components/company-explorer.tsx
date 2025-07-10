'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { StockInfo } from '@/lib/types';

interface CompanyExplorerProps {
  stockData: StockInfo[]; // ✅ 부모로부터 배열을 받도록 타입을 수정
  isLoading: boolean;
  fetchError: boolean;
}

export default function CompanyExplorer({ stockData, isLoading, fetchError }: CompanyExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCompanies = useMemo(() => {
    // ✅ stockData가 이미 배열이므로 바로 filter를 사용
    if (!searchTerm) return stockData;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return stockData.filter(
      company => company.name.toLowerCase().includes(lowerCaseSearchTerm) || 
                 company.stockCode.includes(lowerCaseSearchTerm)
    );
  }, [stockData, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
        <p className="ml-4 text-lg text-gray-300">초기 기업 데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="text-center h-96 flex flex-col justify-center items-center">
         <p className="text-red-400 text-xl font-semibold">데이터 로딩 실패</p>
         <p className="text-gray-400 mt-2">서버에 연결할 수 없거나 데이터를 가져오는 중 오류가 발생했습니다.</p>
         <Button onClick={() => window.location.reload()} className="mt-4">새로고침</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <Input 
        placeholder="종목명 또는 코드로 검색..." 
        value={searchTerm} 
        onChange={e => setSearchTerm(e.target.value)}
        className="bg-[#2A3445] border-[#3C4A5C] text-white"
      />
      <ScrollArea className="h-[calc(100vh-300px)] border border-[#3C4A5C] rounded-md">
        <Table>
          <TableHeader className="sticky top-0 bg-[#1C2534]">
            <TableRow>
              <TableHead className="text-white">종목명</TableHead>
              <TableHead className="text-right text-white">현재가</TableHead>
              <TableHead className="text-right text-white">등락률</TableHead>
              <TableHead className="text-right text-white">거래량</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* ✅ filteredCompanies는 항상 배열이므로 .map() 사용이 안전합니다. */}
            {filteredCompanies.map(stock => (
              <TableRow key={stock.stockCode}>
                <TableCell className="font-medium">{stock.name} <span className="text-gray-400">{stock.stockCode}</span></TableCell>
                <TableCell className="text-right">{parseInt(stock.currentPrice, 10).toLocaleString()}원</TableCell>
                <TableCell className={`text-right font-semibold ${parseFloat(stock.changeRate) > 0 ? 'text-green-400' : parseFloat(stock.changeRate) < 0 ? 'text-red-400' : ''}`}>
                  {stock.changeRate}%
                </TableCell>
                <TableCell className="text-right">{parseInt(stock.volume, 10).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}