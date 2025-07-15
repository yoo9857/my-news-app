'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebouncedCallback } from 'use-debounce';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, TrendingUp, TrendingDown, Minus, RefreshCw, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewsItem } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 }
};

const SentimentBadge = ({ score, label }: { score: number, label: string }) => {
  const sentimentMap: { [key: string]: { icon: JSX.Element, color: string } } = {
    '긍정적': { icon: <TrendingUp size={12} />, color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    '부정적': { icon: <TrendingDown size={12} />, color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    '중립적': { icon: <Minus size={12} />, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  };
  const sentiment = sentimentMap[label] || sentimentMap['중립적'];
  return <Badge className={`flex items-center gap-1 text-xs px-2 py-0.5 ${sentiment.color}`}>{sentiment.icon}{label} ({score.toFixed(2)})</Badge>;
};

export default function RealTimeNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('전체');
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const newsSocketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchInitialNews = async () => {
      setIsLoading(true);
      setFetchError(false);
      try {
        const response = await fetch('http://localhost:8002/api/news?limit=50');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setNews(result.data);
        } else {
          setFetchError(true);
        }
      } catch (error) {
        console.error("Failed to fetch initial news data:", error);
        setFetchError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialNews();

    // WebSocket for real-time news updates
    if (!newsSocketRef.current) {
      const newsSocket = new WebSocket('ws://localhost:8002/ws/realtime-news');
      newsSocketRef.current = newsSocket;

      newsSocket.onopen = () => {
        console.log("RealTimeNews: WebSocket connection successful");
      };

      newsSocket.onmessage = (event) => {
        try {
          const newArticles = JSON.parse(event.data);
          setNews(prevNews => {
            const existingUrls = new Set(prevNews.map(item => item.url));
            const uniqueNewArticles = newArticles.filter((item: NewsItem) => !existingUrls.has(item.url));
            return [...uniqueNewArticles, ...prevNews].slice(0, 50); // Keep only the latest 50 news items
          });
        } catch (e) {
          console.error('RealTimeNews: Error processing WebSocket message:', e);
        }
      };

      newsSocket.onerror = (error) => {
        console.error('RealTimeNews: WebSocket Error:', error);
      };

      newsSocket.onclose = (event) => {
        console.log('RealTimeNews: WebSocket connection closed:', event.reason);
        newsSocketRef.current = null; // Allow reconnection
      };
    }

    return () => {
      if (newsSocketRef.current) {
        newsSocketRef.current.close();
        newsSocketRef.current = null;
      }
    };
  }, []);

  const filteredNews = useMemo(() => {
    let filtered = news;
    if (sentimentFilter !== '전체') {
      filtered = filtered.filter(item => item.sentiment_label === sentimentFilter);
    }
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(lowerCaseSearchTerm) || 
        item.content?.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }
    return filtered;
  }, [news, sentimentFilter, searchTerm]);

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-slate-400" size={32} /></div>;
    }
    if (fetchError) {
      return <div className="flex flex-col items-center justify-center py-20 text-red-400"><AlertTriangle size={32} /><p className="mt-2">뉴스를 불러오는 데 실패했습니다.</p></div>;
    }
    if (filteredNews.length === 0) {
      return <div className="flex justify-center items-center py-20"><p>표시할 뉴스가 없습니다.</p></div>;
    }
    return (
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {filteredNews.map((item) => (
            <motion.a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              variants={itemVariants}
              layout
              className="block bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800 hover:border-indigo-500/50 transition-all"
            >
              <h3 className="font-semibold text-slate-200 mb-2">{item.title}</h3>
              <p className="text-xs text-slate-500 mb-3">{item.source} - {new Date(item.published_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
              <SentimentBadge score={item.sentiment_score || 0} label={item.sentiment_label || '중립적'} />
            </motion.a>
          ))}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-grow flex gap-2">
          <Input
            placeholder="뉴스 제목 또는 내용 검색..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
            <SelectTrigger className="w-full sm:w-[150px] bg-slate-800 border-slate-600 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
              <SelectItem value="전체">전체 감성</SelectItem>
              <SelectItem value="긍정적">긍정적</SelectItem>
              <SelectItem value="중립적">중립적</SelectItem>
              <SelectItem value="부정적">부정적</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}
