import type { Metadata } from 'next';
import Script from 'next/script'; // 👈 애드센스 스크립트를 위해 추가
import './globals.css';

// 이 metadata 부분은 잘 작성하셨으니 그대로 둡니다.
export const metadata: Metadata = {
  title: '나만의 뉴스 앱',
  description: '매일 업데이트되는 최신 뉴스를 만나보세요.',
  openGraph: {
    title: '나만의 뉴스 앱',
    description: '매일 업데이트되는 최신 뉴스를 만나보세요.',
    images: ['/placeholder-logo.png'],
  },
  generator: 'v0.dev',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* 👇 여기에 애드센스 스크립트 코드를 추가 */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9021429421997169"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}