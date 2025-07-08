import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  // 1. 기본 제목과 설명 변경
  title: '나만의 뉴스 앱', // 👈 여기에 원하는 제목을 입력하세요.
  description: '매일 업데이트되는 최신 뉴스를 만나보세요.', // 👈 여기에 원하는 설명을 입력하세요.

  // 2. 링크 공유 시 보일 정보 (Open Graph) 추가
  openGraph: {
    title: '나만의 뉴스 앱', // 공유될 때 보일 제목 (보통 위 제목과 동일)
    description: '매일 업데이트되는 최신 뉴스를 만나보세요.', // 공유될 때 보일 설명
    images: ['/placeholder-logo.png'], // 👈 공유될 대표 이미지 경로 (public 폴더 기준)
  },
  
  // generator는 v0 정보이므로 삭제하거나 그대로 두셔도 괜찮습니다.
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
