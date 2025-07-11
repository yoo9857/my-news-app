// lib/types.ts

// 주식 정보 타입
export interface StockInfo {
  stockCode: string;
  name: string;
  market: string; // 시장 구분 (KOSPI, KOSDAQ)
  marketCap: string;
  per: string;
  volume: string;
  currentPrice: string;
  highPrice: string;
  lowPrice: string;
  openingPrice: string;
  change: string;
  changeRate: string;
  previousClose: string;
}

// 실시간 주식 시세 타입
export interface RealTimeStockData {
  stockCode: string;
  currentPrice: string;
  changeRate: string;
  change: string;
}

// 뉴스 정보 타입
export interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
  sentiment: "긍정적" | "부정적" | "중립적";
  relatedCompanies: string[];
  imageUrl?: string;
}