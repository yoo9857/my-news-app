'use client';

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartLine, Newspaper, Calculator, CalendarDays, DollarSign, Brain } from "lucide-react";
import CompanyExplorer from "@/components/company-explorer";
import RealTimeNews from "@/components/real-time-news";
import InvestmentCalculators from "@/components/InvestmentCalculators";
import DailyInvestmentPlan from "@/components/daily-plan";
import WisePortfolio from "@/components/wise-portfolio";
import PortfolioCustomizer from "@/components/portfolio-customizer";
import { useIsMobile } from '@/hooks/use-mobile';
import MobileBottomNav from '@/components/mobile-bottom-nav';
import { StockInfo, NewsItem } from '@/lib/types';

const AuroraBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-[#1A202C] via-[#2D3748] to-[#2C5282] opacity-50"></div>
  </div>
);

const ContentWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, delay: 0.2 }}
    className="relative z-10 mt-8"
  >
    {children}
  </motion.div>
);

export default function KoreanStockPlatform() {
  const [activeTab, setActiveTab] = useState("explorer");
  
  const isMobile = useIsMobile();

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
          {/* Socket connection status indicator can be removed or moved to relevant components */}
          {/* <span className={`relative flex h-3 w-3 ${isSocketConnected ? 'text-green-500' : 'text-red-500'}`}>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSocketConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </span> */}
        </motion.h1>
      </header>
      
      <main className="max-w-screen-xl mx-auto p-4 sm:p-5 lg:p-8 relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {!isMobile && (
            <div className="flex justify-center mb-8">
              <TabsList className="bg-slate-900/70 backdrop-blur-xl border border-white/10 p-2 rounded-xl">
                <TabsTrigger value="explorer"><ChartLine className="mr-2 h-4 w-4" />기업 탐색기</TabsTrigger>
                <TabsTrigger value="news"><Newspaper className="mr-2 h-4 w-4" />실시간 뉴스</TabsTrigger>
                <TabsTrigger value="tools"><Calculator className="mr-2 h-4 w-4" />투자 분석 도구</TabsTrigger>
                <TabsTrigger value="dailyPlan"><CalendarDays className="mr-2 h-4 w-4" />일일 계획</TabsTrigger>
                <TabsTrigger value="portfolio"><DollarSign className="mr-2 h-4 w-4" />포트폴리오</TabsTrigger>
                <TabsTrigger value="psychology-research" asChild>
                  <a href="https://psychology.onedaytrading.net" target="_blank" rel="noopener noreferrer"><Brain className="mr-2 h-4 w-4" />심리 연구소</a>
                </TabsTrigger>
              </TabsList>
            </div>
          )}
          
          <TabsContent value="explorer">
            <ContentWrapper><CompanyExplorer /></ContentWrapper>
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
                <WisePortfolio />
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
