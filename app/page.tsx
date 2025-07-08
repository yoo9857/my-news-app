"use client"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Newspaper, Calculator, LineChartIcon as ChartLine } from "lucide-react"
import RealTimeNews from "@/components/real-time-news"
import CompanyExplorer from "@/components/company-explorer"
import SectorPerformanceChart from "@/components/SectorPerformanceChart"
import InvestmentCalculators from "@/components/InvestmentCalculators"
// 기업 데이터 (샘플)
const companyData = [
  {
    theme: "반도체 & IT",
    name: "삼성전자",
    reason: "글로벌 반도체/IT 산업의 절대강자, AI 시대의 핵심 플레이어",
    bull: "∙ HBM3E 등 AI 메모리 시장 주도권 확보<br>∙ GAA 공정 기반 파운드리 수주 확대<br>∙ 온디바이스 AI 기반 신규 디바이스 출시",
    bear: "∙ 메모리 업황의 주기적 변동(사이클) 리스크<br>∙ 미-중 기술 분쟁에 따른 지정학적 불확실성<br>∙ 파운드리/스마트폰 시장 경쟁 강도 심화",
  },
  {
    theme: "반도체 & IT",
    name: "SK하이닉스",
    reason: "AI 메모리 HBM 시장의 독보적 1위, 업황 턴어라운드 최대 수혜주",
    bull: "∙ AI 시장 성장에 따른 HBM 수요 폭증<br>∙ 주요 AI 칩 메이커(엔비디아 등)에 대한 독점적 공급 지위<br>∙ D램 가격 상승 사이클 진입 시 높은 이익 레버리지",
    bear: "∙ 경쟁사의 HBM 시장 진입에 따른 점유율 하락 우려<br>∙ 메모리 반도체에 편중된 사업 포트폴리오<br>∙ 대규모 설비투자(CAPEX)에 따른 재무 부담",
  },
  {
    theme: "2차전지",
    name: "LG에너지솔루션",
    reason: "글로벌 배터리 시장을 선도하는 Top-tier 기업",
    bull: "∙ 글로벌 완성차 다수를 고객사로 확보<br>∙ 북미/유럽 등 주요 시장 내 생산 능력 확대<br>∙ 차세대 배터리(전고체 등) 기술 개발",
    bear: "∙ 전기차 시장 성장 둔화(캐zem) 우려<br>∙ 원자재 가격 변동성 및 공급망 리스크<br>∙ 중국 배터리 업체와의 경쟁 심화",
  },
  {
    theme: "바이오 & 헬스케어",
    name: "삼성바이오로직스",
    reason: "글로벌 No.1 바이오의약품 CDMO 기업",
    bull: "∙ 폭발적인 CMO 수주 잔고 증가<br>∙ 4공장 조기 가동 및 5공장 증설 계획<br>∙ 바이오시밀러 자회사(삼성바이오에피스)의 고성장",
    bear: "∙ 글로벌 제약사의 바이오의약품 재고 조정<br>∙ 단일 사업(CDMO)에 편중된 포트폴리오<br>∙ 높은 밸류에이션 부담",
  },
  {
    theme: "자동차 & 자율주행",
    name: "현대자동차",
    reason: "내연기관에서 전기차, 수소차, 자율주행으로 성공적 전환 중인 글로벌 완성차 업체",
    bull: "∙ 전기차(아이오닉) 라인업의 글로벌 경쟁력 입증<br>∙ 주주환원 정책 강화(배당, 자사주 소각)<br>∙ 고수익 차종(제네시스, SUV) 판매 비중 확대",
    bear: "∙ 글로벌 자동차 수요 둔화 우려<br>∙ 노조와의 임단협 관련 불확실성<br>∙ 미-중 갈등 및 지정학적 리스크",
  },
  {
    theme: "신재생에너지 & 친환경",
    name: "한화솔루션",
    reason: "태양광, 화학, 소재를 아우르는 친환경 에너지 솔루션 기업",
    bull: "∙ 미국 태양광 시장 확대(IRA)의 직접적 수혜<br>∙ 태양광 밸류체인(폴리실리콘-셀-모듈) 수직계열화<br>∙ 안정적인 캐시카우 역할을 하는 화학 사업",
    bear: "∙ 중국의 저가 태양광 모듈 공세<br>∙ 화학 사업의 시황 변동성<br>∙ 대규모 투자에 따른 재무 부담",
  },
]

// 뉴스 데이터 (샘플)
const sampleNews = [
  {
    id: 1,
    title: "삼성전자, HBM3E 양산 본격화로 AI 메모리 시장 선점",
    summary:
      "삼성전자가 차세대 AI 메모리 반도체 HBM3E의 양산을 본격화하며 글로벌 AI 시장 공략에 나선다고 발표했습니다.",
    source: "매일경제",
    time: "2시간 전",
    sentiment: "긍정적",
    relatedCompanies: ["삼성전자"],
  },
  {
    id: 2,
    title: "LG에너지솔루션, 북미 배터리 공장 증설 계획 발표",
    summary: "LG에너지솔루션이 북미 지역 배터리 생산능력 확대를 위해 추가 투자를 단행한다고 밝혔습니다.",
    source: "한국경제",
    time: "4시간 전",
    sentiment: "긍정적",
    relatedCompanies: ["LG에너지솔루션"],
  },
  {
    id: 3,
    title: "현대차, 전기차 판매량 목표 상향 조정",
    summary: "현대자동차가 올해 전기차 판매 목표를 기존 계획보다 20% 상향 조정했다고 발표했습니다.",
    source: "연합뉴스",
    time: "6시간 전",
    sentiment: "긍정적",
    relatedCompanies: ["현대자동차"],
  },
]

const themes = [
  "전체",
  "반도체 & IT",
  "2차전지",
  "바이오 & 헬스케어",
  "자동차 & 자율주행",
  "신재생에너지 & 친환경",
  "방산 & 항공우주",
  "엔터 & 미디어",
  "금융 & 핀테크",
  "조선 & 해운",
  "화학 & 소재",
  "소비재 & 유통",
]

export default function KoreanStockPlatform() {
  const [activeTab, setActiveTab] = useState("news")

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* 헤더 */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <ChartLine className="h-8 w-8 text-blue-400 mr-3" />
              <h1 className="text-xl font-bold text-white">대한민국 투자 플랫폼</h1>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="explorer" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              기업 탐색기
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              실시간 뉴스
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              투자 분석 도구
            </TabsTrigger>
          </TabsList>

          {/* 기업 탐색기 탭 */}
          <TabsContent value="explorer" className="space-y-6">
            <CompanyExplorer />
          </TabsContent>

          {/* 실시간 뉴스 탭 */}
          <TabsContent value="news" className="space-y-6">
            <RealTimeNews />
          </TabsContent>

          {/* 투자 분석 도구 탭 */}
         {/* 투자 분석 도구 탭 */}
          <TabsContent value="tools" className="mt-6">
    <InvestmentCalculators />
</TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
