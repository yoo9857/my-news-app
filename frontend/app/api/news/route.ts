import { type NextRequest, NextResponse } from "next/server";

// --- 인터페이스 정의 ---
interface NewsItem {
  id: string; title: string; description: string; link: string;
  published_at: string; source: string; sentiment: "긍정적" | "부정적" | "중립적";
  relatedCompanies: string[]; imageUrl?: string;
}

// --- 메인 API 라우트 핸들러 ---

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "50"; // Default limit

    const backendUrl = `http://localhost:8002/api/news?limit=${limit}`;
    const response = await fetch(backendUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      // Consider adding revalidation or caching strategies if needed
      // next: { revalidate: 60 }, // Revalidate every 60 seconds
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Backend News API Error: ${response.status} - ${response.statusText}, Body: ${errorBody}`);
      return NextResponse.json({ success: false, error: "Failed to fetch news from backend" }, { status: response.status });
    }

    const data = await response.json();

    // Map backend data to frontend NewsItem interface if necessary
    const articles: NewsItem[] = data.data.map((item: any) => {
      console.log(`Backend item.url: ${item.url}`); // Log backend URL
      const mappedLink = item.url; // This is what gets mapped to link
      console.log(`Mapped item.link: ${mappedLink}`); // Log mapped link
      return ({
        id: item.url, // Using URL as a unique ID
        title: item.title,
        description: item.description || "", // Backend might not always provide description
        link: mappedLink,
        published_at: item.published_at, // Corrected mapping
        source: item.source,
        sentiment: item.sentiment_label === "neutral" ? "중립적" : item.sentiment_label, // Adjust sentiment mapping
        relatedCompanies: [], // Backend doesn't provide this directly yet
        imageUrl: undefined, // Backend doesn't provide this directly yet
      });
    });

    return NextResponse.json({
      success: true,
      articles: articles,
      sources: ["Backend API"],
    });

  } catch (error: any) {
    console.error("Error fetching news in frontend API route:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}