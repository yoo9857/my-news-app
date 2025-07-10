'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function InvestmentCalculators() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-200 text-center">투자 분석 도구</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 복리 계산기 */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-300">복리 계산기</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="principal" className="text-sm font-medium text-slate-400">초기 투자 금액 (원)</Label>
              <Input id="principal" type="number" placeholder="1,000,000" className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annualRate" className="text-sm font-medium text-slate-400">연 수익률 (%)</Label>
              <Input id="annualRate" type="number" placeholder="7" className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="years" className="text-sm font-medium text-slate-400">투자 기간 (년)</Label>
              <Input id="years" type="number" placeholder="10" className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">계산하기</Button>
            <div className="mt-4 p-3 bg-slate-800 rounded-md text-slate-300 border border-slate-700">
              <p>최종 금액: <span className="font-bold text-white">계산 결과</span></p>
            </div>
          </CardContent>
        </Card>

        {/* 월 적립식 투자 계산기 */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-300">월 적립식 투자 계산기</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyAmount" className="text-sm font-medium text-slate-400">월 적립 금액 (원)</Label>
              <Input id="monthlyAmount" type="number" placeholder="500,000" className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyRate" className="text-sm font-medium text-slate-400">연 수익률 (%)</Label>
              <Input id="monthlyRate" type="number" placeholder="8" className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyYears" className="text-sm font-medium text-slate-400">투자 기간 (년)</Label>
              <Input id="monthlyYears" type="number" placeholder="5" className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">계산하기</Button>
            <div className="mt-4 p-3 bg-slate-800 rounded-md text-slate-300 border border-slate-700">
              <p>최종 금액: <span className="font-bold text-white">계산 결과</span></p>
            </div>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}