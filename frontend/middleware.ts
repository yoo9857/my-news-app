import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { hostname } = url;
  const rootDomain = 'onedaytrading.net';

  // 호스트 이름이 루트 도메인 자체이거나 www 같은 일반적인 서브도메인이면 처리를 중단합니다.
  if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
    return NextResponse.next();
  }

  const subdomain = hostname.replace(`.${rootDomain}`, '');

  // 'psychology' 서브도메인으로 접속한 경우
  if (subdomain === 'psychology') {
    // 요청 경로를 /psychology-research 로 재작성합니다.
    // 예: psychology-research.onedaytrading.net/tci-test -> onedaytrading.net/psychology-research/tci-test
    url.pathname = `/psychology-research${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // 다른 서브도메인이나 처리 규칙이 필요하다면 여기에 추가할 수 있습니다.

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
