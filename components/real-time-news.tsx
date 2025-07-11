'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebouncedCallback } from 'use-debounce';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
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

const SentimentBadge = ({ sentiment }: { sentiment: string }) => {
  const sentimentMap = {
    '긍정적': { icon: <TrendingUp size={14} />, color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    '부정적': { icon: <TrendingDown size={14} />, color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    '중립적': { icon: <Minus size={14} />, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  };
  const { icon, color } = sentimentMap[sentiment as keyof typeof sentimentMap] || sentimentMap['중립적'];
  return <Badge className={`flex items-center gap-1.5 ${color}`}>{icon}{sentiment}</Badge>;
};

export default function RealTimeNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sentimentFilter, setSentimentFilter] = useState('전체');
  const { toast } = useToast();

  const fetchNews = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/news?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("서버에서 뉴스를 가져오지 못했습니다.");
      const result = await response.json();
      if (result.success) {
        setNews(result.articles);
      } else {
        throw new Error(result.error || "뉴스 로드 실패");
      }
    } catch (e: any) {
      toast({ title: "오류", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const debouncedFetchNews = useDebouncedCallback(fetchNews, 500);

  useEffect(() => {
    fetchNews("속보");
  }, [fetchNews]);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      fetchNews("속보");
    } else {
      debouncedFetchNews(searchTerm.trim());
    }
  };

  const handleRefresh = useDebouncedCallback(() => {
      fetchNews(searchTerm.trim() || "속보");
      toast({ title: "뉴스 새로고침", description: "최신 뉴스를 불러왔습니다." });
  }, 500);
  
  const filteredNews = useMemo(() => {
    if (sentimentFilter === '전체') return news;
    return news.filter(item => item.sentiment === sentimentFilter);
  }, [news, sentimentFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-grow flex gap-2">
          <Input
            placeholder="관심 키워드 검색 (예: 금리, AI)"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              handleSearch();
            }}
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
          <Button onClick={handleRefresh} disabled={isLoading} variant="outline" className="bg-slate-800 border-slate-600">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isLoading && news.length === 0 ? (
        <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-400" /></div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {filteredNews.map((item) => (
              <motion.a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                variants={itemVariants}
                layout
                className="block bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800 hover:border-indigo-500/50 transition-all"
              >
                <h3 className="font-semibold text-slate-200 line-clamp-2 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-500 mb-3">{item.source} - {new Date(item.pubDate).toLocaleString('ko-KR')}</p>
                <SentimentBadge sentiment={item.sentiment} />
              </motion.a>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}