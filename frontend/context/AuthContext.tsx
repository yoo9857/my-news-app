'use client';

import { useContext } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

// This custom hook will now simply provide the session data from NextAuth.js
export const useAuth = () => {
  const session = useSession();
  
  // You can still provide convenience functions if needed, but they will directly use signIn/signOut
  const login = (provider?: string) => signIn(provider);
  const logout = () => signOut();

  return {
    user: session.data?.user || null,
    isLoading: session.status === 'loading',
    login,
    logout,
    // loginWithGoogle is no longer needed as signIn('google') handles it
    // You can access session.data, session.status directly from useSession() if preferred
    sessionData: session.data,
    sessionStatus: session.status,
  };
};