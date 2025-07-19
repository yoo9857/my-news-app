'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface NewsItem {
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

export default function TrendingNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchTrendingNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // For now, fetch general news. In a real app, this would be a dedicated trending endpoint.
      const response = await fetch(`/api/news`); 
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();

      if (result.success) {
        setNews(result.articles);
      } else {
        setError(result.error || "트렌딩 뉴스를 가져오는 데 실패했습니다.");
        toast({
            title: "트렌딩 뉴스 로드 실패",
            description: result.error || "트렌딩 뉴스를 가져오는 데 실패했습니다.",
            variant: "destructive",
        });
      }
    } catch (e: any) {
      console.error("Trending news fetch error:", e);
      setError("트렌딩 뉴스 데이터를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.");
      toast({
          title: "네트워크 오류",
          description: "트렌딩 뉴스 데이터를 가져오지 못했습니다. 서버 연결을 확인해주세요.",
          variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTrendingNews();
  }, [fetchTrendingNews]);

  return (
    <div className="space-y-6 bg-[#121212] p-4 sm:p-6 lg:p-8 min-h-screen">
      <h2 className="text-3xl font-extrabold text-white mb-6 border-b border-blue-600 pb-2">트렌딩 뉴스</h2>

      {loading ? (
        <p className="col-span-full text-center text-gray-400 flex items-center justify-center gap-2 py-8 text-lg">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 트렌딩 뉴스 불러오는 중...
        </p>
      ) : error ? (
        <p className="text-red-500 text-center text-md py-4">{error}</p>
      ) : news.length === 0 ? (
        <p className="col-span-full text-center text-gray-400 py-8 text-lg">현재 트렌딩 뉴스가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((newsItem) => (
            <Card key={newsItem.id} className="bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col">
              {newsItem.imageUrl && (
                <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                  <img
                    src={newsItem.imageUrl}
                    alt={newsItem.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://placehold.co/600x400/333333/FFFFFF?text=No+Image`;
                      e.currentTarget.onerror = null;
                    }}
                  />
                </div>
              )}
              <CardHeader className="p-4 flex-shrink-0">
                <CardTitle className="text-lg font-semibold text-white leading-tight mb-2">
                  <a href={newsItem.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors duration-200">
                    {newsItem.title}
                  </a>
                </CardTitle>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="secondary" className="bg-blue-700 text-white px-2 py-0.5 rounded-full text-xs">{newsItem.category}</Badge>
                  <Badge variant="secondary" className={`px-2 py-0.5 rounded-full text-xs ${
                    newsItem.sentiment === '긍정적' ? 'bg-green-600 text-white' :
                    newsItem.sentiment === '부정적' ? 'bg-red-600 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {newsItem.sentiment}
                  </Badge>
                  {newsItem.relatedCompanies && newsItem.relatedCompanies.map(company => (
                    <Badge key={company} variant="outline" className="border-blue-500 text-blue-300 px-2 py-0.5 rounded-full text-xs">{company}</Badge>
                  ))}
                </div>
                <p className="text-sm text-gray-400">{newsItem.source} - {new Date(newsItem.pubDate).toLocaleString('ko-KR')}</p>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-grow">
                <p className="text-gray-300 text-sm line-clamp-3">{newsItem.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
