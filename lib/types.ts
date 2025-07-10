// lib/types.ts

// 키움증권 API로부터 받는 주식의 기본 정보
export interface StockInfo {
  stockCode: string;
  name: string;
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
  theme?: string; // 테마 정보는 이제 없으므로 옵셔널 처리
}

// 웹소켓을 통해 받는 실시간 시세 정보
export interface RealTimeStockData {
  stockCode: string;
  currentPrice: string;
  changeRate: string;
  change: string;
}