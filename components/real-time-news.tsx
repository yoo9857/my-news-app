'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewsItem } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

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

  // 최초 로딩 시 및 3분마다 기본 뉴스 자동 새로고침
  useEffect(() => {
    fetchNews("코스피, 경제, 증시"); // 기본 키워드로 최초 로드
    const interval = setInterval(() => fetchNews("코스피, 경제, 증시"), 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      toast({ title: "검색 오류", description: "검색어를 입력해주세요."});
      return;
    }
    fetchNews(searchTerm.trim());
  };
  
  const filteredNews = useMemo(() => {
    if (sentimentFilter === '전체') return news;
    return news.filter(item => item.sentiment === sentimentFilter);
  }, [news, sentimentFilter]);

  return (
    <div className="space-y-6">
      <Card className="bg-[#1C2534] border-[#2D3A4B]">
        <CardHeader>
          <CardTitle className="text-white text-2xl">뉴스 피드</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="관심 키워드 검색 (예: 금리, AI)"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyPress={e => { if (e.key === 'Enter') handleSearch(); }}
              className="bg-[#2A3445] border-[#3C4A5C] text-white"
            />
            <Button onClick={handleSearch} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          <div>
            <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-[#2A3445] border-[#3C4A5C]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="전체">전체 감성</SelectItem>
                <SelectItem value="긍정적">긍정적</SelectItem>
                <SelectItem value="중립적">중립적</SelectItem>
                <SelectItem value="부정적">부정적</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading && news.length === 0 ? (
        <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNews.map((item) => (
            <Card key={item.id} className="bg-[#1a1a1a] border-[#333333] flex flex-col justify-between">
              <CardHeader>
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">
                  <CardTitle className="text-md line-clamp-2">{item.title}</CardTitle>
                </a>
              </CardHeader>
              <CardContent>
                  <p className="text-xs text-gray-400">{item.source} - {new Date(item.pubDate).toLocaleString('ko-KR')}</p>
              </CardContent>
              <div className="p-4 pt-0">
                  <Badge variant={item.sentiment === '긍정적' ? 'default' : item.sentiment === '부정적' ? 'destructive' : 'secondary'}>{item.sentiment}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}