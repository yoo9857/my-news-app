import type { Metadata, Viewport } from 'next';
import './globals.css'; // 전역 스타일 임포트
import { Noto_Sans_KR } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider'; // ThemeProvider 임포트
import { Toaster } from "@/components/ui/toaster"; // Toaster 컴포넌트 임포트

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: '대한민국 투자 플랫폼',
  description: 'AI 기반 한국 주식 시장 분석 및 투자 관리 플랫폼',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${notoSansKr.className} antialiased bg-[#0F172A] text-gray-100`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark" // 기본 다크 모드 설정
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster /> {/* 토스트 알림을 위한 Toaster 컴포넌트 추가 */}
        </ThemeProvider>
      </body>
    </html>
  );
}