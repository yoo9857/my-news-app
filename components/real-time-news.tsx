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
  Play,
  Pause,
  AlertCircle,
  Globe,
  Newspaper,
  CheckCircle,
  XCircle,
} from "lucide-react"

interface NewsItem {
  id: string
  title: string
  description: string
  link: string
  pubDate: string
  source: string
  category: string
  sentiment: "긍정적" | "부정적" | "중립적"
  relatedCompanies: string[]
  imageUrl?: string
}

interface NewsResponse {
  success: boolean
  count: number
  articles: NewsItem[]
  sources: string[]
  timestamp: string
  error?: string
  successfulSources?: string[]
  failedSources?: string[]
  warning?: string
  apiErrors?: string[]
  hasRealNews?: boolean
  systemInfo?: {
    naverNewsCount: number
    newsApiCount: number
    rssNewsCount: number
    totalErrors: number
  }
}

const AVAILABLE_SOURCES = [
  { name: "네이버뉴스", enabled: true },
  { name: "NewsAPI", enabled: true },
  { name: "연합뉴스", enabled: true },
  { name: "매일경제", enabled: true },
]

export default function RealTimeNews() {
  const [articles, setArticles] = useState<NewsItem[]>([])
  const [filteredArticles, setFilteredArticles] = useState<NewsItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [selectedSentiment, setSelectedSentiment] = useState("전체")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(120) // 2분
  const [sources, setSources] = useState(AVAILABLE_SOURCES)
  const [sourceStatus, setSourceStatus] = useState<{ [key: string]: "success" | "failed" | "unknown" }>({})
  const [systemInfo, setSystemInfo] = useState<any>(null)

  // 뉴스 가져오기 함수
  const fetchNews = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setWarning(null)

    try {
      const enabledSources = sources.filter((s) => s.enabled).map((s) => s.name)

      // 활성화된 소스가 없으면 에러 표시
      if (enabledSources.length === 0) {
        setError("뉴스 소스를 하나 이상 선택해주세요.")
        setArticles([])
        setIsLoading(false)
        return
      }

      const params = new URLSearchParams({
        sources: enabledSources.join(","),
      })

      console.log("🔄 Fetching news with sources:", enabledSources)

      const response = await fetch(`/api/news?${params}`)
      const data: NewsResponse = await response.json()

      if (data.success) {
        setArticles(data.articles)
        setLastUpdated(new Date().toLocaleString("ko-KR"))
        setSystemInfo(data.systemInfo)

        // Update source status
        const newStatus: { [key: string]: "success" | "failed" | "unknown" } = {}
        sources.forEach((source) => {
          if (data.successfulSources?.includes(source.name)) {
            newStatus[source.name] = "success"
          } else if (data.failedSources?.includes(source.name)) {
            newStatus[source.name] = "failed"
          } else {
            newStatus[source.name] = "unknown"
          }
        })
        setSourceStatus(newStatus)

        if (data.warning) {
          setWarning(data.warning)
        }
      } else {
        setError(data.error || "뉴스를 가져오는데 실패했습니다.")
        setArticles([])
        setSystemInfo(data.systemInfo)
      }
    } catch (err) {
      setError("네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.")
      setArticles([])
      console.error("News fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [sources])

  // 필터링 함수
  const filterArticles = useCallback(() => {
    let filtered = articles

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.relatedCompanies.some((company) => company.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // 카테고리 필터
    if (selectedCategory !== "전체") {
      filtered = filtered.filter((article) => article.category === selectedCategory)
    }

    // 감정 필터
    if (selectedSentiment !== "전체") {
      filtered = filtered.filter((article) => article.sentiment === selectedSentiment)
    }

    setFilteredArticles(filtered)
  }, [articles, searchTerm, selectedCategory, selectedSentiment])

  // 자동 새로고침 설정
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (autoRefresh && refreshInterval > 0) {
      intervalId = setInterval(fetchNews, refreshInterval * 1000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [autoRefresh, refreshInterval, fetchNews])

  // 필터링 실행
  useEffect(() => {
    filterArticles()
  }, [filterArticles])

  // 초기 뉴스 로드
  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  // 소스 토글 함수
  const toggleSource = (sourceName: string) => {
    setSources((prev) => {
      const newSources = prev.map((source) =>
        source.name === sourceName ? { ...source, enabled: !source.enabled } : source,
      )

      // 최소 하나의 소스는 활성화되어야 함
      const enabledCount = newSources.filter((s) => s.enabled).length
      if (enabledCount === 0) {
        setWarning("최소 하나의 뉴스 소스는 활성화되어야 합니다.")
        return prev // 변경하지 않음
      }

      setWarning(null)
      return newSources
    })
  }

  // 감정 분석 아이콘
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "긍정적":
        return <TrendingUp className="h-4 w-4 text-green-400" />
      case "부정적":
        return <TrendingDown className="h-4 w-4 text-red-400" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  // 감정 분석 색상
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "긍정적":
        return "border-l-green-500 bg-green-500/5"
      case "부정적":
        return "border-l-red-500 bg-red-500/5"
      default:
        return "border-l-gray-500 bg-gray-500/5"
    }
  }

  // 시간 포맷팅
  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "방금 전"
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`
    return `${Math.floor(diffInMinutes / 1440)}일 전`
  }

  const categories = ["전체", ...new Set(articles.map((a) => a.category))]
  const sentiments = ["전체", "긍정적", "부정적", "중립적"]
  const enabledSourcesCount = sources.filter((s) => s.enabled).length

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center">
            <div className="relative flex h-3 w-3 mr-3">
              <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></div>
              <div className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></div>
            </div>
            실시간 한국 경제 뉴스
            <Globe className="h-6 w-6 ml-2 text-blue-400" title="실제 뉴스 서비스" />
          </h1>
          <p className="text-gray-400 mb-4">네이버, NewsAPI, RSS 피드에서 실시간으로 수집한 한국 경제 뉴스</p>
          {lastUpdated && <p className="text-sm text-gray-500">마지막 업데이트: {lastUpdated}</p>}
          <p className="text-sm text-blue-400">활성화된 소스: {enabledSourcesCount}개</p>
        </div>

        {/* 시스템 정보 */}
        {systemInfo && (
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-400">{systemInfo.naverNewsCount}</div>
                  <div className="text-xs text-gray-400">네이버뉴스</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-400">{systemInfo.newsApiCount}</div>
                  <div className="text-xs text-gray-400">NewsAPI</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-400">{systemInfo.rssNewsCount}</div>
                  <div className="text-xs text-gray-400">RSS 피드</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-400">{systemInfo.totalErrors}</div>
                  <div className="text-xs text-gray-400">오류 수</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 컨트롤 패널 */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Settings className="h-5 w-5 mr-2" />
              뉴스 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 자동 새로고침 설정 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                  <Label htmlFor="auto-refresh" className="text-gray-300">
                    자동 새로고침
                  </Label>
                  {autoRefresh ? (
                    <Play className="h-4 w-4 text-green-400" />
                  ) : (
                    <Pause className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                {autoRefresh && (
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="refresh-interval" className="text-gray-300 text-sm">
                      간격(초):
                    </Label>
                    <Input
                      id="refresh-interval"
                      type="number"
                      min="60"
                      max="600"
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(Number(e.target.value))}
                      className="w-20 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                )}
              </div>
              <Button
                onClick={fetchNews}
                disabled={isLoading || enabledSourcesCount === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "업데이트 중..." : "지금 업데이트"}
              </Button>
            </div>

            {/* 뉴스 소스 선택 */}
            <div>
              <Label className="text-gray-300 mb-3 block">
                뉴스 소스 선택 ({enabledSourcesCount}/{sources.length} 활성화)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {sources.map((source) => (
                  <div key={source.name} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={source.name}
                        checked={source.enabled}
                        onCheckedChange={() => toggleSource(source.name)}
                        disabled={source.enabled && enabledSourcesCount === 1} // 마지막 하나는 비활성화 불가
                      />
                      <Label htmlFor={source.name} className="text-gray-300 text-sm font-medium">
                        {source.name}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      {sourceStatus[source.name] === "success" && (
                        <CheckCircle className="w-4 h-4 text-green-400" title="정상 작동" />
                      )}
                      {sourceStatus[source.name] === "failed" && (
                        <XCircle className="w-4 h-4 text-red-400" title="오류 발생" />
                      )}
                      {sourceStatus[source.name] === "unknown" && (
                        <div className="w-2 h-2 bg-gray-400 rounded-full" title="상태 불명" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {enabledSourcesCount === 1 && (
                <p className="text-xs text-yellow-400 mt-2">⚠️ 최소 하나의 뉴스 소스는 활성화되어야 합니다.</p>
              )}
            </div>

            {/* API 키 안내 */}
            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-blue-300 font-medium mb-1">실제 뉴스 API 연결됨</h4>
                  <p className="text-sm text-gray-300 mb-2">현재 다음 API들이 활성화되어 있습니다:</p>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• 네이버 뉴스 API: 한국 경제 뉴스</li>
                    <li>• NewsAPI: 국제 경제 뉴스</li>
                    <li>• RSS 피드: 연합뉴스, 매일경제</li>
                  </ul>
                  <p className="text-xs text-green-400 mt-2">✅ 모든 링크는 실제 원문으로 연결됩니다</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 에러 표시 */}
        {error && (
          <Card className="bg-red-900/20 border-red-500 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center text-red-400">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 경고 표시 */}
        {warning && (
          <Card className="bg-yellow-900/20 border-yellow-500 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center text-yellow-400">
                <AlertCircle className="h-5 w-5 mr-2" />
                {warning}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 검색 및 필터 */}
        <div className="mb-8 space-y-4">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="뉴스 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>

          {/* 필터 버튼들 */}
          <div className="flex flex-wrap justify-center gap-2">
            <div className="flex flex-wrap gap-2">
              <Label className="text-gray-400 text-sm self-center">카테고리:</Label>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={
                    selectedCategory === category
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "border-gray-600 text-gray-300 hover:bg-gray-700"
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Label className="text-gray-400 text-sm self-center">감정:</Label>
              {sentiments.map((sentiment) => (
                <Button
                  key={sentiment}
                  variant={selectedSentiment === sentiment ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSentiment(sentiment)}
                  className={
                    selectedSentiment === sentiment
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "border-gray-600 text-gray-300 hover:bg-gray-700"
                  }
                >
                  {sentiment}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">총 기사 수</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{articles.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">필터된 기사</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{filteredArticles.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">긍정적 뉴스</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {articles.filter((a) => a.sentiment === "긍정적").length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">부정적 뉴스</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">
                {articles.filter((a) => a.sentiment === "부정적").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 뉴스 기사 목록 */}
        <div className="space-y-6">
          {isLoading && articles.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
                <p className="text-gray-400">실제 뉴스를 수집하고 있습니다...</p>
                <p className="text-sm text-gray-500 mt-2">
                  {enabledSourcesCount}개 소스에서 데이터를 가져오는 중입니다
                </p>
              </CardContent>
            </Card>
          ) : articles.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-12">
                <AlertCircle className="h-8 w-8 mx-auto mb-4 text-yellow-400" />
                <p className="text-gray-400 mb-2">현재 뉴스를 불러올 수 없습니다</p>
                <p className="text-sm text-gray-500 mb-4">
                  {enabledSourcesCount === 0
                    ? "뉴스 소스를 하나 이상 선택해주세요"
                    : "API 키 설정을 확인하거나 잠시 후 다시 시도해주세요"}
                </p>
                <Button
                  onClick={fetchNews}
                  disabled={enabledSourcesCount === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  다시 시도
                </Button>
              </CardContent>
            </Card>
          ) : filteredArticles.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-12">
                <p className="text-gray-400">검색 조건에 맞는 뉴스가 없습니다.</p>
                <p className="text-sm text-gray-500 mt-2">다른 검색어나 필터를 시도해보세요</p>
              </CardContent>
            </Card>
          ) : (
            filteredArticles.map((article) => (
              <Card
                key={article.id}
                className={`bg-gray-800 border-gray-700 border-l-4 hover:bg-gray-750 transition-colors ${getSentimentColor(
                  article.sentiment,
                )}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {article.category}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`border-gray-600 ${
                          article.source === "네이버뉴스"
                            ? "text-green-300"
                            : article.source === "연합뉴스"
                              ? "text-blue-300"
                              : article.source === "매일경제"
                                ? "text-red-300"
                                : "text-yellow-300"
                        }`}
                      >
                        {article.source}
                      </Badge>
                      <Badge variant="outline" className="border-blue-600 text-blue-300 text-xs">
                        <Newspaper className="h-3 w-3 mr-1" />
                        실제뉴스
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSentimentIcon(article.sentiment)}
                      <Badge
                        className={
                          article.sentiment === "긍정적"
                            ? "bg-green-500/20 text-green-400"
                            : article.sentiment === "부정적"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-gray-500/20 text-gray-400"
                        }
                      >
                        {article.sentiment}
                      </Badge>
                      <span className="text-xs text-gray-500">{formatTimeAgo(article.pubDate)}</span>
                    </div>
                  </div>

                  <h2 className="text-xl font-semibold text-white mb-3 line-clamp-2">{article.title}</h2>

                  <p className="text-gray-400 mb-4 line-clamp-3">{article.description}</p>

                  {article.relatedCompanies.length > 0 && (
                    <div className="mb-4">
                      <span className="text-sm font-semibold text-blue-300 mr-2">관련 기업:</span>
                      {article.relatedCompanies.map((company, index) => (
                        <Badge key={index} variant="secondary" className="mr-1 bg-gray-700 text-white">
                          {company}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(article.pubDate).toLocaleDateString("ko-KR")}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                    >
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        원문 보기
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
