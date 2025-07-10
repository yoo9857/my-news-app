'use client';

import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client'; // Moved import to top
import { ManagerOptions, SocketOptions } from 'socket.io-client';
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
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
  sentiment: "긍정적" | "부정적" | "중립적"; // API로부터 받아오는 감성
  relatedCompanies: string[];
  imageUrl?: string;
}

// RealTimeNews 컴포넌트의 props 타입 정의
interface RealTimeNewsProps {
  setIsConnected: React.Dispatch<React.SetStateAction<boolean>>; // setIsConnected 추가
}

/**
 * 뉴스 텍스트의 감성을 분석하는 헬퍼 함수입니다.
 * 이 함수는 키워드 기반의 간단한 감성 분석을 수행하며, 실제 서비스에서는
 * 더 정교한 자연어 처리(NLP) 모델이 백엔드에서 사용될 수 있습니다.
 *
 * @param text 분석할 뉴스 기사 텍스트
 * @returns "긍정적", "부정적", 또는 "중립적" 감성
 */
const analyzeSentiment = (text: string): "긍정적" | "부정적" | "중립적" => {
  const lowerText = text.toLowerCase(); // 대소문자 구분 없이 비교를 위해 소문자로 변환

  // 긍정적인 의미를 가진 키워드 목록
  const positiveKeywords = [
    "성장", "상승", "증가", "개선", "호조", "확대", "성공", "돌파", "혁신", "기대",
    "강세", "회복", "긍정", "낙관", "흑자", "수익", "이익", "발전", "활성화", "강화",
    "협력", "유치", "투자", "확장", "선두", "최고", "기록", "급등", "급증", "강세",
    "희망", "기회", "성과", "달성", "완료", "안정", "견조", "우수", "긍정적", "낙관적",
    "호재", "수혜", "전망 밝", "좋다", "뛰어나다", "뛰어나게", "성공적", "유리", "호황",
    "상향", "상향 조정", "초과", "돌파", "견인", "주도", "선전", "선방", "실적 개선",
    "매출 증대", "영업이익 증가", "순이익 증가", "배당", "주가 상승", "가치 상승", "경쟁력 강화",
    "기술 개발", "신기술", "신제품", "출시", "확보", "인수", "합병", "파트너십", "전략적 제휴",
    "증설", "수주", "계약", "증대", "상회", "기록적", "역대급", "최대", "최고치", "긍정적", "기대감",
    "청신호", "훈풍", "활기", "도약", "탄력", "급성장", "급증세", "선두주자", "강세장", "상승세",
    "수혜주", "수익성", "성장세", "안정적", "우량", "견고", "탄탄", "확고", "강력", "탁월", "뛰어난"
  ];

  // 부정적인 의미를 가진 키워드 목록
  const negativeKeywords = [
    "하락", "감소", "축소", "악화", "부진", "실패", "위기", "우려", "약세", "침체",
    "부정", "비관", "적자", "손실", "부담", "둔화", "논란", "규제", "제재", "불확실성",
    "위험", "급락", "급감", "약세", "불리", "비관적", "악재", "악영향", "전망 어둡", "나쁘다",
    "어렵다", "힘들다", "부실", "압박", "경고", "충격", "타격", "불황", "불안", "단점",
    "문제", "취약", "불만", "고소", "소송", "파산", "해고", "붕괴", "폭락", "폭락세",
    "하향", "하향 조정", "미달", "적자 전환", "매출 감소", "영업이익 감소", "순이익 감소",
    "주가 하락", "가치 하락", "경쟁 심화", "분쟁", "매각", "매물", "부채", "손실 확대",
    "적자 지속", "감사 의견 거절", "거래 정지", "상장 폐지", "횡령", "배임", "사기", "조작",
    "압력", "위협", "경색", "경고등", "적신호", "난항", "악재", "악순환", "부정적", "비관적",
    "우려", "리스크", "불안정", "취약성", "하향세", "급락세", "손실폭", "위험", "악화일로",
    "부담 가중", "부정적 전망", "악영향", "침체기", "불확실성 증대", "악재성", "논란 확산",
    "규제 강화", "제재", "소송전", "파문", "충격파", "타격 예상", "불황 심화", "부진 장기화"
  ];

  // 중립적인 의미를 가진 키워드 목록 (주로 사실 전달에 사용되는 단어)
  // 이 키워드들은 긍정/부정 키워드와 겹치지 않도록 주의하며, 주로 긍정/부정 점수가 낮을 때 중립으로 분류하는 데 사용됩니다.
  const neutralKeywords = [
    "발표", "개최", "진행", "예정", "계획", "검토", "분석", "조사", "관망", "유지",
    "변경", "전환", "조정", "확인", "언급", "보고", "논의", "설명", "주목", "관찰",
    "동향", "움직임", "나타나다", "보인다", "알려지다", "보도", "예상", "평가", "관측",
    "개시", "시작", "종료", "완료", "합의", "협상", "회의", "간담회", "워크숍", "세미나",
    "포럼", "개막", "폐막", "개정", "제정", "시행", "도입", "추진", "확정", "발표하다",
    "시작하다", "끝나다", "열리다", "닫히다", "결정", "결론", "공개", "공시", "제안", "제시",
    "확인", "확정", "조사", "연구", "개발", "생산", "판매", "출하", "수출", "수입", "거래",
    "체결", "계약", "협약", "재개", "중단", "연기", "철회", "취소", "반영", "적용", "구축",
    "설립", "운영", "관리", "감독", "규정", "법안", "정책", "정부", "국회", "금융", "시장",
    "산업", "기업", "경제", "사회", "문화", "기술", "과학", "환경", "글로벌", "국내", "해외",
    "지역", "세계", "발생", "전달", "공개", "발표", "확인", "언급", "보고서", "자료", "정보",
    "뉴스", "기사", "보도", "관계자", "관계당국", "관계부처", "관계기관", "전문가", "분석가",
    "연구원", "관계자", "업계", "관계", "관련", "대비", "준비", "대응", "방안", "대책", "논의",
    "검토", "조치", "시점", "시기", "상황", "현황", "배경", "요인", "영향", "변화", "전개",
    "흐름", "추세", "방향", "패턴", "구조", "체계", "시스템", "네트워크", "플랫폼", "솔루션",
    "서비스", "제품", "기술", "공정", "생산", "제조", "유통", "판매", "마케팅", "홍보", "광고",
    "브랜드", "이미지", "평판", "신뢰", "경쟁", "협력", "제휴", "파트너", "고객", "소비자",
    "사용자", "이용자", "투자자", "주주", "경영진", "직원", "노조", "단체", "기관", "협회",
    "재단", "학회", "연구소", "대학", "병원", "학교", "지역사회", "국가", "국제", "글로벌",
    "세계적", "범위", "규모", "수준", "정도", "비율", "수치", "데이터", "통계", "지표", "평균",
    "최대", "최소", "이상", "이하", "초과", "미만", "대비", "비교", "분석", "평가", "예상",
    "전망", "관측", "예측", "추정", "산정", "산출", "계산", "측정", "확인", "검증", "증명",
    "입증", "반박", "부정", "긍정", "중립", "객관적", "주관적", "사실", "의견", "주장", "논리",
    "근거", "이유", "원인", "결과", "영향", "효과", "의미", "중요성", "필요성", "가능성",
    "잠재력", "한계", "문제점", "해결책", "대안", "방향", "목표", "전략", "정책", "법안",
    "규제", "제재", "지침", "권고", "의무", "권리", "책임", "의무", "권한", "역할", "기능",
    "특징", "장점", "단점", "강점", "약점", "기회", "위협", "SWOT", "분석", "보고", "제안"
  ];


  let positiveScore = 0;
  let negativeScore = 0;

  // 텍스트에서 특정 키워드의 출현 횟수를 세는 함수
  const countOccurrences = (text: string, keywords: string[]): number => {
    let count = 0;
    keywords.forEach(keyword => {
      // 정규식을 사용하여 단어 경계(whole word)를 기준으로 일치하는 키워드만 카운트
      // 'gi' 플래그는 전역(g) 및 대소문자 무시(i) 검색을 의미
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        count += matches.length;
      }
    });
    return count;
  };

  // 긍정 및 부정 키워드 점수 계산
  positiveScore = countOccurrences(lowerText, positiveKeywords);
  negativeScore = countOccurrences(lowerText, negativeKeywords);

  // 감성 분류를 위한 임계값 정의
  // 긍정 점수가 부정 점수보다 일정 비율 이상 높을 때 긍정으로 분류
  const POSITIVE_THRESHOLD_RATIO = 1.5;
  // 부정 점수가 긍정 점수보다 일정 비율 이상 높을 때 부정으로 분류
  const NEGATIVE_THRESHOLD_RATIO = 1.5;
  // 감성 분류를 위한 최소 키워드 출현 횟수 (너무 짧은 텍스트의 오분류 방지)
  const MIN_SENTIMENT_WORD_COUNT = 1;

  // 감성 판단 로직
  if (positiveScore > 0 && positiveScore >= negativeScore * POSITIVE_THRESHOLD_RATIO && (positiveScore + negativeScore) >= MIN_SENTIMENT_WORD_COUNT) {
    return "긍정적";
  } else if (negativeScore > 0 && negativeScore >= positiveScore * NEGATIVE_THRESHOLD_RATIO && (positiveScore + negativeScore) >= MIN_SENTIMENT_WORD_COUNT) {
    return "부정적";
  } else {
    // 긍정/부정 점수가 낮거나 균형을 이룰 경우 중립으로 분류
    return "중립적";
  }
};


// RealTimeNews 컴포넌트 정의
export default function RealTimeNews({ setIsConnected }: RealTimeNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [sentimentFilter, setSentimentFilter] = useState<string>('전체');
  const [allAvailableSources, setAllAvailableSources] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtime, setIsRealtime] = useState(true);
  const [hasAttemptedInitialFetch, setHasAttemptedInitialFetch] = useState(false); // New state to track initial fetch

  const { toast } = useToast();

  const fetchNewsFallback = useCallback(async () => {
    console.log('Fallback: Fetching news via HTTP');
    setIsRealtime(false);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/news`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();

      if (result.success) {
        setNews(result.articles);
        setAllAvailableSources(result.sources || []);
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
      console.error("Fallback fetch error:", e);
      setError("뉴스 데이터를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.");
      setNews([]);
      toast({
          title: "네트워크 오류",
          description: "뉴스 데이터를 가져오지 못했습니다. 서버 연결을 확인해주세요.",
          variant: "destructive",
      });
    } finally {
      setLoading(false);
      setHasAttemptedInitialFetch(true); // Set to true after attempt
    }
  }, [toast]);

  useEffect(() => {
    const socket = io({
      path: '/api/my_socket',
      pingInterval: 10000, // 10 seconds
      pingTimeout: 5000,   // 5 seconds
    } as Partial<ManagerOptions & SocketOptions>); // Explicitly cast

    let fallbackTimer: NodeJS.Timeout;

    socket.on('connect', () => {
      console.log('Socket.IO connected');
      setLoading(false);
      setIsConnected(true); // Update global connection status
      // Only attempt fallback if no news has been loaded yet and no initial fetch has been attempted
      if (!hasAttemptedInitialFetch) {
        fallbackTimer = setTimeout(() => {
          if (news.length === 0) { // Check news.length here to avoid immediate re-fetch if news arrives quickly
            fetchNewsFallback();
          }
        }, 5000); // 5초 후에 fallback 실행
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      setIsConnected(false); // Update global connection status
    });

    socket.on('real_kiwoom_data', (newNewsItem: NewsItem) => {
      clearTimeout(fallbackTimer);
      setIsRealtime(true);
      setNews((prevNews) => [newNewsItem, ...prevNews]);
      setHasAttemptedInitialFetch(true); // News received, so initial fetch is done
    });

    socket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err);
      setError('실시간 서버에 연결할 수 없습니다.');
      setLoading(false);
      setIsConnected(false); // Update global connection status
      if (!hasAttemptedInitialFetch) { // Only call fallback if initial fetch hasn't been attempted
        fetchNewsFallback(); // 연결 실패 시 바로 fallback 실행
      }
    });

    return () => {
      clearTimeout(fallbackTimer);
      socket.disconnect();
    };
  }, [toast, fetchNewsFallback, hasAttemptedInitialFetch, setIsConnected]); // Added setIsConnected to dependencies

  const handleSourceToggle = (source: string) => {
    setSelectedSources(prev =>
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  const filteredNews = news
    .filter(item => {
      if (sentimentFilter === '전체') return true;
      return item.sentiment === sentimentFilter;
    })
    .filter(item => {
      if (searchTerm === '') return true;
      return item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (item.relatedCompanies && item.relatedCompanies.some(company => company.toLowerCase().includes(searchTerm.toLowerCase())));
    });


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
            className="flex-grow bg-[#2a2a2a] border border-[#444444] text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md py-2"
          />
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

      {/* 뉴스 기사 목록 또는 로딩/에러 메시지 */}
      {loading ? ( // 로딩 중일 때는 로딩 메시지만 표시
        <p className="col-span-full text-center text-gray-400 flex items-center justify-center gap-2 py-8 text-lg">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {isRealtime ? '실시간 뉴스 서버에 연결 중...' : '뉴스 불러오는 중...'}
        </p>
      ) : error ? ( // 에러가 있을 때는 에러 메시지 표시
        <p className="text-red-500 text-center text-md py-4">{error}</p>
      ) : filteredNews.length === 0 ? ( // 뉴스가 없으면 결과 없음 메시지 표시
        <p className="col-span-full text-center text-gray-400 py-8 text-lg">{isRealtime ? '수신된 뉴스가 없습니다. 대기 중...' : '검색 결과가 없습니다.'}</p>
      ) : ( // 뉴스가 있으면 목록 표시
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((newsItem) => (
            <Card key={newsItem.id} className="bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col">
              {newsItem.imageUrl && (
                <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                  <img
                    src={newsItem.imageUrl}
                    alt={newsItem.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://placehold.co/600x400/333333/FFFFFF?text=No+Image`;
                      e.currentTarget.onerror = null; // Prevent infinite loop if placeholder also fails
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