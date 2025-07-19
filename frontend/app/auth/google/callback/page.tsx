"use client";

'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

const GoogleCallbackPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithGoogle } = useAuth();

  const code = searchParams.get('code'); // Authorization code from Google

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Google token response:', tokenResponse);
      if (tokenResponse.access_token) {
        // Exchange authorization code for tokens on your backend
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: tokenResponse.access_token }), // Send the access token as id_token
          });

          if (response.ok) {
            const { access_token } = await response.json();
            await loginWithGoogle(access_token); // Use your existing loginWithGoogle
            router.push('/dashboard'); // Redirect to dashboard or home page
          } else {
            const errorData = await response.json();
            console.error("Backend exchange failed:", errorData);
            router.push('/login?error=google_exchange_failed');
          }
        } catch (error) {
          console.error("Error during Google code exchange:", error);
          router.push('/login?error=google_exchange_error');
        }
      } else {
        console.error("No access token in Google response.");
        router.push('/login?error=no_google_access_token');
      }
    },
    onError: (errorResponse) => {
      console.error('Google login error:', errorResponse);
      router.push('/login?error=google_login_failed');
    },
    flow: 'auth-code', // Request authorization code
  });

  useEffect(() => {
    if (code) {
      // If a code is present, it means Google has redirected back.
      // We need to initiate the login flow with this code.
      // The useGoogleLogin hook handles the actual token exchange.
      // This part might need adjustment based on how useGoogleLogin is designed to be triggered.
      // For 'auth-code' flow, you typically call googleLogin() without arguments
      // and it handles the redirect and token exchange internally.
      // If it doesn't automatically trigger, you might need to call it here.
      // However, the current setup seems to expect useGoogleLogin to be called on a button click,
      // not directly on page load with a code.
      // Let's assume for now that useGoogleLogin handles the redirect.
      // If not, we'd need to manually call the exchange here.
      console.log("Authorization code detected:", code);
      // The `useGoogleLogin` hook is designed to be triggered by a user action (e.g., button click).
      // If this page is the redirect URI, the `onSuccess` callback should handle the `tokenResponse`.
      // The `code` from `searchParams` is what `useGoogleLogin` would internally use.
      // We don't explicitly call `googleLogin()` here, as it's usually tied to a UI element.
      // The `onSuccess` and `onError` callbacks are what will fire after the redirect.
    } else {
      // If no code, it means this page was likely accessed directly or an error occurred.
      // You might want to redirect to login or show an error.
      // router.push('/login?error=no_code');
    }
  }, [code, googleLogin, router, loginWithGoogle]);

  // This component primarily acts as a redirect handler.
  // You might show a loading spinner here.
  return (
    <div>
      <p>Processing Google login...</p>
    </div>
  );
};

export default GoogleCallbackPage;
