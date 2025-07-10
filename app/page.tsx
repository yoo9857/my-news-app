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
import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';

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

interface Company {
  theme: string; name: string; stockCode: string; reason: string; bull: string; bear: string;
}

export default function KoreanStockPlatform() {
  const [activeTab, setActiveTab] = useState("explorer");
  const tabsListRef = useRef<HTMLDivElement>(null);

  // 데이터 상태
  const [companyData, setCompanyData] = useState<Company[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [stockData, setStockData] = useState<Record<string, StockData>>({});
  
  // 상태 관리
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로드 함수
  const fetchCompanyData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/companies');
      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        if (result.companies.length === 0) {
          console.log("서버로부터 빈 기업 목록을 받았습니다. 데이터 수집 대기 중일 수 있습니다.");
          // 데이터를 아직 못 받았을 경우, 로딩 상태를 유지하거나 사용자에게 메시지를 표시할 수 있습니다.
          // 여기서는 일단 로딩 상태를 잠시 후 false로 바꿉니다.
        } else {
          setCompanyData(result.companies);
          const extractedThemes = ["전체", ...Array.from(new Set(result.companies.map((c: any) => c.theme).filter(Boolean)))];
          setThemes(extractedThemes as string[]);
        }
      } else {
        throw new Error(result.error || '기업 정보 처리 실패');
      }
    } catch (err: any) {
      console.error("기업 정보 로드 실패:", err);
      setError(`기업 정보를 불러오는 데 실패했습니다. (${err.message})`);
    } finally {
      // 데이터가 없더라도 로딩 상태는 해제합니다.
      // 서버가 데이터를 보내줄 때 다시 로드될 것입니다.
      setIsLoading(false);
    }
  };

  // 실시간 소켓 통신 및 데이터 로드 트리거
  useEffect(() => {
    // 초기 데이터 로드 시도
    fetchCompanyData();

    const socket: Socket = io({
      path: '/api/my_socket',
      addTrailingSlash: false,
    });

    socket.on('connect', () => {
      console.log("소켓 연결 성공. 데이터를 요청합니다.");
      setIsConnected(true);
      // 연결 성공 시 데이터를 다시 한번 요청
      fetchCompanyData();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log("소켓 연결 끊김.");
    });

    socket.on('real_kiwoom_data', (data: StockData) => {
      setStockData(prevData => ({ ...prevData, [data.code]: data }));
    });

    // 서버에서 기업 목록이 업데이트되었다는 신호를 받으면 데이터를 다시 로드
    socket.on('companies_updated', () => {
      console.log("서버로부터 기업 목록 업데이트 신호를 받았습니다. 데이터를 새로고침합니다.");
      fetchCompanyData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 탭 스크롤 로직
  useEffect(() => {
    const tabsListElement = tabsListRef.current;
    if (tabsListElement) {
      const handleWheel = (event: WheelEvent) => {
        event.preventDefault();
        tabsListElement.scrollLeft += event.deltaY;
      };
      tabsListElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => { tabsListElement.removeEventListener('wheel', handleWheel); };
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
              {isConnected ? '실시간 서버 연결됨' : '서버 연결 끊김'}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-10 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList ref={tabsListRef} className="flex flex-nowrap overflow-x-auto justify-center bg-[#28354A] rounded-2xl p-1.5 shadow-xl border border-[#3E4C66] gap-1.5 hide-scrollbar">
            <TabsTrigger value="explorer" className="...">기업 탐색기</TabsTrigger>
            <TabsTrigger value="news" className="...">실시간 뉴스</TabsTrigger>
            <TabsTrigger value="tools" className="...">투자 분석 도구</TabsTrigger>
            <TabsTrigger value="dailyPlan" className="...">일일 계획</TabsTrigger>
            <TabsTrigger value="portfolio" className="...">포트폴리오</TabsTrigger>
          </TabsList>
          
          <TabsContent value="explorer" className="mt-6 bg-[#1C2534] p-6 rounded-xl shadow-lg border border-[#2D3A4B]">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <p className="ml-4 text-lg">기업 정보를 불러오는 중입니다...</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-400">
                <p>오류: {error}</p>
              </div>
            ) : (
              <CompanyExplorer
                companyData={companyData}
                themes={themes}
                stockData={stockData}
                isConnected={isConnected}
              />
            )}
          </TabsContent>

          <TabsContent value="news" className="mt-6 ..."><RealTimeNews /></TabsContent>
          <TabsContent value="tools" className="mt-6 ..."><InvestmentCalculators /></TabsContent>
          <TabsContent value="dailyPlan" className="mt-6 ..."><DailyInvestmentPlan /></TabsContent>
          <TabsContent value="portfolio" className="mt-6 ..."><WisePortfolio /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}