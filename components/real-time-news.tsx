"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Search,
  RefreshCw,
  ExternalLink,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  AlertCircle,
  Newspaper,
  CheckCircle,
  XCircle,
} from "lucide-react"

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
  imageUrl?: string; // 뉴스 썸네일 이미지 URL (옵션)
}

interface NewsResponse {
  success: boolean;
  count: number;
  articles: NewsItem[];
  timestamp: string;
  error?: string;
  warning?: string;
  successfulSources?: string[];
  failedSources?: string[];
  systemInfo?: {
    naverNewsCount: number;
    newsApiCount: number;
    rssNewsCount: number;
    totalErrors: number;
    totalSources?: number;
    activeFilters?: string[];
  };
}

const AVAILABLE_SOURCES = [
  { name: "네이버뉴스", enabled: true },
  { name: "NewsAPI", enabled: true },
  { name: "연합뉴스", enabled: true },
  { name: "매일경제", enabled: true },
  { name: "이투데이", enabled: true },
  { name: "아시아경제", enabled: true },
  { name: "이데일리", enabled: true },
];


export default function RealTimeNews() {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedSentiment, setSelectedSentiment] = useState("전체");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(120);
  const [sources, setSources] = useState(AVAILABLE_SOURCES.map(s => ({ ...s, enabled: true })));
  const [sourceStatus, setSourceStatus] = useState<{ [key: string]: "success" | "failed" }>({});
  const [systemInfo, setSystemInfo] = useState<NewsResponse['systemInfo'] | null>(null);

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setWarning(null);

    try {
      const enabledSources = sources.filter((s) => s.enabled).map((s) => s.name);
      const params = new URLSearchParams({ sources: enabledSources.join(",") });
      const response = await fetch(`/api/news?${params}`);
      const data: NewsResponse = await response.json();

      if (data.success) {
        setArticles(data.articles);
        setLastUpdated(new Date(data.timestamp).toLocaleString("ko-KR"));
        setSystemInfo(data.systemInfo);

        const newStatus: { [key: string]: "success" | "failed" } = {};
        data.successfulSources?.forEach(name => newStatus[name] = "success");
        data.failedSources?.forEach(name => newStatus[name] = "failed");
        setSourceStatus(newStatus);

        if (data.warning && data.warning.includes("You have made too many requests recently")) {
            setWarning("일부 뉴스 소스에서 일시적인 접근 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } else if (data.warning) {
            setWarning(data.warning);
        }
      } else {
        setError(data.error || "뉴스를 가져오는데 실패했습니다.");
        setArticles([]);
        setFilteredArticles([]);
        setSystemInfo(data.systemInfo);
        const allSourcesFailed: { [key: string]: "success" | "failed" } = {};
        sources.forEach(s => allSourcesFailed[s.name] = "failed");
        setSourceStatus(allSourcesFailed);
      }
    } catch (err: any) {
      setError("네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요." + (err.message ? ` (${err.message})` : ''));
      setArticles([]);
      setFilteredArticles([]);
      setSystemInfo(null);
      console.error("News fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [sources]);

  useEffect(() => {
    let filtered = articles;
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(lowercasedTerm) ||
          article.description.toLowerCase().includes(lowercasedTerm)
      );
    }
    if (selectedCategory !== "전체") {
      filtered = filtered.filter((article) => article.category === selectedCategory);
    }
    if (selectedSentiment !== "전체") {
      filtered = filtered.filter((article) => article.sentiment === selectedSentiment);
    }
    setFilteredArticles(filtered);
  }, [articles, searchTerm, selectedCategory, selectedSentiment]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (autoRefresh) {
      intervalId = setInterval(fetchNews, refreshInterval * 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, refreshInterval, fetchNews]);

  const toggleSource = (sourceName: string) => {
    setSources((prev) => {
      const newSources = prev.map((s) => s.name === sourceName ? { ...s, enabled: !s.enabled } : s);
      const enabledCount = newSources.filter((s) => s.enabled).length;
      if (enabledCount === 0) {
        setWarning("최소 하나의 뉴스 소스는 활성화되어야 합니다.");
        return prev;
      }
      setWarning(null);
      return newSources;
    });
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "긍정적": return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "부정적": return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSentimentClasses = (sentiment: "긍정적" | "부정적" | "중립적") => {
    switch (sentiment) {
      case "긍정적": return {
        border: "border-green-500",
        text: "text-green-400",
        bg: "bg-green-500/10",
      };
      case "부정적": return {
        border: "border-red-500",
        text: "text-red-400",
        bg: "bg-red-500/10",
      };
      default: return { // 중립적
        border: "border-gray-600",
        text: "text-gray-400",
        bg: "bg-gray-700/20",
      };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    if(!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return "방금 전";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}일 전`; // 약 30일 이내
    return date.toLocaleDateString("ko-KR"); // 그 외 날짜
  };

  const categories = ["전체", ...new Set(articles.map((a) => a.category).filter(Boolean))].sort();
  const sentiments = ["전체", "긍정적", "부정적", "중립적"];
  const enabledSourcesCount = sources.filter((s) => s.enabled).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-white dark:bg-gray-900 min-h-screen">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Newspaper className="w-8 h-8 text-blue-500" />
          실시간 한국 경제 뉴스
        </h1>
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>마지막 업데이트: {lastUpdated}</span>
        </div>
      </div>

      {/* System Info Cards - 이 섹션을 완전히 제거합니다. */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">네이버뉴스</CardTitle>
            <Newspaper className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {systemInfo?.naverNewsCount ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">NewsAPI</CardTitle>
            <Newspaper className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {systemInfo?.newsApiCount ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">RSS 피드</CardTitle>
            <Newspaper className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {systemInfo?.rssNewsCount ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">오류 수</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {systemInfo?.totalErrors ?? 0}
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* News Settings Section */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-white">
            <Settings className="w-5 h-5" />
            뉴스 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="auto-refresh" className="text-gray-700 dark:text-gray-300">자동 새로고침</Label>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="refresh-interval" className="text-gray-700 dark:text-gray-300">간격(초):</Label>
              <Input
                id="refresh-interval"
                type="number"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                min="30"
                className="w-24 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>
            <Button onClick={fetchNews} disabled={isLoading} className="ml-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              지금 업데이트
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">뉴스 소스 선택 ({enabledSourcesCount}/{AVAILABLE_SOURCES.length} 활성화)</Label>
            <div className="flex flex-wrap gap-3">
              {/* AVAILABLE_SOURCES 배열을 기반으로 동적으로 뉴스 소스 버튼을 렌더링 */}
              {AVAILABLE_SOURCES.map((source) => {
                const currentSource = sources.find(s => s.name === source.name);
                const isEnabled = currentSource ? currentSource.enabled : false;
                const status = sourceStatus[source.name]; // 백엔드에서 받은 상태 (성공/실패)
                
                return (
                  <Badge
                    key={source.name}
                    variant={isEnabled ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1 text-sm flex items-center gap-1 ${
                      isEnabled
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    } ${
                      status === "failed" && isEnabled ? "border-red-500 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950" : "" // 실패 시 빨간색 테두리/텍스트
                    }`}
                    onClick={() => toggleSource(source.name)}
                  >
                    {source.name}
                    {isEnabled ? (
                      status === "failed" ? <XCircle className="h-3 w-3 ml-1 text-red-500" /> : <CheckCircle className="h-3 w-3 ml-1" />
                    ) : (
                      <XCircle className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-sm space-y-1">
            <h3 className="font-semibold flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> 실제 뉴스 API 연결됨
            </h3>
            <p>현재 다음 API들이 활성화되어 있습니다:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {/* 동적으로 활성화된 소스 목록을 표시 */}
              {sources.filter(s => s.enabled).map(s => (
                <li key={s.name}>{s.name}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs">모든 링크는 실제 원문으로 연결됩니다</p>
          </div>
        </CardContent>
      </Card>

      {/* Warning and Error Display */}
      {warning && (
        <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {/* NewsAPI 'too many requests' 경고 메시지 필터링 */}
          {warning.includes("You have made too many requests recently") ? (
            <p>일부 뉴스 소스에서 일시적인 접근 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
          ) : (
            <p>{warning}</p>
          )}
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-950 p-3 rounded-md border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="뉴스 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"}
            >
              {category}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {sentiments.map((sentiment) => (
            <Button
              key={sentiment}
              variant={selectedSentiment === sentiment ? "default" : "outline"}
              onClick={() => setSelectedSentiment(sentiment)}
              className={selectedSentiment === sentiment ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"}
            >
              {sentiment}
            </Button>
          ))}
        </div>
      </div>

      {/* News Articles Display Section */}
      <div className="space-y-4">
        {isLoading && articles.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>실시간 뉴스를 수집하고 있습니다...</p>
          </div>
        ) : !isLoading && articles.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <AlertCircle className="h-8 w-8 mx-auto mb-4" />
            <p>뉴스를 불러올 수 없습니다.</p>
            <p className="text-sm mt-2">{error || "선택된 소스에서 뉴스를 찾지 못했습니다."}</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <p>검색 조건에 맞는 뉴스가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => {
              const sentimentClasses = getSentimentClasses(article.sentiment);
              return (
                <Card key={article.id} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300 flex flex-col">
                  <CardHeader className="p-4 pb-0">
                    {/* Thumbnail Image Space */}
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-md mb-4 flex items-center justify-center overflow-hidden">
                      {article.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover rounded-md"/>
                      ) : (
                        <Newspaper className="w-10 h-10 text-gray-400 dark:text-gray-500"/>
                      )}
                    </div>
                    <CardTitle className="text-lg font-bold leading-tight line-clamp-2 text-gray-900 dark:text-white mb-2">
                      {article.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex-grow">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {article.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {article.category && (
                        <Badge variant="outline" className="font-normal border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                          {article.category}
                        </Badge>
                      )}
                      {article.source && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {article.source}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-auto">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3"/>
                        <span>{formatTimeAgo(article.pubDate)}</span>
                      </div>
                      <div className={`flex items-center gap-1 font-semibold ${sentimentClasses.text} px-2 py-0.5 rounded-full ${sentimentClasses.bg} border ${sentimentClasses.border}`}>
                        {getSentimentIcon(article.sentiment)}
                        <span>{article.sentiment}</span>
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-4 pt-0">
                    <a href={article.link} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button variant="outline" className="w-full border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700">
                        <ExternalLink className="w-4 h-4 mr-2"/> 원문 보기
                      </Button>
                    </a>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}