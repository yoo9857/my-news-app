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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

const AnalyzingBadge = () => {
  const texts = ["AI 분석중...", "문맥 파악중...", "데이터 추론중..."];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Badge className="flex items-center gap-1 text-xs px-2 py-1 bg-slate-600/50 text-slate-400 border-slate-600/50">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={index}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
        >
          {texts[index]}
        </motion.span>
      </AnimatePresence>
    </Badge>
  );
};

const getSentimentStyle = (label: string) => {
  if (label.includes('긍정')) {
    const base = { containerBg: 'rgba(16, 185, 129, 0.1)', barBg: 'rgba(16, 185, 129, 0.4)', textColor: 'rgb(52, 211, 153)', borderColor: 'rgba(16, 185, 129, 0.3)' };
    if (label === '강한 긍정') return { ...base, barBg: 'rgba(16, 185, 129, 0.6)', textColor: 'rgb(110, 231, 183)' };
    if (label === '약한 긍정') return { ...base, barBg: 'rgba(16, 185, 129, 0.2)', textColor: 'rgb(107, 114, 128)' };
    return base;
  }
  if (label.includes('부정')) {
    const base = { containerBg: 'rgba(239, 68, 68, 0.1)', barBg: 'rgba(239, 68, 68, 0.4)', textColor: 'rgb(248, 113, 113)', borderColor: 'rgba(239, 68, 68, 0.3)' };
    if (label === '강한 부정') return { ...base, barBg: 'rgba(239, 68, 68, 0.6)', textColor: 'rgb(252, 165, 165)' };
    if (label === '약한 부정') return { ...base, barBg: 'rgba(239, 68, 68, 0.2)', textColor: 'rgb(107, 114, 128)' };
    return base;
  }
  return {
    containerBg: 'rgba(100, 116, 139, 0.1)',
    barBg: 'rgba(100, 116, 139, 0.4)',
    textColor: 'rgb(148, 163, 184)',
    borderColor: 'rgba(100, 116, 139, 0.2)',
  };
};

const SentimentBadge = ({ score, label }: { score: number, label: string }) => {
  const sentimentMap: { [key: string]: { icon: JSX.Element } } = {
    '강한 긍정': { icon: <><TrendingUp size={12} className="-mr-1" /><TrendingUp size={12} /></> },
    '긍정적': { icon: <TrendingUp size={12} /> },
    '약한 긍정': { icon: <TrendingUp size={12} /> },
    '중립적': { icon: <Minus size={12} /> },
    '약한 부정': { icon: <TrendingDown size={12} /> },
    '부정적': { icon: <TrendingDown size={12} /> },
    '강한 부정': { icon: <><TrendingDown size={12} className="-mr-1" /><TrendingDown size={12} /></> },
  };
  const sentiment = sentimentMap[label] || sentimentMap['중립적'];
  const style = getSentimentStyle(label);
  const formattedScore = (score * 100).toFixed(1);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            style={{
              backgroundColor: style.containerBg,
              color: style.textColor,
              borderColor: style.borderColor
            }}
            className="relative flex items-center gap-1 text-xs px-2 py-1 overflow-hidden"
          >
            {/* Fill Bar */}
            <motion.div
              className="absolute left-0 top-0 h-full"
              style={{ backgroundColor: style.barBg }}
              initial={{ width: '0%' }}
              animate={{ width: `${formattedScore}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            ></motion.div>
            
            {/* Content */}
            <div className="relative flex items-center gap-1">
              {sentiment.icon}
              <span>{label}</span>
            </div>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200">
          <p>{label} 분석 (신뢰도: {formattedScore}%)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function RealTimeNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('전체');
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const newsSocketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      // Don't set loading to true on subsequent fetches to avoid flicker
      // setIsLoading(true); 
      setFetchError(false);
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/news?limit=30`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setNews(result.data); // Replace the news list entirely
        } else {
          setFetchError(true);
        }
      } catch (error) {
        console.error("Failed to fetch news data:", error);
        setFetchError(true);
      } finally {
        setIsLoading(false); // Set loading to false after the first fetch
      }
    };

    fetchNews(); // Fetch immediately on component mount

    const intervalId = setInterval(fetchNews, 120000); // Refresh every 120 seconds

    return () => {
      clearInterval(intervalId); // Clean up the interval on component unmount
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
          {filteredNews.map((item) => {
              const sourceName = item.source ? new URL(item.source).hostname.replace('www.', '') : '알 수 없음';
              return (
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
                  <p className="text-xs text-slate-500 mb-3">{sourceName} - {new Date(item.published_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
                  {item.sentiment_label ? (
                    <SentimentBadge score={item.sentiment_score || 0} label={item.sentiment_label} />
                  ) : (
                    <AnalyzingBadge />
                  )}
                </motion.a>
              );
          })}
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
