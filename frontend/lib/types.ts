// lib/types.ts

export interface StockInfo {
  code: string;
  name: string;
  market: string;
  currentPrice: number;
  change_rate: number;
  volume: number;
  market_cap: number;
  high_price: number;
  low_price: number;
  open_price: number;
}

export interface RealTimeStockData {
  code: string;
  price: number;
  change_rate: number;
}

export interface NewsItem {
  id?: string; // Optional as it might not exist on new items
  title: string;
  url: string;
  source: string;
  published_at: string;
  sentiment_score?: number;
  sentiment_label?: string;
  content?: string;
  created_at?: string;
  
  link: string;
  sentiment?: "긍정적" | "부정적" | "중립적"; // Keep for compatibility
}