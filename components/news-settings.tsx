// components/real-time-news.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast"; // 토스트 알림을 위해 추가

// 뉴스 아이템의 타입 정의
interface NewsItem {
  id: string;
  title: string;
  description?: string; 
  link: string;
  pubDate: string;
  source: string;
  category: string;
  sentiment: "긍정적" | "부정적" | "중립적"; 
  relatedCompanies: string[];
  imageUrl?: string;
}

// RealTimeNews 컴포넌트의 props 타입 정의 (현재는 필요 없음)
interface RealTimeNewsProps {
  // 더 이상 사용되지 않는 prop 정의는 제거
}

export default function RealTimeNews({}: RealTimeNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [sentimentFilter, setSentimentFilter] = useState<string>('전체');
  const [allAvailableSources, setAllAvailableSources] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast(); 

  // 뉴스 데이터를 API로부터 가져오는 함수 (useCallback으로 최적화)
  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('query', searchTerm);
      if (selectedSources.length > 0) params.append('sources', selectedSources.join(','));
      if (timeRange && timeRange !== '전체') params.append('timeRange', timeRange);
      if (sentimentFilter && sentimentFilter !== '전체') params.append('sentiment', sentimentFilter);

      const response = await fetch(`/api/news?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      
      if (result.success) {
        setNews(result.articles);
        // 서버에서 제공하는 소스 목록이 있다면 사용, 없다면 빈 배열
        setAllAvailableSources(result.sources || []); 
        if (result.warning) {
          setError(result.warning);
          toast({
              title: "뉴스 로드 경고",
              description: result.warning,
              variant: "default", 
          });
        }
      } else {
        setError(result.error || "뉴스를 가져오는 데 실패했습니다.");
        setNews([]);
        toast({
            title: "뉴스 로드 실패",
            description: result.error || "뉴스를 가져오는 데 실패했습니다.",
            variant: "destructive",
        });
      }
    } catch (e: any) {
      console.error("뉴스 데이터를 가져오는 중 오류 발생:", e);
      setError("뉴스 데이터를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.");
      setNews([]);
      toast({
          title: "네트워크 오류",
          description: "뉴스 데이터를 가져오지 못했습니다. 서버 연결을 확인해주세요.",
          variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedSources, timeRange, sentimentFilter, toast]);

  // 컴포넌트 마운트 시 또는 필터/검색어 변경 시 뉴스 가져오기
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleSourceToggle = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  return (
    <div className="space-y-6 bg-[#121212] p-4 sm:p-6 lg:p-8 min-h-screen">
      <h2 className="text-3xl font-extrabold text-white mb-6 border-b border-blue-600 pb-2">실시간 뉴스</h2> 
      
      {/* 뉴스 검색 및 필터링 섹션 */}
      <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-lg border border-[#333333] space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            type="text"
            placeholder="뉴스 검색 (기업명, 키워드 등)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => { 
              if (e.key === 'Enter') {
                fetchNews();
              }
            }}
            className="flex-grow bg-[#2a2a2a] border border-[#444444] text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md py-2"
          />
          <Button 
            onClick={fetchNews} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1 font-semibold px-4 py-2 transition-colors duration-200"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} 
            {loading ? '검색 중...' : '검색'}
          </Button>
        </div>

        {/* 필터링 옵션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 시간 범위 필터 */}
          <div>
            <Label htmlFor="timeRange" className="text-gray-300 text-sm mb-2 block font-medium">시간 범위</Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger id="timeRange" className="w-full bg-[#2a2a2a] text-gray-100 border border-[#444444] rounded-md py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                <SelectValue placeholder="시간 범위" />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2a2a] text-gray-100 border border-[#444444] rounded-md shadow-lg">
                <SelectItem value="24h" className="hover:bg-[#333333] focus:bg-[#333333] py-2">최근 24시간</SelectItem>
                <SelectItem value="7d" className="hover:bg-[#333333] focus:bg-[#333333] py-2">최근 7일</SelectItem>
                <SelectItem value="30d" className="hover:bg-[#333333] focus:bg-[#333333] py-2">최근 30일</SelectItem>
                <SelectItem value="전체" className="hover:bg-[#333333] focus:bg-[#333333] py-2">전체 기간</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 감성 필터 */}
          <div>
            <Label htmlFor="sentimentFilter" className="text-gray-300 text-sm mb-2 block font-medium">감성 필터</Label>
            <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
              <SelectTrigger id="sentimentFilter" className="w-full bg-[#2a2a2a] text-gray-100 border border-[#444444] rounded-md py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                <SelectValue placeholder="감성" />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2a2a] text-gray-100 border border-[#444444] rounded-md shadow-lg">
                <SelectItem value="전체" className="hover:bg-[#333333] focus:bg-[#333333] py-2">전체 감성</SelectItem>
                <SelectItem value="긍정적" className="hover:bg-[#333333] focus:bg-[#333333] py-2">긍정적</SelectItem>
                <SelectItem value="중립적" className="hover:bg-[#333333] focus:bg-[#333333] py-2">중립적</SelectItem>
                <SelectItem value="부정적" className="hover:bg-[#333333] focus:bg-[#333333] py-2">부정적</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 뉴스 소스 선택 */}
          <div className="md:col-span-1">
            <Label className="text-gray-300 text-sm mb-2 block font-medium">뉴스 소스 선택</Label>
            <ScrollArea className="h-32 w-full rounded-md border border-[#444444] p-3 bg-[#2a2a2a]">
              <div className="space-y-2">
                {allAvailableSources.length === 0 ? (
                  <p className="text-gray-500 text-sm">소스 목록을 불러오는 중...</p>
                ) : (
                  allAvailableSources.map(source => (
                    <div key={source} className="flex items-center space-x-2 text-gray-200">
                      <Checkbox 
                        id={`source-${source}`} 
                        checked={selectedSources.includes(source)}
                        onCheckedChange={() => handleSourceToggle(source)}
                        className="border-[#555555] data-[state=checked]:bg-blue-500 data-[state=checked]:text-white transition-colors duration-200"
                      />
                      <Label htmlFor={`source-${source}`} className="text-sm cursor-pointer text-gray-300">
                        {source}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>


      {error && (
        <p className="text-red-500 text-center text-md py-4">{error}</p>
      )}

      {loading && news.length === 0 ? (
        <p className="col-span-full text-center text-gray-400 flex items-center justify-center gap-2 py-8 text-lg">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 뉴스를 불러오는 중...
        </p>
      ) : news.length === 0 ? (
        <p className="col-span-full text-center text-gray-400 py-8 text-lg">검색 결과가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((newsItem) => (
            <Card key={newsItem.id} className="bg-[#1a1a1a] border border-[#333333] text-gray-100 rounded-lg shadow-lg hover:bg-[#222222] transition-colors duration-200">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-lg font-semibold text-white leading-tight mb-2">
                  <a href={newsItem.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors duration-200 line-clamp-2">
                    {newsItem.title}
                  </a>
                </CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge className="bg-blue-600 text-white px-2.5 py-1 rounded-full text-xs font-medium">
                    {newsItem.source}
                  </Badge>
                  <Badge className="bg-[#333333] text-gray-200 px-2.5 py-1 rounded-full text-xs font-medium">
                    {new Date(newsItem.pubDate).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit', month: 'numeric', day: 'numeric' })}
                  </Badge>
                  <Badge className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    newsItem.sentiment === '긍정적' ? 'bg-green-600/30 text-green-400' :
                    newsItem.sentiment === '부정적' ? 'bg-red-600/30 text-red-400' :
                    'bg-yellow-600/30 text-yellow-400'
                  }`}>
                    {newsItem.sentiment}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {newsItem.imageUrl && (
                  <img 
                    src={newsItem.imageUrl} 
                    alt={newsItem.title} 
                    className="w-full h-32 object-cover rounded-md mb-4" 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} // 이미지 로드 실패 시 숨김
                  />
                )}
                <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                  {newsItem.description || ''}
                </p>
                {newsItem.relatedCompanies && newsItem.relatedCompanies.length > 0 && (
                  <div className="mt-3">
                    <span className="text-gray-400 text-xs font-semibold mr-2">관련 기업: </span>
                    {newsItem.relatedCompanies.map((company, index) => (
                      <Badge key={index} className="bg-[#444444] text-gray-300 px-2 py-0.5 rounded-full text-xs mr-1 font-medium">
                        {company}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}