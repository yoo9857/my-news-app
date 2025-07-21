'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import type { Viewport } from 'next';
import './globals.css';
import { Noto_Sans_KR } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/toaster";
import Footer from '@/components/footer';
import ClientSessionProvider from '@/components/client-session-provider'; // Import ClientSessionProvider

const notoSansKr = Noto_Sans_KR({
  subsets: ['korean'],
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
            <NicknameRedirector>{children}</NicknameRedirector>
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

function NicknameRedirector({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Check if nickname is empty or null
      if (!session.user.nickname) {
        // Redirect only if not already on the setup page
        if (pathname !== '/setup-profile') {
          router.push('/setup-profile');
        }
      }
    }
  }, [session, status, router, pathname]);

  return <>{children}</>;
}