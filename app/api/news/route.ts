import { type NextRequest, NextResponse } from "next/server"
import { parseStringPromise } from 'xml2js'

// =========================================================================
// 1. 인터페이스 및 상수 정의
// =========================================================================

// 뉴스 아이템 인터페이스
interface NewsItem {
  id: string
  title: string
  description: string
  link: string
  pubDate: string // ISO 8601 형식 (예: "2023-10-27T10:00:00Z")
  source: string
  category: string
  sentiment: "긍정적" | "부정적" | "중립적"
  relatedCompanies: string[]
  imageUrl?: string // 뉴스 썸네일 이미지 URL (옵션)
}

// 사용자 정의 뉴스 소스 정의 (여기서는 사용되지 않음, 참고용)
// 이 배열은 네이버뉴스, NewsAPI와 같이 RSS가 아닌 기본 소스의 메타데이터입니다.
const NEWS_SOURCES_METADATA = [
  { name: "네이버뉴스", category: "경제" },
  { name: "NewsAPI", category: "국제경제" },
]

// API 요청 시 사용할 User-Agent (일관성 유지)
const USER_AGENT = "Mozilla/5.0 (compatible; NewsAggregator/1.0; +https://yourwebsite.com/)" // 실제 서비스 URL로 변경 권장
const FETCH_TIMEOUT = 10000; // API 호출 기본 타임아웃 (10초)

// =========================================================================
// 2. 유틸리티 함수
// =========================================================================

function cleanText(text: string): string {
  if (!text) return ""

  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&[^;]+;/g, " ")
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\{.*?\}/g, "")
    .replace(/【.*?】/g, "")
    .replace(/〈.*?〉/g, "")
    .replace(/《.*?》/g, "")
    .replace(/‘|’/g, "'")
    .replace(/“|”/g, '"')
    .replace(/\"|\'/g, "")
    .replace(/\|/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function analyzeSentiment(title: string, description: string): "긍정적" | "부정적" | "중립적" {
  const text = (title + " " + description).toLowerCase()

  const positiveKeywords = ["상승", "급등", "호실적", "성장", "수익", "흑자", "성공", "개발", "계약", "협력", "신고가", "반등", "강세", "수주", "인수", "합병", "증설", "확대", "투자", "선정", "호조", "개선", "증가", "상향", "돌파", "회복", "플러스", "긍정", "기대", "혁신", "출시", "론칭", "확보", "달성", "성과", "수혜", "부양", "활성화", "확장", "도약", "약진", "호황", "최고", "신기록", "brilliant", "growth", "profit", "success", "positive", "gain", "rise", "boost", "expansion", "achievement", "breakthrough", "record-high"]
  const negativeKeywords = ["하락", "급락", "손실", "적자", "부진", "우려", "위기", "충격", "약세", "신저가", "리스크", "부도", "파산", "중단", "취소", "과징금", "소송", "조사", "논란", "갈등", "감소", "하향", "악화", "부정", "타격", "침체", "둔화", "제재", "규제", "경고", "위험", "문제", "실망", "좌절", "폐쇄", "축소", "지연", "마이너스", "최저", "decline", "loss", "negative", "crisis", "risk", "concern", "problem", "issue", "drop", "fall", "deterioration"]

  let positiveScore = 0
  let negativeScore = 0
  positiveKeywords.forEach((keyword) => { positiveScore += (text.match(new RegExp(keyword, "g")) || []).length })
  negativeKeywords.forEach((keyword) => { negativeScore += (text.match(new RegExp(keyword, "g")) || []).length })

  if (positiveScore > negativeScore && positiveScore > 0) return "긍정적"
  if (negativeScore > positiveScore && negativeScore > 0) return "부정적"
  return "중립적"
}

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
  return foundCompanies.slice(0, 3)
}

// =========================================================================
// 3. 개별 뉴스 API 호출 함수
// =========================================================================

async function fetchNaverNews(enabled = true, customSearchTerms: string[] = []): Promise<{ news: NewsItem[]; errors: string[] }> {
  const news: NewsItem[] = []
  const errors: string[] = []

  if (!enabled) {
    console.log("🔇 Naver News API disabled by user or not requested.")
    return { news, errors }
  }

  const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID
  const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET

  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    const errorMsg = "네이버 API 키가 설정되지 않았습니다. (.env.local 파일 확인)";
    console.error(`❌ ${errorMsg}`);
    errors.push(errorMsg);
    return { news, errors }
  }

  try {
    console.log("🔍 Fetching Naver News...");
    const defaultSearchTerms = ["한국 경제", "코스피", "증시", "반도체", "삼성전자 주가", "SK하이닉스 실적", "현대자동차 전기차", "LG에너지솔루션 배터리", "네이버 AI", "카카오 주식",];
    // customSearchTerms가 제공되면 그것을 사용하고, 아니면 defaultSearchTerms를 사용
    const termsToUse = customSearchTerms.length > 0 ? customSearchTerms.slice(0, 5) : defaultSearchTerms.slice(0, 6);

    for (const term of termsToUse) {
      try {
        const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(term)}&display=5&sort=date&start=1`;
        console.log(`➡️ Calling Naver API for term: "${term}"`);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "X-Naver-Client-Id": NAVER_CLIENT_ID,
            "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
            "User-Agent": USER_AGENT,
          },
          signal: AbortSignal.timeout(FETCH_TIMEOUT),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.items && data.items.length > 0) {
            console.log(`✅ Naver API success for "${term}": ${data.items.length} articles found.`)
            const naverArticles = data.items.map((item: any, index: number) => ({
              id: `naver-${term.replace(/\s+/g, "-")}-${new Date(item.pubDate).getTime()}-${index}`,
              title: cleanText(item.title),
              description: cleanText(item.description),
              link: item.originallink || item.link,
              pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
              source: "네이버뉴스",
              category: "경제",
              sentiment: analyzeSentiment(cleanText(item.title), cleanText(item.description)),
              relatedCompanies: findRelatedCompanies(cleanText(item.title), cleanText(item.description)),
              imageUrl: undefined,
            }));
            news.push(...naverArticles);
          } else {
            console.log(`ℹ️ Naver API for "${term}": No articles found.`)
          }
        } else {
          const errorData = await response.json();
          const errorMsg = `네이버 API 실패 for "${term}" [${response.status}]: ${errorData.errorMessage || JSON.stringify(errorData)}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(`네이버뉴스 (${term}): ${errorData.errorMessage || `HTTP ${response.status}`}`);
        }
      } catch (termError: any) {
        if (termError.name === 'TimeoutError') {
          console.error(`❌ Naver API timeout for "${term}".`);
          errors.push(`네이버뉴스 (${term}): 요청 타임아웃`);
        } else {
          console.error(`❌ Naver API fetch error for "${term}":`, termError);
          errors.push(`네이버뉴스 (${term}): ${termError.message || '알 수 없는 오류'}`);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  } catch (error: any) {
    console.error("💥 Naver API general error:", error);
    errors.push(`네이버뉴스 전체: ${error.message || '연결 실패'}`);
  }
  return { news, errors };
}

async function fetchNewsAPI(enabled = true, customSearchTerms: string[] = []): Promise<{ news: NewsItem[]; errors: string[] }> {
  const news: NewsItem[] = []
  const errors: string[] = []

  if (!enabled) {
    console.log("🔇 NewsAPI disabled by user or not requested.")
    return { news, errors }
  }

  const NEWS_API_KEY = process.env.NEWS_API_KEY

  if (!NEWS_API_KEY) {
    const errorMsg = "NewsAPI 키가 설정되지 않았습니다. (.env.local 파일 확인)";
    console.error(`❌ ${errorMsg}`);
    errors.push(errorMsg);
    return { news, errors }
  }

  try {
    console.log("🔍 Fetching NewsAPI...")

    const defaultQueries = [
      "South Korea economy", "Korean stock market", "Samsung Electronics",
      "Hyundai Motor", "LG Energy Solution", "Korean semiconductor"
    ]
    // customSearchTerms가 제공되면 그것을 사용하고, 아니면 defaultQueries를 사용
    const termsToUse = customSearchTerms.length > 0 ? customSearchTerms.slice(0, 3) : defaultQueries.slice(0, 3); // Limit to 3 queries

    for (const term of termsToUse) {
      try {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(term)}&language=en&sortBy=publishedAt&pageSize=7&apiKey=${NEWS_API_KEY}`; // pageSize 7
        console.log(`➡️ Calling NewsAPI for query: "${term}"`);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent": USER_AGENT,
          },
          signal: AbortSignal.timeout(FETCH_TIMEOUT),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.articles && data.articles.length > 0) {
            console.log(`✅ NewsAPI success for "${term}": ${data.articles.length} articles found.`)
            const newsApiArticles = data.articles
              .filter((item: any) => item.title && item.description && item.url)
              .map((item: any, index: number) => ({
                id: `newsapi-${term.replace(/\s+/g, "-")}-${new Date(item.publishedAt).getTime()}-${index}`,
                title: cleanText(item.title),
                description: cleanText(item.description),
                link: item.url,
                pubDate: item.publishedAt || new Date().toISOString(),
                source: item.source?.name || "NewsAPI",
                category: "국제경제",
                sentiment: analyzeSentiment(cleanText(item.title), cleanText(item.description)),
                relatedCompanies: findRelatedCompanies(cleanText(item.title), cleanText(item.description)),
                imageUrl: item.urlToImage || undefined,
              }))
            news.push(...newsApiArticles)
          } else {
            console.log(`ℹ️ NewsAPI for "${term}": No articles found.`)
          }
        } else {
          const errorData = await response.json();
          const errorMsg = `NewsAPI 실패 for "${term}" [${response.status}]: ${errorData.message || JSON.stringify(errorData)}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(`NewsAPI (${term}): ${errorData.message || `HTTP ${response.status}`}`);
        }
      } catch (termError: any) {
        if (termError.name === 'TimeoutError') {
          console.error(`❌ NewsAPI timeout for "${term}".`);
          errors.push(`NewsAPI (${term}): 요청 타임아웃`);
        } else {
          console.error(`❌ NewsAPI fetch error for "${term}":`, termError);
          errors.push(`NewsAPI (${term}): ${termError.message || '알 수 없는 오류'}`);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch (error: any) {
    console.error("💥 NewsAPI general error:", error);
    errors.push(`NewsAPI 전체: ${error.message || '연결 실패'}`);
  }
  return { news, errors }
}

/**
 * RSS 피드 파싱 함수 (연합뉴스, 매일경제 등 한국 언론사)
 * @param enabledSources - 활성화된 RSS 피드 이름 목록
 */

// RSS 피드 파싱 (추가 뉴스 소스) - xml2js 적용
async function fetchRSSNews(enabledSources: string[] = []): Promise<{ news: NewsItem[]; errors: string[] }> {
  const news: NewsItem[] = []
  const errors: string[] = []

  if (!enabledSources || enabledSources.length === 0) {
    console.log("🔇 No RSS feeds enabled or requested.")
    return { news, errors }
  }

  // 한국 주요 언론사 RSS 피드 정보
  // ************ 중요: URL 유효성 및 내용 (경제 뉴스만 포함 여부)을 반드시 확인하세요 ************
  const rssFeeds = [
    {
      name: "연합뉴스",
      url: "https://www.yna.co.kr/rss/economy.xml", // 경제 섹션
      category: "경제",
    },
    {
      name: "매일경제",
      url: "https://www.mk.co.kr/rss/40300001/", // 매일경제 경제/증권 섹션 (주신 URL)
      category: "경제",
    },
    {
      name: "이투데이",
      url: "https://rss.etoday.co.kr/eto/etoday_news_all.xml", // 이투데이 전체 뉴스 (확인 필요)
      category: "경제", // 일단 경제로 설정하지만, 내용 확인 필요
    },
    {
      name: "아시아경제",
      url: "https://www.asiae.co.kr/rss/all.htm", // 아시아경제 전체 (확장자 .htm 확인 필요)
      category: "경제",
    },
    {
      name: "이데일리",
      url: "http://rss.edaily.co.kr/happypot_news.xml", // 이데일리 행복팟 뉴스 (경제 관련성 확인 필요)
      category: "경제", // 일단 경제로 설정하지만, 내용 확인 필요
    },
    // 아래 소스들은 요청에 따라 제외됩니다.
    // { name: "한국경제", url: "https://www.hankyung.com/feed/economy", category: "경제" },
    // { name: "머니투데이", url: "https://rss.mt.co.kr/mt_news.xml", category: "경제" },
    // { name: "조선비즈", url: "https://biz.chosun.com/rss/xml/news.xml", category: "경제" },
    // { name: "서울경제", url: "https://www.sedaily.com/rss/economy", category: "경제" },
    // { name: "파이낸셜뉴스", url: "https://www.fnnews.com/rss/economy.xml", category: "경제" },
  ]

  // 활성화된 피드만 필터링
  const activeFeeds = rssFeeds.filter((feed) => enabledSources.includes(feed.name))

  if (activeFeeds.length === 0) {
    console.log("🔇 All RSS feeds disabled by user or not requested.")
    return { news, errors }
  }

  for (const feed of activeFeeds) {
    try {
      console.log(`🔍 Fetching RSS from ${feed.name} (${feed.url})...`);

      const response = await fetch(feed.url, {
        method: "GET",
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": "application/xml, text/xml, */*",
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
      })

      if (response.ok) {
        const xmlText = await response.text();
        if (!xmlText.trim().startsWith('<')) {
          console.error(`❌ ${feed.name} URL (${feed.url}) did not return XML. Content starts with: ${xmlText.slice(0, 50)}`);
          errors.push(`${feed.name} RSS 피드: XML 형식이 아님`);
          continue;
        }

        try {
            const result = await parseStringPromise(xmlText, { explicitArray: false, ignoreAttrs: false });

            const channel = result.rss.channel;
            const items = Array.isArray(channel.item) ? channel.item : (channel.item ? [channel.item] : []);

            let processedItems = 0;

            for (const item of items.slice(0, 10)) {
              if (!item) continue;

              try {
                const rawTitle = item.title || "";
                const rawDescription = item.description || "";
                const link = item.link || "";
                const pubDateStr = item.pubDate || "";

                const title = cleanText(rawTitle);
                const description = cleanText(rawDescription);
                let pubDate: string;
                try {
                    const parsedDate = new Date(pubDateStr);
                    if (isNaN(parsedDate.getTime())) {
                        console.warn(`⚠️ Invalid pubDate found for ${feed.name} item. Using current time. Raw: "${pubDateStr}"`);
                        pubDate = new Date().toISOString();
                    } else {
                        pubDate = parsedDate.toISOString();
                    }
                } catch (dateError) {
                    console.error(`💥 Error parsing pubDate for ${feed.name} item: ${dateError}. Using current time. Raw: "${pubDateStr}"`);
                    pubDate = new Date().toISOString();
                }

                let imageUrl: string | undefined;

                if (item['media:content'] && item['media:content'].$ && item['media:content'].$.url) {
                    imageUrl = item['media:content'].$.url;
                } else if (item.enclosure && item.enclosure.$ && item.enclosure.$.url) {
                    imageUrl = item.enclosure.$.url;
                } else {
                    const imgTagMatch = rawDescription.match(/<img\s+src=["'](.*?)["']/i);
                    if (imgTagMatch && imgTagMatch[1] && imgTagMatch[1].length > 10) {
                        const potentialImageUrl = imgTagMatch[1];
                        if (!potentialImageUrl.includes('logo') && !potentialImageUrl.includes('icon') && !potentialImageUrl.includes('spacer') && !potentialImageUrl.endsWith('.gif')) {
                          imageUrl = potentialImageUrl;
                        }
                    }
                }

                if (title && description && link) {
                  news.push({
                    id: `rss-${feed.name}-${new Date(pubDate).getTime()}-${processedItems}`,
                    title,
                    description,
                    link,
                    pubDate,
                    source: feed.name,
                    category: feed.category,
                    sentiment: analyzeSentiment(title, description),
                    relatedCompanies: findRelatedCompanies(title, description),
                    imageUrl: imageUrl,
                  });
                  processedItems++;
                }
              } catch (itemParseError) {
                console.error(`❌ RSS item parsing error for ${feed.name}:`, itemParseError);
              }
            }
            console.log(`✅ RSS success for ${feed.name}: ${processedItems} articles processed.`);
        } catch (parseError: any) {
            console.error(`❌ XML parsing failed for ${feed.name}:`, parseError);
            errors.push(`${feed.name} RSS 피드: XML 파싱 오류`);
        }

      } else {
        const errorText = await response.text();
        console.error(`❌ RSS failed for ${feed.name} [${response.status}]: ${errorText.slice(0, 200)}...`);
        errors.push(`${feed.name} RSS 피드 접근 실패 (HTTP ${response.status})`);
      }
    } catch (error: any) {
      if (error.name === 'TimeoutError') {
        console.error(`❌ RSS timeout for ${feed.name}.`);
        errors.push(`${feed.name} RSS: 요청 타임아웃`);
      } else {
        console.error(`💥 RSS general error for ${feed.name}:`, error);
        errors.push(`${feed.name} RSS: ${error.message || '연결 실패'}`);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return { news, errors }
}


// =========================================================================
// 4. 메인 API 라우트 핸들러 (GET)
// =========================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sourcesParam = searchParams.get("sources")
    const queryParam = searchParams.get("query"); // 검색어 파라미터 추출

    let enabledSources: string[] = []
    if (sourcesParam) {
      enabledSources = sourcesParam.split(",").map(s => s.trim()).filter((source) => source !== "")
    } else {
      // 프론트엔드에서 아무 소스도 명시하지 않으면 모든 소스를 기본으로 활성화
      enabledSources = NEWS_SOURCES_METADATA.map(s => s.name).concat([
        "연합뉴스", "매일경제", "이투데이", "아시아경제", "이데일리"
      ]);
    }


    console.log(`🚀 Starting news collection at ${new Date().toISOString()}`);
    console.log("📋 Enabled sources (GET):", enabledSources.length > 0 ? enabledSources.join(", ") : "None selected");
    if (queryParam) {
      console.log("🔍 Search query (GET):", queryParam);
    }


    if (enabledSources.length === 0 && !queryParam) { // 검색어가 없으면서 소스도 선택되지 않은 경우
      console.log("⚠️ No sources enabled and no query, returning error.");
      return NextResponse.json({
        success: false,
        count: 0,
        articles: [],
        sources: NEWS_SOURCES_METADATA.map(s => s.name).concat([
          "연합뉴스", "매일경제", "이투데이", "아시아경제", "이데일리"
        ]),
        timestamp: new Date().toISOString(),
        error: "뉴스 소스를 하나 이상 선택하거나 검색어를 입력해주세요.",
        hasRealNews: false,
        systemInfo: { naverNewsCount: 0, newsApiCount: 0, rssNewsCount: 0, totalErrors: 0 },
      }, { status: 400 }); // 400 Bad Request
    }

    const allNews: NewsItem[] = []
    const allErrors: string[] = []
    let naverNewsCount = 0;
    let newsApiCount = 0;
    let rssNewsCount = 0;

    // 각 소스별로 조건부 호출
    const isNaverEnabled = enabledSources.includes("네이버뉴스")
    const isNewsAPIEnabled = enabledSources.includes("NewsAPI")
    
    // rssActiveSources를 더 동적으로 변경:
    // fetchRSSNews 함수 내의 rssFeeds 배열에 정의된 모든 RSS 소스 이름을 가져와서
    // 현재 enabledSources에 포함된 것들만 필터링하도록 합니다.
    const allRssFeedNames = [
        "연합뉴스",
        "매일경제",
        "이투데이",
        "아시아경제",
        "이데일리"
    ];
    const rssActiveSources = enabledSources.filter((source) => allRssFeedNames.includes(source));

    // 병렬 호출 (Race condition 주의, 뉴스 기사 ID 중복 방지 로직 필요)
    const [naverResult, newsApiResult, rssResult] = await Promise.all([
      // 검색어가 있으면 해당 검색어를 customSearchTerms로 전달
      fetchNaverNews(isNaverEnabled, queryParam ? [queryParam] : []),
      fetchNewsAPI(isNewsAPIEnabled, queryParam ? [queryParam] : []),
      fetchRSSNews(rssActiveSources), // RSS는 현재 검색어 필터링을 직접 지원하지 않음
    ]);

    allNews.push(...naverResult.news);
    allErrors.push(...naverResult.errors);
    naverNewsCount = naverResult.news.length;

    allNews.push(...newsApiResult.news);
    allErrors.push(...newsApiResult.errors);
    newsApiCount = newsApiResult.news.length;

    allNews.push(...rssResult.news);
    allErrors.push(...rssResult.errors);
    rssNewsCount = rssResult.news.length;


    // 중복 제거 (link를 기준으로 중복 제거하는 것이 제목보다 더 정확함)
    const uniqueNewsMap = new Map<string, NewsItem>();
    allNews.forEach(newsItem => {
        // 링크가 없으면 제목과 소스로 고유성 판단
        const key = newsItem.link ? newsItem.link : `${newsItem.title}-${newsItem.source}`;
        uniqueNewsMap.set(key, newsItem);
    });
    const uniqueNews = Array.from(uniqueNewsMap.values());

    // 날짜순 정렬 (최신순)
    uniqueNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())

    // 검색어가 있다면 필터링 추가 (RSS는 제외)
    // RSS 피드는 자체 검색 기능을 제공하지 않으므로, 가져온 후 필터링
    const filteredByQueryNews = queryParam
      ? uniqueNews.filter(
          (article) =>
            article.title.toLowerCase().includes(queryParam.toLowerCase()) ||
            article.description.toLowerCase().includes(queryParam.toLowerCase()) ||
            (article.relatedCompanies && article.relatedCompanies.some(company => company.toLowerCase().includes(queryParam.toLowerCase())))
        )
      : uniqueNews;

    // 최대 30개 기사로 제한
    const limitedNews = filteredByQueryNews.slice(0, 30)

    console.log(`✅ Returning ${limitedNews.length} real news articles. Total errors: ${allErrors.length}`);

    // 성공/실패 소스 분류
    // NEWS_SOURCES_METADATA는 네이버뉴스, NewsAPI를 포함합니다.
    // 여기에 fetchRSSNews에서 사용되는 모든 RSS 피드의 이름을 추가해야 합니다.
    const allAvailableSources = NEWS_SOURCES_METADATA.map(s => s.name).concat([
        "연합뉴스",
        "매일경제",
        "이투데이",
        "아시아경제",
        "이데일리",
    ]);

    const successfulSources = allAvailableSources.filter((source) => limitedNews.some((news) => news.source === source));
    const failedSources = enabledSources.filter((source) => !successfulSources.includes(source) || allErrors.some(err => err.includes(source))); // 에러 발생 소스도 실패로 간주

    let warningMessage: string | undefined = undefined;
    if (allErrors.length > 0) {
      warningMessage = `일부 뉴스 소스에서 오류가 발생했습니다 (${allErrors.length}건): ${allErrors.slice(0, 2).join("; ")}${allErrors.length > 2 ? '...' : ''}`;
    }
    if (failedSources.length > 0 && !warningMessage) { // 에러 메시지가 없는데 실패 소스만 있다면 경고 추가
        warningMessage = `${failedSources.join(", ")}에서 뉴스를 가져오지 못했습니다.`;
    }

    // 요청된 지연 시간 (3초)
    await new Promise(resolve => setTimeout(resolve, 3000));

    return NextResponse.json({
      success: limitedNews.length > 0, // 뉴스가 하나라도 있으면 성공
      count: limitedNews.length,
      articles: limitedNews,
      sources: allAvailableSources, // 이 부분이 프론트엔드에 '전체 소스 목록'으로 전달됩니다.
      successfulSources,
      failedSources,
      timestamp: new Date().toISOString(),
      warning: warningMessage,
      apiErrors: allErrors.length > 0 ? allErrors : undefined,
      hasRealNews: limitedNews.length > 0,
      systemInfo: {
        naverNewsCount: naverNewsCount,
        newsApiCount: newsApiCount,
        rssNewsCount: rssNewsCount,
        totalSources: allAvailableSources.length, // 여기에도 반영
        activeFilters: enabledSources,
        totalErrors: allErrors.length,
      },
    });

  } catch (error: any) {
    console.error("💥 News API general system error in GET handler:", error);
    return NextResponse.json({
      success: false,
      count: 0,
      articles: [],
      // 오류 발생 시에도 allAvailableSources 목록을 정확히 반환하도록 업데이트
      sources: NEWS_SOURCES_METADATA.map(s => s.name).concat([
        "연합뉴스", "매일경제", "이투데이", "아시아경제", "이데일리"
      ]),
      timestamp: new Date().toISOString(),
      error: `뉴스 수집 중 시스템 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`,
      apiErrors: [error.message || "System error"],
      hasRealNews: false,
      systemInfo: { naverNewsCount: 0, newsApiCount: 0, rssNewsCount: 0, totalErrors: 1 },
    }, { status: 500 }); // 500 Internal Server Error
  }
}

// =========================================================================
// 5. 메인 API 라우트 핸들러 (POST - 특정 키워드 뉴스 검색)
// =========================================================================

export async function POST(request: NextRequest) {
  try {
    const { keywords } = await request.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ success: false, error: "유효한 검색 키워드가 필요합니다." }, { status: 400 });
    }

    console.log("🔍 Starting news search with keywords (POST):", keywords.join(", "));

    // POST 요청 시에는 전달받은 키워드를 사용하여 네이버 뉴스만 검색 (필요시 NewsAPI, RSS도 추가 가능)
    // fetchNaverNews 함수에 keywords를 전달하여 동적으로 검색
    const { news: searchedNews, errors: searchErrors } = await fetchNaverNews(true, keywords);

    // 검색된 뉴스들을 추가 필터링할 필요 없이 바로 반환 (fetchNaverNews에서 이미 검색어로 가져옴)
    const finalNews = searchedNews.slice(0, 30); // 최대 30개 제한

    console.log(`✅ Returning ${finalNews.length} searched news articles.`);

    let warningMessage: string | undefined = undefined;
    if (searchErrors.length > 0) {
      warningMessage = `뉴스 검색 중 오류가 발생했습니다: ${searchErrors.slice(0, 2).join("; ")}${searchErrors.length > 2 ? '...' : ''}`;
    }

    return NextResponse.json({
      success: finalNews.length > 0,
      count: finalNews.length,
      articles: finalNews,
      keywords,
      timestamp: new Date().toISOString(),
      warning: warningMessage,
      apiErrors: searchErrors.length > 0 ? searchErrors : undefined,
      searchInfo: {
        totalSearched: searchedNews.length, // 필터링 전 총 검색된 기사 수
        matchedResults: finalNews.length, // 최종 반환된 기사 수
        searchTerms: keywords,
      },
    });

  } catch (error: any) {
    console.error("💥 News search system error in POST handler:", error);
    return NextResponse.json({
      success: false,
      error: `뉴스 검색 중 시스템 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
