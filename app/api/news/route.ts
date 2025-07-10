import { type NextRequest, NextResponse } from "next/server";
import { parseStringPromise } from 'xml2js';

// --- 인터페이스 정의 ---
interface NewsItem {
  id: string; title: string; description: string; link: string;
  pubDate: string; source: string; sentiment: "긍정적" | "부정적" | "중립적";
  relatedCompanies: string[]; imageUrl?: string;
}

// --- 유틸리티 함수 ---
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
const FETCH_TIMEOUT = 8000;

function cleanText(text: string): string {
  return text ? text.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').trim() : "";
}

function analyzeSentiment(text: string): "긍정적" | "부정적" | "중립적" {
    const positiveKeywords = ["상승", "급등", "호실적", "성장", "수익", "흑자", "성공", "개발", "계약", "협력", "신고가"];
    const negativeKeywords = ["하락", "급락", "손실", "적자", "부진", "우려", "위기", "충격", "약세", "신저가"];
    const positiveScore = positiveKeywords.filter(k => text.toLowerCase().includes(k)).length;
    const negativeScore = negativeKeywords.filter(k => text.toLowerCase().includes(k)).length;
    if (positiveScore > negativeScore) return "긍정적";
    if (negativeScore > positiveScore) return "부정적";
    return "중립적";
}

// --- 개별 뉴스 소스 호출 함수 ---

async function fetchNaverNews(query: string): Promise<NewsItem[]> {
  const { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET } = process.env;
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) return [];
  try {
    const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=20&sort=date`;
    const response = await fetch(url, {
      headers: { "X-Naver-Client-Id": NAVER_CLIENT_ID, "X-Naver-Client-Secret": NAVER_CLIENT_SECRET },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.items?.map((item: any) => {
        const title = cleanText(item.title);
        const description = cleanText(item.description);
        return {
            id: `naver-${item.link}`, title, description,
            link: item.originallink || item.link,
            pubDate: new Date(item.pubDate).toISOString(),
            source: "네이버뉴스", sentiment: analyzeSentiment(title + description),
            relatedCompanies: [], // 필요시 findRelatedCompanies 구현
        };
    }) || [];
  } catch (e) { console.error("Naver News Error:", e); return []; }
}

async function fetchGoogleNews(query: string): Promise<NewsItem[]> {
    try {
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
        const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
        if (!response.ok) return [];
        const result = await parseStringPromise(await response.text(), { explicitArray: false });
        const items = result.rss.channel.item || [];
        const newsItems = Array.isArray(items) ? items : [items];

        return newsItems.slice(0, 20).map((item: any) => {
            const title = cleanText(item.title);
            const description = cleanText(item.description || '');
            return {
                id: `google-${item.guid['#text'] || item.link}`, title, description,
                link: item.link, pubDate: new Date(item.pubDate).toISOString(),
                source: "구글뉴스", sentiment: analyzeSentiment(title + description),
                relatedCompanies: [],
            };
        });
    } catch (e) { console.error("Google News Error:", e); return []; }
}


// --- 메인 API 라우트 핸들러 ---

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "코스피, 경제, 증시"; // 기본 검색어

    const [naverNews, googleNews] = await Promise.all([
      fetchNaverNews(query),
      fetchGoogleNews(query),
    ]);

    const allNews = [...naverNews, ...googleNews];

    const uniqueNewsMap = new Map<string, NewsItem>();
    allNews.forEach(item => uniqueNewsMap.set(item.link, item));
    const uniqueNews = Array.from(uniqueNewsMap.values())
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    return NextResponse.json({
      success: true,
      articles: uniqueNews.slice(0, 40),
      sources: ["네이버뉴스", "구글뉴스"],
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: "뉴스 수집 중 오류 발생" }, { status: 500 });
  }
}