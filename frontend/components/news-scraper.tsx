"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, RefreshCw, ExternalLink, Calendar, User, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface NewsArticle {
  id: string
  title: string
  summary: string
  content: string
  source: string
  author: string
  publishedAt: string
  url: string
  category: string
  sentiment: "긍정적" | "부정적" | "중립적"
  relatedCompanies: string[]
}

// 샘플 뉴스 데이터
const sampleNewsData: NewsArticle[] = [
  {
    id: "1",
    title: "삼성전자, AI 반도체 HBM3E 양산 본격화",
    summary:
      "삼성전자가 차세대 AI 메모리 반도체 HBM3E의 양산을 본격화하며 글로벌 AI 시장 공략에 나선다고 발표했습니다.",
    content: "삼성전자가 AI 시대의 핵심 부품인 고대역폭 메모리(HBM) 3세대 제품의 양산을 시작했다...",
    source: "매일경제",
    author: "김기자",
    publishedAt: "2024-01-15T10:30:00Z",
    url: "https://example.com/news/1",
    category: "반도체",
    sentiment: "긍정적",
    relatedCompanies: ["삼성전자", "SK하이닉스"],
  },
  {
    id: "2",
    title: "LG에너지솔루션, 북미 배터리 공장 증설 발표",
    summary: "LG에너지솔루션이 북미 지역 배터리 생산능력 확대를 위해 대규모 투자를 단행한다고 밝혔습니다.",
    content: "LG에너지솔루션이 전기차 시장 성장에 대비해 북미 지역 생산능력을 2배로 늘린다...",
    source: "한국경제",
    author: "박기자",
    publishedAt: "2024-01-15T09:15:00Z",
    url: "https://example.com/news/2",
    category: "2차전지",
    sentiment: "긍정적",
    relatedCompanies: ["LG에너지솔루션"],
  },
  {
    id: "3",
    title: "현대차, 전기차 판매 목표 상향 조정",
    summary: "현대자동차가 올해 전기차 판매 목표를 기존 계획보다 20% 상향 조정했다고 발표했습니다.",
    content: "현대자동차가 아이오닉 시리즈의 성공에 힘입어 전기차 판매 목표를 대폭 늘렸다...",
    source: "연합뉴스",
    author: "이기자",
    publishedAt: "2024-01-15T08:45:00Z",
    url: "https://example.com/news/3",
    category: "자동차",
    sentiment: "긍정적",
    relatedCompanies: ["현대자동차", "기아"],
  },
]

const categories = ["전체", "반도체", "2차전지", "자동차", "바이오", "금융", "에너지"]

export default function NewsScraper() {
  const [articles, setArticles] = useState<NewsArticle[]>(sampleNewsData)
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>(sampleNewsData)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [isLoading, setIsLoading] = useState(false)

  // 검색 및 필터링
  useEffect(() => {
    let filtered = articles

    if (searchTerm) {
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.summary.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCategory !== "전체") {
      filtered = filtered.filter((article) => article.category === selectedCategory)
    }

    setFilteredArticles(filtered)
  }, [searchTerm, selectedCategory, articles])

  // 뉴스 새로고침
  const refreshNews = async () => {
    setIsLoading(true)
    // 실제 구현에서는 여기서 뉴스 API를 호출합니다
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
        return "border-l-green-500 bg-green-500/10"
      case "부정적":
        return "border-l-red-500 bg-red-500/10"
      default:
        return "border-l-gray-500 bg-gray-500/10"
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center">
            <div className="relative flex h-3 w-3 mr-3">
              <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></div>
              <div className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></div>
            </div>
            실시간 한국 경제 뉴스
          </h1>
          <p className="text-gray-400 mb-4">AI가 분석한 한국 주식 시장 관련 뉴스를 실시간으로 제공합니다</p>
          <Button onClick={refreshNews} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            뉴스 새로고침
          </Button>
        </div>

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

          {/* 카테고리 필터 */}
          <div className="flex flex-wrap justify-center gap-2">
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
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <CardTitle className="text-sm font-medium text-gray-400">뉴스 소스</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{new Set(articles.map((a) => a.source)).size}</div>
            </CardContent>
          </Card>
        </div>

        {/* 뉴스 기사 목록 */}
        <div className="space-y-6">
          {filteredArticles.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-12">
                <p className="text-gray-400">검색 결과가 없습니다.</p>
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
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {article.source}
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
                    </div>
                  </div>

                  <h2 className="text-xl font-semibold text-white mb-3 line-clamp-2">{article.title}</h2>

                  <p className="text-gray-400 mb-4 line-clamp-3">{article.summary}</p>

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
                        <User className="h-4 w-4" />
                        {article.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(article.publishedAt)}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                    >
                      <a
                        href={article.url}
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