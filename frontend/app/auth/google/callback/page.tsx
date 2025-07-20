'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

const GoogleCallbackPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = searchParams.get('code'); // Authorization code from Google

  useEffect(() => {
    if (code) {
      // Directly use signIn from next-auth
      signIn('google', { callbackUrl: '/dashboard', code });
    } else {
      // If no code, it means this page was likely accessed directly or an error occurred.
      router.push('/login?error=no_google_code');
    }
  }, [code, router]);

  // This component primarily acts as a redirect handler.
  // You might show a loading spinner here.
  return (
    <div>
      <p>Processing Google login...</p>
    </div>
  );
};

export default GoogleCallbackPage;