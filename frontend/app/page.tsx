'use client';

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, LogOut, LayoutDashboard, ChartLine, Newspaper, Calculator, CalendarDays, DollarSign, Brain } from "lucide-react";
import { navLinks } from "@/lib/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import CompanyExplorer from "@/components/company-explorer";
import RealTimeNews from "@/components/real-time-news";
import InvestmentCalculators from "@/components/InvestmentCalculators";
import DailyInvestmentPlan from "@/components/daily-plan";
import WisePortfolio from "@/components/wise-portfolio";
import PortfolioCustomizer from "@/components/portfolio-customizer";
import { useIsMobile } from '@/hooks/use-mobile';
import MobileBottomNav from '@/components/mobile-bottom-nav';
import { useAuth } from '@/context/AuthContext'; // Future-Proof: Centralized auth state
import CommunityContent from "@/components/community-content";

// --- UI Components for a Seamless Experience ---

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

// Component for handling authentication display logic in the header
const AuthSection = () => {
  const { user, isLoading, logout } = useAuth();

  // 1. Loading State: Prevents UI flicker and provides feedback (Seamless UX)
  if (isLoading) {
    return <div className="h-10 w-24 bg-slate-800 rounded-full animate-pulse" />;
  }

  // 2. Logged-in State: User-centric UI with future-proof menu items
  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-auto px-4 rounded-full flex items-center gap-2 hover:bg-slate-700/50">
            <Avatar className="h-8 w-8 border-2 border-slate-500">
              <AvatarImage src={user.avatar_url || undefined} alt={user.username || user.email} />
              <AvatarFallback>{user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline font-semibold text-slate-200">{user.username || user.email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 text-slate-200" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.username}</p>
              <p className="text-xs leading-none text-slate-400">
                Welcome back!
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-700" />
          {/* Future-Proof: Links for upcoming features */}
          <DropdownMenuItem asChild className="cursor-pointer focus:bg-slate-700">
            <Link href="/profile"><User className="mr-2 h-4 w-4" /><span>Profile</span></Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer focus:bg-slate-700">
            <Link href="/settings/notifications"><LayoutDashboard className="mr-2 h-4 w-4" /><span>Settings</span></Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-slate-700" />
          <DropdownMenuItem onClick={logout} className="cursor-pointer focus:bg-slate-700 focus:text-red-400">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // 3. Logged-out State: Clear calls to action
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" className="rounded-full border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white">
        <Link href="/login">Log In</Link>
      </Button>
      <Button asChild className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white">
        <Link href="/register">Sign Up</Link>
      </Button>
    
    </div>
  );
};


export default function KoreanStockPlatform() {
  const [activeTab, setActiveTab] = useState("explorer");
  const isMobile = useIsMobile();
  const title = "OneDayTrading";

  return (
    <div className={`min-h-screen bg-[#0A0F1A] text-gray-100 font-sans ${isMobile ? 'pb-16' : ''}`}>
      <AuroraBackground />
      
      <header className="sticky top-0 z-50 p-4 sm:p-5 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          <motion.h1 
            className="text-xl sm:text-2xl font-bold text-white flex items-center gap-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="bg-clip-text text-transparent bg-gradient-to-br from-slate-200 to-slate-400">{title}</Link>
          </motion.h1>
          {/* Security First: The AuthSection component encapsulates all auth-related UI logic */}
          <AuthSection />
        </div>
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
                <TabsTrigger value="community"><CalendarDays className="mr-2 h-4 w-4" />커뮤니티</TabsTrigger>
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
          <TabsContent value="community">
            <ContentWrapper><CommunityContent /></ContentWrapper>
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
                
