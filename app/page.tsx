// app/page.tsx
'use client';

import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Newspaper, Calculator, LineChartIcon as ChartLine, CalendarDays, DollarSign, Loader2 } from "lucide-react";
import CompanyExplorer from "@/components/company-explorer";
import RealTimeNews from "@/components/real-time-news";
import InvestmentCalculators from "@/components/InvestmentCalculators";
import DailyInvestmentPlan from "@/components/daily-plan";
import WisePortfolio from "@/components/portfolio-recommendation";
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile hook
import MobileBottomNav from '@/components/mobile-bottom-nav'; // Import MobileBottomNav component

// 타입 정의
import { StockInfo, RealTimeStockData } from '@/lib/types';

export default function KoreanStockPlatform() {
  const [activeTab, setActiveTab] = useState("explorer");
  const tabsListRef = useRef<HTMLDivElement>(null);
  const [stockData, setStockData] = useState<StockInfo[]>([]); // Initial stock data
  const [isConnected, setIsConnected] = useState(false); // API 서버 연결 상태
  const [fetchError, setFetchError] = useState(false); // Initial stock data fetch error state

  // WebSocket reference
  const ws = useRef<WebSocket | null>(null);

  // FastAPI 서버의 기본 URL을 환경 변수에서 가져옵니다.
  // 개발 환경에서는 .env.local의 값이 사용되고, 배포 환경에서는 해당 환경의 변수가 사용됩니다.
  const KIWOOM_API_BASE_URL = process.env.NEXT_PUBLIC_KIWOOM_API_URL;

  const isMobile = useIsMobile(); // Use the hook to detect mobile

    // Fetch initial stock data
  useEffect(() => {
    console.log("KIWOOM_API_BASE_URL:", KIWOOM_API_BASE_URL);
    const fetchInitialStockData = async () => {
      try {
        const requestUrl = `${KIWOOM_API_BASE_URL}/api/all-companies`;
        console.log("Fetching initial stock data from:", requestUrl); // 요청 URL 로깅
        const response = await fetch(requestUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        console.log("Response URL:", response.url); // 실제 응답받은 URL 로깅
        console.log("Response Status:", response.status); // 응답 상태 코드 로깅
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            const initialData: StockInfo[] = data.data;
            setStockData(initialData);
            setIsConnected(true);
          } else {
            console.error("Failed to fetch initial stock data:", data.message);
            setIsConnected(false);
          }
        } else {
          console.error("HTTP error fetching initial stock data:", response.status, response.statusText);
          // 응답 본문을 텍스트로 읽어서 추가 로깅
          const errorText = await response.text();
          console.error("Error response body:", errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error("Error fetching initial stock data:", error);
        setIsConnected(false);
        setFetchError(true);
      }
    };

    fetchInitialStockData();
  }, []);

  // WebSocket connection for real-time data
  useEffect(() => {
    if (!KIWOOM_API_BASE_URL) {
      console.error("KIWOOM_API_BASE_URL is not defined. Please check your .env.local file.");
      setIsConnected(false);
      return;
    }
    const wsProtocol = KIWOOM_API_BASE_URL.startsWith("https") ? "wss" : "ws";
    ws.current = new WebSocket(`${wsProtocol}://${KIWOOM_API_BASE_URL.split('//')[1]}/ws/realtime-price`);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      // Subscribe to some initial stock codes if needed, or let CompanyExplorer handle it
      // For now, we'll assume CompanyExplorer will send subscribe messages
    };

    ws.current.onmessage = (event) => {
      const message: { type: string; data: RealTimeStockData } = JSON.parse(event.data);
      if (message.type === "realtime") {
        const realTimeUpdate = message.data;
        setStockData((prevData) => {
          return prevData.map((stock) => {
            if (stock.stockCode === realTimeUpdate.stockCode) {
              return {
                ...stock,
                currentPrice: realTimeUpdate.currentPrice,
                change: realTimeUpdate.change,
                changeRate: realTimeUpdate.changeRate,
              };
            }
            return stock;
          });
        });
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      // Attempt to reconnect after a delay
      setTimeout(() => {
        console.log("Attempting to reconnect WebSocket...");
        // This will trigger a new useEffect run, creating a new WebSocket
        // For simplicity, we'll just let the component re-render or manually call the effect
        // A more robust solution would involve a dedicated reconnect function
      }, 3000);
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []); // Empty dependency array means this runs once on mount and cleanup on unmount

  // 탭 스크롤 로직 (기존 코드 유지)
  useEffect(() => {
    const tabsListElement = tabsListRef.current;
    if (tabsListElement && !isMobile) { // Only apply wheel scroll for desktop
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
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-gray-100 font-inter">
      <header className="bg-[#1C2534] border-b border-[#2D3A4B] shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <ChartLine className="h-8 w-8 text-[#60A5FA] mr-3 animate-pulse" />
              {/* 모바일에서 글자 크기 줄이기 */}
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">대한민국 투자 플랫폼</h1>
            </div>
            {isMobile ? (
              <div className="flex items-center">
                <span className={`relative flex h-3 w-3 ${isConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full`}>
                  {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                </span>
              </div>
            ) : (
              <div className={`flex items-center text-sm font-semibold px-3 py-1 rounded-full transition-colors duration-300 ${isConnected ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                <span className={`relative flex h-2 w-2 mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full`}>
                  {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                </span>
                {isConnected ? 'API 서버 연결됨' : 'API 서버 연결 끊김'}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={`max-w-7xl mx-auto px-4 sm:px-10 lg:px-8 py-8 ${isMobile ? 'pb-24' : ''}`}> {/* Add bottom padding for mobile nav */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {!isMobile && ( // Render TabsList only on desktop
            <TabsList ref={tabsListRef} className="flex flex-nowrap overflow-x-auto justify-center bg-[#28354A] rounded-2xl p-1.5 shadow-xl border border-[#3E4C66] gap-1.5 hide-scrollbar">
              <TabsTrigger value="explorer" className="px-2 py-1.5 text-sm sm:px-3">기업 탐색기</TabsTrigger>
              <TabsTrigger value="news" className="px-2 py-1.5 text-sm sm:px-3">실시간 뉴스</TabsTrigger>
              <TabsTrigger value="tools" className="px-2 py-1.5 text-sm sm:px-3">투자 분석 도구</TabsTrigger>
              <TabsTrigger value="dailyPlan" className="px-2 py-1.5 text-sm sm:px-3">일일 계획</TabsTrigger>
              <TabsTrigger value="portfolio" className="px-2 py-1.5 text-sm sm:px-3">포트폴리오</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="explorer" className="mt-6 bg-[#1C2534] p-6 rounded-xl shadow-lg border border-[#2D3A4B]">
            <CompanyExplorer
              stockData={stockData}
              isConnected={isConnected}
              fetchError={fetchError}
              kiwoomApiBaseUrl={KIWOOM_API_BASE_URL}
            />
          </TabsContent>

          <TabsContent value="news" className="mt-6 bg-[#1C2534] p-6 rounded-xl shadow-lg border border-[#2D3A4B]"><RealTimeNews setIsConnected={setIsConnected} /></TabsContent>
          <TabsContent value="tools" className="mt-6 bg-[#1C2534] p-6 rounded-xl shadow-lg border border-[#2D3A4B]"><InvestmentCalculators /></TabsContent>
          <TabsContent value="dailyPlan" className="mt-6 bg-[#1C2534] p-6 rounded-xl shadow-lg border border-[#2D3A4B]"><DailyInvestmentPlan /></TabsContent>
          <TabsContent value="portfolio" className="mt-6 bg-[#1C2534] p-6 rounded-xl shadow-lg border border-[#2D3A4B]"><WisePortfolio /></TabsContent>
        </Tabs>
      </div>

      {isMobile && <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />} {/* Render MobileBottomNav only on mobile */}
    </div>
  );
}