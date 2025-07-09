// components/InvestmentCalculators.tsx
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function InvestmentCalculators() {
  return (
    // 최상위 div의 배경색을 bg-[#1A1A1A]로 변경하여 앱의 다른 카드/탭 목록과 일관성을 유지합니다.
    <div className="space-y-6 bg-[#1A1A1A] p-4 sm:p-6 lg:p-8 min-h-screen rounded-lg shadow-lg border border-[#2A2A2A]">
      <h2 className="text-3xl font-extrabold text-white mb-6 border-b border-blue-600 pb-2">투자 분석 도구</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 예시 계산기 1: 복리 계산기 */}
        <Card className="bg-[#1C2534] border border-[#2D3A4B] text-gray-100 rounded-lg shadow-md">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-xl font-bold text-white">복리 계산기</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-5">
            <div className="space-y-2">
              <label htmlFor="principal" className="text-gray-300 text-sm font-medium">초기 투자 금액 (원)</label>
              <Input id="principal" type="number" placeholder="1,000,000" className="bg-[#2A3445] border border-[#3C4A5C] text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 py-2" />
            </div>
            <div className="space-y-2">
              <label htmlFor="annualRate" className="text-gray-300 text-sm font-medium">연 수익률 (%)</label>
              <Input id="annualRate" type="number" placeholder="7" className="bg-[#2A3445] border border-[#3C4A5C] text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 py-2" />
            </div>
            <div className="space-y-2">
              <label htmlFor="years" className="text-gray-300 text-sm font-medium">투자 기간 (년)</label>
              <Input id="years" type="number" placeholder="10" className="bg-[#2A3445] border border-[#3C4A5C] text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 py-2" />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors duration-200">계산하기</Button>
            <div className="mt-4 p-4 bg-[#2A3445] rounded-md text-gray-200 border border-[#3C4A5C]">
              <p className="text-lg">최종 금액: <span className="font-bold text-white">계산 결과</span></p>
            </div>
          </CardContent>
        </Card>

        {/* 예시 계산기 2: 월 적립식 투자 계산기 */}
        <Card className="bg-[#1C2534] border border-[#2D3A4B] text-gray-100 rounded-lg shadow-md">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-xl font-bold text-white">월 적립식 투자 계산기</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-5">
            <div className="space-y-2">
              <label htmlFor="monthlyAmount" className="text-gray-300 text-sm font-medium">월 적립 금액 (원)</label>
              <Input id="monthlyAmount" type="number" placeholder="500,000" className="bg-[#2A3445] border border-[#3C4A5C] text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 py-2" />
            </div>
            <div className="space-y-2">
              <label htmlFor="monthlyRate" className="text-gray-300 text-sm font-medium">연 수익률 (%)</label>
              <Input id="monthlyRate" type="number" placeholder="8" className="bg-[#2A3445] border border-[#3C4A5C] text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 py-2" />
            </div>
            <div className="space-y-2">
              <label htmlFor="monthlyYears" className="text-gray-300 text-sm font-medium">투자 기간 (년)</label>
              <Input id="monthlyYears" type="number" placeholder="5" className="bg-[#2A3445] border border-[#3C4A5C] text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 py-2" />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors duration-200">계산하기</Button>
            <div className="mt-4 p-4 bg-[#2A3445] rounded-md text-gray-200 border border-[#3C4A5C]">
              <p className="text-lg">최종 금액: <span className="font-bold text-white">계산 결과</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}