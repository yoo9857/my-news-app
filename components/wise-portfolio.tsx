'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Shield, TrendingUp, Zap, Gem, Briefcase, Swords, Rocket } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { StockInfo } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- Interfaces ---
interface WisePortfolioProps {
  stockData: StockInfo[];
}
interface ScoredStock extends StockInfo {
  stabilityScore: number;
  growthScore: number;
}
interface RecommendedStock extends ScoredStock {
  reason: string;
  weight: number;
}

// --- Algorithm Core ---
const calculateScores = (company: StockInfo): { stabilityScore: number; growthScore: number } => {
  let stabilityScore = 0;
  let growthScore = 0;

  const marketCap = parseInt(company.marketCap || '0', 10);
  const per = parseFloat(company.per || '0');

  // 1. Market Cap Score
  if (marketCap > 100000) stabilityScore += 30; // 10조 이상
  else if (marketCap > 10000) stabilityScore += 20; // 1조 이상
  else if (marketCap > 1000) stabilityScore += 10; // 1000억 이상
  else growthScore += 10; // 소형주 성장 가능성

  // 2. PER Score
  if (per > 0 && per < 10) stabilityScore += 30; // 저평가 가치주
  else if (per >= 10 && per < 25) stabilityScore += 10;
  if (per > 30) growthScore += 20; // 고성장 기대주
  else if (per > 15) growthScore += 10;

  // 3. Market Score
  if (company.market === 'KOSPI') stabilityScore += 10;
  else if (company.market === 'KOSDAQ') growthScore += 20;

  return { stabilityScore, growthScore };
};

const generatePortfolio = (riskValue: number, stocks: StockInfo[]): RecommendedStock[] => {
  const minMarketCap = 1000; // 최소 시가총액 1000억원
  const filteredStocks = stocks.filter(s => s.per && parseFloat(s.per) > 0 && s.marketCap && parseInt(s.marketCap) > minMarketCap);

  const scoredStocks: ScoredStock[] = filteredStocks.map(s => ({
    ...s,
    ...calculateScores(s)
  }));

  const sortedByStability = [...scoredStocks].sort((a, b) => b.stabilityScore - a.stabilityScore);
  const sortedByGrowth = [...scoredStocks].sort((a, b) => b.growthScore - a.growthScore);

  let portfolio: { stock: ScoredStock; reason: string; weight: number }[] = [];
  const portfolioSize = 5;

  const pickStocks = (count: number, from: ScoredStock[], reason: string) => {
    const picked: ScoredStock[] = [];
    for (const stock of from) {
      if (picked.length >= count) break;
      if (!portfolio.some(p => p.stock.stockCode === stock.stockCode) && !picked.some(p => p.stockCode === stock.stockCode)) {
        picked.push(stock);
      }
    }
    return picked.map(s => ({ stock: s, reason, weight: 0 }));
  };

  if (riskValue <= 20) { // 매우 안정형
    portfolio = pickStocks(portfolioSize, sortedByStability, "최상위 가치주");
  } else if (riskValue <= 40) { // 안정형
    portfolio = [...pickStocks(3, sortedByStability, "가치주 앵커"), ...pickStocks(2, sortedByGrowth, "성장 잠재력")];
  } else if (riskValue <= 60) { // 중립형
    portfolio = [...pickStocks(3, sortedByStability, "안정적 기반"), ...pickStocks(2, sortedByGrowth, "성장 동력")];
  } else if (riskValue <= 80) { // 공격형
    portfolio = [...pickStocks(2, sortedByStability, "안정성 헤지"), ...pickStocks(3, sortedByGrowth, "핵심 성장주")];
  } else { // 매우 공격형
    portfolio = pickStocks(portfolioSize, sortedByGrowth, "고성장 기대주");
  }
  
  // Assign weights
  const totalWeight = 100;
  const weights = portfolio.map(p => p.reason.includes("핵심") || p.reason.includes("최상위") ? 2 : 1);
  const totalWeightRatio = weights.reduce((a, b) => a + b, 0);
  
  return portfolio.map((p, i) => ({
    ...p.stock,
    reason: p.reason,
    weight: Math.round((weights[i] / totalWeightRatio) * totalWeight)
  }));
};


// --- UI Components & Main Logic ---
const WisePortfolio: React.FC<WisePortfolioProps> = ({ stockData }) => {
  const [riskTolerance, setRiskTolerance] = useState<number[]>([50]);
  const [recommendedPortfolio, setRecommendedPortfolio] = useState<RecommendedStock[] | null>(null);
  const { toast } = useToast();

  const riskProfile = useMemo(() => {
    const risk = riskTolerance[0];
    if (risk <= 20) return { name: '매우 안정형', icon: <ShieldCheck size={22} />, color: "text-cyan-400" };
    if (risk <= 40) return { name: '안정형', icon: <Shield size={22} />, color: "text-blue-400" };
    if (risk <= 60) return { name: '중립형', icon: <Briefcase size={22} />, color: "text-yellow-400" };
    if (risk <= 80) return { name: '공격형', icon: <Swords size={22} />, color: "text-red-400" };
    return { name: '매우 공격형', icon: <Rocket size={22} />, color: "text-fuchsia-500" };
  }, [riskTolerance]);

  const handleRecommendPortfolio = () => {
    if (!Array.isArray(stockData) || stockData.length === 0) {
      toast({
        variant: "destructive",
        title: "데이터 부족",
        description: "종목 데이터가 로드되지 않아 포트폴리오를 생성할 수 없습니다.",
      });
      return;
    }
    const portfolio = generatePortfolio(riskTolerance[0], stockData);
    setRecommendedPortfolio(portfolio);
    toast({
      title: "포트폴리오 추천 완료",
      description: `선택하신 '${riskProfile.name}' 성향에 맞는 포트폴리오가 생성되었습니다.`,
    });
  };
  
  const formatValue = (value: string | undefined, prefix = '', suffix = '') => {
    if (!value) return 'N/A';
    const num = Number(value);
    if (isNaN(num)) return 'N/A';
    return `${prefix}${num.toLocaleString()}${suffix}`;
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700 h-full">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-3">
              {riskProfile.icon}
              <CardTitle className={`text-xl font-semibold ${riskProfile.color}`}>{riskProfile.name}</CardTitle>
            </div>
            <CardDescription className="text-sm text-slate-400 pt-1">나의 투자 위험도 설정</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center items-center space-y-6 pt-4">
            <div className="w-full px-4">
              <Slider value={riskTolerance} onValueChange={setRiskTolerance} className="[&>span:first-child]:bg-indigo-600" />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>매우 안정</span><span>중립</span><span>매우 공격</span>
              </div>
            </div>
            <Button onClick={handleRecommendPortfolio} className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold group">
              알고리즘 추천 받기
              <Gem className="ml-2 h-4 w-4 group-hover:animate-pulse" />
            </Button>
          </CardContent>
        </Card>

        <motion.div className="lg:col-span-2">
          <Card className="bg-slate-800/50 border-slate-700 h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-300">알고리즘 추천 포트폴리오</CardTitle>
              <CardDescription className="text-sm text-slate-400">데이터 기반으로 동적 생성된 포트폴리오입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {recommendedPortfolio ? (
                <motion.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" variants={containerVariants} initial="hidden" animate="visible">
                  <AnimatePresence>
                    {recommendedPortfolio.map((item) => (
                      <motion.div key={item.stockCode} variants={itemVariants} layout>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 h-full flex flex-col justify-between hover:border-indigo-500/50 transition-colors">
                              <div>
                                <div className="flex justify-between items-start">
                                  <p className="font-bold text-indigo-400 text-md truncate pr-2">{item.name}</p>
                                  <p className="text-2xl font-bold text-white">{item.weight}%</p>
                                </div>
                                <p className="text-xs text-slate-400 mb-3">{item.reason}</p>
                              </div>
                              <div className="text-left w-full space-y-1.5 text-xs mt-2">
                                <p className="flex justify-between items-center"><span className="text-slate-500">현재가</span><span className="font-mono text-slate-200">{formatValue(item.currentPrice, '₩')}</span></p>
                                <p className="flex justify-between items-center"><span className="text-slate-500">시가총액</span><span className="font-mono text-slate-200">{formatValue(item.marketCap, '', ' 억')}</span></p>
                                <p className="flex justify-between items-center"><span className="text-slate-500">PER</span><span className="font-mono text-slate-200">{formatValue(item.per, '', ' 배')}</span></p>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.name} ({item.stockCode}) - {item.market}</p>
                          </TooltipContent>
                        </Tooltip>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-slate-400">투자 성향을 설정하고 버튼을 눌러</p>
                  <p className="text-sm text-slate-500 mt-2">데이터 기반 포트폴리오를 추천받으세요.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </TooltipProvider>
  );
};

export default WisePortfolio;
