'use client';

import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartLine, Newspaper, Calculator, CalendarDays, DollarSign, Brain } from "lucide-react";

// Component Imports
import CompanyExplorer from "@/components/company-explorer";
import RealTimeNews from "@/components/real-time-news";
import InvestmentCalculators from "@/components/InvestmentCalculators";
import DailyInvestmentPlan from "@/components/daily-plan";
import WisePortfolio from "@/components/wise-portfolio";
import PortfolioCustomizer from "@/components/portfolio-customizer";
import { useIsMobile } from '@/hooks/use-mobile';
import MobileBottomNav from '@/components/mobile-bottom-nav';
import { StockInfo, RealTimeStockData } from '@/lib/types';

// --- Aurora Background ---
const AuroraBackground = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const smoothMouseX = useSpring(mouseX, { stiffness: 100, damping: 40, mass: 0.5 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 100, damping: 40, mass: 0.5 });

  const transform = useTransform(
    [smoothMouseX, smoothMouseY],
    ([x, y]) => `translate(${x}px, ${y}px)`
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <motion.div 
        className="absolute w-[800px] h-[600px] rounded-full bg-indigo-900/40 blur-[150px] opacity-40"
        style={{ transform, left: '-20%', top: '-20%' }}
      />
      <motion.div 
        className="absolute w-[700px] h-[500px] rounded-full bg-purple-900/40 blur-[150px] opacity-40"
        style={{ transform, right: '-20%', bottom: '-20%' }}
      />
    </div>
  );
};

// --- Content Wrapper with Glow Effect ---
const ContentWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: "easeInOut" }}
    className="mt-6 relative group bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg p-4 sm:p-6"
  >
    <div className="absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
      <div className="absolute inset-0 rounded-2xl" style={{
        background: "radial-gradient(600px at 50% 50%, rgba(79, 70, 229, 0.1), transparent 80%)"
      }}></div>
    </div>
    <div className="relative">
      {children}
    </div>
  </motion.div>
);

// --- Main Component ---
export default function KoreanStockPlatform() {
  const [activeTab, setActiveTab] = useState("explorer");
  const [stockData, setStockData] = useState<StockInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  
  const router = useRouter();
  const isMobile = useIsMobile();
  const KIWOOM_API_BASE_URL = process.env.NEXT_PUBLIC_KIWOOM_API_URL;

  // Data Fetching and WebSocket Logic (remains the same)
  useEffect(() => {
    const fetchInitialStockData = async () => {
      if (!KIWOOM_API_BASE_URL) { setIsLoading(false); setFetchError(true); return; }
      // Fetching logic...
      try {
        const response = await fetch(`${KIWOOM_API_BASE_URL}/api/all-companies`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const result = await response.json();
        if (result.success) setStockData(result.data); else setFetchError(true);
      } catch { setFetchError(true); }
      finally { setIsLoading(false); }
    };
    fetchInitialStockData();
  }, [KIWOOM_API_BASE_URL]);
  // WebSocket logic would be here...

  const title = "대한민국 투자 플랫폼";

  return (
    <div className={`min-h-screen bg-[#0A0F1A] text-gray-100 font-sans ${isMobile ? 'pb-16' : ''}`}>
      <AuroraBackground />
      
      <header className="sticky top-0 z-50 p-4 sm:p-5 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <motion.h1 
          className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-slate-200 to-slate-400">{title}</span>
          <span className={`relative flex h-3 w-3 ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </span>
        </motion.h1>
      </header>
      
      <main className="max-w-screen-xl mx-auto p-4 sm:p-5 lg:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {!isMobile && (
            <div className="flex justify-center">
              <TabsList className="bg-slate-900/70 backdrop-blur-xl border border-white/10 p-2 rounded-xl">
                <TabsTrigger value="explorer"><ChartLine className="mr-2 h-4 w-4" />기업 탐색기</TabsTrigger>
                <TabsTrigger value="news"><Newspaper className="mr-2 h-4 w-4" />실시간 뉴스</TabsTrigger>
                <TabsTrigger value="tools"><Calculator className="mr-2 h-4 w-4" />투자 분석 도구</TabsTrigger>
                <TabsTrigger value="dailyPlan"><CalendarDays className="mr-2 h-4 w-4" />일일 계획</TabsTrigger>
                <TabsTrigger value="portfolio"><DollarSign className="mr-2 h-4 w-4" />포트폴리오</TabsTrigger>
                <TabsTrigger value="psychology-research" onClick={() => router.push('/psychology-research')}><Brain className="mr-2 h-4 w-4" />심리 연구소</TabsTrigger>
              </TabsList>
            </div>
          )}
          
          <TabsContent value="explorer">
            <ContentWrapper><CompanyExplorer stockData={stockData} isLoading={isLoading} fetchError={fetchError} /></ContentWrapper>
          </TabsContent>
          <TabsContent value="news">
            <ContentWrapper><RealTimeNews /></ContentWrapper>
          </TabsContent>
          <TabsContent value="tools">
            <ContentWrapper><InvestmentCalculators /></ContentWrapper>
          </TabsContent>
          <TabsContent value="dailyPlan">
            <ContentWrapper><DailyInvestmentPlan /></ContentWrapper>
          </TabsContent>
          <TabsContent value="portfolio">
            <ContentWrapper>
              <div className="space-y-8">
                <WisePortfolio stockData={stockData} />
                <PortfolioCustomizer />
              </div>
            </ContentWrapper>
          </TabsContent>
        </Tabs>
      </main>

      {isMobile && <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
}