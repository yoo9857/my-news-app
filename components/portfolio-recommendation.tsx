'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, Swords, Zap, Gem, Briefcase } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// --- Data ---
const samplePortfolios = {
  conservative: [
    { id: 1, name: "삼성전자", type: "대형주", weight: 30, icon: <Gem size={20} className="text-blue-400" /> },
    { id: 2, name: "KB금융", type: "금융주", weight: 25, icon: <Briefcase size={20} className="text-green-400" /> },
    { id: 3, name: "POSCO홀딩스", type: "가치주", weight: 20, icon: <Shield size={20} className="text-gray-400" /> },
    { id: 4, name: "한국전력", type: "배당주", weight: 15, icon: <Zap size={20} className="text-yellow-400" /> },
    { id: 5, name: "현금", type: "안전자산", weight: 10, icon: <Shield size={20} className="text-gray-400" /> },
  ],
  moderate: [
    { id: 1, name: "SK하이닉스", type: "반도체", weight: 35, icon: <Gem size={20} className="text-blue-400" /> },
    { id: 2, name: "NAVER", type: "플랫폼", weight: 25, icon: <Zap size={20} className="text-yellow-400" /> },
    { id: 3, name: "셀트리온", type: "바이오", weight: 20, icon: <Briefcase size={20} className="text-green-400" /> },
    { id: 4, name: "삼성전자", type: "대형주", weight: 10, icon: <Shield size={20} className="text-gray-400" /> },
    { id: 5, name: "현금", type: "안전자산", weight: 10, icon: <Shield size={20} className="text-gray-400" /> },
  ],
  aggressive: [
    { id: 1, name: "엔씨소프트", type: "게임", weight: 30, icon: <Swords size={20} className="text-red-400" /> },
    { id: 2, name: "카카오", type: "플랫폼", weight: 25, icon: <Zap size={20} className="text-yellow-400" /> },
    { id: 3, name: "삼성바이오", type: "바이오", weight: 20, icon: <Briefcase size={20} className="text-green-400" /> },
    { id: 4, name: "에코프로비엠", type: "2차전지", weight: 15, icon: <Gem size={20} className="text-blue-400" /> },
    { id: 5, name: "SK하이닉스", type: "반도체", weight: 10, icon: <Shield size={20} className="text-gray-400" /> },
  ],
};

// --- Animation Variants ---
const containerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 100 } }
};

const WisePortfolio: React.FC = () => {
  const [riskTolerance, setRiskTolerance] = useState<number[]>([50]);
  const [recommendedPortfolio, setRecommendedPortfolio] = useState<any[] | null>(null);
  const { toast } = useToast();

  const riskProfile = useMemo(() => {
    const risk = riskTolerance[0];
    if (risk < 30) return { name: '안정형', icon: <Shield className="text-blue-400" />, color: "text-blue-400" };
    if (risk < 70) return { name: '중립형', icon: <Briefcase className="text-yellow-400" />, color: "text-yellow-400" };
    return { name: '공격형', icon: <Swords className="text-red-400" />, color: "text-red-400" };
  }, [riskTolerance]);

  const handleRecommendPortfolio = () => {
    const risk = riskTolerance[0];
    let portfolio;
    if (risk < 30) portfolio = samplePortfolios.conservative;
    else if (risk < 70) portfolio = samplePortfolios.moderate;
    else portfolio = samplePortfolios.aggressive;
    
    setRecommendedPortfolio(portfolio);
    toast({
      title: "포트폴리오 추천 완료",
      description: `선택하신 '${riskProfile.name}' 성향에 맞는 포트폴리오입니다.`,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Risk Setting */}
      <motion.div className="lg:col-span-1" variants={itemVariants}>
        <Card className="bg-slate-800/50 border-slate-700 h-full">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2">
              {riskProfile.icon}
              <CardTitle className={`text-lg font-semibold ${riskProfile.color}`}>{riskProfile.name}</CardTitle>
            </div>
            <CardDescription className="text-sm text-slate-400">나의 투자 성향 설정</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center items-center space-y-6 pt-4">
            <div className="w-full px-4">
              <Slider
                id="risk-tolerance"
                min={0}
                max={100}
                step={1}
                value={riskTolerance}
                onValueChange={setRiskTolerance}
                className="[&>span:first-child]:bg-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>안정</span>
                <span>중립</span>
                <span>공격</span>
              </div>
            </div>
            <Button onClick={handleRecommendPortfolio} className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold group">
              포트폴리오 추천받기
              <Gem className="ml-2 h-4 w-4 group-hover:animate-pulse" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Right Column: Recommended Portfolio */}
      <motion.div className="lg:col-span-2" variants={itemVariants}>
        <Card className="bg-slate-800/50 border-slate-700 h-full">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-300">추천 포트폴리오</CardTitle>
            <CardDescription className="text-sm text-slate-400">나만의 투자 조합을 확인하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            {recommendedPortfolio ? (
              <motion.div 
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence>
                  {recommendedPortfolio.map((item) => (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      layout
                      className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 text-center flex flex-col items-center justify-center aspect-square hover:border-indigo-500/50 transition-colors"
                    >
                      <div className="mb-2">{item.icon}</div>
                      <p className="font-semibold text-slate-200 text-sm">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.type}</p>
                      <p className="text-lg font-bold text-indigo-400 mt-2">{item.weight}%</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="text-center py-16">
                <p className="text-slate-400">투자 성향을 설정하고 버튼을 눌러</p>
                <p className="text-sm text-slate-500 mt-2">나만의 포트폴리오를 추천받으세요.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default WisePortfolio;
