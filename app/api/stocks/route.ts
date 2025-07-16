import { type NextRequest, NextResponse } from "next/server";

// 백엔드 API 서버의 주소
const API_URL = process.env.NEXT_PUBLIC_STOCK_API_URL;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // 백엔드 API로 전달할 파라미터를 그대로 가져옵니다.
  const apiParams = new URLSearchParams();
  
  // 검색어, 테마, 정렬 기준, 페이지네이션 등 모든 파라미터를 추가
  searchParams.forEach((value, key) => {
    apiParams.append(key, value);
  });

  try {
    // 백엔드 FastAPI 서버의 /api/all-companies 엔드포인트를 호출합니다.
    // (엔드포인트 이름이 all-companies 이므로 수정이 필요할 수 있습니다. 
    //  우선은 all-companies로 가정하고 진행합니다.)
    const response = await fetch(`${API_URL}/api/all-companies?${apiParams.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        // Next.js 14 캐싱 전략 설정 (필요에 따라 조정)
        cache: 'no-store', 
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error from backend" }));
      console.error(`API Error from backend: ${response.status}`, errorData);
      return NextResponse.json(
        { success: false, error: `백엔드 서버 오류: ${errorData.error || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 백엔드에서 받은 데이터를 그대로 클라이언트에 전달
    return NextResponse.json(data);

  } catch (error) {
    console.error("API Route Error fetching from backend:", error);
    
    // 네트워크 오류 등 fetch 자체의 문제일 경우
    if (error instanceof TypeError) {
        return NextResponse.json(
            { success: false, error: "백엔드 서비스에 연결할 수 없습니다. 서비스가 실행 중인지 확인해주세요." },
            { status: 503 } // Service Unavailable
        );
    }

    return NextResponse.json(
      { success: false, error: "주식 정보 조회 중 내부 오류 발생" },
      { status: 500 }
    );
  }
}