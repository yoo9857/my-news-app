import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone(); // 요청 URL을 복제합니다.
  const { hostname } = url;

  // 루트 도메인을 환경 변수에서 가져오거나 기본값을 사용합니다.
  // 예: onedaytrading.net
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'onedaytrading.net';

  // 서브도메인을 추출합니다. (예: 'psychology')
  const subdomain = hostname.replace(`.${rootDomain}`, '');

  // psychology 서브도메인으로 접속한 경우
  if (subdomain === 'psychology') {
    // 경로가 이미 /psychology-research로 시작하지 않는 경우에만 추가합니다.
    if (!url.pathname.startsWith('/psychology-research')) {
      url.pathname = `/psychology-research${url.pathname}`;
    }
    return NextResponse.rewrite(url);
  }

  // 그 외의 다른 요청은 그대로 통과시킵니다.
  return NextResponse.next();
}

export const config = {
  // 미들웨어가 실행될 경로를 지정합니다.
  // 모든 경로에서 실행되도록 설정하여 서브도메인을 감지합니다.
  matcher: [
    /*
     * 아래와 일치하는 경로를 제외한 모든 요청 경로와 일치합니다:
     * - api (API 라우트)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘 파일)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
