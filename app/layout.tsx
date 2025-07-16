'use client';

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Noto_Sans_KR } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/toaster";
import Footer from '@/components/footer';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '700'],
});

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
  const pathname = usePathname();

  useEffect(() => {
    // This check ensures the code runs only on the client-side
    if (typeof window !== 'undefined') {
      const logVisit = async () => {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/log_visit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path: pathname }),
          });
        } catch (error) {
          console.error('Failed to log visit:', error);
        }
      };
      logVisit();
    }
  }, [pathname]);

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${notoSansKr.className} antialiased bg-[#0F172A] text-gray-100`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}