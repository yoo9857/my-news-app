'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Shield, TrendingUp, Zap, Gem, Briefcase, Swords, Rocket, Star, Info, Settings, Target } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { StockInfo } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- Data & Types ---
const portfolioStrategies = [
    {
      level: 1, name: '원금 보존 추구 (매우 안전)', displayName: '원금 보존 (매우 안전)', icon: ShieldCheck, color: "text-cyan-400",
      algorithm: "단기 우량채권 고정 비중 및 만기 보유 전략",
      assets: [{ type: '개별 채권', detail: "만기일 '2027년 6월' 전후, 신용등급 'AAA' 또는 'AA+'" }, { type: 'ETF', detail: "KODEX 단기채권, TIGER 단기통안채" }],
      guidance: ["매월 말 목표 비��(예: 90%)에서 ±3% 이상 벗어날 때만 리밸런싱", "ISA 계좌를 활용한 절세 고려"],
      goldenRule: { title: "만기 보유의 마법을 믿어라", description: "중간에 채권 가격이 하락하더라도 만기까지 보유하면 원금과 약속된 이자를 모두 받을 수 있습니다. 시장의 소음으로부터 당신의 자산을 지키는 가장 강력한 방패입니다." }
    },
    {
      level: 2, name: '시장금리 + α 추구 (안전)', displayName: '시장금리+α (안전)', icon: Shield, color: "text-blue-400",
      algorithm: "역변동성 가중치 기반 리스크 패리티",
      assets: [{ type: '주식', detail: "KODEX 200" }, { type: '채권', detail: "KODEX 국고채3년" }, { type: '대체', detail: "KODEX 골드선물(H)" }],
      guidance: ["60일 변동성을 계산하여 비중 조절 (비중 = (1/변동성) / Σ(1/변동성))"],
      goldenRule: { title: "최대 비중의 족쇄를 채워라", description: "어떤 경우에도 단일 자산의 최대 비중은 40%를 넘지 않도록 제약조건을 추가하여 의도치 않은 집중투자를 방지합니다." }
    },
    {
      level: 3, name: '시장 안정성 + 개인적 확신 (중립 안전)', displayName: '안정성 + 확신 (중립 안전)', icon: Briefcase, color: "text-teal-400",
      algorithm: "보���적 관점을 적용한 블랙-리터만 모델",
      assets: [{ type: '섹터 주식', detail: "TIGER 200 IT" }, { type: '시장 주식', detail: "KODEX 200" }, { type: '채권', detail: "KOSEF 국고채10년" }],
      guidance: ["'IT 섹터가 KOSPI 200보다 1.5% 초과수익' 등 개인의 관점을 행렬 P, Q로 변환하여 모델에 입력", "Python의 PyPortfolioOpt 라이브러리 활용"],
      goldenRule: { title: "소수의견의 원칙을 지켜라", description: "동시에 적용하는 '관점(View)'의 개수는 3개를 넘지 않도록 하여 모델의 과도한 복잡성과 개인 편향을 방지합니다." }
    },
    {
      level: 4, name: '위험-수익 균형 추구 (중립)', displayName: '위험-수익 균형 (중립)', icon: TrendingUp, color: "text-yellow-400",
      algorithm: "제약조건을 추가한 평균-분산 최적화",
      assets: [{ type: '자산군', detail: "KOSPI/KOSDAQ 시총 상위 50개 종목, 섹터 ETF 등" }],
      guidance: ["과최적화 방지를 위해 In-Sample/Out-of-Sample 테스트 수행"],
      goldenRule: { title: "최소 분산의 방패를 들어라", description: "미래 기대수익률 예측을 포기하고, 변동성과 상관관계만을 이용해 '최소 분산 포트폴리오'를 구성하는 것이 예측 오류를 원천 차단하는 가장 현실적��� 대안입니다." }
    },
    {
      level: 5, name: '성장 테마 집중 투자 (중립 공격)', displayName: '성장 테마 집중 (중립 공격)', icon: Zap, color: "text-orange-400",
      algorithm: "계층적 리스크 패리티 (HRP)",
      assets: [{ type: '테마 자산', detail: "특정 테마(예: AI, 로봇) 관련 종목 20~30개" }],
      guidance: ["riskfolio-lib Python 라이브러리 활용"],
      goldenRule: { title: "테마 순환의 파도를 타라", description: "분기별로 테마의 뉴스량, 거래대금 등을 점검하여 시장의 관심이 식었다고 판단되면 테마 자체를 교체하는 것을 고려합니다." }
    },
    {
      level: 6, name: '시장 추세 적극 활용 (공격)', displayName: '시장 추세 활용 (공격)', icon: Swords, color: "text-red-400",
      algorithm: "월간 듀얼 모멘텀",
      assets: [{ type: '위험자산', detail: "KODEX 200, TIGER 미국S&P500 등" }, { type: '안전자산', detail: "KODEX 단기채권" }],
      guidance: ["매월 말 절대/상대 모멘텀 스코어를 계산하여 다음 달 포트폴리오 구성"],
      goldenRule: { title: "3연속 손실의 멈춤 신호를 존중하라", description: "월간 리밸런싱 결과 3개월 연속 손실 시, 4개월 차에는 100% 안전자산으로 전환 후 한 달간 쉬어 횡보장 손실을 방어합니다." }
    },
    {
      level: 7, name: '변동성을 이용한 수익 극대화 (매우 공격)', displayName: '수익 극대화 (매우 공격)', icon: Rocket, color: "text-fuchsia-500",
      algorithm: "목표 변동성 기반의 레버리지 동적 조절",
      assets: [{ type: '파생/레버리지', detail: "KOSPI 200 선물, KODEX 레버리지, KODEX 인버스2X" }],
      guidance: ["슬리피지, 경로 의존성 등 현실적 위험을 반드시 인지해야 함"],
      goldenRule: { title: "최대 손실폭(MDD)의 방아쇠는 신성불가침이다", description: "총자산이 고점 대비 -20% 도달 시, 모든 위험자산을 즉시 청산하고 최소 1개월 이상 투자를 중단하는 규칙을 최우선으로 설정합니다." }
    }
];

interface WisePortfolioProps {
  stockData: StockInfo[];
}
interface ScoredStock extends StockInfo {
  stabilityScore: number;
  growthScore: number;
  finalScore: number;
}
interface RecommendedStock extends StockInfo {
  reason: string;
}

// --- Algorithm Simulation ---
const calculateScores = (stock: StockInfo): { stabilityScore: number; growthScore: number } => {
  const marketCap = parseInt(stock.marketCap || '0', 10);
  const per = parseFloat(stock.per || '0');
  const volume = parseInt(stock.volume || '0', 10);

  let stabilityScore = 0;
  if (stock.market === 'KOSPI') stabilityScore += 20;
  if (marketCap > 100000) stabilityScore += 50; // 10조 이상
  else if (marketCap > 10000) stabilityScore += 30; // 1조 이상
  if (per > 0 && per < 15) stabilityScore += 30; // 저평가

  let growthScore = 0;
  if (stock.market === 'KOSDAQ') growthScore += 20;
  if (volume > 1000000) growthScore += 20; // 거래량 활발
  if (per > 25) growthScore += 30; // 고성장 기대
  if (marketCap < 5000 && marketCap > 1000) growthScore += 30; // 중소형주

  return { stabilityScore, growthScore };
};

const generateRecommendations = (level: number, stocks: StockInfo[]): RecommendedStock[] => {
  if (!stocks || stocks.length === 0) return [];

  const scoredStocks: ScoredStock[] = stocks
    .map(s => {
      const { stabilityScore, growthScore } = calculateScores(s);
      return { ...s, stabilityScore, growthScore, finalScore: 0 };
    })
    .filter(s => s.per && parseFloat(s.per) > 0);

  let recommendations: ScoredStock[] = [];

  switch (level) {
    case 1: // 안정성 최상위
      recommendations = scoredStocks.sort((a, b) => b.stabilityScore - a.stabilityScore);
      break;
    case 2: // 안정성 + 성장성 균형
      recommendations = scoredStocks.map(s => ({...s, finalScore: s.stabilityScore * 0.7 + s.growthScore * 0.3})).sort((a, b) => b.finalScore - a.finalScore);
      break;
    case 3: // KOSPI 대형주 + KOSDAQ 기술주
      const kospiGiants = scoredStocks.filter(s => s.market === 'KOSPI').sort((a, b) => b.stabilityScore - a.stabilityScore).slice(0, 3);
      const kosdaqTech = scoredStocks.filter(s => s.market === 'KOSDAQ' && (s.name.includes('IT') || s.name.includes('소프트') || s.name.includes('AI'))).sort((a, b) => b.growthScore - a.growthScore).slice(0, 2);
      recommendations = [...kospiGiants, ...kosdaqTech];
      break;
    case 4: // 안정성/성장성 조화
      recommendations = scoredStocks.map(s => ({...s, finalScore: s.stabilityScore * 0.5 + s.growthScore * 0.5})).sort((a, b) => b.finalScore - a.finalScore);
      break;
    case 5: // 성장 테마 집중
      recommendations = scoredStocks.map(s => ({...s, finalScore: s.growthScore * 0.8 + s.stabilityScore * 0.2})).sort((a, b) => b.finalScore - a.finalScore);
      break;
    case 6: // 모멘텀(거래량) + 성장성
      recommendations = scoredStocks.map(s => ({...s, finalScore: s.growthScore + (parseInt(s.volume) / 100000)})).sort((a, b) => b.finalScore - a.finalScore);
      break;
    case 7: // 성장 잠재력 극대화 (소형주)
      recommendations = scoredStocks.filter(s => parseInt(s.marketCap) < 2000).sort((a, b) => b.growthScore - a.growthScore);
      break;
    default:
      recommendations = scoredStocks;
  }

  return recommendations.slice(0, 5).map(s => ({ ...s, reason: `안정성 ${s.stabilityScore} / 성장성 ${s.growthScore}` }));
};


// --- UI Components ---
const WisePortfolio: React.FC<WisePortfolioProps> = ({ stockData }) => {
  const [riskTolerance, setRiskTolerance] = useState<number[]>([4]);
  const [selectedStrategy, setSelectedStrategy] = useState<typeof portfolioStrategies[0] | null>(null);
  const [recommendedStocks, setRecommendedStocks] = useState<RecommendedStock[] | null>(null);
  const { toast } = useToast();

  const currentProfile = useMemo(() => portfolioStrategies[riskTolerance[0] - 1], [riskTolerance]);

  const handleRecommendPortfolio = () => {
    setSelectedStrategy(currentProfile);
    const recommendations = generateRecommendations(currentProfile.level, stockData);
    setRecommendedStocks(recommendations);
    toast({
      title: "투자 전략 및 포트폴리오 생성 완료",
      description: `선택하신 '${currentProfile.name}' 성향에 맞는 가이드와 추천 예시가 준비되었습니다.`,
    });
  };

  const InfoCard = ({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => (
    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 h-full">
      <div className="flex items-center mb-3"><Icon className="h-5 w-5 mr-2 text-indigo-400" /><h3 className="font-semibold text-slate-200 text-md">{title}</h3></div>
      <div className="text-sm text-slate-400 space-y-2">{children}</div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Control Panel */}
        <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700 h-full">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-3 flex-nowrap">
              <currentProfile.icon size={22} className={`${currentProfile.color} flex-shrink-0`} />
              <CardTitle className={`text-xl font-semibold truncate ${currentProfile.color}`}>{currentProfile.displayName}</CardTitle>
            </div>
            <CardDescription className="text-sm text-slate-400 pt-1">나의 투자 위험도 설정 (1~7단계)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center items-center space-y-6 pt-4">
            <div className="w-full px-4">
              <Slider value={riskTolerance} onValueChange={setRiskTolerance} min={1} max={7} step={1} className="[&>span:first-child]:bg-indigo-600" />
              <div className="flex justify-between text-xs text-slate-500 mt-2"><span>매우 안정</span><span>중립</span><span>매우 공격</span></div>
            </div>
            <Button onClick={handleRecommendPortfolio} className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold group">투자 전략 가이드 보기<Gem className="ml-2 h-4 w-4 group-hover:animate-pulse" /></Button>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-8">
          {selectedStrategy ? (
            <motion.div key={selectedStrategy.level} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader><CardTitle className="text-lg font-semibold text-slate-300">단계별 투자 전략 가이드</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-br from-yellow-500/20 to-slate-900/10 p-5 rounded-lg border-2 border-yellow-400/50 shadow-lg">
                    <div className="flex items-center mb-3"><Star className="h-6 w-6 mr-3 text-yellow-400 animate-pulse" /><h2 className="text-xl font-bold text-yellow-300">{selectedStrategy.goldenRule.title}</h2></div>
                    <p className="text-yellow-200/90 text-sm leading-relaxed">{selectedStrategy.goldenRule.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoCard icon={Settings} title="알고리즘"><p>{selectedStrategy.algorithm}</p></InfoCard>
                    <InfoCard icon={Target} title="구체적 자산"><ul className="space-y-2">{selectedStrategy.assets.map(asset => (<li key={asset.type}><span className="font-semibold text-slate-300">{asset.type}:</span> {asset.detail}</li>))}</ul></InfoCard>
                  </div>
                  <InfoCard icon={Info} title="세부 실행 지침"><ul className="list-disc list-inside space-y-1">{selectedStrategy.guidance.map((g, i) => <li key={i}>{g}</li>)}</ul></InfoCard>
                </CardContent>
              </Card>

              {recommendedStocks && recommendedStocks.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.3 } }}>
                  <Card className="bg-slate-800/50 border-slate-700 mt-8">
                    <CardHeader><CardTitle className="text-lg font-semibold text-slate-300">포트폴리오 추천 예시</CardTitle><CardDescription className="text-sm text-slate-400">위 전략에 따라 생성된 5개 종목 예시입니다. (실제 투자 추천이 아닙니다)</CardDescription></CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {recommendedStocks.map(stock => (
                          <li key={stock.stockCode} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-md border border-slate-700/50">
                            <div>
                              <p className="font-semibold text-indigo-400">{stock.name} <span className="text-xs text-slate-500">({stock.stockCode})</span></p>
                              <p className="text-xs text-slate-400">{stock.reason}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-slate-200">{parseInt(stock.currentPrice, 10).toLocaleString()}원</p>
                              <p className={`text-xs font-semibold ${parseFloat(stock.changeRate) > 0 ? 'text-green-400' : parseFloat(stock.changeRate) < 0 ? 'text-red-400' : 'text-slate-500'}`}>{stock.changeRate}%</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full rounded-lg bg-slate-800/30 border-2 border-dashed border-slate-700">
              <div className="text-center">
                <p className="text-slate-400">투자 성향을 설정하고 버튼을 눌러</p>
                <p className="text-sm text-slate-500 mt-2">단계별 투자 전략과 포트폴리오 예시를 확인하세요.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default WisePortfolio;