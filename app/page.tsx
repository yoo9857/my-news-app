// app/page.tsx
// Force git to recognize change
'use client';

import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Newspaper, Calculator, LineChartIcon as ChartLine, CalendarDays, DollarSign, Loader2 } from "lucide-react";
import CompanyExplorer from "@/components/company-explorer";
import RealTimeNews from "@/components/real-time-news";
import InvestmentCalculators from "@/components/InvestmentCalculators";
import DailyInvestmentPlan from "@/components/daily-plan";
import WisePortfolio from "@/components/portfolio-recommendation";

// 타입 정의
interface StockData {
  code: string;
  name: string;
  current_price: number;
  change: number;
  change_rate: number;
  volume: number;
  timestamp: string;
  status: 'positive' | 'negative' | 'neutral';
}

export default function KoreanStockPlatform() {
  const [activeTab, setActiveTab] = useState("explorer");
  const tabsListRef = useRef<HTMLDivElement>(null);
  const [stockData, setStockData] = useState<Record<string, StockData>>({});
  const [isConnected, setIsConnected] = useState(true); // API 서버 연결 상태 (추후 실제 로직으로 교체)

  // 탭 스크롤 로직
  useEffect(() => {
    const tabsListElement = tabsListRef.current;
    if (tabsListElement) {
      const handleWheel = (event: WheelEvent) => {
        event.preventDefault();
        tabsListElement.scrollLeft += event.deltaY;
      };
      tabsListElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        if (tabsListElement) {
          tabsListElement.removeEventListener('wheel', handleWheel);
        }
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-gray-100 font-inter">
      <header className="bg-[#1C2534] border-b border-[#2D3A4B] shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <ChartLine className="h-8 w-8 text-[#60A5FA] mr-3 animate-pulse" />
              <h1 className="text-2xl font-extrabold text-white tracking-wide">대한민국 투자 플랫폼</h1>
            </div>
            <div className={`flex items-center text-sm font-semibold px-3 py-1 rounded-full transition-colors duration-300 ${isConnected ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
              <span className={`relative flex h-2 w-2 mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full`}>
                {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
              </span>
              {isConnected ? 'API 서버 연결됨' : 'API 서버 연결 끊김'}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-10 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList ref={tabsListRef} className="flex flex-nowrap overflow-x-auto justify-center bg-[#28354A] rounded-2xl p-1.5 shadow-xl border border-[#3E4C66] gap-1.5 hide-scrollbar">
            <TabsTrigger value="explorer" className="... (styles)">기업 탐색기</TabsTrigger>
            <TabsTrigger value="news" className="... (styles)">실시간 뉴스</TabsTrigger>
            <TabsTrigger value="tools" className="... (styles)">투자 분석 도구</TabsTrigger>
            <TabsTrigger value="dailyPlan" className="... (styles)">일일 계획</TabsTrigger>
            <TabsTrigger value="portfolio" className="... (styles)">포트폴리오</TabsTrigger>
          </TabsList>
          
          <TabsContent value="explorer" className="mt-6 bg-[#1C2534] p-6 rounded-xl shadow-lg border border-[#2D3A4B]">
            <CompanyExplorer
              stockData={stockData}
              isConnected={isConnected}
            />
          </TabsContent>

          <TabsContent value="news" className="mt-6 ... (styles)"><RealTimeNews /></TabsContent>
          <TabsContent value="tools" className="mt-6 ... (styles)"><InvestmentCalculators /></TabsContent>
          <TabsContent value="dailyPlan" className="mt-6 ... (styles)"><DailyInvestmentPlan /></TabsContent>
          <TabsContent value="portfolio" className="mt-6 ... (styles)"><WisePortfolio /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
