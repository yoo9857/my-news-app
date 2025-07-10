'use client';

import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChartIcon as ChartLine, Newspaper, Calculator, CalendarDays, DollarSign, Brain } from "lucide-react";
import { useRouter } from 'next/navigation'; // useRouter 임포트
import CompanyExplorer from "@/components/company-explorer";
import RealTimeNews from "@/components/real-time-news";
import InvestmentCalculators from "@/components/InvestmentCalculators";
import DailyInvestmentPlan from "@/components/daily-plan";
import WisePortfolio from "@/components/portfolio-recommendation";
import { useIsMobile } from '@/hooks/use-mobile';
import MobileBottomNav from '@/components/mobile-bottom-nav';
import { StockInfo, RealTimeStockData } from '@/lib/types';
import Link from 'next/link'; // Link 컴포넌트 임포트
import { Button } from '@/components/ui/button'; // Button 컴포넌트 임포트

export default function KoreanStockPlatform() {
  const [activeTab, setActiveTab] = useState("explorer");
  const [stockData, setStockData] = useState<StockInfo[]>([]); 
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [codesToSubscribe, setCodesToSubscribe] = useState<string[]>([]);
  
  const ws = useRef<WebSocket | null>(null);
  const KIWOOM_API_BASE_URL = process.env.NEXT_PUBLIC_KIWOOM_API_URL;
  const isMobile = useIsMobile();
  const router = useRouter(); // useRouter 훅 사용

  // 1. 초기 주식 데이터 로딩
  useEffect(() => {
    const fetchInitialStockData = async () => {
      if (!KIWOOM_API_BASE_URL) {
        setIsLoading(false); setFetchError(true); return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`${KIWOOM_API_BASE_URL}/api/all-companies`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);
        
        const result = await response.json();
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          setStockData(result.data);
          const allStockCodes = result.data.map((stock: StockInfo) => stock.stockCode);
          setCodesToSubscribe(allStockCodes);
        } else {
          throw new Error(result.message || "API로부터 주식 데이터를 받지 못했습니다.");
        }
      } catch (error) {
        console.error("초기 주식 데이터 로딩 오류:", error);
        setFetchError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialStockData();
  }, [KIWOOM_API_BASE_URL]);

  // 2. 주식 시세용 웹소켓 연결
  useEffect(() => {
    if (!KIWOOM_API_BASE_URL) return;
    const wsProtocol = KIWOOM_API_BASE_URL.startsWith("https") ? "wss" : "ws";
    const wsUrl = `${wsProtocol}://${KIWOOM_API_BASE_URL.split('//')[1]}/ws/realtime-price`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => setIsConnected(true);
    ws.current.onclose = () => setIsConnected(false);
    ws.current.onerror = () => setIsConnected(false);
    ws.current.onmessage = (event) => {
      try {
        const message: { type: string; data: RealTimeStockData } = JSON.parse(event.data);
        if (message.type === "realtime") {
          const update = message.data;
          setStockData(prevData =>
            prevData.map(stock =>
              stock.stockCode === update.stockCode
                ? { ...stock, currentPrice: update.currentPrice, change: update.change, changeRate: update.changeRate }
                : stock
            )
          );
        }
      } catch (e) { console.error("잘못된 시세 메시지 수신:", e); }
    };
    return () => ws.current?.close();
  }, [KIWOOM_API_BASE_URL]);

  // 3. 주식 시세 구독 요청
  useEffect(() => {
    if (isConnected && codesToSubscribe.length > 0) {
      ws.current?.send(JSON.stringify({ type: "subscribe", codes: codesToSubscribe }));
      console.log(`✅ ${codesToSubscribe.length}개 종목 실시간 시세 구독 요청 전송`);
      setCodesToSubscribe([]);
    }
  }, [isConnected, codesToSubscribe]);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-gray-100 font-inter ${isMobile ? 'pb-16' : ''}`}>
      <header className="bg-[#1C2534] border-b border-[#2D3A4B] shadow-2xl sticky top-0 z-50 p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center justify-center gap-2">
          대한민국 투자 플랫폼
          <span className={`relative flex h-3 w-3 ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </span>
        </h1>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-10 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {!isMobile && (
            <TabsList>
              <TabsTrigger value="explorer"><ChartLine className="mr-2 h-4 w-4" />기업 탐색기</TabsTrigger>
              <TabsTrigger value="news"><Newspaper className="mr-2 h-4 w-4" />실시간 뉴스</TabsTrigger>
              <TabsTrigger value="tools"><Calculator className="mr-2 h-4 w-4" />투자 분석 도구</TabsTrigger>
              <TabsTrigger value="dailyPlan"><CalendarDays className="mr-2 h-4 w-4" />일일 계획</TabsTrigger>
              <TabsTrigger value="portfolio"><DollarSign className="mr-2 h-4 w-4" />포트폴리오</TabsTrigger>
              <TabsTrigger value="psychology-research" onClick={() => router.push('/psychology-research')}><Brain className="mr-2 h-4 w-4" />심리 연구소</TabsTrigger>
            </TabsList>
          )}
          <TabsContent value="explorer" className="mt-6">
            <CompanyExplorer stockData={stockData} isLoading={isLoading} fetchError={fetchError} />
          </TabsContent>
          <TabsContent value="news"><RealTimeNews /></TabsContent>
          <TabsContent value="tools"><InvestmentCalculators /></TabsContent>
          <TabsContent value="dailyPlan"><DailyInvestmentPlan /></TabsContent>
          <TabsContent value="portfolio"><WisePortfolio /></TabsContent>
        </Tabs>
      </main>
      {isMobile && <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
}