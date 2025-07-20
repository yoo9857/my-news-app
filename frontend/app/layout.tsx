'use client';

import type { Viewport } from 'next';
import './globals.css';
import { Noto_Sans_KR } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/toaster";
import Footer from '@/components/footer';
import ClientSessionProvider from '@/components/client-session-provider'; // Import ClientSessionProvider

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
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${notoSansKr.className} antialiased bg-[#0F172A] text-gray-100`}>
        <ClientSessionProvider> {/* Wrap with ClientSessionProvider */}
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
        </ClientSessionProvider>
      </body>
    </html>
  );
}