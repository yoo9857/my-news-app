import { type NextRequest, NextResponse } from "next/server"

// 뉴스 아이템 인터페이스
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

// 뉴스 소스 정의
const NEWS_SOURCES = [
  {
    name: "네이버뉴스",
    searchTerms: ["삼성전자", "SK하이닉스", "현대자동차", "LG에너지솔루션", "카카오", "네이버"],
    category: "경제",
  },
  {
    name: "NewsAPI",
    searchTerms: ["Korea economy", "Samsung", "Hyundai", "LG", "Korean stock"],
    category: "국제경제",
  },
]

// HTML 태그 제거 및 텍스트 정리 함수
function cleanText(text: string): string {
  if (!text) return ""

  return text
    .replace(/<[^>]*>/g, "") // HTML 태그 제거
    .replace(/&[^;]+;/g, " ") // HTML 엔티티 제거
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ") // 연속된 공백을 하나로
    .replace(/\[.*?\]/g, "") // [기자명] 등 제거
    .replace(/$$.*?$$/g, "") // (괄호 내용) 제거
    .replace(/【.*?】/g, "") // 【】 제거
    .replace(/<.*?>/g, "") // 〈〉 제거
    .replace(/\n/g, " ") // 줄바꿈 제거
    .trim()
}

// 감정 분석 함수
function analyzeSentiment(title: string, description: string): "긍정적" | "부정적" | "중립적" {
  const text = (title + " " + description).toLowerCase()

  const positiveKeywords = [
    "상승",
    "급등",
    "호실적",
    "성장",
    "수익",
    "흑자",
    "성공",
    "개발",
    "계약",
    "협력",
    "신고가",
    "반등",
    "강세",
    "수주",
    "인수",
    "합병",
    "증설",
    "확대",
    "투자",
    "선정",
    "호조",
    "개선",
    "증가",
    "상향",
    "돌파",
    "회복",
    "플러스",
    "긍정",
    "기대",
    "혁신",
    "출시",
    "론칭",
    "확보",
    "달성",
    "성과",
    "수혜",
    "부양",
    "활성화",
    "확장",
    "도약",
    "약진",
    "호황",
    "최고",
    "신기록",
    "breakthrough",
    "growth",
    "profit",
    "success",
    "positive",
    "gain",
    "rise",
    "boost",
    "expansion",
    "achievement",
  ]

  const negativeKeywords = [
    "하락",
    "급락",
    "손실",
    "적자",
    "부진",
    "우려",
    "위기",
    "충격",
    "약세",
    "신저가",
    "리스크",
    "부도",
    "파산",
    "중단",
    "취소",
    "과징금",
    "소송",
    "조사",
    "논란",
    "갈등",
    "감소",
    "하향",
    "악화",
    "부정",
    "타격",
    "침체",
    "둔화",
    "제재",
    "규제",
    "경고",
    "위험",
    "문제",
    "실망",
    "좌절",
    "폐쇄",
    "축소",
    "지연",
    "마이너스",
    "최저",
    "decline",
    "loss",
    "negative",
    "crisis",
    "risk",
    "concern",
    "problem",
    "issue",
    "drop",
    "fall",
  ]

  let positiveScore = 0
  let negativeScore = 0

  positiveKeywords.forEach((keyword) => {
    const matches = (text.match(new RegExp(keyword, "g")) || []).length
    positiveScore += matches
  })

  negativeKeywords.forEach((keyword) => {
    const matches = (text.match(new RegExp(keyword, "g")) || []).length
    negativeScore += matches
  })

  if (positiveScore > negativeScore && positiveScore > 0) return "긍정적"
  if (negativeScore > positiveScore && negativeScore > 0) return "부정적"
  return "중립적"
}

// 관련 기업 찾기 함수
function findRelatedCompanies(title: string, description: string): string[] {
  const text = (title + " " + description).toLowerCase()

  const companies = [
    { name: "삼성전자", keywords: ["삼성전자", "삼성", "갤럭시", "반도체", "메모리", "samsung"] },
    { name: "SK하이닉스", keywords: ["sk하이닉스", "하이닉스", "메모리", "hbm", "hynix"] },
    { name: "LG에너지솔루션", keywords: ["lg에너지솔루션", "lg에너지", "배터리", "전기차", "lg energy"] },
    { name: "삼성바이오로직스", keywords: ["삼성바이오로직스", "삼성바이오", "바이오", "의약품"] },
    { name: "현대자동차", keywords: ["현대자동차", "현대차", "아이오닉", "자동차", "전기차", "hyundai"] },
    { name: "기아", keywords: ["기아", "기아차", "ev6", "kia"] },
    { name: "네이버", keywords: ["네이버", "naver", "검색", "플랫폼"] },
    { name: "카카오", keywords: ["카카오", "kakao", "카카오톡", "카카오페이"] },
    { name: "셀트리온", keywords: ["셀트리온", "바이오시밀러", "celltrion"] },
    { name: "LG화학", keywords: ["lg화학", "화학", "소재", "lg chem"] },
    { name: "포스코", keywords: ["포스코", "posco", "철강", "강철"] },
    { name: "한화솔루션", keywords: ["한화솔루션", "한화", "태양광", "화학"] },
    { name: "현대모비스", keywords: ["현대모비스", "모비스", "자동차부품"] },
    { name: "KB금융", keywords: ["kb금융", "국민은행", "kb", "금융"] },
    { name: "신한지주", keywords: ["신한지주", "신한은행", "신한", "금융"] },
    { name: "하나금융지주", keywords: ["하나금융", "하나은행", "하나", "금융"] },
    { name: "삼성물산", keywords: ["삼성물산", "건설", "무역"] },
    { name: "LG전자", keywords: ["lg전자", "가전", "전자제품", "lg electronics"] },
    { name: "SK텔레콤", keywords: ["sk텔레콤", "skt", "통신", "5g"] },
    { name: "KT", keywords: ["kt", "통신", "인터넷"] },
    { name: "카카오뱅크", keywords: ["카카오뱅크", "인터넷은행"] },
    { name: "두산에너빌리티", keywords: ["두산에너빌리티", "두산", "에너지"] },
    { name: "POSCO홀딩스", keywords: ["posco홀딩스", "포스코홀딩스"] },
    { name: "SK이노베이션", keywords: ["sk이노베이션", "배터리", "화학"] },
  ]

  const foundCompanies: string[] = []

  companies.forEach((company) => {
    const found = company.keywords.some((keyword) => text.includes(keyword.toLowerCase()))
    if (found && !foundCompanies.includes(company.name)) {
      foundCompanies.push(company.name)
    }
  })

  return foundCompanies.slice(0, 3) // 최대 3개까지
}

// 네이버 뉴스 API 호출
async function fetchNaverNews(enabled = true): Promise<{ news: NewsItem[]; errors: string[] }> {
  const news: NewsItem[] = []
  const errors: string[] = []

  if (!enabled) {
    console.log("🔇 Naver News API disabled by user")
    return { news, errors }
  }

  const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID
  const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET

  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    errors.push("네이버 API 키가 설정되지 않았습니다")
    return { news, errors }
  }

  try {
    console.log("🔍 Fetching Naver News...")

    // 한국 주요 기업 및 경제 키워드로 검색
    const searchTerms = [
      "삼성전자 주가",
      "SK하이닉스 실적",
      "현대자동차 전기차",
      "LG에너지솔루션 배터리",
      "네이버 AI",
      "카카오 주식",
      "한국 경제",
      "코스피",
      "증시",
      "반도체",
    ]

    for (const term of searchTerms.slice(0, 6)) {
      // 처음 6개 검색어만 사용
      try {
        const response = await fetch(
          `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(term)}&display=5&sort=date&start=1`,
          {
            method: "GET",
            headers: {
              "X-Naver-Client-Id": NAVER_CLIENT_ID,
              "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
              "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)",
            },
            signal: AbortSignal.timeout(10000), // 10초 타임아웃
          },
        )

        if (response.ok) {
          const data = await response.json()
          if (data.items && data.items.length > 0) {
            console.log(`✅ Naver API success for "${term}": ${data.items.length} articles`)

            const naverNews = data.items.map((item: any, index: number) => ({
              id: `naver-${term.replace(/\s+/g, "-")}-${Date.now()}-${index}`,
              title: cleanText(item.title),
              description: cleanText(item.description),
              link: item.originallink || item.link, // 실제 원문 링크 사용
              pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
              source: "네이버뉴스",
              category: "경제",
              sentiment: analyzeSentiment(cleanText(item.title), cleanText(item.description)),
              relatedCompanies: findRelatedCompanies(cleanText(item.title), cleanText(item.description)),
            }))

            news.push(...naverNews)
          }
        } else {
          console.log(`❌ Naver API failed for "${term}": ${response.status}`)
          if (response.status === 401) {
            errors.push("네이버 API 인증 실패 - API 키를 확인해주세요")
          }
        }
      } catch (termError) {
        console.log(`❌ Naver API error for "${term}":`, termError)
      }

      // API 호출 간 잠시 대기 (Rate Limit 방지)
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  } catch (error) {
    console.log("❌ Naver API general error:", error)
    errors.push("네이버 API 연결 실패")
  }

  return { news, errors }
}

// NewsAPI 호출
async function fetchNewsAPI(enabled = true): Promise<{ news: NewsItem[]; errors: string[] }> {
  const news: NewsItem[] = []
  const errors: string[] = []

  if (!enabled) {
    console.log("🔇 NewsAPI disabled by user")
    return { news, errors }
  }

  const NEWS_API_KEY = process.env.NEWS_API_KEY

  if (!NEWS_API_KEY) {
    errors.push("NewsAPI 키가 설정되지 않았습니다")
    return { news, errors }
  }

  try {
    console.log("🔍 Fetching NewsAPI...")

    // 한국 관련 경제 뉴스 검색
    const queries = [
      "Samsung Korea stock",
      "Hyundai Korea economy",
      "LG Korea business",
      "Korea semiconductor",
      "Korean economy",
    ]

    for (const query of queries.slice(0, 3)) {
      // 처음 3개만 사용
      try {
        const response = await fetch(
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${NEWS_API_KEY}`,
          {
            method: "GET",
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)",
            },
            signal: AbortSignal.timeout(10000),
          },
        )

        if (response.ok) {
          const data = await response.json()
          if (data.articles && data.articles.length > 0) {
            console.log(`✅ NewsAPI success for "${query}": ${data.articles.length} articles`)

            const newsApiArticles = data.articles
              .filter((item: any) => item.title && item.description && item.url) // 필수 필드 확인
              .map((item: any, index: number) => ({
                id: `newsapi-${query.replace(/\s+/g, "-")}-${Date.now()}-${index}`,
                title: cleanText(item.title),
                description: cleanText(item.description),
                link: item.url, // 실제 원문 링크 사용
                pubDate: item.publishedAt || new Date().toISOString(),
                source: item.source?.name || "NewsAPI",
                category: "국제경제",
                sentiment: analyzeSentiment(cleanText(item.title), cleanText(item.description)),
                relatedCompanies: findRelatedCompanies(cleanText(item.title), cleanText(item.description)),
                imageUrl: item.urlToImage,
              }))

            news.push(...newsApiArticles)
          }
        } else {
          console.log(`❌ NewsAPI failed for "${query}": ${response.status}`)
          if (response.status === 401) {
            errors.push("NewsAPI 인증 실패 - API 키를 확인해주세요")
          } else if (response.status === 429) {
            errors.push("NewsAPI 요청 한도 초과")
          }
        }
      } catch (termError) {
        console.log(`❌ NewsAPI error for "${query}":`, termError)
      }

      // API 호출 간 잠시 대기
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  } catch (error) {
    console.log("❌ NewsAPI general error:", error)
    errors.push("NewsAPI 연결 실패")
  }

  return { news, errors }
}

// RSS 피드 파싱 (추가 뉴스 소스)
async function fetchRSSNews(enabledSources: string[] = []): Promise<{ news: NewsItem[]; errors: string[] }> {
  const news: NewsItem[] = []
  const errors: string[] = []

  // 한국 주요 언론사 RSS 피드
  const rssFeeds = [
    {
      name: "연합뉴스",
      url: "https://www.yna.co.kr/rss/economy.xml",
      category: "경제",
      enabled: enabledSources.includes("연합뉴스"),
    },
    {
      name: "매일경제",
      url: "https://www.mk.co.kr/rss/30000001/",
      category: "경제",
      enabled: enabledSources.includes("매일경제"),
    },
  ]

  // 활성화된 피드만 필터링
  const activeFeeds = rssFeeds.filter((feed) => feed.enabled)

  if (activeFeeds.length === 0) {
    console.log("🔇 All RSS feeds disabled by user")
    return { news, errors }
  }

  for (const feed of activeFeeds) {
    try {
      console.log(`🔍 Fetching RSS from ${feed.name}...`)

      const response = await fetch(feed.url, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)",
        },
        signal: AbortSignal.timeout(8000),
      })

      if (response.ok) {
        const xmlText = await response.text()

        // 간단한 XML 파싱 (정규식 사용)
        const titleMatches = xmlText.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g) || []
        const descMatches = xmlText.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/g) || []
        const linkMatches = xmlText.match(/<link>(.*?)<\/link>/g) || []
        const pubDateMatches = xmlText.match(/<pubDate>(.*?)<\/pubDate>/g) || []

        const itemCount = Math.min(titleMatches.length, descMatches.length, linkMatches.length, 5) // 최대 5개

        for (let i = 1; i < itemCount; i++) {
          // 첫 번째는 보통 채널 정보이므로 제외
          try {
            const title = cleanText(titleMatches[i]?.replace(/<title><!\[CDATA\[(.*?)\]\]><\/title>/, "$1") || "")
            const description = cleanText(
              descMatches[i]?.replace(/<description><!\[CDATA\[(.*?)\]\]><\/description>/, "$1") || "",
            )
            const link = linkMatches[i]?.replace(/<link>(.*?)<\/link>/, "$1") || ""
            const pubDate = pubDateMatches[i]?.replace(/<pubDate>(.*?)<\/pubDate>/, "$1") || ""

            if (title && description && link) {
              news.push({
                id: `rss-${feed.name}-${Date.now()}-${i}`,
                title,
                description,
                link, // 실제 원문 링크
                pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
                source: feed.name,
                category: feed.category,
                sentiment: analyzeSentiment(title, description),
                relatedCompanies: findRelatedCompanies(title, description),
              })
            }
          } catch (itemError) {
            console.log(`❌ RSS item parsing error for ${feed.name}:`, itemError)
          }
        }

        console.log(`✅ RSS success for ${feed.name}: ${itemCount - 1} articles`)
      } else {
        console.log(`❌ RSS failed for ${feed.name}: ${response.status}`)
        errors.push(`${feed.name} RSS 피드 접근 실패`)
      }
    } catch (error) {
      console.log(`❌ RSS error for ${feed.name}:`, error)
      errors.push(`${feed.name} RSS 연결 실패`)
    }

    // RSS 호출 간 대기
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return { news, errors }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sourcesParam = searchParams.get("sources")

    // 소스 파라미터 파싱 및 검증
    let enabledSources: string[] = []
    if (sourcesParam) {
      enabledSources = sourcesParam.split(",").filter((source) => source.trim() !== "")
    }

    console.log("🚀 Starting real news collection...")
    console.log("📋 Enabled sources:", enabledSources.length > 0 ? enabledSources : "None selected")

    // 활성화된 소스가 없으면 에러 반환
    if (enabledSources.length === 0) {
      console.log("⚠️ No sources enabled")
      return NextResponse.json({
        success: false,
        count: 0,
        articles: [],
        sources: ["네이버뉴스", "NewsAPI", "연합뉴스", "매일경제"],
        timestamp: new Date().toISOString(),
        error: "뉴스 소스를 하나 이상 선택해주세요.",
        hasRealNews: false,
        systemInfo: {
          naverNewsCount: 0,
          newsApiCount: 0,
          rssNewsCount: 0,
          totalErrors: 0,
        },
      })
    }

    const allNews: NewsItem[] = []
    const allErrors: string[] = []

    // 각 소스별로 조건부 호출
    const isNaverEnabled = enabledSources.includes("네이버뉴스")
    const isNewsAPIEnabled = enabledSources.includes("NewsAPI")
    const rssEnabledSources = enabledSources.filter((source) => ["연합뉴스", "매일경제"].includes(source))

    // 네이버 뉴스 API 호출
    const { news: naverNews, errors: naverErrors } = await fetchNaverNews(isNaverEnabled)
    allNews.push(...naverNews)
    allErrors.push(...naverErrors)

    // NewsAPI 호출
    const { news: newsApiNews, errors: newsApiErrors } = await fetchNewsAPI(isNewsAPIEnabled)
    allNews.push(...newsApiNews)
    allErrors.push(...newsApiErrors)

    // RSS 피드 호출
    const { news: rssNews, errors: rssErrors } = await fetchRSSNews(rssEnabledSources)
    allNews.push(...rssNews)
    allErrors.push(...rssErrors)

    // 중복 제거 (제목 기준)
    const uniqueNews = allNews.filter((news, index, self) => index === self.findIndex((n) => n.title === news.title))

    // 날짜순 정렬 (최신순)
    uniqueNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())

    // 최대 30개 기사로 제한
    const limitedNews = uniqueNews.slice(0, 30)

    console.log(`✅ Returning ${limitedNews.length} real news articles`)

    // 뉴스가 없는 경우
    if (limitedNews.length === 0) {
      return NextResponse.json({
        success: false,
        count: 0,
        articles: [],
        sources: ["네이버뉴스", "NewsAPI", "연합뉴스", "매일경제"],
        timestamp: new Date().toISOString(),
        error: "선택한 소스에서 뉴스를 가져올 수 없습니다. API 키 설정을 확인하거나 다른 소스를 선택해주세요.",
        apiErrors: allErrors,
        hasRealNews: false,
        systemInfo: {
          naverNewsCount: naverNews.length,
          newsApiCount: newsApiNews.length,
          rssNewsCount: rssNews.length,
          totalErrors: allErrors.length,
        },
      })
    }

    // 성공/실패 소스 분류
    const availableSources = ["네이버뉴스", "NewsAPI", "연합뉴스", "매일경제"]
    const successfulSources = availableSources.filter((source) => limitedNews.some((news) => news.source === source))
    const failedSources = enabledSources.filter((source) => !successfulSources.includes(source))

    // 경고 메시지 설정
    let warningMessage = undefined
    if (allErrors.length > 0) {
      warningMessage = `일부 뉴스 소스에서 오류가 발생했습니다: ${allErrors.slice(0, 2).join(", ")}`
    }

    return NextResponse.json({
      success: true,
      count: limitedNews.length,
      articles: limitedNews,
      sources: availableSources,
      successfulSources,
      failedSources,
      timestamp: new Date().toISOString(),
      warning: warningMessage,
      apiErrors: allErrors.length > 0 ? allErrors : undefined,
      hasRealNews: true,
      systemInfo: {
        naverNewsCount: naverNews.length,
        newsApiCount: newsApiNews.length,
        rssNewsCount: rssNews.length,
        totalSources: availableSources.length,
        activeFilters: enabledSources,
        totalErrors: allErrors.length,
      },
    })
  } catch (error) {
    console.error("💥 News API error:", error)

    return NextResponse.json({
      success: false,
      count: 0,
      articles: [],
      sources: ["네이버뉴스", "NewsAPI", "연합뉴스", "매일경제"],
      timestamp: new Date().toISOString(),
      error: "뉴스 수집 중 시스템 오류가 발생했습니다.",
      apiErrors: [error instanceof Error ? error.message : "System error"],
      hasRealNews: false,
      systemInfo: {
        naverNewsCount: 0,
        newsApiCount: 0,
        rssNewsCount: 0,
        totalErrors: 1,
      },
    })
  }
}

// POST 요청으로 특정 키워드 뉴스 검색
export async function POST(request: NextRequest) {
  try {
    const { keywords } = await request.json()

    if (!keywords || !Array.isArray(keywords)) {
      return NextResponse.json({ success: false, error: "키워드가 필요합니다." }, { status: 400 })
    }

    console.log("🔍 Searching news with keywords:", keywords)

    // 실제 뉴스에서 키워드 검색 (네이버 API만 사용)
    const { news: allNews } = await fetchNaverNews(true)

    const filteredNews = allNews.filter((news) =>
      keywords.some(
        (keyword: string) =>
          news.title.toLowerCase().includes(keyword.toLowerCase()) ||
          news.description.toLowerCase().includes(keyword.toLowerCase()) ||
          news.relatedCompanies.some((company) => company.toLowerCase().includes(keyword.toLowerCase())),
      ),
    )

    return NextResponse.json({
      success: true,
      count: filteredNews.length,
      articles: filteredNews,
      keywords,
      timestamp: new Date().toISOString(),
      searchInfo: {
        totalSearched: allNews.length,
        matchedResults: filteredNews.length,
        searchTerms: keywords,
      },
    })
  } catch (error) {
    console.error("News search error:", error)
    return NextResponse.json({ success: false, error: "뉴스 검색에 실패했습니다." }, { status: 500 })
  }
}
