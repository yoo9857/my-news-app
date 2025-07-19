import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function GET() {
  const client = await db.connect();
  try {
    // 'theme' 컬럼에서 NULL이 아니고 비어있지 않은 고유한 테마 목록을 조회합니다.
    // 관련 없는 테마나 너무 긴 테마를 제외하기 위해 theme 컬럼의 길이를 제한할 수 있습니다.
    const result = await client.query(
      "SELECT DISTINCT theme FROM stocks WHERE theme IS NOT NULL AND theme != '' AND LENGTH(theme) < 50 ORDER BY theme ASC"
    );
    
    // 데이터베이스에서 반환된 객체 배열에서 테마 이름만 추출하여 문자열 배열로 변환합니다.
    const themes = result.rows.map((row) => row.theme);
    
    return NextResponse.json({ success: true, data: themes });
  } catch (error) {
    console.error("API Error fetching themes:", error);
    return NextResponse.json(
      { success: false, error: "테마 목록 조회 중 서버 오류 발생" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
