// components/portfolio-recommendation.tsx
'use client'; // 클라이언트 컴포넌트임을 명시합니다.

import React, { useState } from 'react'; // useState를 사용하므로 임포트합니다.
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast"; // 토스트 알림을 위해 추가

// 포트폴리오 추천 로직을 위한 예시 데이터
const samplePortfolios = {
  conservative: [
    { name: "삼성전자 (005930)", type: "대형주", weight: 30, expectedReturn: "5-7%", risk: "낮음" },
    { name: "KB금융 (105560)", type: "금융주", weight: 25, expectedReturn: "6-8%", risk: "낮음" },
    { name: "POSCO홀딩스 (005490)", type: "가치주", weight: 20, expectedReturn: "4-6%", risk: "보통" },
    { name: "한국전력공사 (015760)", type: "배당주/공기업", weight: 15, expectedReturn: "3-5%", risk: "낮음" },
    { name: "현금", type: "안전자산", weight: 10, expectedReturn: "0-1%", risk: "매우 낮음" },
  ],
  moderate: [
    { name: "SK하이닉스 (000660)", type: "반도체", weight: 35, expectedReturn: "10-15%", risk: "보통" },
    { name: "NAVER (035420)", type: "인터넷/플랫폼", weight: 25, expectedReturn: "8-12%", risk: "보통" },
    { name: "셀트리온 (068270)", type: "바이오", weight: 20, expectedReturn: "12-18%", risk: "높음" },
    { name: "삼성전자 (005930)", type: "대형주", weight: 10, expectedReturn: "5-7%", risk: "낮음" },
    { name: "현금", type: "안전자산", weight: 10, expectedReturn: "0-1%", risk: "매우 낮음" },
  ],
  aggressive: [
    { name: "엔씨소프트 (036570)", type: "게임/성장주", weight: 30, expectedReturn: "15-25%", risk: "매우 높음" },
    { name: "카카오 (035720)", type: "플랫폼/성장주", weight: 25, expectedReturn: "12-20%", risk: "높음" },
    { name: "삼성바이오로직스 (207940)", type: "바이오/CDMO", weight: 20, expectedReturn: "10-18%", risk: "높음" },
    { name: "에코프로비엠 (247540)", type: "2차전지 소재", weight: 15, expectedReturn: "20-30%", risk: "매우 높음" },
    { name: "SK하이닉스 (000660)", type: "반도체", weight: 10, expectedReturn: "10-15%", risk: "보통" },
  ],
};

const WisePortfolio: React.FC = () => {
  const [riskTolerance, setRiskTolerance] = useState<number[]>([50]); // 0-100 스케일
  const [recommendedPortfolio, setRecommendedPortfolio] = useState<any[] | null>(null);
  const { toast } = useToast();

  const getPortfolioRecommendation = (risk: number) => {
    if (risk < 30) {
      return samplePortfolios.conservative;
    } else if (risk < 70) {
      return samplePortfolios.moderate;
    } else {
      return samplePortfolios.aggressive;
    }
  };

  const handleRecommendPortfolio = () => {
    const portfolio = getPortfolioRecommendation(riskTolerance[0]);
    setRecommendedPortfolio(portfolio);
    toast({
      title: "포트폴리오 추천 완료",
      description: `선택하신 위험 감수 수준에 맞는 포트폴리오를 추천했습니다.`,
      variant: "default",
    });
  };

  return (
    <Card className="bg-gray-800 text-gray-100 border-gray-700">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white">현명한 포트폴리오 추천</CardTitle>
        <CardDescription className="text-gray-400">
          사용자님의 투자 성향에 맞춰 한국 주식 시장에 특화된 포트폴리오를 제안합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 위험 감수 수준 설정 */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">투자 위험 감수 수준</h3>
          <Label htmlFor="risk-tolerance" className="text-gray-300 mb-2 block">
            낮음 ({riskTolerance[0]}%) 높음
          </Label>
          <Slider
            id="risk-tolerance"
            min={0}
            max={100}
            step={1}
            value={riskTolerance}
            onValueChange={setRiskTolerance}
            className="w-full [&>span:first-child]:bg-blue-600 [&>span:first-child]:hover:bg-blue-700 [&>span:first-child>span]:bg-blue-600 [&>span:first-child>span]:hover:bg-blue-700"
          />
          <p className="text-sm text-gray-400 mt-2">
                위험 감수 수준을 조절하여 투자 성향에 맞는 포트폴리오를 추천받으세요.
                (낮음: 0-29%, 보통: 30-69%, 높음: 70-100%)
            </p>
            <Button onClick={handleRecommendPortfolio} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors duration-200">
                포트폴리오 추천받기
            </Button>
        </div>

        <Separator className="bg-gray-700" />

        {/* 추천 포트폴리오 */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">추천 포트폴리오 구성</h3>
          {recommendedPortfolio ? (
            // 이 div에 overflow-x-auto 클래스를 추가하여 가로 스크롤을 활성화하고 hide-scrollbar를 추가하여 스크롤바를 숨깁니다.
            <div className="overflow-x-auto rounded-lg border border-[#3C4A5C] shadow-md hide-scrollbar">
              <Table>
                <TableHeader className="bg-[#2A3445]">
                  <TableRow className="border-gray-600">
                    <TableHead className="text-gray-300 min-w-[120px] py-3 px-4">종목명</TableHead>
                    <TableHead className="text-gray-300 min-w-[80px] py-3 px-4">유형</TableHead>
                    <TableHead className="text-gray-300 min-w-[60px] py-3 px-4">비중</TableHead>
                    <TableHead className="text-gray-300 min-w-[100px] py-3 px-4">예상 수익률</TableHead>
                    <TableHead className="text-gray-300 min-w-[80px] py-3 px-4">위험도</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recommendedPortfolio.map((item, index) => (
                    <TableRow key={index} className="border-gray-700 hover:bg-gray-700/50">
                      <TableCell className="font-medium text-white whitespace-nowrap py-3 px-4">{item.name}</TableCell>
                      <TableCell className="text-gray-300 whitespace-nowrap py-3 px-4">{item.type}</TableCell>
                      <TableCell className="text-blue-400 font-semibold whitespace-nowrap py-3 px-4">{item.weight}%</TableCell>
                      <TableCell className="text-green-400 whitespace-nowrap py-3 px-4">{item.expectedReturn}</TableCell>
                      <TableCell className="text-red-400 whitespace-nowrap py-3 px-4">{item.risk}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-4 text-sm text-gray-400 p-4">
                * 위 포트폴리오는 일반적인 투자 성향에 따른 예시이며, 실제 투자 추천이 아닙니다.
                투자 결정은 개인의 판단과 책임 하에 이루어져야 합니다.
              </p>
            </div>
          ) : (
            <p className="text-gray-400 text-center">
              위험 감수 수준을 설정하고 '포트폴리오 추천받기' 버튼을 눌러보세요.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WisePortfolio;
